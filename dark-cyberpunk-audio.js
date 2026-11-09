/* TWIST: original procedural dark-cyberpunk soundscape, no samples or external audio files.
   Playback is strictly opt-in to respect browser autoplay restrictions. */
(()=>{
'use strict';
const AC=window.AudioContext||window.webkitAudioContext;
const root=document.createElement('div');
root.className='twist-audio';
root.dataset.on='false';
root.setAttribute('role','group');
root.setAttribute('aria-label','Website audio controls');
root.innerHTML='<button type="button" class="twist-audio-main" id="twistSoundToggle" aria-pressed="false" aria-label="Enable website sound" title="Enable cyberpunk soundscape"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="twist-sound-wave" d="M15 8a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14"/></svg><span id="twistSoundLabel">SOUND OFF</span></button><button type="button" class="twist-audio-settings" id="twistVolumeSettings" aria-label="Volume settings" aria-expanded="false" aria-controls="twistVolumePanel">⌄</button><div class="twist-audio-volume" id="twistVolumePanel" hidden><label for="twistVolume">VOL</label><input type="range" id="twistVolume" min="0" max="100" step="1" value="25" aria-label="Sound volume"><output id="twistVolumeValue" for="twistVolume">25%</output></div>';
document.body.appendChild(root);
const toggle=root.querySelector('#twistSoundToggle');
const settings=root.querySelector('#twistVolumeSettings');
const panel=root.querySelector('#twistVolumePanel');
const slider=root.querySelector('#twistVolume');
const output=root.querySelector('#twistVolumeValue');
const label=root.querySelector('#twistSoundLabel');
if(!AC){toggle.disabled=true;toggle.title='Web Audio is not supported in this browser';label.textContent='AUDIO N/A';settings.disabled=true;return;}
let ctx=null,master=null,ambience=null,fx=null,noiseBuffer=null;
let enabled=false,vol=25,inIntro=document.body.classList.contains('loading'),skipped=false,portalPlayed=false;
function ramp(param,value,duration){
 const t=ctx.currentTime;
 param.cancelScheduledValues(t);
 param.setValueAtTime(param.value,t);
 param.linearRampToValueAtTime(value,t+Math.max(.015,duration));
}
function makeOsc(freq,type,gain,dest){
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.value=freq;g.gain.value=gain;
 o.connect(g).connect(dest);o.start();
 return o;
}
function initAudio(){
 if(ctx)return;
 ctx=new AC();
 master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
 ambience=ctx.createGain();ambience.gain.value=0;ambience.connect(master);
 fx=ctx.createGain();fx.gain.value=.78;fx.connect(master);
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=460;filter.Q.value=.45;filter.connect(ambience);
 makeOsc(55,'sine',.18,filter);
 makeOsc(82.53,'triangle',.08,filter);
 makeOsc(110.35,'sine',.055,filter);
 makeOsc(164.81,'sine',.018,filter);
 const lfo=ctx.createOscillator(),sweep=ctx.createGain();
 lfo.type='sine';lfo.frequency.value=.057;sweep.gain.value=130;
 lfo.connect(sweep).connect(filter.frequency);lfo.start();
 const len=ctx.sampleRate*2;
 noiseBuffer=ctx.createBuffer(1,len,ctx.sampleRate);
 const data=noiseBuffer.getChannelData(0);
 for(let i=0;i<len;i++)data[i]=(Math.random()*2-1);
 const bed=ctx.createBufferSource(),band=ctx.createBiquadFilter(),hiss=ctx.createGain();
 bed.buffer=noiseBuffer;bed.loop=true;band.type='bandpass';band.frequency.value=560;band.Q.value=.35;hiss.gain.value=.012;
 bed.connect(band).connect(hiss).connect(filter);bed.start();
}
function adjust(){
 if(!ctx)return;
 ramp(master.gain,enabled?(vol/100)*.52:0,.22);
 ramp(ambience.gain,enabled?(inIntro?.18:.45):0,inIntro?.3:1.35);
}
function tone(freq,duration,gain,type='sine',endFreq){
 if(!enabled||!ctx||ctx.state!=='running')return;
 const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,t);
 if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),t+duration);
 g.gain.setValueAtTime(.0001,t);
 g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.018);
 g.gain.exponentialRampToValueAtTime(.0001,t+duration);
 o.connect(g).connect(fx);o.start(t);o.stop(t+duration+.025);
 o.onended=()=>{o.disconnect();g.disconnect();};
}
function noiseSweep(duration,startFreq,endFreq,level){
 if(!enabled||!ctx||ctx.state!=='running')return;
 const t=ctx.currentTime,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 s.buffer=noiseBuffer;f.type='bandpass';f.Q.value=.7;
 f.frequency.setValueAtTime(startFreq,t);f.frequency.exponentialRampToValueAtTime(endFreq,t+duration);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+duration*.35);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
 s.connect(f).connect(g).connect(fx);s.start(t);s.stop(t+duration+.025);
 s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};
}
function introStart(){inIntro=true;skipped=false;portalPlayed=false;adjust();if(enabled){noiseSweep(1.55,120,920,.095);tone(52,1.55,.16,'sine',91);}}
function letter(index){if(skipped||!inIntro)return;const notes=[220,247,262,294,330,392];tone(notes[index]||220,.26,.075,'sine',(notes[index]||220)*1.3);}
function charge(){if(skipped||!inIntro)return;noiseSweep(1.75,190,1850,.16);tone(60,1.65,.23,'sawtooth',155);}
function portal(){if(skipped||!inIntro||portalPlayed)return;portalPlayed=true;tone(116,1.15,.50,'sine',38);tone(418,.78,.15,'triangle',192);noiseSweep(1.30,1700,260,.26);}
function introFinish(){inIntro=false;adjust();}
window.addEventListener('twist:intro-start',introStart);
window.addEventListener('twist:letter',e=>letter(e.detail.index));
window.addEventListener('twist:charge',charge);
window.addEventListener('twist:portal',portal);
window.addEventListener('twist:intro-skip',()=>{skipped=true;});
window.addEventListener('twist:intro-finish',introFinish);
function updateUI(){
 root.dataset.on=String(enabled&&vol>0);
 toggle.setAttribute('aria-pressed',String(enabled));
 label.textContent=enabled?(vol?'SOUND ON':'MUTED'):'SOUND OFF';
 toggle.setAttribute('aria-label',enabled?'Mute website sound':'Enable website sound');
 toggle.title=enabled?'Mute cyberpunk soundscape':'Enable cyberpunk soundscape';
 root.querySelectorAll('.twist-sound-wave').forEach(path=>{path.style.display=enabled&&vol>0?'':'none';});
}
toggle.addEventListener('click',async()=>{
 enabled=!enabled;
 if(enabled){
  try{initAudio();await ctx.resume();adjust();if(inIntro){noiseSweep(.7,210,950,.1);tone(74,.72,.12,'sine',124);}}
  catch(err){enabled=false;console.warn('TWIST audio unavailable:',err);}
 }else adjust();
 updateUI();
});
settings.addEventListener('click',()=>{
 const open=panel.hidden;panel.hidden=!open;settings.setAttribute('aria-expanded',String(open));
});
slider.addEventListener('input',()=>{
 vol=Number(slider.value);output.textContent=vol+'%';adjust();updateUI();
});
document.addEventListener('pointerdown',e=>{
 if(!root.contains(e.target)&&!panel.hidden){panel.hidden=true;settings.setAttribute('aria-expanded','false');}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;settings.setAttribute('aria-expanded','false');settings.focus();}
});
document.addEventListener('visibilitychange',()=>{
 if(!ctx||!enabled)return;
 if(document.hidden){ctx.suspend().catch(()=>{});}
 else{ctx.resume().then(adjust).catch(()=>{});}
});
window.addEventListener('pagehide',()=>{if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});});
updateUI();
})();