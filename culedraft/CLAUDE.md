# CuleDraft — context per a Claude Code

Joc web estàtic (HTML + CSS + JavaScript sense framework ni build). Tot el text de la interfície és en català.

## Fitxers
- `index.html`: marcatge. Carrega `js/data.js` i després `js/game.js` com a scripts clàssics (no mòduls); les constants de `data.js` són globals.
- `js/data.js`: `SEASONS` (temporades del Barça: `y`, `coach`, `fita`, `p` = llista de `[nom, posició, valoració]`), `RIVALS_GROUP` i `RIVALS_ELITE` (`[nom, valoració]`).
- `js/game.js`: estat a l'objecte global `S`; `render()` torna a pintar tota la UI a partir de `S`.
- `css/style.css`: tokens de color i tipografia a `:root`.

## Lògica clau
- Atzar: tot passa per `R()`. En un repte (`chKey()` no nul) `R` és un generador amb llavor (`rngFrom`), de manera que els daus i els rivals són iguals per a tothom. Si fas servir atzar nou, usa `R()`, mai `Math.random()` directament.
- `strength()`: atac, mig i defensa a partir de les valoracions, més química i estil.
- `match()`: gols amb distribució de Poisson; eliminatòries empatades es decideixen als penals.
- `playTournament()`: 3 partits de grup, vuitens, quarts, semifinal i final.
- La classificació (`connect`, `saveResult`, `renderRank`) només funciona quan la pàgina s'obre com a artifact de claude.ai (`window.claude.use`). Fora d'allà la secció s'amaga.

## Convencions
- Posicions: `POR`, `DEF`, `MIG`, `DAV`.
- Sense dependències ni passos de build: el joc ha de funcionar obrint `index.html` directament.
- Mantén el tema fosc i els tokens de `:root`; no hi posis colors literals.

## Idees pendents
- Classificació pública amb Supabase o Firebase per a GitHub Pages.
- Més temporades (Samitier, Menotti i Maradona, Koeman entrenador...).
- Repte diari amb sistema i estil fixats.
