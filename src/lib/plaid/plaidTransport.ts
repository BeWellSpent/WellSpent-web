import { Timestamp } from '@bufbuild/protobuf'
import { BudgetSyncWarning, PlaidConnection } from '@/gen/wellspent/v1/plaid_pb'
import type { components } from '@/gen/rest/schema'

/** Normalizes the C# backend's REST `PlaidConnection` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. `status`/`expiration`-shaped fields are already plain strings on both sides; only the two nullable timestamps need converting. */
export function plaidConnectionFromRest(dto: components['schemas']['PlaidConnection']): PlaidConnection {
  return new PlaidConnection({
    id: dto.id,
    institutionId: dto.institutionId,
    institutionName: dto.institutionName,
    status: dto.status,
    lastSyncedAt: dto.lastSyncedAt ? Timestamp.fromDate(new Date(dto.lastSyncedAt)) : undefined,
    budgetProfileId: dto.budgetProfileId,
    ownerName: dto.ownerName,
    isOwner: dto.isOwner,
    syncEnabled: dto.syncEnabled,
    resyncAvailableAt: dto.resyncAvailableAt ? Timestamp.fromDate(new Date(dto.resyncAvailableAt)) : undefined,
  })
}

export function syncWarningFromRest(dto: components['schemas']['BudgetSyncWarning']): BudgetSyncWarning {
  return new BudgetSyncWarning({
    budgetProfileId: dto.budgetProfileId,
    budgetName: dto.budgetName,
    memberName: dto.memberName,
    connectionCount: dto.connectionCount,
    isCurrentUser: dto.isCurrentUser,
  })
}
