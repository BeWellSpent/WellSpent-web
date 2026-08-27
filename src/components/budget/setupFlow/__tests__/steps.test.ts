import { SETUP_STEPS, nextStep, previousStep } from '../steps'

describe('setup wizard steps', () => {
  // Savings requires a payment method, so Payment methods has to run first.
  // This is the reason the order changed; assert it rather than trusting the
  // array to stay put.
  it('puts payment methods before both income and savings', () => {
    const order = SETUP_STEPS as readonly string[]
    expect(order.indexOf('paymentMethods')).toBeLessThan(order.indexOf('savings'))
    expect(order.indexOf('paymentMethods')).toBeLessThan(order.indexOf('income'))
  })

  it('walks forward through every step and stops at the end', () => {
    expect(nextStep('create')).toBe('people')
    expect(nextStep('people')).toBe('paymentMethods')
    expect(nextStep('paymentMethods')).toBe('income')
    expect(nextStep('income')).toBe('savings')
    expect(nextStep('savings')).toBeNull()
  })

  it('walks back and stops at the first step', () => {
    expect(previousStep('savings')).toBe('income')
    expect(previousStep('people')).toBe('create')
    expect(previousStep('create')).toBeNull()
  })
})
