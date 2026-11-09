"""Reproduce TWIST Neon Abyss V2: deterministic, original 27-second soundscape."""
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io.wavfile import write
from pathlib import Path
sr=32000; secs=27.0; N=int(sr*secs)
t=np.arange(N)/sr; rng=np.random.default_rng(5202)
L=np.zeros(N,dtype=np.float64); R=np.zeros(N,dtype=np.float64)
def env(a,b,attack=.4,release=.8):
    count=max(1,int((b-a)*sr)); tt=np.arange(count)/sr
    return np.clip(tt/max(.005,attack),0,1)**.9*np.clip(((b-a)-tt)/max(.005,release),0,1)**1.4
def add(start,sound,level=1.0,pan=0.0):
    idx=int(start*sr)
    if idx>=N:return
    d=np.asarray(sound,dtype=np.float64)
    if idx<0:d=d[-idx:];idx=0
    limit=min(len(d),N-idx); angle=(pan+1)*np.pi/4
    L[idx:idx+limit]+=d[:limit]*level*np.cos(angle)
    R[idx:idx+limit]+=d[:limit]*level*np.sin(angle)
def pad(chord,start,dur,level=.11):
    m=int(dur*sr); tt=np.arange(m)/sr
    e=env(0,dur,attack=1.5,release=1.8)*(.86+.14*np.sin(2*np.pi*.085*tt))
    for k,f in enumerate(chord):
        sig=.70*np.sin(2*np.pi*f*tt+.06*np.sin(2*np.pi*.18*tt))+.19*np.sin(2*np.pi*(f*1.0038)*tt+.44)+.10*np.sin(2*np.pi*f*2*tt+.1)
        sig=sosfilt(butter(2,min(3000,4*f+300),fs=sr,output='sos'),sig)
        add(start,e*sig,level=level/(1+.13*k),pan=(-.4+.8*(k%2)))
def note(f,start,dur,level=.09,pan=0):
    m=int(dur*sr);tt=np.arange(m)/sr
    sig=(np.sin(2*np.pi*f*tt+1.2*np.exp(-tt*12)*np.sin(2*np.pi*f*2*tt))+.25*np.sin(2*np.pi*f*2*tt+.3))*np.exp(-tt*2.3)
    sig*=np.minimum(1,tt/.013)*np.minimum(1,np.maximum(0,(dur-tt)/.08))
    add(start,sig,level,pan)
    for offset,amp,side in ((.25,.32,-pan),(.57,.17,pan*.6),(.96,.08,-pan)):
        add(start+offset,sig,level*amp,side)
def sub(f,start,dur=.45,level=.15):
    m=int(dur*sr);tt=np.arange(m)/sr
    amp=(1-np.exp(-tt*65))*np.exp(-tt*5)*np.maximum(0,np.minimum(1,(dur-tt)/.08))
    add(start,np.sin(2*np.pi*f*tt+.22*np.sin(2*np.pi*2.8*tt))*amp,level,0)
def wash(start,dur,low,high,level=.04,pan=.0):
    m=int(dur*sr);tt=np.arange(m)/sr
    noise=rng.normal(0,1,m)
    smooth=sosfilt(butter(2,[low,high],btype='bandpass',fs=sr,output='sos'),noise)
    smooth/=max(np.std(smooth),1e-7)
    add(start,smooth*env(0,dur,attack=.65*dur,release=.32*dur),level,pan)
m=int(6.0*sr);tt=np.arange(m)/sr
rising=(np.sin(2*np.pi*(47*tt+10*tt*tt/6))*.4+.16*np.sin(2*np.pi*(94*tt+21*tt*tt/6)))
rising*=np.clip(tt/2.6,0,1)*np.clip((6-tt)/.5,0,1)
add(0,rising,.14,0)
wash(.5,5.4,180,950,.034,-.35);wash(2.8,3.0,800,2700,.025,.4)
for i,f in enumerate([174.61,196,207.65,261.63,311.13,349.23]):
    note(f,1.2+i*.55,.95,.038,pan=(-.5+.2*i))
sub(55,5.68,1.9,.3);wash(5.58,3.3,100,620,.04,.25)
chords=[
 ([87.31,130.81,207.65,311.13,392.0],5.1,6.3),
 ([69.30,103.83,174.61,261.63,311.13],10.8,6.3),
 ([103.83,155.56,207.65,311.13,392],16.3,6.25),
 ([77.78,116.54,196,293.66,349.23],21.4,6.0)]
for i,(ch,start,duration) in enumerate(chords):
    pad(ch,start,duration,.118);sub(ch[0],start+.25,1.2,.13)
mel=[(6.5,415.30,.9),(8.15,392.0,.85),(9.3,311.13,1.3),
     (11.55,349.23,.85),(12.95,311.13,.85),(14.15,261.63,1.45),
     (16.6,415.30,.85),(18.2,466.16,.75),(19.4,415.30,1.05),
     (21.7,392,.9),(23.0,349.23,.85),(24.4,311.13,1.1)]
for i,(at,f,dur) in enumerate(mel):note(f,at,dur,.065,pan=(-.45 if i%2 else .4))
beat=60/82
for j in range(32):
    at=6.05+j*beat
    if at>26:break
    sub(55 if j<8 else 46.25 if j<16 else 51.9 if j<24 else 58.27,at,.43,.052 if j%4 else .073)
    if j%2==1:wash(at,.17,750,2700,.004,pan=(-.3 if j%4==1 else .3))
for at,f in [(7.2,784),(10.25,659),(13.9,698),(17.0,830),(21.2,740),(24.2,622)]:
    note(f,at,.18,.022,.65)
side=np.sin(2*np.pi*.13*t)*.028
L*=1+side;R*=1-side
fades=np.clip(np.minimum(1,t/.7)*np.minimum(1,(secs-t)/2.4),0,1)
L*=fades;R*=fades
stereo=np.tanh(np.stack([L,R],axis=1)*1.33)
peak=np.max(np.abs(stereo));stereo*=.82/max(peak,1)
out=Path('assets/twist-neon-abyss-v2.wav')
out.parent.mkdir(parents=True,exist_ok=True)
write(str(out),sr,(stereo*32767).astype(np.int16))
print(out,peak)
