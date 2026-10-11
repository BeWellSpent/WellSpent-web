import { Timestamp } from '@bufbuild/protobuf'
import { BudgetInvite, InviteStatus } from '@/gen/wellspent/v1/invite_pb'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

type RestRole = components['schemas']['BudgetInviteRole']
type RestStatus = components['schemas']['InviteStatus']

const ROLE_FROM_REST: Record<RestRole, BudgetRole> = {
  admin: BudgetRole.ADMIN,
  collaborator: BudgetRole.COLLABORATOR,
  viewer: BudgetRole.VIEWER,
}

const ROLE_TO_REST: Partial<Record<BudgetRole, RestRole>> = {
  [BudgetRole.ADMIN]: 'admin',
  [BudgetRole.COLLABORATOR]: 'collaborator',
  [BudgetRole.VIEWER]: 'viewer',
}

const STATUS_FROM_REST: Record<RestStatus, InviteStatus> = {
  pending: InviteStatus.PENDING,
  accepted: InviteStatus.ACCEPTED,
  cancelled: InviteStatus.CANCELLED,
  expired: InviteStatus.EXPIRED,
}

/** `SendBudgetInviteRequest.role` only ever accepts collaborator/viewer — admin is rejected server-side, matching Go. */
export function inviteRoleToRest(role: BudgetRole): 'collaborator' | 'viewer' {
  const rest = ROLE_TO_REST[role]
  return rest === 'admin' || rest === undefined ? 'collaborator' : rest
}

/** Normalizes the C# backend's REST `BudgetInvite` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. */
export function inviteFromRest(dto: components['schemas']['BudgetInvite']): BudgetInvite {
  return new BudgetInvite({
    id: dto.id,
    budgetProfileId: dto.budgetProfileId,
    budgetName: dto.budgetName,
    inviterName: dto.inviterName,
    email: dto.email,
    role: ROLE_FROM_REST[dto.role],
    status: STATUS_FROM_REST[dto.status],
    expiresAt: Timestamp.fromDate(new Date(dto.expiresAt)),
    createdAt: Timestamp.fromDate(new Date(dto.createdAt)),
    budgetPersonId: BigInt(dto.budgetPersonId ?? 0),
  })
}
