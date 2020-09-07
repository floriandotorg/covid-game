import _ from 'lodash'
import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import HRNumbers from 'human-readable-numbers'
import { SIMULATION_STATE_CALCULATING, simulationSetReset } from '../store/simulation'

export const StatsHeader = () => {
  const dispatch = useDispatch()
  const { state, day, overallStats, shouldReset } = useSelector(s => s.simulation)
  const [full, setFull] = useState(false)

  const os = _.last(overallStats) || [0, 0, 0, 0, 0]
  const os2 = _.nth(overallStats, -2) || [0, 0, 0, 0, 0]

  const diff = (a, b) => a - b !== 0 && `(${a - b > 0 ? '+' : ''}${HRNumbers.toHumanString(a - b)})`

  useEffect(() => {
    setTimeout(() => setFull(state === SIMULATION_STATE_CALCULATING), 100)
  }, [state])

  return (
    <header>
      <div id='stats-header'>
        <div className='stats'>
          <div className='infectious'>
            {HRNumbers.toHumanString(os[1])} {diff(os[1], os2[1])}
          </div>
          <div className='recovered'>
            {HRNumbers.toHumanString(os[2])} {diff(os[2], os2[2])}
          </div>
          <div className='dead'>
            {HRNumbers.toHumanString(os[3])} {diff(os[3], os2[3])}
          </div>
        </div>
        <button onClick={() => dispatch(simulationSetReset())} disabled={shouldReset}>
          {shouldReset ? 'Resetting ..' : 'Reset'}
        </button>
        <div className={classNames('day', { full })}>Day {day}</div>
      </div>
    </header>
  )
}
