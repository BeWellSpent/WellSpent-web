'use client'

import { useTranslations } from 'next-intl'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer,
} from 'recharts'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

export interface ExpenseChartDatum {
  name: string
  value: number
  color: string
}

interface Props {
  chartData: ExpenseChartDatum[]
  chartType: 'pie' | 'bar'
  chartGrouping: 'person' | 'category'
  onChartTypeChange: (v: 'pie' | 'bar') => void
  onChartGroupingChange: (v: 'person' | 'category') => void
  formatMoney: (amount: number) => string
  isMobile: boolean
  barLabel?: string
  noDataText?: string
}

export function ExpenseChart({ chartData, chartType, chartGrouping, onChartTypeChange, onChartGroupingChange, formatMoney, isMobile, barLabel, noDataText }: Props) {
  const t = useTranslations('budget.expenses')
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Box mb={2}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={chartType}
          onChange={(_, v) => v && onChartTypeChange(v)}
        >
          <ToggleButton value="pie">{t('chart.pie')}</ToggleButton>
          <ToggleButton value="bar">{t('chart.bar')}</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={chartGrouping}
          onChange={(_, v) => v && onChartGroupingChange(v)}
        >
          <ToggleButton value="category">{t('chart.byCategory')}</ToggleButton>
          <ToggleButton value="person">{t('chart.byPerson')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {chartData.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{noDataText ?? t('chart.noData')}</Typography>
      ) : (
        <>
          {chartType === 'pie' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <Box sx={{ width: isMobile ? '100%' : 220, height: isMobile ? 180 : 240, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 70 : 90}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartTooltip formatter={(v) => typeof v === 'number' ? formatMoney(v) : ''} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0, ...(isMobile && { width: '100%' }) }}>
                {chartData.map((entry) => {
                  const pct = total > 0 ? (entry.value / total * 100).toFixed(1) : '0.0'
                  return (
                    <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                      <Typography variant="caption" noWrap sx={{ flex: 1, minWidth: 0 }}>{entry.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{formatMoney(entry.value)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 38, textAlign: 'right' }}>{pct}%</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 32 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <RechartTooltip formatter={(v) => typeof v === 'number' ? formatMoney(v) : ''} />
                <Bar dataKey="value" name={barLabel ?? t('plannedAmount')} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </Box>
  )
}
