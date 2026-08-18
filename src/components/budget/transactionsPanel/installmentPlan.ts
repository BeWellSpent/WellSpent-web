import type { Transaction } from '@/gen/wellspent/v1/budget_pb'

/**
 * Client-side preview of an installment plan, mirroring `installmentAmount`
 * and `installmentEndDate` in the backend's `internal/service/installment_plan.go`
 * and `InstallmentPlan.swift` on iOS.
 *
 * Duplicated deliberately, and it is the one duplication this feature accepts:
 * the dialog has to show what each payment will be *before* anything exists to
 * ask the server about. Everything the user sees after creation comes from the
 * server's response, so drift can only ever affect the preview — but keep the
 * three in step anyway, and change them together.
 */

/**
 * A purchase split evenly across `payments`, rounded to the nearest cent.
 *
 * A fixed expense carries ONE planned amount that every payment inherits, so an
 * uneven total cannot be balanced by a larger final payment the way a card
 * issuer does it. $1,000 over 3 is $333.33 x 3 = $999.99, and that residue is
 * structural rather than a rounding bug.
 */
export function installmentAmount(total: number, payments: number): number {
  if (!Number.isFinite(total) || payments < 1) return 0
  return Math.round((total * 100) / payments) / 100
}

/** Whole cents the plan lands short of (negative) or over (positive) the purchase. */
export function installmentResidue(total: number, payments: number): number {
  return Math.round(installmentAmount(total, payments) * payments * 100 - total * 100)
}

/**
 * Default first payment: the same day of the month as the purchase, one month
 * later. A card charges the statement after the one you bought in, so a
 * purchase in August is first billed in September.
 *
 * Day 29-31 rolls into the following month here (JS Date behaviour) but the
 * backend clamps to the last day of a short month when the plan actually
 * spawns, so the stored anchor is what matters, not this preview.
 */
export function defaultFirstPaymentDate(purchase: Date): Date {
  return new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + 1, purchase.getUTCDate()))
}

/** Date of the LAST payment — first payment plus one month per remaining payment. */
export function installmentEndDate(firstPayment: Date, payments: number): Date {
  return new Date(Date.UTC(
    firstPayment.getUTCFullYear(),
    firstPayment.getUTCMonth() + Math.max(payments - 1, 0),
    firstPayment.getUTCDate(),
  ))
}

/** Payment count implied by an end date, so the two fields can be edited either way. */
export function installmentPaymentsFromEndDate(firstPayment: Date, endDate: Date): number {
  const months = (endDate.getUTCFullYear() - firstPayment.getUTCFullYear()) * 12
    + (endDate.getUTCMonth() - firstPayment.getUTCMonth())
  return Math.max(months + 1, 1)
}

/**
 * Whether a row can be split into installments: a variable spend that isn't
 * already a plan. Mirrors the backend's guards in `CreateInstallmentPlan`, so
 * the action isn't offered where the RPC would refuse it.
 */
export function canSplitIntoInstallments(tx: Transaction, amount: number): boolean {
  if (tx.transactionTypeId === 1) return false // Fixed is already the recurring thing
  if (tx.installmentFixedExpenseId) return false
  return amount > 0 // a negative amount is money received
}

/** `YYYY-MM-DD` for a native date input, in UTC to match the DATE-only wire format. */
export function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function fromDateInputValue(v: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  const d = new Date(`${v}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? undefined : d
}
