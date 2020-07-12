import _ from 'lodash'
import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import useMouse from '@react-hook/mouse-position'
import { parseString } from 'xml2js'
import counties from '../counties.json'
import svgImage from '../Usa_counties_large.svg'

let svg

parseString(svgImage, (err, result) => {
  if (err) {
    return console.error(err)
  }

  svg = result.svg
})

export const Map = () => {
  const { stats } = useSelector(s => s.simulation)
  const [size, setSize] = useState([window.innerWidth, window.innerHeight])
  const canvas = useRef()

  const mouse = useMouse(canvas, {
    enterDelay: 100,
    leaveDelay: 100,
  })

  useEffect(() => {
    const updateSize = () => {
      setSize([window.innerWidth, window.innerHeight])
    }

    window.addEventListener('resize', updateSize)

    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    const ctx = canvas.current.getContext('2d')

    ctx.clearRect(0, 0, size[0], size[1])

    ctx.beginPath()
    const path = new Path2D(svg.path[0].$.d)
    ctx.lineWidth = 0.7
    ctx.strokeStyle = 'black'
    ctx.stroke(path)

    ctx.strokeStyle = 'darkgrey'

    svg.g[0].path.forEach(({ $: { d }, title }) => {
      ctx.beginPath()

      const path = new Path2D(d)

      if (ctx.isPointInPath(path, mouse.x, mouse.y)) {
        ctx.lineWidth = 0.5
      } else {
        ctx.lineWidth = 0.3
      }
      ctx.stroke(path)

      const { n, pop } = counties[title[0]['_']]
      if (n > -1 && stats.infectious[n] > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${(stats.infectious[n] > 0 ? 0.2 : 0) + (stats.infectious[n] / pop) * 0.8})`
        ctx.fill(path)
      }
    })
  }, [stats, mouse])

  return (
    <div id='map-container'>
      <canvas ref={canvas} height={size[1]} width={size[0]} />
    </div>
  )
}
