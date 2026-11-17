# Cronocartas — Diseño del juego de cartas de Historia (5° a 8° básico)

*Versión 1 del diseño · 17 nov 2026 · Escuela Gabriela Mistral, Mostazal*
*"Cronocartas" es un nombre provisorio: se puede cambiar.*

---

## 1. Para qué es

Un juego de cartas digital de Historia, Geografía y Ciencias Sociales para tablets, con la mecánica de los juegos de cartas coleccionables (Pokémon TCG, Duel Links).

- **Cuándo se usa:** como alternativa en el **día de juegos de SIUBank** y en cualquier momento recreativo.
- **Para qué sirve:** es pedagógico porque cada carta trae contenido real de las unidades. Se aprende jugando, no respondiendo un cuestionario.
- **Cuándo se prueba:** en las últimas semanas del año escolar 2026.
- **Cómo debe crecer:** se irán sumando mejoras de a poco, así que todo se construye pensando en ellas.

**Qué significa que funcione:** los estudiantes eligen jugarlo en el día de juegos, una partida cabe en 10 a 15 minutos, al terminar saben algo más de la unidad que antes, y tú puedes mostrar a qué objetivos de aprendizaje y a qué dominios del MBE responde.

## 2. Qué incluye y qué no

**Incluye en la versión 1:**
- Un **mazo general por curso** (5°, 6°, 7° y 8°), armado con las temáticas de sus unidades.
- **Dos modos de partida:** 1 contra 1 en la misma tablet, cara a cara, y 1 contra la tablet.
- **Cartas "Aula"** inspiradas en los estándares del MBE, que funcionan como cartas de apoyo.
- Un **banco de ideas** donde los estudiantes crean sus propias cartas y tú las apruebas.
- Un **panel docente**, protegido con PIN, que muestra los objetivos de aprendizaje y el MBE de cada mazo, y desde donde apruebas las cartas.
- Funciona **sin internet** una vez instalado en la tablet.

**No incluye en la versión 1 (queda preparado para después):**
- Preguntas y respuestas como mecánica central. Por ahora habrá, como mucho, un "¿Sabías que…?".
- Partidas entre dos tablets y banco de ideas compartido en línea.
- Cartas físicas con QR.
- Premios en SIU.

**Lo que haría que fracase aunque funcione técnicamente:**
- Que se sienta como una prueba disfrazada de juego.
- Que copie personajes, nombres, logos o diseños de Pokémon o Yu-Gi-Oh (solo se toma la *mecánica*).
- Que exija cuentas, internet en la sala o datos de los estudiantes fuera de la tablet.
- Que una partida dure más que un bloque de juego.
- Que una carta enseñe un dato histórico incorrecto.

## 3. Restricciones

- **Tablets:** no sabemos aún si son Android o iPad, así que debe funcionar en ambas, en Chrome y en Safari, y en vertical y horizontal (el modo cara a cara usa horizontal).
- **Público:** estudiantes de 10 a 14 años. Textos cortos y lectura fácil, sin perder el rigor.
- **Contenido:** solo lo que dicen las Bases Curriculares de 1° a 6° (2012) y de 7° a II° medio (2015), y el MBE 2021.
- **Imágenes:** ilustraciones e íconos originales. No se usan fotos de internet ni retratos de personas reales; los personajes históricos van como emblemas o siluetas originales.
- **Diseño visual:** menos cajas y menos bordes, jerarquía clara, espacio en blanco y animaciones que sirvan a la jugada, no de adorno.
- **Sin servidor propio:** la versión 1 vive en GitHub Pages, que es gratis.

## 4. Caminos considerados

| Camino | Qué ganas | Qué cuesta | Decisión |
|---|---|---|---|
| **1. Página en cada tablet, sin internet** | Lista antes, sin cuentas ni wifi y sin riesgo el día de juegos | Sin partidas entre tablets; el banco no se junta solo | **Elegido** |
| 2. Página de Claude con base y sala en vivo | Partidas entre tablets y banco central | Cada tablet necesita una sesión de Claude (mayor de 18), así que quedaría tu cuenta abierta en tablets de estudiantes; depende de internet | Queda como mejora futura, solo con cuenta del colegio |
| 3. Dentro de SIUBank, servido desde tu PC por el hotspot | Banco central, red local, premios SIU | Lo más trabajoso; depende de tu PC y del hotspot; sin cámara en vivo | Posible mejora futura |

**Cómo llega a las tablets (elegido):** se publica gratis en **GitHub Pages** (`<usuario>.github.io/cronocartas`). Cada tablet abre el enlace una vez y lo agrega a la pantalla de inicio. Desde ahí funciona sin internet y se actualiza solo cuando hay conexión.

Descartados: servirlo desde el PC por el hotspot (depende del PC y no permite instalarlo) y copiar el archivo a mano (cada mejora obliga a copiarlo de nuevo en cada tablet).

**El MBE (elegido B, que incluye A):** el MBE está dentro del juego, como cartas "Aula", y además en el panel docente, como respaldo pedagógico.

## 5. El juego

### 5.1 Tipos de carta

| Tipo | Equivale en Pokémon TCG a | Qué es en Historia | Ejemplo (7°) |
|---|---|---|---|
| **Protagonista** | Criatura | Persona, pueblo, civilización o grupo social | *Ciudadano ateniense*, *Legión romana*, *Pueblo maya* |
| **Protagonista Etapa 2** | Evolución | La misma figura después de un cambio histórico | *Aldea neolítica* → **Ciudad-Estado** |
| **Acontecimiento** | Objeto o entrenador | Hecho, invento o proceso puntual, de un solo uso | *Invención de la escritura*: robas 2 cartas |
| **Lugar** | Estadio | Espacio geográfico que cambia la mesa mientras está en juego | *Mar Mediterráneo*: los Protagonistas de Economía hacen +10 |
| **Aula** | Apoyo especial | Una práctica de buena enseñanza del MBE | *Retroalimentación* (Estándar 9): recupera 30 de resistencia |

Las cartas Etapa 2 enseñan **continuidad y cambio**, una habilidad que aparece en los cuatro niveles: evolucionar a una carta es vivir el proceso histórico.

### 5.2 Dimensiones (los "tipos elementales")

Cada Protagonista pertenece a una dimensión del análisis histórico, con su color y su ícono:

**Política** · **Economía** · **Sociedad** · **Cultura** · **Territorio**

Hay un ciclo de ventajas, en que cada dimensión es fuerte contra la siguiente y hace el doble de daño:
Política → Economía → Sociedad → Cultura → Territorio → Política.

Cada ventaja tiene una frase corta que se muestra en la partida, por ejemplo: "Las decisiones políticas reordenan la economía". *El ciclo exacto y sus frases son propuesta mía: los revisaremos juntos al ver las cartas.*

### 5.3 Anatomía de una carta Protagonista

- Nombre, dimensión y unidad (por ejemplo, "7° · Unidad 2 · La Antigüedad clásica").
- **Resistencia** (equivale a los puntos de vida): entre 50 y 120.
- **1 o 2 acciones**, cada una con nombre, costo en **Saber** (de 1 a 3) y daño o efecto.
- **Debilidad**, que se deduce de su dimensión.
- **Dato**: una o dos frases reales sobre la carta, tomadas de la unidad.
- Código único para el QR futuro, por ejemplo `CC-7-U2-014`, y objetivo de aprendizaje de referencia, por ejemplo "OA 6 (7°)".

### 5.4 Cómo se juega una partida (10 a 15 minutos)

1. Cada jugador baraja su mazo de **20 cartas** y roba **5**.
2. Pone **1 Protagonista activo** y hasta **3 en reserva**.
3. En su turno, el jugador:
   - roba 1 carta;
   - recibe **1 de Saber** y se lo asigna a uno de sus Protagonistas (no hay cartas de energía, para que la partida sea simple y rápida);
   - puede bajar Protagonistas, evolucionar uno, jugar Acontecimientos, cambiar el Lugar o jugar **1 carta Aula por turno**;
   - puede retirar al activo, pagando Saber;
   - termina con una acción del activo.
4. Cuando la resistencia de un Protagonista llega a 0, ese Protagonista cae. El rival gana **1 Hito** y aparece el "¿Sabías que…?" de la carta caída.
5. **Gana quien consigue 3 Hitos** o deja al rival sin Protagonistas.

La tablet lleva todas las cuentas. Los estudiantes solo deciden.

### 5.5 Modos

- **Cara a cara (en la misma tablet):** pantalla horizontal dividida; cada mitad mira hacia su jugador. La mano del rival se ve boca abajo.
- **Contra la tablet:** un rival automático simple que juega siempre su mejor ataque disponible y baja cartas cuando puede. Sirve para practicar solo y para enseñar las reglas.
- **Tutorial:** una partida guiada de 3 turnos.

En la versión 1, cada jugador elige el mazo de su curso. Cruzar mazos entre cursos (por ejemplo, 7° contra 8°) queda permitido como opción.

## 6. Mazos (4 unidades por curso, unas 6 cartas por unidad, más las cartas Aula)

La organización en unidades sigue los ejes y organizadores temáticos de las Bases.

- **5° básico:** el agrupamiento de 5° y 6° en unidades lo propongo yo a partir de los ejes, porque las Bases no traen unidades. Corrígelo si en tu planificación es distinto.
  1. Viajes de descubrimiento y conquista de América y Chile (OA 1–4)
  2. La Colonia en Chile (OA 5–8)
  3. Zonas naturales de Chile, recursos y riesgos (OA 9–12)
  4. Derechos, deberes y participación (OA 13–19)
- **6° básico:**
  1. Independencia de Chile y de América (OA 1–2)
  2. La República en el siglo XIX: organización, cultura, territorio y salitre (OA 3–6)
  3. El siglo XX: democratización, quiebre y recuperación de la democracia (OA 7–9)
  4. Chile, sus regiones y la organización democrática (OA 10–19)
- **7° básico:**
  1. De la hominización a las primeras civilizaciones (OA 1–4)
  2. La Antigüedad y el canon cultural clásico: Grecia y Roma (OA 5–8 y 17–18)
  3. La Edad Media y el nacimiento de la civilización europea (OA 9–12 y 19–20)
  4. Civilizaciones americanas: maya, azteca e inca (OA 13–16 y 21–23)
- **8° básico:**
  1. Humanismo, Reforma y Estado moderno (OA 1–4)
  2. El choque de dos mundos y la sociedad colonial (OA 5–13 y 17)
  3. Ilustración, revolución e independencia (OA 14–16 y 18–19)
  4. Sociedad y territorio: la región en Chile y América (OA 20 en adelante)

**Temas delicados (6°, Unidad 3):** el quiebre de la democracia y la dictadura se tratarán con el enfoque de las Bases, "comparar diferentes visiones". Las cartas serán de *procesos* y *valores democráticos* (por ejemplo, *Voto femenino* o *Recuperación de la democracia*), no de figuras políticas que se enfrentan entre sí. Ninguna carta pone a "pelear" a víctimas ni a actores reales de la dictadura.

### Cartas Aula (MBE 2021), comunes a todos los mazos

Hay una carta por estándar en el que tiene sentido. Cada una indica su dominio y estándar:

- *Planificación* (A, Estándar 3): mira las 3 primeras cartas de tu mazo y ordénalas.
- *Ambiente respetuoso* (B, Estándar 5): tu activo no recibe daño en el próximo turno.
- *Desarrollo personal y social* (B, Estándar 6): pasa 1 de Saber de un Protagonista a otro.
- *Aprendizaje profundo* (C, Estándar 7): la próxima acción hace +20.
- *Pensamiento crítico* (C, Estándar 8): anula el Lugar en juego.
- *Retroalimentación* (C, Estándar 9): recupera 30 de resistencia.
- *Trabajo colaborativo* (D, Estándar 12): roba 1 carta por cada Protagonista en tu reserva.

Cada mazo lleva hasta 2 cartas Aula.

**Cómo se arma cada partida (mi decisión):** cada curso tiene unas 26 cartas en total. Para cada partida se arma automáticamente un mazo equilibrado de 20: unos 12 Protagonistas (con sus Etapas 2), 4 Acontecimientos, 2 Lugares y 2 cartas Aula, mezclando las 4 unidades.

## 7. Banco de ideas

- El estudiante completa un formulario guiado: nombre de la carta, curso y unidad, tipo, dimensión, **dato histórico (obligatorio)** y fuente ("¿Dónde lo aprendiste?").
- Puede agregar un dibujo: sacarle una foto a su dibujo en papel o dibujar directo en la tablet. Esto conecta con el taller de cómic y manga.
- **Equilibrio:** la resistencia y el daño se reparten con un "presupuesto de poder". Si sube el daño, baja la resistencia. Así nadie crea una carta invencible.
- Vista previa en vivo de cómo queda la carta.
- Al enviarla, queda **pendiente** en esa tablet. En el panel docente tú la **apruebas** (y puedes editar el dato), la **devuelves con comentario** o la **descartas**.
- Las cartas aprobadas pasan a una sección **"Cartas de la comunidad"** del curso, y se pueden sumar al mazo con un interruptor.
- Para mover cartas entre tablets en la versión 1: **Exportar** genera un código de texto que se copia, y en otra tablet se usa **Importar** pegando ese código. Más adelante esto se hará con QR o con el banco en línea.

## 8. Panel docente (con PIN)

- Ver cada mazo con su cobertura: qué objetivos de aprendizaje toca cada carta y qué unidades faltan.
- Ver las cartas Aula con su dominio y estándar del MBE, como respaldo para UTP o dirección.
- Aprobar el banco de ideas.
- Ajustes: duración de la partida (3 o 2 Hitos), mazos cruzados sí o no, y activar o desactivar el "¿Sabías que…?".

## 9. Cómo está construido (para que crezca)

- **Contenido separado del código:** cada mazo es un archivo de datos (`data/mazo-7.json`). Agregar o corregir una carta no requiere programar.
- **Reglas separadas de la pantalla:** el motor del juego recibe una jugada y devuelve el nuevo estado de la partida, sin saber nada de la pantalla. Esto permite después enviar las jugadas a otra tablet (partidas en línea) sin rehacer el juego.
- **Códigos únicos por carta:** listos para el QR. Escanear solo será otra forma de decir "esta carta".
- **App instalable sin internet:** manifiesto y caché fuera de línea, publicada en GitHub Pages.
- **Datos guardados en la tablet:** el banco de ideas, los ajustes y la partida en curso (si se cierra la app, se retoma).
- Sin dependencias externas y sin paso de compilación: HTML, CSS y JavaScript simples que tu hermano o cualquier informático puede leer.

**Mejoras futuras previstas, en orden sugerido:**
1. Preguntas opcionales (por ejemplo, responder bien da +1 de Saber).
2. Cartas físicas con QR que se escanean para jugar.
3. Banco de ideas y partidas en línea.
4. Premios en SIU desde SIUBank.
5. Más cartas por unidad y mazos armados por cada estudiante.

## 10. Lo que queda a criterio de quien lo construye

- El texto exacto de cada carta, la resistencia y el daño, dentro de los rangos y fiel a las Bases.
- El estilo de las ilustraciones originales.
- El comportamiento fino del rival automático.
- Los detalles visuales, siguiendo las preferencias de diseño del punto 3.

## 11. Mis decisiones, para que las revises

- El nombre **Cronocartas**.
- El ciclo de 5 dimensiones y sus ventajas.
- **Saber automático** (1 por turno, sin cartas de energía).
- Mazos de 20 cartas, mano inicial de 5 y victoria con 3 Hitos.
- El agrupamiento en unidades de 5° y 6°.
- Las cartas Aula y sus efectos.
- PIN docente en vez de cuentas.
- Exportar e importar con código de texto en la versión 1.
