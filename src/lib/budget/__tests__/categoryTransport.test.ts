import { SystemCategory } from '@/gen/wellspent/v1/common_pb'
import { categoryFromRest } from '../categoryTransport'

describe('categoryFromRest', () => {
  it('maps a system category\'s systemKey to the matching proto SystemCategory', () => {
    const cat = categoryFromRest({ id: 1, name: 'Groceries', isSystem: true, color: '#fff', systemKey: 'groceries' })
    expect(cat.systemCategory).toBe(SystemCategory.GROCERIES)
    expect(cat.isSystem).toBe(true)
  })

  it('falls back to UNSPECIFIED for a user category (null systemKey)', () => {
    const cat = categoryFromRest({ id: 2, name: 'Hobbies', isSystem: false, color: '', systemKey: null })
    expect(cat.systemCategory).toBe(SystemCategory.UNSPECIFIED)
  })

  it('falls back to UNSPECIFIED for a systemKey this build does not recognize, same as the Go backend', () => {
    const cat = categoryFromRest({ id: 3, name: 'Future Category', isSystem: true, color: '', systemKey: 'something_seeded_later' })
    expect(cat.systemCategory).toBe(SystemCategory.UNSPECIFIED)
    expect(cat.name).toBe('Future Category')
  })
})
