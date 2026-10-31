import { describe, it, expect } from 'vitest'
import { generateInterviewQuestions } from '@/src/lib/ai/interview-prep'

describe('Interview Prep Engine (F3)', () => {
  it('generates role-specific questions across technical, system design and behavioral categories', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'Senior Frontend Developer',
      technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      companyName: 'Instabug',
    })

    expect(questions.length).toBeGreaterThanOrEqual(4)
    const categories = questions.map((q) => q.category)
    expect(categories).toContain('TECHNICAL')
    expect(categories).toContain('SYSTEM_DESIGN')
    expect(categories).toContain('BEHAVIORAL')

    const first = questions[0]
    expect(first.question.length).toBeGreaterThan(15)
    expect(first.suggestedFocus.length).toBeGreaterThan(10)
  })
})

