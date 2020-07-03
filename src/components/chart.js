import _ from 'lodash'
import React from 'react'
import Plot from 'react-plotly.js'
import { useSelector } from 'react-redux'

export const Chart = ({ y, x, name, color, min, max, line, log, type = 'scatter' }) => (
  <div className='chart'>
    <h3>{name}</h3>
    <Plot
      useResizeHandler
      data={[
        {
          y,
          x,
          type,
          mode: 'lines',
          name,
          marker: { color }
        }
      ]}
      layout={{
        showlegend: false,
        plot_bgcolor: 'rgb(0, 0, 0)',
        autosize: true,
        margin: {
          l: 0,
          r: 0,
          b: 0,
          t: 0,
          pad: 0
        },
        yaxis: {
          range: [min, _.max([max, ...y])],
          showgrid: false,
          showline: false,
          zeroline: false,
          visible: false,
          type: log && 'log',
          autorange: log && true
        },
        xaxis: {
          visible: false,
          range: [0, _.max([x ? 0 : 60, y.length])]
        },
        shapes: line && [
          {
            type: 'line',
            xref: 'paper',
            x0: 0,
            y0: line,
            x1: 1,
            y1: line,
            line: {
              color: 'white',
              width: 1
            }
          }
        ]
      }}
      config={{
        displayModeBar: false
      }}
    />
  </div>
)
