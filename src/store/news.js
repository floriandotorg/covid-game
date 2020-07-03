import _ from 'lodash'
import counties from '../counties.json'

const NEWS_ADD = 'NEWS_ADD'
const NEWS_REMOVE = 'NEWS_REMOVE'

const defaultState = {
  announcements: []
}

const stateNames = {
  AL: 'Alabama',
  AK: 'Alaska',
  AS: 'American Samoa',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District Of Columbia',
  FM: 'Federated States Of Micronesia',
  FL: 'Florida',
  GA: 'Georgia',
  GU: 'Guam',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MH: 'Marshall Islands',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  MP: 'Northern Mariana Islands',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PW: 'Palau',
  PA: 'Pennsylvania',
  PR: 'Puerto Rico',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VI: 'Virgin Islands',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
}

const generateFor = (key, text, priority) => {
  const already = new Set()

  return (dispatch, oldStats, stats) => {
    const states = new Set()

    for (let n = 0; n < stats[key].length; ++n) {
      if (oldStats[key][n] === 0 && stats[key][n] > 0 && counties[n]) {
        states.add(counties[n].name.match(/, ([A-Z]{2})/)[1])
      }
    }

    Array.from(states)
      .filter(s => !already.has(s))
      .map(s => stateNames[s])
      .forEach(state => dispatch(newsAdd(_.sample(text)(state), priority)))

    states.forEach(s => already.add(s))
  }
}

const infectedNews = [
  state => `First Infection in ${state}`,
  state => `Governor of ${state}: We have the first patient`,
  state => `Confirmed case of COVID19 in ${state}`
]

const deadNews = [
  state => `First Dead in ${state}`,
  state => `COVID19 Claims First Victim in ${state}`,
  state => `${state}: First Confirmed Dead`
]

const generateForInfectious = generateFor('infectious', infectedNews, 1)
const genergenerateForDead = generateFor('dead', deadNews, 2)

const randomNews = [
  'Italiens leading pandemic expert: Corona is just a flu',
  'New Coronavirus more dangerous than first tought?',
  'Europe under Lockdown',
  'WHO Head Warns Worst of Virus Is Still Ahead',
  'Potential COVID-19 Vaccine Shows Promise in Mouse Study',
  'Biggest Theme Park in Europe closed',
  'Dozens of Secret Service agents quarantined',
  'Luxury hotels swapped tourists for medical workers',
  'Companies are reassessing their supply chains',
  'US taxpayers are funding six COVID vaccines',
  'Big airline is cutting 6,000 jobs'
]

export const newsUpdateStats = (dispatch, oldStats, stats, oldOverall, overall) => {
  generateForInfectious(dispatch, oldStats, stats)
  genergenerateForDead(dispatch, oldStats, stats)

  const [oldSusceptible, oldInfectious, oldRecovered, oldDead, oldBeds] = _.last(oldOverall) || []
  const [susceptible, infectious, recovered, dead, beds] = overall

  if (infectious > 0) {
    dispatch(newsAdd('COVID19: The fight has begun', 4))
  }

  if (dead > 0) {
    dispatch(newsAdd('First COVID19 Dead in the US', 4))
  }

  if (recovered > 0) {
    dispatch(newsAdd('US: First Patient Recovered from COVID19', 4))
  }

  if (oldBeds - beds > 0.2 * 6000) {
    dispatch(newsAdd('Health System Collapsing', 10))
  }

  if (infectious > 1000) {
    dispatch(newsAdd('1,000 confirmed cases of COVID19 in the US', 10))
  }

  if (infectious > 1000000) {
    dispatch(newsAdd('1 Mio. confirmed cases of COVID19 in the US', 10))
  }

  if (infectious - oldInfectious > 1000) {
    dispatch(newsAdd('COVID-Crisis: More then 1,000 new infections per day', 15))
  }

  if (Math.random() < 0.1) {
    dispatch(newsAdd(_.sample(randomNews), 20))
  }
}

export const newsAdd = (announcement, priority) => ({
  type: NEWS_ADD,
  payload: {
    announcement,
    priority
  }
})

export const newsRemove = id => ({
  type: NEWS_REMOVE,
  payload: {
    id
  }
})

let n = 0
const sentNews = []

export const newsReducer = (state = defaultState, action) => {
  switch (action.type) {
    case NEWS_ADD:
      const { priority, announcement } = action.payload
      if (!sentNews.includes(announcement)) {
        sentNews.push(announcement)
        return {
          ...state,
          announcements: _.sortBy(
            [...state.announcements, { id: ++n, priority, text: `+++ ${announcement} +++` }],
            'priority'
          ).reverse()
        }
      }
      return state
    case NEWS_REMOVE:
      return {
        ...state,
        announcements: _.reject(state.announcements, { id: action.payload.id })
      }
    default:
      return state
  }
}