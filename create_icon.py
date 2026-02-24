from PIL import Image, ImageDraw, ImageFont
import os

# Create a 512x512 image with transparent background
size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Modern gradient background (purple to blue)
for y in range(size):
    r = int(138 - (y / size) * 30)
    g = int(43 + (y / size) * 90)
    b = int(226 - (y / size) * 20)
    draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b, 255))

# Draw rounded rectangle for modern look
margin = 60
draw.rounded_rectangle(
    [(margin, margin), (size-margin, size-margin)],
    radius=80,
    fill=(255, 255, 255, 40),
    outline=(255, 255, 255, 120),
    width=8
)

# Draw "Q4" text in center
try:
    font = ImageFont.truetype("arial.ttf", 180)
except:
    font = ImageFont.load_default()

text = "Q4"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
text_x = (size - text_width) // 2
text_y = (size - text_height) // 2 - 20

# Draw text with shadow
draw.text((text_x+4, text_y+4), text, fill=(0, 0, 0, 100), font=font)
draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

# Draw download arrow below
arrow_y = text_y + text_height + 30
draw.polygon([
    (size//2, arrow_y + 60),
    (size//2 - 40, arrow_y),
    (size//2 + 40, arrow_y)
], fill=(255, 255, 255, 200))
draw.rectangle([
    (size//2 - 15, arrow_y - 40),
    (size//2 + 15, arrow_y + 10)
], fill=(255, 255, 255, 200))

# Save in multiple sizes
output_dir = 'F:/study/projects/web_development/Fullstack/QuadDown/readme/logo/png'
os.makedirs(output_dir, exist_ok=True)

sizes = [64, 128, 256, 512, 1024]
for s in sizes:
    resized = img.resize((s, s), Image.Resampling.LANCZOS)
    resized.save(f'{output_dir}/QuadDown_{s}x.png')

# Save main icon
img.save('F:/study/projects/web_development/Fullstack/QuadDown/src/public/icon.png')
print('Icon created successfully')
