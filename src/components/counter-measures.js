import _ from 'lodash'
import fp from 'lodash/fp'
import React from 'react'
import classNames from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { simulationSetParameter } from '../store/simulation'

const Measure = ({ title, name, marks, max = 100 }) => {
  const dispatch = useDispatch()
  const parameter = useSelector(s => s.simulation.parameter)

  return (
    <div className="measure">
      <h2>{title}</h2>
      <Slider min={0} max={max} marks={marks} included={false} onChange={value => dispatch(simulationSetParameter({[name]: value / 100}))} value={parameter[name] * 100} />
    </div>
  )
}

const MAX_TESTS = 32624540 * 100;

export const CounterMeasures = () => (
  <div id='counter-measures'>
    <Measure title='Social Distancing' name='socialDistancingFactor' marks={{0: 'no restrictions', 50: 'moderate', 90: 'strict', 100: 'unrealistic'}}/>
    <Measure title='Mask Adoption' name='maskAdoption' marks={{0: '0%', 100: '100%'}} />
    <Measure title='Travel' name='travelDampingFactor' marks={{0: 'normal', 100: 'no travel'}} />
    <Measure title='Domestic Travel' name='domesticTravelDampingFactor' marks={{0: 'normal', 100: 'no travel'}} />
    <Measure title='App Installs' name='appFactor' marks={{0: '0%', 100: '100%'}} />
    <Measure title='Test per day' name='testCapacity' marks={{0: '0', [MAX_TESTS]: '300 Mio.'}} max={MAX_TESTS} />
  </div>
)
