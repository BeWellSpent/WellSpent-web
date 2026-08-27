import { PaymentType } from '@/gen/wellspent/v1/common_pb'

export const PAYMENT_TYPE_KEYS: { value: PaymentType; key: string }[] = [
  { value: PaymentType.CASH, key: 'cash' },
  { value: PaymentType.CREDIT, key: 'credit' },
  { value: PaymentType.DEBIT, key: 'debit' },
  { value: PaymentType.DIGITAL_WALLET, key: 'digitalWallet' },
  { value: PaymentType.BANK_TRANSFER, key: 'bankTransfer' },
  { value: PaymentType.CRYPTO, key: 'crypto' },
  { value: PaymentType.INVESTMENT, key: 'investment' },
  // Offered everywhere a payment type is picked. The setup wizard used to
  // carry its own English-only copy of this list that included OTHER while
  // this one did not, so the two screens disagreed about what types exist.
  { value: PaymentType.OTHER, key: 'other' },
]
