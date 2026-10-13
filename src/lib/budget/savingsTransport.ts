import { SavingsSource } from '@/gen/wellspent/v1/budget_pb'
import { RecurringType } from '@/gen/wellspent/v1/common_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

/** Savings never recurs one-off, so this is missing from the `RecurringFrequency` union on purpose — included anyway for a safe fallback on an unrecognized value. */
const FREQUENCY_FROM_REST: Record<string, RecurringType> = {
  one_off: RecurringType.ONE_OFF,
  weekly: RecurringType.WEEKLY,
  bi_weekly: RecurringType.BI_WEEKLY,
  monthly: RecurringType.MONTHLY,
  yearly: RecurringType.YEARLY,
}

/** Normalizes the C# backend's REST `SavingsSource` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. `frequency` arrives as a plain derived string (never client-set), mapped onto the same `RecurringType` enum `FREQ_KEY` in `SavingsPanel.tsx` already keys off. */
export function savingsSourceFromRest(dto: components['schemas']['SavingsSource']): SavingsSource {
  return new SavingsSource({
    id: BigInt(dto.id),
    budgetProfileId: dto.budgetProfileId,
    name: dto.name,
    amount: moneyFromRest(dto.amount),
    frequency: FREQUENCY_FROM_REST[dto.frequency] ?? RecurringType.UNSPECIFIED,
    isTaxReserve: dto.isTaxReserve,
    budgetPersonId: BigInt(dto.budgetPersonId),
    federalAmount: dto.federalAmount ? moneyFromRest(dto.federalAmount) : undefined,
    stateAmount: dto.stateAmount ? moneyFromRest(dto.stateAmount) : undefined,
    paymentMethodId: dto.paymentMethodId ?? '',
    paymentDays: dto.paymentDays,
  })
}
