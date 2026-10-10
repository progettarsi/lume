"""Measure the native screenshots, rather than repeating style properties."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[2]
qa = root / 'releases/qa/dock-insets-2026-10-09'
rows = []
board = Image.new('RGB', (950, 410), '#e8e3da')
d = ImageDraw.Draw(board)
ref = Image.open('C:/Users/Augusto/Downloads/Mobile Devices/dock.jpg').convert('RGB')
ref.thumbnail((290, 320))
board.paste(ref, (15, 45))
d.text((15, 15), 'Riferimento (forme)', fill='#282621')
for i, state in enumerate(['home', 'profile']):
    im = Image.open(qa / f'device-{state}-final.png').convert('RGB')
    region = im.crop((0, 2000, 700, 2280))
    def bbox(color):
        mask = Image.new('1', region.size)
        mask.putdata([pixel == color for pixel in region.getdata()])
        return mask.getbbox()
    outer, pill = bbox((53, 48, 44)), bbox((130, 81, 62))
    if not outer or not pill:
        raise ValueError(f'{state}: actual dark dock colors not found')
    gaps = {'top': pill[1]-outer[1], 'bottom': outer[3]-pill[3],
            'side': pill[0]-outer[0] if state == 'home' else outer[2]-pill[2]}
    rows.append({'state': state, 'capsule_bbox': outer, 'pill_bbox': pill, 'gaps_px': gaps})
    crop = im.crop((150, 2020, 910, 2280))
    crop.thumbnail((600, 160))
    y = 55 + i*170
    d.text((325, y-25), f'Galaxy / {state}: {gaps} pixel', fill='#282621')
    board.paste(crop, (325, y))
(qa / 'measured-insets.json').write_text(json.dumps(rows, indent=2))
board.save(qa / 'reference-native-comparison.png')
print(json.dumps(rows, indent=2))
