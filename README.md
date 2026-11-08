# OrthoStar

Jeu de révision de l'orthographe française pour préparer la dictée du brevet :
- **lexique** : environ 2 000 mots fréquents à piège, dont des fautes réellement commises ;
- **grammaire** : 32 règles, phrases fabriquées à chaque tirage ;
- **conjugaison** : 69 verbes, 13 temps.

Profils de joueurs, facteur de risque à étoiles et classement entre les joueurs d'un même navigateur.

En ligne : https://tekio.org/orthostar/ — cours associé : [Prépa dictée du brevet](https://tekio.org/prepa-dictee-brevet/).

## En local

```
python3 -I outils/lexique_vers_js.py   # vérifie lexique.tsv et génère lexique-data.js
```

puis ouvrir `index.html`. Pour que les liens vers le cours fonctionnent, placer le dépôt `prepa-dictee-brevet` à côté de celui-ci.

## Documentation

`doc/orthostar-documentation.md` : fonctionnement du jeu, fabrication du lexique, modification de `lexique.tsv`, règles de grammaire, publication.

## Sources des données

- [Lexique 3.83](http://www.lexique.org) (New, Pallier et al.), licence CC BY-SA 4.0.
- [WiCoPaCo](https://aclanthology.org/L10-1571/) (Max et Wisniewski, LREC 2010), licence GNU FDL.

Voir `LICENCE`.
