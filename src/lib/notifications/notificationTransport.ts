import { Timestamp } from '@bufbuild/protobuf'
import { AlertSubscription, Notification } from '@/gen/wellspent/v1/notification_pb'
import type { components } from '@/gen/rest/schema'

/** Normalizes the C# backend's REST `Notification` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function notificationFromRest(dto: components['schemas']['Notification']): Notification {
  return new Notification({
    id: dto.id,
    userId: dto.userId,
    budgetProfileId: dto.budgetProfileId ?? '',
    alertType: dto.alertType,
    title: dto.title,
    body: dto.body ?? '',
    isRead: dto.isRead,
    createdAt: Timestamp.fromDate(new Date(dto.createdAt)),
  })
}

/** Same normalization for `AlertSubscription` — REST's nullable fields map to proto's zero-value sentinels. */
export function alertSubscriptionFromRest(dto: components['schemas']['AlertSubscription']): AlertSubscription {
  return new AlertSubscription({
    id: dto.id,
    userId: dto.userId,
    budgetProfileId: dto.budgetProfileId,
    alertType: dto.alertType,
    channel: dto.channel,
    thresholdPct: dto.thresholdPct ?? 0,
    thresholdScope: dto.thresholdScope ?? '',
    categoryId: dto.categoryId ?? 0,
    notifyAllMembers: dto.notifyAllMembers,
    createdAt: Timestamp.fromDate(new Date(dto.createdAt)),
  })
}
