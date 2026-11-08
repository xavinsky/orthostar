"""Clé de prononciation approximative du français écrit.

Deux graphies qui ont la même clé se prononcent à peu près pareil : c'est le
critère qui distingue une faute d'orthographe (notament pour notamment) d'une
faute de frappe (permier pour premier).
"""
import re
import unicodedata


def _strip(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def key(word):
    w = word.lower().replace('œ', 'oe').replace('æ', 'e')
    w = re.sub(r'[ea]m+ent$', 'amant', w)  # -emment, -amment et leurs fautes (-ement, -ament)
    w = w.replace('emm', 'amm')
    # Terminaisons et voyelles accentuées, avant de retirer les accents.
    w = re.sub(r'(er|ez|ée?s?|ai|ais|ait|et|ès|è|ê|ei)(?=$|[^aeiouyéèêàâîôûn])', 'E', w)
    w = _strip(w)
    w = w.replace("'", '').replace('-', '')
    for a, b in (('ph', 'f'), ('th', 't'), ('rh', 'r'), ('ch', 'S'), ('qu', 'k'), ('gu', 'G'),
                 ('eau', 'o'), ('au', 'o'), ('ç', 's'), ('sc', 's'), ('y', 'i'), ('h', ''),
                 ('ai', 'E'), ('ei', 'E'), ('e', 'e')):
        w = w.replace(a, b)
    w = re.sub(r'c(?=[eiE])', 's', w)
    w = re.sub(r'c', 'k', w)
    w = re.sub(r'g(?=[eiE])', 'j', w).replace('G', 'g')
    w = re.sub(r'(?<=[aeiouE])s(?=[aeiouE])', 'z', w)
    w = re.sub(r'(?<=[aeiouE])ss(?=[aeiouE])', 's', w)
    w = re.sub(r'([aeo])[mn](?=[^aeiouEmn]|$)', 'A', w)      # an, en, am, em, on
    w = re.sub(r'(in|im|ain|ein|un|um)(?=[^aeiouEmn]|$)', 'I', w)
    w = re.sub(r'tion', 'sion', w)
    w = re.sub(r'(.)\1+', r'\1', w)                          # consonnes et voyelles doublées
    w = re.sub(r'[stdxp]+$', '', w)                          # finale muette
    w = re.sub(r'e$', '', w)
    return w


def plausible(wrong, right):
    """Faute d'orthographe (même prononciation) plutôt que faute de frappe."""
    if sorted(wrong) == sorted(right) and wrong != right:
        return False  # lettres interverties
    if re.search(r'(.)\1\1', wrong) or re.search(r'([aiouy])\1', wrong):
        return False  # lettre triplée ou voyelle doublée : frappe
    if re.search(r'^(.)\1|(.)\2$', wrong) and not re.search(r'^(.)\1|(.)\2$', right):
        return False  # lettre doublée au début ou à la fin du mot : frappe
    return key(wrong) == key(right)
