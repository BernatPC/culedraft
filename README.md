# CuleDraft

Joc de navegador inspirat en el [7a0](https://7a0.com.br), però amb tots els Barça de la història: tires el dau, et toca una temporada històrica del Barça i n'esculls un jugador per a una posició lliure. Quan tens l'onze, jugues set partits contra equips llegendaris d'Europa. L'objectiu és el 7 a 0: set victòries sense encaixar cap gol.

## Com jugar

- **Partida:** Repte del dia (tothom rep els mateixos daus avui), Lliga privada (els mateixos daus per a tots els que posin el mateix codi) o Lliure (a l'atzar).
- **Sistema:** 4-3-3, 4-4-2, 3-4-3 o 3-5-2.
- **Estil:** Defensiu, Equilibrat o Ofensiu.
- **Mode:** Clàssic (valoracions visibles, 3 re-tirades) o Almanac (valoracions amagades, 1 re-tirada).

Fitxar diversos jugadors de la mateixa temporada dona química a l'equip.

## Executar-lo en local

No cal instal·lar res. Obre `index.html` al navegador, o des d'IntelliJ fes clic dret a `index.html` → *Open In* → *Browser*.

## Publicar-lo amb GitHub Pages

1. Puja el projecte a un repositori.
2. *Settings* → *Pages* → *Source: Deploy from a branch* → branca `main`, carpeta `/ (root)`.
3. Al cap d'un minut el joc és a `https://<usuari>.github.io/<repositori>/`.

## Estructura

```
index.html      Marcatge de la pàgina
css/style.css   Estils (tema fosc tipus marcador)
js/data.js      Temporades del Barça i rivals
js/game.js      Lògica: sorteig, alineació, simulació i classificació
```

## Afegir una temporada

Afegeix un objecte a `SEASONS` a `js/data.js`:

```js
{y:"2005-06",coach:"Frank Rijkaard",fita:"Champions a París",p:[["Valdés","POR",85],["Puyol","DEF",88], ...]}
```

Posicions vàlides: `POR`, `DEF`, `MIG`, `DAV`. Les valoracions van aproximadament de 70 a 98.
