# Cronocartas v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Búsqueda visible con elección, editor docente de cartas con imágenes y nuevo diseño de carta estilo TCG.
**Architecture:** Igual que v1. Motor puro con una nueva jugada (`jugar` con `eleccion`). Nuevo módulo puro `js/ediciones.js` (aplicar y sanear ediciones) más un contenedor de IndexedDB para imágenes. La UI se rehace en `carta.js` y CSS.
**Tech Stack:** JS vanilla, `node --test`, Chrome/playwright para verificar.
**Spec:** `docs/diseno.md` §12

## Global Constraints
- Todo texto de carta pasa por `esc()` (la prueba de lint ya lo exige).
- Imágenes docentes: JPEG ≤ 640×480. Imágenes importadas: solo `data:image/(jpeg|png|webp);base64,`.
- Una edición aplicada debe pasar `validarCarta`; si no, se ignora.
- `sw.js` debe listar todos los archivos (la prueba lo exige).

## Review Focus
1. Mazo con menos de 3 cartas al jugar una búsqueda: muestra las que haya y no se bloquea (prueba en Task 1).
2. Archivo de ediciones dañado o de otra app: error claro y sin cambios (prueba en Task 2).
3. Edición que deja la carta inválida (por ejemplo, resistencia 500): se ignora al cargar (prueba en Task 2).
4. Sin IndexedDB disponible: el editor guarda los textos y avisa que las imágenes no se pueden guardar (Task 3, manual).
5. Nombres largos en el nuevo diseño: la carta no se desarma en mini ni en grande (Task 4, captura).

### Task 1: Búsqueda con elección (motor + IA)
Files: `js/motor.js`, `js/ia.js`, `tests/motor.test.js`.
- Para un efecto `buscarProtagonista`, `jugadasValidas` produce una jugada `{tipo:'jugar', uid, eleccion}` por cada Protagonista entre las primeras n cartas del mazo, o solo `{tipo:'jugar', uid}` si no hay ninguno. `mismaJugada` compara `eleccion`.
- `aplicarJugada` toma la carta elegida y manda el resto al fondo, en orden. Emite el evento `{tipo:'revelar', jugador, cartas, tomada}`.
- Pruebas: elegir el segundo Protagonista; sin Protagonistas, todas al fondo; mazo con 2 cartas; la IA elige el de mayor valor.

### Task 2: Ediciones (puro)
Files: `js/ediciones.js`, `tests/ediciones.test.js`.
- `CAMPOS_EDITABLES`.
- `aplicarEdiciones(cartas, ediciones, imagenes) -> cartas`: no muta y descarta las ediciones que dejan la carta inválida.
- `sanearPaquete(json) -> {ediciones, imagenes, errores}`.
- `crearPaquete(ediciones, imagenes) -> objeto`.
- `comprimir` queda en la UI.

### Task 3: Editor docente + IndexedDB + carga
Files: `js/imagenes.js` (IDB: `guardarImagen`, `leerImagenes`, `borrarImagen`, sin IDB devuelve `{ok:false}`), `js/mazos.js` (`cargarCurso` aplica ediciones e imágenes), `js/ui/docente.js` (pestaña Editar cartas, exportar e importar archivo), `js/almacen.js` (clave `cc.ediciones`).

### Task 4: Diseño TCG + elección en pantalla
Files: `js/ui/carta.js`, `js/ui/arte.js` (íconos de dimensión), `css/estilos.css`, `js/ui/mesa.js` (ventana para elegir carta y evento revelar).

### Task 5: Verificación y publicación
`sw.js` (lista y VERSION `cc-v2`), playwright (Planificación, editor, imagen, export/import, capturas), copia privada actualizada.
