import { describe, it, expect } from 'vitest'
import { companySchema, loginSchema } from '@/src/lib/validations'
import { formatEnumLabel, getStatusVariant } from '@/src/components/ui/badge'

describe('companySchema validation', () => {
  it('validates a complete valid company object', () => {
    const input = {
      name: 'Instabug',
      website: 'https://instabug.com',
      careersUrl: 'https://instabug.com/careers',
      location: 'Smart Village, Cairo',
      industry: 'Software Quality & Observability',
      technologies: ['React', 'Next.js', 'TypeScript'],
      priority: 'HIGH' as const,
      hiringNotes: 'Hiring React developers actively',
      notes: 'Strong Egyptian tech brand',
    }

    const result = companySchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Instabug')
      expect(result.data.priority).toBe('HIGH')
      expect(result.data.technologies).toHaveLength(3)
    }
  })

  it('fails when company name is empty', () => {
    const input = {
      name: '',
      priority: 'MEDIUM' as const,
    }

    const result = companySchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues?.[0]?.message ?? (result.error as unknown as { errors: Array<{ message: string }> }).errors?.[0]?.message
      expect(msg).toContain('required')
    }
  })

  it('defaults priority to MEDIUM when omitted', () => {
    const input = {
      name: 'Valu',
    }

    const result = companySchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM')
      expect(result.data.technologies).toEqual([])
    }
  })

  it('fails when website is not a valid URL', () => {
    const input = {
      name: 'Test Corp',
      website: 'not-a-valid-url',
    }

    const result = companySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('allows empty string for optional URLs', () => {
    const input = {
      name: 'Local Startup',
      website: '',
      careersUrl: '',
    }

    const result = companySchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe('loginSchema validation', () => {
  it('validates valid credentials', () => {
    const input = {
      email: 'owner@example.com',
      password: 'secretpassword',
    }

    const result = loginSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('fails on invalid email format', () => {
    const input = {
      email: 'notanemail',
      password: 'password123',
    }

    const result = loginSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('fails when password is missing or empty', () => {
    const input = {
      email: 'owner@example.com',
      password: '',
    }

    const result = loginSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('badge and enum formatting helpers', () => {
  it('formats enum labels to Title Case readable strings', () => {
    expect(formatEnumLabel('MID_LEVEL')).toBe('Mid-level')
    expect(formatEnumLabel('ON_SITE')).toBe('On-site')
    expect(formatEnumLabel('TO_RESEARCH')).toBe('To Research')
    expect(formatEnumLabel('READY_FOR_OUTREACH')).toBe('Ready For Outreach')
    expect(formatEnumLabel('URGENT')).toBe('Urgent')
  })

  it('maps statuses and priorities to appropriate badge variants', () => {
    expect(getStatusVariant('URGENT')).toBe('error')
    expect(getStatusVariant('HIGH')).toBe('warning')
    expect(getStatusVariant('MEDIUM')).toBe('default')
    expect(getStatusVariant('LOW')).toBe('muted')
    expect(getStatusVariant('OFFER')).toBe('success')
    expect(getStatusVariant('REJECTED')).toBe('error')
    expect(getStatusVariant('CONNECTED')).toBe('success')
  })
})
