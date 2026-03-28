/**
 * Generates slot-win.wav (16-bit mono PCM, 44.1kHz).
 * Reel spin uses in-page Web Audio again; this file is only for the win sting.
 * Run: node generate-slot-audio.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleRate = 44100;

function writeWav(filename, floatSamples) {
  const n = floatSamples.length;
  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(__dirname, filename), buffer);
}

function brownNoise(len) {
  const out = new Float32Array(len);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.04 * w) * 0.96;
    out[i] = last;
  }
  return out;
}

function genSlotWin() {
  const dur = 3.4;
  const N = Math.floor(sampleRate * dur);
  const out = new Float32Array(N);

  function addDing(timeSec, freqHz, amp, lenMs) {
    const start = Math.floor(timeSec * sampleRate);
    const len = Math.floor((lenMs / 1000) * sampleRate);
    for (let i = 0; i < len && start + i < N; i++) {
      const e = Math.exp(-i / (sampleRate * 0.11));
      out[start + i] += Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * amp * e;
    }
  }

  addDing(0.02, 1046, 0.22, 280);
  addDing(0.1, 1318, 0.26, 320);
  addDing(0.18, 1661, 0.28, 360);
  addDing(0.28, 2093, 0.3, 400);
  addDing(0.4, 2637, 0.32, 480);
  addDing(0.55, 3322, 0.28, 420);
  addDing(0.72, 2093, 0.2, 280);
  addDing(0.8, 2637, 0.22, 300);
  addDing(0.95, 3136, 0.25, 350);
  addDing(1.1, 3920, 0.18, 260);

  const noise = brownNoise(N);
  for (let i = Math.floor(0.45 * sampleRate); i < Math.floor(3.05 * sampleRate); i++) {
    const t = i / sampleRate;
    const env = Math.sin(((t - 0.45) / 2.6) * Math.PI);
    out[i] += noise[i] * 0.095 * Math.max(0, env);
  }

  for (let b = 0; b < 24; b++) {
    const t = 1.25 + b * 0.045 + Math.random() * 0.02;
    addDing(t, 1800 + (b % 5) * 200, 0.06 + Math.random() * 0.04, 80);
  }

  let peak = 0.001;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
  const scale = 0.94 / peak;
  for (let i = 0; i < N; i++) out[i] *= scale;
  return out;
}

writeWav("slot-win.wav", genSlotWin());
console.log("Created slot-win.wav in", __dirname);
