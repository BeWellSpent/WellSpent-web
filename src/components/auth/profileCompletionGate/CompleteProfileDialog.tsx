'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { FilingStatus } from '@/gen/wellspent/v1/common_pb'
import { UserService } from '@/gen/wellspent/v1/user_connect'
import { useClient } from '@/hooks/useClient'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useCountries } from '@/hooks/useCountries'
import { ME_QUERY_KEY } from '@/hooks/useMe'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { US_STATES, FILING_STATUS_OPTIONS } from '@/lib/profile/usProfileOptions'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { LoadingButton } from '@/components/ui/LoadingButton'

interface Props {
  firstName: string
  lastName: string
  language: string
  currency: string
}

/**
 * Collects the profile fields a social sign-up never had the chance to give.
 *
 * Non-dismissible, like the email verification gate it sits beside: the app
 * cannot compute a tax reserve or offer before-tax income without a country,
 * and a budget created in the meantime inherits the gap for good.
 *
 * Language and currency are absent on purpose — the OAuth callback already
 * sends both from the browser, so they are never missing. Asking again would
 * be a question with a known answer.
 */
export function CompleteProfileDialog({ firstName, lastName, language, currency }: Props) {
  const t = useTranslations('auth.completeProfile')
  const fullScreen = useIsMobile()
  const { showError } = useSnackbar()
  const queryClient = useQueryClient()
  const { countries, isLoading: countriesLoading } = useCountries()

  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(FilingStatus.UNSPECIFIED)

  const client = useClient(UserService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      client.updateMe({
        firstName,
        lastName,
        countryCode,
        stateCode,
        filingStatus,
        taxPaymentFrequency: 0,
        language,
        currency,
      }),
  })

  const isUS = countryCode === 'US'

  async function handleSave() {
    if (!countryCode) return
    try {
      await mutateAsync()
      logger.info('user.profile.completed', { countryCode })
      // Same key the gate reads. Split these and the gate never dismisses.
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DialogContentText>{t('body')}</DialogContentText>

          <FormControl fullWidth size="small" disabled={countriesLoading}>
            <InputLabel>{t('country')}</InputLabel>
            <Select
              label={t('country')}
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value)
                // A state only means something inside the US; carrying one
                // across a country change would store a contradiction.
                setStateCode('')
                setFilingStatus(FilingStatus.UNSPECIFIED)
              }}
            >
              {countries.map((c) => (
                <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {isUS && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel>{t('state')}</InputLabel>
                <Select label={t('state')} value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
                  {US_STATES.map(([code, name]) => (
                    <MenuItem key={code} value={code}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>{t('filingStatus')}</InputLabel>
                <Select
                  label={t('filingStatus')}
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                >
                  <MenuItem value={FilingStatus.UNSPECIFIED}>{t('notSet')}</MenuItem>
                  {FILING_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <LoadingButton variant="contained" onClick={handleSave} disabled={!countryCode} loading={isPending}>
          {t('submit')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
