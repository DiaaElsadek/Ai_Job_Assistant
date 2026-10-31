import type { MessageGoal, MessageLanguage, MessageTone } from '@prisma/client'

export interface GenerateMessageInput {
  goal: MessageGoal
  language: MessageLanguage
  tone: MessageTone
  contactName?: string
  contactRole?: string
  companyName?: string
  opportunityTitle?: string
  technologies?: string[]
  candidateRole?: string
  sourceFacts?: string
}

export interface GeneratedMessageOutput {
  content: string
  explanation: string
}

export async function generateOutreachMessage(
  input: GenerateMessageInput
): Promise<GeneratedMessageOutput> {
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '').trim()
  const model = process.env.AI_MODEL || 'gemini-flash-latest'

  // If an API key is configured, call Gemini
  if (apiKey && apiKey.length > 10) {
    try {
      const prompt = buildGeminiPrompt(input)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            },
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          return {
            content: text,
            explanation: `Generated with Gemini (${model}) tailored for ${input.language.toLowerCase().replace('_', ' ')} with ${input.tone.toLowerCase().replace('_', ' ')} tone.`,
          }
        }
      } else {
        const errData = await res.text()
        console.warn(`Gemini API error (status ${res.status}):`, errData.slice(0, 200))
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to dynamic template engine:', err)
    }
  }

  // Fallback to culturally-tailored dynamic template engine
  return generateTemplateOutreach(input)
}

function buildGeminiPrompt(input: GenerateMessageInput): string {
  const candidateRole = input.candidateRole || 'React.js / Next.js Frontend Developer'
  const contactName = input.contactName || 'there'
  const companyName = input.companyName || 'your team'
  const targetRole = input.opportunityTitle || 'Frontend Developer'
  const techStack = input.technologies?.length
    ? input.technologies.join(', ')
    : 'React, Next.js, TypeScript, Tailwind CSS'

  return `You are a career networking assistant for a software developer based in Egypt targeting ${candidateRole} roles.
Write a personalized, concise networking message.

Context:
- Recipient Name: ${contactName}
- Recipient Role: ${input.contactRole || 'Team Member'}
- Target Company: ${companyName}
- Target Job: ${targetRole}
- Candidate Tech Stack: ${techStack}
- Message Goal: ${input.goal}
- Preferred Language: ${input.language} (If EGYPTIAN_ARABIC, use natural, professional Egyptian dialect; if ENGLISH, use fluent natural English; if MSA, use Modern Standard Arabic)
- Desired Tone: ${input.tone} (CONCISE_DIRECT = under 75 words, FRIENDLY_PROFESSIONAL = warm and polite, FORMAL = highly respectful)
- Additional facts: ${input.sourceFacts || 'None'}

Rules:
1. Output ONLY the message text without quotes, subject lines, or placeholder brackets.
2. Ensure the message sounds human, humble yet confident, and respectful of the recipient's time.
3. If writing in Arabic, use natural conversational business style without robotic literal translations.`
}

function generateTemplateOutreach(input: GenerateMessageInput): GeneratedMessageOutput {
  const name = input.contactName ? input.contactName.split(' ')[0] : ''
  const company = input.companyName || 'your company'
  const role = input.opportunityTitle || 'Frontend Developer'
  const tech = input.technologies?.slice(0, 3).join(', ') || 'React and Next.js'

  if (input.language === 'EGYPTIAN_ARABIC') {
    if (input.goal === 'ASK_REFERRAL') {
      return {
        content: `مساء الخير يا ${name || 'فندم'}، أتمنى تكون بخير.\n\nأنا بتابع شغلكم في ${company} وشايف التطور الجميل في الفريق التقني. شفت البوزيشن الخاص بـ ${role} ولقيت المتطلبات مناسبة جداً لخبرتي في ${tech}.\n\nلو وقت حضرتك يسمح بإلقاء نظرة سريعة على الـ CV، وأكون شاكر جداً لو ممكن ترشيح أو نصيحة للتقديم. بالتوفيق دايماً.`,
        explanation: 'Tailored Egyptian Arabic referral inquiry focusing on company growth and tech alignment.',
      }
    }

    if (input.goal === 'INITIAL_CONNECTION') {
      return {
        content: `مساء الخير يا ${name || 'فندم'}، يسعدني التواصل والتعلم من خبرتك في ${company}.\n\nأنا مطور برمجيات واجهات أمامية متخصص في ${tech}، وحابب أتابع نشاطكم التقني وتجارب الفريق.\n\nيومك جميل!`,
        explanation: 'Brief, polite Egyptian connection request suitable for LinkedIn 300-char limits.',
      }
    }

    if (input.goal === 'FOLLOW_UP_NO_RESPONSE') {
      return {
        content: `أهلاً يا ${name || 'فندم'}، أتمنى كل شيء يكون بخير.\n\nحبيت أعمل فولو-أب سريع بخصوص رسالتي السابقة وفرصة الـ ${role} في ${company}. مقدر جداً انشغال وقتك، وأكون شاكر لو في أي فرصة للتواصل.\n\nشكراً جزيلاً!`,
        explanation: 'Respectful follow-up note in natural Egyptian dialect.',
      }
    }

    return {
      content: `مساء الخير يا ${name || 'فندم'}، أتمنى تكون بخير.\n\nبتابع شغل ${company} باهتمام، وحابب أسأل عن طبيعة شغل فريق الـ Frontend عندكم وبيئة العمل الخاصة بـ ${tech}.\n\nشكراً لوقتك وأتمنى لك أسبوع موفق!`,
      explanation: 'General inquiry in Egyptian Arabic.',
    }
  }

  if (input.language === 'MSA') {
    return {
      content: `السلام عليكم ورحمة الله، أستاذ ${name || 'الكريم'}،\n\nأتمنى أن تكون بأفضل حال.\n\nأتابع باهتمام مسيرة وتطور ${company}. نظراً لتخصصي في تطوير واجهات المستخدم باستخدام ${tech}، لفت انتباهي شاغر ${role} لديكم.\n\nيسعدني مشاركة سيرتي الذاتية معكم متمنياً الاستفادة من نصيحتكم الكريمة بخصوص الخطوات القادمة.\n\nشاكراً لكم حسن تعاونكم.`,
      explanation: 'Formal Modern Standard Arabic message suited for corporate outreach.',
    }
  }

  // Default: ENGLISH
  if (input.goal === 'ASK_REFERRAL') {
    return {
      content: `Hi ${name || 'there'},\n\nHope you're having a productive week!\n\nI’ve been following ${company}'s work and really admire what the engineering team is building. I noticed the open ${role} position and found that my hands-on background in ${tech} aligns closely with the role requirements.\n\nIf you have a couple of minutes, I’d be genuinely grateful if you’d consider taking a look at my profile or sharing an internal referral.\n\nThanks so much for your time,\nBest regards.`,
      explanation: 'Polite, direct referral request highlighting relevant tech stack.',
    }
  }

  if (input.goal === 'INITIAL_CONNECTION') {
    return {
      content: `Hi ${name || 'there'},\n\nI came across your profile while researching engineering at ${company}. As a frontend engineer focused on ${tech}, I'd love to connect and keep up with your work.\n\nHave a great week!`,
      explanation: 'Concise connection invitation formatted for LinkedIn character limits.',
    }
  }

  if (input.goal === 'FOLLOW_UP_NO_RESPONSE') {
    return {
      content: `Hi ${name || 'there'},\n\nHope you're doing well!\n\nJust following up briefly on my earlier note regarding the ${role} opening at ${company}. I know how busy things get, so no worries at all if now isn't the right time.\n\nThanks again for your time!`,
      explanation: 'Low-pressure, courteous follow-up.',
    }
  }

  return {
    content: `Hi ${name || 'there'},\n\nHope you're having a great day.\n\nI’ve been exploring opportunities around ${company} and wanted to reach out. I'm a developer focusing on modern web apps with ${tech}, and would love to learn more about the team's frontend stack and upcoming projects.\n\nLooking forward to connecting!`,
    explanation: 'Engaging, proactive outreach inquiry.',
  }
}

