import _ from 'lodash'
import React from 'react'
import regeneratorRuntime from 'regenerator-runtime'
import { newsUpdateStats } from './news'

const SIMULATION_RESET = 'SIMULATION_RESET'
const SIMULATION_SET_STATS = 'SIMULATION_SET_STATS'
const SIMULATION_NEXT_ROUND = 'SIMULATION_NEXT_ROUND'
const SIMULATION_ACTIVATE_MEASURE = 'SIMULATION_ACTIVATE_MEASURE'
const SIMULATION_DEACTIVATE_MEASURE = 'SIMULATION_DEACTIVATE_MEASURE'
const SIMULATION_UPDATE_TEST_CAPACITY = 'SIMULATION_UPDATE_TEST_CAPACITY'
const SIMULATION_UPDATE_CREDIT = 'SIMULATION_UPDATE_CREDIT'
const SIMULATION_END = 'SIMULATION_END'

export const SIMULATION_STATE_IDLE = 'SIMULATION_STATE_IDLE'
export const SIMULATION_STATE_CALCULATING = 'SIMULATION_STATE_CALCULATING'
export const SIMULATION_STATE_WAITING = 'SIMULATION_STATE_WAITING'
export const SIMULATION_STATE_FINISHED = 'SIMULATION_STATE_FINISHED'

const simulationUpdateTestCapacity = delta => ({
  type: SIMULATION_UPDATE_TEST_CAPACITY,
  payload: {
    delta
  }
})

const simulationUpdateCredit = delta => ({
  type: SIMULATION_UPDATE_CREDIT,
  payload: {
    delta
  }
})

const defaultState = {
  state: SIMULATION_STATE_IDLE,
  testCapacity: 0,
  credit: 0,
  day: 0,
  stats: {
    susceptible: [],
    infectious: [],
    recovered: [],
    dead: [],
    beds: []
  },
  overallStats: [],
  counterMeasures: [
    {
      id: 'ban-domestic-flight',
      name: 'Ban Domestic Flight',
      days: 3,
      active: false,
      apply: factors => ({
        ...factors,
        domesticTravelDampingFactor: 0.8
      })
    },
    {
      id: 'close-state-borders',
      name: 'Close State Borders',
      days: 3,
      active: false,
      apply: factors => ({
        ...factors,
        travelDampingFactor: 0.8
      })
    },
    {
      id: 'close-restaurants',
      name: 'Close Restaurants',
      days: 2,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.05
      })
    },
    {
      id: 'close-schools',
      name: 'Close Schools',
      days: 2,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.15
      })
    },
    {
      id: 'lockdown',
      name: 'Strict Lockdown',
      days: 2,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.9
      })
    },
    {
      id: 'close-public-places',
      name: 'Close Public Places',
      days: 2,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.15
      })
    },
    {
      id: 'increase-test-capacity',
      name: state => <>Increase Test Capacity<br /><small>({state.testCapacity.toLocaleString()})</small></>,
      days: 1,
      active: false,
      multiple: true,
      activation: simulationUpdateTestCapacity(5000),
      apply: x => x
    },
    {
      id: 'reduce-test-capacity',
      name: state => <>Reduce Test Capacity<br /><small>({state.testCapacity.toLocaleString()})</small></>,
      days: 1,
      disabled: state => state.testCapacity < 5000,
      active: false,
      multiple: true,
      hide: false,
      activation: simulationUpdateTestCapacity(-5000),
      apply: x => x
    },
    {
      id: 'increase-credit',
      name: state => <>Increase Credit<br /><small>({state.credit.toLocaleString()})</small></>,
      days: 1,
      active: false,
      multiple: true,
      activation: simulationUpdateCredit(20),
      apply: x => x
    },
    {
      id: 'reduce-credit',
      name: state => <>Reduce Credit<br /><small>({state.credit.toLocaleString()})</small></>,
      days: 1,
      disabled: state => state.credit < 20,
      active: false,
      multiple: true,
      hide: false,
      activation: simulationUpdateCredit(-20),
      apply: x => x
    },
    {
      id: 'quarantine',
      name: 'Quarantine',
      days: 2,
      active: false,
      apply: factors => ({
        ...factors,
        quarantineActive:  1
      })
    },
    {
      id: 'app',
      name: 'Develop app',
      description: 'Develop and deploy a contact tracking app. About 20 % will install it.',
      days: 5,
      active: false,
      apply: factors => ({
        ...factors,
        appFactor: factors.appFactor + 0.18
      })
    },
    {
      id: 'app-mandatory',
      name: 'Make app mandatory',
      description: 'Force people to install app. Will result in 80 % adoption rate.',
      days: 1,
      active: false,
      dependsOn: ['app'],
      apply: factors => ({
        ...factors,
        appFactor: factors.appFactor + 0.62
      })
    }
  ]
}

const simulationSetStats = (stats, overall) => ({
  type: SIMULATION_SET_STATS,
  payload: {
    stats,
    overall
  }
})

const simulationReset = () => ({
  type: SIMULATION_RESET
})

const simulationNextRound = () => ({
  type: SIMULATION_NEXT_ROUND
})

const simulationEnd = () => ({
  type: SIMULATION_END
})

export const simulationActivateMeasure = id => ({
  type: SIMULATION_ACTIVATE_MEASURE,
  payload: {
    id
  }
})

export const simulationDeactivateMeasure = id => ({
  type: SIMULATION_DEACTIVATE_MEASURE,
  payload: {
    id
  }
})

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const nextRound = async (instance, dispatch, getState) => {
  dispatch(simulationNextRound())

  const {
    simulation: { counterMeasures, day, stats: oldStats, overallStats: oldOverall, testCapacity }
  } = getState()
  const factors = _.reduce(
    counterMeasures,
    (factors, measure) => (measure.active === 0 ? measure.apply(factors) : factors),
    {
      domesticTravelDampingFactor: 0,
      travelDampingFactor: 0,
      socialDistancingFactor: 0,
      quarantineActive: 0,
      appFactor: 0
    }
  )

  instance.step(Math.min(factors.domesticTravelDampingFactor, 1), Math.min(factors.travelDampingFactor, 1), Math.min(factors.socialDistancingFactor, 1), testCapacity * factors.quarantineActive, Math.min(factors.appFactor, 1))

  await sleep(2000)
  while (instance.getProgress() !== 1) {
    await sleep(200)
  }
  instance.waitFinished()

  const stats = {
    susceptible: [...instance.getSusceptible()],
    infectious: [...instance.getInfectious()],
    recovered: [...instance.getRecovered()],
    dead: [...instance.getDead()],
    quarantined: [...instance.getQuarantined()],
    beds: [...instance.getBeds()]
  }

  const overall = [
    _.sum(stats.susceptible),
    _.sum(stats.infectious),
    _.sum(stats.recovered),
    _.sum(stats.dead),
    _.sum(stats.beds),
    _.sum(stats.quarantined)
  ]

  newsUpdateStats(dispatch, oldStats, stats, oldOverall, overall)

  dispatch(simulationSetStats(stats, overall))

  if ((day > 10 && _.sum(instance.getInfectious()) < 10)) {
    dispatch(simulationEnd())
  } else {
    nextRound(instance, dispatch, getState)
  }
}

export const simulationStart = () => (dispatch, getState) => {
  const instance = new Module.Simulation()
  dispatch(simulationReset())
  nextRound(instance, dispatch, getState)
}

export const simulationReducer = (state = defaultState, action) => {
  switch (action.type) {
    case SIMULATION_RESET:
      return defaultState
    case SIMULATION_NEXT_ROUND:
      return {
        ...state,
        day: state.day + 1,
        counterMeasures: state.counterMeasures.map(measure => ({
          ...measure,
          active: measure.active > 0 ? measure.active - 1 : measure.active
        })).map(measure => ({
          ...measure,
          active: (measure.active === 0 && measure.multiple) ? false : measure.active
        })),
        state: SIMULATION_STATE_CALCULATING
      }
    case SIMULATION_SET_STATS: {
      const { stats, overall } = action.payload
      return {
        ...state,
        state: SIMULATION_STATE_WAITING,
        stats,
        overallStats: [...state.overallStats, overall]
      }
    }
    case SIMULATION_ACTIVATE_MEASURE:
      return {
        ...state,
        counterMeasures: state.counterMeasures.map(measure => ({
          ...measure,
          active: measure.id === action.payload.id ? measure.days : measure.active
        }))
      }
    case SIMULATION_UPDATE_TEST_CAPACITY:
      return {
        ...state,
        testCapacity: state.testCapacity + action.payload.delta
      }
    case SIMULATION_UPDATE_CREDIT:
      return {
        ...state,
        credit: state.credit + action.payload.delta
      }
    case SIMULATION_DEACTIVATE_MEASURE:
      return {
        ...state,
        counterMeasures: state.counterMeasures.map(measure => ({
          ...measure,
          active: measure.id === action.payload.id ? false : measure.active
        }))
      }
    case SIMULATION_END:
      return {
        ...state,
        state: SIMULATION_STATE_FINISHED
      }
    default:
      return state
  }
}
