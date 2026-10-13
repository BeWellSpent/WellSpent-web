import { Category } from '@/gen/wellspent/v1/budget_pb'
import { SystemCategory } from '@/gen/wellspent/v1/common_pb'
import type { components } from '@/gen/rest/schema'

/**
 * `category.system_key` → proto `SystemCategory`, mirroring
 * `WellSpent-backend`'s `systemCategoryByKey` (`internal/handler/convert.go`)
 * field-for-field. Kept explicit rather than derived from the enum name for
 * the same reason that map is: a rename on either side becomes a compile
 * error here instead of a silent UNSPECIFIED (which degrades to the English
 * `name` on every client with nothing logged — see
 * docs/features/system-category-translation.md).
 */
const SYSTEM_KEY_TO_PROTO: Record<string, SystemCategory> = {
  entertainment: SystemCategory.ENTERTAINMENT,
  insurance: SystemCategory.INSURANCE,
  loan: SystemCategory.LOAN,
  wellness: SystemCategory.WELLNESS,
  services: SystemCategory.SERVICES,
  subscription: SystemCategory.SUBSCRIPTION,
  rent: SystemCategory.RENT,
  travel: SystemCategory.TRAVEL,
  eating_out: SystemCategory.EATING_OUT,
  groceries: SystemCategory.GROCERIES,
  baby: SystemCategory.BABY,
  pet: SystemCategory.PET,
  misc: SystemCategory.MISC,
  house: SystemCategory.HOUSE,
  gas: SystemCategory.GAS,
  auto: SystemCategory.AUTO,
  savings: SystemCategory.SAVINGS,
  shopping: SystemCategory.SHOPPING,
  family: SystemCategory.FAMILY,
  income: SystemCategory.INCOME,
  payment: SystemCategory.PAYMENT,
  transfer: SystemCategory.TRANSFER,
  transportation: SystemCategory.TRANSPORTATION,
  utilities: SystemCategory.UTILITIES,
  debt: SystemCategory.DEBT,
}

/** Normalizes the C# backend's REST `Category` into the same proto message every existing consumer already reads — see `rest.ts`'s cutover-flag doc comment. `typeId` has no REST equivalent (wire-compat-only on proto, never populated by Go either — see categories.md). */
export function categoryFromRest(dto: components['schemas']['Category']): Category {
  return new Category({
    id: dto.id,
    name: dto.name,
    isSystem: dto.isSystem,
    color: dto.color,
    systemCategory: dto.systemKey ? SYSTEM_KEY_TO_PROTO[dto.systemKey] ?? SystemCategory.UNSPECIFIED : SystemCategory.UNSPECIFIED,
  })
}
