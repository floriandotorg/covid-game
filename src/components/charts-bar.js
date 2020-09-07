import _ from 'lodash'
import fp from 'lodash/fp'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Chart } from './chart'

const NUM_BARS = 10

const padArray = len => arr => [...Array(len - arr.length).fill(), ...arr]
const prepareNewInfections = fp.flow(
  fp.takeRight(NUM_BARS + 1),
  fp.map(1),
  arr => _.zipWith(arr.slice(1), arr.slice(0, -1), _.subtract),
  padArray(NUM_BARS)
)

export const ChartsBar = () => {
  const [initalBeds, setInitialBeds] = useState()
  const { overallStats } = useSelector(s => s.simulation)

  useEffect(() => {
    if (!initalBeds && !_.isEmpty(overallStats)) {
      setInitialBeds(_.first(overallStats)[4])
    }
  }, [overallStats])

  return (
    <div id='charts-bar'>
      <Chart y={_.map(overallStats, 1)} name='Total Infected' color='white' min={0} max={20000000} />
      <Chart
        y={prepareNewInfections(overallStats)}
        name='New Infections'
        color='orange'
        type='bar'
        x={_.times(NUM_BARS)}
      />
      <Chart y={_.map(overallStats, 3)} name='Dead' color='red' min={0} max={1000000} />
      <Chart y={_.map(overallStats, 2)} name='Recovered' color='green' min={0} max={20000000} />
      <Chart y={_.map(overallStats, 4)} name='ICUs' color='lightblue' min={0} max={initalBeds} />
      <Chart y={_.map(overallStats, 5)} name='Quarantined' color='yellow' min={0} max={1000} />
    </div>
  )
}
