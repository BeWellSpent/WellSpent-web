import { Timestamp } from '@bufbuild/protobuf'
import { TransactionReview } from '@/gen/wellspent/v1/budget_pb'
import { moneyFromRest } from '@/lib/api/money'
import type { components } from '@/gen/rest/schema'

/** Normalizes the C# backend's REST `TransactionReview` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. `status` is a plain string on both transports, no enum mapping needed. `fixedExpenseId`/`fixedExpenseName` are deprecated wire-compat fields REST never populates — left empty, matching what Connect already sends for them today. */
export function transactionReviewFromRest(dto: components['schemas']['TransactionReview']): TransactionReview {
  return new TransactionReview({
    id: dto.id,
    budgetPeriodId: dto.budgetPeriodId,
    transactionId: dto.transactionId,
    matchScore: dto.matchScore,
    status: dto.status,
    transactionName: dto.transactionName ?? '',
    transactionAmount: moneyFromRest(dto.transactionAmount),
    createdAt: Timestamp.fromDate(new Date(dto.createdAt)),
    matchedTransactionId: dto.matchedTransactionId,
    matchedTransactionName: dto.matchedTransactionName ?? '',
    transactionPersonId: BigInt(dto.transactionPersonId),
    matchedTransactionPersonId: BigInt(dto.matchedTransactionPersonId),
  })
}
