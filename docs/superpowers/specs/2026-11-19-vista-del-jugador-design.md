# Vista del jugador y burbujas de la Cronista · Diseño

*19 de noviembre de 2026 · Cronocartas*

## Para qué

La mesa actual reparte la pantalla en partes iguales entre los dos jugadores, lo que sirve para el cara a cara. Contra la tablet, en cambio, la mesa se ve recargada: en un celular el globo de la Cronista cruza el centro y tapa las cartas activas, los avisos de efecto se montan sobre el campo, la mano queda chica en una esquina y abundan los rótulos de texto.

El objetivo es una mesa **limpia, centrada en quien juega**, inspirada en la *disposición* de Marvel Snap (un eje vertical: rival arriba, lugar al centro, jugador abajo, información en las orillas). No se toma nada de su estilo visual, marca ni personajes.

## Qué se decidió con el docente

- **Dos disposiciones de mesa; las elige el modo de juego, no el aparato.**
  - **Contra la tablet** (incluido el tutorial) → **vista del jugador**, en PC, tablet y celular.
  - **1 contra 1 (cara a cara)** → la mesa dividida de hoy, con cada mitad mirando a su jugador.
- **El celular se juega siempre en horizontal**, en los dos modos. En vertical se muestra el aviso «Gira el teléfono» (ya existe).
- **La Cronista habla en burbujas** que apuntan al elemento del que hablan, en ambas mesas y en el tutorial.
- Los **escenarios** (ilustraciones de Lugares y tableros, 3:2 horizontales) se consideran en la composición.
- Camino elegido: **A. misma mesa, otra disposición** (ver «Caminos»).
- Rehacer la mesa en un motor de juegos queda para las vacaciones.

## Metas

1. Contra la tablet, la atención está en el lado del jugador: su activo es la carta más grande de la pantalla y su mano está siempre a mano.
2. Nada tapa el eje central (activo rival – Lugar – activo propio) salvo una carta abierta a pedido.
3. Mínimo texto en la mesa: el detalle aparece al tocar.
4. La misma jerarquía en horizontal (celular, PC, tablet horizontal) y en vertical (tablet vertical).
5. Las burbujas de la Cronista guían sin bloquear: se cierran solas o con un toque.

## No metas

- Cambiar las reglas, el motor o la IA.
- Rediseñar menús, colección, torneo o panel docente.
- Una tercera disposición propia del celular.
- Rehacer la mesa en Phaser o Unity.

## Anti-metas (fracasaría aunque funcione)

- Que el rival llame más la atención que el jugador.
- Que una burbuja o un aviso tape las cartas activas o el botón «Pasar turno».
- Que algo que hoy funciona en la tablet cara a cara se rompa: arrastrar, pistas, deshacer, voces, línea de tiempo, retomar partida.
- Que el jugador no encuentre una función que antes estaba a la vista (descarte, línea de tiempo, deshacer, menú).
- Que se pierda la legibilidad para niños de 10 a 14 años (botones de al menos 44 px).

## Restricciones

- HTML, CSS y JavaScript sin dependencias ni compilación, como el resto del proyecto.
- El mismo código sirve la web (GitHub Pages) y el APK (Capacitor).
- Las 383 pruebas actuales siguen pasando. Las pruebas de QA en navegador (partida, Saber, arrastre, pistas, expansión) también.
- Pantallas mínimas: celular horizontal de 844 × 390; tablet de 1280 × 800 en ambas orientaciones; PC de 1440 × 900.

## Caminos considerados

| Camino | Qué gana | Qué cuesta | Decisión |
|---|---|---|---|
| **A. Misma mesa, otra disposición** | Arrastrar, pistas, animaciones, voces y deshacer siguen funcionando sin duplicar código; las pruebas cubren ambas | CSS de la mesa más complejo | **Elegido** |
| B. Mesa nueva solo para «contra la tablet» | Libertad total de diseño | Dos mesas que mantener; cada arreglo se hace dos veces | Descartado |
| C. Motor de juegos (Phaser/Unity) | Animación de videojuego | Semanas de trabajo, otra base técnica | Para las vacaciones |

## Diseño

### 1. Cómo se activa

`mesa.js` agrega la clase `vista-jugador` a la raíz de la mesa cuando se juega contra la tablet: es la misma condición que hoy decide `contraIA`, es decir `config.modo` igual a `'ia'` o a `'tutorial'`. En cara a cara (incluidas las partidas del torneo, que usan `'caraacara'`) no se agrega. Todo el cambio de disposición cuelga de esa clase. La estructura que dibuja `lado()` se mantiene; solo se agregan las piezas nuevas de la sección 3. Las cartas ya muestran su Saber (`mini-saber`), así que el texto «Tu activo tiene X de Saber» se puede quitar sin perder información.

### 2. Disposición de la vista del jugador

**Horizontal** (celular, PC, tablet horizontal):

```
┌─────────────────────────────────────────────────────┐
│ ◉ Tablet ○○●      [r][r][r] [ACTIVO rival]     ☰    │  banda rival (chica)
│ ▭ Línea                                    ▭ Mazo   │
│        ═════════════ LUGAR ═════════════            │  banda central
│ ▭ Descarte                                          │
│ ◉ Tú ●○○   [r][r][r]  [  TU ACTIVO  ]  ⚔ Acción 30  │  tu banda (grande)
│ ☺   ╭─╮╭─╮╭─╮╭─╮╭─╮  (abanico)   ◎+1   [Pasar turno] │  mano, Saber, turno
└─────────────────────────────────────────────────────┘
```

**Vertical** (tablet vertical): el mismo orden de arriba abajo; las orillas pasan a una fila de íconos.

Reglas de jerarquía:

- **Rival:** la banda superior es compacta. Su activo mide alrededor del 70 % del activo propio; su reserva va en miniatura. Su mano no se dibuja (solo el número, en su marcador). Sus pilas no se dibujan (se ven al tocar su marcador).
- **Centro:** el Lugar es una franja ancha con su nombre y su efecto en una línea; tocarla abre la carta. Sin Lugar, la franja es una guía tenue («Juega un Lugar para cambiar el escenario»).
- **Jugador:**
  - El activo propio es la carta más grande, al centro.
  - Las acciones van como fichas a su derecha: puntos de costo, nombre corto y daño. Las explicaciones largas («Falta 1 de Saber», desglose) pasan al título o al detalle de la carta.
  - La reserva va a su izquierda.
- **Marcadores:**
  - Cada marcador es una pastilla en una esquina: retrato o nombre, hitos y cantidad en la mano.
  - Se elimina «Mano 5» como texto separado y «Tu activo tiene X de Saber» (el Saber se ve como puntos sobre la carta).
- **Orillas:**
  - Línea de tiempo, descarte y mazo son íconos con un número, sin rótulo.
  - Los huecos vacíos de la reserva son marcos tenues sin la palabra «Reserva».
- **Abajo:**
  - La mano va en abanico, centrada y pegada al borde inferior. Una carta tocada sube.
  - El **orbe de Saber** («+1») queda a la derecha de la mano.
  - «Pasar turno» va abajo a la derecha, con «Deshacer» como ícono a su lado.
  - El mini retrato de la Cronista (pista) va abajo a la izquierda.
  - «Menú» va arriba a la derecha.

### 3. Piezas nuevas

**Orbe de Saber.**
- Aparece cuando hay Saber pendiente, con brillo suave.
- Se puede arrastrar hasta un Protagonista propio, o tocar el orbe y luego el Protagonista.
- Tocar directo el Protagonista sigue funcionando, como hoy.
- Reemplaza la pista de texto «Ganaste 1 de Saber este turno…».

**Burbujas de la Cronista** (en ambas mesas y en el tutorial):

- Un componente único: mini retrato con expresión, texto corto (2 líneas como máximo en celular) y una colita que apunta al elemento.
- El elemento se obtiene con la misma búsqueda que ya usan las pistas, por tipo de jugada.
- **Colocación:** junto al elemento, en el lado con más espacio. Nunca sobre el eje central ni sobre «Pasar turno». Si no cabe, va sobre la mano.
- **Cierre:** se cierra con un toque o sola cuando termina la voz (o a los 6 s sin voz). «Escuchar» queda como ícono dentro de la burbuja.
- Reemplaza el globo central actual y las pistas de texto fijas (Saber, primer turno, promover, preparación).
- En cara a cara, la burbuja mira al jugador de turno, girada si corresponde.

**Etiquetas de efecto.** Los avisos como «Aula · Aprendizaje profundo» se muestran como una etiqueta breve junto a la carta que los causa y se desvanecen en unos 1,6 s. El texto completo queda en el registro y en la carta. Aplica a ambas mesas.

### 4. Escenarios

- El fondo de la vista del jugador es el escenario completo, centrado (*cover*). La franja del Lugar queda sobre el centro de la ilustración, donde suele estar el motivo principal.
- Una viñeta oscurece las orillas superior e inferior, para que el rival, la mano y los íconos se lean sin competir con la imagen. El centro queda sin velo.
- En vertical, la ilustración se recorta a su centro. No se generan ilustraciones nuevas.
- El cartel de «viaje en el tiempo» al cambiar de escenario se mantiene.

### 5. Mesa cara a cara

Mantiene su estructura. Recibe:
- las burbujas de la Cronista;
- las etiquetas de efecto;
- huecos y pilas sin rótulos;
- en el celular horizontal, el modo compacto actual revisado para que nada quede fuera de pantalla.

## Cómo se comprueba

- Pruebas de unidad nuevas:
  - la clase `vista-jugador` solo en el modo contra la tablet;
  - la colocación de la burbuja (lado elegido según el espacio, y nunca sobre el eje central), como función pura;
  - el orbe de Saber: arrastrar o tocar asigna el Saber igual que tocar el Protagonista.
- QA en navegador, en 844 × 390, 1280 × 800 (ambas orientaciones) y 1440 × 900:
  - capturas de ambas mesas;
  - nada fuera de pantalla;
  - ninguna burbuja sobre los activos ni sobre «Pasar turno»;
  - botones de al menos 44 px.
- Se repiten las pruebas de QA existentes: partida completa, Saber, arrastre, pistas visibles, expansión, retomar partida.
- Revisión de diseño con el plugin UI Design Review sobre las capturas.

## Lo que queda a criterio de quien construye

- Tamaños exactos, espaciado y curvas de animación, dentro de las reglas de jerarquía.
- El dibujo de los íconos de las orillas (en la línea de los íconos actuales).
- Cómo se reacomoda el abanico de la mano con muchas cartas (más de 7).
- La duración exacta de etiquetas y burbujas.
