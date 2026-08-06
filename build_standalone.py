from pathlib import Path
import base64, mimetypes, re
ROOT=Path(__file__).resolve().parent

def data_uri(rel):
    p=ROOT/rel
    mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode('ascii')+'#'+p.name

html=(ROOT/'index.html').read_text()
css=(ROOT/'styles.css').read_text()+'\n'+(ROOT/'cartoon-theme.css').read_text()
js=(ROOT/'cartoon-art.js').read_text()+'\n'+(ROOT/'game.js').read_text()

asset_paths=sorted({m.group(0) for m in re.finditer(r"assets/[A-Za-z0-9_./-]+\.(?:png|svg)", html+css+js)})
for rel in asset_paths:
    uri=data_uri(rel)
    html=html.replace(rel, uri)
    css=css.replace(rel, uri)
    js=js.replace(rel, uri)

html=re.sub(r'<link rel="stylesheet" href="styles.css"\s*/?>\s*<link rel="stylesheet" href="cartoon-theme.css"\s*/?>', '<style>\n'+css+'\n</style>', html)
html=html.replace('<script src="cartoon-art.js"></script>\n  <script src="game.js"></script>', '<script>\n'+js+'\n</script>')
out=ROOT/'play-standalone.html'
out.write_text(html)
print(f'Built {out} ({out.stat().st_size/1024/1024:.1f} MB)')
