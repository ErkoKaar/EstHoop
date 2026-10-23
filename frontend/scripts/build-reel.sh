#!/usr/bin/env bash
# Highlight-reeli lähtevideo kliplistist: scripts/reels/<slug>.txt -> ../videod/<slug>/<slug>-highlights.mp4.
# Pärast seda tee veebiversioon: scripts/encode-videos.sh <slug>
#
# Klipid laetakse YouTube'ist parima kvaliteediga (kuni 1080p) kausta ../videod/.allikad/.
# Intro (reel-intro.html) ja lõpukaart (reel-outro.png) järgivad olemasolevate reelide malli:
# intro 97 kaadrit (sissehajumine 1-16, väljahajumine 82-96 mustaks), klippide vahel üleminek
# musta kaudu. Nii tunneb encode-videos.sh intro ära ja lisab sellele sama sujuva suumi.
#
# Kasutus (frontend kaustast): scripts/build-reel.sh <slug>
set -euo pipefail

cd "$(dirname "$0")/.."
slug=${1:?Kasutus: scripts/build-reel.sh <slug>}
list=scripts/reels/$slug.txt
cache=../videod/.allikad
out=../videod/$slug
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}

mkdir -p "$cache" "$out"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# YouTube id -> kohalik fail. -S eelistab resolutsiooni, siis kaadrisagedust, siis h264.
fetch() {
  local f
  f=$(find "$cache" -name "$1.*" | head -n 1)
  if [ -z "$f" ]; then
    yt-dlp -q --no-warnings -f "bv*[height<=1080]+ba/b" -S "res,fps,vcodec:avc1" \
      --merge-output-format mkv -o "$cache/$1.%(ext)s" "https://www.youtube.com/watch?v=$1" >&2
    f=$(find "$cache" -name "$1.*" | head -n 1)
  fi
  echo "$f"
}

# Ühtne vahekuju, et osad saaks ilma ümberkodeerimiseta kokku liita. Heli PCM-ina, sest
# AAC lõikudel liidaks iga lõigu priming-viivitus heli pildist järjest kaugemale.
ENC=(-c:v libx264 -preset fast -crf 14 -pix_fmt yuv420p -r 30 -c:a pcm_s16le -ar 48000 -ac 2)
SILENCE=(-f lavfi -i anullsrc=r=48000:cl=stereo)
parts=0
next_part() { parts=$((parts + 1)); part=$(printf '%s/%03d.mkv' "$tmp" "$parts"); echo "file '$part'" >> "$tmp/list.txt"; }

name=$(sed -n 's/^name //p' "$list")
read -r photo_id photo_t photo_scale photo_x photo_y < <(sed -n 's/^photo //p' "$list") || true
[ -n "$name" ] && [ -n "${photo_id:-}" ] || { echo "$list: name või photo rida puudub" >&2; exit 1; }

# 1. Intro: kaader kaardi fotoks, kaart Chrome'iga pildiks, pildist 97 kaadrit
ffmpeg -v error -y -ss "$photo_t" -i "$(fetch "$photo_id")" -frames:v 1 "$tmp/photo.png"
query="name=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
query+="&photo=file://$tmp/photo.png&scale=$photo_scale&x=$photo_x&y=$photo_y"
cutout=$(sed -n 's/^cutout //p' "$list")
[ -z "$cutout" ] || query+="&cutout=file://$PWD/public/$cutout"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size=1280,720 --virtual-time-budget=8000 --screenshot="$tmp/card.png" \
  "file://$PWD/scripts/reel-intro.html?$query" 2>/dev/null
cp "$tmp/card.png" "$out/$slug-intro.png"
next_part
ffmpeg -v error -y -loop 1 -framerate 30 -i "$tmp/card.png" "${SILENCE[@]}" -frames:v 97 -shortest \
  -vf "fade=in:1:15,fade=out:82:14,format=yuv420p" "${ENC[@]}" "$part"

# 2. Klipid: iga klipp hajub mustast sisse ja mustaks välja (5 kaadrit), heli samuti
while read -r kind id start end _; do
  [ "$kind" = clip ] || continue
  dur=$(awk "BEGIN { print $end - $start }")
  fo=$(awk "BEGIN { print $dur - 0.17 }")
  afo=$(awk "BEGIN { print $dur - 0.15 }")
  next_part
  # -nostdin: muidu loeks ffmpeg kliplisti (tsükli sisendi) ära
  ffmpeg -nostdin -v error -y -ss "$start" -to "$end" -i "$(fetch "$id" < /dev/null)" \
    -vf "scale=1280:720:flags=lanczos,fps=30,setsar=1,fade=in:st=0:d=0.17,fade=out:st=$fo:d=0.17,format=yuv420p" \
    -af "aresample=48000,afade=t=in:d=0.1,afade=t=out:st=$afo:d=0.15" "${ENC[@]}" "$part"
done < "$list"

# 3. Lõpukaart: 105 kaadrit nagu olemasolevatel reelidel
next_part
ffmpeg -v error -y -loop 1 -framerate 30 -i scripts/reel-outro.png "${SILENCE[@]}" -frames:v 105 -shortest \
  -vf "fade=in:0:16,fade=out:90:15,format=yuv420p" "${ENC[@]}" "$part"

# Video kodeeritakse uuesti ühtlase 30 fps ajateljega: mkv-osade millisekundi-ajatemplid jääksid
# muidu ebaühtlaseks ja encode-videos.sh intro overlay kordaks vahel kaadrit (intro nõksuks).
ffmpeg -v error -y -f concat -safe 0 -i "$tmp/list.txt" -fps_mode cfr -r 30 \
  -c:v libx264 -preset fast -crf 14 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -movflags +faststart "$out/$slug-highlights.mp4"
echo "Valmis: $out/$slug-highlights.mp4 ($((parts - 2)) klippi), intro kaart $out/$slug-intro.png"
