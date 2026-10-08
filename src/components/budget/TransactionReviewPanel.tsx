'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import { LoadingButton } from '@/components/ui/LoadingButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import BlockIcon from '@mui/icons-material/Block'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'
import { groupPendingReviews, type ReviewGroup } from './transactionReviewGrouping'

interface Props {
  budgetProfileId: string
  budgetPeriodId: string | undefined
  isEditable: boolean
}

export function TransactionReviewPanel({ budgetProfileId, budgetPeriodId, isEditable }: Props) {
  const t = useTranslations('budget.review')
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const { showError } = useSnackbar()
  const { person: myPerson } = useMyBudgetPerson(budgetProfileId)

  const { data, isLoading } = useQuery({
    queryKey: ['transaction-reviews', budgetProfileId],
    queryFn: () => client.listTransactionReviews({ budgetProfileId }),
    enabled: !!budgetProfileId,
  })

  const confirmMutation = useMutation({
    mutationFn: (reviewId: string) =>
      client.confirmTransactionReview({ reviewId, budgetProfileId }),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-reviews', budgetProfileId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses', budgetProfileId] })
      logger.info('review.confirm', { reviewId })
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (reviewId: string) =>
      client.dismissTransactionReview({ reviewId }),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-reviews', budgetProfileId] })
      logger.info('review.dismiss', { reviewId })
    },
  })

  // Sequential, not Promise.all — each confirm must see the last one's write.
  async function handleConfirmGroup(group: ReviewGroup) {
    try {
      for (const review of group.reviews) {
        await confirmMutation.mutateAsync(review.id)
      }
    } catch (err) {
      showError(err)
    }
  }

  async function handleDismissGroup(group: ReviewGroup) {
    try {
      for (const review of group.reviews) {
        await dismissMutation.mutateAsync(review.id)
      }
    } catch (err) {
      showError(err)
    }
  }

  const reviews = (data?.reviews ?? []).filter((r) => r.status === 'pending')
  const groups = groupPendingReviews(reviews)

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>
  }

  if (reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">{t('empty')}</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">{t('description')}</Typography>
      {groups.map((group) => {
        const isPending = confirmMutation.isPending || dismissMutation.isPending
        const isSplit = group.reviews.length > 1
        const involvesSomeoneElse = (id: bigint) => id !== 0n && id !== myPerson?.id
        const spansOutsideMyView =
          !!myPerson?.focusedViewEnabled &&
          (involvesSomeoneElse(group.matchedTransactionPersonId) || group.reviews.some((r) => involvesSomeoneElse(r.transactionPersonId)))
        const total = group.reviews.reduce((sum, r) => sum + reviewAmount(r), 0)

        return (
          <Card key={group.matchedTransactionId} variant="outlined">
            <CardContent sx={{ pb: 0 }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">{t('matchedTo')}</Typography>
                  <Typography variant="subtitle2" noWrap>{group.matchedTransactionName}</Typography>
                </Box>
                {!isSplit && (
                  <Chip
                    label={`${Math.round(group.reviews[0].matchScore)}%`}
                    size="small"
                    color={group.reviews[0].matchScore >= 90 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: 11 }}
                  />
                )}
              </Stack>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {group.reviews.map((review) => (
                  <Stack key={review.id} direction="row" justifyContent="space-between">
                    <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{review.transactionName}</Typography>
                    <Typography variant="body2">${reviewAmount(review).toFixed(2)}</Typography>
                  </Stack>
                ))}
                {isSplit && (
                  <Stack direction="row" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{t('total')}</Typography>
                    <Typography variant="body2" fontWeight={600}>${total.toFixed(2)}</Typography>
                  </Stack>
                )}
              </Stack>
              {spansOutsideMyView && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                  <VisibilityIcon fontSize="inherit" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {t('spansOutsideView')}
                  </Typography>
                </Stack>
              )}
            </CardContent>
            {isEditable && (
              <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
                <LoadingButton
                  size="small"
                  startIcon={<BlockIcon />}
                  onClick={() => handleDismissGroup(group)}
                  disabled={isPending}
                  loading={dismissMutation.isPending}
                  color="inherit"
                >
                  {t('dismiss')}
                </LoadingButton>
                <LoadingButton
                  size="small"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleConfirmGroup(group)}
                  disabled={isPending}
                  loading={confirmMutation.isPending}
                  color="primary"
                  variant="contained"
                >
                  {t('confirm')}
                </LoadingButton>
              </CardActions>
            )}
          </Card>
        )
      })}
    </Stack>
  )
}

function reviewAmount(review: { transactionAmount?: { units: bigint; nanos: number } }): number {
  if (!review.transactionAmount) return 0
  return Number(review.transactionAmount.units) + review.transactionAmount.nanos / 1e9
}

export function transactionReviewCount(reviews: { status: string }[]): number {
  return reviews.filter((r) => r.status === 'pending').length
}
