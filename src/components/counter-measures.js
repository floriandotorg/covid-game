import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import classNames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { simulationActivateMeasure, simulationDeactivateMeasure } from '../store/simulation'

const Button = ({ measure }) => {
  const state = useSelector(s => s.simulation)
  const { counterMeasures: measures } = state
  const dispatch = useDispatch()

  const activeMeasures = _.flow(fp.filter({ active: 0 }), fp.map('id'))(measures)

  const onClick = () => {
    if (measure.active === false) {
      measure.activation && dispatch(measure.activation)
      dispatch(simulationActivateMeasure(measure.id))
    } else {
      dispatch(simulationDeactivateMeasure(measure.id))
    }
  }

  return (
    <div className="tooltip-container">
      <button
        onClick={onClick}
        disabled={_.difference(_.get(measure, 'dependsOn', []), activeMeasures).length !== 0 || measure.multiple && measure.active !== false || _.isFunction(measure.disabled) && measure.disabled(state)}
        className={classNames({ active: measure.active !== false })}
      >
        <div
          className='process'
          style={{
            height: `${measure.active !== false && (measure.active / measure.days) * 100}%`
          }}
        />
        <div className='name'>{_.isFunction(measure.name) ? measure.name(state) : measure.name}</div>
      </button>
      <div className='tooltip'>
        {measure.description}
        {measure.description && <br />}
        {measure.dependsOn && <>Depends on: {measure.dependsOn.map(id => _.find(measures, { id }).name).join(', ')} <br /> </>}
        Fully effective after: {measure.days} days
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
