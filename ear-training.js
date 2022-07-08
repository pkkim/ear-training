const NOTE_FACTORS = {
  "C": 1,
  "C#": 1.059463,
  "Db": 1.059463,
  "D": 1.122462,
  "D#": 1.189207,
  "Eb": 1.189207,
  "E": 1.259921,
  "F": 1.334839,
  "F#": 1.414213,
  "Gb": 1.414213,
  "G": 1.498307,
  "G#": 1.587401,
  "Ab": 1.587401,
  "A": 1.681792,
  "A#": 1.781797,
  "Bb": 1.781797,
  "B": 1.887748,
};

const SEMITONE_FACTORS = [
  1,
  1.059463,
  1.122462,
  1.189207,
  1.259921,
  1.334839,
  1.414213,
  1.498307,
  1.587401,
  1.681792,
  1.781797,
  1.887748,
]

const NOTE_SEQUENCE = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const freq = (note) => {
  // NB: B3 is right below C4
  const c4 = 261.625565;

  // works for octaves 0 through 9
  const octave = parseInt(note.charAt(note.length - 1));
  const octaveFactor = Math.pow(2, octave - 4);

  const noteFactor = NOTE_FACTORS[note.substring(0, note.length - 1)];

  return c4 * octaveFactor * noteFactor;
}

const playFrequency = (ctx, freq, duration, attack, decay) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + attack / 1000);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + decay / 1000);

  osc.frequency.value = freq;
  osc.type = "triangle";
  osc.connect(gain);
  osc.start(0);
  
  setTimeout(() => {
    osc.stop(0);
    osc.disconnect(gain);
    gain.disconnect(ctx.destination);
  }, duration);
}

const getContext = () => {
  return new window.AudioContext();
}

/**
 * notesAndDurations looks like [{freq: 440, duration: 500}] for A4 played for 500ms
 */
const playSequence = (notesAndDurations, delay) => {
  let acc = delay ?? 0;
  notesAndDurations.forEach(({freq, duration}) => {
    setTimeout(() => {
      const attack = Math.min(20, duration / 20);
      const decay = duration + 300;
      playFrequency(getContext(), freq, duration, attack, decay);
    }, acc);
    acc += duration;
  });
}

const makeSimpleNotesAndDurations = (freqs, duration) => (
  freqs.map(freq => ({freq, duration}))
)

const getSemitoneFactor = (semitone) => {
  const positionInOctave = ((semitone % 12) + 12) % 12;
  const factorInOctave = SEMITONE_FACTORS[positionInOctave];
  const octaves = (semitone - positionInOctave) / 12;
  return factorInOctave * Math.pow(2, octaves)
}

const playSemitoneSequence = (root, semitones, inversion = 0) => {
  const rootFreq = freq(root);

  let invertedSemitones = semitones;
  if (inversion > 0) {
    invertedSemitones = semitones.slice(inversion, semitones.length).concat(semitones.slice(0, inversion).map(s => s + 12))
  }

  const frequencies = invertedSemitones.map(semitone => rootFreq * getSemitoneFactor(semitone));
  playSequence(makeSimpleNotesAndDurations(frequencies, 500), 100);
}

const playMajorScale = (root) => {
  semitones = [0, 2, 4, 5, 7, 9, 11, 12];
  playSemitoneSequence(root, semitones);
}

const playMajorTriad = (root, inversion) => {
  semitones = [0, 4, 7];
  playSemitoneSequence(root, semitones, inversion);
}

const playMinorTriad = (root, inversion) => {
  semitones = [0, 3, 7];
  playSemitoneSequence(root, semitones, inversion);
}

const uiGetRoot = () => {
  const rootInput = document.getElementById("root-input");
  return rootInput.value;
}

const uiPlayMajorScale = () => {
  playMajorScale(uiGetRoot())
}

const uiPlayMajorTriad = (inversion) => {
  playMajorTriad(uiGetRoot(), inversion)
} 

const uiPlayMinorTriad = (inversion) => {
  playMinorTriad(uiGetRoot(), inversion)
}
