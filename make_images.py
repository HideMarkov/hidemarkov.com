"""Render social preview images (og.png, og-en.png) and app icons from the HM monogram.

Run once after a brand or headline change:  python make_images.py
"""
import random

from PIL import Image, ImageDraw, ImageFont

GREEN = (44, 249, 122)
BG = (0, 0, 0)
TEXT = (242, 255, 246)
MUTED = (156, 199, 168)
FONTS = "C:/Windows/Fonts/"

H = [(441, 224), (515, 224), (515, 355), (699.5, 355), (760, 401), (760, 568), (685, 568), (685, 420), (515, 420), (515, 568), (441, 568)]
M = [(685, 224), (890, 380), (1095, 224), (1095, 568), (1020, 568), (1020, 377), (890, 476), (685, 320)]


def monogram(draw, x, y, width, fill=GREEN):
    scale = width / 694
    for poly in (H, M):
        draw.polygon([(x + (px - 421) * scale, y + (py - 204) * scale) for px, py in poly], fill=fill)


def rain(img, seed):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONTS + "consola.ttf", 18)
    for col in range(760, 1200, 22):
        top = rnd.randint(-400, 300)
        for i in range(rnd.randint(6, 22)):
            y = top + i * 22
            if 0 <= y < 630:
                a = int(30 + 90 * i / 22)
                d.text((col, y), rnd.choice("0101HMΣλπ∂"), font=f, fill=(0, a, int(a * .45)))


def og(path, line1, line2_white, line2_green, sub):
    img = Image.new("RGB", (1200, 630), BG)
    rain(img, 7)
    d = ImageDraw.Draw(img)
    word = ImageFont.truetype(FONTS + "segoeuib.ttf", 46)
    monogram(d, 72, 70, 110)
    d.text((196, 78), "Hide", font=word, fill=TEXT)
    d.text((196 + d.textlength("Hide", font=word), 78), "Markov", font=word, fill=GREEN)
    big = ImageFont.truetype(FONTS + "segoeuib.ttf", 60)
    d.text((72, 220), line1, font=big, fill=TEXT)
    d.text((72, 296), line2_white, font=big, fill=TEXT)
    d.text((72 + d.textlength(line2_white, font=big), 296), line2_green, font=big, fill=GREEN)
    d.text((72, 430), sub, font=ImageFont.truetype(FONTS + "consolab.ttf", 26), fill=MUTED)
    d.text((72, 530), "hidemarkov.com", font=ImageFont.truetype(FONTS + "consolab.ttf", 26), fill=GREEN)
    img.save(path, optimize=True)


def icon(path, size, pad=0.16):
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    w = size * (1 - 2 * pad)
    monogram(d, size * pad, (size - w * 384 / 694) / 2, w)
    img.save(path, optimize=True)


og("og.png", "Wir machen KMU stark genug,", "um mit den ", "Grossen mitzuhalten.",
   "> Process Mining · Automatisierung · Anwendungsentwicklung")
og("og-en.png", "We lift small and mid-sized companies", "to ", "keep up with the big players.",
   "> Process mining · Automation · Application development")
icon("apple-touch-icon.png", 180)
icon("icon-512.png", 512)
icon("favicon-32.png", 32, pad=0.06)
print("ok")
