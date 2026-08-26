import type { components } from '@/gen/rest/schema'

/**
 * Named aliases for the REST contract's schemas, so components import a type
 * rather than indexing into the generated `components['schemas'][...]` tree.
 *
 * The equivalent of importing from `@/gen/wellspent/v1/*_pb` on the Connect
 * side. These are types only — there are no runtime enum objects, because the
 * contract's enums are string unions ('info' | 'warning' | 'critical'), which
 * is also why they read the same as the values stored in the database.
 */
export type StatusBanner = components['schemas']['StatusBanner']
export type StatusBannerSeverity = components['schemas']['StatusBannerSeverity']
export type ChangeType = components['schemas']['ChangeType']
export type ChangelogRelease = components['schemas']['ChangelogRelease']
export type ChangelogComponent = components['schemas']['ChangelogComponent']
