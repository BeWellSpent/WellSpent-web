'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
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

const COLLAPSED_KEY = 'sidebar-collapsed'

interface Props {
  budgetId: string
  children: React.ReactNode
}

export function BudgetSidebar({ budgetId, children }: Props) {
  const t = useTranslations('budget.sidebar')
  const router = useRouter()
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
  const [mobileManageOpen, setMobileManageOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  const { effective } = useThemeMode()

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true')
    setThemeMounted(true)
  }, [])

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
  const { period: activePeriod } = useResolvedPeriod(budgetId, undefined, !!data)

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

  function goToBudgets() {
    router.push('/budgets')
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
  ]

  const appItems: NavItem[] = [
    {
      label: t('settings'),
      icon: <SettingsIcon />,
      action: () => router.push({ pathname: '/settings', query: { from: budgetId } }),
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
          onBackToBudgets={goToBudgets}
          onLogout={handleLogout}
          notificationBell={<NotificationBell budgetId={budgetId} />}
        />
      )}

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <MobileTopBar
            iconSrc={iconSrc}
            onBackToBudgets={goToBudgets}
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
        }}
        onClose={{
          categories: () => setCategoriesOpen(false),
          people: () => setPeopleOpen(false),
          invites: () => setInvitesOpen(false),
          income: () => setIncomeOpen(false),
          savings: () => setSavingsOpen(false),
          paymentMethods: () => setPaymentMethodsOpen(false),
          alerts: () => setAlertsOpen(false),
          bankConnections: () => setBankConnectionsOpen(false),
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
