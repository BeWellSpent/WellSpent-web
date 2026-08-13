import type { ReactNode } from 'react'
import DonutLargeIcon from '@mui/icons-material/DonutLarge'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import BarChartIcon from '@mui/icons-material/BarChart'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

/**
 * Group icons live here rather than in `featureGroups.ts` so that file stays
 * plain data — the nav dropdown imports it and has no use for JSX.
 */
export const FEATURE_GROUP_ICONS: Record<string, ReactNode> = {
  plan: <DonutLargeIcon fontSize="large" />,
  transactions: <ReceiptLongIcon fontSize="large" />,
  reports: <BarChartIcon fontSize="large" />,
  budget: <AccountBalanceWalletIcon fontSize="large" />,
}
