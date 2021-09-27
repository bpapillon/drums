import * as Tone from 'tone';
import { each, map, range, sample, transform } from 'lodash';

import { s3BasePath, drumFiles } from './consts';
import { VisualFunThing } from './visual';

const visual = new VisualFunThing();

const getSchedule = (tripletProbability) => {
  if (Math.random() <= tripletProbability) {
    return sample([
      {
        note: "4t",
        perMeasure: 6,
      },
      {
        note: "8t",
        perMeasure: 12,
        probabilityEffect: 0.8,
      },
      // {
      //   note: "16t",
      //   perMeasure: 24,
      //   probabilityEffect: 0.9,
      // }
    ]);
  } else {
    return sample([
      {
        note: "8n",
        perMeasure: 8,
      },
      {
        note: "16n",
        perMeasure: 16,
        probabilityEffect: 0.6,
      },
    ]);
  }
};

const getStartTime = (i, note) => {
  const seconds = Tone.Time(note).toSeconds();
  const delayProbability = note.includes('t') ? 0 : 0.1;
  const delay = (Math.random() <= delayProbability) ? Tone.Time('16n') : 0;

  return seconds * i + delay;
};

const drumLoop = (player, config) => {
  const { measures = 1, probability, tripletProbability = 0.3 } = config;
  const { note, perMeasure, probabilityEffect = 1.0 } = getSchedule(tripletProbability);
  const iterations = measures * perMeasure;

  return map(range(0, iterations), (i) => {
    return new Tone.Loop({
      callback: (time) => player.start(time).stop(time + 0.05),
      humanize: true,
      interval: `${measures}m`,
      probability: + (Math.random() <= probability * probabilityEffect),
    }).start(getStartTime(i, note));
  });
};

let loops = [];

const start = (config) => {
  const { bpm } = config;

  const drumSampleUrls = transform(
    drumFiles,
    (res, names, group) => res[group] = names.map(f => `${s3BasePath}/${f}`),
    {},
  );

  // Reset loops from previous run
  each(loops, (loop) => loop.stop());
  loops = [];

  // Drum effects
  const drumCompress = new Tone.Compressor({
    threshold: -30,
    ratio: 10,
    attack: 0.01,
    release: 0.2,
  }).toDestination();
  const distortion = new Tone.Distortion({
    distortion: 0.4,
    wet: 0.4,
  });
  const filter = new Tone.Filter(400, 'lowpass').toDestination();

  // Hat
  loops = loops.concat(drumLoop(new Tone.Player({
    url: sample(drumSampleUrls.hat),
    volume: -10,
    fadeOut: 0.01
  }).chain(distortion, drumCompress), { probability: 0.8 }));

  // Snare/clap
  loops = loops.concat(drumLoop(new Tone.Player({
    url: sample([
      sample(drumSampleUrls.snare),
      sample(drumSampleUrls.clap),
      sample(drumSampleUrls.shaker_tam),
    ]),
    fadeOut: 0.01
  }).chain(distortion, drumCompress, filter), { probability: 0.4 }));

  // Kick
  loops = loops.concat(drumLoop(new Tone.Player({
    url: sample(drumSampleUrls.bd_kick),
    fadeOut: 0.01
  }).chain(distortion, drumCompress), { measures: 2, probability: 0.3, tripletProbability: 0 }));

  // Tom
  loops = loops.concat(drumLoop(new Tone.Player({
    url: sample([
      sample(drumSampleUrls.prc),
      sample(drumSampleUrls.tom),
    ]),
    fadeOut: 0.01
  }).chain(distortion, drumCompress), { probability: 0.6 }));

  new Tone.Loop({
    callback: visual.play.bind(visual),
    interval: "16n",
    probability: 0.7,
  }).start();

  Tone.Transport.bpm.value = bpm;
  Tone.loaded().then(() => {
    Tone.Transport.start();
  });
};

document.querySelector("#prompt").addEventListener("click", () => {
  if (Tone.Transport.state === 'started') {
    Tone.Transport.stop();
    visual.reset();
    document.querySelector("#prompt").innerText = "Another loop!";
  } else {
    start({
      bpm: 140,
    });
    document.querySelector("#prompt").innerText = "Stop the loop!";
  }
});
