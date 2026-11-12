import type { SvgIconComponent } from '@mui/icons-material'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined'
import BarChartOutlined from '@mui/icons-material/BarChartOutlined'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import type { FeatureGroupKey } from './featureGroups'

/** Each group's icon and tint, the tile treatment the app's More sheet uses. */
export const FEATURE_GROUP_ICONS: Record<FeatureGroupKey, { Icon: SvgIconComponent; tint: string }> = {
  home: { Icon: HomeOutlined, tint: '#2F4BD8' },
  plan: { Icon: EventNoteOutlined, tint: '#0B7A4B' },
  transactions: { Icon: ReceiptLongOutlined, tint: '#A15C07' },
  bank: { Icon: AccountBalanceOutlined, tint: '#5D6679' },
  reports: { Icon: BarChartOutlined, tint: '#6B4FD0' },
  together: { Icon: GroupOutlined, tint: '#C2361F' },
}
