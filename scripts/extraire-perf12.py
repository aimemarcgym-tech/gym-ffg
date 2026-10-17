"""Extrait les éléments du programme Performance (1 et 2) de la brochure des programmes FFGym 2026-2027 (pages 95 à 174) vers un JSON de travail.

Chaque case d'un tableau commence par un code « g.vnn » (g : groupe, v : colonne de valeur A=1, B=2…, nn : numéro) suivi de la description.
Les positions des mots dans la page servent à rattacher le texte à sa case (les cases vides n'ont qu'un code).
"""
import json
import os
import re
import sys

import pymupdf

PDF = r"C:\Users\aime_\Documents\Gymnastique\FFgym 2027\GAF - Brochure des programmes FFGym 2026-2027.pdf"
SORTIE = os.path.join(os.environ.get("TEMP", "."), "perf12_elements_brut.json")

PLAGES = {"BARRES": (95, 124), "POUTRE": (125, 158), "SOL": (159, 174)}
CODE = re.compile(r"^\d\.\d{3}$")


def grouper_colonnes(xs, tolerance=12):
    xs = sorted(xs)
    colonnes = []
    for x in xs:
        if colonnes and x - colonnes[-1][-1] <= tolerance:
            colonnes[-1].append(x)
        else:
            colonnes.append([x])
    return [sum(c) / len(c) for c in colonnes]


def extraire_page(page):
    mots = page.get_text("words")
    codes = [m for m in mots if CODE.match(m[4]) and not m[4].endswith(".000")]
    if not codes:
        return [], {}
    colonnes = grouper_colonnes([m[0] for m in codes])
    largeur = page.rect.width

    def colonne(x):
        # indice de la colonne dont le bord gauche est le plus proche à gauche de x
        return max(i for i, c in enumerate(colonnes) if c <= x + 6)

    bornes = [(c - 4, (colonnes[i + 1] - 4) if i + 1 < len(colonnes) else largeur - 20) for i, c in enumerate(colonnes)]
    # titres de groupe « 1.000 – Entrées »
    groupes = {}
    for m in mots:
        if re.match(r"^\d\.000$", m[4]):
            ligne = " ".join(w[4] for w in sorted((w for w in mots if abs(w[1] - m[1]) < 3 and w[0] > m[0]), key=lambda w: w[0]))
            groupes[m[4][0]] = re.sub(r"^[–-]\s*", "", ligne).strip()
    elements = []
    for c in codes:
        col = colonne(c[0])
        x0, x1 = bornes[col]
        suivants = [o[1] for o in codes if colonne(o[0]) == col and o[1] > c[1] + 2]
        y_fin = min(suivants) if suivants else page.rect.height
        cellule = [w for w in mots if w is not c and x0 <= w[0] < x1 and c[1] - 1 <= w[1] < y_fin - 1 and not CODE.match(w[4])]
        cellule.sort(key=lambda w: (round(w[1] / 3), w[0]))
        texte = " ".join(w[4] for w in cellule)
        elements.append({"code": c[4], "texte": re.sub(r"\s+", " ", texte).strip()})
    return elements, groupes


def main():
    doc = pymupdf.open(PDF)
    resultat = {}
    for agres, (debut, fin) in PLAGES.items():
        liste, groupes_agres = [], {}
        for n in range(debut, fin + 1):
            elements, groupes = extraire_page(doc[n - 1])
            groupes_agres.update(groupes)
            for e in elements:
                e["page"] = n
                liste.append(e)
        resultat[agres] = {"groupes": groupes_agres, "elements": liste}
        vides = sum(1 for e in liste if not e["texte"])
        print(agres, len(liste), "codes ;", vides, "sans texte ; groupes :", groupes_agres)
    with open(SORTIE, "w", encoding="utf-8") as f:
        json.dump(resultat, f, ensure_ascii=False, indent=1)
    print("écrit", SORTIE)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
