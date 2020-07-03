import _ from 'lodash'
import regeneratorRuntime from 'regenerator-runtime'
import { newsUpdateStats } from './news'

const SIMULATION_RESET = 'SIMULATION_RESET'
const SIMULATION_SET_STATS = 'SIMULATION_SET_STATS'
const SIMULATION_NEXT_ROUND = 'SIMULATION_NEXT_ROUND'
const SIMULATION_ACTIVATE_MEASURE = 'SIMULATION_ACTIVATE_MEASURE'
const SIMULATION_DEACTIVATE_MEASURE = 'SIMULATION_DEACTIVATE_MEASURE'
const SIMULATION_END = 'SIMULATION_END'

export const SIMULATION_STATE_IDLE = 'SIMULATION_STATE_IDLE'
export const SIMULATION_STATE_CALCULATING = 'SIMULATION_STATE_CALCULATING'
export const SIMULATION_STATE_WAITING = 'SIMULATION_STATE_WAITING'
export const SIMULATION_STATE_FINISHED = 'SIMULATION_STATE_FINISHED'

const defaultState = {
  state: SIMULATION_STATE_IDLE,
  treasure: 20,
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
      cost: 2,
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
      cost: 5,
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
      cost: 3,
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
      cost: 1,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.15
      })
    },
    {
      id: 'close-public-places',
      name: 'Close Public Places',
      days: 2,
      cost: 1,
      active: false,
      apply: factors => ({
        ...factors,
        socialDistancingFactor: factors.socialDistancingFactor + 0.15
      })
    },
    {
      id: 'test-population',
      name: '5,000 Tests / Day',
      days: 3,
      cost: 1,
      active: false,
      apply: factors => ({
        ...factors,
        numTests: factors.numTests + 5000
      })
    },
    {
      id: 'test-population-2',
      name: '15,000 Tests / Day',
      days: 2,
      cost: 1,
      active: false,
      dependsOn: ['test-population'],
      apply: factors => ({
        ...factors,
        numTests: factors.numTests + 10000
      })
    },
    {
      id: 'quarantine',
      name: 'Quarantine',
      days: 2,
      cost: 5,
      active: false,
      dependsOn: ['test-population'],
      apply: factors => ({
        ...factors,
        quarantineActive:  1
      })
    },
    {
      id: 'app',
      name: 'Develop App',
      days: 10,
      cost: 0,
      active: false,
      apply: factors => ({
        ...factors,
        quarantineActive:  1
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
    simulation: { counterMeasures, day, stats: oldStats, overallStats: oldOverall, treasure }
  } = getState()
  const factors = _.reduce(
    counterMeasures,
    (factors, measure) => (measure.active === 0 ? measure.apply(factors) : factors),
    {
      domesticTravelDampingFactor: 0,
      travelDampingFactor: 0,
      socialDistancingFactor: 0,
      numTests: 0,
      quarantineActive: 0,
      appFactor: 0
    }
  )

  instance.step(factors.domesticTravelDampingFactor, factors.travelDampingFactor, factors.socialDistancingFactor, factors.numTests * factors.quarantineActive, factors.appFactor)

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

  if ((day > 10 && _.sum(instance.getInfectious()) < 10) || treasure < 0) {
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
        })),
        treasure: state.treasure + 10 - _.reduce(state.counterMeasures, (n, m) => n + (m.active === 0 ? m.cost : 0), 0),
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
        })),
        treasure: state.treasure - _.find(state.counterMeasures, { id: action.payload.id }).cost
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
