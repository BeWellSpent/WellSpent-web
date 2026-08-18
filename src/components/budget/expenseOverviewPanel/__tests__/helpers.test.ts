import { formatOverviewActual, formatOverviewAmountText, overviewActualColor } from '../helpers'

// Deliberately not Intl — these tests are about sign and colour, and a real
// currency formatter would make every expectation depend on the locale the
// test runner happens to have.
const fmt = (n: number) => `$${n.toFixed(2)}`

describe('formatOverviewAmountText', () => {
  it('renders spending as a positive magnitude, unlike the transactions ledger', () => {
    expect(formatOverviewAmountText(420, fmt)).toBe('$420.00')
  })

  it('renders a net-received amount as +$X, matching the transactions list', () => {
    expect(formatOverviewAmountText(-85, fmt)).toBe('+$85.00')
  })

  // Zero used to render an em dash. iOS has always shown the number, and a
  // category with a plan and no spend yet has genuinely spent zero — that is
  // a fact, not missing data.
  it('renders zero as an actual zero rather than a dash', () => {
    expect(formatOverviewAmountText(0, fmt)).toBe('$0.00')
  })

  it('does not drop a net-received amount, which the old `> 0` guard did', () => {
    expect(formatOverviewAmountText(-0.5, fmt)).toBe('+$0.50')
  })
})

describe('overviewActualColor', () => {
  it('colours a spend inside its plan green', () => {
    expect(overviewActualColor(300, 400, false)).toBe('success.main')
  })

  it('colours a spend over its plan red', () => {
    expect(overviewActualColor(500, 400, true)).toBe('error.main')
  })

  // The reason this function takes `planned` at all. `is_over` is
  // `planned > 0 && actual > planned` server-side, so unplanned spending can
  // never be "over" and used to fall through to green — reading as within
  // budget while the same money was counted into the orange Unplanned total
  // at the bottom of the same screen.
  it('leaves unplanned spending neutral rather than green', () => {
    expect(overviewActualColor(500, 0, false)).toBe('text.secondary')
  })

  it('shows money received as green', () => {
    expect(overviewActualColor(-85, 0, false)).toBe('success.main')
  })

  // isOver is false whenever planned <= 0, but guard the ordering anyway:
  // money in is not overspending and must never render red.
  it('keeps money received green even if flagged over budget', () => {
    expect(overviewActualColor(-85, 40, true)).toBe('success.main')
  })

  it('mutes an exactly-zero actual', () => {
    expect(overviewActualColor(0, 400, false)).toBe('text.disabled')
  })
})

describe('formatOverviewActual', () => {
  it('pairs the text and the colour for an under-plan spend', () => {
    expect(formatOverviewActual(300, 400, false, fmt)).toEqual({ text: '$300.00', color: 'success.main' })
  })

  it('pairs them for money received', () => {
    expect(formatOverviewActual(-85, 0, false, fmt)).toEqual({ text: '+$85.00', color: 'success.main' })
  })

  it('pairs them for unplanned spending', () => {
    expect(formatOverviewActual(500, 0, false, fmt)).toEqual({ text: '$500.00', color: 'text.secondary' })
  })
})
