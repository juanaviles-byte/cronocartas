# Minijuego de geografía (modo libre)

## Por qué

En el modo libre, un mazo de curso puede enfrentar a una expansión. Las cartas de los cursos tienen fecha y van a la línea de tiempo; si se ubican bien, dan +1 de Saber. Las de las expansiones no tienen fecha, así que el lado de la expansión se quedaba sin ese premio.

El minijuego de geografía le da a ese lado un desafío propio, que además enseña: **¿de dónde viene esta carta?**

## Qué se juega

**Cuándo aparece.** Con la opción «Línea de tiempo» encendida, cada vez que se juega un Personaje, Acontecimiento o Lugar de una expansión que tenga origen, aparece una pregunta antes de seguir.

**Dos formas de preguntar:**

- **Mapa:** se muestra el mapa de la expansión y el jugador toca el punto de donde viene la carta.
  - El Ocaso usa el mundo, con 7 puntos: Grecia, Escandinavia, Egipto, Mesoamérica, India, China y Japón.
  - Fin del Mundo usa Chile, con 7 puntos: Norte Grande, Atacama, zona central, Araucanía, Chiloé, Tierra del Fuego y Rapa Nui.
- **Selección:** se usa cuando el origen no es un punto del mapa (por ejemplo Italia, Turquía o Alemania en la tradición cristiana). Se ofrecen 3 alternativas escritas.

**Premio.** Si acierta, su activo gana +1 de Saber, igual que en la línea de tiempo. Si falla, se le muestra la respuesta correcta y la partida sigue.

**Varias respuestas válidas.** Una carta de origen compartido, como «Mapuche y Chiloé», acepta cualquiera de sus zonas. Una carta cuyo origen es «Todo Chile» no pregunta.

**La tablet.** Responde igual que con la línea de tiempo: en los niveles Historiador y Erudito acierta siempre; en Aprendiz a veces se equivoca.

## Cómo está hecho

**Datos**

- Cada carta de expansión con origen lleva un campo `origen`, generado por `gen/geografia_datos.py` a partir de su zona:
  - `{ zonas: [...] }` para el modo mapa;
  - `{ respuesta, otras: [2 distractores] }` para el modo selección.
- `js/geografia.js` define los mapas: imagen, zonas con su nombre y su posición en porcentaje, y qué mapa usa cada colección.

**Motor**

- Al jugar una carta de expansión con origen, si la partida tiene `lineaTiempo`, queda `porSituar` en el jugador.
- Mientras haya algo por situar, la única jugada posible es `situar` (una por opción), igual que pasa con `ubicar`.
- Las opciones de selección se barajan con el generador aleatorio de la partida, así el resultado es reproducible.
- Cada respuesta genera un evento `situar` y se guarda en `yo.mapa`, para el registro y la pantalla final.

**Mapas**

- Son SVG dibujados por código con datos de Natural Earth (dominio público), en `img/mapas/`.
- Así las costas son las reales y funcionan sin internet.

**Interfaz**

- Panel como el de la línea de tiempo, con el mapa y botones de al menos 44 px sobre cada punto, o con 3 botones de alternativas.
- Después de responder sale un aviso. El botón «Mapa · n» del marcador abre el mapa con lo que ya se situó.

## Fuera de alcance

- Preguntas para las cartas de los cursos: siguen con la línea de tiempo.
- Duelos temáticos de expansión: en ellos la opción de la línea de tiempo está apagada.
