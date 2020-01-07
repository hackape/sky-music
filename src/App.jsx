// ts-check
import React, { useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { Shape } from './Shape'
const INSTRUMENTS = require('./instruments.json')
Object.keys(INSTRUMENTS).forEach(instrument => {
  const map = INSTRUMENTS[instrument]
  Object.keys(map).forEach(note => {
    const value = map[note]
    map[note] = instrument + '/' + value
  })
})

globalThis.Tone = Tone

function getLayout() {
  const rowOfFive = new Array(5).fill(true)
  return [0, 1, 2].map(rowNum => {
    return rowOfFive.map((_, i) => i + rowNum * 5)
  })
}

const layout = getLayout()
const letters = 'cdefgab'.toUpperCase().split('')

const instruments = {
  default: new Tone.PolySynth(10).toMaster()
}

function loadInstrument(name) {
  const synth = new Tone.Sampler(INSTRUMENTS[name], {
    baseUrl: 'samples/',
    onload: () => {
      console.log('instruments loaded')
    }
  }).toMaster()

  instruments.default.dispose()

  instruments.default = synth
}

globalThis.loadInstrument = loadInstrument

function useLocalState(key, defaultState) {
  const ctx = useRef({
    setState(val) {
      ctx._setState(val)
      clearTimeout(ctx.timeoutId)
      ctx.timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(key, val)
        } catch (err) {}
      }, 500)
    }
  }).current
  let _val
  if (!ctx.cached) {
    try {
      _val = localStorage.getItem(key)
      _val = Number(_val)
    } catch (err) {
    } finally {
      ctx.cached = _val || defaultState
    }
  }

  const [state, setState] = useState(ctx.cached)
  ctx._setState = setState
  return [state, ctx.setState]
}

const v0 = -20
const v1 = 20
export default function App() {
  const ctx = useRef({}).current
  ctx.synth = instruments.default
  const [tempo, setTempo] = useLocalState('tempo', 100)

  useEffect(() => {
    Tone.Transport.bpm.value = tempo
  }, [tempo])

  const [vol, setVol] = useLocalState('volume', 50)

  useEffect(() => {
    const vol_db = (vol / 100) * (v1 - v0) + v0
    Tone.Master.volume.value = vol_db
  }, [vol])

  const [toneShift, setToneShift] = useLocalState('tone', 14)

  function getNoteFromKeyId(keyId) {
    const scaleOffset = toneShift % 7
    const baseLevel = 2 + Math.floor(toneShift / 7)
    const index = (scaleOffset + (keyId % 7)) % 7
    const levelOffset = Math.floor((scaleOffset + keyId) / 7)
    const note = letters[index] + (baseLevel + levelOffset)
    return note
  }

  const playKey = keyId => {
    const keyShapeElm = document.getElementById(`key_shape_${keyId}`)
    if (keyShapeElm) {
      keyShapeElm.classList.remove('animated', 'flip')
      setTimeout(() => keyShapeElm.classList.add('animated', 'flip'))
    }

    const keyElm = document.getElementById(`key_btn_${keyId}`)
    if (keyElm) {
      keyElm.classList.remove('animated', 'bounceIn')
      setTimeout(() => keyElm.classList.add('animated', 'bounceIn'))
    }

    const note = getNoteFromKeyId(keyId)
    ctx.synth.triggerAttackRelease(note, '8n')
  }

  ctx.playKey = playKey

  useEffect(() => {
    const keyCodes = [81, 87, 69, 82, 84, 65, 83, 68, 70, 71, 90, 88, 67, 86, 66]
    let keyCodesPressed = new Set()
    function handleKeyDown(e) {
      const keyId = keyCodes.indexOf(e.keyCode)

      if (keyId == -1) return
      if (keyCodesPressed.has(e.keyCode)) return

      keyCodesPressed.add(e.keyCode)

      ctx.playKey(keyId)
    }

    function handleKeyUp(e) {
      if (keyCodesPressed.has(e.keyCode)) keyCodesPressed.delete(e.keyCode)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className='Keyboard'>
      <div className='KeyboardLayout'>
        {layout.map((row, i) => {
          return (
            <div className='Row' key={`row_${i}`}>
              {row.map((keyId, j) => {
                const note = getNoteFromKeyId(keyId)

                let shape = j % 2 ? 'diamond' : 'circle'
                if (keyId % 7 == 0) shape = 'composition'

                return (
                  <div
                    className='Key'
                    key={`key_${keyId}`}
                    onMouseDownCapture={() => playKey(keyId)}
                    onTouchStartCapture={() => playKey(keyId)}
                  >
                    <div className='KeyBtn' id={`key_btn_${keyId}`}>
                      <div className='KeyShape' id={`key_shape_${keyId}`}>
                        <Shape type={shape} />
                      </div>
                    </div>
                    <span className='KeyText'>{note}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className='KeyboardConfig'>
        <label className='Slider'>
          <span>Tempo</span>
          <input
            type='range'
            min='30'
            max='250'
            onInput={e => setTempo(Number(e.target.value))}
            value={tempo}
          ></input>
          <span>{tempo}bpm</span>
        </label>

        <label className='Slider'>
          <span>Tone</span>
          <input
            type='range'
            min='0'
            max='14'
            onInput={e => setToneShift(Number(e.target.value))}
            value={toneShift}
          ></input>
          <span>{getNoteFromKeyId(0)}</span>
        </label>
        <label className='Slider'>
          <span>Volume</span>
          <input
            type='range'
            min='0'
            max='100'
            onInput={e => setVol(Number(e.target.value))}
            value={vol}
          ></input>
          <span>{vol}</span>
        </label>
      </div>
    </div>
  )
}
