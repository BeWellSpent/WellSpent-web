'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 420, p: 4, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          Create your account
        </Typography>
        <RegisterForm />
      </Box>
    </Box>
  )
}
