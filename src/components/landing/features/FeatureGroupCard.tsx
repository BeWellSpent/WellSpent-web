import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { TierTag } from '../TierTag'
import { CARD_SX } from '../landingStyles'
import { FEATURE_GROUP_ICONS } from './featureGroupIcons'
import { FEATURE_GROUPS } from './featureGroups'

type Group = (typeof FEATURE_GROUPS)[number]

/** One group: icon, name, one line, then each feature with its cost. */
export function FeatureGroupCard({ group }: { group: Group }) {
  const t = useTranslations('landing.features.groups')
  const { Icon, tint } = FEATURE_GROUP_ICONS[group.key]

  return (
    <Box component="article" sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: `${tint}1F`,
            color: tint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Box component="h3" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>{t(`${group.key}.title`)}</Box>
          <Box component="span" sx={{ fontSize: 14, color: 'text.secondary' }}>{t(`${group.key}.sub`)}</Box>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {group.items.map((item) => (
          <Box
            component="li"
            key={item.key}
            sx={{ py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
          >
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <Box component="span" sx={{ fontSize: 15, fontWeight: 600 }}>
                {t(`${group.key}.items.${item.key}.name`)}
              </Box>
              <Box component="span" sx={{ fontSize: 14, lineHeight: 1.5, color: 'text.secondary' }}>
                {t(`${group.key}.items.${item.key}.desc`)}
              </Box>
            </Box>
            <TierTag tier={item.tier} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
