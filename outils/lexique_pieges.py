"""Sélection des mots du lexique et fabrication des pièges.

Source : Lexique 3.83 (New, Pallier et al., www.lexique.org, licence CC BY-SA 4.0).

Le script retient des lemmes fréquents (noms, adjectifs, adverbes, verbes,
prépositions, conjonctions) qui contiennent un piège d'orthographe, et fabrique
pour chacun des fausses orthographes plausibles : même prononciation ou faute
typique (consonne doublée ou non, h, ph/th/y, sons à plusieurs graphies,
accents, lettres finales muettes). Une fausse orthographe qui est un vrai mot
du français (n'importe quelle forme de Lexique) est écartée.

Fautes réelles : avec les statistiques de WiCoPaCo (wicopaco_stats.py), les
fautes réellement commises sur Wikipédia, quand elles se prononcent comme le
mot juste et reviennent au moins deux fois, deviennent les pièges prioritaires
(règle « reel »). Les mots qui en ont sont tous retenus (fréquence d'au moins 1
par million) ; la liste est complétée par les mots les plus fréquents jusqu'au
nombre demandé. Le taux de fautes réelles compte dans la difficulté.

Sortie : un fichier TSV à relire (mot, catégorie, fréquence, niveau, pièges).

Usage : python3 -I outils/lexique_pieges.py <Lexique383.tsv> <sortie.tsv> <nombre> <mots,à,exclure> [wicopaco_stats.tsv]
"""
import math
import os
import csv
import random
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from phonetique import plausible  # noqa: E402

VOY = 'aeiouyéèêëàâîïôûù'
FORMS = set()  # toutes les formes de Lexique, remplies au chargement
CATS = {'NOM', 'ADJ', 'ADV', 'VER', 'PRE', 'CON'}
# Pouvoir de tromperie de chaque règle : un piège crédible (an / en, consonne
# double oubliée, -emment) trompe plus qu'une lettre finale fantaisiste.
DECEPT = {
    'double_simple': 3.5, 'simple_double': 2.5, 's': 3, 'sc': 3.5, 'tion': 2.5,
    'ph': 3, 'th': 3, 'rh': 3, 'ch_k': 3, 'y_i': 3, 'h': 3, 'o': 3, 'nasale': 3,
    'm_bp': 1.5, 'emment': 4, 'e_final': 2, 'e_ouvert': 2.5, 'te_tee': 3.5,
    'accent': 1.5, 'finale': 1.5, 'k': 2, 'j': 2.5, 'trait_union': 3, 'apostrophe': 2,
    'reel': 4.5,
}


def freq(r):
    return (float(r['freqlemlivres'] or 0) + float(r['freqlemfilms2'] or 0)) / 2


def variants(w, phon, cgram, genre):
    """Liste de (variante, règle, poids)."""
    out = []

    def add(v, rule, wt):
        if v and v != w:
            out.append((v, rule, wt))

    def sub_once(pattern, repl, rule, wt, flags=0):
        m = re.search(pattern, w, flags)
        if m:
            add(w[:m.start()] + m.expand(repl) + w[m.end():], rule, wt)

    # Consonnes doublées -> simples.
    for c in 'ltnmpfr':
        for m in re.finditer(c + c, w):
            add(w[:m.start()] + c + w[m.end():], 'double_simple', 3)
    for m in re.finditer(r'cc(?=[aouhlr])', w):
        add(w[:m.start()] + 'c' + w[m.end():], 'double_simple', 3)
    # Consonne simple entre deux voyelles -> doublée (pas après é, è, ê).
    for m in re.finditer(r'(?<=[aiouy])([lmnprtf])(?=[aeiouyéè])', w):
        prev2 = w[max(0, m.start() - 2):m.start()]
        if re.search(r'(on|an|en|in|un|ai|au|ou|oi|eu|ei)$', prev2) and m.group(1) in 'mn':
            continue
        add(w[:m.start()] + m.group(1) * 2 + w[m.end():], 'simple_double', 2)
    if w.startswith(('ap', 'at', 'ac', 'af', 'ef', 'of')) and len(w) > 4 and w[2] != w[1]:
        add(w[:2] + w[1] + w[2:], 'simple_double', 3)

    # [s]
    sub_once(r'(?<=[aeiouyéèê])ss(?=[eiy])', 'c', 's', 2)
    sub_once(r'(?<=[aeiouyéèê])c(?=[eiyé])', 'ss', 's', 2)
    sub_once(r'(?<=[nrl])c(?=[eiyé])', 's', 's', 2)
    sub_once(r'^c(?=[eiy])', 's', 's', 2)
    sub_once(r'^s(?=[eiy])', 'c', 's', 1)
    sub_once(r'ç', 'ss', 's', 2)
    sub_once(r'sc(?=[eiy])', 's', 'sc', 3)
    sub_once(r'sc(?=[eiy])', 'c', 'sc', 3)
    if 'tion' in w and 'sj' in phon:
        sub_once(r'tion', 'ssion', 'tion', 3)
        sub_once(r'tion', 'cion', 'tion', 3)
    sub_once(r'ssion', 'tion', 'tion', 2)
    # Graphies savantes.
    sub_once(r'ph', 'f', 'ph', 3)
    sub_once(r'th', 't', 'th', 3)
    sub_once(r'rh', 'r', 'rh', 3)
    if 'ch' in w and 'k' in phon and 'S' not in phon:
        sub_once(r'ch', 'k', 'ch_k', 3)
        sub_once(r'ch', 'c', 'ch_k', 3)
    if 'y' in w and 'i' in phon:
        sub_once(r'y(?![aeiouéè])', 'i', 'y_i', 3)
    # h
    if w.startswith('h') and len(w) > 3 and w[1] in VOY:
        add(w[1:], 'h', 3)
    sub_once(r'(?<=[aeiouéè])h(?=[aeiouéè])', '', 'h', 3)
    # [o]
    sub_once(r'eau', 'au', 'o', 3)
    sub_once(r'eau', 'o', 'o', 3)
    sub_once(r'(?<!e)au(?!x$)', 'o', 'o', 3)
    sub_once(r'ô', 'o', 'accent', 2)
    sub_once(r'ô', 'au', 'o', 2)
    # Voyelles nasales.
    sub_once(r'ain(?![aeiouyn])', 'in', 'nasale', 2)
    sub_once(r'ain(?![aeiouyn])', 'ein', 'nasale', 2)
    sub_once(r'ein(?![aeiouyn])', 'ain', 'nasale', 2)
    if '5' in phon:
        sub_once(r'(?<=[^aeo])in(?![aeiouyn])', 'ain', 'nasale', 2)
    if '@' in phon:
        sub_once(r'an(?![aeiouyn])', 'en', 'nasale', 3)
        sub_once(r'en(?![aeiouyn])', 'an', 'nasale', 3)
        sub_once(r'am(?=[bp])', 'em', 'nasale', 3)
        sub_once(r'em(?=[bp])', 'am', 'nasale', 3)
    sub_once(r'([aeio])m(?=[bp])', r'\1n', 'm_bp', 2)
    sub_once(r'([aeio])n(?=[bp])', r'\1m', 'm_bp', 1)
    sub_once(r'emment$', 'amment', 'emment', 3)
    sub_once(r'amment$', 'emment', 'emment', 3)
    # [e] / [ɛ]
    if cgram in ('NOM', 'ADJ') and w.endswith('er') and phon.endswith('e'):
        add(w[:-2] + 'é', 'e_final', 2)
    if cgram == 'NOM' and genre == 'f' and re.search(r'(té|tié)$', w):
        add(w + 'e', 'te_tee', 3)
    if cgram == 'NOM' and genre == 'f' and w.endswith('ée'):
        add(w[:-1], 'te_tee', 3)
    if cgram == 'NOM' and genre == 'm' and re.search(r'[^t]é$', w):
        add(w + 'e', 'te_tee', 2)
    if w.endswith('et') and phon.endswith('E'):
        add(w[:-2] + 'ait', 'e_final', 2)
    sub_once(r'ai(?![nmls]|$)', 'è', 'e_ouvert', 2)
    sub_once(r'è', 'ai', 'e_ouvert', 2)
    sub_once(r'ê', 'è', 'accent', 2)
    # Accents oubliés (pas sur î et û : sans accent, c'est admis depuis 1990).
    sub_once(r'é', 'e', 'accent', 2)
    sub_once(r'è', 'e', 'accent', 2)
    sub_once(r'ê', 'e', 'accent', 2)
    sub_once(r'â', 'a', 'accent', 2)
    # Lettre finale muette.
    if len(w) > 3 and w[-1] in 'tdsxp' and phon and phon[-1] in 'aeiouyEO@5§2°1':
        add(w[:-1], 'finale', 2)
        alt = {'t': 'd', 'd': 't', 's': 't', 'x': 's', 'p': 't'}[w[-1]]
        add(w[:-1] + alt, 'finale', 2)
    # [k], [ʒ]
    sub_once(r'qu(?=[ao])', 'c', 'k', 2)
    sub_once(r'ge(?=[ao])', 'j', 'j', 2)
    # Trait d'union, apostrophe.
    if '-' in w and not all(part in FORMS for part in w.split('-')):
        add(w.replace('-', ' '), 'trait_union', 3)
    if "'" in w:
        add(w.replace("'", ''), 'apostrophe', 3)
    return out


def best_weight(vs, v):
    return max(wt for x, _, wt in vs if x == v)


def choose(w, vs, rng, n=3):
    """Trois pièges, les mieux notés, en variant les règles."""
    best = {}
    for v, rule, wt in vs:
        if v not in best or best[v][1] < wt:
            best[v] = (rule, wt)
    # Plausibilité d'abord, puis pouvoir de tromperie.
    items = [(v, r, wt + DECEPT[r] / 2 + rng.random() * 0.5) for v, (r, wt) in best.items()]
    items.sort(key=lambda x: -x[2])
    picked, rules = [], set()
    for v, r, s in items:
        if r not in rules:
            picked.append((v, r, s)); rules.add(r)
        if len(picked) == n:
            break
    for v, r, s in items:
        if len(picked) == n:
            break
        if all(v != p[0] for p in picked):
            picked.append((v, r, s))
    return picked


def main(src, dst, target=1500):
    rows = list(csv.DictReader(open(src, encoding='utf-8'), delimiter='\t'))
    forms = {r['ortho'] for r in rows}
    FORMS.update(forms)
    exclude = set(sys.argv[4].split(',')) if len(sys.argv) > 4 else set()
    real, real_err = {}, {}
    if len(sys.argv) > 5:
        for r in csv.DictReader(open(sys.argv[5], encoding='utf-8'), delimiter='\t'):
            lem = r['lemme']
            real_err[lem] = int(r['fautes'])
            pairs = [x.rsplit(':', 1) for x in r['fautes_frequentes'].split()]
            # Une faute doit revenir assez souvent par rapport à la fréquence
            # du mot : sur un mot très fréquent, les fautes de frappe isolées
            # s'accumulent.
            fmin = max(2, 0.01 * float(r['freq'] or 0))
            real[lem] = [(a, int(c)) for a, c in pairs
                         if int(c) >= fmin and a not in forms and plausible(a, lem)]
    seen = set()
    cands = []
    for r in rows:
        w = r['ortho']
        if r['islem'] != '1' or r['cgram'] not in CATS or w in seen or w in exclude:
            continue
        if len(w) < 4 or ' ' in w or not re.fullmatch(r"[a-zàâäçéèêëîïôöùûüÿœæ'-]+", w):
            continue
        seen.add(w)
        f = freq(r)
        has_real = bool(real.get(w))
        if f < 3 and not (has_real and f >= 1):
            continue
        rng = random.Random(w)
        vs = [(v, rule, wt) for v, rule, wt in variants(w, r['phon'], r['cgram'], r['genre'])
              if v not in forms and v.replace(' ', '') != w]
        vs += [(v, 'reel', 5 + min(2, math.log10(c))) for v, c in real.get(w, [])]
        picked = choose(w, vs, rng)
        strong = [p for p in picked if best_weight(vs, p[0]) >= 2]
        if len(strong) < 2:
            continue
        cands.append((w, r['cgram'], f, picked, has_real))
    # D'abord tous les mots à fautes réelles, puis les plus fréquents.
    cands.sort(key=lambda c: (not c[4], -c[2]))
    n_real = sum(1 for c in cands if c[4])
    sel = cands[:max(target, n_real)]
    sel.sort(key=lambda c: -c[2])
    n = len(sel)
    # Difficulté : trois signaux, chacun ramené à son rang (percentile) dans
    # la liste pour qu'ils soient comparables.
    #  - pièges : pouvoir de tromperie des pièges retenus (le plus fort compte
    #    double), plus un bonus quand le mot cumule des difficultés réputées ;
    #  - rareté : un mot moins fréquent est moins familier à l'œil ;
    #  - fautes réelles : fautes relevées dans WiCoPaCo rapportées à la
    #    fréquence du mot ; c'est le signal le plus direct quand il existe.
    # Sans faute réelle, la difficulté repose sur les pièges et la rareté.
    # Les niveaux sont les quarts de la difficulté.
    REPUTED = {'double_simple', 'simple_double', 'nasale', 'emment', 'sc', 'te_tee', 'h', 's', 'ph', 'th', 'y_i', 'reel'}

    def trap_score(c):
        d = sorted((DECEPT[p[1]] for p in c[3]), reverse=True)
        return (2 * d[0] + sum(d[1:])) / (len(d) + 1) + 0.5 * len({p[1] for p in c[3]} & REPUTED)

    def pct(values):
        order = sorted(range(len(values)), key=lambda k: values[k])
        out = [0.0] * len(values)
        for rank, k in enumerate(order):
            out[k] = rank / max(1, len(values) - 1)
        return out

    t_p = pct([trap_score(c) for c in sel])
    r_p = pct([-c[2] for c in sel])
    rates = [math.log10(1 + 100 * real_err.get(c[0], 0) / (c[2] + 1)) for c in sel]
    with_real = [k for k, c in enumerate(sel) if c[4]]
    e_sub = pct([rates[k] for k in with_real])
    e_p = [None] * n
    for k, v in zip(with_real, e_sub):
        e_p[k] = v

    def difficulty(k):
        if e_p[k] is None:
            return 0.6 * t_p[k] + 0.4 * r_p[k]
        return 0.35 * t_p[k] + 0.25 * r_p[k] + 0.4 * e_p[k]

    diffs = [difficulty(k) for k in range(n)]
    ranked = sorted(diffs)
    cuts = [ranked[int(n * q)] for q in (0.25, 0.5, 0.75)]
    weak = {'finale', 'accent', 'm_bp', 'e_final', 'k'}
    with open(dst, 'w', encoding='utf-8', newline='') as fo:
        out = csv.writer(fo, delimiter='\t')
        out.writerow(['mot', 'cat', 'freq', 'niveau', 'priorite', 'piege1', 'regle1', 'piege2', 'regle2', 'piege3', 'regle3'])
        for k, c in enumerate(sel):
            w, cat, f, picked, has_real = c
            level = 1 + sum(diffs[k] >= x for x in cuts)
            rules = {p[1] for p in picked}
            # Priorité de tirage : 2 pour un mot à fautes réelles, 0,5 pour un
            # mot qui n'a que des pièges faibles, 1 sinon.
            prio = 2 if has_real else (0.5 if rules <= weak | {'nasale'} and not rules & {'double_simple', 'simple_double'} else 1)
            row = [w, cat, round(f, 2), level, prio]
            for v, r, sc in picked:
                row += [v, r]
            out.writerow(row)
    print(len(cands), 'mots candidats,', n, 'retenus ->', dst)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1500)
