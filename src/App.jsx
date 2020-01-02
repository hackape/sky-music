// @ts-check
import React, { useState } from 'react'
import * as Tone from 'tone'

Tone.Transport.bpm.value = 100

function getLayout() {
  const rowOfFive = new Array(5).fill(true)
  return [0, 1, 2].map(rowNum => {
    return rowOfFive.map((_, i) => i + rowNum * 5)
  })
}

const layout = getLayout()
const letters = 'cdefgab'.toUpperCase().split('')

var synth = new Tone.Synth({}).toMaster()

globalThis.synth = synth

export default function App() {
  const [scaleOffset, setScaleOffset] = useState(0)

  const baseLevel = 3

  return (
    <div className='Layout'>
      {layout.map((row, i) => {
        return (
          <div className='Row' key={`row_${i}`}>
            {row.map((keyId, j) => {
              const index = scaleOffset + (keyId % 7)
              const levelOffset = Math.floor((scaleOffset + keyId) / 7)
              const note = letters[index] + (baseLevel + levelOffset)

              const playNote = () => {
                synth.triggerAttackRelease(note, '8n')
              }

              let shape = j % 2 ? 'Diamond' : 'Circle'
              if (keyId % 7 == 0) shape = 'Composed'

              return (
                <div className='Key' key={`key_${j}`} onClick={playNote} onTouchStart={playNote}>
                  <div className='KeyShape'>
                    {shape == 'Composed' ? (
                      <>
                        <div className='Diamond'></div>
                        <div className='KeyShape'>
                          <div className='Circle'></div>
                        </div>
                      </>
                    ) : (
                      <div className={shape} />
                    )}
                  </div>
                  {note}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
