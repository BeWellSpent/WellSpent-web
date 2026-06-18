'use client'

import { useMemo } from 'react'
import { useTransport } from '@connectrpc/connect-query'
import { createClient } from '@connectrpc/connect'
import type { ServiceType } from '@bufbuild/protobuf'

export function useClient<T extends ServiceType>(service: T) {
  const transport = useTransport()
  return useMemo(() => createClient(service, transport), [service, transport])
}
