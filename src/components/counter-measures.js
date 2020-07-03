import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import classNames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { simulationActivateMeasure, simulationDeactivateMeasure } from '../store/simulation'

const Button = ({ measure }) => {
  const { treasure, counterMeasures: measures } = useSelector(s => s.simulation)
  const dispatch = useDispatch()

  const activate = ({ id }) => () => {
    dispatch(simulationActivateMeasure(id))
  }

  const deactivate = ({ id }) => () => {
    dispatch(simulationDeactivateMeasure(id))
  }

  const activeMeasures = _.flow(fp.filter({ active: 0 }), fp.map('id'))(measures)

  return (
    <div className="tooltip-container">
      <button
        onClick={measure.active === false ? activate(measure) : deactivate(measure)}
        disabled={treasure < measure.cost || _.difference(_.get(measure, 'dependsOn', []), activeMeasures).length !== 0}
        className={classNames({ active: measure.active !== false })}
      >
        <div
          className='process'
          style={{
            height: `${measure.active !== false && (measure.active / measure.days) * 100}%`
          }}
        />
        <div className='name'>{measure.name}</div>
      </button>
      <div className='tooltip'>
        {measure.description}
        {measure.description && <br />}
        {measure.dependsOn && <>Depends on: {measure.dependsOn.map(id => _.find(measures, { id }).name).join(', ')} <br /> </>}
        Days until effective: {measure.days} <br />
        {measure.cost} B$ / day
      </div>
    </div>
  )
}

export const CounterMeasures = () => {
  const { counterMeasures } = useSelector(s => s.simulation)

  return (
    <div id='counter-measures'>
      {counterMeasures.map(measure => <Button key={measure.name} measure={measure} />)}
    </div>
  )
}
