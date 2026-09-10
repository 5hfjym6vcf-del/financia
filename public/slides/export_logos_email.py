#!/usr/bin/env python3
"""Génère les deux logos PNG utilisés par la newsletter « nouveau logo ».

POURQUOI DES PNG ET PAS LES SVG DU SITE
Aucun client mail grand public ne rend le SVG. Gmail, Outlook et Apple Mail
affichent une image cassée ou rien du tout. Les visuels d'un email doivent être
des PNG servis en URL absolue.

POURQUOI REGENERER L'ANCIEN LOGO
Il a été écrasé sur le serveur le 8 septembre 2026 par le nouveau jeu d'icônes.
Un avant/après a besoin de l'avant : on le redessine ici depuis sa géométrie
d'origine, conservée dans l'historique git.

Sortie en 240x240 pour un affichage à 120 px : les écrans à densité double
sont la norme sur mobile, et une image affichée au-delà de sa taille native
devient floue précisément là où le message est « regardez ce logo ».
"""
import zlib, struct, io, os

VIOLET = (124, 58, 237)
ENCRE  = (10, 10, 11)
BLANC  = (255, 255, 255)
NOIR   = (0, 0, 0)

COTE = 240


def rect(x, y, w, h, r=0):
    x2, y2 = x + w, y + h
    r = min(r, w / 2, h / 2)
    def dedans(px, py):
        if px < x or px > x2 or py < y or py > y2:
            return False
        if r == 0 or x + r <= px <= x2 - r or y + r <= py <= y2 - r:
            return True
        cx = x + r if px < x + r else x2 - r
        cy = y + r if py < y + r else y2 - r
        return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
    return dedans


def rendre_rgba(taille, formes, ss=4):
    px = bytearray(taille * taille * 4)
    pas, demi, n = 1.0 / ss, 1.0 / (2 * ss), ss * ss
    for py in range(taille):
        base = py * taille * 4
        for pxi in range(taille):
            r = g = b = a = 0.0
            for sy in range(ss):
                yy = py + sy * pas + demi
                for sx in range(ss):
                    xx = pxi + sx * pas + demi
                    for test, c in reversed(formes):
                        if test(xx, yy):
                            r += c[0]; g += c[1]; b += c[2]; a += 1
                            break
            i = base + pxi * 4
            if a:
                px[i] = int(round(r / a)); px[i+1] = int(round(g / a))
                px[i+2] = int(round(b / a)); px[i+3] = int(round(255 * a / n))
    return bytes(px)


def ecrire(chemin, taille, pixels):
    lignes = b''.join(b'\x00' + pixels[y*taille*4:(y+1)*taille*4] for y in range(taille))
    def bloc(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = (b'\x89PNG\r\n\x1a\n'
           + bloc(b'IHDR', struct.pack('>IIBBBBB', taille, taille, 8, 6, 0, 0, 0))
           + bloc(b'IDAT', zlib.compress(lignes, 9)) + bloc(b'IEND', b''))
    io.open(chemin, 'wb').write(png)
    return len(png)


def nouveau():
    """Pastille actuelle : grille de 32, mêmes valeurs que financia-mark-tile.svg."""
    e = COTE / 32.0
    f = [(rect(0, 0, COTE, COTE, 7 * e), VIOLET)]
    for gx, gy, gw, gh in ((8, 6, 4, 20), (8, 6, 16, 4), (8, 14, 12, 4)):
        f.append((rect(gx*e, gy*e, gw*e, gh*e), ENCRE))
    return f


def ancien():
    """Ex-icon.svg : carré noir, F blanc, soulignement violet.
    Le F était un path ; il se décompose exactement en trois rectangles :
    fût 144..206 sur toute la hauteur, barre haute 144..368, médiane 206..356."""
    e = COTE / 512.0
    return [
        (rect(0, 0, COTE, COTE), NOIR),
        (rect(144*e, 83*e, 62*e, 286*e), BLANC),   # fût
        (rect(144*e, 83*e, 224*e, 60*e), BLANC),   # barre haute
        (rect(206*e, 193*e, 150*e, 58*e), BLANC),  # barre médiane
        (rect(179*e, 403*e, 154*e, 26*e, 13*e), VIOLET),
    ]


if __name__ == '__main__':
    sortie = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          '..', 'images', 'email')
    sortie = os.path.abspath(sortie)
    os.makedirs(sortie, exist_ok=True)
    for nom, formes in (('logo-apres-240.png', nouveau()), ('logo-avant-240.png', ancien())):
        p = os.path.join(sortie, nom)
        print('  %-22s %d o' % (nom, ecrire(p, COTE, rendre_rgba(COTE, formes))))
    print('  ->', sortie)
