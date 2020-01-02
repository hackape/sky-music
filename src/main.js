import React from 'react'
import App from './App'
import {render} from 'react-dom'

render(React.createElement(App), document.getElementById('root'))

// import * as Tone from 'tone'

// globalThis.Tone = Tone

// var synth = new Tone.Synth({
// // 	"oscillator" : {
// // 		"type" : "square"
// //  },
// //  "envelope" : {
// //  	"attack" : 0.1
// //  }
// }).toMaster();
// synth.triggerAttackRelease("C4", "8n");
