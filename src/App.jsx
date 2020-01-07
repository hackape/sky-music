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

const IS_MOBILE = navigator.maxTouchPoints > 0

globalThis.Tone = Tone

function getLayout() {
  const rowOfFive = new Array(5).fill(true)
  return [0, 1, 2].map(rowNum => {
    return rowOfFive.map((_, i) => i + rowNum * 5)
  })
}

const layout = getLayout()
const letters = 'cdefgab'.toUpperCase().split('')

const defaultSynth = new Tone.PolySynth(10).toMaster()
const instruments = { current: defaultSynth, default: defaultSynth }

function loadInstrument(name, cb) {
  const urlMap = Object.assign({}, INSTRUMENTS[name])

  const sampleFileCount = Object.keys(urlMap).length
  let minBy = 1
  if (sampleFileCount >= 17) minBy = 2
  if (sampleFileCount >= 33) minBy = 4
  if (sampleFileCount >= 49) minBy = 6
  const filtered = Object.keys(urlMap).filter((__, i) => i % minBy != 0)
  filtered.forEach(key => delete urlMap[key])

  const synth = new Tone.Sampler(urlMap, {
    baseUrl: 'samples/',
    onload: () => {
      instruments[name] = synth
      instruments.current = synth
      if (cb) cb()
    }
  }).toMaster()
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

  const [instrument, setInstrument] = useState('default')
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (instruments[instrument]) {
      instruments.current = instruments[instrument]
    } else {
      setLoading(true)
      loadInstrument(instrument, () => {
        setLoading(false)
      })
    }
  }, [instrument])

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
    instruments.current.triggerAttackRelease(note, '8n')
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

  const [darkMode, setDarkMode] = useLocalState('DarkMode', 1)

  return (
    <div className={'RootContainer' + (darkMode ? ' Dark' : '')}>
      <div className='Keyboard'>
        <div className='KeyboardLayout'>
          {layout.map((row, i) => {
            return (
              <div className='Row' key={`row_${i}`}>
                {row.map((keyId, j) => {
                  const note = getNoteFromKeyId(keyId)

                  let shape = j % 2 ? 'diamond' : 'circle'
                  if (keyId % 7 == 0) shape = 'composition'

                  const eventHandler = IS_MOBILE
                    ? { onTouchStart: () => playKey(keyId) }
                    : { onMouseDown: () => playKey(keyId) }

                  return (
                    <div className='Key' key={`key_${keyId}`} {...eventHandler}>
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
          <div className='ConfigPanelRight'>
            <label className='Control'>
              <span>Tempo</span>
              <input
                type='range'
                min='30'
                max='250'
                onInput={e => setTempo(Number(e.target.value))}
                value={tempo}
              ></input>
              <span style={{ width: '4em' }}>{tempo}bpm</span>
            </label>

            <label className='Control'>
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
            <label className='Control'>
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
            <label className='Control'>
              <span>Instrument</span>
              <select value={instrument} onInput={e => setInstrument(e.target.value)}>
                <option value='default'>Synthesizer</option>
                <option value='guitar'>Guitar (1.6MB)</option>
                <option value='piano'>Piano (2.7MB)</option>
              </select>
              {isLoading ? (
                <div style={{ marginLeft: '0.5em' }}>
                  <div className='LoadingSpinner' />
                </div>
              ) : null}
            </label>
            <label className='Control'>
              <span>Dark Mode</span>
              <input
                type='checkbox'
                checked={Boolean(darkMode)}
                onInput={e => setDarkMode(Number(e.target.checked))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
