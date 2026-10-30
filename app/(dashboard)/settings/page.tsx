import { requireAuth } from '@/src/server/auth'
import { getOrCreateSettings } from '@/src/server/data/settings'
import { SettingsForm, type SettingsData } from '@/src/components/settings/settings-form'

export default async function SettingsPage() {
  const session = await requireAuth()
  const userId = session.user!.id!
  const ownerEmail = session.user!.email!

  const settings = await getOrCreateSettings(userId)

  const formattedSettings: SettingsData = {
    id: settings.id,
    preferredRole: settings.preferredRole,
    targetCountry: settings.targetCountry,
    preferredExperience: settings.preferredExperience,
    workPreference: settings.workPreference,
    preferredLanguage: settings.preferredLanguage,
    dailyNetworkingTarget: settings.dailyNetworkingTarget,
    followUpDefaultDays: settings.followUpDefaultDays,
    cvFileReference: settings.cvFileReference,
    cvUrl: settings.cvUrl,
    theme: settings.theme,
  }

  return (
    <SettingsForm
      settings={formattedSettings}
      ownerEmail={ownerEmail}
    />
  )
}

