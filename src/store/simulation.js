import _ from 'lodash'
import React from 'react'
import regeneratorRuntime from 'regenerator-runtime'
import { newsUpdateStats } from './news'

const SIMULATION_RESET = 'SIMULATION_RESET'
const SIMULATION_SET_STATS = 'SIMULATION_SET_STATS'
const SIMULATION_SET_PARAMETER = 'SIMULATION_SET_PARAMETER'
export const SIMULATION_NEXT_ROUND = 'SIMULATION_NEXT_ROUND'
const SIMULATION_UPDATE_CREDIT = 'SIMULATION_UPDATE_CREDIT'
const SIMULATION_END = 'SIMULATION_END'

export const SIMULATION_STATE_IDLE = 'SIMULATION_STATE_IDLE'
export const SIMULATION_STATE_CALCULATING = 'SIMULATION_STATE_CALCULATING'
export const SIMULATION_STATE_WAITING = 'SIMULATION_STATE_WAITING'
export const SIMULATION_STATE_FINISHED = 'SIMULATION_STATE_FINISHED'

const defaultState = {
  state: SIMULATION_STATE_IDLE,
  credit: 0,
  day: 0,
  stats: {
    susceptible: [],
    infectious: [],
    recovered: [],
    dead: [],
    beds: []
  },
  parameter: {
    domesticTravelDampingFactor: 0,
    travelDampingFactor: 0,
    socialDistancingFactor: 0,
    testCapacity: 0,
    appFactor: 0,
    maskAdoption: 0
  },
  overallStats: [],
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

export const simulationSetParameter = parameter => ({
  type: SIMULATION_SET_PARAMETER,
  payload: {
    parameter
  }
})

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const nextRound = async (instance, dispatch, getState) => {
  dispatch(simulationNextRound())

  const {
    simulation: { day, stats: oldStats, overallStats: oldOverall, parameter }
  } = getState()

  instance.step(Math.min(parameter.domesticTravelDampingFactor, 1), Math.min(parameter.travelDampingFactor, 1), Math.min(parameter.socialDistancingFactor, 1), parameter.testCapacity, Math.min(parameter.appFactor, 1), parameter.maskAdoption * 0.7)

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
    case SIMULATION_SET_PARAMETER:
      return {
        ...state,
        parameter: {
          ...state.parameter,
          ...action.payload.parameter
        }
      }
    case SIMULATION_UPDATE_CREDIT:
      return {
        ...state,
        credit: state.credit + action.payload.delta
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
