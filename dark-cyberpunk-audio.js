/* TWIST / NEON ABYSS V2 — original 27s audio, synced to existing 5.7s intro.
   Sound is OFF until explicitly enabled. Track: assets/twist-neon-abyss-v2.mp3 */
(()=>{
'use strict';
const asset='./assets/twist-neon-abyss-v2.mp3';
const root=document.createElement('div');
root.className='twist-audio';root.dataset.on='false';root.setAttribute('role','group');
root.setAttribute('aria-label','TWIST sound controls');
root.innerHTML='<button type="button" class="twist-audio-main" id="twistSoundToggle" aria-pressed="false" aria-label="Enable Neon Abyss V2 sound" title="Enable Neon Abyss V2 sound"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="twist-sound-wave" d="M15 8a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14"/></svg><span id="twistSoundLabel">SOUND OFF</span></button><button type="button" class="twist-audio-settings" id="twistVolumeSettings" aria-label="Volume settings" aria-expanded="false" aria-controls="twistVolumePanel">⌄</button><div class="twist-audio-volume" id="twistVolumePanel" hidden><label for="twistVolume">VOL</label><input type="range" id="twistVolume" min="0" max="100" step="1" value="25" aria-label="Sound volume"><output id="twistVolumeValue" for="twistVolume">25%</output></div>';
document.body.appendChild(root);
const toggle=root.querySelector('#twistSoundToggle');
const settings=root.querySelector('#twistVolumeSettings');
const panel=root.querySelector('#twistVolumePanel');
const slider=root.querySelector('#twistVolume');
const output=root.querySelector('#twistVolumeValue');
const label=root.querySelector('#twistSoundLabel');
const audio=document.createElement('audio');
audio.src=asset;audio.preload='metadata';audio.loop=false;audio.volume=0;
audio.setAttribute('aria-hidden','true');document.body.appendChild(audio);
let enabled=false,vol=25,introStartAt=performance.now(),introDone=!document.body.classList.contains('loading'),fade=0,fadeRaf=0,fadeToken=0,muteTimer=0;
const ambienceStart=6.05;
function ui(){
 root.dataset.on=String(enabled&&vol>0);
 toggle.setAttribute('aria-pressed',String(enabled));
 label.textContent=enabled?(vol?'SOUND ON':'MUTED'):'SOUND OFF';
 toggle.setAttribute('aria-label',enabled?'Mute Neon Abyss V2':'Enable Neon Abyss V2 sound');
 root.querySelectorAll('.twist-sound-wave').forEach(path=>path.style.display=enabled&&vol>0?'':'none');
}
function gainTarget(){return enabled?(vol/100)*.78:0;}
function fadeTo(target,ms=500){
 cancelAnimationFrame(fadeRaf);const token=++fadeToken;const from=audio.volume,t0=performance.now();
 const duration=Math.max(16,ms);
 function tick(now){
  if(token!==fadeToken)return;
  const t=Math.min(1,(now-t0)/duration),s=t*t*(3-2*t);
  audio.volume=Math.max(0,Math.min(1,from+(target-from)*s));
  if(t<1)fadeRaf=requestAnimationFrame(tick);
 }
 fadeRaf=requestAnimationFrame(tick);
}
function seek(seconds){
 const at=Math.max(0,seconds);
 try{audio.currentTime=at;}catch(e){
  audio.addEventListener('loadedmetadata',()=>{try{audio.currentTime=at;}catch(_){}},{once:true});
 }
}
function enterTime(){return introDone?ambienceStart:Math.max(0,Math.min(5.65,(performance.now()-introStartAt)/1000));}
async function resumeSound(fromTime,fast=false){
 if(typeof fromTime==='number')seek(fromTime);
 try{
  await audio.play();
  fadeTo(gainTarget(),fast?280:1000);
  return true;
 }catch(e){
  console.warn('TWIST Neon Abyss cannot play:',e);
  return false;
 }
}
async function onToggle(){
 clearTimeout(muteTimer);
 if(enabled){
  enabled=false;fadeTo(0,360);
  muteTimer=setTimeout(()=>{if(!enabled)audio.pause();},380);
  ui();return;
 }
 enabled=true;ui();
 const shouldSeek=audio.paused;
 const ok=await resumeSound(shouldSeek?enterTime():undefined);
 if(!ok){enabled=false;ui();}
}
toggle.addEventListener('click',onToggle);
settings.addEventListener('click',()=>{
 const show=panel.hidden;panel.hidden=!show;settings.setAttribute('aria-expanded',String(show));
});
slider.addEventListener('input',()=>{
 vol=Number(slider.value);output.textContent=vol+'%';
 if(enabled)fadeTo(gainTarget(),100);ui();
});
document.addEventListener('pointerdown',e=>{
 if(!root.contains(e.target)&&!panel.hidden){panel.hidden=true;settings.setAttribute('aria-expanded','false');}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;settings.setAttribute('aria-expanded','false');settings.focus();}
});
// Observe the existing intro from outside its animation code.
// This avoids coupling the sound controller to glyph and particle rendering.
const replayButton=document.getElementById('replayIntro');
const skipButton=document.getElementById('skip');
if(replayButton)replayButton.addEventListener('click',()=>{
 if(!introDone)return;
 introDone=false;
 introStartAt=performance.now();
 if(enabled){seek(0);resumeSound(undefined,true);}
});
if(skipButton)skipButton.addEventListener('click',()=>{
 if(enabled){seek(ambienceStart);fadeTo(gainTarget(),350);}
});
const introObserver=new MutationObserver(()=>{
 const loading=document.body.classList.contains('loading');
 if(!loading&&!introDone){
   introDone=true;
   if(enabled&&audio.paused)resumeSound(ambienceStart,false);
 }
});
introObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
audio.addEventListener('ended',()=>{
 if(!enabled)return;
 // Keep only the ambient portion looping; never repeat the opening portal blast.
 seek(ambienceStart);resumeSound(undefined,false);
});
audio.addEventListener('error',()=>{
 console.warn('TWIST V2 soundtrack missing or unsupported:',asset);
 enabled=false;cancelAnimationFrame(fadeRaf);audio.pause();
 label.textContent='AUDIO ERROR';
 root.dataset.on='false';toggle.setAttribute('aria-pressed','false');
 toggle.title='Audio could not be loaded. Check track asset path.';
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){audio.pause();}
 else if(enabled)resumeSound(undefined,true);
});
window.addEventListener('pagehide',()=>audio.pause());
ui();
})();