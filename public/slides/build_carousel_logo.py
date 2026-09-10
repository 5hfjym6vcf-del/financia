#!/usr/bin/env python3
"""Génère les 6 slides du carrousel « nouveau logo », format 1080x1350.

Un fichier HTML par slide, comme le reste du dossier slides/. Le gabarit est
commun pour que la charte reste identique d'une slide à l'autre : c'est un
carrousel, la moindre dérive de marge ou de graisse se voit au défilement.

La pastille est inscrite en SVG dans la page, et non chargée depuis un
fichier : l'export tourne en headless sur des file:// et une image externe
manquante passerait inaperçue jusqu'au PNG final.
"""
import io, os

ICI = os.path.dirname(os.path.abspath(__file__))

VIOLET = '#7C3AED'

# Pastille : même géométrie que public/images/financia-mark-tile.svg.
def marque(taille, classe='marque'):
    return f'''<svg class="{classe}" width="{taille}" height="{taille}" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="{VIOLET}"/>
      <g fill="#0A0A0B" shape-rendering="crispEdges">
        <rect x="8" y="6" width="4" height="20"/><rect x="8" y="6" width="16" height="4"/><rect x="8" y="14" width="12" height="4"/>
      </g>
    </svg>'''

# Ancien logo, repris à l'identique de l'ex-public/images/icons/icon.svg.
def ancienne_marque(taille):
    return f'''<svg width="{taille}" height="{taille}" viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" fill="#000000"/>
      <path fill="#ffffff" d="M144 83h224v60H206v50h150v58H206v118h-62z"/>
      <rect x="179" y="403" width="154" height="26" rx="13" fill="{VIOLET}"/>
    </svg>'''

GABARIT = '''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>carousel_logo_slide{n}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: 100%; height: 100%; overflow: hidden; background: #000; }}
  body {{ font-family: 'Montserrat', sans-serif; }}

  .slide {{
    width: 1080px; height: 1350px; position: relative; overflow: hidden;
    background: radial-gradient(circle at 50% 0%, #141018 0%, #000000 62%);
    display: flex; flex-direction: column; padding: 96px 88px;
  }}
  /* Trame discrète, reprise de la texture des pages du site. */
  .grille {{
    position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image:
      linear-gradient(rgba(124,58,237,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,.055) 1px, transparent 1px);
    background-size: 72px 72px;
  }}
  .halo {{
    position: absolute; width: 900px; height: 900px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,.20) 0%, transparent 68%);
    top: -340px; left: 50%; transform: translateX(-50%); pointer-events: none;
  }}

  .num {{
    position: absolute; top: 56px; right: 64px; font-size: 22px; font-weight: 600;
    color: rgba(255,255,255,.28); letter-spacing: .5px;
  }}
  /* Ancre de marque, présente sur chaque slide. */
  .coin {{ position: absolute; top: 52px; left: 64px; display: flex; align-items: center; gap: 12px; }}
  .coin .mot {{ font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.5px; }}
  .coin .mot span {{ color: {violet}; }}

  .corps {{ position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; text-align: center; }}

  .label {{ font-size: 22px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase;
            color: #A78BFA; margin-bottom: 26px; }}
  h1 {{ font-size: 82px; font-weight: 800; line-height: 1.06; letter-spacing: -2px; color: #fff; }}
  h1 .accent {{ color: {violet}; }}
  .chapo {{ margin-top: 34px; font-size: 32px; font-weight: 500; line-height: 1.5;
            color: rgba(255,255,255,.62); max-width: 780px; }}

  .pied {{ position: absolute; bottom: 62px; left: 0; right: 0; text-align: center;
           font-size: 24px; font-weight: 600; color: rgba(255,255,255,.32); letter-spacing: .4px; }}

{style}
</style>
</head>
<body>
<div class="slide">
  <div class="grille"></div><div class="halo"></div>
  <div class="coin">{coin}</div>
  <div class="num">{n}/6</div>
  <div class="corps">
{corps}
  </div>
  {pied}
</div>
</body>
</html>
'''

COIN = marque(38) + '<span class="mot">Financi<span>a</span></span>'


def page(n, corps, style='', coin=COIN, pied=''):
    return GABARIT.format(n=n, corps=corps, style=style, coin=coin, violet=VIOLET,
                          pied=f'<div class="pied">{pied}</div>' if pied else '')


# ── 1. Accroche ───────────────────────────────────────────────────────────
s1 = page(1, f'''    <div class="grande">{marque(360)}</div>
    <h1 style="margin-top:72px">Nouveau look,<br>même mission 👀</h1>
    <p class="chapo">On a redessiné le symbole. On vous montre tout juste après.</p>''',
    style='.grande svg { filter: drop-shadow(0 40px 90px rgba(124,58,237,.45)); }',
    coin='')

# ── 2. Reveal ─────────────────────────────────────────────────────────────
s2 = page(2, f'''    <div class="label">Dévoilement</div>
    <h1>Voici le nouveau<br><span class="accent">Financia</span></h1>
    <div class="duo">
      <div class="col"><div class="cadre vieux">{ancienne_marque(190)}</div><span class="cap">Avant</span></div>
      <div class="fleche">&#8594;</div>
      <div class="col"><div class="cadre neuf">{marque(190)}</div><span class="cap neuve">Après</span></div>
    </div>
    <div class="verrou">{marque(76)}<span class="mot-grand">Financi<span class="accent">a</span></span></div>''',
    style='''
  .duo { margin-top: 64px; display: flex; align-items: center; gap: 52px; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .cadre { width: 240px; height: 240px; border-radius: 34px; display: grid; place-items: center;
           border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); }
  .cadre.vieux { opacity: .55; }
  .cadre.neuf { border-color: rgba(124,58,237,.5); background: rgba(124,58,237,.09); }
  .cadre svg { border-radius: 18px; }
  .cap { font-size: 24px; font-weight: 600; color: rgba(255,255,255,.4); letter-spacing: .5px; }
  .cap.neuve { color: #A78BFA; }
  .fleche { font-size: 56px; color: rgba(255,255,255,.35); margin-bottom: 44px; }
  .verrou { margin-top: 68px; display: flex; align-items: center; gap: 22px; }
  .mot-grand { font-size: 76px; font-weight: 800; color: #fff; letter-spacing: -2px; }''')

# ── 3. Justification ──────────────────────────────────────────────────────
s3 = page(3, f'''    <div class="label">Pourquoi</div>
    <h1>Pourquoi ce<br>changement ?</h1>
    <div class="tailles">
      <div class="t">{marque(16)}<span>16 px</span></div>
      <div class="t">{marque(32)}<span>32 px</span></div>
      <div class="t">{marque(64)}<span>64 px</span></div>
      <div class="t">{marque(112)}<span>112 px</span></div>
    </div>
    <ul class="raisons">
      <li><b>Trois barres décroissantes.</b> Un F qui se lit aussi comme un graphique.</li>
      <li><b>Net même à 16 pixels.</b> Redessiné sur grille entière pour le favicon.</li>
      <li><b>Plus proche de l'univers data.</b> Une forme géométrique, pas une lettre posée.</li>
    </ul>''',
    style='''
  .tailles { margin-top: 56px; display: flex; align-items: flex-end; gap: 46px; }
  .t { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .t span { font-size: 19px; font-weight: 600; color: rgba(255,255,255,.35); }
  .raisons { margin-top: 62px; list-style: none; text-align: left; max-width: 800px; }
  .raisons li { font-size: 29px; font-weight: 500; line-height: 1.45; color: rgba(255,255,255,.62);
                padding-left: 40px; position: relative; margin-bottom: 30px; }
  .raisons li:last-child { margin-bottom: 0; }
  .raisons li::before { content: ''; position: absolute; left: 0; top: 15px; width: 18px; height: 4px;
                        border-radius: 2px; background: #7C3AED; }
  .raisons b { color: #fff; font-weight: 700; }''')

# ── 4. Cohérence ──────────────────────────────────────────────────────────
s4 = page(4, f'''    <div class="label">Cohérence</div>
    <h1>Le même objet,<br>partout</h1>
    <div class="supports">
      <div class="sup">
        <div class="navbar">{marque(30)}<span class="nm">Financi<span class="accent">a</span></span></div>
        <span class="cap">Sur le site</span>
      </div>
      <div class="sup">
        <div class="ecran"><div class="appicon">{marque(74)}</div><span class="appnom">Financia</span></div>
        <span class="cap">Icône d'application</span>
      </div>
      <div class="sup">
        <div class="onglet"><div class="pastilleonglet">{marque(26)}</div><span class="ongtxt">financia.cloud</span></div>
        <span class="cap">Dans l'onglet</span>
      </div>
    </div>
    <p class="chapo" style="margin-top:56px;font-size:29px">Une seule forme à retenir, du favicon à l'écran d'accueil.</p>''',
    style='''
  .supports { margin-top: 58px; display: flex; align-items: flex-start; gap: 36px; }
  .sup { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 268px; }
  .cap { font-size: 21px; font-weight: 600; color: rgba(255,255,255,.38); }
  .navbar { width: 100%; height: 116px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: center; gap: 11px; }
  .nm { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -.5px; }
  .ecran { width: 100%; height: 116px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12);
           background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: center; gap: 16px; }
  .appicon svg { border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,.5); }
  .appnom { font-size: 22px; font-weight: 600; color: rgba(255,255,255,.75); }
  .onglet { width: 100%; height: 116px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12);
            background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: center; gap: 12px; }
  .pastilleonglet svg { border-radius: 6px; }
  .ongtxt { font-size: 21px; font-weight: 600; color: rgba(255,255,255,.6); }''')

# ── 5. Mission inchangée ──────────────────────────────────────────────────
s5 = page(5, '''    <div class="label">Ce qui ne change pas</div>
    <h1>La mission,<br>elle, ne bouge pas</h1>
    <div class="piliers">
      <div class="p"><b>Gratuit</b><span>Pour toujours</span></div>
      <div class="p"><b>Pédagogique</b><span>Expliqué de zéro</span></div>
      <div class="p"><b>0%</b><span>Conseils perso</span></div>
    </div>
    <p class="chapo" style="margin-top:58px">Le logo change. La promesse reste exactement la même.</p>''',
    style='''
  .piliers { margin-top: 62px; display: flex; gap: 24px; }
  .p { width: 285px; padding: 40px 16px; border-radius: 24px; border: 1px solid rgba(124,58,237,.32);
       background: rgba(124,58,237,.09); display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .p b { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -1px; }
  .p span { font-size: 22px; font-weight: 600; color: rgba(255,255,255,.5); }''')

# ── 6. Clôture, au traitement logo-hero de la charte ──────────────────────
s6 = page(6, f'''    <div class="grande6">{marque(200)}</div>
    <div class="logo-hero">Financi<span class="accent">a</span></div>
    <div class="logo-tagline">financia.cloud</div>
    <p class="chapo" style="margin-top:56px;font-size:31px">Le nouveau Financia vous attend.<br>Allez y jeter un œil, puis dites-nous ce que vous en pensez en commentaire.</p>''',
    style='''
  .grande6 { margin-bottom: 62px; }
  .grande6 svg { filter: drop-shadow(0 26px 60px rgba(124,58,237,.4)); }
  .logo-hero { font-size: 132px; font-weight: 800; color: #fff; letter-spacing: -2px; line-height: 1; }
  .logo-hero .accent { color: #7C3AED; }
  .logo-tagline { margin-top: 26px; font-size: 28px; font-weight: 600;
                  color: rgba(255,255,255,.4); letter-spacing: .5px; }''',
    coin='')

for n, contenu in enumerate([s1, s2, s3, s4, s5, s6], 1):
    chemin = os.path.join(ICI, f'carousel_logo_slide{n}.html')
    io.open(chemin, 'w', encoding='utf-8').write(contenu)
    print(f'  carousel_logo_slide{n}.html')
