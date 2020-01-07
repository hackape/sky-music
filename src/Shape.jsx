import React from 'react'

export function Shape({ type }) {
  return (
    <svg viewBox='-55 -55 110 110' version='1.1' xmlns='http://www.w3.org/2000/svg'>
      <defs>
        <filter
          width='200%'
          height='200%'
          x='-50%'
          y='-50%'
          filterUnits='objectBoundingBox'
          id='filter-blur'
        >
          <feGaussianBlur stdDeviation='8' in='SourceGraphic'></feGaussianBlur>
        </filter>
      </defs>

      <g stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
        <circle
          id='halo'
          stroke='currentColor'
          strokeWidth='8'
          filter='url(#filter-blur)'
          cx='0'
          cy='0'
          r='32'
        ></circle>

        {type == 'diamond' ? null : (
          <circle id='circle' stroke='currentColor' strokeWidth='3' cx='0' cy='0' r='30'></circle>
        )}
        {type == 'diamond' ? (
          <rect
            id='diamond_small'
            stroke='#FFEFAE'
            strokeWidth='3'
            transform='rotate(45)'
            x='-27'
            y='-27'
            width='54'
            height='54'
          ></rect>
        ) : null}
        {type == 'composition' ? (
          <rect
            id='diamond_big'
            stroke='#FFEFAE'
            strokeWidth='3'
            transform='rotate(45)'
            x='-30'
            y='-30'
            width='60'
            height='60'
          ></rect>
        ) : null}
      </g>
    </svg>
  )
}
