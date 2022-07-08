const freq = (note) => {
  // NB: B3 is right below C4
  const c4 = 261.625565;

  // works for octaves 0 through 9
  const octave = parseInt(note.charAt(note.length - 1));
  const octaveFactor = Math.pow(2, octave - 4);

  const noteFactors = {
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
  const noteFactor = noteFactors[note.substring(0, note.length - 1)];

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
 * notesAndDurations looks like [{note: "A4", duration: 500}] for A4 played for 500ms
 */
const playSequence = (notesAndDurations, delay) => {
  let acc = delay;
  notesAndDurations.forEach(({note, duration}) => {
    setTimeout(() => {
      const attack = Math.min(20, duration / 20);
      const decay = duration + 300;
      console.log({duration})
      playFrequency(getContext(), freq(note), duration, attack, decay);
    }, acc);
    acc += duration;
    console.log({acc});
  });
}

const makeSimpleNotesAndDurations = (notes) => (
  notes.map(note => ({note, duration: 800}))
)

const playCMajorScale = () => {
  const cMajor = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  const notesAndDurations = makeSimpleNotesAndDurations(cMajor, 500);
  console.log({notesAndDurations});
  playSequence(notesAndDurations, 0);
}

// const playCMajorScale = () => {
//   const cMajor = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
//   cMajor.forEach((note, i) => {
//     setTimeout(() => {
//       playFrequency(getContext(), freq(note), 1000, 10, 1000);
//     }, i * 500);
//   });
// }
