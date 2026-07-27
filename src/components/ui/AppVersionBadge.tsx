import Typography from '@mui/material/Typography'
import { APP_VERSION } from '@/lib/version'

interface Props {
  /** Extra top margin. Defaults to 1 (8px). */
  mt?: number | string
}

/** Displays the current app version in a subtle caption at the bottom of a layout section. */
export function AppVersionBadge({ mt = 1 }: Props) {
  return (
    <Typography
      variant="caption"
      display="block"
      textAlign="center"
      color="text.disabled"
      sx={{ mt, pb: 1, userSelect: 'none' }}
    >
      {APP_VERSION}
    </Typography>
  )
}
