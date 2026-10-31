'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Clock, TrendingUp, HelpCircle } from 'lucide-react'
import type { StageVelocityMetric } from '@/src/server/data/stage-history'
import { useI18n } from '@/src/lib/i18n'

interface StageVelocityChartProps {
  metrics: StageVelocityMetric[]
}

export function StageVelocityChart({ metrics }: StageVelocityChartProps) {
  const { isRtl } = useI18n()

  const colors = [
    '#38bdf8', // sky
    '#818cf8', // indigo
    '#fbbf24', // amber
    '#34d399', // emerald
    '#f43f5e', // rose
    '#a855f7', // purple
  ]

  const chartData = metrics.map((m) => ({
    name: m.stage,
    days: m.avgDays,
    samples: m.sampleCount,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-bg-card border border-border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
          <p className="font-semibold text-text-primary">{data.name}</p>
          <p className="text-accent font-bold">
            {data.days} {isRtl ? 'يوم في المتوسط' : 'days on average'}
          </p>
          <p className="text-[10px] text-text-muted">
            {data.samples} {isRtl ? 'حالات مسجلة' : 'tracked transitions'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {isRtl ? 'سرعة الانتقال بين المراحل (Time in Stage)' : 'Pipeline Velocity & Time in Stage'}
            </h3>
            <p className="text-[11px] text-text-muted">
              {isRtl
                ? 'متوسط عدد الأيام التي تستغرقها فرصة العمل في كل مرحلة قبل التقدم.'
                : 'Average days applications spend in each lifecycle stage before moving forward.'}
            </p>
          </div>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit={isRtl ? ' يوم' : 'd'}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="days" radius={[0, 6, 6, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

