export interface CVMatchResult {
  matchScore: number // 0-100
  matchedSkills: string[]
  missingSkills: string[]
  tailoredBullets: string[]
  coverLetterDraft?: string | null
}

export interface AnalyzeMatchInput {
  cvText: string
  jobTitle: string
  jobDescription?: string | null
  requiredTechnologies?: string[]
}

export async function generateCVMatchAnalysis(
  input: AnalyzeMatchInput
): Promise<CVMatchResult> {
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '').trim()
  const model = process.env.AI_MODEL || 'gemini-flash-latest'

  const jobDesc = (input.jobDescription || '').slice(0, 5000)
  const cvText = (input.cvText || '').slice(0, 5000)
  const reqTech = input.requiredTechnologies || ['React', 'Next.js', 'TypeScript']

  if (apiKey && apiKey.length > 10 && cvText.length > 20) {
    try {
      const prompt = `You are an expert Senior Technical Recruiter and ATS Optimization Engine.
Analyze the candidate's CV against the job posting requirements.

Job Title: ${input.jobTitle}
Required Technologies: ${reqTech.join(', ')}

Job Description:
<job_description>
${jobDesc || 'Frontend Engineer focusing on React, Next.js, TypeScript and modern web applications.'}
</job_description>

Candidate CV Profile:
<candidate_cv>
${cvText}
</candidate_cv>

Evaluate the match and return ONLY a valid JSON object matching this exact schema:
{
  "matchScore": number (Integer from 0 to 100 representing overall ATS and skill match),
  "matchedSkills": ["string array of skills from the job description present in the CV"],
  "missingSkills": ["string array of requirements from the job description missing or weak in the CV"],
  "tailoredBullets": [
    "3 high-impact resume achievement bullets in STAR format (Situation, Task, Action, Result) highlighting the candidate's real experience tailored to this exact role"
  ],
  "coverLetterDraft": "A concise 2-paragraph tailored cover letter pitch for this job."
}

Rules:
1. Return raw JSON ONLY without markdown backticks or commentary.
2. Be objective in scoring. If skills strongly overlap, score 75-95. If significant gaps, score 40-70.
3. Tailor bullets to highlight quantifiable impact (e.g. latency, conversion, bundle size, clean code).`

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
              temperature: 0.2,
              maxOutputTokens: 1200,
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          const parsed = JSON.parse(text) as CVMatchResult
          return {
            matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore || 70))),
            matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : reqTech,
            missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
            tailoredBullets: Array.isArray(parsed.tailoredBullets) && parsed.tailoredBullets.length > 0
              ? parsed.tailoredBullets
              : generateFallbackBullets(input.jobTitle),
            coverLetterDraft: parsed.coverLetterDraft,
          }
        }
      } else {
        const err = await res.text()
        console.warn('Gemini CV Matcher API error:', err.slice(0, 200))
      }
    } catch (err) {
      console.warn('Gemini CV Matcher failed, using heuristic match engine:', err)
    }
  }

  // Fallback heuristic scoring
  return heuristicMatch(input)
}

function heuristicMatch(input: AnalyzeMatchInput): CVMatchResult {
  const cvLower = (input.cvText || '').toLowerCase()
  const reqTech = input.requiredTechnologies || ['React', 'Next.js', 'TypeScript', 'Tailwind']

  const matched: string[] = []
  const missing: string[] = []

  for (const tech of reqTech) {
    if (cvLower.includes(tech.toLowerCase())) {
      matched.push(tech)
    } else {
      missing.push(tech)
    }
  }

  const matchRatio = reqTech.length > 0 ? matched.length / reqTech.length : 0.75
  const baseScore = Math.round(55 + matchRatio * 40)
  const matchScore = Math.min(95, Math.max(45, baseScore))

  return {
    matchScore,
    matchedSkills: matched.length > 0 ? matched : ['React', 'JavaScript'],
    missingSkills: missing,
    tailoredBullets: generateFallbackBullets(input.jobTitle),
    coverLetterDraft: `I am writing to express my strong enthusiasm for the ${input.jobTitle} position. With my focused experience building high-performance frontend applications with React and Next.js, I am confident in delivering immediate impact to your team.`,
  }
}

function generateFallbackBullets(title: string): string[] {
  return [
    `Architected responsive user interfaces using Next.js App Router and React 19, improving page load velocity and Core Web Vitals by 35%.`,
    `Engineered type-safe state management workflows with TypeScript and Tailwind CSS, standardizing reusable UI components across distributed teams.`,
    `Optimized client-server data synchronization utilizing Server Actions and caching boundaries, reducing unnecessary network payloads by 40%.`,
  ]
}
