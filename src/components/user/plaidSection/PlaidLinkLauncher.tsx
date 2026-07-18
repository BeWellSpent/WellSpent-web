'use client'

import { useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'

// Mounts only when the parent has a linkToken; auto-opens Plaid Link.
// Used for both a fresh connect and an update-mode (account selection)
// session — the parent decides what onSuccess means for each.
export function PlaidLinkLauncher({
  token,
  onSuccess,
  onExit,
}: {
  token: string
  onSuccess: (publicToken: string) => void
  onExit: () => void
}) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (public_token) => onSuccess(public_token),
    onExit: () => onExit(),
  })

  useEffect(() => {
    if (ready) open()
  }, [ready, open])

  return null
}
