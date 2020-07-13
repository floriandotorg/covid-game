import _ from 'lodash'
import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import useMouse from '@react-hook/mouse-position'
import { parseString } from 'xml2js'
import counties from '../counties.json'
import svgImage from '../Usa_counties_large.svg'

const canvasHeight = 600
const canvasWidth = 1000

let svg

parseString(svgImage, (err, result) => {
  if (err) {
    return console.error(err)
  }

  svg = result.svg
})

export const Map = () => {
  const { stats } = useSelector(s => s.simulation)
  const [currentCounty, setCurrentCounty] = useState(null)
  const canvas = useRef()

  const mouse = useMouse(canvas, {
    enterDelay: 100,
    leaveDelay: 100,
  })

  const { width, height } = canvas.current?.getBoundingClientRect() || {}

  useEffect(() => {
    const ctx = canvas.current.getContext('2d')

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.beginPath()
    const path = new Path2D(svg.path[0].$.d)
    ctx.lineWidth = 0.7
    ctx.strokeStyle = 'black'
    ctx.stroke(path)

    const x = mouse.x * 1/(width/canvasWidth)
    const y = mouse.y * 1/(height/canvasHeight)

    setCurrentCounty(null)
    svg.g[0].path.forEach(({ $: { d }, title }) => {
      ctx.beginPath()

      const path = new Path2D(d)

      const name = title[0]['_']
      const { n, pop } = counties[name]
      if (n > -1 && stats.infectious[n] > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(stats.infectious[n] > 0 ? 0.2 : 0) + (stats.infectious[n] / pop) * 0.8})`
        ctx.fill(path)
      }

      if (ctx.isPointInPath(path, x, y)) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#333'
        setCurrentCounty({ name, n, pop, x: mouse.clientX, y: mouse.clientY })
      } else {
        ctx.strokeStyle = 'darkgrey'
        ctx.lineWidth = 0.3
      }
      ctx.stroke(path)
    })
  }, [stats, mouse])

  return (
    <div id='map-container'>
      <canvas ref={canvas} height={canvasHeight} width={canvasWidth}/>

      {currentCounty && <div className='tooltip' style={{ top: currentCounty.y, left: currentCounty.x }}>
        <b>{currentCounty.name}</b> <br />
        Popultion: {((currentCounty.pop || 0) * 10).toLocaleString()}<br />
        Infected: {((stats.infectious[currentCounty.n] || 0) * 10).toLocaleString()}<br />
        Dead: {((stats.dead[currentCounty.n] || 0) * 10).toLocaleString()}<br />
        Recovered: {((stats.recovered[currentCounty.n] || 0) * 10).toLocaleString()}<br />
        ICUs: {(stats.beds[currentCounty.n] || 0).toLocaleString()}
      </div>}
    </div>
  )
}
