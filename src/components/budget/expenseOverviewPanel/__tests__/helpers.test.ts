import { formatOverviewActual, formatOverviewAmountText } from '../helpers'

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

  it('renders exactly zero as a dash rather than $0.00', () => {
    expect(formatOverviewAmountText(0, fmt)).toBe('—')
  })

  it('does not drop a net-received amount, which the old `> 0` guard did', () => {
    expect(formatOverviewAmountText(-0.5, fmt)).not.toBe('—')
  })
})

describe('formatOverviewActual', () => {
  it('colours an under-budget spend green', () => {
    expect(formatOverviewActual(300, false, fmt)).toEqual({ text: '$300.00', color: 'success.main' })
  })

  it('colours an over-budget spend red', () => {
    expect(formatOverviewActual(500, true, fmt)).toEqual({ text: '$500.00', color: 'error.main' })
  })

  it('shows money received as +$X green', () => {
    expect(formatOverviewActual(-85, false, fmt)).toEqual({ text: '+$85.00', color: 'success.main' })
  })

  // isOver comes from the server and is false whenever planned <= 0, but a
  // received amount must stay green regardless — it is not overspending, and
  // the + prefix is what distinguishes it from an under-budget spend.
  it('keeps money received green even if flagged over budget', () => {
    expect(formatOverviewActual(-85, true, fmt)).toEqual({ text: '+$85.00', color: 'success.main' })
  })

  it('renders a zero actual as a disabled dash', () => {
    expect(formatOverviewActual(0, false, fmt)).toEqual({ text: '—', color: 'text.disabled' })
  })
})
