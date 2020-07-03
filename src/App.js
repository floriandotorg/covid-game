import _ from 'lodash'
import React from 'react'
import { StatsHeader } from './components/stats-header'
import { Map } from './components/map'
import { ChartsBar } from './components/charts-bar'
import { CounterMeasures } from './components/counter-measures'
import { EndScreen } from './components/end-screen'
import { NewsTicker } from './components/news-ticker'
import { Copyright } from './components/copyright'

const App = () => {
  return (
    <>
      <StatsHeader />
      <Map />
      <CounterMeasures />
      <ChartsBar />
      <EndScreen />
      <footer>
        <NewsTicker />
        <Copyright />
      </footer>
    </>
  )
}

export default App
