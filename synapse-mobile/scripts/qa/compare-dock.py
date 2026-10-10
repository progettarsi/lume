"""Diagnostic board: original reference alongside captured real components."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
qa = root / 'releases/qa/dock-messages-2026-10-09'
board = Image.new('RGB', (1150, 660), '#e8e3da')
draw = ImageDraw.Draw(board)
ref = Image.open('C:/Users/Augusto/Downloads/Mobile Devices/dock.jpg').convert('RGB')
ref.thumbnail((440, 540))
board.paste(ref, (20, 50))
draw.text((20, 20), 'Riferimento originale: forme/stati (palette e destinazioni adattate)', fill='#24231f')
for i, name in enumerate(['web-home-final.png', 'web-profile-final.png', 'qa-dark-large-final.png']):
    im = Image.open(qa / name).convert('RGB')
    dock = im.crop((0, im.height - 120, im.width, im.height))
    dock.thumbnail((640, 140))
    y = 70 + i * 165
    draw.text((490, y - 25), name + ' / RN Web, non Galaxy', fill='#24231f')
    board.paste(dock, (490, y))
board.save(qa / 'reference-comparison.png')
frames = [Image.open(qa / f'motion-{i}.png').convert('RGB') for i in range(10)]
sheet = Image.new('RGB', (5 * frames[0].width, 2 * (frames[0].height + 24)), '#e8e3da')
d = ImageDraw.Draw(sheet)
for i, frame in enumerate(frames):
    x, y = (i % 5) * frame.width, (i // 5) * (frame.height + 24)
    d.text((x + 4, y + 4), str(i), fill='#24231f')
    sheet.paste(frame, (x, y + 24))
sheet.save(qa / 'motion-contact.png')
