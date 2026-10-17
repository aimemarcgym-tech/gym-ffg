"""Fabrique src/regulation/data/gaf/performance-79/programmes.json : programme Performance 7-9 ans (brochure des programmes FFGym 2026-2027, pages 26 à 62).

Chaque mouvement est une suite d'éléments imposés. Une « option » rapporte 0,50 point : « OU » remplace l'élément de base placé juste au-dessus,
« ET » est un élément supplémentaire. Note D = valeur de base du niveau + 0,50 par option validée (1 à 2, 3 à 4, 5 à 6, 7 à 8).
"""
import json
import os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "src", "regulation", "data", "gaf", "performance-79", "programmes.json")

OU, ET = "OU", "ET"


def seq(nom, *items):
    """items : texte seul (élément de base) ou (type, numéro d'option, texte)."""
    return {"nom": nom, "items": [({"texte": i} if isinstance(i, str) else {"type": i[0], "option": i[1], "texte": i[2]}) for i in items]}


BARRES = {
    "P1": [
        seq(
            "Séquence 1 (barre inférieure)",
            "Départ à la station debout épaules à hauteur de la barre inférieure - sauter à l’appui facial",
            "Maintien 2 secondes en appui facial actif",
            "Rotation en avant (passage par la chandelle) - descente contrôlée - maintien 2 secondes des jambes en fermeture (pointes de pieds à la barre)",
            "Descente contrôlée jusqu’à la suspension droite (passage par l’équerre) - réception à la station debout",
        ),
        seq(
            "Séquence 2 (barre supérieure)",
            "De la suspension alignée - placement et maintien 2 secondes en courbe AVANT - retour à la suspension droite",
            "Placement et maintien 2 secondes en courbe ARRIÈRE - retour à la suspension droite",
            (ET, 1, "Placement en courbe arrière - fermeture à la suspension mi-renversée jambes écartées et tendues (Stalder) - maintien 2 secondes - retour à la suspension droite"),
            "Tour complet en suspension (prises : dorsale / mixte / dorsale / mixte / dorsale) - réception à la station debout (sauf si option 2)",
            (ET, 2, "Traction sans prise d’élan - descente contrôlée à la suspension droite - réception à la station debout"),
        ),
    ],
    "P2": [
        seq(
            "Séquence 1 (barre inférieure)",
            "Balancé avant / arrière - réception à la station debout sur caisse ou tremplin",
            "Départ à la station debout épaules à hauteur de la barre inférieure - sauter à l’appui actif - oscillation en suspension mi-renversée jambes écartées et tendues (Stalder) - retour à la station debout sur caisse ou tremplin",
            (ET, 1, "Départ à la station debout épaules à hauteur de la barre inférieure - sauter à l’appui actif - oscillation à la suspension mi-renversée en fermeture jambes serrées et tendues (pieds-mains) - retour à la station debout sur caisse ou tremplin"),
            "Départ à la station debout épaules à hauteur de la barre inférieure - renversement libre à l’appui facial",
            (OU, 2, "Bascule faciale (possibilité de lâcher la barre et de reculer avant d’effectuer la bascule, départ au choix sol, tremplin ou caisse) - arrêt en appui, ou possibilité d’enchaîner avec l’élément prise d’élan à l’horizontale"),
            "Prise d’élan à l’horizontale, corps tendu",
            "Tour d’appui arrière",
            "Sortie filée avant - réception à la station debout",
        ),
        seq(
            "Séquence 2 (barre supérieure)",
            "Départ à la suspension droite - traction renversement à l’appui facial",
            "Rotation contrôlée en avant en traction (bras fléchis) - renversement à l’appui facial",
            "Rotation en avant - maintien 2 secondes en position de chandelle - descente contrôlée jusqu’à la suspension droite",
            "Placement et maintien 2 secondes en courbe ARRIÈRE puis en courbe AVANT (courbe arrière puis courbe avant, ou courbe avant puis courbe arrière)",
            "Placement en courbe avant et passage dynamique de la courbe arrière à la courbe avant 5 fois enchaînés, puis fermeture - filé en avant - élan en arrière (ou l’inverse)",
            "2 balancés (avant / arrière) à l’oblique basse (45°) - réception à la station debout",
        ),
    ],
    "P3": [
        seq(
            "Séquence 1 (barre inférieure)",
            "Départ à la station debout - bascule faciale - prise d’élan à l’horizontale, corps tendu",
            "Bascule faciale - prise d’élan à l’horizontale, corps tendu",
            (OU, 1, "Bascule faciale - prise d’élan à l’ATR, corps tendu"),
            "Tour proche au choix à l’horizontale (Stalder / pieds-mains / tour d’appui arrière libre) - retour à la station debout",
            (OU, 2, "Tour proche au choix à 45° de la verticale (Stalder / pieds-mains / tour d’appui arrière libre) - retour à la station debout"),
        ),
        seq(
            "Séquence 2 (barre supérieure)",
            "Bascule faciale (de la prise d’élan ou avec élan donné par l’entraîneur) - prise d’élan à 45° de la verticale, corps tendu",
            "Grande culbute (balancé avant avec retour à l’appui facial) - filé avant et balancé arrière",
            "2 balancés (avant / arrière) à l’horizontale",
            "Balancé avant ½ tour à l’horizontale",
            "Balancé avant en prise mixte avec changement en prise palmaire devant (supination)",
            "Balancé arrière avec recherche d’appui dynamique - retour à la station debout",
        ),
    ],
}

POUTRE = {
    "P1": [
        seq(
            "Mouvement",
            "De la station faciale, sauter à l’appui et sans arrêt passer une jambe tendue latéralement pour s’établir au siège transversal",
            "S’allonger sur le dos, lever les jambes tendues à la verticale, maintien 2 secondes - retour au siège",
            (OU, 1, "Chandelle maintien 2 secondes et retour au siège"),
            "Départ à genoux mains sur la poutre - tendre les jambes pointes retournées, maintien 2 secondes",
            (OU, 2, "Départ à genoux - placement du dos en position groupée - retour accroupi"),
            "Un détourné",
            "Sur pieds plats - retiré - développé en 4ème devant jambe à l’horizontale - raccourci - développé 4ème derrière - jambe droite puis jambe gauche (ou inversement)",
            "Demi plié relevé, maintien 2 secondes",
            "Sortie saut vertical en bout de poutre",
        ),
    ],
    "P2": [
        seq(
            "Mouvement",
            "De la station faciale, sauter à l’appui et sans arrêt passer une jambe tendue latéralement pour s’établir au siège transversal - équerre jambes écartées, maintien 2 secondes",
            "ATR transversal jambes écartées ou serrées - retour en fente",
            (OU, 1, "Souplesse arrière - retour en fente"),
            "Demi plié au retiré - relevé - poser le pied devant - détourné - 1 pas détourné (dans le même sens)",
            "Position de départ à l’arabesque - battement en 4ème devant à l’horizontale - relevé sur ½ pointe, jambe gauche puis jambe droite (ou inversement)",
            "Fente avant jambe gauche - renversement avant jusqu’à la pose des mains - jambe droite au moins à l’horizontale sans poussée de la jambe gauche - revenir en fente avant jambe gauche - fente avant jambe droite - renversement avant jusqu’à la pose des mains - jambe gauche au moins à l’horizontale sans poussée de la jambe droite - revenir en fente avant jambe gauche (ou inversement)",
            (OU, 2, "Roue - retour en fente"),
            "Battement 4ème devant à l’horizontale jambe droite - poser le pied avant - battement 4ème arrière jambe gauche (ou inversement) - poser le pied arrière - ½ plié - relevé sur ½ pointes, maintien 2 secondes - saut vertical",
            "Sortie en rondade",
        ),
    ],
    "P3": [
        seq(
            "Mouvement",
            "Appel 2 pieds - s’établir directement à l’équerre jambes écartées, maintien 2 secondes (position latérale ou transversale)",
            "Départ au retiré pied plat - ½ tour sur ½ pointe - poser pieds plats - 1 détourné",
            "ATR transversal jambes écartées, retour pied-pied - souplesse arrière, retour en fente",
            (OU, 1, "Flip jambes décalées - retour en fente"),
            "Cabriole 4ème devant jambe droite à l’horizontale - cabriole 4ème devant jambe gauche à l’horizontale (ou inversement)",
            "ATR transversal maintien 2 secondes jambes serrées puis écartées - retour à l’arabesque",
            (OU, 2, "Tic-tac - retour en fente"),
            "Demi plié - relevé, maintien 2 secondes - saut écart antéropostérieur",
            "LIAISON : roue + salto groupé en sortie de poutre",
        ),
    ],
    "P4": [
        seq(
            "Mouvement",
            "Entrée B maximum (issue du code performance)",
            "Départ fente - ½ tour au retiré en dedans - arrêt - rester au retiré - ½ tour au retiré en dedans sur la même jambe",
            "Flip jambes décalées - retour en fente",
            (OU, 1, "LIAISON : ATR transversal jambes écartées, serrées et écartées - retour pied-pied + flip jambes décalées - retour en fente"),
            "Cabriole 4ème devant jambe à l’horizontale - battement cloche (descente de la jambe avant vers l’arrière) - cabriole 4ème arrière à l’arabesque - saut écart antéro-postérieur (préparation saut changement de jambe)",
            "Tic-tac - retour à l’arabesque, maintien 2 secondes",
            (OU, 2, "Souplesse avant avec passage en 4ème devant ou saut de mains"),
            "LIAISON : roue arabesque contrôlée enchaînée avec souplesse arrière - retour en fente",
            "Départ en transversal - saut 1/4 de tour - saut 1/4 de tour (dans le même sens)",
            "LIAISON : sortie rondade + salto arrière groupé avec ouverture",
        ),
    ],
}

SOL = {
    "P1": [
        seq(
            "Mouvement",
            "Préparation pivot : relevé sur pied plat au retiré + détourné sur demi-pointe",
            "LIAISON : départ latéral roue 1/4 retour en latéral + pas chassé latéral + roue pied-pied, bras à l’oblique basse",
            "Roulade arrière carpé bras tendus",
            "LIAISON : battement fente avant + ATR une jambe à la verticale et une jambe à l’horizontale",
            "LIAISON : battement 4ème devant à l’horizontale jambe droite - poser le pied avant - battement 4ème arrière jambe gauche + battement 4ème devant à l’horizontale jambe gauche - poser le pied avant - battement 4ème arrière jambe droite (ou inversement) + saut vertical",
            "LIAISON : chandelle bras aux oreilles + venir en fermeture complète + chandelle arrivée jambes écartées + grand écart antéropostérieur droit ou gauche + écrasement facial à 90°",
            (OU, 1, "LIAISON : chandelle bras aux oreilles + venir en fermeture complète + chandelle arrivée jambes écartées + grand écart antéropostérieur droit ou gauche + écrasement facial à 90° + passage de l’écrasement facial à l’appui ventral bassin collé au sol"),
            "Pont maintien 2 secondes puis lever la jambe à la verticale",
            (OU, 2, "LIAISON : pont maintien 2 secondes puis lever la jambe à la verticale + pousser pour revenir en fente"),
        ),
    ],
    "P2": [
        seq(
            "Mouvement",
            "LIAISON : sursaut rondade + flip + rebond",
            (OU, 1, "LIAISON : sursaut rondade + 2 flips + rebond"),
            "LIAISON : cabriole + sissone (préparation changement de jambe)",
            "LIAISON : 1 pas chassé jambe gauche + 1 pas chassé jambe droite (ou inversement) + assemblé + saut vertical",
            "LIAISON : battement - fente - ATR rebond + pont - se relever",
            (OU, 2, "Sursaut saut de mains - rebond"),
            "LIAISON : battement - fente - tic-tac pied-pied + roulade arrière bras et corps tendus arrivée en courbe avant",
            "Équerre écartée maintien 2 secondes - grand écart au choix (gauche, droit, facial) maintien 2 secondes",
            "Départ en fente sur un genou - relevé sur pied plat au retiré - détourné",
        ),
    ],
    "P3": [
        seq(
            "Mouvement",
            "LIAISON : battement - fente - ATR 1/4 de valse arrière + roulade avant à l’équerre écartée + placement du dos - arrivée en fermeture (pieds entre les mains)",
            (OU, 1, "LIAISON : battement - fente - ATR 1/4 de valse arrière + roulade avant à l’équerre écartée + placement du dos à l’ATR (endo)"),
            "LIAISON : saut écart antéro-postérieur - saut vertical (du rebond)",
            "LIAISON : 1 pas ou sursaut rondade + flip + salto arrière groupé",
            (OU, 2, "1 pas ou sursaut rondade + 2 flips + salto arrière groupé"),
            "PASSAGE GYMNIQUE : pas chassé + saut changement de jambe",
            "LIAISON : souplesse arrière ATR jambes écartées-serrées-écartées retour pied-pied + roulade arrière à l’ATR arrivée en fente",
            "LIAISON : départ en fente ½ pivot au retiré - détourné",
            "LIAISON : salto avant groupé + élan + sursaut saut de mains + rebond",
        ),
    ],
    "P4": [
        seq(
            "Mouvement",
            "Série obligatoire à faire avant l’enchaînement en musique : battement - fente - ATR roulade équerre écartée - placement du dos à l’ATR (endo) ½ valse avant par ¼ de valse - roulade arrière à l’ATR ¼ de valse (retour libre)",
            "LIAISON : rondade + flip + salto arrière tendu",
            "LIAISON : salto avant groupé + élan + salto avant groupé",
            (OU, 1, "Salto avant groupé + salto avant groupé"),
            "LIAISON : sursaut + rondade + flip + flip + flip + rebond",
            (OU, 2, "LIAISON : sursaut + rondade + flip + flip + salto arrière groupé"),
            "LIAISON : saut écart antéro-postérieur + saut vertical ½ tour (du rebond)",
            "PASSAGE GYMNIQUE : pas chassé + saut changement de jambe + grand jeté",
            "Pivot au retiré",
        ),
    ],
}

SAUT = [
    {"niveau": "P1", "valeur": 4.5, "texte": "Départ 10 m maximum, saut droit arrivée pieds serrés sur table de saut à 1 m puis fente avant, ATR tombé dos"},
    {"niveau": "P2", "valeur": 5.0, "texte": "Départ 15 m maximum, lune avec trampo-tremp arrivée dos sur la pile de tapis à hauteur"},
    {"niveau": "P3", "valeur": 6.0, "texte": "Départ 15 m maximum, lune avec trampo-tremp arrivée debout sur la pile de tapis puis tomber ventre gainé"},
]

NIVEAUX = {
    "P1": {"base": 1.0, "max": 2.0},
    "P2": {"base": 3.0, "max": 4.0},
    "P3": {"base": 5.0, "max": 6.0},
    "P4": {"base": 7.0, "max": 8.0},
}


def numeroter(programmes, prefixe):
    for niveau, sequences in programmes.items():
        for s, sq in enumerate(sequences, start=1):
            for i, it in enumerate(sq["items"], start=1):
                it["id"] = f"{prefixe}-{niveau}-{s}-{i}"
    return programmes


donnees = {
    "source": "Brochure des programmes FFGym 2026-2027, Performance 7-9 ans (pages 26 à 62)",
    "pointsParOption": 0.5,
    "niveaux": NIVEAUX,
    "saut": SAUT,
    "barres": numeroter(BARRES, "BR"),
    "poutre": numeroter(POUTRE, "PO"),
    "sol": numeroter(SOL, "SO"),
}

os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
with open(SORTIE, "w", encoding="utf-8") as f:
    json.dump(donnees, f, ensure_ascii=False, indent=2)
    f.write("\n")
nb_options = {a: {n: sum(1 for sq in v[n] for it in sq["items"] if "option" in it) for n in v} for a, v in (("barres", BARRES), ("poutre", POUTRE), ("sol", SOL))}
print("options par niveau :", nb_options)
