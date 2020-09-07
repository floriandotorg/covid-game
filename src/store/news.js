import _ from 'lodash'
import fp from 'lodash/fp'
import { SIMULATION_NEXT_ROUND } from './simulation'
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

const countiesByNumber = fp.flow([
  fp.values,
  fp.map('n'),
  fp.max,
  fp.times(n => _.findKey(counties, { n }))
])(counties)

const generateFor = (key, text, priority) => {
  const already = new Set()

  return (sendNews, oldStats, stats) => {
    const states = new Set()

    for (let n = 0; n < stats[key].length; ++n) {
      const countyName = countiesByNumber[n]
      if (oldStats[key][n] === 0 && stats[key][n] > 0 && countyName) {
        states.add(countyName.match(/, ([A-Z]{2})/)[1])
      }
    }

    Array.from(states)
      .filter(s => !already.has(s))
      .map(s => stateNames[s])
      .forEach(state => sendNews(_.sample(text)(state), priority))

    states.forEach(s => already.add(s))
  }
}

const infectedNews = [
  state => `First Infection in ${state}`,
  state => `Governor of ${state}: We have the first patient`,
  state => `Confirmed case of COVID19 in ${state}`
]

const deadNews = [
  state => `First dead in ${state}`,
  state => `COVID19 claims first victim in ${state}`,
  state => `${state}: First confirmed dead`
]

const generateForInfectious = generateFor('infectious', infectedNews, 1)
const genergenerateForDead = generateFor('dead', deadNews, 2)

const randomNews = [
  'Italiens leading pandemic expert: Corona is just a flu',
  'New Coronavirus more dangerous than first tought?',
  'Europe under lockdown',
  'WHO head warns worst of virus is still ahead',
  'Potential COVID-19 vaccine shows promise in mouse study',
  'Biggest theme park in Europe closed',
  'Dozens of Secret Service agents quarantined',
  'Luxury hotels swapped tourists for medical workers',
  'Companies are reassessing their supply chains',
  'US taxpayers are funding six COVID vaccines',
  'Research team has isolated the COVID-19 virus',
  'Study: 17.9% Of People With COVID-19 Coronavirus Had No Symptoms',
  'Indoor transmission of SARS-CoV-2',
  "Is the U.S. 'Flattening the Curve?'",
  'How South Korea Flattened the Curve',
  'Minister backs creating legal right to work from home',
  '1st grader sets up impressive remote learning station',
  '3 Ways to Use Video Conferencing with Students Learning Remotely',
  'How to make a cloth face covering',
  'Staying alert and safe (social distancing)',
  "The Dos and Don’ts of 'Social Distancing'",
  'New study reveals Oxford coronavirus vaccine produces strong immune response',
  'Cheap antibody test sent for validation in coronavirus fight',
  'Dutch researchers find Corona virus antibody',
  'Coronavirus: Why everyone was wrong',
  'Here’s how you can order a COVID-19 test',
  'China approves 29-minute testing kit for new coronavirus',
  "Minister buys 100,000 COVID-19 test kits to ensure 'safety for all'",
  'Senate blocks $250 billion for coronavirus small business loans',
  "New flu virus with 'pandemic potential' found in China'",
  "Burger chain says 'No Mask, No Hamburgers'",
  'The good news is: There is hope for humanity',
  'Big airline is cutting 6,000 jobs'
]

const sentNews = new Set()

export const newsUpdateStats = (dispatch, oldStats, stats, oldOverall, overall) => {
  const sendNews = (announcement, priority, hasLifetime = true) => {
    if (!sentNews.has(announcement)) {
      sentNews.add(announcement)
      dispatch(newsAdd(announcement, priority, hasLifetime))
    }
  }

  generateForInfectious(sendNews, oldStats, stats)
  genergenerateForDead(sendNews, oldStats, stats)

  const [oldSusceptible, oldInfectious, oldRecovered, oldDead, oldBeds] = _.last(oldOverall) || []
  const [susceptible, infectious, recovered, dead, beds] = overall

  if (infectious > 0) {
    sendNews('COVID19: The fight has begun', 4)
  }

  if (dead > 0) {
    sendNews('First COVID19 dead in the US', 9)
  }

  if (recovered > 0) {
    sendNews('US: First patient recovered from COVID19', 4)
  }

  if (oldBeds - beds > 0.2 * 6000) {
    sendNews('Health system collapsing', 10)
  }

  if (infectious > 1000) {
    sendNews('1,000 confirmed cases of COVID19 in the US', 10)
  }

  if (infectious > 1000000) {
    sendNews('1 Mio. confirmed cases of COVID19 in the US', 10)
  }

  if (infectious - oldInfectious > 1000) {
    sendNews('COVID-Crisis: More then 1,000 new infections per day', 15)
  }

  if (infectious > 1000 && Math.random() < 0.3) {
    sendNews(_.sample(randomNews), 20, false)
  }
}

export const newsAdd = (announcement, priority, hasLifetime) => ({
  type: NEWS_ADD,
  payload: {
    announcement,
    priority,
    hasLifetime
  }
})

export const newsRemove = id => ({
  type: NEWS_REMOVE,
  payload: {
    id
  }
})

let n = 0

const updateLifetime = fp.flow([
  fp.map(n => ({ ...n, lifetime: (n.hasLifetime ? n.lifetime - 1 : n.lifetime)})),
  fp.filter(n => n.lifetime > 0)
])

export const newsReducer = (state = defaultState, action) => {
  switch (action.type) {
    case NEWS_ADD:
      const { priority, announcement, hasLifetime } = action.payload
      return {
        ...state,
        announcements: _.sortBy(
          [...state.announcements, { id: ++n, priority, text: `+++ ${announcement} +++`, lifetime: 5, hasLifetime }],
          'priority'
        ).reverse()
      }
    case NEWS_REMOVE:
      return {
        ...state,
        announcements: _.reject(state.announcements, { id: action.payload.id })
      }
    case SIMULATION_NEXT_ROUND:
      return {
        ...state,
        announcements: updateLifetime(state.announcements)
      }
    default:
      return state
  }
}
