"""Fabrique les icônes de l'application (écran d'accueil du téléphone) : dégradé violet-rose avec « GAF »."""
import os
from PIL import Image, ImageDraw, ImageFont

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "public", "icons")
DEBUT, FIN = (139, 92, 246), (236, 72, 153)


def icone(taille):
    img = Image.new("RGB", (taille, taille))
    px = img.load()
    for y in range(taille):
        for x in range(taille):
            t = (x + y) / (2 * (taille - 1))
            px[x, y] = tuple(round(DEBUT[i] + (FIN[i] - DEBUT[i]) * t) for i in range(3))
    d = ImageDraw.Draw(img)
    police = None
    for chemin in ("C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(chemin):
            police = ImageFont.truetype(chemin, round(taille * 0.27))
            break
    police = police or ImageFont.load_default()
    boite = d.textbbox((0, 0), "GAF", font=police)
    d.text(((taille - (boite[2] - boite[0])) / 2 - boite[0], (taille - (boite[3] - boite[1])) / 2 - boite[1]), "GAF", font=police, fill="white")
    return img


os.makedirs(SORTIE, exist_ok=True)
for nom, taille in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
    icone(taille).save(os.path.join(SORTIE, nom))
    print("écrit", nom)
