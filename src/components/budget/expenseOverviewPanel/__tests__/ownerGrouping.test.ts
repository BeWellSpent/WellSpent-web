import type { Transaction, PaymentMethod } from '@/gen/wellspent/v1/budget_pb'
import { groupTransactionsByOwner, resolveOwnerId } from '../ownerGrouping'

function tx(id: string, paymentMethodId: string, daySeconds = 0): Transaction {
  return { id, paymentMethodId, date: { seconds: BigInt(daySeconds), nanos: 0 } } as unknown as Transaction
}

function method(id: string, budgetPersonId: bigint): PaymentMethod {
  return { id, budgetPersonId } as unknown as PaymentMethod
}

const methodMap = new Map<string, PaymentMethod>([
  ['pm-alex', method('pm-alex', 1n)],
  ['pm-sam', method('pm-sam', 2n)],
  ['pm-orphan', method('pm-orphan', 0n)],
])

describe('resolveOwnerId', () => {
  it('resolves a transaction to the person its payment method belongs to', () => {
    expect(resolveOwnerId(tx('t1', 'pm-alex'), methodMap)).toBe('1')
  })

  // The server credits a person only when the transaction has a payment method
  // AND that method names one. These three cases are the ones that must fall
  // out, or a person's listed transactions stop matching their own total.
  it('returns null for spending with no payment method at all', () => {
    expect(resolveOwnerId(tx('t1', ''), methodMap)).toBeNull()
  })

  it('returns null when the payment method belongs to nobody', () => {
    expect(resolveOwnerId(tx('t1', 'pm-orphan'), methodMap)).toBeNull()
  })

  it('returns null when the payment method is not in the map', () => {
    expect(resolveOwnerId(tx('t1', 'pm-deleted'), methodMap)).toBeNull()
  })
})

describe('groupTransactionsByOwner', () => {
  const rendered = new Set(['1', '2'])

  it('files each transaction under the person who paid', () => {
    const { byPerson, unclaimed } = groupTransactionsByOwner(
      [tx('a', 'pm-alex'), tx('b', 'pm-sam'), tx('c', 'pm-alex')],
      methodMap,
      rendered,
    )
    expect(byPerson.get('1')!.map((t) => t.id).sort()).toEqual(['a', 'c'])
    expect(byPerson.get('2')!.map((t) => t.id)).toEqual(['b'])
    expect(unclaimed).toHaveLength(0)
  })

  it('puts spending that belongs to nobody in its own group', () => {
    const { byPerson, unclaimed } = groupTransactionsByOwner(
      [tx('cash', ''), tx('a', 'pm-alex')],
      methodMap,
      rendered,
    )
    expect(unclaimed.map((t) => t.id)).toEqual(['cash'])
    expect(byPerson.get('1')!.map((t) => t.id)).toEqual(['a'])
  })

  // The server omits a person from personBreakdowns when their planned and
  // actual are both zero — so someone whose transactions net to exactly zero
  // has transactions but no row to sit under. They must still be listed.
  it('does not drop a transaction owned by a person with no row', () => {
    const { unclaimed } = groupTransactionsByOwner(
      [tx('a', 'pm-sam')],
      methodMap,
      new Set(['1']),
    )
    expect(unclaimed.map((t) => t.id)).toEqual(['a'])
  })

  it('never loses a transaction, whatever its attribution', () => {
    const all = [tx('a', 'pm-alex'), tx('b', 'pm-sam'), tx('cash', ''), tx('orphan', 'pm-orphan')]
    const { byPerson, unclaimed } = groupTransactionsByOwner(all, methodMap, rendered)
    const seen = [...[...byPerson.values()].flat(), ...unclaimed].map((t) => t.id).sort()
    expect(seen).toEqual(['a', 'b', 'cash', 'orphan'])
  })

  it('orders each group newest first', () => {
    const { byPerson } = groupTransactionsByOwner(
      [tx('old', 'pm-alex', 100), tx('new', 'pm-alex', 300), tx('mid', 'pm-alex', 200)],
      methodMap,
      rendered,
    )
    expect(byPerson.get('1')!.map((t) => t.id)).toEqual(['new', 'mid', 'old'])
  })

  it('breaks a same-day tie on ID so the order is stable between renders', () => {
    const { byPerson } = groupTransactionsByOwner(
      [tx('b', 'pm-alex', 100), tx('a', 'pm-alex', 100)],
      methodMap,
      rendered,
    )
    expect(byPerson.get('1')!.map((t) => t.id)).toEqual(['a', 'b'])
  })
})
