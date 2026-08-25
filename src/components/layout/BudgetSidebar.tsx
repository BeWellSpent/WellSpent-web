'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useThemeMode } from '@/context/ThemeContext'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { useResolvedPeriod } from '@/hooks/useResolvedPeriod'
import { DesktopSidebar } from './sidebar/DesktopSidebar'
import { MobileTopBar } from './sidebar/MobileTopBar'
import { MobileManageDrawer } from './sidebar/MobileManageDrawer'
import { ManagementDrawers } from './sidebar/ManagementDrawers'
import { PeriodSwitcher } from './sidebar/PeriodSwitcher'
import { parseViewParams } from '@/components/budget/budgetView/viewParams'
import type { NavItem } from './sidebar/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PeopleIcon from '@mui/icons-material/People'
import MailIcon from '@mui/icons-material/Mail'
import CategoryIcon from '@mui/icons-material/Category'
import SettingsIcon from '@mui/icons-material/Settings'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SavingsIcon from '@mui/icons-material/Savings'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TuneIcon from '@mui/icons-material/Tune'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

const COLLAPSED_KEY = 'sidebar-collapsed'

interface Props {
  budgetId: string
  children: React.ReactNode
}

export function BudgetSidebar({ budgetId, children }: Props) {
  const t = useTranslations('budget.sidebar')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const theme = useTheme()
  // Sidebar collapses to a bottom bar earlier than the `sm` app-wide
  // breakpoint — there's a permanent sidebar to make room for down to `md`.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const client = useClient(BudgetService)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [invitesOpen, setInvitesOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [savingsOpen, setSavingsOpen] = useState(false)
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [bankConnectionsOpen, setBankConnectionsOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [mobileManageOpen, setMobileManageOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  const { effective } = useThemeMode()

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true')
    setThemeMounted(true)
  }, [])

  // `?manage=paymentMethods` lets a view nested under this one (BudgetView's
  // add-transaction gate) open a management drawer it doesn't own. Only
  // paymentMethods is wired up — add cases here as other panels need it.
  const managePanel = searchParams.get('manage')

  // The top bar names the view you're looking at (issue #60). BudgetView is a
  // *child* of this component, so the name can't be passed up — but both read
  // the same `?view=` param, which is already the convention here.
  const tView = useTranslations('budget.view')
  const { view: activeView } = parseViewParams(searchParams.get('view'), searchParams.get('planKind'))
  const viewTitle = tView(activeView)

  useEffect(() => {
    if (managePanel === 'paymentMethods') setPaymentMethodsOpen(true)
  }, [managePanel])

  /** Drops `?manage=` so closing a drawer doesn't leave it reopening on reload. */
  function clearManageParam() {
    if (!searchParams.has('manage')) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('manage')
    router.replace({ pathname, query: Object.fromEntries(params) }, { scroll: false })
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev))
      return !prev
    })
  }

  const myRole = useBudgetRole(budgetId)
  const canEdit = myRole === BudgetRole.ADMIN || myRole === BudgetRole.COLLABORATOR
  const canManageUsers = myRole === BudgetRole.ADMIN

  const { data } = useQuery({
    queryKey: ['budget-profile', budgetId],
    queryFn: () => client.getBudgetProfile({ id: budgetId }),
  })

  // Always the true active period, never a browsed-to archived one — see
  // useResolvedPeriod's doc comment for why Manage panels don't follow
  // BudgetView's `?period=` override.
  // `periods` is already fetched here to resolve the active one — the switcher
  // reads that same copy rather than issuing its own ListBudgetPeriods.
  const { period: activePeriod, periods } = useResolvedPeriod(budgetId, undefined, !!data)
  // Which period the *content* is showing, which may be an archived one the
  // user browsed to; `activePeriod` above is deliberately always the live one.
  const shownPeriodId = searchParams.get('period') ?? activePeriod?.id

  const budgetName = data?.profile?.name ?? '…'
  // The budget's country is propagated from its owner at creation. It gates
  // both the before-tax income fields and the bank-connections panel, since
  // Plaid is US-only and the backend refuses everyone else outright.
  const isUS = (data?.profile?.countryCode ?? '') === 'US'
  const iconSrc = themeMounted && effective === 'dark' ? '/app-icon-dark.png' : '/app-icon-light.png'

  const activePeriodStart = activePeriod?.startDate
    ? new Date(Number(activePeriod.startDate.seconds) * 1000)
    : undefined

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logger.info('auth.logout')
    } finally {
      router.push('/login')
    }
  }

  function openMobilePanel(openFn: () => void) {
    setMobileManageOpen(false)
    openFn()
  }

  const managementItems: NavItem[] = [
    { label: t('income'), icon: <AttachMoneyIcon />, action: () => setIncomeOpen(true) },
    { label: t('savings'), icon: <SavingsIcon />, action: () => setSavingsOpen(true) },
    { label: t('paymentMethods'), icon: <CreditCardIcon />, action: () => setPaymentMethodsOpen(true) },
    { label: t('categories'), icon: <CategoryIcon />, action: () => setCategoriesOpen(true) },
    { label: t('people'), icon: <PeopleIcon />, action: () => setPeopleOpen(true) },
    ...(canManageUsers ? [{ label: t('invitations'), icon: <MailIcon />, action: () => setInvitesOpen(true) }] : []),
    { label: t('alerts'), icon: <NotificationsIcon />, action: () => setAlertsOpen(true) },
    ...(isUS
      ? [{ label: t('bankConnections'), icon: <AccountBalanceIcon />, action: () => setBankConnectionsOpen(true) }]
      : []),
    // Not role-gated: these are the caller's own view settings, so a Viewer
    // gets them too.
    { label: t('preferences'), icon: <TuneIcon />, action: () => setPreferencesOpen(true) },
  ]

  const appItems: NavItem[] = [
    {
      label: t('settings'),
      icon: <SettingsIcon />,
      action: () => router.push({ pathname: '/settings', query: { from: budgetId } }),
      disabled: false,
    },
    // A shortcut to what the Settings page's own Help panel holds, not a
    // second copy of it — issue #60 asks for Help to be reachable from the
    // nav directly.
    {
      label: t('help'),
      icon: <HelpOutlineIcon />,
      action: () => router.push({ pathname: '/settings', query: { from: budgetId, section: 'help' } }),
      disabled: false,
    },
  ]

  const navItems = [...managementItems, ...appItems]

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {!isMobile && (
        <DesktopSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          budgetName={budgetName}
          iconSrc={iconSrc}
          navItems={navItems}
          onLogout={handleLogout}
          notificationBell={<NotificationBell budgetId={budgetId} />}
          periodSwitcher={
            <PeriodSwitcher
              budgetId={budgetId}
              periods={periods}
              currentPeriodId={shownPeriodId}
              collapsed={collapsed}
            />
          }
        />
      )}

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <MobileTopBar
            title={viewTitle}
            onOpenManage={() => setMobileManageOpen(true)}
            notificationBell={<NotificationBell budgetId={budgetId} />}
          />
        )}

        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
      </Box>

      <MobileManageDrawer
        open={mobileManageOpen}
        onClose={() => setMobileManageOpen(false)}
        budgetName={budgetName}
        iconSrc={iconSrc}
        managementItems={managementItems}
        appItems={appItems}
        onOpenPanel={openMobilePanel}
        onLogout={handleLogout}
        periodSwitcher={
          <PeriodSwitcher
            budgetId={budgetId}
            periods={periods}
            currentPeriodId={shownPeriodId}
            onNavigate={() => setMobileManageOpen(false)}
          />
        }
      />

      <ManagementDrawers
        open={{
          categories: categoriesOpen,
          people: peopleOpen,
          invites: invitesOpen,
          income: incomeOpen,
          savings: savingsOpen,
          paymentMethods: paymentMethodsOpen,
          alerts: alertsOpen,
          bankConnections: bankConnectionsOpen,
          preferences: preferencesOpen,
        }}
        onClose={{
          categories: () => setCategoriesOpen(false),
          people: () => setPeopleOpen(false),
          invites: () => setInvitesOpen(false),
          income: () => setIncomeOpen(false),
          savings: () => setSavingsOpen(false),
          paymentMethods: () => { setPaymentMethodsOpen(false); clearManageParam() },
          alerts: () => setAlertsOpen(false),
          bankConnections: () => setBankConnectionsOpen(false),
          preferences: () => setPreferencesOpen(false),
        }}
        budgetId={budgetId}
        canEdit={canEdit}
        canManageUsers={canManageUsers}
        showBeforeTax={isUS}
        activePeriodStart={activePeriodStart}
        activePeriodId={activePeriod?.id}
      />
    </Box>
  )
}
