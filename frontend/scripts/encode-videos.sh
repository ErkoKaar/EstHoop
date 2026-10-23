#!/usr/bin/env bash
# Mängijate highlight-videod veebi jaoks: videod/<slug>/*.mp4 (repo juures, gitignore'is)
# -> public/videos/<slug>.mp4 + <slug>.webp (kaanepilt) ja src/data/playerVideos.json.
#
# Kasutus (frontend kaustast): scripts/encode-videos.sh <slug> [<slug> ...]
# Slugid antakse ette, et mängija, keda lehel pole, kogemata deploy'sse ei läheks.
# Manifest kirjutatakse alati uuesti kõigist public/videos all olevatest videotest.
set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")/.."
SRC=../videod
OUT=public/videos
MANIFEST=src/data/playerVideos.json

if [ $# -eq 0 ]; then
  echo "Kasutus: scripts/encode-videos.sh <slug> [<slug> ...]" >&2
  exit 1
fi

mkdir -p "$OUT"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Intro-mall (kõigil praegustel videotel, 30 fps): kaadrid 0-96, sissehajumine 1-16,
# aeglane suum, väljahajumine 82-96 mustaks. Originaali suum on ümardatud täispiksliteni
# ja pilt väriseb ±1 px. Kaader 16 renderdatakse perspective-filtriga uuesti alampiksli
# täpsusega (sama kiirus, 0,06% kaadri kohta) ja pannakse originaali peale. Mäng, heli ja
# kaadrite arv jäävad originaaliks. delogo eemaldab nime alt rea "Eesti koondis · klubi",
# sest klubi vananeb (ala x 50-540, y 520-568 on kõigil introdel sama).
Z='(1+0.0006*in)'
SMOOTH_INTRO="[1:v]select='eq(n,16)',delogo=x=50:y=520:w=490:h=48,loop=loop=96:size=1,setpts=N/30/TB,\
perspective=x0=W/2-W/2/$Z:y0=H/2-H/2/$Z:x1=W/2+W/2/$Z:y1=H/2-H/2/$Z:\
x2=W/2-W/2/$Z:y2=H/2+H/2/$Z:x3=W/2+W/2/$Z:y3=H/2+H/2/$Z:interpolation=cubic:eval=frame,\
fade=in:1:15,fade=out:82:14[intro];[0:v][intro]overlay=eof_action=pass,format=yuv420p[v]"

# Kas videol on see intro: kaader 0 ja vähemalt üks kaader 92-99 on peaaegu must. Must on
# YAVG 16, osal videotel jõuab väljahajumine ainult ~20-ni; intro ise on 40+, mäng 100+.
# -reinit_filter 0: intro on kodeeritud ilma värviruumi andmeteta, ülejäänu bt709-ga, ja
# parameetrite vahetusel alustaks ffmpeg filtreid (ja kaadriloendust) muidu otsast.
has_intro() {
  ffmpeg -hide_banner -nostats -reinit_filter 0 -t 3.5 -i "$1" -an \
    -vf "select='eq(n,0)+between(n,92,99)',signalstats,metadata=print:key=lavfi.signalstats.YAVG" \
    -f null - 2>&1 | sed -n 's/.*YAVG=//p' |
    awk 'NR==1 {first=$1; next} NR==2 || $1<min {min=$1} END {exit !(NR>=2 && first<24 && min<24)}'
}

# Lähtevideost välja lõigatav vahemik sekundites (algus kaasa arvatud, lõpp välja arvatud).
# Lõiked on klippide vahelistes mustades kohtades, nii et üleminek jääb nagu originaalis.
cut_range() {
  case $1 in
    # Esimene klipp (nurjunud pealevise ja vabavise, kaadrid 97-265): intro järel algab kohe järgmine
    henri-drell) echo "3.2547 8.888" ;;
  esac
}

for slug in "$@"; do
  input=$(find "$SRC/$slug" -maxdepth 1 -name '*.mp4' 2>/dev/null | head -n 1)
  if [ -z "$input" ]; then
    echo "Vahele: $slug (videod/$slug/*.mp4 puudub)" >&2
    continue
  fi
  echo "Kodeerin: $slug"
  if has_intro "$input"; then
    inputs=(-reinit_filter 0 -i "$input" -t 1 -i "$input")
    filter=$SMOOTH_INTRO
  else
    echo "Hoiatus: $slug algus ei vasta intro-mallile, intro jääb puutumata" >&2
    inputs=(-i "$input")
    filter="[0:v]format=yuv420p[v]"
  fi
  audio='0:a?'
  cut=$(cut_range "$slug")
  if [ -n "$cut" ]; then
    read -r cs ce <<< "$cut"
    # Kaadrid/heli vahemikus [cs, ce) välja, järgnev nihutatakse vahemiku võrra ettepoole.
    # asetnsamples: 10 ms helikaadrid, muidu lõikaks aselect 21 ms tükkide kaupa.
    filter="${filter%\[v\]}[full];[full]select='not(between(t,$cs,$ce-0.01))',setpts='PTS-gte(T,$ce-0.01)*($ce-$cs)/TB'[v];\
[0:a]asetnsamples=480,aselect='not(between(t,$cs,$ce-0.005))',asetpts='PTS-gte(T,$ce-0.005)*($ce-$cs)/TB'[a]"
    audio='[a]'
  fi
  # Lähte resolutsioon (720p) jääb, 540p oli täisekraanil liiga pehme. CRF 25 on
  # originaalile väga lähedal, CRF 23 andis 25% suurema faili peaaegu sama tulemusega.
  # faststart: brauser saab mängima hakata enne, kui kogu fail on alla laetud.
  ffmpeg -v error -y "${inputs[@]}" -map_metadata -1 \
    -filter_complex "$filter" -map "[v]" -map "$audio" \
    -c:v libx264 -preset slow -crf 25 -profile:v high -pix_fmt yuv420p -g 60 \
    -c:a aac -b:a 96k -movflags +faststart \
    "$OUT/$slug.mp4"
  # thumbnail valib 4.-14. sekundi vahelt kõige tüüpilisema kaadri (mitte üleminekut ega musta kaadrit).
  # Kaanepilt 960 px: kaart on kuni ~512 px lai, 2x ekraanil piisab.
  ffmpeg -v error -y -ss 4 -t 10 -i "$OUT/$slug.mp4" -vf thumbnail=300,scale=960:-2 -frames:v 1 "$tmp/$slug.png"
  cwebp -quiet -q 78 "$tmp/$slug.png" -o "$OUT/$slug.webp"
done

count=0
{
  echo "{"
  for file in "$OUT"/*.mp4; do
    slug=$(basename "$file" .mp4)
    duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$file")
    [ $count -eq 0 ] || echo ","
    printf '  "%s": { "duration": %.0f }' "$slug" "$duration"
    count=$((count + 1))
  done
  echo
  echo "}"
} > "$MANIFEST"

echo "Valmis: $count videot, manifest $MANIFEST"
