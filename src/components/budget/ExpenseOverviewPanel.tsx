'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { useChartPreference, DEFAULT_CHART } from '@/hooks/useChartPreference'
import { useIsMobile } from '@/hooks/useIsMobile'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Category, PaymentMethod, BudgetPerson, Transaction, CategoryExpenseSummary } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useCurrency } from '@/hooks/useCurrency'
import { formatMoneyFromNumber } from '@/lib/format'
import { parseMoney } from './expensesPanel/helpers'
import { formatOverviewAmountText } from './expenseOverviewPanel/helpers'
import { isTransactionExcluded } from './transactionsPanel/helpers'
import { ExpenseChart, type ExpenseChartDatum } from './expensesPanel/ExpenseChart'
import { CategoryOverviewRow } from './expenseOverviewPanel/CategoryOverviewRow'
import { CategoryOverviewCard } from './expenseOverviewPanel/CategoryOverviewCard'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#f97316']

interface Props {
  budgetProfileId: string
  budgetPeriodId: string | undefined
}

function money(m: { units: bigint; nanos: number } | undefined): number {
  return parseMoney(m?.units ?? 0n, m?.nanos ?? 0)
}

export function ExpenseOverviewPanel({ budgetProfileId, budgetPeriodId }: Props) {
  const t = useTranslations('budget.overview')
  const isMobile = useIsMobile()
  const { currency, locale } = useCurrency()
  const formatMoney = useCallback(
    (amount: number) => formatMoneyFromNumber(amount, currency, locale),
    [currency, locale],
  )
  const client = useClient(BudgetService)

  const savedChart = useChartPreference(budgetProfileId, 'overview')
  const [chartOverride, setChartOverride] = useState<'pie' | 'bar' | null>(null)
  // The in-chart toggle is a one-off view change: it overrides the saved
  // default for this visit without writing it back (Preferences is the only
  // place that sets a default).
  const chartType = chartOverride ?? savedChart ?? DEFAULT_CHART
  const setChartType = setChartOverride
  const [chartGrouping, setChartGrouping] = useState<'person' | 'category'>('category')
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set())

  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.listCategories({ budgetProfileId }),
  })
  const { data: peopleData, isLoading: peopleLoading } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const { data: transactionsData, isLoading: txnsLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId],
    queryFn: () => client.listTransactions({ budgetPeriodId: budgetPeriodId! }),
    enabled: !!budgetPeriodId,
  })
  const { methods: paymentMethods, isLoading: pmLoading } = usePaymentMethods(budgetProfileId)
  // Server-computed planned/actual/remainder/over-budget/unplanned totals —
  // the single source of truth both web and iOS consume, replacing the
  // local re-derivation that previously drifted between the two clients
  // (see docs/features/expense-summary.md, issue #35).
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['expense-summary', budgetPeriodId],
    queryFn: () => client.getExpenseSummary({ budgetPeriodId: budgetPeriodId! }),
    enabled: !!budgetPeriodId,
  })

  const isLoading = catsLoading || peopleLoading || txnsLoading || pmLoading || summaryLoading
  if (isLoading || !summaryData) return <Box sx={{ py: 2 }}><CircularProgress size={20} /></Box>

  const categories = categoriesData?.categories ?? []
  const people = peopleData?.people ?? []
  const incomeCategoryId = categories.find((c) => c.name === 'Income' && c.isSystem)?.id
  const transactions = (transactionsData?.transactions ?? []).filter((tx) => !isTransactionExcluded(tx, incomeCategoryId))

  const categoryMap = new Map<number, Category>(categories.map((c) => [c.id, c]))
  const methodMap = new Map<string, PaymentMethod>(paymentMethods.map((pm) => [pm.id, pm]))
  const personMap = new Map<string, BudgetPerson>(people.map((p) => [p.id.toString(), p]))

  // Raw per-category transaction list for the expandable drill-down — this
  // is display data, not a calculation, so it still comes from the period's
  // transaction list rather than the summary RPC.
  const transactionsByCatId = new Map<number, Transaction[]>()
  for (const tx of transactions) {
    if (!tx.categoryId) continue
    if (tx.transactionTypeId === 1 && !tx.isPaid) continue // unpaid fixed: not yet spent
    if (!transactionsByCatId.has(tx.categoryId)) transactionsByCatId.set(tx.categoryId, [])
    transactionsByCatId.get(tx.categoryId)!.push(tx)
  }

  // Already visible-filtered and sorted by actual descending, server-side.
  const visibleCats = summaryData.overviewCategories
    .map((summary) => ({ cat: categoryMap.get(summary.categoryId), summary }))
    .filter((x): x is { cat: Category; summary: CategoryExpenseSummary } => !!x.cat)

  const uncategorizedActual = money(summaryData.uncategorizedActual)
  const totalActual = money(summaryData.totalActual)
  const totalPlanned = money(summaryData.totalPlanned)
  const totalIncome = money(summaryData.incomeFromEntries)
  const actualRemainder = money(summaryData.remainderActual)
  const plannedRemainder = money(summaryData.remainderPlanned)
  const totalOverBudget = money(summaryData.totalOverBudget)
  const totalUnplanned = money(summaryData.totalUnplanned)

  const footerCellSx = { borderTop: '2px solid', borderColor: 'divider', fontSize: '0.95rem', fontWeight: 700 }

  function toggleCategory(catId: number) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // Chart: actual amounts per category (red when overspent), or by person
  const chartData: ExpenseChartDatum[] = (() => {
    if (chartGrouping === 'category') {
      return visibleCats.map(({ cat, summary }, i) => {
        const actual = money(summary.actualTotal)
        return {
          name: cat.name,
          value: actual,
          color: summary.isOver ? '#ef4444' : (cat.color || CHART_COLORS[i % CHART_COLORS.length]),
        }
      }).filter((d) => d.value > 0)
    }
    return people.map((p, i) => {
      let value = 0
      for (const { summary } of visibleCats) {
        const pb = summary.personBreakdowns.find((x) => x.budgetPersonId === p.id)
        if (pb) value += money(pb.actualTotal)
      }
      return { name: p.userName, value, color: p.color || CHART_COLORS[i % CHART_COLORS.length] }
    }).filter((d) => d.value > 0)
  })()

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
      </Box>

      {visibleCats.length > 0 && chartData.length > 0 && (
        <ExpenseChart
          chartData={chartData}
          chartType={chartType}
          chartGrouping={chartGrouping}
          onChartTypeChange={setChartType}
          onChartGroupingChange={setChartGrouping}
          formatMoney={formatMoney}
          isMobile={isMobile}
          barLabel={t('actual')}
          noDataText={t('noData')}
        />
      )}

      {visibleCats.length === 0 && uncategorizedActual === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
          {t('noData')}
        </Typography>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleCats.map(({ cat, summary }) => (
            <CategoryOverviewCard
              key={cat.id}
              cat={cat}
              people={people}
              summary={summary}
              totalActual={totalActual}
              isExpanded={expandedCats.has(cat.id)}
              onToggle={() => toggleCategory(cat.id)}
              formatMoney={formatMoney}
              catTransactions={transactionsByCatId.get(cat.id) ?? []}
              categoryMap={categoryMap}
              methodMap={methodMap}
              personMap={personMap}
            />
          ))}
          {uncategorizedActual !== 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.75, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>{t('uncategorized')}</Typography>
              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>{formatOverviewAmountText(uncategorizedActual, formatMoney)}</Typography>
            </Box>
          )}
          <Box sx={{ pt: 1, borderTop: '2px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={700}>{t('total')}</Typography>
              <Typography variant="body2" fontWeight={700}>{formatOverviewAmountText(totalActual, formatMoney)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">{t('planned')}</Typography>
              <Typography variant="body2">{totalPlanned > 0 ? formatMoney(totalPlanned) : '—'}</Typography>
            </Box>
            {totalIncome > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color={actualRemainder < 0 ? 'error.main' : 'success.main'} fontWeight={600}>{t('remainderActual')}</Typography>
                  <Typography variant="body2" color={actualRemainder < 0 ? 'error.main' : 'success.main'} fontWeight={600}>{formatMoney(actualRemainder)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color={plannedRemainder < 0 ? 'error.main' : 'success.main'} fontWeight={600}>{t('remainderPlan')}</Typography>
                  <Typography variant="body2" color={plannedRemainder < 0 ? 'error.main' : 'success.main'} fontWeight={600}>{formatMoney(plannedRemainder)}</Typography>
                </Box>
              </>
            )}
            {totalOverBudget > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={700} color="error.main">{t('overBudget')}</Typography>
                <Typography variant="body2" fontWeight={700} color="error.main">{formatMoney(totalOverBudget)}</Typography>
              </Box>
            )}
            {totalUnplanned > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={700} color="warning.main">{t('unplanned')}</Typography>
                <Typography variant="body2" fontWeight={700} color="warning.main">{formatMoney(totalUnplanned)}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 36 }} />
                <TableCell sx={{ fontWeight: 600 }}>{t('category')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{t('actual')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{t('planned')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleCats.map(({ cat, summary }) => (
                <CategoryOverviewRow
                  key={cat.id}
                  cat={cat}
                  people={people}
                  summary={summary}
                  totalActual={totalActual}
                  isExpanded={expandedCats.has(cat.id)}
                  onToggle={() => toggleCategory(cat.id)}
                  formatMoney={formatMoney}
                  catTransactions={transactionsByCatId.get(cat.id) ?? []}
                  categoryMap={categoryMap}
                  methodMap={methodMap}
                  personMap={personMap}
                />
              ))}
              {uncategorizedActual !== 0 && (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ py: 0.5, pr: 0 }} />
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {t('uncategorized')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                      {formatOverviewAmountText(uncategorizedActual, formatMoney)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ '& td': footerCellSx }}>
                <TableCell />
                <TableCell>{t('total')}</TableCell>
                <TableCell align="right">{formatOverviewAmountText(totalActual, formatMoney)}</TableCell>
                <TableCell align="right">{totalPlanned > 0 ? formatMoney(totalPlanned) : '—'}</TableCell>
                <TableCell />
              </TableRow>
              {totalIncome > 0 && (
                <TableRow sx={{ '& td': { ...footerCellSx, borderTop: 'none' } }}>
                  <TableCell />
                  <TableCell>{t('remainder')}</TableCell>
                  <TableCell align="right" sx={{ color: actualRemainder < 0 ? 'error.main' : 'success.main' }}>{formatMoney(actualRemainder)}</TableCell>
                  <TableCell align="right" sx={{ color: plannedRemainder < 0 ? 'error.main' : 'success.main' }}>{formatMoney(plannedRemainder)}</TableCell>
                  <TableCell />
                </TableRow>
              )}
              {totalOverBudget > 0 && (
                <TableRow sx={{ '& td': { ...footerCellSx, borderTop: 'none', color: 'error.main' } }}>
                  <TableCell />
                  <TableCell>{t('overBudget')}</TableCell>
                  <TableCell align="right">{formatMoney(totalOverBudget)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
              {totalUnplanned > 0 && (
                <TableRow sx={{ '& td': { ...footerCellSx, borderTop: 'none', color: 'warning.main' } }}>
                  <TableCell />
                  <TableCell>{t('unplanned')}</TableCell>
                  <TableCell align="right">{formatMoney(totalUnplanned)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
            </TableFooter>
          </Table>
        </TableContainer>
      )}

    </Box>
  )
}
