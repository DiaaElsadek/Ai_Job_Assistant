export interface PlannerAction {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  category: 'FOLLOW_UP' | 'CONTACT_DECAY' | 'OPPORTUNITY' | 'DAILY_GOAL'
  score: number
  ctaLabelEn: string
  ctaLabelAr: string
  ctaHref: string
  entityName?: string
}

export interface RawPlannerData {
  followUps: Array<{
    id: string
    title: string
    dueDate: Date
    priority: string
    contact?: { fullName: string; id: string } | null
    company?: { name: string; id: string } | null
  }>
  staleContacts: Array<{
    id: string
    fullName: string
    role?: string | null
    networkingPriority: string
    lastContactDate?: Date | null
    company?: { name: string } | null
  }>
  urgentOpportunities: Array<{
    id: string
    title: string
    status: string
    priority: string
    deadline?: Date | null
    company?: { name: string } | null
  }>
}

export function rankNextBestActions(data: RawPlannerData): PlannerAction[] {
  const actions: PlannerAction[] = []
  const now = new Date()

  // 1. Follow-up Tasks (Overdue = CRITICAL score 100, Due Today = HIGH score 90)
  for (const task of data.followUps) {
    const isOverdue = new Date(task.dueDate) < now
    const entityName = task.contact?.fullName || task.company?.name

    actions.push({
      id: `task-${task.id}`,
      titleEn: isOverdue ? `Overdue Follow-up: ${task.title}` : `Due Today: ${task.title}`,
      titleAr: isOverdue ? `متابعة متأخرة: ${task.title}` : `متابعة اليوم: ${task.title}`,
      descriptionEn: entityName
        ? `Task linked with ${entityName}. Timely follow-ups boost response rates by 40%.`
        : 'Action required to keep your job search momentum going.',
      descriptionAr: entityName
        ? `مهمة مرتبطة بـ ${entityName}. المتابعة السريعة تزيد معدل الردود بنسبة 40%.`
        : 'إجراء مطلوب للحفاظ على تسارع وتيرة بحثك عن عمل.',
      priority: isOverdue ? 'CRITICAL' : 'HIGH',
      category: 'FOLLOW_UP',
      score: isOverdue ? 100 : 90,
      ctaLabelEn: 'View Follow-ups',
      ctaLabelAr: 'عرض المتابعات',
      ctaHref: '/follow-ups',
      entityName,
    })
  }

  // 2. High-priority Stale Contacts (Score 75)
  for (const contact of data.staleContacts) {
    const company = contact.company?.name ? ` at ${contact.company.name}` : ''
    const companyAr = contact.company?.name ? ` في ${contact.company.name}` : ''

    actions.push({
      id: `contact-${contact.id}`,
      titleEn: `Reconnect with ${contact.fullName}${company}`,
      titleAr: `تجديد التواصل مع ${contact.fullName}${companyAr}`,
      descriptionEn: `High-priority contact with no recorded touchpoint recently. Generate an AI icebreaker to re-engage.`,
      descriptionAr: `جهة اتصال هامة بدون تفاعل حديث. استخدم ستوديو الذكاء الاصطناعي لصياغة رسالة تنشيط.`,
      priority: 'HIGH',
      category: 'CONTACT_DECAY',
      score: 75,
      ctaLabelEn: 'Draft AI Message',
      ctaLabelAr: 'صياغة رسالة بالذكاء',
      ctaHref: `/messages?contactId=${contact.id}`,
      entityName: contact.fullName,
    })
  }

  // 3. Urgent Opportunities (Score 65)
  for (const opp of data.urgentOpportunities) {
    const company = opp.company?.name ? ` (${opp.company.name})` : ''

    actions.push({
      id: `opp-${opp.id}`,
      titleEn: `Advance Opportunity: ${opp.title}${company}`,
      titleAr: `تحريك فرصة العمل: ${opp.title}${company}`,
      descriptionEn: `Marked as high priority. Review technical requirements or prepare outreach before deadline.`,
      descriptionAr: `فرصة ذات أولوية عالية. راجع المتطلبات التقنية أو جهز طلب الترشيح.`,
      priority: 'MEDIUM',
      category: 'OPPORTUNITY',
      score: 65,
      ctaLabelEn: 'Open Opportunity',
      ctaLabelAr: 'فتح الفرصة',
      ctaHref: `/opportunities/${opp.id}`,
      entityName: opp.title,
    })
  }

  // Sort descending by calculated heuristic score
  actions.sort((a, b) => b.score - a.score)

  // Return top 5 high-impact actions
  return actions.slice(0, 5)
}

