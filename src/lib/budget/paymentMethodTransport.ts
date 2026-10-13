import { PaymentMethod } from '@/gen/wellspent/v1/budget_pb'
import { PaymentType } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

type RestPaymentType = components['schemas']['PaymentType']

const PAYMENT_TYPE_FROM_REST: Record<RestPaymentType, PaymentType> = {
  unspecified: PaymentType.UNSPECIFIED,
  cash: PaymentType.CASH,
  credit: PaymentType.CREDIT,
  debit: PaymentType.DEBIT,
  digital_wallet: PaymentType.DIGITAL_WALLET,
  bank_transfer: PaymentType.BANK_TRANSFER,
  crypto: PaymentType.CRYPTO,
  investment: PaymentType.INVESTMENT,
  other: PaymentType.OTHER,
}

const PAYMENT_TYPE_TO_REST: Partial<Record<PaymentType, RestPaymentType>> = {
  [PaymentType.CASH]: 'cash',
  [PaymentType.CREDIT]: 'credit',
  [PaymentType.DEBIT]: 'debit',
  [PaymentType.DIGITAL_WALLET]: 'digital_wallet',
  [PaymentType.BANK_TRANSFER]: 'bank_transfer',
  [PaymentType.CRYPTO]: 'crypto',
  [PaymentType.INVESTMENT]: 'investment',
  [PaymentType.OTHER]: 'other',
}

/** Immutable after creation (see `UpdatePaymentMethodRequest`, which has no `type` field), so this is only ever called on create. */
export function paymentTypeToRest(type: PaymentType): RestPaymentType {
  return PAYMENT_TYPE_TO_REST[type] ?? 'unspecified'
}

/** Normalizes the C# backend's REST `PaymentMethod` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function paymentMethodFromRest(dto: components['schemas']['PaymentMethod']): PaymentMethod {
  return new PaymentMethod({
    id: dto.id,
    name: dto.name,
    type: PAYMENT_TYPE_FROM_REST[dto.type],
    budgetPersonId: BigInt(dto.budgetPersonId),
    color: dto.color,
    alias: dto.alias,
  })
}
