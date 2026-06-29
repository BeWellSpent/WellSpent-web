'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@connectrpc/connect'
import { AuthService } from '@/gen/spendsense/v1/auth_connect'
import { UserService } from '@/gen/spendsense/v1/user_connect'
import { publicTransport } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { isEnabled } from '@/lib/config/features'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

const authClient = createClient(AuthService, publicTransport)
const userClient = createClient(UserService, publicTransport)

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

export function RegisterForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([
    { code: 'AR', name: 'Argentina' },
    { code: 'ES', name: 'Spain' },
    { code: 'US', name: 'United States' },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    userClient.listCountries({}).then((res) => {
      if (res.countries.length > 0) {
        setCountries(res.countries.map((c) => ({ code: c.code, name: c.name })))
      }
    }).catch((err) => {
      logger.error('register.listCountries.failed', { error: err instanceof Error ? err.message : String(err) })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authClient.register({ firstName, lastName, email, password, countryCode, stateCode })
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: res.accessToken }),
      })
      logger.info('auth.register')
      router.push('/budgets')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      logger.error('auth.register.failed', { error: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
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
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        autoComplete="email"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        helperText="8+ characters with uppercase, lowercase, digit, and special character"
      />

      {countries.length > 0 && (
        <FormControl fullWidth size="small">
          <InputLabel>Country</InputLabel>
          <Select
            label="Country"
            value={countryCode}
            onChange={(e) => { setCountryCode(e.target.value); setStateCode('') }}
          >
            <MenuItem value="">Prefer not to say</MenuItem>
            {countries.map((c) => (
              <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {countryCode === 'US' && (
        <FormControl fullWidth size="small">
          <InputLabel>State</InputLabel>
          <Select
            label="State"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          >
            <MenuItem value="">— Select state —</MenuItem>
            {US_STATES.map(([code, name]) => (
              <MenuItem key={code} value={code}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" fullWidth disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </Button>

      <Divider>or</Divider>

      <Tooltip title="Google sign-in is not available yet" placement="top">
        <span>
          <Button
            variant="outlined"
            fullWidth
            disabled={!isEnabled('googleAuth')}
            sx={{ pointerEvents: isEnabled('googleAuth') ? 'auto' : 'none', opacity: 0.5 }}
          >
            Continue with Google
          </Button>
        </span>
      </Tooltip>

      <Typography variant="body2" textAlign="center">
        Already have an account?{' '}
        <Link component={NextLink} href="/login">
          Sign in
        </Link>
      </Typography>
    </Stack>
  )
}
