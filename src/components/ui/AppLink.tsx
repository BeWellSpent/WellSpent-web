'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import MuiLink, { type LinkProps } from '@mui/material/Link'
import Button, { type ButtonProps } from '@mui/material/Button'

/**
 * MUI link and button that navigate with Next's client-side router, and are
 * safe to render **from a server component**.
 *
 * MUI's usual `component={NextLink}` pattern passes a function as a prop. A
 * server component may not do that — React cannot serialise a function across
 * the boundary and the render fails with "Functions cannot be passed directly
 * to Client Components". Doing the wiring inside this client module means the
 * function never crosses the boundary at all.
 *
 * In a component that already carries `'use client'`, keep using
 * `component={NextLink}` directly — this wrapper exists for the server case.
 */
type AppLinkProps = Omit<LinkProps, 'component' | 'href'> & {
  href: string
  children: ReactNode
}

export function AppLink({ href, children, ...props }: AppLinkProps) {
  return (
    <MuiLink component={NextLink} href={href} {...props}>
      {children}
    </MuiLink>
  )
}

// ButtonProps defaults to the <button> element, whose event-handler types
// clash with the anchor MUI actually renders here; ButtonProps<'a'> picks the
// anchor overload.
type AppLinkButtonProps = Omit<ButtonProps<'a'>, 'component' | 'href'> & {
  href: string
  children: ReactNode
}

export function AppLinkButton({ href, children, ...props }: AppLinkButtonProps) {
  return (
    <Button component={NextLink} href={href} {...props}>
      {children}
    </Button>
  )
}
