'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useResolvedPeriod } from '@/hooks/useResolvedPeriod'
import { TransactionsPanel } from './TransactionsPanel'
import { ExpensesPanel } from './ExpensesPanel'
import { ExpenseOverviewPanel } from './ExpenseOverviewPanel'
import { TransactionReviewPanel, transactionReviewCount } from './TransactionReviewPanel'
import { ReportsPlaceholder } from './ReportsPlaceholder'
import { PlanKindToggle } from './budgetView/PlanKindToggle'
import { parseViewParams, type ActiveView, type PlanKind } from './budgetView/viewParams'
import { PaymentMethodRequiredDialog } from './modals/PaymentMethodRequiredDialog'
import { needsPaymentMethodSetup } from './transactionsPanel/helpers'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Fab from '@mui/material/Fab'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Badge from '@mui/material/Badge'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RuleIcon from '@mui/icons-material/Rule'
import InsightsIcon from '@mui/icons-material/Insights'

interface Props {
  budgetId: string
}

export function BudgetView({ budgetId }: Props) {
  const t = useTranslations('budget.view')
  const tFab = useTranslations('budget.fab')
  const client = useClient(BudgetService)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  // Section and Plan sub-view both live in the URL, not component state, so a
  // reload lands back where you were. See viewParams for the legacy `?view=`
  // values that still have to resolve.
  const { view: activeView, planKind } = parseViewParams(
    searchParams.get('view'),
    searchParams.get('planKind'),
  )
  const [addTransactionOpen, setAddTransactionOpen] = useState(false)
  const [paymentMethodRequiredOpen, setPaymentMethodRequiredOpen] = useState(false)

  function setActiveView(view: ActiveView) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    // Drop the legacy alias so `?view=expenses&view=plan` can't coexist and
    // have the alias win on the next read.
    params.delete('planKind')
    if (view === 'plan') params.set('planKind', planKind)
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  function setPlanKind(kind: PlanKind) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', 'plan')
    params.set('planKind', kind)
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  const { methods: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods(budgetId)

  const myRole = useBudgetRole(budgetId)
  const canEdit = myRole === BudgetRole.ADMIN || myRole === BudgetRole.COLLABORATOR

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['budget-profile', budgetId],
    queryFn: () => client.getBudgetProfile({ id: budgetId }),
  })

  // `?period=` lets the budget list navigate straight to a specific (possibly
  // archived) past period; absent, this resolves to the true active period.
  const { period: activePeriod, isArchived, isLoading: periodsLoading } = useResolvedPeriod(
    budgetId,
    searchParams.get('period'),
    !!profileData
  )
  const { data: reviewData } = useQuery({
    queryKey: ['transaction-reviews', budgetId],
    queryFn: () => client.listTransactionReviews({ budgetProfileId: budgetId }),
    enabled: !!budgetId,
  })
  const pendingReviewCount = reviewData ? transactionReviewCount(reviewData.reviews) : 0

  if (profileLoading || periodsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
  }
  if (profileError) return <Typography color="error">{t('failedToLoad')}</Typography>

  const profile = profileData?.profile

  function handleFabClick() {
    // Both Fixed and Variable need a payment method to save, so the whole
    // form is blocked rather than half of it — see needsPaymentMethodSetup.
    if (needsPaymentMethodSetup(paymentMethods, paymentMethodsLoading)) {
      setPaymentMethodRequiredOpen(true)
      return
    }
    setActiveView('transactions')
    setAddTransactionOpen(true)
  }

  // The Payment Methods drawer is owned by BudgetSidebar, this view's parent,
  // so it's opened through the URL the same way `view`/`tab`/`period` already
  // are. BudgetSidebar clears the param when the drawer closes.
  function openPaymentMethods() {
    setPaymentMethodRequiredOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('manage', 'paymentMethods')
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', pb: { xs: 12, sm: 10 } }}>
      {/* Budget name + date — shown on all screen sizes */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>{profile?.name}</Typography>
        {activePeriod?.startDate && activePeriod?.endDate && (
          <Typography variant="body2" color="text.secondary">
            {new Date(Number(activePeriod.startDate.seconds) * 1000).toLocaleDateString()} —{' '}
            {new Date(Number(activePeriod.endDate.seconds) * 1000).toLocaleDateString()}
          </Typography>
        )}
      </Box>

      {/* Archived-period notice — the record itself is frozen: creating,
          deleting, marking paid, and excluding transactions are all blocked;
          only a transaction's category can still be changed. Manage panels
          (Categories, Payment Methods, People, Savings/Income Sources) are
          unaffected since they're profile-level, not period-level. */}
      {isArchived && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('archivedPeriodNotice')}
        </Alert>
      )}

      {/* Desktop tab nav */}
      {!isMobile && (
        <Tabs
          value={activeView}
          onChange={(_, v: ActiveView) => setActiveView(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab value="plan" label={t('plan')} icon={<AssignmentIcon />} iconPosition="start" />
          <Tab value="transactions" label={t('transactions')} icon={<ReceiptLongIcon />} iconPosition="start" />
          <Tab
            value="review"
            label={
              <Badge badgeContent={pendingReviewCount} color="warning" max={99}>
                {t('toReview')}
              </Badge>
            }
            icon={<RuleIcon />}
            iconPosition="start"
          />
          <Tab value="reports" label={t('reports')} icon={<InsightsIcon />} iconPosition="start" />
        </Tabs>
      )}

      {/* Active panel */}
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        {activeView === 'plan' ? (
          <>
            <PlanKindToggle value={planKind} onChange={setPlanKind} />
            {planKind === 'plan' ? (
              <ExpensesPanel budgetProfileId={budgetId} budgetPeriodId={activePeriod?.id} canEdit={canEdit} />
            ) : (
              <ExpenseOverviewPanel budgetProfileId={budgetId} budgetPeriodId={activePeriod?.id} />
            )}
          </>
        ) : activeView === 'review' ? (
          <TransactionReviewPanel
            budgetProfileId={budgetId}
            budgetPeriodId={activePeriod?.id}
            isEditable={canEdit}
          />
        ) : activeView === 'reports' ? (
          <ReportsPlaceholder />
        ) : activePeriod ? (
          <TransactionsPanel
            budgetPeriodId={activePeriod.id}
            budgetProfileId={budgetId}
            addOpen={addTransactionOpen}
            onAddClose={() => setAddTransactionOpen(false)}
            isEditable={canEdit}
            isArchivedPeriod={isArchived}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">{t('noActivePeriod')}</Typography>
        )}
      </Box>

      {/* FAB — switches to transactions view and opens add dialog. Hidden
          when archived: creating a new transaction is fully blocked there. */}
      {canEdit && !isArchived && (
        <Fab
          color="primary"
          aria-label={tFab('addTransaction')}
          onClick={handleFabClick}
          sx={{ position: 'fixed', bottom: { xs: 80, sm: 24 }, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      <PaymentMethodRequiredDialog
        open={paymentMethodRequiredOpen}
        onClose={() => setPaymentMethodRequiredOpen(false)}
        onGoToPaymentMethods={openPaymentMethods}
      />

      {/* Mobile bottom navigation — mirrors desktop tabs */}
      {isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <BottomNavigation
            value={activeView}
            onChange={(_, v: ActiveView) => setActiveView(v)}
          >
            <BottomNavigationAction
              value="plan"
              label={t('plan')}
              icon={<AssignmentIcon />}
            />
            <BottomNavigationAction
              value="transactions"
              label={t('transactions')}
              icon={<ReceiptLongIcon />}
            />
            <BottomNavigationAction
              value="review"
              label={t('toReview')}
              icon={
                <Badge badgeContent={pendingReviewCount} color="warning" max={99}>
                  <RuleIcon />
                </Badge>
              }
            />
            <BottomNavigationAction value="reports" label={t('reports')} icon={<InsightsIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  )
}
