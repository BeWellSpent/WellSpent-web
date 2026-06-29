'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { UserService } from '@/gen/spendsense/v1/user_connect'
import { FilingStatus, TaxPaymentFrequency } from '@/gen/spendsense/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'District of Columbia'],
]

const FILING_STATUS_OPTIONS = [
  { value: FilingStatus.SINGLE, label: 'Single' },
  { value: FilingStatus.MARRIED_FILING_JOINTLY, label: 'Married Filing Jointly' },
  { value: FilingStatus.MARRIED_FILING_SEPARATELY, label: 'Married Filing Separately' },
  { value: FilingStatus.HEAD_OF_HOUSEHOLD, label: 'Head of Household' },
  { value: FilingStatus.QUALIFYING_SURVIVING_SPOUSE, label: 'Qualifying Surviving Spouse' },
]

const TAX_FREQUENCY_OPTIONS = [
  { value: TaxPaymentFrequency.MONTHLY, label: 'Monthly' },
  { value: TaxPaymentFrequency.QUARTERLY, label: 'Quarterly (every 3 months)' },
  { value: TaxPaymentFrequency.FOUR_MONTHLY, label: 'Every 4 months' },
  { value: TaxPaymentFrequency.SEMI_ANNUAL, label: 'Semi-annual (every 6 months)' },
  { value: TaxPaymentFrequency.ANNUAL, label: 'Annual' },
]

export function ProfileSettings() {
  const client = useClient(UserService)
  const { showError } = useSnackbar()
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.getMe({}),
  })
  const user = data?.user

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(FilingStatus.UNSPECIFIED)
  const [taxFrequency, setTaxFrequency] = useState<TaxPaymentFrequency>(TaxPaymentFrequency.UNSPECIFIED)
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setCountryCode(user.countryCode)
      setStateCode(user.stateCode)
      setFilingStatus(user.filingStatus)
      setTaxFrequency(user.taxPaymentFrequency)
    }
  }, [user])

  useEffect(() => {
    client.listCountries({}).then((res) => {
      setCountries(res.countries.map((c) => ({ code: c.code, name: c.name })))
    }).catch((err) => {
      logger.error('settings.listCountries.failed', { error: err instanceof Error ? err.message : String(err) })
    }).finally(() => {
      setCountriesLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      client.updateMe({ firstName, lastName, countryCode, stateCode, filingStatus, taxPaymentFrequency: taxFrequency }),
  })

  async function handleSave() {
    try {
      await mutateAsync()
      logger.info('user.profile.update')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) return <CircularProgress size={24} />

  const isUS = countryCode === 'US'

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Profile</Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
          />
        </Stack>

        <TextField
          label="Email"
          value={user?.email ?? ''}
          fullWidth
          disabled
          helperText="Email cannot be changed"
        />

        <FormControl fullWidth size="small" disabled={countriesLoading}>
          <InputLabel>Country</InputLabel>
          <Select
            label="Country"
            value={countryCode}
            onChange={(e) => { setCountryCode(e.target.value); setStateCode('') }}
            endAdornment={
              countriesLoading ? (
                <InputAdornment position="end" sx={{ mr: 3 }}>
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined
            }
          >
            <MenuItem value="">— Not set —</MenuItem>
            {countries.map((c) => (
              <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {isUS && (
          <FormControl fullWidth size="small">
            <InputLabel>State</InputLabel>
            <Select
              label="State"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            >
              <MenuItem value="">— Not set —</MenuItem>
              {US_STATES.map(([code, name]) => (
                <MenuItem key={code} value={code}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {isUS && (
          <>
            <Divider>
              <Typography variant="caption" color="text.secondary">Tax settings (US)</Typography>
            </Divider>

            <FormControl fullWidth size="small">
              <InputLabel>Filing status</InputLabel>
              <Select
                label="Filing status"
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
              >
                <MenuItem value={FilingStatus.UNSPECIFIED}>— Not set —</MenuItem>
                {FILING_STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Tax payment frequency</InputLabel>
              <Select
                label="Tax payment frequency"
                value={taxFrequency}
                onChange={(e) => setTaxFrequency(e.target.value as TaxPaymentFrequency)}
              >
                <MenuItem value={TaxPaymentFrequency.UNSPECIFIED}>— Not set —</MenuItem>
                {TAX_FREQUENCY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              These settings are used to estimate your tax reserve savings each budget period.
            </Typography>
          </>
        )}

        {saved && <Alert severity="success">Profile saved.</Alert>}

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Stack>
    </Box>
  )
}
