"""Tiny annotation helper: crop a screenshot, draw on-brand callouts, add a legend strip."""
from PIL import Image, ImageDraw, ImageFont

NAVY = (0, 54, 96)
GOLD = (254, 188, 17)
WHITE = (255, 255, 255)
INK = (22, 32, 42)

def _font(size, bold=True):
    path = "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"
    return ImageFont.truetype(path, size)

class Annotator:
    def __init__(self, src, crop=None, scale=1.0):
        im = Image.open(src).convert("RGB")
        if crop:
            im = im.crop(crop)
        if scale != 1.0:
            im = im.resize((int(im.width * scale), int(im.height * scale)))
        self.im = im
        self.d = ImageDraw.Draw(self.im, "RGBA")
        self.W, self.H = im.size

    def box(self, x1, y1, x2, y2, color=GOLD, w=4, fill=False):
        if fill:
            self.d.rectangle([x1, y1, x2, y2], fill=(254, 188, 17, 38))
        try:
            self.d.rounded_rectangle([x1, y1, x2, y2], radius=10, outline=color, width=w)
        except Exception:
            self.d.rectangle([x1, y1, x2, y2], outline=color, width=w)

    def badge(self, n, x, y, r=18):
        self.d.ellipse([x - r, y - r, x + r, y + r], fill=NAVY, outline=WHITE, width=3)
        f = _font(int(r * 1.15))
        t = str(n)
        bb = self.d.textbbox((0, 0), t, font=f)
        self.d.text((x - (bb[2] - bb[0]) / 2, y - (bb[3] - bb[1]) / 2 - bb[1]), t, font=f, fill=WHITE)

    def arrow(self, x1, y1, x2, y2, color=NAVY, w=5):
        self.d.line([x1, y1, x2, y2], fill=color, width=w)
        import math
        ang = math.atan2(y2 - y1, x2 - x1)
        L = 18
        for da in (math.radians(150), math.radians(-150)):
            self.d.line([x2, y2, x2 + L * math.cos(ang + da), y2 + L * math.sin(ang + da)], fill=color, width=w)

    def title(self, text):
        f = _font(30)
        bar = 56
        new = Image.new("RGB", (self.W, self.H + bar), NAVY)
        new.paste(self.im, (0, bar))
        d = ImageDraw.Draw(new)
        d.rectangle([0, 0, self.W, bar], fill=NAVY)
        d.text((20, bar // 2 - 18), text, font=f, fill=WHITE)
        self.im = new
        self.d = ImageDraw.Draw(self.im, "RGBA")
        self.W, self.H = self.im.size

    def legend(self, items, col2_at=None):
        """items: list of strings, auto-numbered. Rendered in a bottom strip."""
        f = _font(21, bold=False)
        fb = _font(21, bold=True)
        pad = 16
        line_h = 34
        # one or two columns
        two = col2_at is not None
        rows = col2_at if two else len(items)
        strip = pad * 2 + rows * line_h
        new = Image.new("RGB", (self.W, self.H + strip), WHITE)
        new.paste(self.im, (0, 0))
        d = ImageDraw.Draw(new)
        d.line([0, self.H, self.W, self.H], fill=(199, 217, 231), width=2)
        def draw_item(i, x, y):
            r = 13
            cx, cy = x + r, y + r + 2
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=NAVY)
            nb = d.textbbox((0, 0), str(i + 1), font=fb)
            d.text((cx - (nb[2] - nb[0]) / 2, cy - (nb[3] - nb[1]) / 2 - nb[1]), str(i + 1), font=fb, fill=WHITE)
            d.text((x + 2 * r + 10, y), items[i], font=f, fill=INK)
        if two:
            colw = self.W // 2
            for i in range(len(items)):
                if i < col2_at:
                    draw_item(i, pad, self.H + pad + i * line_h)
                else:
                    draw_item(i, colw + pad, self.H + pad + (i - col2_at) * line_h)
        else:
            for i in range(len(items)):
                draw_item(i, pad, self.H + pad + i * line_h)
        self.im = new
        self.W, self.H = self.im.size
        self.d = ImageDraw.Draw(self.im, "RGBA")

    def save(self, out):
        # outer border
        d = ImageDraw.Draw(self.im)
        d.rectangle([0, 0, self.W - 1, self.H - 1], outline=(199, 217, 231), width=2)
        self.im.save(out)
        print("saved", out, self.im.size)

if __name__ == "__main__":
    import sys
    print(Image.open(sys.argv[1]).size)
