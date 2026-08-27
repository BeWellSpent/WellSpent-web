import { useMemo, useState } from 'react'

/** A savings source pays out 1×, 2× or 4× a month; the count is the frequency. */
const VALID_DAY_COUNTS = new Set([1, 2, 4])
const MAX_PAYMENT_DAYS = 4

/**
 * Form state for one savings source, shared by the Add dialog and the setup
 * wizard's savings step.
 *
 * Extracted rather than copied: the two surfaces validate the same thing (a
 * name, a positive amount, a payment method, and a legal number of payment
 * days), and a second hand-written copy is exactly how one of them ends up
 * accepting three payment days while the other rejects them.
 */
export function useSavingsSourceDraft(activePeriodStart?: Date) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [paymentDays, setPaymentDays] = useState<number[]>([])

  function toggleDay(day: number) {
    setPaymentDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day).sort((a, b) => a - b)
      if (prev.length >= MAX_PAYMENT_DAYS) return prev
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  function reset() {
    setName('')
    setAmount('')
    setPaymentDays([])
    // paymentMethodId is deliberately kept: adding several savings sources in
    // a row during setup almost always means the same account.
  }

  /**
   * Days offered by the picker. February has 28, so a period starting there
   * must not offer a 31st that can never come round.
   */
  const daysInMonth = useMemo(() => {
    const ref = activePeriodStart ?? new Date()
    return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  }, [activePeriodStart])

  const isValid =
    name.trim() !== '' &&
    amount !== '' &&
    Number(amount) > 0 &&
    paymentMethodId !== '' &&
    VALID_DAY_COUNTS.has(paymentDays.length)

  return {
    name, setName,
    amount, setAmount,
    paymentMethodId, setPaymentMethodId,
    paymentDays, toggleDay,
    daysInMonth,
    isValid,
    reset,
  }
}

/**
 * Splits a decimal string into proto `Money` units and nanos.
 *
 * Kept away from `parseFloat` arithmetic on the fractional part: `19.99` is
 * not exactly representable in binary floating point, and rounding the
 * remainder produced off-by-one nanos on the backend's own conversion path
 * (see `convert.go`'s big.Int fix). Splitting the string never has that
 * problem.
 */
export function moneyFromDecimalString(value: string): { units: bigint; nanos: number } {
  const [wholePart = '0', fractionPart = ''] = value.trim().split('.')
  const negative = wholePart.startsWith('-')
  const digits = (fractionPart + '000000000').slice(0, 9)
  const units = BigInt(wholePart || '0')
  const nanos = Number(digits) * (negative ? -1 : 1)
  return { units, nanos }
}
