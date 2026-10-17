"""Fabrique src/regulation/data/gaf/performance-12/elements.json à partir de l'extraction brute (scripts/extraire-perf12.py).

Un élément = une case du tableau de la brochure (code g.vnn). Valeur = chiffre « v » × 0,10 (A = 0,10 … G = 0,70) ; « SANS VALEUR » = 0.
Nature (utile aux exigences de composition) déduite du groupe : gymnique, acrobatique, maintien/élément sans envol, entrée, sortie.
"""
import json
import os
import re
import sys

BRUT = os.path.join(os.environ.get("TEMP", "."), "perf12_elements_brut.json")
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "src", "regulation", "data", "gaf", "performance-12", "elements.json")

PREFIXE = {"BARRES": "BR", "POUTRE": "PO", "SOL": "SO"}
# nature par groupe : g = gymnique, a = acrobatique (avec envol), s = sans envol / maintien, e = entrée, o = sortie
NATURE = {
    "POUTRE": {"1": "e", "2": "g", "3": "g", "4": "s", "5": "a", "6": "o"},
    "SOL": {"1": "g", "2": "g", "3": "a", "4": "a", "5": "a"},
    "BARRES": {},
}


def nettoyer(texte, page):
    t = texte
    t = re.sub(r"(^|\s+)" + str(page) + r"$", "", t.strip())  # numéro de page collé en fin de case (ou seul dans une case vide)
    flags = {}
    if "SANS VALEUR" in t:
        flags["sansValeur"] = True
        t = t.replace("SANS VALEUR", "")
    if re.search(r"\(Gym\)", t):
        flags["gym"] = True
        t = t.replace("(Gym)", "")
    if t.strip().startswith("(*)") or "(*)" in t:
        flags["etoile"] = True
        t = t.replace("(*)", "")
    if re.search(r"A FFG\s+VALEUR\s+0\.10", t, re.I):
        flags["ffg"] = True
        t = re.sub(r"(Bis\s+)?A FFG\s+VALEUR\s+0\.10", " / ", t, flags=re.I)
    t = re.sub(r"\s*\*\s*Les éléments dans la même case avec un astérisque.*?chronologique", "", t)
    t = re.sub(r"\s+", " ", t).strip(" /")
    return t, flags


def main():
    brut = json.load(open(BRUT, encoding="utf-8"))
    sortie = []
    for agres, v in brut.items():
        groupes = v["groupes"]
        vus = set()
        for e in v["elements"]:
            if not e["texte"].strip():
                continue
            code = e["code"]
            if (agres, code) in vus:
                continue
            vus.add((agres, code))
            texte, flags = nettoyer(e["texte"], e["page"])
            if not texte:
                continue
            g = code[0]
            valeur = 0.0 if flags.get("sansValeur") else int(code[2]) / 10
            nature = NATURE[agres].get(g)
            if flags.get("gym"):
                nature = "g"
            el = {
                "id": f"PF-{PREFIXE[agres]}-{code}",
                "agres": agres,
                "famille": f"PF_{PREFIXE[agres]}_{g}",
                "nom": texte if len(texte) <= 230 else texte[:227].rstrip() + "…",
                "valeur": round(valeur, 2),
                "grille": "PF",
                "verified": False,
                "sourcePage": e["page"],
                "code": code,
            }
            if nature:
                el["nature"] = nature
            if len(texte) > 230:
                el["detail"] = texte
            if flags.get("etoile"):
                el["identiqueA"] = None
                del el["identiqueA"]
                el["etoile"] = True
            if flags.get("ffg"):
                el["ffg"] = True
            sortie.append(el)
    libelles = {f"PF_{PREFIXE[a]}_{g}": titre for a, v in brut.items() for g, titre in v["groupes"].items()}
    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    with open(SORTIE, "w", encoding="utf-8") as f:
        json.dump({"source": "Brochure des programmes FFGym 2026-2027, Performance (pages 95 à 174)", "libellesFamilles": libelles, "elements": sortie}, f, ensure_ascii=False, indent=1)
        f.write("\n")
    for a in PREFIXE:
        n = [x for x in sortie if x["agres"] == a]
        print(a, len(n), "éléments")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
