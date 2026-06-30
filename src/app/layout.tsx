import type { Metadata } from 'next'
import { ThemeRegistry } from '@/components/ui/ThemeRegistry'

export const metadata: Metadata = {
  title: 'SpendSense',
  description: 'Income-first budgeting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
