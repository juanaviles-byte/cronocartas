# Leyendas del Fin del Mundo: diseño de la primera expansión

## Para qué

Esta es la primera expansión de Cronocartas, y vendrán otras. Su tema es la mitología de Chile y su propósito es **acercar la cultura** a estudiantes de 5° a 8° básico: los seres, los relatos y los lugares de los pueblos y zonas del país. No está amarrada a un OA.

## Objetivos

- Tener un mazo propio de 40 cartas que se juega solo, con dos duelos temáticos entre bandos.
- Agregar la categoría **Expansiones** junto a los cursos en la pantalla de juego libre, pensada para sumar más expansiones sin tocar el motor.
- Dar a la expansión una identidad completa: ilustraciones, dorsos, escenarios, ambiente sonoro y marcos de carta propios.

## Lo que no entra en esta versión

- Línea de tiempo, años o contador de épocas: los mitos no tienen fecha.
- Tableros con reglas especiales (se pueden agregar después).
- Torneo, álbum de colección y editor docente con cartas de la expansión. Siguen funcionando con los cursos.
- Mezclar cartas de la expansión con los mazos de curso.

## Lo que no puede pasar (anti-objetivos)

- Que un ser sagrado de un pueblo originario reciba ataques, caiga derrotado o aparezca con rostro.
- Estereotipos: personas de pueblos originarios como villanos o caricaturas, o un ser maligno presentado como persona de un pueblo.
- Contenido que asuste de verdad, sangre o versiones de relatos no aptas para 10 a 14 años (por eso quedan fuera el Trauco, la Fiura y el Invunche).
- Que los cursos cambien en algo: las 311 pruebas actuales deben seguir pasando sin cambios en los mazos.

## Restricciones

- La app sigue siendo una PWA sin conexión, en JavaScript sin compilación, para tablets Android.
- Imágenes en el mismo formato de hoy: carta webp de 480 px, escenario webp y dorso webp. Audio en ogg.
- El caché sin conexión crece. Estimación: unos 2,5 MB de ilustraciones, 0,5 MB de dorsos, 1,5 MB de escenarios y unos 3 MB de audio (ambientes y narrador).

## Enfoques considerados

1. **Colecciones con sus propias fuerzas (elegido).** El motor deja de tener las cinco dimensiones fijas y cada colección trae su lista y su ronda de ventajas. Cuesta más al principio, pero la segunda expansión ya no requiere tocar el motor.
2. **Disfrazar las fuerzas con las dimensiones existentes.** Es más rápido, pero los datos quedan confusos, sobra una dimensión y cada expansión suma otro disfraz.
3. **Un modo de juego separado.** Da libertad total, pero duplica reglas ya probadas.

Elegiste el 1.

## Lo decidido

### Nombre y duelos

- Expansión: **Leyendas del Fin del Mundo**.
- Duelo estrella: **La Guerra de las Serpientes**, Mar contra Tierra y Fuego (Caicai Vilú contra Tentén Vilú).
- Segundo duelo: **Luces y Sombras**, Cielo y Viento contra Bosque y Noche. El nombre es provisional, propuesto por mí.

### Las cuatro fuerzas y su ronda de ventajas

Las fuerzas reemplazan a las dimensiones de Historia. Cada una le gana a la siguiente (×2 de daño, la misma mecánica de ventaja de hoy):

- **Mar** le gana a **Tierra y Fuego**: el mar apaga el fuego.
- **Tierra y Fuego** le gana a **Cielo y Viento**: la ceniza cubre el cielo.
- **Cielo y Viento** le gana a **Bosque y Noche**: el viento y la luz disipan la noche.
- **Bosque y Noche** le gana a **Mar**: los brujos del Caleuche gobiernan el mar.

### Tipos de carta

| Tipo del juego | En la expansión | Cantidad |
|---|---|---|
| Protagonista | Ser del folclore: ataca, resiste y cae | 24 (6 por fuerza) |
| Personaje | Presencia sagrada: nunca recibe ataques; bendice, protege o sana | 6 |
| Acontecimiento | Relato o prodigio | 6 |
| Lugar | Lugar mítico con escenario y ambiente sonoro, que favorece a su fuerza | 4 |

El campo «dato» se muestra como **«De dónde viene»**: qué pueblo o zona cuenta el relato y qué explicaba.

### Lista de cartas (provisional; el usuario puede cambiar cualquier ser)

- **Mar:** Caicai Vilú, la Pincoya, el Caleuche, el Millalobo, el Trelke, la Sirena chilota.
- **Tierra y Fuego:** Tentén Vilú, el Cherufe, la Lampalagua, el Culebrón, Coquena, el Camahueto.
- **Cielo y Viento:** el Chonchón, el Tué-tué, el Piuchén, el Anchimallén, el Alicanto, la Voladora.
- **Bosque y Noche:** la Calchona, la Lola, el Basilisco chilote, el Duende, la Viuda, el Huallepén.
- **Presencias sagradas:** Ngenechen, Pillán, Make Make, Pachamama, Achachilas, Temáukel.
- **Relatos:** El gran diluvio, La carrera del Tangata Manu, La Noche de San Juan, Kenos ordena la tierra, La marea de la Pincoya, El despertar del volcán.
- **Lugares:** El mar interior de Chiloé (Mar), El volcán Rukapillán (Tierra y Fuego), El desierto de Atacama bajo las estrellas (Cielo y Viento), El bosque valdiviano (Bosque y Noche).

### Aspecto

- **Ilustraciones:** fantasía épica nocturna, con una paleta y una luz por fuerza. Los prompts están en `docs/fin-del-mundo/prompts-arte.md`.
- **Presencias sagradas:** sin figura ni rostro, mostradas solo con paisaje, luz y señales.
- **Marcos de carta:** inspirados en la naturaleza, con el color de su fuerza (olas, llamas, plumas, helechos), dibujados en CSS. Sin símbolos de los pueblos.
- **Dorsos:** uno general y uno por fuerza. En un duelo, cada bando muestra el dorso de su fuerza; con el mazo completo se usa el general.
- **Escenarios:** ME00 es el fondo de la mesa cuando no hay Lugar en juego; ME01 a ME04 corresponden a los cuatro Lugares.
- **Cambio de escenario:** el cartel muestra el lugar y su zona en vez del año, con la misma transición de arena.

### Sonido

- Un ambiente para cada Lugar y otro para el fondo general, de Freesound con licencia CC0. Se integran con el mismo conversor de los escenarios de Historia.
- El narrador lee el nombre y «De dónde viene» de las 40 cartas, igual que en los cursos (guion y pipeline de siempre).
- Por ahora las presencias sagradas no tienen voz propia: hablar por ellas sería delicado.

### Pantalla de juego libre

- Arriba, dos pestañas: **Cursos** (5° a 8°, como hoy) y **Expansiones**, que lista las colecciones disponibles; hoy hay una.
- Al elegir la expansión: «Mazo completo» o «Duelo temático» (los dos duelos), cara a cara o contra la tablet.
- Mientras se elige la expansión, «Mazos cruzados» y «Línea de tiempo» no aparecen.

## Cómo encaja en el código

- `data/colecciones.json` define cada colección. Los cursos usan las dimensiones de siempre; la expansión declara:
  - `id: "fin-del-mundo"` y el nombre;
  - las cuatro fuerzas, cada una con su clave, su nombre visible, su color y su emblema;
  - la ronda de ventajas;
  - el archivo de cartas (`data/exp-fin-del-mundo.json`);
  - el fondo general;
  - `lineaTiempo: false`;
  - la etiqueta del dato: «De dónde viene».
- El motor recibe las fuerzas y la ronda de ventajas al crear la partida y las guarda en el estado. `desgloseDanio` y la validación de cartas las leen de ahí. Si no vienen, se usan `DIMENSIONES` y `VENTAJA` de hoy, de modo que las partidas guardadas de los cursos siguen funcionando.
- Los códigos de carta de la expansión son `FM-001`…`FM-040`. Ilustraciones en `img/cartas/FM-xxx.webp`, escenarios en `img/escenarios/FM-xxx.webp`, dorsos en `img/dorsos/FM-*.webp` y ambientes en `audio/ambientes/FM-xxx.ogg`.
- Los duelos de la expansión van en el mismo `data/duelos.json`, con `coleccion: "fin-del-mundo"` en vez de `curso`.
- La IA, el director de escena, los efectos, el desglose de daño, el menú de partida y el sonido funcionan igual: solo leen las fuerzas desde la colección.
- La auditoría de sintonía (que el texto de cada carta coincida con lo que hace) se aplica también a las 40 cartas nuevas.

## Lo que queda a criterio de quien construye

- Valores exactos de cada carta (resistencia, acciones, costos y efectos), dentro de los rangos de balance de hoy y con nombres de acción propios de cada ser (por ejemplo, «Danza de la marea» para la Pincoya).
- Los textos de «De dónde viene». Los escribo yo con fuentes, y el usuario los revisa antes de grabar las voces.
- El dibujo exacto de los marcos en CSS.
- El orden de las pestañas y los textos de la pantalla de juego libre.

## Decisiones que tomé yo (revísalas)

- Torneo, álbum y editor docente quedan fuera de esta versión.
- El segundo duelo se llama «Luces y Sombras».
- Las presencias sagradas no tienen voz propia.
- La lista de 40 seres es mía, con ajustes verificados en fuentes: salió el Anchanchu y entró Coquena.
