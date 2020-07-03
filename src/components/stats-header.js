import _ from 'lodash'
import React from 'react'
import classNames from 'classnames'
import { useSelector } from 'react-redux'
import HRNumbers from 'human-readable-numbers'
import { SIMULATION_STATE_CALCULATING } from '../store/simulation'

export const StatsHeader = () => {
  const { state, day, treasure, overallStats, counterMeasures } = useSelector(s => s.simulation)
  const os = _.last(overallStats) || [0, 0, 0, 0, 0]
  const os2 = _.nth(overallStats, -2) || [0, 0, 0, 0, 0]

  const diff = (a, b) => a - b !== 0 && `(${a - b > 0 ? '+' : ''}${HRNumbers.toHumanString(a - b)})`

  const td = 10 - _.reduce(counterMeasures, (n, m) => n + (m.active === 0 ? m.cost : 0), 0)

  return (
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
        <div className="tooltip-container">
          <div className={classNames('treasure', { warning: treasure < 10 })}>{treasure.toLocaleString()} B$</div>
          <div className='tooltip'>
            <span className='green'>Monthly Income: 10 B$ / days</span> <br />
            <br />
            <>
              {counterMeasures.filter(m => m.active === 0).map(m => <div key={m.id}>
                <span className='red'>{m.name}: -{m.cost} B$ / days</span> <br />
              </div>)}
            </>
            <br />
            <span className={classNames({ green: td > 0, red: td <= 0})}>{td} B$ / days</span>
          </div>
        </div>
      </div>
      <div className={classNames('day', { full: state === SIMULATION_STATE_CALCULATING })}>Day {day}</div>
    </div>
  )
}
