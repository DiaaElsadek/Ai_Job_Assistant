import { describe, it, expect } from 'vitest'
import { parseJobPostingText } from '@/src/lib/ai/job-parser'

describe('Job Posting Parser (F1)', () => {
  it('extracts structured information from raw job posting text via fallback heuristic', async () => {
    const rawJob = `
Senior Frontend Engineer (React / Next.js)
Instabug
Cairo, Egypt (Hybrid)
We are looking for a Senior React and Next.js developer with TypeScript, Tailwind CSS, and Docker experience.
Salary: 60,000 - 85,000 EGP per month.
    `

    const parsed = await parseJobPostingText(rawJob)

    expect(parsed.title).toContain('Frontend')
    expect(parsed.companyName).toBe('Instabug')
    expect(parsed.workArrangement).toBe('HYBRID')
    expect(parsed.experienceLevel).toBe('SENIOR')
    expect(parsed.requiredTechnologies).toEqual(
      expect.arrayContaining(['React', 'Next.js', 'TypeScript', 'Tailwind', 'Docker'])
    )
    expect(parsed.location).toBe('Cairo, Egypt')
  })

  it('safely handles short and noisy input without throwing', async () => {
    const noisyText = 'Hiring Next.js dev. Contact me.'
    const parsed = await parseJobPostingText(noisyText)

    expect(parsed).toBeDefined()
    expect(parsed.title).toBeDefined()
    expect(parsed.workArrangement).toBeDefined()
  })
})

