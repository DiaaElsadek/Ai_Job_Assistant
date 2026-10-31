import { describe, it, expect } from 'vitest'
import { generateCVMatchAnalysis } from '@/src/lib/ai/cv-matcher'

describe('CV-to-Job Match Engine (F2)', () => {
  it('calculates ATS match score and detects matched vs missing skills via fallback heuristic', async () => {
    const cvText = `
Experienced Senior Frontend Developer with 5 years building complex applications with React, Next.js, TypeScript, and Tailwind CSS.
    `
    const result = await generateCVMatchAnalysis({
      cvText,
      jobTitle: 'Senior Frontend Engineer',
      jobDescription: 'Seeking expert in React, Next.js, TypeScript, GraphQL, and Docker.',
      requiredTechnologies: ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Docker'],
    })

    expect(result.matchScore).toBeGreaterThanOrEqual(50)
    expect(result.matchScore).toBeLessThanOrEqual(100)
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['React', 'Next.js', 'TypeScript']))
    expect(result.missingSkills).toEqual(expect.arrayContaining(['GraphQL', 'Docker']))
    expect(result.tailoredBullets.length).toBeGreaterThanOrEqual(3)
  })
})

