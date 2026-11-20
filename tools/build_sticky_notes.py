#!/usr/bin/env python3
"""Build an offline Sticky-Note Wall player or visual storyboard from shared assets."""
from __future__ import annotations
import argparse
import base64
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'templates/sticky-notes'


def validate(scene):
    if scene.get('direction') not in ('rtl', 'ltr'):
        raise ValueError('direction must be rtl or ltr')
    if scene.get('duration', 0) <= 0:
        raise ValueError('duration must be positive')
    previous = -float('inf')
    for key in scene['camera']:
        if key['at'] <= previous or key['zoom'] <= 0:
            raise ValueError('camera times must strictly increase and zoom must be positive')
        previous = key['at']
    if not scene['camera']:
        raise ValueError('at least one camera key is required')
    ids = set()
    for note in scene['notes']:
        if note['id'] in ids or note['w'] <= 0 or note['h'] <= 0:
            raise ValueError('notes need unique ids and positive dimensions')
        ids.add(note['id'])
    if not ids:
        raise ValueError('at least one note is required')


def build(scene_path: Path, output: Path, audio: Path | None = None, storyboard=False):
    scene = json.loads(scene_path.read_text())
    validate(scene)
    css = []
    for name, filename, weight in [('StickyArabic', 'Arabic.ttf', '700')] + [
        (f['name'].replace('GloriaHallelujah', 'Gloria Hallelujah').replace('PermanentMarker', 'Permanent Marker').replace('RockSalt', 'Rock Salt'), f['name']+'.woff2', f['weight'])
        for f in json.loads((TEMPLATE / 'fonts.json').read_text())
    ]:
        data = base64.b64encode((TEMPLATE / filename).read_bytes()).decode()
        css.append(f'@font-face{{font-family:"{name}";src:url(data:font/{"ttf" if filename.endswith("ttf") else "woff2"};base64,{data});font-weight:{weight}}}')
    scripts = []
    for filename in ['helpers.js', 'kit.js', 'scene.js']:
        source = (TEMPLATE / filename).read_text()
        source = '\n'.join(line for line in source.splitlines() if not line.startswith('import '))
        scripts.append(source.replace('export ', ''))
    safe_json = json.dumps(scene, ensure_ascii=False).replace('<', '\\u003c')
    head = '<!doctype html><html lang="'+('ar' if scene['direction']=='rtl' else 'en')+'" dir="'+scene['direction']+'"><meta charset="utf-8"><title>Sticky-Note Wall</title><style>'+''.join(css)+'body{margin:0;background:#221b15;color:white;font:16px sans-serif}canvas{display:block;width:100%;height:auto}main{max-width:1280px;margin:auto}nav{display:flex;gap:12px;padding:16px;align-items:center;flex-wrap:wrap}input[type=range]{flex:1}button,label{cursor:pointer}article{background:#352a21;padding:10px}#panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}p{line-height:1.6}</style>'
    runtime = '<script>\n'+'\n'.join(scripts)+'\nconst SCENE='+safe_json+';window.DURATION=SCENE.duration;window.explainer=(ctx,w,h,t)=>drawScene(ctx,w,h,t,SCENE);</script>'
    if storyboard:
        beats = scene.get('beats', [])
        if not beats:
            raise ValueError('storyboard needs beats with start/end, spoken words, transition, sounds and on-screen text')
        body = '<main><h1>Sticky-Note Wall</h1><div id="panels">'
        for i, beat in enumerate(beats):
            body += '<article><canvas width="1280" height="720" data-time="'+str(beat.get('frameAt',beat['start']))+'"></canvas><p>'+html.escape(f"{i+1} · {beat['start']}–{beat['end']} s")+'</p>'
            for field in ['words','onScreen','transition','sounds']:
                body += '<p>'+html.escape(str(beat.get(field,'')))+'</p>'
            body += '</article>'
        body += '</div><p>'+html.escape('Assumptions: '+scene.get('assumptions','None'))+'</p></main>'
        player = "window.ready=(async()=>{await Promise.all([...document.fonts].map(f=>f.load()));document.querySelectorAll('canvas').forEach(c=>explainer(c.getContext('2d',{willReadFrequently:true}),1280,720,+c.dataset.time));})();"
    else:
        src = '' if not audio else 'data:audio/'+('wav' if audio.suffix=='.wav' else 'mpeg' if audio.suffix=='.mp3' else 'mp4')+';base64,'+base64.b64encode(audio.read_bytes()).decode()
        body = '<main><canvas width="1280" height="720"></canvas><nav><button id="play">▶ / Ⅱ</button><input id="scrub" type="range" min="0" step="0.033333"><span id="time"></span><button id="sound">♫ on/off</button><label>Loop <input id="loop" type="checkbox" checked></label><label>Load voiceover <input id="load" type="file" accept="audio/*"></label></nav><audio preload="auto" src="'+src+'"></audio></main>'
        runtime += '<script>\n'+(TEMPLATE/'sound.js').read_text()+'\nconst scheduleStickySound=scoreSound;window.scoreSound=k=>scheduleStickySound(k,SCENE);</script>'
        player = (TEMPLATE/'player.js').read_text()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(head+body+runtime+'<script>\n'+player+'\n</script></html>')
    return output


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--scene',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--audio',type=Path)
    p.add_argument('--storyboard',action='store_true')
    a=p.parse_args()
    print(build(a.scene,a.out,a.audio,a.storyboard))

if __name__=='__main__':
    main()
