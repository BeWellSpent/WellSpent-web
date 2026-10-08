import type { TransactionReview } from '@/gen/wellspent/v1/budget_pb'

export interface ReviewGroup {
  matchedTransactionId: string
  matchedTransactionName: string
  matchedTransactionPersonId: bigint
  reviews: TransactionReview[]
}

/** Groups pending reviews by matched (fixed) transaction — a split match shows as one row. */
export function groupPendingReviews(reviews: TransactionReview[]): ReviewGroup[] {
  const groups = new Map<string, ReviewGroup>()
  for (const review of reviews) {
    const existing = groups.get(review.matchedTransactionId)
    if (existing) {
      existing.reviews.push(review)
    } else {
      groups.set(review.matchedTransactionId, {
        matchedTransactionId: review.matchedTransactionId,
        matchedTransactionName: review.matchedTransactionName,
        matchedTransactionPersonId: review.matchedTransactionPersonId,
        reviews: [review],
      })
    }
  }
  return Array.from(groups.values())
}
