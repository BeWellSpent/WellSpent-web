import { PaymentType } from '@/gen/wellspent/v1/common_pb'
import { paymentMethodFromRest, paymentTypeToRest } from '../paymentMethodTransport'

describe('paymentMethodFromRest', () => {
  it('normalizes a REST payment method, converting int64 budgetPersonId to bigint', () => {
    const method = paymentMethodFromRest({
      id: 'pm1', name: 'Chase Visa', type: 'credit', budgetPersonId: 3, color: '#000', alias: 'Main card',
    })
    expect(method.type).toBe(PaymentType.CREDIT)
    expect(method.budgetPersonId).toBe(3n)
    expect(method.alias).toBe('Main card')
  })
})

describe('paymentTypeToRest', () => {
  it('maps every known proto payment type to its REST string', () => {
    expect(paymentTypeToRest(PaymentType.CASH)).toBe('cash')
    expect(paymentTypeToRest(PaymentType.CREDIT)).toBe('credit')
    expect(paymentTypeToRest(PaymentType.DEBIT)).toBe('debit')
    expect(paymentTypeToRest(PaymentType.DIGITAL_WALLET)).toBe('digital_wallet')
    expect(paymentTypeToRest(PaymentType.BANK_TRANSFER)).toBe('bank_transfer')
    expect(paymentTypeToRest(PaymentType.CRYPTO)).toBe('crypto')
    expect(paymentTypeToRest(PaymentType.INVESTMENT)).toBe('investment')
    expect(paymentTypeToRest(PaymentType.OTHER)).toBe('other')
  })

  it('falls back to "unspecified" for UNSPECIFIED', () => {
    expect(paymentTypeToRest(PaymentType.UNSPECIFIED)).toBe('unspecified')
  })
})
