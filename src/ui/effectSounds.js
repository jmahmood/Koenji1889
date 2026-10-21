// Original procedural Foley pack. Deterministic seed; no third-party recordings.
export const EFFECT_CUES={
  paper:{duration:.075,gain:.4},track:{duration:.22,gain:.75},station:{duration:.14,gain:.65},
  ledger:{duration:.16,gain:.5},cash:{duration:.4,gain:.65},safe:{duration:.28,gain:.7},
  departure:{duration:.72,gain:.55,duck:true},wheels:{duration:.6,gain:.2,loop:true},
  train:{duration:.45,gain:.65,duck:true},delivery:{duration:.3,gain:.6},
  warning:{duration:.45,gain:.55,duck:true},float:{duration:.55,gain:.55,duck:true},
  turn:{duration:.25,gain:.45},action:{duration:.075,gain:.25},
  giggle:{duration:.78,gain:.38},
};
export function effectSamples(kind,sampleRate=22050) {
  const spec=EFFECT_CUES[kind]||EFFECT_CUES.paper,samples=new Float32Array(Math.ceil(spec.duration*sampleRate));
  let seed=92741,low=0;const pi=Math.PI*2;
  for(let i=0;i<samples.length;i++) {
    const t=i/sampleRate;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.15*(noise-low);
    const ring=(hz,decay,delay=0)=>t<delay?0:Math.sin(pi*hz*(t-delay))*Math.exp(-(t-delay)*decay);
    let value;
    switch(kind) {
      case 'giggle': {
        // Three breathy, voiced little chuckles. Original synthesis, not a
        // recording or imitation of the reference child's voice.
        const pulse=Math.floor(t/.23),u=(t-pulse*.23)/.16;
        if(pulse>2||u<0||u>1){value=0;break;}
        const envelope=Math.pow(Math.sin(Math.PI*u),1.4);
        const fundamental=560-pulse*38+70*Math.sin(Math.PI*u);
        const phase=pi*(fundamental*t+1.5*Math.sin(pi*7*t));
        value=envelope*(.34*Math.sin(phase)+.19*Math.sin(phase*2)+.11*Math.sin(phase*3)+.04*noise);
        break;
      }
      case 'departure': value=(ring(620,2.8)+.35*ring(932,3.8)+noise*.06)*Math.min(1,t/.06);break;
      case 'wheels': {const phase=t%.15;value=low*Math.exp(-phase*65)+ring(150,18)*.05;break;}
      case 'track':value=low*1.4*Math.exp(-t*24)+ring(105,25)*.55+ring(730,40)*.12;break;
      case 'station':value=low*Math.exp(-t*45)+ring(480,32)*.65+ring(920,45)*.2;break;
      case 'cash':value=ring(1480,32)*.3+ring(2010,38,.055)*.28+ring(1720,30,.13)*.25+low*Math.exp(-t*15)*.25;break;
      case 'safe':value=ring(130,26)*.6+low*Math.exp(-t*40)+ring(710,35,.09)*.2;break;
      case 'train':value=ring(390,14)*.45+ring(590,12,.1)*.25+low*Math.exp(-t*30)*.4;break;
      case 'delivery':value=ring(260,24)*.4+ring(780,20,.05)*.3;break;
      case 'warning':value=ring(247,9)*.5+ring(294,12,.07)*.25;break;
      case 'float':value=ring(392,10)*.35+ring(494,10,.1)*.3+ring(587,9,.2)*.3;break;
      case 'turn':value=ring(523,22)*.35+ring(659,20,.09)*.3;break;
      case 'ledger':value=low*Math.exp(-t*40)*1.8+ring(180,42)*.4;break;
      default:value=(noise-low)*Math.exp(-t*75)*.3;
    }
    const fade=Math.min(1,i/(sampleRate*.004),(samples.length-1-i)/(sampleRate*.012));
    samples[i]=Math.max(-.95,Math.min(.95,value*.7*fade));
  }
  return samples;
}
