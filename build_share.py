# -*- coding: utf-8 -*-
# 카톡 B안: 선수별 OG 공유 카드(1200x630) + 리다이렉트 페이지 생성
import io, os, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://trysh722-arch.github.io/gooner-fortune"
MALGUN_BD = "C:/Windows/Fonts/malgunbd.ttf"
MALGUN = "C:/Windows/Fonts/malgun.ttf"
ARIAL_BD = "C:/Windows/Fonts/ARIALBD.TTF"

html = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
pat = re.compile(
    r"\{\s*img:\s*(null|'[^']*'),\s*name:\s*'([^']*)',\s*en:\s*'([^']*)',"
    r"\s*num:\s*(\d+),\s*pos:\s*'([^']*)',\s*tier:\s*'([^']*)'"
)
players = []
for m in pat.finditer(html):
    img, name, en, num, pos, tier = m.groups()
    if img == "null":
        slug, imgpath = "wright", None
    else:
        fn = img.strip("'").replace("img/", "")
        slug, imgpath = fn[:-4], os.path.join(ROOT, "img", fn)
    players.append(dict(slug=slug, name=name, en=en, num=num, pos=pos, tier=tier, img=imgpath))
print("parsed players:", len(players))

# 등급별 강조색
ACCENT = {
    "ultra":   (232, 199, 100), "legend": (232, 199, 100),
    "manager": (122, 163, 230), "star":   (255, 51, 56),
    "standard":(239, 1, 7),
}
BADGE = {
    "ultra": "THE INVINCIBLE", "legend": "LEGEND", "manager": "HEAD COACH",
    "star": "STAR", "standard": "FIRST TEAM",
}

def font(path, size):
    return ImageFont.truetype(path, size)

def card(p):
    W, H = 1200, 630
    acc = ACCENT[p["tier"]]
    im = Image.new("RGB", (W, H), (12, 12, 16))
    dr = ImageDraw.Draw(im)
    # 배경 그라데이션 (좌상단 레드/골드 글로우)
    glow = Image.new("RGB", (W, H), (12, 12, 16))
    gd = ImageDraw.Draw(glow)
    for i in range(0, 360, 4):
        a = max(0, 1 - i / 360.0)
        col = tuple(int(12 + (acc[c] - 12) * a * 0.28) for c in range(3))
        gd.ellipse([-260 - i, -360 - i, 760 + i, 360 + i], fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    im = Image.blend(im, glow, 0.85)
    dr = ImageDraw.Draw(im)
    # 외곽 강조 라인
    dr.rectangle([8, 8, W - 9, H - 9], outline=acc, width=4)
    dr.rectangle([20, 20, W - 21, H - 21], outline=(255, 255, 255, 30), width=1)

    # 우측 선수 누끼
    if p["img"] and os.path.exists(p["img"]):
        ph = Image.open(p["img"]).convert("RGBA")
        th = 600
        tw = round(ph.width * th / ph.height)
        ph = ph.resize((tw, th), Image.LANCZOS)
        # 그림자
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        shd = ImageDraw.Draw(sh)
        px = W - tw - 40
        shd.ellipse([px + 40, H - 70, px + tw - 10, H - 20], fill=(0, 0, 0, 120))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        im.paste(Image.alpha_composite(im.convert("RGBA"), sh).convert("RGB"), (0, 0))
        im.paste(ph, (px, H - th - 10), ph)
    else:  # 이니셜 폴백 (이안 라이트)
        ini = "".join(w[0] for w in p["en"].split())[:2]
        fb = font(ARIAL_BD, 240)
        dr.text((W - 360, 150), ini, font=fb, fill=acc)

    dr = ImageDraw.Draw(im)
    x = 60
    # 상단 라벨
    dr.text((x, 70), "오늘의 럭키 거너", font=font(MALGUN_BD, 30), fill=acc)
    # 등급 뱃지
    by = 118
    bt = BADGE[p["tier"]]
    bf = font(ARIAL_BD, 24)
    bw = dr.textlength(bt, font=bf)
    dr.rounded_rectangle([x, by, x + bw + 36, by + 44], radius=22, fill=acc)
    dr.text((x + 18, by + 9), bt, font=bf, fill=(15, 12, 6))
    # 이름 (한글)
    nf = font(MALGUN_BD, 86)
    dr.text((x, 188), p["name"], font=nf, fill=(255, 255, 255))
    # 영문 + 번호/포지션
    dr.text((x, 296), p["en"], font=font(ARIAL_BD, 30), fill=(190, 190, 200))
    dr.text((x, 338), "No.%s  ·  %s" % (p["num"], p["pos"]), font=font(MALGUN_BD, 30), fill=acc)
    # 하단 CTA
    dr.text((x, 470), "너도 생년월일 넣고", font=font(MALGUN_BD, 38), fill=(235, 235, 240))
    dr.text((x, 520), "오늘의 카드를 뽑아봐", font=font(MALGUN_BD, 38), fill=(235, 235, 240))
    dr.text((x, 580), "trysh722-arch.github.io/gooner-fortune", font=font(MALGUN, 22), fill=(140, 140, 150))
    return im

os.makedirs(os.path.join(ROOT, "share"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "p"), exist_ok=True)

PAGE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="너도 생년월일 넣고 오늘의 럭키 거너 카드를 뽑아봐. 매일 자정 새로 발매!">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image">
<title>오늘의 구너 운세 — COYG</title>
<script>location.replace('../index.html' + location.search);</script>
</head>
<body style="background:#0b0b0f"></body>
</html>
"""

for p in players:
    c = card(p)
    c.save(os.path.join(ROOT, "share", p["slug"] + ".png"), optimize=True)
    title = "오늘 내 럭키 거너는 %s! (No.%s)" % (p["name"], p["num"])
    page = PAGE.format(
        title=title,
        img="%s/share/%s.png" % (BASE_URL, p["slug"]),
        url="%s/p/%s.html" % (BASE_URL, p["slug"]),
    )
    io.open(os.path.join(ROOT, "p", p["slug"] + ".html"), "w", encoding="utf-8").write(page)

# 기본 공유 카드 (index 링크용)
defc = Image.new("RGB", (1200, 630), (12, 12, 16))
gd = ImageDraw.Draw(defc)
glow = Image.new("RGB", (1200, 630), (12, 12, 16))
gld = ImageDraw.Draw(glow)
gld.ellipse([-200, -360, 1400, 360], fill=(70, 8, 10))
glow = glow.filter(ImageFilter.GaussianBlur(70))
defc = Image.blend(defc, glow, 0.9)
gd = ImageDraw.Draw(defc)
gd.rectangle([8, 8, 1191, 621], outline=(239, 1, 7), width=4)
gd.text((600, 230), "오늘의 구너 운세", font=font(MALGUN_BD, 92), fill=(255, 255, 255), anchor="mm")
gd.text((600, 330), "DAILY GOONER FORTUNE", font=font(ARIAL_BD, 36), fill=(255, 90, 95), anchor="mm")
gd.text((600, 420), "생년월일 넣고 오늘의 럭키 거너를 뽑아봐", font=font(MALGUN, 34), fill=(220, 220, 228), anchor="mm")
defc.save(os.path.join(ROOT, "share", "_default.png"), optimize=True)

print("share cards:", len(players) + 1, "/ pages:", len(players))
print("slugs:", ", ".join(p["slug"] for p in players))
