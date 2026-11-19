# Leyendas del Fin del Mundo: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la primera expansión de Cronocartas como una colección con sus propias fuerzas, su mazo de 40 cartas, dos duelos y una pestaña «Expansiones» en la pantalla de juego libre, sin cambiar nada de los cursos.

**Architecture:** Un registro en código (`js/colecciones.js`) describe cada expansión: fuerzas, ronda de ventajas, temas visuales y rutas. El motor y la interfaz unen esas fuerzas a las dimensiones de Historia. Las claves no se repiten y los mazos nunca se mezclan, así que un solo mapa de ventajas sirve para todo. Las cartas y los duelos de la expansión viven en `data/exp-fin-del-mundo.json`. La mesa y la pantalla Jugar reciben `coleccion` en la configuración de la partida.

**Tech Stack:** ES modules sin compilación, `node --test`, Playwright con Chrome para QA, service worker generado con `gen/sw_lista.py`.

**Spec:** `docs/superpowers/specs/2026-11-19-fin-del-mundo-design.md`

## Global Constraints

- Las 311 pruebas actuales siguen pasando. Los archivos `data/mazo-5..8.json`, `data/duelos.json` y `data/tableros.json` no cambian.
- Toda interpolación en plantillas HTML pasa por `esc()` (lo exige la prueba de seguridad).
- Se respeta `prefers-reduced-motion`.
- Códigos de carta: `FM-001` a `FM-040`.
- Composición: 24 Protagonistas (6 por fuerza), 6 Personajes (presencias sagradas), 6 Acontecimientos (relatos) y 4 Lugares (uno por fuerza).
- Claves de las fuerzas: `Mar`, `TierraFuego`, `CieloViento`, `BosqueNoche`. Nombres visibles: «Mar», «Tierra y Fuego», «Cielo y Viento», «Bosque y Noche».
- Ronda de ventajas: Mar → TierraFuego → CieloViento → BosqueNoche → Mar (la primera hace ×2 a la segunda).
- Etiqueta del dato en la expansión: «De dónde viene».
- Sin fechas, OA, curso ni unidad en las cartas de la expansión. La línea de tiempo queda apagada.
- Las presencias sagradas (Personajes) son siempre de tipo `personaje`: el motor nunca les permite recibir ataques.

## Review Focus

1. **Partidas guardadas de antes.** Una partida de curso guardada antes del cambio (su configuración no trae `coleccion`) debe retomarse igual.
2. **Arte pendiente.** Mientras no lleguen las ilustraciones, los escenarios ni los dorsos, las cartas de la expansión deben verse con su emblema y su tema, la mesa con un fondo neutro y los dorsos con el general de siempre. Nada de errores en la consola.
3. **La tablet como rival.** La IA juega una partida completa de la expansión y aprovecha la ventaja entre fuerzas, porque `guia.js` y `ia.js` leen `VENTAJA`.
4. **Duelos con núcleo chico.** Un mazo de bando con `soloNucleo` tiene 20 cartas y ninguna de otra fuerza, aunque el núcleo traiga solo 6 Protagonistas.
5. **Cara a cara.** En la expansión, el panel girado, los dorsos por bando y el menú de la partida funcionan igual que en los cursos.

---

### Task 1: Registro de colecciones y fuerzas

**Files:**
- Create: `js/colecciones.js`
- Modify: `js/motor.js:7-17` (VENTAJA), `js/mazos.js:16,22,36,53,145`, `js/ui/arte.js:56-66` (TEMAS), `js/ui/mesa.js:39` (FRASES_VENTAJA)
- Test: `tests/colecciones.test.js`

**Interfaces:**
- Produces:
  - `COLECCIONES: Array<{ id, nombre, sigla, archivo, fondo, dorso, etiquetaDato, fuerzas: { [clave]: { nombre, tema: { base, claro, oscuro, papel, icono }, frase } }, ventaja: { [clave]: clave } }>`
  - `coleccion(id) → objeto | null`
  - `FUERZAS: { [clave]: { nombre, tema, frase } }`
  - `VENTAJA_FUERZAS`
  - En `motor.js`: `TODAS_DIMENSIONES` (las 5 de Historia y las 4 fuerzas). `DIMENSIONES` sigue con las 5 de Historia, porque la usan el banco y el editor docente.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
test('la ronda de ventajas de la expansión se cierra: cada fuerza le gana a una y pierde con otra', () => {
  const fm = coleccion('fin-del-mundo');
  const claves = Object.keys(fm.fuerzas);
  assert.deepEqual(claves.sort(), ['BosqueNoche', 'CieloViento', 'Mar', 'TierraFuego']);
  assert.deepEqual(Object.values(fm.ventaja).sort(), claves.sort());
  assert.equal(fm.ventaja.Mar, 'TierraFuego'); assert.equal(fm.ventaja.BosqueNoche, 'Mar');
});
test('el motor aplica ×2 de Mar contra Tierra y Fuego y nada contra Cielo y Viento', () => {
  // mesa(a, b) como en desglose.test.js, con prot('Mar') contra prot('TierraFuego') y prot('CieloViento')
  assert.deepEqual(desgloseDanio(mesa(mar, tierra), 'A', 0).pasos, [{ fuente: 'ventaja', por: 2 }]);
  assert.deepEqual(desgloseDanio(mesa(mar, cielo), 'A', 0).pasos, []);
});
test('las ventajas de Historia no cambian', () => assert.equal(VENTAJA.Politica, 'Economia'));
test('una carta de la expansión valida con su fuerza y una con fuerza inventada no', () => {
  assert.deepEqual(validarCarta(prot('Mar')), []);
  assert.ok(validarCarta(prot('Lava')).length);
});
test('nombres, temas y frases de cada fuerza', () => {
  assert.equal(NOMBRE_DIMENSION.TierraFuego, 'Tierra y Fuego');
  assert.equal(TEMAS.Mar.icono, 'ola'); assert.equal(TEMAS.TierraFuego.icono, 'volcan');
  assert.equal(TEMAS.CieloViento.icono, 'estrella'); assert.equal(TEMAS.BosqueNoche.icono, 'arbol');
  for (const k of Object.keys(FUERZAS)) assert.ok(FRASES_VENTAJA_TEXTO(k));   // leer mesa.js como texto y buscar la clave
});
```

- [ ] **Step 2: Ejecutar** `node --test tests/colecciones.test.js`. Expected: FAIL («Cannot find module ../js/colecciones.js»).
- [ ] **Step 3: Implementar `js/colecciones.js`.** Lleva los datos fijos de la expansión. Paletas:
  - Mar: base `#1F6E8C`, oscuro `#0B3550`.
  - Tierra y Fuego: base `#B8432A`, oscuro `#5A1A0E`.
  - Cielo y Viento: base `#5B4FA8`, oscuro `#2A2160`.
  - Bosque y Noche: base `#2F6B3A`, oscuro `#13301A`.

  Frases de ventaja:
  - Mar: «¡El mar apaga el fuego!»
  - Tierra y Fuego: «¡La ceniza cubre el cielo!»
  - Cielo y Viento: «¡La luz disipa la noche!»
  - Bosque y Noche: «¡Los brujos del Caleuche gobiernan el mar!»

  Después, en `motor.js`, sumar `VENTAJA_FUERZAS` a `VENTAJA` y exportar `TODAS_DIMENSIONES`. En `mazos.js`, validar contra `TODAS_DIMENSIONES` y extender `NOMBRE_DIMENSION`. En `arte.js`, extender `TEMAS` y `COLORES`. En `mesa.js`, extender `FRASES_VENTAJA`. `colecciones.js` no importa nada del motor.
- [ ] **Step 4: Ejecutar** `node --test tests/*.test.js`. Expected: todas las pruebas pasan (311 + las nuevas).
- [ ] **Step 5: Commit** «Colecciones: registro de fuerzas y ventajas de la expansión».

### Task 2: Las 40 cartas y su carga

**Files:**
- Create: `data/exp-fin-del-mundo.json` con `{ coleccion, nombre, cartas: [...40], duelos: [...2] }`
- Modify: `js/mazos.js`, para agregar `cargarExpansion`; `js/ui/datos.js`, para agregar `cargarColeccionCompleta`
- Test: `tests/expansion.test.js`; `tests/sintonia.test.js`, para que la auditoría recorra también las cartas de la expansión

**Interfaces:**
- Produces:
  - `cargarExpansion(id: string, { imagenes = {} }) → Promise<{ cartas, aula: [], unidades: [], duelos }>` en `mazos.js`
  - `cargarColeccionCompleta(id) → Promise<mismo objeto>` en `datos.js`. Registra ilustraciones y escenarios igual que `cargarCursoCompleto`.
- Campos de cada carta:
  - todas: `id`, `nombre`, `tipo`, `coleccion: 'fin-del-mundo'`, `dato` (máx. 220 caracteres), `zona` (máx. 40, por ejemplo «Chiloé · relato huilliche y chilote»), `emblema` (de `EMBLEMAS`) y `frase`;
  - Protagonistas: además `dimension` (una fuerza), `resistencia`, `retirada` y `acciones` con nombres propios del ser;
  - Personajes: un efecto de apoyo (`curar`, `proteger`, `bonusDanio`, `robar` o `moverSaber`);
  - Lugares: `bonusDimension` con su fuerza, `n: 10`.
- Ninguna carta lleva `fecha`, `oa`, `curso` ni `unidad`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
const X = JSON.parse(readFileSync('data/exp-fin-del-mundo.json', 'utf8'));
test('40 cartas FM-001..FM-040 válidas, con la composición acordada', () => {
  assert.equal(X.cartas.length, 40);
  assert.deepEqual(X.cartas.map(c => c.id), Array.from({ length: 40 }, (_, i) => `FM-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(validarMazo(X.cartas), []);
  const n = t => X.cartas.filter(c => c.tipo === t).length;
  assert.deepEqual([n('protagonista'), n('personaje'), n('acontecimiento'), n('lugar')], [24, 6, 6, 4]);
  for (const f of ['Mar', 'TierraFuego', 'CieloViento', 'BosqueNoche']) {
    assert.equal(X.cartas.filter(c => c.tipo === 'protagonista' && c.dimension === f).length, 6, f);
    assert.equal(X.cartas.filter(c => c.tipo === 'lugar' && c.efecto.dimension === f).length, 1, f);
  }
});
test('sin fechas ni OA; cada carta dice de dónde viene', () => {
  for (const c of X.cartas) {
    for (const k of ['fecha', 'oa', 'curso', 'unidad']) assert.equal(c[k], undefined, `${c.id}.${k}`);
    assert.ok(c.zona && c.zona.length <= 40 && c.dato.length <= 220, c.id);
  }
});
test('las presencias sagradas son Personajes con efecto de apoyo', () => {
  for (const nombre of ['Ngenechen', 'Pillán', 'Make Make', 'Pachamama', 'Achachilas', 'Temáukel'])
    assert.equal(X.cartas.find(c => c.nombre === nombre)?.tipo, 'personaje', nombre);
});
test('el balance de la expansión está dentro de los rangos de los cursos', () => { /* resistencia 50–120, costo 1–3, daño ≤ 100 y daño por costo igual que validarBalance para los cursos */ });
```

- [ ] **Step 2: Ejecutar** `node --test tests/expansion.test.js`. Expected: FAIL (ENOENT data/exp-fin-del-mundo.json).
- [ ] **Step 3: Escribir el JSON.** La lista de seres y el orden de los códigos son los de `docs/fin-del-mundo/prompts-arte.md`:
  - FM-001 a FM-006 en el orden de MK01;
  - FM-007 a FM-012 en el orden de MK02;
  - FM-013 a FM-018 en el de MK03;
  - FM-019 a FM-024 en el de MK04;
  - FM-025 a FM-030 en el de MK05;
  - FM-031 a FM-036 en el de MK06;
  - FM-037 a FM-040, los cuadros 1 a 4 de MK07.

  Los datos se escriben con fuentes. Las presencias sagradas usan la fórmula «Para el pueblo X, …». Los valores de cada carta se copian de las curvas de los cursos: el mismo daño por costo y resistencias en 60–110.
- [ ] **Step 4: Implementar `cargarExpansion` y `cargarColeccionCompleta`.** Sumar la expansión a la auditoría de sintonía, que compara cada texto de efecto con lo que hace el motor.
- [ ] **Step 5: Ejecutar** la suite completa. Expected: todo pasa.
- [ ] **Step 6: Commit** «Expansión: las 40 cartas de Leyendas del Fin del Mundo».

### Task 3: Duelos y dorsos de la expansión

**Files:**
- Modify: `data/exp-fin-del-mundo.json` (duelos), `js/mazos.js:173` (`mazoDeBando`), `js/ui/dorsos.js:5`, `data/dorsos.json`
- Test: `tests/expansion.test.js`, `tests/dorsos.test.js`

**Interfaces:**
- Consumes: `cargarExpansion` (Task 2).
- Produces:
  - duelo de la expansión: `{ id: 'D-FM-1' | 'D-FM-2', coleccion, nombre, soloNucleo: true, arte, bandos: [{ id: 'mar' | 'tierra-fuego' | 'cielo-viento' | 'bosque-noche', nombre, lema, color, emblema, nucleo: [nombres] }] }`;
  - `mazoDeBando(cartas, aula, rng, duelo, bandoId)` con `duelo.soloNucleo`, que excluye toda carta fuera del núcleo propio;
  - `dorsoDeMazo(dorsos, cartas, bando, general = dorsos.general)`.
- Núcleo de cada bando: sus 6 Protagonistas, su Lugar, los 2 relatos de su fuerza (MK06) y 3 presencias sagradas. En el Mar van Ngenechen, Make Make y Temáukel; en Tierra y Fuego, Pillán, Pachamama y Achachilas. Para el segundo duelo, las mismas 6 presencias se reparten igual.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
test('un mazo de bando con soloNucleo tiene 20 cartas, todas de su núcleo', () => {
  for (const d of X.duelos) for (const b of d.bandos) {
    const m = mazoDeBando(X.cartas, [], crearRng(3), d, b.id);
    assert.equal(m.length, 20, b.id);
    assert.ok(m.every(c => b.nucleo.includes(c.nombre)), b.id);
  }
});
test('cada fuerza aparece en un solo bando de un solo duelo', () => { /* 4 bandos, 4 fuerzas distintas */ });
test('el dorso general de una colección reemplaza al general de Historia', () => {
  assert.equal(dorsoDeMazo(DORSOS, cartasFM, null, 'img/dorsos/FM-D0.webp'), 'img/dorsos/FM-D0.webp');
  assert.equal(dorsoDeMazo(DORSOS, cartasFM, 'mar'), DORSOS.temas['FM-mar']);
});
```

- [ ] **Step 2: Ejecutar.** Expected: FAIL (duelos vacíos; `soloNucleo` ignorado).
- [ ] **Step 3: Implementar.** Agregar los duelos al JSON, `soloNucleo` en `mazoDeBando` y el parámetro `general` en `dorsoDeMazo`. En `data/dorsos.json`, sumar los temas `FM-general`, `FM-mar`, `FM-tierra-fuego`, `FM-cielo-viento` y `FM-bosque-noche` y sus bandos. Solo se suman las rutas cuyos archivos existen: mientras falte el arte, queda el dorso de siempre.
- [ ] **Step 4: Ejecutar** la suite completa. Expected: todo pasa.
- [ ] **Step 5: Commit** «Expansión: duelos La Guerra de las Serpientes y Luces y Sombras».

### Task 4: Pestañas «Cursos | Expansiones» en Jugar

**Files:**
- Modify: `js/ui/app.js:14` (eleccion), `js/ui/app.js:60-150` (vista jugar), `css/estilos.css`
- Test: `/home/claude/qa/expansion_jugar.py` (Playwright) y una prueba de lint en `tests/expansion.test.js`

**Interfaces:**
- Consumes: `COLECCIONES`, y los duelos de `cargarExpansion`.
- Produces: `eleccion.coleccion: string | null`. `partidaPendiente` lleva `coleccion`.

- [ ] **Step 1: Escribir la QA que falla.** Abrir `#jugar`, tocar «Expansiones» y verificar:
  - que se ve «Leyendas del Fin del Mundo»;
  - que no aparecen «¿Qué curso?», «Tablero» ni «Línea de tiempo»;
  - que al elegir «Duelo temático» aparecen «La Guerra de las Serpientes» y «Luces y Sombras»;
  - que «Empezar» lleva a `#mesa` con `cc.partida.config.coleccion === 'fin-del-mundo'`.
- [ ] **Step 2: Ejecutar.** Expected: FAIL (no existe la pestaña).
- [ ] **Step 3: Implementar.** Las pestañas van arriba del todo. Al pasar a Expansiones se limpian `tablero`, `reforzar`, `duelo` y `bandoA`, y se fuerza `linea: false`. Al volver a Cursos, `coleccion` queda en `null`.
- [ ] **Step 4: Ejecutar** la QA y la suite. Expected: PASS.
- [ ] **Step 5: Commit** «Jugar: pestaña Expansiones».

### Task 5: La mesa con una colección

**Files:**
- Modify: `js/ui/mesa.js:57-110` (carga), `js/ui/mesa.js:351-420` (fondo y cartel de viaje), `js/ui/carta.js:140-200` (sello, pie y ficha), `js/ui/mesa.js:1205-1215` («¿Sabías que?»)
- Test: `/home/claude/qa/expansion_mesa.py` y pruebas de lint en `tests/expansion.test.js`

**Interfaces:**
- Consumes:
  - `cargarColeccionCompleta`, `coleccion(id)`, `mazoDeBando` con `soloNucleo` y `dorsoDeMazo(..., general)`;
  - los duelos de la colección: `config.duelo` se busca en `datos.duelos` cuando hay `config.coleccion`.
- Produces: en una partida de la expansión,
  - `config.coleccion` queda guardado y se retoma;
  - sin tablero, el fondo es `coleccion.fondo` si el archivo existe y, si no, el fondo neutro;
  - el cartel de viaje muestra el nombre del Lugar y su `zona`, sin años;
  - las cartas muestran la sigla `FM` en el sello y la zona en el pie;
  - la ficha y el «¿Sabías que?» dicen «De dónde viene».

- [ ] **Step 1: Escribir la QA que falla.**
  - Una partida completa de la expansión contra la tablet, con el bot de `voces_amb.py`, termina con `.final` y sin errores.
  - Al menos una carta en mano tiene un id `FM-`.
  - Al poner un Lugar FM (inyectado como en `amb_lugar.py`), el cartel no muestra dígitos de año.
  - La ficha de una carta dice «De dónde viene».
  - Al retomar desde «Continuar partida», las cartas siguen siendo FM.
  - Lint: `carta.js` toma la etiqueta del dato de la colección, y `mesa.js` pasa `linea: false` cuando hay colección.
- [ ] **Step 2: Ejecutar.** Expected: FAIL.
- [ ] **Step 3: Implementar.** Mantener intacto el camino de los cursos: todo lo nuevo depende de `config.coleccion`.
- [ ] **Step 4: Ejecutar** la QA nueva, `partida.py`, `cerrar.py`, `saber.py` y la suite. Expected: PASS.
- [ ] **Step 5: Commit** «Mesa: partidas de la expansión».

### Task 6: Marcos de la naturaleza

**Files:**
- Modify: `js/ui/carta.js` (clases `col-<id>` y `fuerza-<clave>` en `.carta`), `css/estilos.css`
- Test: lint en `tests/expansion.test.js`; capturas de QA en `/home/claude/qa/marcos.py`

- [ ] **Step 1: Escribir la prueba que falla.** Una carta FM renderizada en el navegador tiene las clases `col-fin-del-mundo` y `fuerza-Mar`, y su marco calculado (`border-image` o `::before`) no es el de Historia.
- [ ] **Step 2: Ejecutar.** Expected: FAIL.
- [ ] **Step 3: Implementar.** Ornamentos en SVG en línea dentro del CSS, en el color `--claro` del tema:
  - Mar: olas en el borde inferior;
  - Tierra y Fuego: llamas en las esquinas;
  - Cielo y Viento: plumas y estrellas;
  - Bosque y Noche: helechos.

  Sin símbolos de los pueblos. Revisar las capturas en los tamaños mini, normal y grande.
- [ ] **Step 4: Ejecutar** la QA y la suite. Expected: PASS.
- [ ] **Step 5: Commit** «Expansión: marcos de la naturaleza».

### Task 7: Guiones de sonido y voz

**Files:**
- Create: `docs/fin-del-mundo/ambientes.md` (FM-ME00 y los 4 Lugares, con búsquedas de Freesound y reglas CC0) y `docs/fin-del-mundo/narrador.md` (los 40 textos «nombre + De dónde viene», con las mismas instrucciones de Google AI Studio que el guion de los cursos)
- Modify: `gen/ambientes.py`, para aceptar códigos `ME00`–`ME04` mapeados a ids FM

- [ ] **Step 1:** Prueba que `ambientes.py` acepta `ME01.wav` y escribe `audio/ambientes/FM-037.ogg` con un archivo de ruido generado. Expected: FAIL.
- [ ] **Step 2:** Implementar el mapeo ME → id desde la colección y escribir los dos documentos.
- [ ] **Step 3:** Ejecutar la prueba. Expected: PASS.
- [ ] **Step 4: Commit** «Expansión: guiones de narrador y ambientes».

### Task 8: Verificar y publicar

- [ ] **Step 1:** Ejecutar `python3 /home/claude/gen/sw_lista.py . cc-vNN` con la versión siguiente. Ejecutar `node --test tests/*.test.js` y todas las QA de Playwright (`partida.py`, `cerrar.py`, `saber.py`, `amb_real.py`, `expansion_jugar.py`, `expansion_mesa.py`, `marcos.py`). Expected: todo pasa y no hay errores en la consola.
- [ ] **Step 2: Commit** y publicación en la vista previa con `publish_files`, comprobando antes con `get_artifact` que siga privada.

## Rulings sobre la especificación

- El spec proponía `data/colecciones.json` y guardar las fuerzas en el estado de la partida. El plan usa un registro en código (`js/colecciones.js`) que el motor importa de forma síncrona, y une las ventajas en un solo mapa. Las claves no se repiten y los mazos no se mezclan, así que no cambia nada para el jugador, las partidas guardadas siguen sirviendo y la segunda expansión solo agrega una entrada al registro y sus datos. Costo si es un error: si algún día se quisiera mezclar colecciones con claves repetidas, habría que mover las ventajas al estado.
- Los duelos de la expansión van dentro de `data/exp-fin-del-mundo.json` y no en `data/duelos.json`. Así el Torneo, que quedó fuera de esta versión, no los ve, y las pruebas de los cursos no cambian.
