import { requireAuth } from '@/src/server/auth'
import { getAnalyticsData } from '@/src/server/data/analytics'
import { AnalyticsDashboard } from '@/src/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  const session = await requireAuth()
  const userId = session.user!.id!

  const data = await getAnalyticsData(userId)

  return <AnalyticsDashboard data={data} />
}
