import { transactionReviewFromRest } from '../transactionReviewTransport'

describe('transactionReviewFromRest', () => {
  it('normalizes a REST transaction review, converting int64 person ids to bigint and the date-time string to a timestamp', () => {
    const review = transactionReviewFromRest({
      id: 'r1', budgetPeriodId: 'p1', transactionId: 't1', matchedTransactionId: 'mt1',
      matchScore: 92.5, status: 'pending', createdAt: '2026-10-13T12:00:00Z',
      transactionName: 'Payroll', transactionAmount: { units: 1200, nanos: 0, currency: 'USD' },
      matchedTransactionName: 'Rent', transactionPersonId: 1, matchedTransactionPersonId: 2,
    })
    expect(review.status).toBe('pending')
    expect(review.matchScore).toBe(92.5)
    expect(review.transactionPersonId).toBe(1n)
    expect(review.matchedTransactionPersonId).toBe(2n)
    expect(review.createdAt?.toDate().toISOString()).toBe('2026-10-13T12:00:00.000Z')
  })

  it('falls back to empty strings for nullish display names', () => {
    const review = transactionReviewFromRest({
      id: 'r2', budgetPeriodId: 'p1', transactionId: 't2', matchedTransactionId: 'mt2',
      matchScore: 85, status: 'confirmed', createdAt: '2026-10-10T00:00:00Z',
      transactionName: null, transactionAmount: { units: 50, nanos: 0, currency: 'USD' },
      matchedTransactionName: null, transactionPersonId: 0, matchedTransactionPersonId: 0,
    })
    expect(review.transactionName).toBe('')
    expect(review.matchedTransactionName).toBe('')
    expect(review.transactionPersonId).toBe(0n)
  })
})
