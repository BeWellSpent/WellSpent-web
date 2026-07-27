import createNextIntlPlugin from 'next-intl/plugin'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  allowedDevOrigins: ['192.168.68.52'],
  serverExternalPackages: [],
  // extensionAlias is needed for buf-generated proto files that import .pb.js but the actual files are .ts
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }
    return config
  },
}

export default withNextIntl(nextConfig)
