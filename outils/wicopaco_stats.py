"""Statistiques de fautes réelles par mot, tirées de WiCoPaCo.

WiCoPaCo (Max et Wisniewski, LREC 2010, licence GNU FDL) rassemble les
corrections faites dans l'historique de Wikipédia en français. Le script garde
les corrections étiquetées « non_word_error » (le mot fautif n'existe pas) qui
portent sur un seul mot, rattache le mot corrigé à son lemme dans Lexique 3.83,
et compte pour chaque lemme les fautes et les orthographes fautives.

Les mots à majuscule initiale sont ignorés (corrections d'accent sur une
capitale). Sortie TSV : lemme, catégorie, fréquence Lexique, nombre de fautes,
fautes rapportées à la fréquence (taux), fautes les plus fréquentes du lemme
écrit tel quel (forme:nombre).

Usage : python3 -I outils/wicopaco_stats.py <spelling_error-v3.xml> <wrhc-fr_...-v2.xml.gz> <Lexique383.tsv> <sortie.tsv>
"""
import csv
import gzip
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

CATS = {'NOM', 'ADJ', 'ADV', 'VER', 'PRE', 'CON'}
WORD = re.compile(r"[a-zàâäçéèêëîïôöùûüÿœæ'-]+")


def main(labels_path, corpus_path, lexique_path, dst):
    non_word = set()
    for _, el in ET.iterparse(labels_path):
        if el.tag == 'annotation':
            if el.findtext('label') == 'non_word_error':
                non_word.add(el.findtext('modif_id'))
            el.clear()

    form2lem = defaultdict(set)
    lemfreq, lemcat = {}, {}
    forms = set()
    for r in csv.DictReader(open(lexique_path, encoding='utf-8'), delimiter='\t'):
        forms.add(r['ortho'])
        if r['cgram'] in CATS:
            form2lem[r['ortho']].add(r['lemme'])
            if r['islem'] == '1' and r['lemme'] not in lemfreq:
                lemfreq[r['lemme']] = (float(r['freqlemlivres'] or 0) + float(r['freqlemfilms2'] or 0)) / 2
                lemcat[r['lemme']] = r['cgram']

    errors = Counter()               # lemme -> nombre de fautes
    misspell = defaultdict(Counter)  # lemme -> fautes sur la forme du lemme
    kept = 0
    with gzip.open(corpus_path) as fh:
        for _, el in ET.iterparse(fh):
            if el.tag != 'modif':
                continue
            if el.get('id') in non_word:
                b, a = el.find('before/m'), el.find('after/m')
                if b is not None and a is not None and b.get('num_words') == '1' and a.get('num_words') == '1':
                    raw = (b.text or '').strip()
                    wrong = raw.lower()
                    right = (a.text or '').strip().lower()
                    # Mot à majuscule initiale : la correction porte souvent
                    # sur l'accent d'une capitale (Eglise -> Église), pas sur
                    # une vraie faute ; on l'ignore.
                    if raw[:1].isupper():
                        el.clear()
                        continue
                    if (wrong != right and WORD.fullmatch(wrong) and WORD.fullmatch(right)
                            and wrong not in forms and right in form2lem):
                        kept += 1
                        for lem in form2lem[right]:
                            errors[lem] += 1
                            if right == lem:
                                misspell[lem][wrong] += 1
            el.clear()

    with open(dst, 'w', encoding='utf-8', newline='') as fo:
        out = csv.writer(fo, delimiter='\t')
        out.writerow(['lemme', 'cat', 'freq', 'fautes', 'taux', 'fautes_frequentes'])
        for lem, n in errors.most_common():
            f = lemfreq.get(lem, 0)
            rate = n / (f + 1)
            top = ' '.join('%s:%d' % kv for kv in misspell[lem].most_common(6))
            out.writerow([lem, lemcat.get(lem, ''), round(f, 2), n, round(rate, 3), top])
    print(len(non_word), 'étiquettes non_word_error ;', kept, 'corrections d\'un mot gardées ;', len(errors), 'lemmes')


if __name__ == '__main__':
    main(*sys.argv[1:5])
