import { FilingStatus } from '@/gen/wellspent/v1/common_pb'

/**
 * US states, and the tax filing statuses that go with them.
 *
 * Three screens ask for these — registration, profile settings, and the
 * profile-completion gate a Google or Apple sign-up lands on — and the first
 * two carried byte-identical private copies before this existed. A fourth copy
 * is how one of them ends up missing a state.
 *
 * Not translated: a state name and a US filing status are proper nouns with
 * legal meaning, and "Head of Household" is the phrase on the tax form
 * whatever language the rest of the app is in.
 */
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'District of Columbia'],
]

export const FILING_STATUS_OPTIONS = [
  { value: FilingStatus.SINGLE, label: 'Single' },
  { value: FilingStatus.MARRIED_FILING_JOINTLY, label: 'Married Filing Jointly' },
  { value: FilingStatus.MARRIED_FILING_SEPARATELY, label: 'Married Filing Separately' },
  { value: FilingStatus.HEAD_OF_HOUSEHOLD, label: 'Head of Household' },
  { value: FilingStatus.QUALIFYING_SURVIVING_SPOUSE, label: 'Qualifying Surviving Spouse' },
]
