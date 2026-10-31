import dns from 'node:dns/promises'
import net from 'node:net'
import { Agent, request, type Dispatcher } from 'undici'

export class SSRFProtectionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'SSRF_DETECTED'
      | 'INVALID_PROTOCOL'
      | 'FORBIDDEN_HOSTNAME'
      | 'DNS_RESOLUTION_FAILED'
      | 'TIMEOUT'
      | 'PAYLOAD_TOO_LARGE'
      | 'MAX_REDIRECTS_EXCEEDED'
      | 'UNSUPPORTED_CONTENT_TYPE' = 'SSRF_DETECTED'
  ) {
    super(message)
    this.name = 'SSRFProtectionError'
  }
}

export interface SafeFetchOptions {
  method?: 'GET' | 'POST' | 'HEAD'
  headers?: Record<string, string>
  body?: string | Buffer
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
  allowedMimeTypes?: string[]
  /**
   * Optional custom DNS resolver injected for testing DNS rebinding and edge cases.
   */
  customResolver?: (hostname: string) => Promise<string[]>
  /**
   * Optional custom dispatcher (e.g. MockAgent in tests).
   */
  dispatcher?: Dispatcher
}

export interface SafeFetchResponse extends Response {
  readonly resolvedIp: string
  readonly finalUrl: string
}

export const DEFAULT_ALLOWED_MIME_TYPES = [
  'text/html',
  'text/plain',
  'application/json',
  'text/json',
  'application/xml',
  'text/xml',
  'application/atom+xml',
  'application/rss+xml',
  'application/xhtml+xml',
]

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 JobFlowAI/1.0'

/**
 * Parses an IPv6 string into 8 16-bit numeric words.
 * Handles standard notation, double colon (::) expansion, and embedded IPv4 dotted notation.
 */
function parseIPv6ToWords(ip: string): number[] | null {
  try {
    let s = ip.toLowerCase().trim()
    let ipv4Words: number[] = []

    // Check for trailing embedded dotted IPv4 (e.g. ::ffff:127.0.0.1 or 64:ff9b::192.168.1.1)
    const lastColon = s.lastIndexOf(':')
    if (lastColon !== -1 && s.slice(lastColon + 1).includes('.')) {
      const v4Str = s.slice(lastColon + 1)
      if (s.slice(0, lastColon + 1).endsWith('::')) {
        s = s.slice(0, lastColon + 1)
      } else {
        s = s.slice(0, lastColon)
      }
      const v4Parts = v4Str.split('.').map((p) => Number.parseInt(p, 10))
      if (v4Parts.length !== 4 || v4Parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
        return null
      }
      ipv4Words = [(v4Parts[0] << 8) | v4Parts[1], (v4Parts[2] << 8) | v4Parts[3]]
    }

    const doubleColonParts = s.split('::')
    if (doubleColonParts.length > 2) {
      return null // Multiple :: is invalid
    }

    let leftWords: number[] = []
    let rightWords: number[] = []

    if (doubleColonParts[0]) {
      leftWords = doubleColonParts[0]
        .split(':')
        .filter(Boolean)
        .map((hex) => Number.parseInt(hex, 16))
    }

    if (doubleColonParts.length === 2 && doubleColonParts[1]) {
      rightWords = doubleColonParts[1]
        .split(':')
        .filter(Boolean)
        .map((hex) => Number.parseInt(hex, 16))
    }

    const providedCount = leftWords.length + rightWords.length + ipv4Words.length
    if (doubleColonParts.length === 1 && providedCount !== 8) {
      return null
    }

    const zerosNeeded = 8 - providedCount
    if (zerosNeeded < 0) return null

    const zeros = Array(zerosNeeded).fill(0)
    const words = [...leftWords, ...zeros, ...rightWords, ...ipv4Words]

    if (words.length !== 8 || words.some((w) => Number.isNaN(w) || w < 0 || w > 0xffff)) {
      return null
    }

    return words
  } catch {
    return null
  }
}

/**
 * Checks whether an IPv4 or IPv6 address is in a private, loopback, link-local,
 * cloud metadata, NAT64, or reserved range.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true

  const trimmed = ip.trim()

  // 1. IPv4 Inspection
  if (net.isIPv4(trimmed)) {
    const parts = trimmed.split('.').map((p) => Number.parseInt(p, 10))
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
      return true
    }

    const [a, b] = parts

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true

    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true

    // 172.16.0.0/12 (RFC 1918 Private: 172.16.0.0 to 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true

    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true

    // 169.254.0.0/16 (Link-Local & Cloud Metadata AWS/GCP/Azure/DO: 169.254.169.254)
    if (a === 169 && b === 254) return true

    // 100.64.0.0/10 (Carrier-Grade NAT: 100.64.0.0 to 100.127.255.255)
    if (a === 100 && b >= 64 && b <= 127) return true

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && parts[2] === 0) return true

    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Test-Net documentation)
    if (a === 192 && b === 0 && parts[2] === 2) return true
    if (a === 198 && b === 51 && parts[2] === 100) return true
    if (a === 203 && b === 0 && parts[2] === 113) return true

    // 198.18.0.0/15 (Network Benchmark)
    if (a === 198 && b >= 18 && b <= 19) return true

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
    if (a >= 224) return true

    return false
  }

  // 2. IPv6 Inspection
  if (net.isIPv6(trimmed)) {
    const words = parseIPv6ToWords(trimmed)
    if (!words) return true // Reject malformed IPv6

    const [w0, w1, w2, w3, w4, w5, w6, w7] = words

    // :: (Unspecified)
    if (words.every((w) => w === 0)) return true

    // ::1 (Loopback)
    if (w0 === 0 && w1 === 0 && w2 === 0 && w3 === 0 && w4 === 0 && w5 === 0 && w6 === 0 && w7 === 1) {
      return true
    }

    // IPv4-mapped IPv6: ::ffff:a.b.c.d (standard) or ::ffff:w6:w7 (hex notation)
    // E.g. ::ffff:127.0.0.1 or ::ffff:7f00:1 or ::ffff:169.254.169.254
    if (w0 === 0 && w1 === 0 && w2 === 0 && w3 === 0 && w4 === 0 && w5 === 0xffff) {
      const embeddedIpv4 = `${(w6 >> 8) & 0xff}.${w6 & 0xff}.${(w7 >> 8) & 0xff}.${w7 & 0xff}`
      return isPrivateIp(embeddedIpv4)
    }

    // IPv4-compatible IPv6 (deprecated): ::a.b.c.d
    if (w0 === 0 && w1 === 0 && w2 === 0 && w3 === 0 && w4 === 0 && w5 === 0) {
      const embeddedIpv4 = `${(w6 >> 8) & 0xff}.${w6 & 0xff}.${(w7 >> 8) & 0xff}.${w7 & 0xff}`
      return isPrivateIp(embeddedIpv4)
    }

    // NAT64 Well-Known Prefix (RFC 6052): 64:ff9b::/96
    // E.g. 64:ff9b::127.0.0.1 or 64:ff9b::7f00:1
    if (w0 === 0x0064 && w1 === 0xff9b && w2 === 0 && w3 === 0 && w4 === 0 && w5 === 0) {
      const embeddedIpv4 = `${(w6 >> 8) & 0xff}.${w6 & 0xff}.${(w7 >> 8) & 0xff}.${w7 & 0xff}`
      return isPrivateIp(embeddedIpv4)
    }

    // Unique Local Address (ULA) fc00::/7 (fc00:: to fdff::)
    if ((w0 & 0xfe00) === 0xfc00) return true

    // Link-Local Unicast fe80::/10 (fe80:: to febf::)
    if ((w0 & 0xffc0) === 0xfe80) return true

    // Multicast ff00::/8
    if ((w0 & 0xff00) === 0xff00) return true

    // Documentation 2001:db8::/32
    if (w0 === 0x2001 && w1 === 0x0db8) return true

    // Discard prefix 100::/64
    if (w0 === 0x0100 && w1 === 0 && w2 === 0 && w3 === 0) return true

    return false
  }

  // Not a valid IP string -> reject
  return true
}

/**
 * Validates a target URL against SSRF policy rules.
 */
export async function validateUrlForSSRF(
  urlString: string,
  customResolver?: (hostname: string) => Promise<string[]>
): Promise<{
  valid: boolean
  reason?: string
  resolvedIp?: string
}> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason: `Forbidden protocol: ${parsed.protocol}. Only http: and https: are allowed.`,
    }
  }

  const hostname = parsed.hostname.toLowerCase()

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan')
  ) {
    return { valid: false, reason: `Forbidden internal hostname: ${hostname}` }
  }

  // If host is an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, reason: `Forbidden private IP address: ${hostname}`, resolvedIp: hostname }
    }
    return { valid: true, resolvedIp: hostname }
  }

  // Resolve hostname via DNS (or injected test resolver)
  try {
    const addresses = customResolver
      ? await customResolver(hostname)
      : (await dns.lookup(hostname, { all: true })).map((r) => r.address)

    if (!addresses || addresses.length === 0) {
      return { valid: false, reason: `DNS lookup returned no records for ${hostname}` }
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return {
          valid: false,
          reason: `Hostname ${hostname} resolves to prohibited private IP: ${addr}`,
          resolvedIp: addr,
        }
      }
    }

    return { valid: true, resolvedIp: addresses[0] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { valid: false, reason: `DNS resolution error: ${msg}` }
  }
}

/**
 * Executes a secure HTTP request with DNS pinning, streamed body size enforcement,
 * content-type validation, and redirect re-validation.
 */
export async function safeFetch(
  urlString: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 6000,
    maxBytes = 5 * 1024 * 1024, // 5MB default cap
    maxRedirects = 3,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    customResolver,
  } = options

  let currentUrl = urlString
  let redirectsRemaining = maxRedirects
  const allowedSet = new Set(allowedMimeTypes.map((m) => m.toLowerCase().trim()))

  while (true) {
    // 1. Initial URL validation & pre-resolution
    const validation = await validateUrlForSSRF(currentUrl, customResolver)
    if (!validation.valid || !validation.resolvedIp) {
      throw new SSRFProtectionError(
        validation.reason || 'Blocked by SSRF protection policy',
        validation.reason?.includes('protocol') ? 'INVALID_PROTOCOL' : 'SSRF_DETECTED'
      )
    }

    const pinnedIp = validation.resolvedIp

    // 2. Configure undici Agent with DNS pinning to eliminate DNS rebinding (TOCTOU).
    // The connector lookup hook guarantees the TCP socket connects strictly to the pre-validated IP.
    const ownAgent = !options.dispatcher
      ? new Agent({
          connect: {
            timeout: timeoutMs,
            lookup: (lookupHost, lookupOpts, callback) => {
              if (customResolver) {
                customResolver(lookupHost)
                  .then((ips) => {
                    const target = ips[0]
                    if (!target || isPrivateIp(target)) {
                      callback(
                        new SSRFProtectionError(
                          `DNS rebinding blocked: ${lookupHost} resolved to ${target}`,
                          'SSRF_DETECTED'
                        ),
                        target || '127.0.0.1',
                        4
                      )
                      return
                    }
                    const family = net.isIPv6(target) ? 6 : 4
                    callback(null, target, family)
                  })
                  .catch((err) => callback(err, '127.0.0.1', 4))
                return
              }

              const family = net.isIPv6(pinnedIp) ? 6 : 4
              callback(null, pinnedIp, family)
            },
          },
        })
      : undefined

    const dispatcher = options.dispatcher || ownAgent

    const requestHeaders: Record<string, string> = {
      'User-Agent': DEFAULT_USER_AGENT,
      ...headers,
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, timeoutMs)

    let undiciResponse: Awaited<ReturnType<typeof request>>

    try {
      undiciResponse = await request(currentUrl, {
        method,
        headers: requestHeaders,
        body,
        dispatcher,
        signal: controller.signal,
      })
    } catch (err: unknown) {
      clearTimeout(timer)
      if (ownAgent) await ownAgent.close()
      if (err instanceof SSRFProtectionError) {
        throw err
      }
      if (err instanceof Error && (err.name === 'AbortError' || err.message.toLowerCase().includes('timeout'))) {
        throw new SSRFProtectionError(`Request timed out after ${timeoutMs}ms`, 'TIMEOUT')
      }
      throw err
    }

    // 3. Handle HTTP Redirects
    const statusCode = undiciResponse.statusCode
    if (statusCode >= 300 && statusCode < 400 && undiciResponse.headers.location) {
      clearTimeout(timer)
      undiciResponse.body.destroy()
      if (ownAgent) await ownAgent.close()

      if (redirectsRemaining <= 0) {
        throw new SSRFProtectionError(
          `Maximum redirect limit (${maxRedirects}) exceeded`,
          'MAX_REDIRECTS_EXCEEDED'
        )
      }

      const rawLocation = Array.isArray(undiciResponse.headers.location)
        ? undiciResponse.headers.location[0]
        : undiciResponse.headers.location

      const nextUrl = new URL(rawLocation, currentUrl).toString()

      // Re-validate target redirect destination
      const redirectValidation = await validateUrlForSSRF(nextUrl, customResolver)
      if (!redirectValidation.valid) {
        throw new SSRFProtectionError(
          `Redirect destination blocked: ${redirectValidation.reason}`,
          'SSRF_DETECTED'
        )
      }

      redirectsRemaining--
      currentUrl = nextUrl
      continue
    }

    // 4. Validate Content-Type
    const rawContentType = undiciResponse.headers['content-type']
    const contentType = Array.isArray(rawContentType) ? rawContentType[0] : rawContentType || ''
    const mime = contentType.split(';')[0].trim().toLowerCase()

    if (mime && allowedSet.size > 0 && !allowedSet.has(mime)) {
      clearTimeout(timer)
      undiciResponse.body.destroy()
      if (ownAgent) await ownAgent.close()
      throw new SSRFProtectionError(
        `Prohibited Content-Type: '${mime}'. Permitted types: ${Array.from(allowedSet).join(', ')}`,
        'UNSUPPORTED_CONTENT_TYPE'
      )
    }

    // 5. Stream body with byte cap enforcement
    const chunks: Buffer[] = []
    let totalBytes = 0

    try {
      for await (const chunk of undiciResponse.body) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalBytes += buffer.length
        if (totalBytes > maxBytes) {
          undiciResponse.body.destroy()
          throw new SSRFProtectionError(
            `Payload exceeded limit of ${maxBytes} bytes (received >${totalBytes} bytes)`,
            'PAYLOAD_TOO_LARGE'
          )
        }
        chunks.push(buffer)
      }
    } finally {
      clearTimeout(timer)
      if (ownAgent) await ownAgent.close()
    }

    const fullBuffer = Buffer.concat(chunks)
    const bodyText = fullBuffer.toString('utf-8')

    // 6. Build Standard Web Response
    const responseHeaders = new Headers()
    for (const [key, val] of Object.entries(undiciResponse.headers)) {
      if (val !== undefined) {
        if (Array.isArray(val)) {
          for (const item of val) responseHeaders.append(key, item)
        } else {
          responseHeaders.set(key, String(val))
        }
      }
    }

    const webResponse = new Response(bodyText, {
      status: statusCode,
      headers: responseHeaders,
    }) as SafeFetchResponse

    Object.defineProperty(webResponse, 'resolvedIp', {
      value: pinnedIp,
      writable: false,
    })
    Object.defineProperty(webResponse, 'finalUrl', {
      value: currentUrl,
      writable: false,
    })

    return webResponse
  }
}
