import 'server-only'
import { prisma } from '@/src/server/db'
import type { Prisma } from '@prisma/client'

export async function getOrCreateSettings(userId: string) {
  let settings = await prisma.settings.findFirst({
    where: { userId },
  })

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId,
        preferredRole: 'React.js / Next.js Frontend Developer',
        targetCountry: 'Egypt',
        preferredExperience: ['INTERNSHIP', 'FRESHER', 'JUNIOR'],
        workPreference: 'REMOTE',
        preferredLanguage: 'ENGLISH',
        dailyNetworkingTarget: 5,
        followUpDefaultDays: 3,
        theme: 'dark',
      },
    })
  }

  return settings
}

export async function updateUserSettings(
  userId: string,
  data: Prisma.SettingsUpdateInput
) {
  return prisma.settings.updateMany({
    where: { userId },
    data,
  })
}

