import createNextIntlPlugin from 'next-intl/plugin'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  allowedDevOrigins: ['192.168.68.69'],
  // The old feature pages and web-app routes are gone; send their links to the right section.
  async redirects() {
    return [
      { source: '/:locale(en|es)/features/:path*', destination: '/:locale#features', permanent: true },
      { source: '/:locale(en|es)/(budgets|settings|login|register)/:path*', destination: '/:locale#download', permanent: false },
      { source: '/:locale(en|es)/(budgets|settings|login|register)', destination: '/:locale#download', permanent: false },
    ]
  },
}

export default withNextIntl(nextConfig)
