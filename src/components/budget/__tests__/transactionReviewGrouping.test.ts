import { groupPendingReviews } from '../transactionReviewGrouping'
import type { TransactionReview } from '@/gen/wellspent/v1/budget_pb'

function review(id: string, matchedTransactionId: string, matchedTransactionName = 'Rent'): TransactionReview {
  return {
    id,
    matchedTransactionId,
    matchedTransactionName,
    matchedTransactionPersonId: 0n,
  } as TransactionReview
}

describe('groupPendingReviews', () => {
  it('returns one group per distinct matched transaction', () => {
    const groups = groupPendingReviews([review('r1', 'fixed-1'), review('r2', 'fixed-2')])
    expect(groups).toHaveLength(2)
  })

  it('groups several reviews matched to the same fixed transaction together', () => {
    const groups = groupPendingReviews([review('r1', 'fixed-1'), review('r2', 'fixed-1'), review('r3', 'fixed-1')])
    expect(groups).toHaveLength(1)
    expect(groups[0].reviews.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
  })

  it('preserves first-seen order of matched transactions', () => {
    const groups = groupPendingReviews([review('r1', 'fixed-2'), review('r2', 'fixed-1'), review('r3', 'fixed-2')])
    expect(groups.map((g) => g.matchedTransactionId)).toEqual(['fixed-2', 'fixed-1'])
  })

  it('returns an empty array for no reviews', () => {
    expect(groupPendingReviews([])).toEqual([])
  })
})
