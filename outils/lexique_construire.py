"""Propose de nouveaux mots pour le lexique du jeu.

À partir des mots retenus par lexique_pieges.py (lexique_candidats.tsv) et des
définitions disponibles (definitions_*.json), écrit un fichier de propositions
au format de lexique.tsv, sans les mots déjà présents dans
lexique.tsv (actifs ou non) ni les mots écartés (EXCLUDE). Les lignes à garder
se recopient dans lexique.tsv ; ce script ne modifie jamais lexique.tsv. Une
proposition sans définition a une définition vide, à écrire avant de la
recopier.

Les mots viennent de Lexique 3.83 (www.lexique.org, licence CC BY-SA 4.0) et
les fautes réelles de WiCoPaCo (Max et Wisniewski, LREC 2010, licence GNU FDL).

Usage : python3 -I outils/lexique_construire.py <candidats.tsv> <lexique.tsv> <propositions.tsv> [definitions_1.json ...]
"""
import csv
import json
import sys

# Règle de piège -> (explication, ancre de la règle sur ../prepa-dictee-brevet/grammaire.html)
RULES = {
    'double_simple': ('consonne simple ou double', 'doubles'),
    'simple_double': ('consonne simple ou double', 'doubles'),
    's': ('son [s] : s, ss, c ou ç', 'doubles'),
    'sc': ('sc devant e et i', 'doubles'),
    'tion': ('fin en -tion, -ssion ou -cion', 'doubles'),
    'ph': ('ph, lettres d\'origine grecque', 'doubles'),
    'th': ('th, lettres d\'origine grecque', 'doubles'),
    'rh': ('rh, lettres d\'origine grecque', 'doubles'),
    'ch_k': ('ch prononcé [k], origine grecque', 'doubles'),
    'y_i': ('y à la place de i, origine grecque', 'doubles'),
    'h': ('h qui ne se prononce pas', 'doubles'),
    'o': ('son [o] : o, au, eau ou ô', 'usage'),
    'nasale': ('son nasal à plusieurs écritures (an / en, in / ain / ein)', 'usage'),
    'm_bp': ('m devant b et p', 'usage'),
    'emment': ('-amment (adjectif en -ant) ou -emment (adjectif en -ent)', 'usage'),
    'e_final': ('son [é] ou [è] à plusieurs écritures', 'usage'),
    'e_ouvert': ('son [è] : è, ê, ai ou e', 'usage'),
    'te_tee': ('noms féminins en -té / -tié sans e ; autres noms en -ée', 'usage'),
    'accent': ('accent à ne pas oublier', 'usage'),
    'finale': ('lettre finale muette : le féminin ou un mot de la même famille aide à la trouver', 'usage'),
    'k': ('son [k] : c ou qu', 'usage'),
    'j': ('son [j] : j ou ge', 'usage'),
    'trait_union': ('trait d\'union', 'usage'),
    'apostrophe': ('apostrophe', 'usage'),
    'reel': ('faute très souvent commise (corrections de Wikipédia)', 'usage'),
}


# Mots écartés : grossiers ou trop familiers (fréquents dans les sous-titres
# de films), noms propres, entrées douteuses ou ambiguës de la base (participes
# isolés, noms qu'on prendrait pour des verbes), doublons, mots trop
# techniques ou peu adaptés à des collégiens, mots dont la base ne donne pas
# l'orthographe usuelle (noeud pour nœud).
EXCLUDE = set('''ouais gars putain salope saloperie enculé pédé dégueulasse déconner salaud salopard taule
môme frangin engueuler débile vachement marrant capote amant thomas hippo saurer noeud quant être
aura revient amène deçà blockhaus fasciste cannibalisme évènement dire nationale secrète allant donnant
prenant attendant utérus mamelle schizophrénie paranoïa alcoolisme obédience azimut agrégation canonnade'''.split())


def explanation(r):
    rules, real = [], []
    for i, k in enumerate(('regle1', 'regle2', 'regle3')):
        if not r.get(k):
            continue
        if r[k] == 'reel':
            real.append(r['piege%d' % (i + 1)])
        elif RULES[r[k]][0] not in rules:
            rules.append(RULES[r[k]][0])
    anchor = next((RULES[r[k]][1] for k in ('regle1', 'regle2', 'regle3') if r.get(k) and r[k] != 'reel'), 'usage')
    expl = ''
    if real:
        expl = 'Faute très souvent commise : ' + ', '.join('« %s »' % x for x in real) + '. '
    if rules:
        expl += 'Pièges de ce mot : ' + ' ; '.join(rules) + '.'
    return expl.strip(), anchor


def main(src, lexique, dst, def_files):
    defs = {}
    for f in def_files:
        defs.update(json.load(open(f, encoding='utf-8')))
    present = {line.split('\t', 1)[0] for line in open(lexique, encoding='utf-8').read().splitlines()[1:] if line.strip()}
    rows = list(csv.DictReader(open(src, encoding='utf-8'), delimiter='\t'))
    out, nodef = [], 0
    for r in rows:
        w = r['mot']
        if w in present or w in EXCLUDE:
            continue
        traps = [r[k] for k in ('piege1', 'piege2', 'piege3') if r.get(k)]
        expl, anchor = explanation(r)
        source = 'wicopaco' if 'reel' in (r.get('regle1'), r.get('regle2'), r.get('regle3')) else 'lexique'
        d = defs.get(w, '')
        nodef += not d
        out.append([w, r['niveau'], r['priorite'], d, w, ' / '.join(traps), expl, anchor, source, 'oui'])
    with open(dst, 'w', encoding='utf-8') as fo:
        fo.write('\t'.join(['mot', 'niveau', 'priorite', 'definition', 'bonnes_reponses', 'pieges',
                             'explication', 'regle', 'source', 'actif']) + '\n')
        for row in out:
            fo.write('\t'.join(str(c).replace('\t', ' ') for c in row) + '\n')
    print('%d propositions (%d sans définition) -> %s' % (len(out), nodef, dst))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:])
