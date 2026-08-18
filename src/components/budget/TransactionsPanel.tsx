'use client'

import { useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { Transaction, FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useCurrency } from '@/hooks/useCurrency'
import { useViewPreference } from '@/hooks/useViewPreference'
import { formatMoneyFromNumber } from '@/lib/format'
import { type FilterOption, txAmount, isTransactionExcluded, resolveSwipeDirection, buildPendingReviewMatchMap, computeOverBudgetTxIds, notDueFixedExpenses } from './transactionsPanel/helpers'
import { TransactionTable } from './transactionsPanel/TransactionTable'
import { AddTransactionModal } from './modals/AddTransactionModal'
import { EditTransactionModal } from './modals/EditTransactionModal'
import { EditFixedExpenseModal } from './modals/EditFixedExpenseModal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import TabIcon from '@mui/icons-material/Tab'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import type { ViewMode } from '@/hooks/useViewPreference'

interface Props {
  budgetPeriodId: string
  budgetProfileId: string
  isEditable?: boolean
  /** True when viewing an archived (past) period — creating, deleting,
   * marking paid, excluding, and flagging for review are all fully blocked.
   * Editing a Variable transaction stays reachable, but only its category
   * can actually be changed (see EditTransactionModal). Fixed-row editing
   * (which edits the recurring template, not this occurrence) is
   * deliberately not restricted by this yet — see
   * docs/features/budget-list-view-rework.md's Web implementation notes. */
  isArchivedPeriod?: boolean
  addOpen?: boolean
  onAddClose?: () => void
}

export function TransactionsPanel({ budgetPeriodId, budgetProfileId, isEditable = true, isArchivedPeriod = false, addOpen = false, onAddClose }: Props) {
  // Full mutation (add/delete/mark-paid/exclude/flag-for-review) is blocked
  // outright on an archived period; editing a Variable row's category stays
  // available — see TransactionTable/EditTransactionModal.
  const canMutate = isEditable && !isArchivedPeriod
  const t = useTranslations('budget.transactions')
  const queryClient = useQueryClient()
  const { currency, locale } = useCurrency()
  const formatMoney = (amount: number) => formatMoneyFromNumber(amount, currency, locale)
  const client = useClient(BudgetService)
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [viewMode, setViewMode] = useViewPreference('tabbed')
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [editFixedExpenseTarget, setEditFixedExpenseTarget] = useState<FixedExpense | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterOption>('none')
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Which sub-tab (Fixed vs Variable) is stored in the URL, not component
  // state, so a page reload lands back where you were.
  const tabIndex = searchParams.get('tab') === 'variable' ? 1 : 0

  function setTabIndex(index: number) {
    if (index === 0 && (activeFilter === 'spentOnly' || activeFilter === 'exceededOnly')) {
      setActiveFilter('none')
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', index === 1 ? 'variable' : 'fixed')
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  // Split view needs room for two columns side by side — always tabbed on mobile.
  const effectiveViewMode: ViewMode = isMobile ? 'tabbed' : viewMode

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const deltaX = e.changedTouches[0].clientX - start.x
    const deltaY = e.changedTouches[0].clientY - start.y
    const direction = resolveSwipeDirection(deltaX, deltaY)
    if (direction === 'right') setTabIndex(Math.max(0, tabIndex - 1))
    else if (direction === 'left') setTabIndex(Math.min(1, tabIndex + 1))
  }

  const { data: fixedData, isLoading: fixedLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 1],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 1 }),
  })
  const { data: variableData, isLoading: variableLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 2],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 2 }),
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', budgetProfileId],
    queryFn: () => client.listCategories({ budgetProfileId }),
  })
  const { methods: paymentMethods } = usePaymentMethods(budgetProfileId)
  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const { data: fixedExpensesData } = useQuery({
    queryKey: ['fixed-expenses', budgetProfileId],
    queryFn: () => client.listFixedExpenses({ budgetProfileId }),
  })
  const { data: allocationsData } = useQuery({
    queryKey: ['expense-allocations', budgetProfileId],
    queryFn: () => client.listExpenseAllocations({ budgetProfileId }),
  })
  const { data: reviewsData } = useQuery({
    queryKey: ['transaction-reviews', budgetProfileId],
    queryFn: () => client.listTransactionReviews({ budgetProfileId }),
    enabled: !!budgetProfileId,
  })

  const categoryMap = new Map((categoriesData?.categories ?? []).map((c) => [c.id, c]))
  const methodMap = new Map(paymentMethods.map((m) => [m.id, m]))
  const personMap = new Map((peopleData?.people ?? []).map((p) => [p.id.toString(), p]))

  const savingsCategoryId = (categoriesData?.categories ?? []).find(
    (c) => c.name === 'Savings' && c.isSystem,
  )?.id
  const incomeCategoryId = (categoriesData?.categories ?? []).find(
    (c) => c.name === 'Income' && c.isSystem,
  )?.id

  const fixedTxs = fixedData?.transactions ?? []
  const variableTxs = variableData?.transactions ?? []

  // Upcoming bills — rendered in the Fixed tab's "Future" section. Suppressed
  // on an archived period; see the helper for why the derivation is only sound
  // for the live one.
  const futureFixedExpenses = notDueFixedExpenses(
    fixedExpensesData?.expenses ?? [],
    fixedTxs,
    isArchivedPeriod,
  )

  // Grand total = what was actually paid. Fixed only counts once marked paid
  // (using the actual amount paid, not the planned amount). Variable always
  // counts. Excluded transactions and Income-category rows never count here.
  const fixedActualTotal = fixedTxs
    .filter((tx) => !isTransactionExcluded(tx, incomeCategoryId) && tx.isPaid)
    .reduce((sum, tx) => sum + txAmount(tx), 0)
  const variableTotal = variableTxs
    .filter((tx) => !isTransactionExcluded(tx, incomeCategoryId))
    .reduce((sum, tx) => sum + txAmount(tx), 0)
  const grandTotal = fixedActualTotal + variableTotal

  const overBudgetTxIds = computeOverBudgetTxIds(
    variableTxs,
    fixedTxs,
    allocationsData?.allocations ?? [],
    incomeCategoryId,
  )

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })

  const fixedExpenseMap = new Map<string, FixedExpense>(
    (fixedExpensesData?.expenses ?? []).map((fe) => [fe.id, fe])
  )

  const allReviews = reviewsData?.reviews ?? []
  const pendingReviewMatchByTxId = buildPendingReviewMatchMap(allReviews)

  // Variable transactions confirmed as matching a fixed expense: hidden from
  // the variable tab and shown inline under the matched fixed transaction.
  const confirmedReviewVariableTxIds = new Set<string>(
    allReviews.filter((r) => r.status === 'confirmed').map((r) => r.transactionId),
  )
  const linkedVariableByFixedTxId = new Map<string, Transaction[]>()
  for (const review of allReviews.filter((r) => r.status === 'confirmed')) {
    const varTx = variableTxs.find((tx) => tx.id === review.transactionId)
    if (!varTx) continue
    const list = linkedVariableByFixedTxId.get(review.matchedTransactionId) ?? []
    list.push(varTx)
    linkedVariableByFixedTxId.set(review.matchedTransactionId, list)
  }

  const sharedTableProps = {
    isEditable,
    canMutate,
    savingsCategoryId,
    incomeCategoryId,
    budgetPeriodId,
    budgetProfileId,
    categoryMap,
    methodMap,
    personMap,
    fixedExpenseMap,
    pendingReviewMatchByTxId,
    searchQuery,
    activeFilter,
    overBudgetTxIds,
    onFilterChange: (f: FilterOption) => setActiveFilter(f),
    onDeleted: refresh,
    onEdit: setEditTarget,
    onRefresh: refresh,
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
          {grandTotal > 0 && (
            <Typography variant="subtitle2" color="text.secondary">
              {t('grandTotal', { amount: formatMoney(grandTotal) })}
            </Typography>
          )}
        </Box>
        {!isMobile && (
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode) => v && setViewMode(v)}
          >
            <ToggleButton value="tabbed"><TabIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="split"><ViewStreamIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth={isMobile}
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} aria-label={t('clearSearch')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {!isMobile && (
          <Select
            size="small"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterOption)}
            displayEmpty
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="none">{t('filter.none')}</MenuItem>
            {(effectiveViewMode === 'split' || tabIndex === 1) && (
              <MenuItem value="spentOnly">{t('filter.spentOnly')}</MenuItem>
            )}
            {(effectiveViewMode === 'split' || tabIndex === 1) && (
              <MenuItem value="exceededOnly">{t('filter.exceededOnly')}</MenuItem>
            )}
            <MenuItem value="excludedOnly">{t('filter.excludedOnly')}</MenuItem>
          </Select>
        )}
      </Box>

      {effectiveViewMode === 'tabbed' ? (
        <Box onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 1 }}>
            <Tab label={t('fixed')} sx={{ fontWeight: 700 }} />
            <Tab label={t('variable')} sx={{ fontWeight: 700 }} />
          </Tabs>
          {/* Keyed so the two tabs don't share one instance: each needs its own
              default sort direction (Fixed oldest-first, Variable newest-first),
              and an initial useState value can't change on a prop switch.
              Search and filter live here in the parent, so nothing the user
              typed is lost by remounting. */}
          {tabIndex === 0
            ? <TransactionTable key="fixed" {...sharedTableProps} isFixed transactions={fixedTxs} isLoading={fixedLoading} label={t('fixed')} notDueFixedExpenses={futureFixedExpenses} onEditFixedExpense={setEditFixedExpenseTarget} linkedVariableByFixedTxId={linkedVariableByFixedTxId} />
            : <TransactionTable key="variable" {...sharedTableProps} isFixed={false} transactions={variableTxs} isLoading={variableLoading} label={t('variable')} confirmedReviewVariableTxIds={confirmedReviewVariableTxIds} />
          }
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>{t('fixed').toUpperCase()}</Typography>
            <TransactionTable {...sharedTableProps} isFixed transactions={fixedTxs} isLoading={fixedLoading} label={t('fixed')} notDueFixedExpenses={futureFixedExpenses} onEditFixedExpense={setEditFixedExpenseTarget} linkedVariableByFixedTxId={linkedVariableByFixedTxId} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>{t('variable').toUpperCase()}</Typography>
            <TransactionTable {...sharedTableProps} isFixed={false} transactions={variableTxs} isLoading={variableLoading} label={t('variable')} confirmedReviewVariableTxIds={confirmedReviewVariableTxIds} />
          </Box>
        </Box>
      )}

      {canMutate && (
        <AddTransactionModal
          budgetPeriodId={budgetPeriodId}
          budgetProfileId={budgetProfileId}
          open={addOpen}
          defaultTypeId={effectiveViewMode !== 'tabbed' || tabIndex === 0 ? 1 : 2}
          onClose={() => onAddClose?.()}
          onDone={() => { onAddClose?.(); refresh() }}
        />
      )}

      {editTarget && (editTarget.fixedExpenseId ? (
        (() => {
          const fe = (fixedExpensesData?.expenses ?? []).find((f) => f.id === editTarget.fixedExpenseId)
          if (!fe) return null
          return (
            <EditFixedExpenseModal
              budgetProfileId={budgetProfileId}
              fixedExpense={fe}
              onClose={() => setEditTarget(null)}
              onDone={() => { setEditTarget(null); refresh(); queryClient.invalidateQueries({ queryKey: ['fixed-expenses', budgetProfileId] }) }}
            />
          )
        })()
      ) : (
        <EditTransactionModal
          budgetProfileId={budgetProfileId}
          transaction={editTarget}
          isArchivedPeriod={isArchivedPeriod}
          onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); refresh() }}
        />
      ))}

      {editFixedExpenseTarget && (
        <EditFixedExpenseModal
          budgetProfileId={budgetProfileId}
          fixedExpense={editFixedExpenseTarget}
          onClose={() => setEditFixedExpenseTarget(null)}
          onDone={() => {
            setEditFixedExpenseTarget(null)
            refresh()
            queryClient.invalidateQueries({ queryKey: ['fixed-expenses', budgetProfileId] })
          }}
        />
      )}
    </Box>
  )
}
