import _ from 'lodash'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import counties from '../counties.json'

export const Map = () => {
  const { stats } = useSelector(s => s.simulation)

  useEffect(() => {
    const doc = document.getElementById('map').contentDocument
    if (doc) {
      for (const n in stats.infectious) {
        const county = counties[n]
        const elem = county && doc.getElementById(county.elem)
        if (elem) {
          elem.setAttribute(
            'fill',
            `rgba(255,0,0,${(stats.infectious[n] > 0 ? 0.2 : 0) + (stats.infectious[n] / county.pop) * 0.8})`
          )
        }
      }
    }
  }, [stats])

  return (
    <div id='map-container'>
      <object id='map' data='src/Usa_counties_large.svg' type='image/svg+xml'>
        Your browser doesn't support SVG
      </object>
    </div>
  )
}
