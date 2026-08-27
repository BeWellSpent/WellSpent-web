/**
 * The setup wizard's steps, in order.
 *
 * Payment methods deliberately precedes Income, which is a change from the
 * original order. Savings sources require a payment method, so the Savings
 * step is unusable unless Payment methods has already run — and putting
 * Income between them buys nothing, since income needs neither.
 */
export const SETUP_STEPS = ['create', 'people', 'paymentMethods', 'income', 'savings'] as const

export type SetupStep = (typeof SETUP_STEPS)[number]

/** Translation keys for the stepper labels, parallel to SETUP_STEPS. */
export const SETUP_STEP_LABEL_KEYS: Record<SetupStep, string> = {
  create: 'steps.create',
  people: 'steps.addPeople',
  paymentMethods: 'steps.paymentMethods',
  income: 'steps.addIncome',
  savings: 'steps.addSavings',
}

export function nextStep(step: SetupStep): SetupStep | null {
  const index = SETUP_STEPS.indexOf(step)
  return index < SETUP_STEPS.length - 1 ? SETUP_STEPS[index + 1] : null
}

export function previousStep(step: SetupStep): SetupStep | null {
  const index = SETUP_STEPS.indexOf(step)
  return index > 0 ? SETUP_STEPS[index - 1] : null
}
