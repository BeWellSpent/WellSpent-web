import Container from '@mui/material/Container'
import { ProfileSettings } from '@/components/user/ProfileSettings'
import { AppVersionBadge } from '@/components/ui/AppVersionBadge'
import { HelpPanel } from '@/components/help/HelpPanel'

export default function SettingsPage() {
  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ProfileSettings />
        <HelpPanel />
        <AppVersionBadge mt={4} />
      </Container>
    </>
  )
}
