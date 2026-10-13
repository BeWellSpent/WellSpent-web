import { Money } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

/**
 * `Money` is identical on both transports field-for-field except `units`,
 * which is `bigint` on proto and `number` on REST (both int64 in practice).
 * Shared here rather than in a per-domain transport file since every domain
 * with a money amount (Income, Savings, Transactions, Allocations, …) needs
 * the same conversion.
 */
export function moneyFromRest(dto: components['schemas']['Money']): Money {
  return new Money({ units: BigInt(dto.units), nanos: dto.nanos, currency: dto.currency })
}

export function moneyToRest(money: Money | undefined): components['schemas']['Money'] {
  return { units: Number(money?.units ?? 0n), nanos: money?.nanos ?? 0, currency: money?.currency ?? '' }
}
