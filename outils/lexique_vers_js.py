"""Transforme lexique.tsv (la liste de référence, modifiable
dans un tableur) en lexique-data.js (chargé par le jeu), après
vérification.

Colonnes de lexique.tsv (séparées par des tabulations, une ligne par mot) :
  mot              le mot (unique), première bonne réponse
  niveau           1 à 4
  priorite         priorité de tirage (2 : fautes réelles, 1 : normal, 0.5 : pièges faibles)
  definition       énoncé affiché ; ne doit pas contenir le mot
  bonnes_reponses  orthographes admises séparées par « / » (clé / clef)
  pieges           fausses orthographes séparées par « / »
  explication      texte affiché après la réponse
  regle            ancre de la règle sur ../prepa-dictee-brevet/grammaire.html (doubles, usage, pluriels…)
  source           manuel, lexique ou wicopaco
  actif            oui ou non (non : le mot est gardé dans le fichier mais pas joué)

Erreurs bloquantes : colonnes manquantes, mot en double, niveau ou priorité
invalide, mot absent des bonnes réponses, aucun piège, piège égal à une bonne
réponse. Avertissements : moins de trois réponses proposées, définition qui contient le mot, règle
inconnue.

Usage : python3 -I outils/lexique_vers_js.py [lexique.tsv] [lexique-data.js]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = ['mot', 'niveau', 'priorite', 'definition', 'bonnes_reponses', 'pieges', 'explication', 'regle', 'source', 'actif']


def split(cell):
    return [x.strip() for x in cell.split('/') if x.strip()]


def known_anchors():
    path = os.path.join(ROOT, '..', 'prepa-dictee-brevet', 'grammaire.html')
    # Le site du cours est dans le dépôt voisin prepa-dictee-brevet ; s'il est
    # absent (intégration continue), les ancres ne sont pas vérifiées.
    try:
        return set(re.findall(r'id="([^"]+)"', open(path, encoding='utf-8').read()))
    except OSError:
        return None


def main(src, dst):
    lines = open(src, encoding='utf-8').read().splitlines()
    header = lines[0].split('\t')
    if header != COLS:
        sys.exit('En-tête attendu :\n  ' + '\t'.join(COLS) + '\nTrouvé :\n  ' + '\t'.join(header))
    anchors = known_anchors()
    errors, warnings, out, seen = [], [], [], set()
    for n, line in enumerate(lines[1:], start=2):
        if not line.strip():
            continue
        cells = line.split('\t')
        if len(cells) != len(COLS):
            errors.append('ligne %d : %d colonnes au lieu de %d' % (n, len(cells), len(COLS)))
            continue
        r = dict(zip(COLS, (c.strip() for c in cells)))
        w = r['mot']
        where = 'ligne %d (%s)' % (n, w)
        if w in seen:
            errors.append(where + ' : mot en double')
        seen.add(w)
        if r['actif'] not in ('oui', 'non'):
            errors.append(where + ' : actif doit valoir oui ou non')
        if r['actif'] == 'non':
            continue
        if r['niveau'] not in ('1', '2', '3', '4'):
            errors.append(where + ' : niveau doit valoir 1, 2, 3 ou 4')
        try:
            prio = float(r['priorite'].replace(',', '.'))
            if prio <= 0:
                raise ValueError
        except ValueError:
            errors.append(where + ' : priorité invalide')
            prio = 1
        good, bad = split(r['bonnes_reponses']), split(r['pieges'])
        if not good or good[0] != w:
            errors.append(where + ' : le mot doit être la première bonne réponse')
        if not bad:
            errors.append(where + ' : aucun piège')
        elif len(good + bad) < 3:
            warnings.append(where + ' : moins de trois réponses proposées')
        if set(good) & set(bad):
            errors.append(where + ' : piège identique à une bonne réponse : ' + ', '.join(set(good) & set(bad)))
        if len(set(good + bad)) != len(good + bad):
            errors.append(where + ' : réponse en double')
        if not r['definition']:
            errors.append(where + ' : définition vide')
        elif w.lower() in r['definition'].lower():
            warnings.append(where + ' : la définition contient le mot')
        if anchors is not None and r['regle'] and r['regle'] not in anchors:
            warnings.append(where + ' : règle « %s » inconnue sur grammaire.html' % r['regle'])
        out.append({'d': int(r['niveau']) if r['niveau'].isdigit() else 1, 'p': prio, 'q': r['definition'],
                    'o': good + bad, 'ok': list(range(len(good))), 'e': r['explication'], 'r': r['regle'] or 'usage'})
    for m in warnings:
        print('avertissement :', m)
    if errors:
        for m in errors:
            print('ERREUR :', m)
        sys.exit('%d erreur(s) : lexique-data.js n\'est pas modifié.' % len(errors))
    with open(dst, 'w', encoding='utf-8') as fo:
        fo.write('/* Lexique du jeu, produit par outils/lexique_vers_js.py à partir de lexique.tsv :\n'
                 '   modifier lexique.tsv, pas ce fichier.\n'
                 '   Sources : Lexique 3.83 (New, Pallier et al., www.lexique.org, CC BY-SA 4.0) ;\n'
                 '   WiCoPaCo (Max et Wisniewski, LREC 2010, GNU FDL). Liste sous licence CC BY-SA 4.0. */\n')
        fo.write('window.LEXIQUE = ')
        json.dump(out, fo, ensure_ascii=False, separators=(',', ':'))
        fo.write(';\n')
    print('%d mots actifs écrits dans %s (%d avertissement(s))' % (len(out), dst, len(warnings)))


if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'lexique.tsv')
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'lexique-data.js')
    main(src, dst)
