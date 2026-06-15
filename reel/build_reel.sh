#!/bin/bash
set -e
cd "$(dirname "$0")"
A=assets; F=frames; S=seg; mkdir -p $S
ENC="-c:v libx264 -pix_fmt yuv420p -r 30 -preset medium"

# --- 세그먼트 (무음, 1080x1920, 30fps) ---
# S1: 팬 B-roll + 훅 자막
ffmpeg -y -i $A/broll_fan.mp4 -i $F/ov_hook.png -filter_complex \
"[0:v]scale=1080:1920,setsar=1,trim=0:5.0,setpts=PTS-STARTPTS[v];[v][1:v]overlay=0:0,format=yuv420p[o]" \
-map "[o]" -an -t 5.0 $ENC $S/s1.mp4 -loglevel error

mkimg(){ ffmpeg -y -loop 1 -t $2 -i $F/$1 -vf "scale=1080:1920,format=yuv420p" -an -t $2 $ENC $S/$3 -loglevel error; }
mkimg frame_gate.png 5.5 s2.mp4
mkimg frame_rice.png 5.2 s3.mp4
mkimg frame_ricezoom.png 7.5 s4.mp4
mkimg frame_fortune.png 4.0 s5.mp4

# S6a: 골드카드 B-roll 1.5s
ffmpeg -y -i $A/broll_card.mp4 -vf "scale=1080:1920,setsar=1,format=yuv420p" -an -t 1.5 $ENC $S/s6a.mp4 -loglevel error
mkimg frame_wenger.png 4.7 s6b.mp4
mkimg frame_cta.png 5.3 s7.mp4

# --- concat ---
printf "file 's1.mp4'\nfile 's2.mp4'\nfile 's3.mp4'\nfile 's4.mp4'\nfile 's5.mp4'\nfile 's6a.mp4'\nfile 's6b.mp4'\nfile 's7.mp4'\n" > $S/list.txt
ffmpeg -y -f concat -safe 0 -i $S/list.txt -c copy $S/silent.mp4 -loglevel error

# --- 오디오: VO 7줄 싱크 + 음악 ---
ffmpeg -y -i $S/silent.mp4 \
 -i $A/vo1.wav -i $A/vo2.wav -i $A/vo3.wav -i $A/vo4.wav -i $A/vo5.wav -i $A/vo6.wav -i $A/vo7.wav \
 -stream_loop -1 -i $A/music.m4a \
 -filter_complex \
"[1:a]adelay=100|100[a1];[2:a]adelay=5000|5000[a2];[3:a]adelay=10500|10500[a3];\
[4:a]adelay=15700|15700[a4];[5:a]adelay=23200|23200[a5];[6:a]adelay=28700|28700[a6];\
[7:a]adelay=33400|33400[a7];[8:a]atrim=0:38.7,afade=t=out:st=37.7:d=1,volume=0.16[m];\
[a1][a2][a3][a4][a5][a6][a7][m]amix=inputs=8:normalize=0:duration=longest[aout]" \
 -map 0:v -map "[aout]" -t 38.7 -c:v copy -c:a aac -b:a 192k reel_gooner.mp4 -loglevel error

echo "=== DONE ==="
ffprobe -v error -show_entries format=duration,size -of default=nw=1 reel_gooner.mp4
ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 reel_gooner.mp4
