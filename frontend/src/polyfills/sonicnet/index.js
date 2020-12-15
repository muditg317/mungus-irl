!window.AudioContext && (window.AudioContext = window.webkitAudioContext);
const { Sender: SonicSender, Receiver: SonicReceiver } = require('sonicnet');

export { SonicSender, SonicReceiver };
