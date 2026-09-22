
from PIL import Image, ImageDraw
import math
img = Image.new('RGBA', (420, 140), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
pts = []
for i in range(0, 360):
    t = i / 360
    x = 20 + t * 360
    y = 70 + 35 * math.sin(t * 6) * (1 - t * 0.3) + 15 * math.sin(t * 14)
    pts.append((x, y))
d.line(pts, fill=(26, 58, 138, 230), width=4)
d.line([(30, 105), (180, 112), (280, 100)], fill=(26, 58, 138, 200), width=3)
d.text((150, 118), 'R. Dias', fill=(26, 58, 138, 255))
img.save('/Users/samuel/Documents/GitHub/Sistema-Gerenciamento-Gruas/tmp-preview-assinaturas/_sig.png')
