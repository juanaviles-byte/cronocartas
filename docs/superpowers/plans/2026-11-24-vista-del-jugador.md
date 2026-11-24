# Vista del jugador y burbujas de la Cronista · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Contra la tablet, una mesa limpia centrada en el jugador (eje rival – Lugar – jugador); en ambas mesas, la Cronista habla en burbujas que apuntan y no tapan el juego.

**Architecture:** La mesa se sigue dibujando con `lado()` en `js/ui/mesa.js`. Una función pura decide la disposición (`jugador` o `dividida`), y la clase `vista-jugador` en la raíz cuelga toda la nueva distribución en CSS. Dos módulos nuevos y pequeños:
- `js/ui/disposicion.js`: qué mesa usar.
- `js/ui/burbuja.js`: dónde poner una burbuja, como función pura y probada.

Las piezas nuevas (orbe de Saber, íconos de orilla, burbuja) se agregan a la misma estructura.

**Tech Stack:** HTML, CSS y JavaScript sin dependencias (módulos ES). Las pruebas de unidad usan `node --test`. El QA en navegador usa Python + Playwright con `/usr/bin/google-chrome`.

**Spec:** `docs/superpowers/specs/2026-11-19-vista-del-jugador-design.md`

## Global Constraints

- **No se sube a GitHub hasta que el docente lo revise** («antes de github»). Cada tarea hace commit local. Solo se publica la vista previa privada (artefacto `b09018a9-0659-4a11-862c-c0a5a62f24b0`), después de la tarea 9.
- No se cambian `js/motor.js`, `js/ia.js` ni las reglas.
- Sin dependencias nuevas y sin paso de compilación.
- Pantallas de prueba:
  - celular horizontal 844 × 390;
  - tablet 1280 × 800 y 800 × 1280;
  - PC 1440 × 900.
- En celular vertical (390 × 844) se sigue mostrando «Gira el teléfono» en ambos modos.
- Botones de al menos 44 px en el lado menor. En la vista de 844 × 390 se aceptan 40 px solo para los íconos de orilla.
- Al terminar: las 383 pruebas actuales y las nuevas pasan.
- Al terminar: los QA existentes siguen bien. Son `partida.py`, `saber.py`, `arrastre_ok.py`, `arrastre_bug.py`, `pista_bug*.py`, `expansion_mesa.py`, `expansion_jugar.py`, `cerrar.py` y `recorrido.py`, en `/home/claude/qa/`.
- Cada vez que cambia un archivo de la app, se corre `python3 /home/claude/gen/sw_lista.py . cc-vNN` (sube la versión) antes del commit.
- Estilo de texto en pantalla: español de Chile, frases cortas, sin rótulos innecesarios.

## Review Focus

1. **Mano con muchas cartas (9 o más) en 844 × 390.** El abanico no debe empujar «Pasar turno» fuera de la pantalla ni tapar el activo propio. Prueba: tarea 5, `vista_jugador.py --mano 10`.
2. **Burbuja de la Cronista cuando el objetivo está en la banda del rival** (por ejemplo, una pista sobre el activo rival). No debe tapar el Lugar ni el activo propio. Prueba: tarea 2, caso «objetivo arriba con eje prohibido».
3. **Partida retomada** (recargar a mitad de partida contra la tablet). Debe volver con `vista-jugador`, el orbe correcto según el Saber pendiente y sin burbuja colgada. Prueba: tarea 4, paso de recarga en `orbe_saber.py`.
4. **Expansión «Leyendas del Fin del Mundo» contra la tablet.** No hay tableros y el fondo es el escenario general; la franja del Lugar y la viñeta deben verse bien sin Lugar en juego. Prueba: tarea 7, `vista_jugador.py --expansion`.
5. **Arrastrar el orbe y soltarlo fuera de un Protagonista.** El orbe vuelve, no se asigna Saber y no queda un fantasma en pantalla (el error de la carta pegada). Prueba: tarea 4, caso «soltar en vacío».

---

### Task 1: Qué mesa usar

**Files:**
- Create: `js/ui/disposicion.js`
- Modify: `js/ui/mesa.js` (montaje de la raíz, cerca de la línea 75 donde está `contraIA`)
- Test: `tests/disposicion.test.js`

**Interfaces:**
- Produces: `disposicionDeMesa(config: { modo: string }) -> 'jugador' | 'dividida'`; clase `vista-jugador` en la raíz `.mesa` cuando el resultado es `'jugador'`.

- [ ] **Step 1: Write the failing test** (`tests/disposicion.test.js`)

```js
import { disposicionDeMesa } from '../js/ui/disposicion.js';
test('contra la tablet y el tutorial usan la vista del jugador', () => {
  assert.equal(disposicionDeMesa({ modo: 'ia' }), 'jugador');
  assert.equal(disposicionDeMesa({ modo: 'tutorial' }), 'jugador');
});
test('cara a cara (también en el torneo) usa la mesa dividida', () => {
  assert.equal(disposicionDeMesa({ modo: 'caraacara' }), 'dividida');
});
test('la mesa marca la vista del jugador con una clase', () => {
  assert.match(readFileSync('js/ui/mesa.js', 'utf8'), /classList\.toggle\('vista-jugador', disposicionDeMesa\(config\) === 'jugador'\)/);
});
```

- [ ] **Step 2: Run to verify it fails**
  - Run: `node --test tests/disposicion.test.js`
  - Expected: FAIL with `Cannot find module` (disposicion.js no existe).
- [ ] **Step 3: Implement**
  - En `disposicion.js`: `'dividida'` si y solo si `config.modo === 'caraacara'`; si no, `'jugador'`. Es la misma condición que hoy usa `contraIA`.
  - En `mesa.js`, al crear la raíz: `raiz.classList.toggle('vista-jugador', disposicionDeMesa(config) === 'jugador')`.
- [ ] **Step 4: Run tests**
  - Run: `sh -c 'node --test tests/*.test.js'`
  - Expected: `# fail 0`.
- [ ] **Step 5: Commit**
  - Message: `Mesa: decide la disposición según el modo`.

### Task 2: Dónde va una burbuja

**Files:**
- Create: `js/ui/burbuja.js`
- Test: `tests/burbuja.test.js`

**Interfaces:**
- Produces: `colocarBurbuja({ objetivo, tamano, pantalla, prohibidas, respaldo, separacion = 12, margen = 8 }) -> { x, y, lado, colita }`.
  - Rectángulos `{ x, y, w, h }`.
  - `objetivo` puede ser `null`.
  - `lado ∈ 'arriba'|'abajo'|'izq'|'der'|'respaldo'`.
  - `colita = { x, y }` es el punto del borde de la burbuja más cercano al centro del objetivo.

- [ ] **Step 1: Write the failing tests** (`tests/burbuja.test.js`), con `pantalla = { w: 844, h: 390 }` y `tamano = { w: 260, h: 70 }`:
  - `'elige el lado con más espacio'`: objetivo `{x:400,y:20,w:80,h:60}`, sin prohibidas → `lado === 'abajo'`.
  - `'nunca pisa una zona prohibida'`: el mismo objetivo con prohibida `{x:0,y:80,w:844,h:120}` → la burbuja no intersecta la prohibida y `lado` es `'izq'` o `'der'`.
  - `'objetivo arriba con eje prohibido'` (Review Focus 2): objetivo `{x:380,y:10,w:70,h:60}`, prohibidas `[{x:300,y:80,w:244,h:60}, {x:370,y:150,w:100,h:130}]` → no intersecta ninguna y queda dentro de la pantalla.
  - `'queda dentro de la pantalla'`: objetivo en la esquina `{x:800,y:330,w:40,h:50}` → `x >= 8`, `x + 260 <= 836`, `y >= 8`, `y + 70 <= 382`.
  - `'si no cabe en ningún lado, va sobre el respaldo'`: todo el resto de la pantalla prohibido y respaldo `{x:200,y:300,w:400,h:90}` → `lado === 'respaldo'`, `y + 70 <= 300` y centrada en x sobre el respaldo.
  - `'sin objetivo, va sobre el respaldo'`: `objetivo: null` → `lado === 'respaldo'`.
  - `'la colita apunta al objetivo'`: en el caso «abajo», `colita.y === y` y `colita.x` está entre `x + 16` y `x + 244`, lo más cerca posible de `440`.
- [ ] **Step 2: Run to verify they fail**
  - Run: `node --test tests/burbuja.test.js`
  - Expected: FAIL, `Cannot find module`.
- [ ] **Step 3: Implement `colocarBurbuja`**
  - Prueba los cuatro lados en orden de espacio libre, de mayor a menor. Por cada lado ubica la burbuja pegada al objetivo con `separacion` y la ajusta a la pantalla con `margen`. Toma el primer lado que no intersecte ninguna `prohibidas` ni el objetivo.
  - Si ninguno sirve, o no hay objetivo, la centra sobre `respaldo`.
  - La colita se ajusta a 16 px de las esquinas.
- [ ] **Step 4: Run** `sh -c 'node --test tests/*.test.js'` → `# fail 0`.
- [ ] **Step 5: Commit**
  - Message: `Burbujas: colocación que no tapa el juego`.

### Task 3: La Cronista habla en burbujas (ambas mesas)

**Files:**
- Modify: `js/ui/mesa.js`: `dibujarGlobo`, `acoplarGlobo` (se elimina), `hablar`, la fila de controles de `lado()` y `objetivoDe` (se reutiliza).
- Modify: `css/estilos.css`: reglas `.globo-cronista` (cerca de las líneas 500–535); se agregan las de `.burbuja-cronista`.
- Test: `tests/burbuja.test.js` (casos estáticos) y QA `/home/claude/qa/burbujas.py` (nuevo).

**Interfaces:**
- Consumes: `colocarBurbuja` (Task 2) y `objetivoDe(jd)` (existente).
- Produces:
  - `.burbuja-cronista` con `img.retrato`, `p`, un botón de ícono «Escuchar» con `aria-label` y una colita `.colita`, posicionada con `style.left/top`.
  - La constante `ZONAS_PROHIBIDAS = ['.zona-activo', '.lugar-en-juego', '.boton-pasar', '.controles .boton-principal']`, que se miden con `getBoundingClientRect`.

- [ ] **Step 1: Write the failing checks**
  - En `tests/burbuja.test.js`, tres casos:
    - `mesa.js` importa `colocarBurbuja`;
    - ya no existe `function acoplarGlobo`;
    - `dibujarGlobo` crea `'burbuja-cronista'`.
  - En `/home/claude/qa/burbujas.py`, para cada pantalla (844 × 390, 1280 × 800, 800 × 1280, 1440 × 900) y cada modo (`ia`, `caraacara`):
    - empezar partida;
    - pedir una pista (botón `.boton-cronista`);
    - afirmar que hay exactamente una `.burbuja-cronista`;
    - afirmar que no intersecta ninguna `.zona-activo`, `.lugar-en-juego` ni `.boton-pasar`, y que está dentro de la ventana;
    - un toque en la burbuja la cierra;
    - en cara a cara con turno de B, la burbuja tiene la clase `girado`.
- [ ] **Step 2: Run to verify fail**
  - Run: `node --test tests/burbuja.test.js` → FAIL en los tres casos nuevos.
  - Run: `python3 /home/claude/qa/burbujas.py` → reporta `burbuja-cronista: 0`.
- [ ] **Step 3: Implement**
  - `dibujarGlobo` arma la burbuja:
    - el texto, igual que hoy;
    - «Escuchar» como ícono;
    - sin botón «Entendido»: se cierra con un toque.
  - Coloca la burbuja con `colocarBurbuja`:
    - objetivo: el primer elemento de `objetivoDe(globo.jugada)`; si no hay, el botón de la Cronista del jugador;
    - prohibidas: las de `ZONAS_PROHIBIDAS`;
    - respaldo: la `.mano` del jugador.
  - Se cierra sola al terminar la voz o a los 6 s sin voz. Hoy `hablar` usa 11 s; se cambia a 6 s solo cuando no hay audio.
  - La espera del cartel «Tu turno» (`bannerHasta`) también espera a que termine la escena de invocación: `raiz.classList.contains('en-escena')`.
  - Las pistas de texto fijas pasan a burbujas automáticas una sola vez, vía `vistasGuia`: preparación sin activo y «Toca un Protagonista de tu reserva» en promover. La de Saber queda solo en la mesa dividida (en la vista del jugador la reemplaza el orbe, Task 4).
  - El botón «Listo» desactivado mantiene su texto («Primero elige tu activo»).
  - **Ruling:** el cartel de invocación (`director.js`) no se elimina, porque es la animación de cada jugada. Se compacta: va pegado bajo la carta grande, con nombre y una línea de efecto. La burbuja espera a que termine.
- [ ] **Step 4: Run** `sh -c 'node --test tests/*.test.js'` → `# fail 0`; `python3 /home/claude/qa/burbujas.py` → todas las filas `ok`; `pista_bug*.py` → sin cambios.
- [ ] **Step 5: Commit**
  - Message: `La Cronista habla en burbujas que apuntan y no tapan`.

### Task 4: Orbe de Saber (vista del jugador)

**Files:**
- Modify: `js/ui/mesa.js`: `lado()`, fila de controles; `activarArrastre()`.
- Modify: `css/estilos.css`: `.orbe-saber`.
- Test: QA `/home/claude/qa/orbe_saber.py` (nuevo) y caso estático en `tests/disposicion.test.js`.

**Interfaces:**
- Consumes: `hacerArrastrable(el, { objetivos, alSoltar })` (existente, `js/ui/arrastre.js`) y la jugada `{ tipo: 'asignarSaber', destino: uid }` (motor).
- Produces: `button.orbe-saber` con el texto `+1`, dentro de `.lado-A .controles`. Solo aparece con `vista-jugador`, turno propio, fase `turno` y `saberPendiente > 0`.

- [ ] **Step 1: Write the failing checks**
  - Estático: `mesa.js` contiene `'orbe-saber'` y llama `hacerArrastrable(` con objetivos de tipo `asignarSaber`.
  - QA `orbe_saber.py` (1280 × 800, contra la tablet):
    1. Hay un orbe con Saber pendiente.
    2. Arrastrar el orbe hasta un Protagonista de la reserva: su `.mini-saber b` sube en 1 y el orbe desaparece.
    3. En el turno siguiente, tocar el orbe muestra una burbuja que apunta a un Protagonista. Luego, tocar el activo asigna el Saber.
    4. **Soltar en vacío** (Review Focus 5): arrastrar el orbe al fondo y soltar → no cambia el Saber, el orbe sigue y `.arrastre-fantasma` (o el clon que use `arrastre.js`) tiene 0 elementos.
    5. **Recarga** (Review Focus 3): recargar con Saber pendiente → hay `vista-jugador` y un orbe, y no hay `.burbuja-cronista` colgada.
    6. En cara a cara no hay orbe y sigue la pista de texto de Saber.
- [ ] **Step 2: Run** `python3 /home/claude/qa/orbe_saber.py` → falla en el paso 1 (`orbe: 0`).
- [ ] **Step 3: Implement**
  - El orbe se dibuja en `lado()` cuando corresponde.
  - En `activarArrastre()` se hace arrastrable. Sus objetivos son los Protagonistas propios (`.lado-A .campo [data-uid]`) cuyo `uid` aparece en `jugadasValidas(estado)` como `asignarSaber`, y `alSoltar` llama `jugar(accion)`.
  - Un toque llama `hablar('A', …)` con el texto de Saber actual de `guia.js` y la jugada sugerida de asignar.
- [ ] **Step 4: Run**
  - `orbe_saber.py` → 6 de 6 `ok`.
  - `saber.py` y `arrastre_ok.py` → sin cambios.
  - `sh -c 'node --test tests/*.test.js'` → `# fail 0`.
- [ ] **Step 5: Commit**
  - Message: `Vista del jugador: orbe de Saber que se toca o se arrastra`.

### Task 5: Disposición horizontal de la vista del jugador

**Files:**
- Modify: `css/estilos.css`: nuevo bloque `/* Vista del jugador */` al final de las reglas de mesa.
- Modify: `js/ui/mesa.js`: `lado()`.
  - Íconos de orilla para línea, descarte y mazo, sin `<small>` de rótulo cuando `vista-jugador`.
  - La mano rival no se dibuja.
  - El marcador rival se puede tocar y abre `verDescarte('B')`.
  - Se quita `.saber-activo` del jugador.
  - Las fichas de acción muestran solo costo, nombre y daño, con la nota en `title`.
- Test: QA `/home/claude/qa/vista_jugador.py` (nuevo).

**Interfaces:**
- Consumes: la clase `vista-jugador` (Task 1) y el orbe (Task 4).
- Produces: el orden vertical rival → Lugar → jugador → mano. Los selectores existentes no cambian de nombre; las pruebas y QA viejos siguen encontrando `.lado-A`, `.zona-activo`, `.mano`, `.boton-pasar`, `.boton-accion`.

- [ ] **Step 1: Write the failing QA** (`vista_jugador.py`, en 844 × 390, 1280 × 800 y 1440 × 900, contra la tablet, después de 6 turnos con `jugar_lado`). Afirma:
  - área del activo propio ≥ 1,3 × área del activo rival;
  - centros verticales: activo rival < franja del Lugar < activo propio < mano;
  - ningún botón, carta ni ícono fuera de la ventana; no hay scroll horizontal;
  - no hay texto visible «Reserva», «Mazo», «Descarte» ni «Mano N» en la mesa;
  - `.lado-B .mano` no se ve;
  - botones con un lado menor ≥ 44 px (≥ 40 px para íconos de orilla en 844 × 390);
  - con `--mano 10` (Review Focus 1): se inyectan cartas a la mano vía el estado guardado y se recarga, y `.boton-pasar` sigue dentro de la ventana y no intersecta la mano.
  - Guarda capturas en `/home/claude/qa/recorrido/vj-<w>x<h>.png`.
- [ ] **Step 2: Run** `python3 /home/claude/qa/vista_jugador.py` → FAIL (área y orden: hoy los activos miden lo mismo).
- [ ] **Step 3: Implement** el bloque CSS `.mesa.vista-jugador`, siguiendo el boceto horizontal del spec:
  - banda rival compacta (activo al ~70 %);
  - franja central del Lugar a lo ancho (≥ 40 % del ancho);
  - banda propia con el activo más grande, la reserva a la izquierda y las fichas de acción a la derecha;
  - fila inferior: Cronista a la izquierda, mano en abanico al centro, orbe y «Pasar turno» con «Deshacer» como ícono a la derecha;
  - «Menú» arriba a la derecha;
  - los íconos de orilla en columnas a los costados.
  - Reutiliza el modo compacto existente (`@media (max-height: 520px) and (orientation: landscape)`) para la escala del celular.
- [ ] **Step 4: Run** `vista_jugador.py` → todas `ok`; revisar las capturas a ojo; `recorrido.py` → sin problemas nuevos.
- [ ] **Step 5: Commit**
  - Message: `Vista del jugador: disposición horizontal centrada en quien juega`.

### Task 6: Disposición vertical (tablet en vertical)

**Files:**
- Modify: `css/estilos.css`: `@media (orientation: portrait)` dentro del bloque de la vista del jugador.
- Test: `vista_jugador.py` agrega 800 × 1280.

- [ ] **Step 1:** Agregar 800 × 1280 a la lista de pantallas de `vista_jugador.py`.
- [ ] **Step 2: Run** → FAIL en 800 × 1280.
- [ ] **Step 3: Implement**
  - Mismo orden de arriba abajo.
  - Los íconos de orilla pasan a una fila bajo la banda rival.
  - La mano ocupa el ancho.
- [ ] **Step 4: Run** `vista_jugador.py` → todas `ok` en las cuatro pantallas. 390 × 844 sigue mostrando `.girar-aviso`.
- [ ] **Step 5: Commit**
  - Message: `Vista del jugador: también en tablet vertical`.

### Task 7: Escenarios en la vista del jugador

**Files:**
- Modify: `css/estilos.css`.
  - `.mesa.vista-jugador.con-tablero`: fondo `cover` centrado y viñeta con degradados arriba y abajo; el centro sin velo.
  - La franja del Lugar: sin Lugar, guía tenue.
- Test: `vista_jugador.py --expansion` (Review Focus 4).

- [ ] **Step 1:** Agregar a `vista_jugador.py`:
  - con Lugar en juego, la franja mide ≥ 40 % del ancho;
  - el píxel del centro de la pantalla no está oscurecido más de un 15 % respecto del mismo píxel de la ilustración;
  - con `--expansion` (Leyendas del Fin del Mundo, contra la tablet) no hay errores y la franja sin Lugar se ve (alto > 0).
- [ ] **Step 2: Run** → FAIL en la viñeta o la franja.
- [ ] **Step 3: Implement**
  - viñeta y franja;
  - el cartel de «viaje en el tiempo» se mantiene;
  - no se generan ilustraciones.
- [ ] **Step 4: Run** → `ok`; revisar las capturas.
- [ ] **Step 5: Commit**
  - Message: `Vista del jugador: el escenario manda en el centro`.

### Task 8: Limpieza de la mesa dividida (cara a cara)

**Files:**
- Modify: `js/ui/mesa.js` y `css/estilos.css`. Huecos de reserva sin palabra y pilas sin rótulo `<small>` también en la mesa dividida, con `aria-label` para lectores de pantalla.
- Test: `recorrido.py` (cara a cara) y `burbujas.py` (ya cubre la burbuja girada).

- [ ] **Step 1:** Agregar a `recorrido.py` el chequeo de texto visible «Reserva»/«Mazo»/«Descarte» en la mesa cara a cara, en 844 × 390 y 1280 × 800.
- [ ] **Step 2: Run** → FAIL (hoy esos rótulos se ven).
- [ ] **Step 3: Implement**
  - Quitar los rótulos y mantener los `aria-label`.
  - Revisar el modo compacto de 844 × 390 para que nada quede fuera de la pantalla.
- [ ] **Step 4: Run** `recorrido.py` en las cuatro pantallas → `ok` en todo; `cerrar.py` y `partida.py` → sin cambios.
- [ ] **Step 5: Commit**
  - Message: `Mesa dividida: menos texto, mismas funciones`.

### Task 9: Revisión final y vista previa privada

- [ ] **Step 1:**
  - `python3 /home/claude/gen/sw_lista.py . cc-vNN` (siguiente versión).
  - `sh -c 'node --test tests/*.test.js'` → `# fail 0`.
- [ ] **Step 2:** Correr todos los QA de las Global Constraints más `burbujas.py`, `orbe_saber.py` y `vista_jugador.py` (con `--mano 10` y `--expansion`) → todo `ok`.
- [ ] **Step 3:** Revisar las capturas con el skill `ui-design-review:ui-review` y corregir solo lo que sea «Must fix».
- [ ] **Step 4:**
  - Publicar en la vista previa privada con `publish_files`: `list_files` primero y solo los archivos cambiados.
  - **No hacer push a GitHub.**
- [ ] **Step 5:**
  - Commit local: `Vista del jugador: revisión final`.
  - Informar al docente con capturas de las cuatro pantallas y pedir su revisión antes de subir a GitHub.
