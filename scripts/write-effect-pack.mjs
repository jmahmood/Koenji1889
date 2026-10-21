import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {EFFECT_CUES,effectSamples} from '../src/ui/effectSounds.js';
const directory=new URL('../public/sfx/',import.meta.url);
await mkdir(directory,{recursive:true});
for(const kind of Object.keys(EFFECT_CUES)) {
  const rate=22050,pcm=effectSamples(kind,rate),wav=Buffer.alloc(44+pcm.length*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
  wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length*2,40);
  pcm.forEach((value,i)=>wav.writeInt16LE(Math.round(value*32767),44+i*2));
  await writeFile(new URL(`${kind}.wav`,directory),wav);
}
await writeFile(new URL('manifest.json',directory),JSON.stringify({provenance:'Original deterministic procedural synthesis in src/ui/effectSounds.js; no third-party audio.',sampleRate:22050,cues:EFFECT_CUES},null,2)+'\n');
console.log(`Wrote ${Object.keys(EFFECT_CUES).length} effects to ${fileURLToPath(directory)}`);
