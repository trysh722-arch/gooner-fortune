# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(R, "assets")
OUT = os.path.join(R, "frames"); os.makedirs(OUT, exist_ok=True)
MB = "C:/Windows/Fonts/malgunbd.ttf"; M = "C:/Windows/Fonts/malgun.ttf"; AB = "C:/Windows/Fonts/ARIALBD.TTF"
W, H = 1080, 1920
def F(p, s): return ImageFont.truetype(p, s)

def bg_base():
    bg = Image.new("RGB", (W, H), (11, 11, 15))
    glow = Image.new("RGB", (W, H), (11, 11, 15)); gd = ImageDraw.Draw(glow)
    gd.ellipse([-200, -520, W + 200, 680], fill=(72, 7, 10))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    return Image.blend(bg, glow, 0.9)

def fit(d, text, path, maxw, s0):
    s = s0
    while s > 30:
        f = F(path, s)
        if d.textlength(text, font=f) <= maxw: return f
        s -= 3
    return F(path, 30)

def mockup(shot_name, label, big, out, sub=None):
    bg = bg_base(); d = ImageDraw.Draw(bg)
    cx = W // 2
    y = 110
    if label:
        d.text((cx, y), label, font=F(AB, 30), fill=(255, 90, 95), anchor="mm"); y += 56
    bf = fit(d, big, MB, W - 120, 66)
    d.text((cx, y), big, font=bf, fill=(255, 255, 255), anchor="mm"); y += 70
    if sub:
        d.text((cx, y), sub, font=F(M, 36), fill=(200, 200, 210), anchor="mm"); y += 50
    # phone
    shot = Image.open(os.path.join(A, shot_name)).convert("RGB")
    sw = 590; sh = round(shot.height * sw / shot.width); shot = shot.resize((sw, sh), Image.LANCZOS)
    rad = 44; mask = Image.new("L", (sw, sh), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw, sh], radius=rad, fill=255)
    pad = 18; px = (W - sw) // 2; py = 340
    ImageDraw.Draw(bg).rounded_rectangle([px - pad, py - pad, px + sw + pad, py + sh + pad], radius=rad + pad, fill=(22, 22, 28), outline=(239, 1, 7), width=3)
    bg.paste(shot, (px, py), mask)
    bg.save(os.path.join(OUT, out)); print("frame:", out)

# 1) 제품 데모 목업들
mockup("cap_gate.png", "DAILY GOONER FORTUNE", "직접 만들어봤어요", "frame_gate.png")
mockup("cap_rice.png", None, "생일 넣으면, 오늘의 거너 1명", "frame_rice.png")
mockup("cap_rice.png", None, "선수 실제 응원가까지", "frame_ricezoom.png", sub="( Rice Rice Baby )")
mockup("cap_fortune.png", None, "승률 · 애정운 · 금전운", "frame_fortune.png")
mockup("cap_wenger.png", None, "운 좋으면, 황금 벵거", "frame_wenger.png")

# 2) S1 훅 자막 오버레이 (B-roll 위, 투명)
ov = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
scrim = Image.new("RGBA", (W, 420), (0, 0, 0, 0)); sd = ImageDraw.Draw(scrim)
for i in range(420):
    sd.line([(0, i), (W, i)], fill=(8, 8, 12, int(190 * (1 - i / 420.0))))
ov.alpha_composite(scrim, (0, 0))
od.text((W // 2, 150), "운세, 매일 보는데", font=F(MB, 60), fill=(255, 255, 255), anchor="mm")
od.text((W // 2, 230), "맨날 똑같지 않아요?", font=F(MB, 60), fill=(255, 255, 255), anchor="mm")
ov.save(os.path.join(OUT, "ov_hook.png")); print("frame: ov_hook.png")

# 3) CTA 프레임
cta = bg_base(); d = ImageDraw.Draw(cta); cx = W // 2
# 대포
d.polygon([(cx-150,560),(cx+90,520),(cx+150,535),(cx+150,565),(cx+90,560),(cx-150,610)], fill=(239,1,7))
d.ellipse([cx-150,600,cx-70,680], outline=(239,1,7), width=14)
d.text((cx, 820), "오늘 나의 럭키 거너는?", font=F(MB, 64), fill=(255, 255, 255), anchor="mm")
# 알약
pt = "댓글에 'COYG'"; pf = F(MB, 64); pw = d.textlength(pt, font=pf)
py = 980
d.rounded_rectangle([cx - pw//2 - 60, py - 60, cx + pw//2 + 60, py + 60], radius=60, fill=(239, 1, 7))
d.text((cx, py), pt, font=pf, fill=(255, 255, 255), anchor="mm")
d.text((cx, 1130), "→ 링크 바로 보내드릴게요", font=F(MB, 46), fill=(235, 235, 240), anchor="mm")
d.text((cx, 1260), "매일 자정, 새 운세 발매", font=F(M, 36), fill=(150, 150, 160), anchor="mm")
d.text((cx, 1330), "trysh722-arch.github.io/gooner-fortune", font=F(M, 30), fill=(120, 120, 130), anchor="mm")
cta.save(os.path.join(OUT, "frame_cta.png")); print("frame: frame_cta.png")
print("DONE")
