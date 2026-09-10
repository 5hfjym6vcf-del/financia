#!/usr/bin/env python3
"""Export du logo Financia pour un composant « Logo » Google Ads Performance Max.

Contraintes visées : carré strict, 1200x1200, fond plein sans transparence,
symbole seul sans texte ni bordure, poids très inférieur à 5120 Ko.

POURQUOI DU RGB ET NON DU RGBA
Google demande un fond plein. Un RGBA entièrement opaque satisferait l'oeil,
mais laisse un canal alpha qu'un recadrage ou une recomposition côté Google
peut réinterpréter. On écrit donc un PNG en type couleur 2 (RGB), sans canal
alpha du tout : la transparence n'est alors pas seulement inutilisée, elle est
absente du fichier.

POURQUOI 760 px DE PASTILLE DANS 1200
Google recadre parfois les logos carrés en cercle. Un carré de côté c inscrit
dans le cercle circonscrit au canevas tient si sa diagonale reste sous 1200.
760 x racine(2) = 1075 px, donc la pastille survit au recadrage circulaire, et
il reste 220 px de marge noire de chaque côté pour que rien ne touche le bord.
"""
import zlib, struct, io, os, math

NOIR   = (0, 0, 0)
VIOLET = (124, 58, 237)
ENCRE  = (10, 10, 11)

COTE   = 1200   # canevas carré
TUILE  = 760    # côté de la pastille
MARGE  = (COTE - TUILE) // 2


def rect_arrondi(x, y, w, h, r):
    x2, y2 = x + w, y + h
    r = min(r, w / 2, h / 2)
    def dedans(px, py):
        if px < x or px > x2 or py < y or py > y2:
            return False
        if x + r <= px <= x2 - r or y + r <= py <= y2 - r:
            return True
        cx = x + r if px < x + r else x2 - r
        cy = y + r if py < y + r else y2 - r
        return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
    return dedans


def rendre_rgb(taille, fond, formes, ss=4):
    """Rendu opaque : chaque pixel part du fond, les formes sont composées
    par-dessus selon leur couverture. Aucun canal alpha en sortie."""
    px = bytearray(taille * taille * 3)
    pas, demi = 1.0 / ss, 1.0 / (2 * ss)
    n = ss * ss
    for py in range(taille):
        base = py * taille * 3
        for pxi in range(taille):
            r = g = b = 0.0
            for sy in range(ss):
                yy = py + sy * pas + demi
                for sx in range(ss):
                    xx = pxi + sx * pas + demi
                    coul = fond
                    for test, c in reversed(formes):
                        if test(xx, yy):
                            coul = c
                            break
                    r += coul[0]; g += coul[1]; b += coul[2]
            i = base + pxi * 3
            px[i]     = int(round(r / n))
            px[i + 1] = int(round(g / n))
            px[i + 2] = int(round(b / n))
    return bytes(px)


def ecrire_png_rgb(chemin, taille, pixels):
    lignes = b''.join(b'\x00' + pixels[y * taille * 3:(y + 1) * taille * 3]
                      for y in range(taille))
    def bloc(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))
    # bit depth 8, color type 2 = RGB sans alpha
    ihdr = struct.pack('>IIBBBBB', taille, taille, 8, 2, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n' + bloc(b'IHDR', ihdr)
           + bloc(b'IDAT', zlib.compress(lignes, 9)) + bloc(b'IEND', b''))
    io.open(chemin, 'wb').write(png)
    return len(png)


def formes_logo():
    e = TUILE / 32.0          # la pastille est dessinée sur une grille de 32
    f = [(rect_arrondi(MARGE, MARGE, TUILE, TUILE, 7 * e), VIOLET)]
    # Le F : fût, barre haute, barre médiane. Angles vifs, comme la pastille
    # du site, dont les barres ne portent aucun arrondi.
    for gx, gy, gw, gh in ((8, 6, 4, 20), (8, 6, 16, 4), (8, 14, 12, 4)):
        f.append((rect_arrondi(MARGE + gx * e, MARGE + gy * e,
                               gw * e, gh * e, 0), ENCRE))
    return f


if __name__ == '__main__':
    sortie = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'png')
    os.makedirs(sortie, exist_ok=True)
    chemin = os.path.join(sortie, 'financia-logo-google-ads-1200.png')
    poids = ecrire_png_rgb(chemin, COTE, rendre_rgb(COTE, NOIR, formes_logo()))
    print(f'  {os.path.basename(chemin)}  {COTE}x{COTE}  {poids} o')
    print(f'  pastille {TUILE} px, marge {MARGE} px, diagonale '
          f'{round(TUILE * math.sqrt(2))} px (limite cercle {COTE})')
