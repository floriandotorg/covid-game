import _ from 'lodash'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import HRNumbers from 'human-readable-numbers'
import { SIMULATION_STATE_FINISHED, simulationStart } from '../store/simulation'

export const EndScreen = () => {
  const dispatch = useDispatch()
  const { state, overallStats } = useSelector(s => s.simulation)
  const [susceptible, _1, recovered, dead] = _.nth(overallStats, -1) || [0, 0, 0, 0]
  const infected = 326378450 - susceptible

  return (
    state === SIMULATION_STATE_FINISHED && (
      <div id='end-screen'>
        <div>
          <h1>Pedamic Ended</h1>

          <div className='stats'>
            <p>Total Infected: {HRNumbers.toHumanString(infected)}</p>
            <p>Total Recoverd: {HRNumbers.toHumanString(recovered)}</p>
            <p>Total Dead: {HRNumbers.toHumanString(dead)}</p>
            <p>Death Rate: {((dead / infected) * 100).toFixed(2).toLocaleString()} %</p>
          </div>

          <button onClick={() => dispatch(simulationStart())}>Restart</button>
        </div>
      </div>
    )
  )
}
