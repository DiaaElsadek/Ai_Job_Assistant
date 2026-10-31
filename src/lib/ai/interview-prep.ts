export interface InterviewQuestion {
  question: string
  category: 'TECHNICAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL'
  suggestedFocus: string
}

export interface GenerateInterviewQuestionsInput {
  jobTitle: string
  technologies: string[]
  companyName?: string
  description?: string | null
}

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<InterviewQuestion[]> {
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '').trim()
  const model = process.env.AI_MODEL || 'gemini-flash-latest'

  const techList = input.technologies.length > 0 ? input.technologies.join(', ') : 'React, Next.js, TypeScript'
  const company = input.companyName || 'the hiring company'

  if (apiKey && apiKey.length > 10) {
    try {
      const prompt = `You are a Principal Engineering Interviewer and Staff Frontend Engineer.
Generate 6 realistic, challenging interview questions for a candidate interviewing for:
Job Title: ${input.jobTitle}
Company: ${company}
Tech Stack: ${techList}

Return ONLY a valid raw JSON array of objects without markdown backticks:
[
  {
    "question": "string (the interview question)",
    "category": "TECHNICAL" | "SYSTEM_DESIGN" | "BEHAVIORAL",
    "suggestedFocus": "string (1 sentence on what a great answer should demonstrate)"
  }
]

Provide:
- 3 TECHNICAL questions (focusing specifically on ${techList}, rendering performance, state management, or TypeScript architecture).
- 2 SYSTEM_DESIGN questions (frontend architecture, micro-frontends, caching, or scaling).
- 1 BEHAVIORAL question (STAR format, handling ambiguity or cross-functional alignment).`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((q) => ({
              question: String(q.question),
              category: ['TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL'].includes(q.category)
                ? q.category
                : 'TECHNICAL',
              suggestedFocus: String(q.suggestedFocus || ''),
            }))
          }
        }
      }
    } catch (err) {
      console.warn('Gemini interview question generation failed, using fallback bank:', err)
    }
  }

  // Fallback high-quality curated technical questions
  return getFallbackInterviewQuestions(input.jobTitle, techList)
}

function getFallbackInterviewQuestions(title: string, tech: string): InterviewQuestion[] {
  return [
    {
      question: `How does React 19's Server Actions and 'use client' boundary model differ from traditional client-side rendering with SPA data fetching?`,
      category: 'TECHNICAL',
      suggestedFocus: 'Demonstrate deep understanding of server vs client execution environments, serialization boundaries, and bundle size reduction.',
    },
    {
      question: `Walk us through how you would architect a type-safe form workflow in Next.js using Server Actions, Zod validation, and optimistic UI updates.`,
      category: 'TECHNICAL',
      suggestedFocus: 'Highlight error handling, revalidatePath, useActionState or useTransition, and client form state synchronization.',
    },
    {
      question: `How do you identify and resolve unwanted re-renders and memory leaks in large React data dashboards?`,
      category: 'TECHNICAL',
      suggestedFocus: 'Discuss React DevTools Profiler, useMemo/useCallback discipline, and component splitting.',
    },
    {
      question: `Design the client-side architecture for a real-time collaborative workspace supporting offline draft synchronization.`,
      category: 'SYSTEM_DESIGN',
      suggestedFocus: 'Address IndexedDB local caching, conflict resolution, WebSocket vs polling, and resilient retry queues.',
    },
    {
      question: `How would you structure a component design system across multiple frontend repositories for consistent brand design?`,
      category: 'SYSTEM_DESIGN',
      suggestedFocus: 'Talk about Tailwind CSS design tokens, headless primitives (Radix/Tailwind), and automated visual regression testing.',
    },
    {
      question: `Tell me about a time you disagreed with a technical design decision made by a Tech Lead or Product Manager. How did you handle it?`,
      category: 'BEHAVIORAL',
      suggestedFocus: 'Use the STAR format: show humility, evidence-driven benchmarking, constructive communication, and commitment to the team.',
    },
  ]
}

