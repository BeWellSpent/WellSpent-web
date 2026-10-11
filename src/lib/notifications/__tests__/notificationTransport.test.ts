import { notificationFromRest, alertSubscriptionFromRest } from '../notificationTransport'

describe('notificationFromRest', () => {
  it('normalizes a REST notification into the proto shape, including createdAt', () => {
    const notification = notificationFromRest({
      id: 'n1', userId: 'u1', budgetProfileId: 'b1', alertType: 'period_created',
      title: 'New period', body: 'Your October period has started', isRead: false,
      createdAt: '2026-10-01T00:00:00Z',
    })
    expect(notification.id).toBe('n1')
    expect(notification.budgetProfileId).toBe('b1')
    expect(notification.isRead).toBe(false)
    expect(notification.createdAt?.toDate().toISOString()).toBe('2026-10-01T00:00:00.000Z')
  })

  it('defaults a null budgetProfileId and body to empty strings, matching proto defaults', () => {
    const notification = notificationFromRest({
      id: 'n1', userId: 'u1', budgetProfileId: null, alertType: 'review_pending',
      title: 'Review pending', body: null, isRead: true, createdAt: '2026-10-01T00:00:00Z',
    })
    expect(notification.budgetProfileId).toBe('')
    expect(notification.body).toBe('')
  })
})

describe('alertSubscriptionFromRest', () => {
  it('normalizes a REST subscription into the proto shape', () => {
    const sub = alertSubscriptionFromRest({
      id: 's1', userId: 'u1', budgetProfileId: 'b1', alertType: 'spending_threshold',
      channel: 'email', thresholdPct: 80, thresholdScope: 'budget', categoryId: null,
      notifyAllMembers: false, createdAt: '2026-10-01T00:00:00Z',
    })
    expect(sub.thresholdPct).toBe(80)
    expect(sub.thresholdScope).toBe('budget')
    expect(sub.categoryId).toBe(0)
  })

  it('defaults null thresholdPct/thresholdScope/categoryId to proto zero-value sentinels', () => {
    const sub = alertSubscriptionFromRest({
      id: 's1', userId: 'u1', budgetProfileId: 'b1', alertType: 'new_transaction',
      channel: 'in_app', thresholdPct: null, thresholdScope: null, categoryId: 5,
      notifyAllMembers: true, createdAt: '2026-10-01T00:00:00Z',
    })
    expect(sub.thresholdPct).toBe(0)
    expect(sub.thresholdScope).toBe('')
    expect(sub.categoryId).toBe(5)
  })
})
