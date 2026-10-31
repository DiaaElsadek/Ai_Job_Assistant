import { describe, it, expect } from 'vitest'
import { MockAgent } from 'undici'
import {
  isPrivateIp,
  validateUrlForSSRF,
  safeFetch,
  SSRFProtectionError,
} from '@/src/lib/security/safe-fetch'

describe('SSRF Defense Engine (M0A Milestone)', () => {
  describe('isPrivateIp — Complete IPv4, IPv6, Mapped, and NAT64 Coverage', () => {
    it('detects IPv4 loopback (127.0.0.0/8)', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true)
      expect(isPrivateIp('127.255.255.255')).toBe(true)
      expect(isPrivateIp('127.10.20.30')).toBe(true)
    })

    it('detects IPv4 RFC 1918 private subnets (10/8, 172.16/12, 192.168/16)', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true)
      expect(isPrivateIp('10.255.255.255')).toBe(true)
      expect(isPrivateIp('172.16.0.1')).toBe(true)
      expect(isPrivateIp('172.31.255.255')).toBe(true)
      expect(isPrivateIp('192.168.0.1')).toBe(true)
      expect(isPrivateIp('192.168.1.100')).toBe(true)
      expect(isPrivateIp('172.32.0.1')).toBe(false) // Boundary check: public
    })

    it('detects cloud metadata and link-local ranges (169.254.0.0/16)', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true)
      expect(isPrivateIp('169.254.1.1')).toBe(true)
    })

    it('detects Carrier-Grade NAT (100.64.0.0/10) and 0.0.0.0/8', () => {
      expect(isPrivateIp('100.64.0.1')).toBe(true)
      expect(isPrivateIp('100.127.255.255')).toBe(true)
      expect(isPrivateIp('0.0.0.0')).toBe(true)
    })

    it('detects IPv6 loopback (::1) and unspecified (::)', () => {
      expect(isPrivateIp('::1')).toBe(true)
      expect(isPrivateIp('::')).toBe(true)
    })

    it('detects IPv6 Link-Local (fe80::/10) and Unique Local Address ULA (fc00::/7)', () => {
      expect(isPrivateIp('fe80::1')).toBe(true)
      expect(isPrivateIp('fe80::200:5aee:feaa:20a2')).toBe(true)
      expect(isPrivateIp('fc00::1')).toBe(true)
      expect(isPrivateIp('fd12:3456:789a::1')).toBe(true)
    })

    it('detects IPv4-mapped IPv6 in standard and hex notations', () => {
      expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true)
      expect(isPrivateIp('::ffff:10.0.0.1')).toBe(true)
      expect(isPrivateIp('::ffff:169.254.169.254')).toBe(true)
      expect(isPrivateIp('::ffff:7f00:1')).toBe(true)
      expect(isPrivateIp('::ffff:a00:1')).toBe(true)
      expect(isPrivateIp('::ffff:a9fe:a9fe')).toBe(true)

      expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false)
      expect(isPrivateIp('::ffff:808:808')).toBe(false)
    })

    it('detects NAT64 Well-Known Prefix (64:ff9b::/96) with private IPv4 payload', () => {
      expect(isPrivateIp('64:ff9b::127.0.0.1')).toBe(true)
      expect(isPrivateIp('64:ff9b::7f00:1')).toBe(true)
      expect(isPrivateIp('64:ff9b::169.254.169.254')).toBe(true)
      expect(isPrivateIp('64:ff9b::a9fe:a9fe')).toBe(true)
      expect(isPrivateIp('64:ff9b::10.0.0.1')).toBe(true)

      expect(isPrivateIp('64:ff9b::8.8.8.8')).toBe(false)
    })

    it('allows legitimate public IPv4 and IPv6 addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false)
      expect(isPrivateIp('1.1.1.1')).toBe(false)
      expect(isPrivateIp('142.250.180.206')).toBe(false)
      expect(isPrivateIp('2607:f8b0:4005:805::200e')).toBe(false)
    })
  })

  describe('validateUrlForSSRF — URL & Protocol Validation', () => {
    it('rejects forbidden protocols (file:, ftp:, gopher:)', async () => {
      const res1 = await validateUrlForSSRF('ftp://example.com/file')
      expect(res1.valid).toBe(false)
      expect(res1.reason).toContain('Forbidden protocol')

      const res2 = await validateUrlForSSRF('file:///etc/passwd')
      expect(res2.valid).toBe(false)
    })

    it('rejects localhost and internal hostname formats', async () => {
      const res1 = await validateUrlForSSRF('http://localhost:3000')
      expect(res1.valid).toBe(false)

      const res2 = await validateUrlForSSRF('http://db.internal:5432')
      expect(res2.valid).toBe(false)

      const res3 = await validateUrlForSSRF('http://service.local/status')
      expect(res3.valid).toBe(false)
    })

    it('rejects literal private IPs in URLs', async () => {
      const res1 = await validateUrlForSSRF('http://127.0.0.1:8080')
      expect(res1.valid).toBe(false)

      const res2 = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/')
      expect(res2.valid).toBe(false)
    })

    it('approves legitimate public HTTPS endpoints', async () => {
      const res = await validateUrlForSSRF(
        'https://boards-api.greenhouse.io/v1/boards/careem/jobs',
        async () => ['104.18.26.120']
      )
      expect(res.valid).toBe(true)
      expect(res.resolvedIp).toBe('104.18.26.120')
    })
  })

  describe('safeFetch — Advanced Defenses with Mocked Dispatcher', () => {
    it('blocks immediate SSRF targets without outbound network calls', async () => {
      await expect(safeFetch('http://127.0.0.1:9999/secret')).rejects.toThrow(SSRFProtectionError)
      await expect(safeFetch('http://169.254.169.254/meta-data')).rejects.toThrow(SSRFProtectionError)
      await expect(safeFetch('http://localhost:3000')).rejects.toThrow(SSRFProtectionError)
    })

    it('prevents DNS Rebinding (TOCTOU) via connection-time IP verification', async () => {
      let lookupCount = 0
      const rebindingResolver = async () => {
        lookupCount++
        if (lookupCount === 1) {
          return ['93.184.216.34'] // Initial check: public IP
        }
        return ['127.0.0.1'] // Connection time: switches to loopback
      }

      await expect(
        safeFetch('http://rebinding-attacker.com/test', {
          customResolver: rebindingResolver,
        })
      ).rejects.toThrow(SSRFProtectionError)
    })

    it('enforces streamed body byte limit and aborts oversized responses', async () => {
      const mockAgent = new MockAgent()
      mockAgent.disableNetConnect()

      const client = mockAgent.get('https://example-careers.com')
      client
        .intercept({ path: '/large-job', method: 'GET' })
        .reply(200, 'X'.repeat(500), {
          headers: { 'content-type': 'text/html' },
        })

      await expect(
        safeFetch('https://example-careers.com/large-job', {
          maxBytes: 200,
          dispatcher: mockAgent,
          customResolver: async () => ['93.184.216.34'],
        })
      ).rejects.toThrow(/Payload exceeded limit/)
    })

    it('enforces content-type allowlist and rejects prohibited binary types', async () => {
      const mockAgent = new MockAgent()
      mockAgent.disableNetConnect()

      const client = mockAgent.get('https://example-careers.com')
      client
        .intercept({ path: '/binary-download', method: 'GET' })
        .reply(200, 'fake-binary-content', {
          headers: { 'content-type': 'application/octet-stream' },
        })

      await expect(
        safeFetch('https://example-careers.com/binary-download', {
          dispatcher: mockAgent,
          customResolver: async () => ['93.184.216.34'],
        })
      ).rejects.toThrow(/Prohibited Content-Type: 'application\/octet-stream'/)
    })

    it('blocks redirect-to-private attacks', async () => {
      const mockAgent = new MockAgent()
      mockAgent.disableNetConnect()

      const client = mockAgent.get('https://example-careers.com')
      client
        .intercept({ path: '/redirect-attack', method: 'GET' })
        .reply(302, '', {
          headers: { location: 'http://169.254.169.254/latest/meta-data' },
        })

      await expect(
        safeFetch('https://example-careers.com/redirect-attack', {
          dispatcher: mockAgent,
          customResolver: async (host) => {
            if (host === 'example-careers.com') return ['93.184.216.34']
            return ['169.254.169.254']
          },
        })
      ).rejects.toThrow(/Redirect destination blocked/)
    })

    it('enforces maximum redirect limit', async () => {
      const mockAgent = new MockAgent()
      mockAgent.disableNetConnect()

      const client = mockAgent.get('https://example-careers.com')
      client
        .intercept({ path: '/loop-1', method: 'GET' })
        .reply(302, '', { headers: { location: 'https://example-careers.com/loop-2' } })
      client
        .intercept({ path: '/loop-2', method: 'GET' })
        .reply(302, '', { headers: { location: 'https://example-careers.com/loop-3' } })

      await expect(
        safeFetch('https://example-careers.com/loop-1', {
          maxRedirects: 1,
          dispatcher: mockAgent,
          customResolver: async () => ['93.184.216.34'],
        })
      ).rejects.toThrow(/Maximum redirect limit \(1\) exceeded/)
    })

    it('successfully fetches valid public responses and provides standard Response interface', async () => {
      const mockAgent = new MockAgent()
      mockAgent.disableNetConnect()

      const client = mockAgent.get('https://example-careers.com')
      client
        .intercept({ path: '/jobs/react-lead', method: 'GET' })
        .reply(200, '<h1>Senior React Engineer</h1>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })

      const res = await safeFetch('https://example-careers.com/jobs/react-lead', {
        dispatcher: mockAgent,
        customResolver: async () => ['93.184.216.34'],
      })

      expect(res.ok).toBe(true)
      expect(res.status).toBe(200)
      expect(res.resolvedIp).toBe('93.184.216.34')
      const text = await res.text()
      expect(text).toContain('Senior React Engineer')
    })
  })
})
