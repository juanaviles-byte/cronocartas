# Cronocartas v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Juego de cartas de Historia (5°–8°) jugable sin internet en tablets Android, con mazos por curso, cartas Aula (MBE), banco de ideas y panel docente, publicado como app instalable en GitHub Pages.

**Architecture:** Motor de reglas puro (estado → jugada → nuevo estado + eventos) sin DOM, consumido por una UI en JS vanilla con módulos ES. Contenido en JSON por curso. PWA con service worker para uso offline. Persistencia local en `localStorage` detrás de un módulo único.

**Tech Stack:** HTML/CSS/JS (ES modules, sin build ni dependencias), `node --test` para pruebas del motor y datos, GitHub Pages.

**Spec:** `docs/diseno.md`

## Global Constraints

- Sin dependencias externas ni CDN: todo el código y la tipografía del sistema van en el repo (offline).
- Funciona en Chrome Android (tablets ~8–10"), vertical y horizontal; cara a cara exige horizontal.
- Textos para 10–14 años: Dato ≤ 220 caracteres, nombres de acción ≤ 22.
- Arte 100% original (SVG generado); sin nombres, logos ni criaturas de Pokémon/Yu-Gi-Oh; sin fotos ni retratos de personas reales.
- Contenido fiel a Bases Curriculares 2012 (1°–6°) y 2015 (7°–II°), y MBE 2021; cada carta referencia su OA.
- Diseño: menos cajas y bordes, jerarquía fuerte, espacio negativo, animación solo funcional.
- 6° U3: cartas de procesos y valores democráticos, sin figuras reales enfrentadas.
- Valores de juego: mazo 20 cartas (12 Protagonistas, 4 Acontecimientos, 2 Lugares, 2 Aula), mano inicial 5, +1 Saber por turno, 1 carta Aula por turno, victoria a 3 Hitos (ajustable a 2), resistencia 50–120, costo de acción 1–3.
- Ciclo de ventaja (×2 daño): Política→Economía→Sociedad→Cultura→Territorio→Política.
- Interfaz en español de Chile.

## Review Focus

1. Tablet Android de 8" en horizontal: la mesa cara a cara cabe sin scroll y los toques tienen ≥ 44 px → prueba manual en viewport 1280×800 y 1024×600 (Task 6).
2. `localStorage` lleno o bloqueado (dibujos de estudiantes): imágenes comprimidas a ≤ 480 px JPEG y error de cuota mostrado sin perder la propuesta → test en Task 3.
3. JSON de mazo con errores (evolución a id inexistente, dimensión mal escrita): se detecta antes de jugar → test que valida todos los mazos reales en Task 5.
4. App cerrada a mitad de partida: el estado se guarda y se retoma → test de ida y vuelta JSON del estado en Task 1.
5. Código de importación corrupto o editado a mano: devuelve errores, nunca lanza → test en Task 3.

---

## File Structure

```
index.html                 shell + vistas
manifest.webmanifest, sw.js, icons/icon-192.png, icons/icon-512.png, icons/icon.svg
css/estilos.css
js/rng.js                  PRNG con semilla
js/motor.js                reglas (puro)
js/ia.js                   rival automático
js/mazos.js                carga, validación y armado de mazos
js/balance.js              presupuesto de poder (banco de ideas)
js/almacen.js              localStorage seguro + banco de ideas + partida guardada
js/compartir.js            exportar/importar código "CC1:"
js/ui/app.js               router por hash: #inicio #jugar #mesa #banco #docente #mazos #tutorial
js/ui/arte.js              ilustración SVG original por carta
js/ui/carta.js             render de carta
js/ui/mesa.js              mesa de juego (cara a cara / vs tablet / tutorial)
js/ui/banco.js             formulario + vista previa + dibujo
js/ui/docente.js           PIN, cobertura OA/MBE, aprobaciones, ajustes
data/mazo-5.json … data/mazo-8.json, data/aula.json
tests/*.test.js
```

---

### Task 1: Motor de reglas

**Files:** Create `js/rng.js`, `js/motor.js`; Test `tests/motor.test.js`

**Interfaces:**
- Produces:
  - `crearRng(semilla:number) -> {siguiente():number /*[0,1)*/, estado:number}`; `rngDesdeEstado(n)`.
  - Carta (shape JSON): `{id, nombre, tipo:'protagonista'|'acontecimiento'|'lugar'|'aula', curso, unidad, dimension?, resistencia?, retirada?, evolucionaDe?, acciones?:[{nombre,costo,danio,efecto?}], efecto?, dato, oa, mbe?, emblema}`.
  - Efectos: `{tipo:'robar',n}`, `{tipo:'curar',n}`, `{tipo:'proteger'}`, `{tipo:'bonusDanio',n}`, `{tipo:'moverSaber'}`, `{tipo:'anularLugar'}`, `{tipo:'robarPorReserva'}`, `{tipo:'buscarProtagonista',n:3}`, lugar: `{tipo:'bonusDimension',dimension,n}`.
  - `crearPartida({mazoA:Carta[], mazoB:Carta[], semilla:number, hitosParaGanar?:number=3}) -> Estado` (baraja, roba 5, reparte de nuevo si no hay Protagonista base; fase `'preparacion'`).
  - `jugadasValidas(estado) -> Jugada[]` (siempre incluye `{tipo:'pasar'}` en fase `'turno'`).
  - `aplicarJugada(estado, jugada) -> {estado, eventos:Evento[]}` puro (no muta la entrada); lanza `Error('jugada inválida')` si no está en `jugadasValidas`.
  - Jugadas: `colocar{uid}`, `listo`, `bajar{uid}`, `asignarSaber{destino}`, `evolucionar{uid,objetivo}`, `jugar{uid}` (acontecimiento/lugar/aula), `retirar{reemplazo}`, `accion{indice}`, `promover{uid}`, `pasar`.
  - Estado: `{fase:'preparacion'|'turno'|'promover'|'fin', turno:'A'|'B', numeroTurno, jugadores:{A,B}, lugar, ganador, hitosParaGanar, rng}`; jugador `{mazo,mano,activo,reserva(max 3),descarte,hitos,saberPendiente,aulaUsada,listo}`; instancia en mesa `{uid,carta,danio,saber,protegido,bonus,turnoEntrada}`.
  - Eventos: `{tipo:'robo'|'danio'|'ventaja'|'caida'|'hito'|'evolucion'|'efecto'|'turno'|'fin', ...}`; `caida` incluye `carta` (para el "¿Sabías que…?").

- [ ] **Step 1: Write failing tests** (`node:test` + `assert/strict`), with tiny fixture decks:
  - `crearPartida reparte 5 cartas con al menos un protagonista base a cada jugador`
  - `misma semilla produce la misma partida` (deepEqual)
  - `aplicarJugada no muta el estado de entrada`
  - `ventaja: Política contra Economía hace el doble` (acción danio 30 → evento `danio` con valor 60 y evento `ventaja`)
  - `lugar bonusDimension suma n a la dimensión indicada`; `anularLugar deja lugar en null`
  - `proteger anula el daño del siguiente ataque rival y se consume`
  - `caída da 1 hito al atacante y obliga a promover si hay reserva`; `sin reserva el atacante gana`
  - `3 hitos terminan la partida` y `hitosParaGanar:2 termina con 2`
  - `el primer jugador no puede usar acción en su primer turno`
  - `solo 1 carta aula por turno`; `solo 1 asignarSaber por turno`; `acción requiere saber ≥ costo`
  - `evolucionar conserva danio y saber y exige evolucionaDe === carta.id del objetivo`; no se evoluciona en el turno de entrada
  - `retirar exige saber ≥ retirada y reserva no vacía`
  - `mazo vacío: no roba y la partida continúa`
  - `JSON.parse(JSON.stringify(estado)) sigue siendo jugable` (Review Focus 4)
- [ ] **Step 2:** `node --test tests/motor.test.js` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implement `js/rng.js` (mulberry32) y `js/motor.js`. Daño final = `(danio + bonusLugar + bonusAula) × (ventaja ? 2 : 1)`, 0 si protegido. Fin de turno tras `accion` o `pasar`: limpia `aulaUsada`, cambia turno, roba 1, `saberPendiente = 1`.
- [ ] **Step 4:** `node --test tests/motor.test.js` → PASS.
- [ ] **Step 5:** `git commit -m "feat: motor de reglas de Cronocartas"`

### Task 2: Rival automático

**Files:** Create `js/ia.js`; Test `tests/ia.test.js`

**Interfaces:** Consumes Task 1. Produces `elegirJugada(estado, jugador:'A'|'B') -> Jugada` (determinista dado el estado).

- [ ] **Step 1: Failing tests:** `ia siempre devuelve una jugada válida`; `200 partidas IA vs IA con semillas 1..200 terminan con ganador en < 400 jugadas` (usa los mazos de prueba de Task 1 y luego, en Task 5, los reales).
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Prioridad: preparar (colocar protagonista de mayor resistencia, luego reserva, `listo`) → bajar base → evolucionar → asignar saber al activo → jugar lugar favorable → aula/acontecimiento si hay efecto útil → acción de mayor daño pagable → `pasar`.
- [ ] **Step 4:** run → PASS. **Step 5:** commit.

### Task 3: Persistencia, balance y compartir

**Files:** Create `js/almacen.js`, `js/balance.js`, `js/compartir.js`; Test `tests/banco.test.js`

**Interfaces:**
- `almacen`: `leer(clave, defecto)`, `guardar(clave, valor) -> {ok:boolean, error?:'cuota'|'bloqueado'}`; claves `cc.banco`, `cc.ajustes`, `cc.partida`, `cc.pin`. Banco: `listarPropuestas(filtro?) -> Propuesta[]`, `guardarPropuesta(p) -> {ok,error?}`, `cambiarEstado(id, 'pendiente'|'aprobada'|'devuelta'|'descartada', comentario?)`, `cartasComunidad(curso) -> Carta[]` (aprobadas y activadas). Propuesta = Carta + `{autor, fuente, imagen?:dataURL, estado, comentario, creada, enMazo:boolean}`. Toma un `storage` inyectable para pruebas.
- `balance`: `PRESUPUESTO = 14`; `puntosPoder(carta) = resistencia/10 + Σ max(0, danio/10 − costo)`; `validarPropuesta(p) -> string[]` (dato obligatorio ≥ 20 caracteres, fuente obligatoria, puntos ≤ 14, rangos del Global Constraints).
- `compartir`: `exportarCartas(cartas) -> string` (`"CC1:" + base64(UTF-8 JSON)`, sin imágenes > 60 KB); `importarCartas(texto) -> {cartas:Carta[], errores:string[]}`, nunca lanza.

- [ ] **Step 1: Failing tests:** `guardar devuelve {ok:false,error:'cuota'} cuando setItem lanza QuotaExceededError` (Review Focus 2); `storage que lanza en getItem → leer devuelve defecto`; `puntosPoder({resistencia:80, acciones:[{costo:2,danio:60}]}) === 12`; `propuesta sin dato es inválida`; `export→import ida y vuelta conserva tildes y ñ`; `importarCartas('basura')`, `'CC1:%%%'` y JSON válido sin campos → errores, sin lanzar (Review Focus 5).
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run → PASS. **Step 5:** commit.

### Task 4: Contenido — mazos por curso y cartas Aula

**Files:** Create `data/mazo-5.json`, `data/mazo-6.json`, `data/mazo-7.json`, `data/mazo-8.json`, `data/aula.json`

**Interfaces:** Produces arrays de Carta (shape de Task 1). Ids `CC-<curso>-U<n>-<nnn>`; Aula `CC-A-E<estándar>`.

- [ ] **Step 1:** Por curso, 24 cartas: por unidad (las 4 del spec §6) ~4 Protagonistas (≥1 par base→Etapa 2 por curso en al menos 2 unidades), 1 Acontecimiento y, en dos unidades, 1 Lugar; totales por curso ≥ 14 Protagonistas, ≥ 5 Acontecimientos, ≥ 3 Lugares. Dato y OA de cada carta tomados de las Bases (`/mnt/user-data/uploads/*Bases*`).
- [ ] **Step 2:** `data/aula.json` con las 7 cartas del spec §6 (efectos: Planificación→`buscarProtagonista n:3`, Ambiente respetuoso→`proteger`, Desarrollo personal y social→`moverSaber`, Aprendizaje profundo→`bonusDanio n:20`, Pensamiento crítico→`anularLugar`, Retroalimentación→`curar n:30`, Trabajo colaborativo→`robarPorReserva`), con `mbe:{dominio, estandar, nombre}`.
- [ ] **Step 3:** Revisión de exactitud: cada Dato contrastado con las Bases o con hechos históricos establecidos; 6° U3 según Global Constraints.
- [ ] **Step 4:** commit.

### Task 5: Carga, validación y armado de mazos

**Files:** Create `js/mazos.js`; Test `tests/mazos.test.js`

**Interfaces:** Consumes Task 1, 3, 4. Produces `validarCarta(carta) -> string[]`, `validarMazo(cartas) -> string[]` (ids únicos, `evolucionaDe` existente, dimensión válida), `armarMazo(cartas:Carta[], aula:Carta[], rng) -> Carta[20]` (12/4/2/2; si incluye una Etapa 2 incluye su base; completa con base si faltan), `cargarCurso(curso) -> Promise<{cartas, aula}>` (fetch de `data/`, suma `cartasComunidad(curso)`).

- [ ] **Step 1: Failing tests:** `los 4 mazos reales y aula.json pasan validarMazo sin errores` (Review Focus 3); `validarMazo detecta evolucionaDe inexistente`; `armarMazo devuelve 20 con la proporción 12/4/2/2`; `toda Etapa 2 en el mazo armado tiene su base`; `200 partidas IA vs IA por curso con mazos reales terminan` (reusa test de Task 2).
- [ ] **Step 2:** run → FAIL. **Step 3:** implement (lee JSON con `fs` en tests). **Step 4:** run → PASS. **Step 5:** commit.

### Task 6: Interfaz — carta, arte y mesa

**Files:** Create `index.html`, `css/estilos.css`, `js/ui/app.js`, `js/ui/arte.js`, `js/ui/carta.js`, `js/ui/mesa.js`

**Interfaces:** Consumes Tasks 1–5. Produces `arteCarta(carta) -> string` (SVG con emblema y color de dimensión), `renderCarta(carta, {tamano:'mini'|'normal'|'grande', instancia?}) -> HTMLElement`, `montarMesa(contenedor, {modo:'caraacara'|'ia'|'tutorial', cursoA, cursoB, semilla}) -> {destruir()}`.

- [ ] **Step 1:** Inicio: elegir curso(s) y modo; botones grandes. Mesa cara a cara: mitad superior rotada 180°, mano propia visible, mano rival boca abajo; resaltar jugadas válidas; toque en carta → detalle grande con Dato y OA.
- [ ] **Step 2:** Eventos animados con propósito (daño, ventaja con su frase, caída → "¿Sabías que…?" con el Dato, hito ganado, indicador de turno en la mitad del jugador activo). En modo IA, la tablet juega con 600 ms entre jugadas.
- [ ] **Step 3:** Guardar `cc.partida` tras cada jugada; al abrir, ofrecer "Continuar partida" (Review Focus 4).
- [ ] **Step 4:** Tutorial guiado de 3 turnos con mazo fijo y semilla fija.
- [ ] **Step 5: Verify:** servir con `python3 -m http.server` y revisar con capturas en 1280×800 y 1024×600 (horizontal) y 800×1280 (vertical): sin scroll en mesa, toques ≥ 44 px, sin errores de consola, partida completa vs IA jugable (Review Focus 1).
- [ ] **Step 6:** commit.

### Task 7: Banco de ideas y panel docente

**Files:** Create `js/ui/banco.js`, `js/ui/docente.js`; Modify `js/ui/app.js` (rutas)

**Interfaces:** Consumes Tasks 3, 5, 6.

- [ ] **Step 1:** Banco: formulario guiado por pasos (curso → unidad → tipo → dimensión → nombre → acciones con barra de "poder" contra `PRESUPUESTO` → dato y fuente → imagen), vista previa en vivo con `renderCarta`, imagen por `<input type=file accept=image/* capture=environment>` o lienzo para dibujar; redimensionar a ≤ 480 px JPEG 0.8 antes de guardar; mostrar error de cuota sin perder el borrador.
- [ ] **Step 2:** Docente: crear PIN de 4 dígitos la primera vez; cobertura por curso (OA por unidad, cartas por tipo), MBE de cartas Aula, lista de propuestas con aprobar/editar dato/devolver con comentario/descartar, interruptor `enMazo`, exportar/importar código con botón Copiar, ajustes (`hitosParaGanar` 2|3, mazos cruzados, ¿Sabías que…?).
- [ ] **Step 3: Verify:** crear propuesta → aprobar → aparece en "Cartas de la comunidad" y entra a `armarMazo`; export en un perfil limpio e import la restaura.
- [ ] **Step 4:** commit.

### Task 8: App instalable offline y publicación

**Files:** Create `manifest.webmanifest`, `sw.js`, `icons/*`, `README.md`

- [ ] **Step 1:** Manifest (`display: standalone`, `orientation: any`, colores del tema, íconos 192/512 PNG). `sw.js` con lista versionada de todos los archivos (`cc-v1`), cache-first y limpieza de versiones viejas; registro en `app.js`.
- [ ] **Step 2: Verify:** con el servidor local, cargar, cortar el servidor, recargar → la app abre y se puede jugar.
- [ ] **Step 3:** README con: cómo instalar en Android ("Agregar a pantalla principal"), cómo editar un mazo JSON, y la lista de mejoras futuras del spec §9.
- [ ] **Step 4:** Crear repo `cronocartas` en la cuenta GitHub del docente, subir, pedirle activar Pages (Settings → Pages → rama `main`), comprobar la URL pública.
