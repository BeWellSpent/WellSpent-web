import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const LOCALES = ['en', 'es'] as const

/**
 * Every literal translation key used in the app must resolve in every locale.
 *
 * A missing key throws `MISSING_MESSAGE` at render time — it type-checks and
 * lints clean, so neither `npm run build` nor `npm run lint` catches it, and it
 * only surfaces when someone opens the page. `BudgetList` shipped a call to a
 * non-existent `auth.logout` exactly that way.
 *
 * Only literal keys are checked. Keys built from template literals (the
 * feature groups, showcase items) are invisible here by construction —
 * `featureGroups.test.ts` covers those by walking the data they're built from.
 */

function loadMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

function walkSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      // Generated proto clients carry no translations.
      if (entry === 'gen') continue
      walkSourceFiles(path, out)
    } else if (/\.tsx?$/.test(entry)) {
      out.push(path)
    }
  }
  return out
}

function resolve(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part]
    return undefined
  }, root)
}

/** Namespaced keys referenced with a string literal, as `namespace.key`. */
function collectLiteralKeys(source: string): string[] {
  const namespaces = new Map<string, string>()
  const hook = /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*'([^']+)'\s*\)/g
  for (const [, variable, namespace] of source.matchAll(hook)) {
    namespaces.set(variable, namespace)
  }

  const keys: string[] = []
  for (const [variable, namespace] of namespaces) {
    const call = new RegExp(String.raw`\b${variable}\(\s*'([^']+)'`, 'g')
    for (const [, key] of source.matchAll(call)) {
      keys.push(`${namespace}.${key}`)
    }
  }
  return keys
}

describe('translation keys', () => {
  const usages = walkSourceFiles(join(process.cwd(), 'src')).flatMap((file) =>
    collectLiteralKeys(readFileSync(file, 'utf-8')).map((key) => ({ file, key })),
  )

  it('finds keys to check, so a broken matcher fails loudly rather than passing empty', () => {
    expect(usages.length).toBeGreaterThan(50)
  })

  it.each(LOCALES)('resolves every literal key in %s', (locale) => {
    const messages = loadMessages(locale)
    const missing = usages
      .filter(({ key }) => typeof resolve(messages, key) !== 'string')
      .map(({ file, key }) => `${key} (${file.replace(process.cwd(), '.')})`)
    expect(missing).toEqual([])
  })
})

describe('locale parity', () => {
  function flatten(node: unknown, prefix = ''): string[] {
    if (typeof node !== 'object' || node === null) return [prefix]
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      flatten(value, prefix ? `${prefix}.${key}` : key),
    )
  }

  it('has identical key structure across every locale', () => {
    const [reference, ...rest] = LOCALES.map((locale) => ({
      locale,
      keys: new Set(flatten(loadMessages(locale))),
    }))
    for (const other of rest) {
      const onlyInReference = [...reference.keys].filter((k) => !other.keys.has(k))
      const onlyInOther = [...other.keys].filter((k) => !reference.keys.has(k))
      expect({ [`only in ${reference.locale}`]: onlyInReference, [`only in ${other.locale}`]: onlyInOther }).toEqual({
        [`only in ${reference.locale}`]: [],
        [`only in ${other.locale}`]: [],
      })
    }
  })
})
