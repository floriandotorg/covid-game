import _ from 'lodash'
import React, { useState, useEffect, useRef } from 'react'
import Plot from 'react-plotly.js'
import Module from './sim'

function useInterval (callback, delay) {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick () {
      savedCallback.current()
    }
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

const P = 0.1
const D = 2

let country = {
  row: {
    people: _.times(5000, () => ({ s: 0, l: 0 })),
    neighbors: ['hk']
  },
  hk: {
    people: _.times(5000, () => ({ s: 0, l: 0 })),
    neighbors: ['row', 'sfa']
  },
  sfa: {
    people: _.times(5000, () => ({ s: 0, l: 0 })),
    neighbors: ['hk']
  }
}

_.range(10).forEach(n => { country.row.people[n].s = 1 })


const dstep = people => _.map(people, p => {
  const infect = p => {
    p.s = 1
    p.l = _.random(3, 14)
  }

  if (p.l < 0) {
    p.s = 2
  }

  _.range(D).forEach(() => {
    const p2 = _.sample(people)
    if (p2.s === 1 && p.s < 1) {
      (Math.random() < P) && infect(p)
    } else if (p.s === 1 && p2.s < 1) {
      (Math.random() < P) && infect(p2)
    }
  })

  return {
    ...p,
    l: p.s > 0 ? p.l - 1 : p.l
  }
})

const step = (country) => {
  country = _.mapValues(country, d => {
    _.each(d.neighbors, n => {
      const neighbor = country[n]

      _.range(_.random(10, 20)).forEach(() => {
        const x = _.random(0, d.people.length - 1)
        const y = _.random(0, neighbor.people.length - 1)

        d.people.push(neighbor.people[y])
        neighbor.people.push(d.people[x])

        d.people.splice(x, 1)
        neighbor.people.splice(y, 1)
      })
    })

    return d
  })

  return _.mapValues(country, d => {
    return {
      ...d,
      people: dstep(d.people)
    }
  })
}

const App = () => {
  const [data, setData] = useState([])

  useInterval(() => {

    // country = step(country)

    // const nd = _.reduce(_.mapValues(country, d => _.countBy(d.people, 's')), (result, value) => {
    //   _.keys(value).forEach(k => { result[k] = (result[k] || 0) + value[k] })
    //   return result
    // }, {})

    console.log(_.mapValues(country, d => _.countBy(d.people, 's')))

    // console.log(nd)

    //setData([...data, nd])
  }, 200)

  return (
    <Plot
      data={[
        {
          y: _.map(data, 0),
          type: 'scatter',
          mode: 'lines',
          name: 'S',
          marker: { color: 'blue' }
        },
        {
          y: _.map(data, 1),
          type: 'scatter',
          mode: 'lines',
          name: 'I',
          marker: { color: 'red' }
        },
        {
          y: _.map(data, 2),
          type: 'scatter',
          mode: 'lines',
          name: 'R',
          marker: { color: 'greeb' }
        }
      ]}
      layout={{ width: 640, height: 480 }}
    />
  )
}

export default App
