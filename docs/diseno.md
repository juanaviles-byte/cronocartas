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
6. **Versión nativa en Unity** (app Android propia, con animaciones, sonido y partidas en línea mediante Unity Multiplayer Services). El motor se traduce a C# y reusa los mismos mazos JSON. Las pruebas del motor actual sirven para comprobar que la versión de Unity juega igual. Unreal Engine se descartó por ser demasiado pesado para un juego 2D en tablets escolares.

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

---

## 12. Versión 1.1 (aprobada el 17 nov 2026)

1. **Planificación y búsquedas visibles.** Las cartas con el efecto "buscar Protagonista" (Planificación, Fundación de ciudades, Quipu) muestran las 3 primeras cartas del mazo. El jugador elige qué Protagonista tomar y el resto va al fondo del mazo. Si no hay ninguno, las ve igual y vuelven al fondo. El rival automático toma el de mayor valor.
2. **Editor de cartas (solo docente, con PIN).** Es una pestaña "Editar cartas" en el panel.
   - Se puede cambiar el nombre, el dato, la resistencia, las acciones y el emblema de cualquier carta oficial o Aula, y subirle una imagen.
   - Los textos se guardan en la tablet. Las imágenes van en el almacenamiento grande de la tablet (IndexedDB), reducidas a 640×480 JPEG.
   - "Restaurar original" deshace la edición.
   - **Exportar ediciones** descarga un archivo `.json` (con imágenes) e **Importar ediciones** lo carga en otra tablet. Al importar se aceptan solo campos conocidos y valores válidos.
   - En el futuro, las imágenes se pueden integrar al repositorio (campo `imagen` en el JSON del mazo).
3. **Diseño de carta inspirado en el TCG de Pokémon.**
   - **Marco de color completo según el tipo:** Política roja, Economía dorada, Sociedad azul, Cultura morada, Territorio verde. Los Acontecimientos van en gris pizarra, los Lugares en turquesa y las cartas Aula en azul marino con dorado.
   - **Estructura:**
     - nombre arriba y resistencia con el ícono de la dimensión;
     - ventana de ilustración 4:3;
     - acciones con íconos de Saber;
     - debilidad (×2) y retirada;
     - dato en un recuadro aparte;
     - código de la carta y OA al pie.
   - Las Etapa 2 llevan una miniatura de la carta de la que vienen.
   - **Prompt para las ilustraciones:** se entregó al docente un prompt maestro, con arte original sin texto, formato 4:3 y paleta según el tipo.

## 13. Personajes (aprobado el 17 nov 2026)

- **Nuevo tipo de carta: Personaje** (color cobre o bronce). Son las personas históricas reales, que dejan de ser Protagonistas. Se juega **1 Personaje por turno**. Su efecto es inmediato, refleja lo que esa persona hizo en la historia, y la carta va al descarte.
- Las 5 dimensiones quedan para lo colectivo: pueblos, civilizaciones, grupos sociales e instituciones.
- **Personajes:**
  - 5°: Colón, Magallanes, Valdivia, Inés de Suárez y Lautaro.
  - 6°: O'Higgins, J. M. Carrera, Javiera Carrera, Bello y Gabriela Mistral.
  - 7° (nuevos): Pericles, Carlomagno y Pachacútec.
  - 8°: Leonardo da Vinci, Lutero, Bartolomé de las Casas y Montesquieu.
- **Protagonistas colectivos nuevos:** Hueste conquistadora y Pueblo diaguita (5°), y Ejército de los Andes (6°).
- **Mazo de 20 cartas:** 11 Protagonistas, 3 Personajes, 3 Acontecimientos, 1 Lugar y 2 Aula.
- **Efectos nuevos:**
  - buscar un Lugar o cualquier carta;
  - cambiar el activo sin pagar retirada;
  - +1 Saber;
  - curar a todos los Protagonistas;
  - pasar todo el Saber de un Protagonista de la reserva al activo;
  - bonificación de daño solo para una dimensión;
  - efectos dobles (quitar el Lugar y robar).

## 14. Ola 1: tableros temáticos, modo unidad y sensación de juego (aprobada el 17 nov 2026)

- **16 tableros**, uno por unidad (`img/tableros/T-<curso>-<unidad>.jpg`, recortados de los collages del docente). Cada uno tiene una **regla de tablero**:
  - **5°:** U1 Carabela (al jugar un Personaje, robas 1); U2 Plaza colonial (Sociedad +10); U3 Zonas naturales (Territorio +10); U4 Mesa comunitaria (al inicio de tu turno, tu activo recupera 10).
  - **6°:** U1 Cabildo de 1810 (cada Hito da +1 Saber a tu activo); U2 Pampa salitrera (Economía +10); U3 Escuela pública (2 cartas Aula por turno); U4 Chile y sus regiones (Política +10).
  - **7°:** U1 Creciente Fértil (al inicio de tu turno, tu activo recupera 10); U2 Ágora (Política +10); U3 Castillo feudal (todo daño −10); U4 Tenochtitlan (retirarse no cuesta Saber).
  - **8°:** U1 Taller renacentista (Cultura +10); U2 Puerto atlántico (al jugar un Personaje, robas 1); U3 Salón ilustrado (2 cartas Aula por turno); U4 Región (Territorio +10).
- **Al preparar la partida** se elige el tablero (o "Sorpresa"). La opción **"Reforzar esta unidad"** incluye en el mazo todas las cartas de la unidad del tablero y completa con el resto del curso.
- **Los Lugares cambian el fondo** cuando hay un tablero que les corresponde (por ejemplo, Mar Mediterráneo → Ágora). La regla sigue siendo la del tablero elegido.
- **Sensación de juego:**
  - animaciones: carta que entra, embestida y temblor, carta "archivada" en sepia, Hito como sello de lacre, aviso de turno;
  - sonidos sintetizados y vibración, ambos se pueden apagar;
  - se respeta "reducir movimiento".
- **Nota de contenido:** el tablero del Cabildo (T-6-1) muestra la bandera actual, de 1817. Queda pendiente regenerarlo.

## 15. Ola 2: conexiones históricas, habilidades y lectura en voz alta (aprobada el 17 nov 2026)

- **Arrastrar y soltar** (agregado antes de la Ola 2): las cartas se arrastran con mouse, dedo o touchpad.
  - Desde la mano: un Protagonista se suelta en el activo o la reserva; una Etapa 2, sobre su carta base; las demás cartas, en tu lado de la mesa.
  - Desde la reserva: un Protagonista se arrastra al activo para retirarse o promoverse.
  - Tocar una carta sigue mostrando su detalle.
- **Conexiones causa → consecuencia.** Una carta puede declarar `conexiones: [{causa, texto}]`. Al jugarla, bajarla o evolucionar hacia ella, si la carta causa está en tu mesa, en tu descarte o es el Lugar en juego, tu activo recibe **+1 Saber** y se muestra "¡Conexión histórica!" con la explicación. Cada curso tiene entre 5 y 7 conexiones, de su propio contenido.
- **Habilidades de los Protagonistas** (`habilidad`), unas 4 por curso, sobre todo en las Etapa 2:
  - `resistente` (recibe −n de daño);
  - `fuerzaReserva` (+n de daño por cada Protagonista en tu reserva);
  - `sanador` (si es tu activo, recupera n al inicio de tu turno);
  - `inspirador` (al entrar en juego, robas 1 carta);
  - `saberAlEntrar` (entra con n de Saber).
- **Lectura en voz alta** con la voz de la tablet, en español y sin internet si la tablet tiene voces instaladas.
  - Botón "Escuchar" en el detalle de cada carta, en la colección y en el "¿Sabías que…?".
  - Ajuste docente: leer automáticamente el "¿Sabías que…?".

## 16. Diseño de cartas estilo Mitos y Leyendas

La ilustración manda: ocupa a sangre los 2/3 superiores de la carta. Cada elemento tiene su zona propia y ninguna se monta sobre otra.

- **Esquina superior izquierda:** disco con el ícono de la dimensión o del tipo, y debajo la categoría (Política, Personaje, Acontecimiento…).
- **Esquina superior derecha:** círculo dorado con la Resistencia (o "1×" en los Personajes: uno por turno).
- **Nombre vertical** a la izquierda, sobre la ilustración, en una franja que empieza bajo la categoría y termina en el borde de la imagen. Su tamaño de letra depende del largo del nombre (4 tamaños).
- **Frase corta** (máx. 80 letras) en cursiva sobre la parte baja de la ilustración. Toda carta tiene `frase` en los datos; el dato histórico completo se lee al tocar la carta, en una ficha bajo la carta grande.
- **Sello de curso** (5°, 6°, 7°, 8°; o el dominio MBE en las cartas de Aula) en el borde entre imagen y texto.
- **Pergamino de texto:** habilidad en negrita, acciones con Saber y daño, o el efecto, y la línea de Conexión. El tamaño de letra se elige por largo y por número de renglones (4 tamaños).
- **Pie:** debilidad ×2 y retirada (Protagonistas) o código; a la derecha el OA o el estándar MBE.
- **Carta pequeña (mano y mesa):** ilustración, disco de tipo, Resistencia, y el nombre en una banda inferior.
- Todas las medidas usan una unidad de carta (`--u` = ancho/20), así la carta se ve igual a cualquier tamaño.
- Prueba visual (QA) que mide en pantalla que ninguna zona choque con otra ni corte su texto, en las 3 resoluciones de tablet.

### 16.1 Saber visible
- Cada Protagonista en la mesa muestra su Saber como número (moneda dorada + cifra), también cuando es 0.
- Junto al activo: "Tu activo tiene N de Saber" y cada acción muestra sus monedas llenas (las que tiene) y vacías (las que faltan), con "Falta N de Saber" o "No se ataca en el primer turno".
- Al ganar o perder Saber (asignación, conexión, efectos, retirada) sube un "+1 Saber" / "−1 Saber" sobre la carta, con sonido; el registro lo dice.
- Mientras tienes Saber por repartir, tus Protagonistas brillan y el cartel del turno avisa "+1 de Saber para repartir".

## 17. Ola 3: rejugabilidad y motivación

### 17.1 Línea de tiempo (pensamiento temporal)
- Cada jugador arma su **línea de tiempo** durante la partida. Las cartas con fecha (Personajes y Acontecimientos con fecha clara, ~35 cartas) entran a la línea cuando se juegan.
- La primera carta con fecha entra sola. Desde la segunda, **el jugador elige dónde va** (antes, entre o después de las que ya tiene). Si acierta, su activo gana **+1 Saber** ("¡Bien ubicada!"). Si se equivoca, la carta se coloca en su lugar correcto y se muestra el año: no hay castigo, se aprende.
- Las fechas iguales cuentan como correctas en cualquier orden.
- La línea se ve en la mesa como una franja pequeña con los años, y completa en la pantalla final.
- Motor: `crearPartida({..., lineaTiempo: true})`. Al jugar una carta con `fecha`, queda en `porUbicar` y la única jugada válida es `{tipo: 'ubicar', posicion}` hasta resolverla. La carta igual va al descarte (las conexiones no cambian).
- Se puede apagar al elegir partida (activada por defecto; apagada en el tutorial).
- Fechas: campo `fecha: {anio, texto}` (años antes de Cristo en negativo). Solo se fechan cartas cuya fecha es clara y aparece o se deduce de su dato.

### 17.2 Rival automático con niveles
- **Aprendiz:** la mitad de las veces juega como el Historiador y la otra mitad hace una jugada al azar; ubica la línea de tiempo al azar.
- **Historiador:** el rival actual; ubica bien la línea de tiempo.
- **Cronista:** evalúa cada jugada posible simulándola (daño efectivo con ventaja, derrotas, Saber, salud de su mesa y de la del rival) y elige la mejor. Ubica bien la línea.
- Se elige al jugar contra la tablet y queda recordado. Meta comprobada por simulación: Cronista gana a Historiador y Historiador gana a Aprendiz en la mayoría de las partidas.

### 17.3 Duelos temáticos (mazos enfrentados)
- Modo nuevo "Duelo temático": cada jugador toma un **bando** con identidad (nombre, lema, color). Duelos:
  - 5°: Conquistadores vs. Pueblos originarios
  - 6°: Patriotas vs. Realistas
  - 7°: Grecia vs. Roma, y Mesoamérica vs. Andes
  - 8°: Absolutismo vs. Ilustración
- Cada bando tiene un **núcleo** de cartas propias que siempre entran a su mazo (los Protagonistas del núcleo, con su base si son Etapa 2). El resto del mazo se completa con cartas del curso, **sin** las del núcleo rival.
- El duelo usa el tablero de la unidad correspondiente.
- Cartas nuevas para que ambos bandos existan: Pueblo mapuche (5°), Ejército realista y Reconquista española (6°). Van al final de su unidad: los códigos existentes no cambian.
- Ajuste de equilibrio (simulación de 400 partidas por duelo): se agregaron Calendario maya, Tenochtitlan y Moctezuma II (7°) y Luis XIV y Palacio de Versalles (8°). Aztecas ("Ciudad sobre el lago": −10 de daño recibido) y Mayas ("Astrónomos": entra con 1 Saber) ganan una habilidad. Criollos y Repúblicas americanas salen del núcleo de Ilustración (corresponden más a la Independencia), así que quedan libres para ambos bandos. Resultado: cada bando gana entre el 45% y el 55%.
- Datos en `data/duelos.json`.

### 17.4 Álbum de colección
- Cada tablet lleva un **álbum**: una carta queda "descubierta" cuando aparece boca arriba en una partida (en tu mano, en la mesa, como Lugar o en un descarte).
- Vista "Álbum" por curso: avance por unidad (descubiertas/total). Las cartas sin descubrir se ven como dorso con "?".
- Completar una unidad entrega una **insignia** con el nombre de la unidad. Las insignias se ven en el álbum y se celebran al final de la partida en que se ganan.
- El docente puede reiniciar el álbum desde su panel. No se guardan nombres de estudiantes.

### 17.5 Modo torneo (día de juegos)
- El docente crea un torneo: curso, nombres de los participantes (o equipos), modo de juego (normal o duelo temático) y Hitos para ganar.
- Llave de eliminación directa con sorteo; si el número no es potencia de 2, algunos pasan directo a la segunda ronda ("pasa directo").
- Cada partida se juega **en la misma tablet** cara a cara ("Jugar esta partida": el ganador se anota solo) o se **anota a mano** (si se jugó en otra tablet).
- Pantalla de campeón al final. Un torneo a la vez por tablet, guardado en la tablet; se puede borrar.
