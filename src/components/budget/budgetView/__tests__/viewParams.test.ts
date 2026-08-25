import { parseViewParams, DEFAULT_VIEW, DEFAULT_PLAN_KIND } from '../viewParams'

describe('parseViewParams', () => {
  it('defaults to the Plan view showing Overview', () => {
    expect(parseViewParams(null, null)).toEqual({ view: 'plan', planKind: 'overview' })
    expect(DEFAULT_VIEW).toBe('plan')
    expect(DEFAULT_PLAN_KIND).toBe('overview')
  })

  it.each(['plan', 'transactions', 'review', 'reports'] as const)('accepts %s', (view) => {
    expect(parseViewParams(view, null).view).toBe(view)
  })

  it('reads the plan kind independently of the view', () => {
    expect(parseViewParams('plan', 'plan').planKind).toBe('plan')
    expect(parseViewParams('plan', 'overview').planKind).toBe('overview')
  })

  // Overview and Expense Plan were peer tabs until issue #60; links to them
  // predate the fold and have to keep landing where they say.
  it('maps the legacy view=expenses to Plan showing planned amounts', () => {
    expect(parseViewParams('expenses', null)).toEqual({ view: 'plan', planKind: 'plan' })
  })

  it('maps the legacy view=overview to Plan showing actuals', () => {
    expect(parseViewParams('overview', null)).toEqual({ view: 'plan', planKind: 'overview' })
  })

  it('ignores a legacy planKind rather than letting it override the mapping', () => {
    expect(parseViewParams('expenses', 'overview').planKind).toBe('plan')
  })

  it('falls back to the defaults on unknown values', () => {
    expect(parseViewParams('nonsense', 'nonsense')).toEqual({ view: 'plan', planKind: 'overview' })
  })
})
