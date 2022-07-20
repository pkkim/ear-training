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
 * notesAndDurations looks like
 * [{freq: 440, duration: 500}] for A4 played for 500ms
 * or [{freq: [440, 880], duration: 500}] for A4 and A5 played for 500ms
 */
const playSequence = (notesAndDurations, delay) => {
  let acc = delay ?? 0;
  notesAndDurations.forEach(({freq, duration}) => {
    setTimeout(() => {
      const attack = Math.min(20, duration / 20);
      const decay = duration + 300;
      if (Array.isArray(freq)) {
        freq.forEach((f) => {
          playFrequency(getContext(), f, duration, attack, decay);
        })
      } else {
        playFrequency(getContext(), freq, duration, attack, decay);
      }
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

const playSemitoneSequence = (root, semitones, inversion = 0, playAllAtEnd = false) => {
  const rootFreq = freq(root);

  let invertedSemitones = semitones;
  if (inversion > 0) {
    invertedSemitones = semitones.slice(inversion, semitones.length).concat(semitones.slice(0, inversion).map(s => s + 12))
  }

  const frequencies = invertedSemitones.map(semitone => rootFreq * getSemitoneFactor(semitone));
  const sequence = makeSimpleNotesAndDurations(frequencies, 500)

  if (playAllAtEnd) {
    sequence.push({freq: frequencies, duration: 1000})
  }
  console.log({sequence});
  playSequence(sequence, 100);
}

// top level sound playing functions

const makePlayer = semitones => (root, inversion, playAllAtEnd = false) => {
  playSemitoneSequence(root, semitones, inversion, playAllAtEnd);
}

const playMajorScale = makePlayer([0, 2, 4, 5, 7, 9, 11, 12]);

// triads
const playMajorTriad = makePlayer([0, 4, 7]);
const playAugmentedTriad = makePlayer([0, 4, 8]);
const playMinorTriad = makePlayer([0, 3, 7]);
const playDiminishedTriad = makePlayer([0, 3, 6]);

const playMajor7 = makePlayer([0, 4, 7, 11]);
const playDominant7 = makePlayer([0, 4, 7, 10]);
const playMinor7 = makePlayer([0, 3, 7, 10]);
const playHalfDiminished7 = makePlayer([0, 3, 6, 10]);
const playFullyDiminished7 = makePlayer([0, 3, 6, 9]);

// Secret related code

let secret = null;

const getRandomIntInclusive = (min, max) => {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);
    return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}

const guess = (semitones, inversion) => {
  console.log({semitones, inversion, secret});
  const semitonesEqual = semitones.length == secret.semitones.length && 
    semitones.every((s, i) => s === secret.semitones[i]);
  return semitonesEqual && inversion === secret.inversion;
}

// UI interaction functions

const uiGetRoot = () => {
  const rootInput = document.getElementById("root-input");
  return rootInput.value;
}

const uiSetRandomInterval = () => {
  let semitones;
  if (secret && secret.semitones.length == 2) {
    ({ semitones } = secret);
  } else {
    semitones = [0, getRandomIntInclusive(1, 11)];
    secret = { semitones, inversion: 0 };
  }
  makePlayer(semitones)(uiGetRoot(), 0, true);
}

const uiSetRandomTriad = () => {
  let semitones, inversion;
  if (secret && secret.semitones.length === 3) {
    ({ semitones, inversion } = secret);
  } else {
    const triadType = getRandomIntInclusive(0, 3);
    const inversion = getRandomIntInclusive(0, 2);

    switch (triadType) {
      case 0:  // Major
        semitones = [0, 4, 7];
        break;
      case 1:  // Augmented
        semitones = [0, 4, 8];
        break;
      case 2:  // Minor
        semitones = [0, 3, 7];
        break;
      case 3:  // Diminished
        semitones = [0, 3, 6];
        break;
      default:
        throw new Error(`unhandled triad type: ${triadType}`);
    }
    secret = { semitones, inversion };
  }

  makePlayer(semitones)(uiGetRoot(), inversion, true);
}

const uiGuess = (semitones, inversion) => {
  const correct = guess(semitones, inversion);
  const element = document.getElementById("guess-result")
  if (correct) {
    element.innerHTML = "Correct"
    secret = null;
  } else {
    element.innerHTML = "Incorrect"
  }
}

const uiMajorScale = () => {
  playMajorScale(uiGetRoot())
}

const uiInterval = (halfSteps) => {
  makePlayer([0, halfSteps])(uiGetRoot(), 0, true);
  if (secret) {
    uiGuess([0, halfSteps], 0);
  }
}

const uiMajorTriad = (inversion) => {
  playMajorTriad(uiGetRoot(), inversion, true);
  if (secret) {
    uiGuess([0, 4, 7], inversion);
  }
} 
const uiAugmentedTriad = (inversion) => {
  playAugmentedTriad(uiGetRoot(), inversion, true)
  if (secret) {
    uiGuess([0, 4, 8], inversion);
  }
} 
const uiMinorTriad = (inversion) => {
  playMinorTriad(uiGetRoot(), inversion, true)
  if (secret) {
    uiGuess([0, 3, 7], inversion);
  }
}
const uiDiminishedTriad = (inversion) => {
  playDiminishedTriad(uiGetRoot(), inversion, true)
  if (secret) {
    uiGuess([0, 3, 6], inversion);
  }
}

const uiMajor7 = (inversion) => {
  playMajor7(uiGetRoot(), inversion, true);
}
const uiDominant7 = (inversion) => {
  playDominant7(uiGetRoot(), inversion, true);
}
const uiMinor7 = (inversion) => {
  playMinor7(uiGetRoot(), inversion, true);
}
const uiHalfDiminished7 = (inversion) => {
  playHalfDiminished7(uiGetRoot(), inversion, true);
}
const uiFullyDiminished7 = (inversion) => {
  playFullyDiminished7(uiGetRoot(), inversion, true);
}
