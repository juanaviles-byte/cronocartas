# El Ocaso de los Dioses · Lo que falta y los prompts para generarlo

Estado al 25 de noviembre de 2026. La expansión ya funciona en el motor, pero está oculta en los menús. Este documento reúne lo que falta para mostrarla y quién hace cada parte. Trae los prompts listos para copiar.

## 1. Inventario

### Lo que ya está

| Parte | Estado |
|---|---|
| 49 cartas (reglas, textos, datos) | En el juego, oculta |
| Ciclo de día y noche | Funciona, con sonido, oscurecimiento y aviso en la bitácora |
| Simulaciones y equilibrio | Hechas (ver `bitacora-simulaciones.md`) |
| 49 ilustraciones, 3 portadas de duelo, 8 dorsos | Cortadas en `fuentes/ocaso/cortes/` |
| 7 escenarios a 2304 px y 2 fondos de menú | Hechos en el otro chat (commit `f4a3edb`, sin subir) |
| Sonidos de invocación y del ciclo | En el juego |
| Medallones de los seis panteones | En el juego; la serpiente y el dragón son provisionales y se quedan |

### Lo que falta

| # | Parte | Quién | Cómo |
|---|---|---|---|
| A | 8 marcos vacíos, uno por arquetipo | Tú, con IA de imágenes | Prompts de la sección 3 |
| B | Voz del narrador para las 49 cartas | Tú, en AI Studio | 8 bloques de la sección 4 |
| C | 2 frases nuevas de La Cronista (día y noche) | Tú, en AI Studio | Sección 5 |
| D | 7 ambientes sonoros | Tú, en Freesound | Búsquedas de la sección 6 |
| E | Tema musical propio del Ocaso | Tú (opcional) | Prompt de la sección 7 |
| F | Mapas del minijuego de geografía | Yo | Desde datos de dominio público (sección 8) |
| G | Ícono de sol y luna en cada carta y en la franja central | Yo | Dibujado por código |
| H | Pasar el arte cortado a `img/`, recortar los marcos y mostrar la colección | Yo | Cuando lleguen A y B |
| I | Ajustar el Ocaso en el modo libre (hoy 42 %) | Yo | Antes de lanzarlo |
| J | Novedades y anuncio en el menú | Yo | Al final |

**Orden recomendado:** 2 → A → B → D → C → E. Lo mío (F a J) avanza en paralelo.

## 2. Antes de todo: subir lo pendiente

Hay dos trabajos sin subir, uno en cada chat. No pisan los mismos archivos:

- **En el otro chat**, `f4a3edb` toca `fuentes/ocaso/cortes/img/escenarios/` y `fuentes/ocaso/` (lámina ×4 y fondos de menú).
- **En este chat**, `5eacd5b`, `f7514ee` y `950c44f` tocan `js/`, `data/`, `img/iconos/`, `audio/sfx/`, `tests/`, `sw.js` y `docs/`.

**Pasos:**

1. **Que el otro chat suba primero.** Dale permiso para hacer push de `f4a3edb`, o súbelo tú. Si ese entorno no puede subir, que te pase los archivos y los subo yo.
2. **La lámina ×4 (33 MB):** no conviene subirla así. Que la guarde en WebP sin pérdida o a ×2 (~9 MB). Solo sirve como fuente; el juego usará los marcos vacíos de la sección 3.
3. **La rama `imagenes-x4plus-anterior`:**
   - Rescatar solo los tableros a 2048 px hechos con IA, si al compararlos con los de 1536 px (Lanczos) se ven más nítidos. Mirar sobre todo texturas y bordes, en la tablet.
   - Lo demás, descartarlo, porque `bd7ee7c` ya lo rehízo.
   - Antes de subir los tableros, convertirlos a JPEG q86 y comprobar que el peso total de `img/tableros/` no suba más de un 30 %.
4. **Después**, yo traigo esos cambios, pongo los míos encima y subo con tu confirmación.

## 3. Marcos vacíos por arquetipo (A)

La lámina `marcos-arquetipo.png` define bien los ocho estilos, pero cada marco trae una carta dibujada adentro. Para el juego hace falta el marco **vacío**, igual que se pidió en RV-6 para los cursos.

### Qué marco va con qué cartas (propuesta mía)

| Código | Estilo de la lámina | Cartas |
|---|---|---|
| OM1 | Mármol griego, columnas, greca y laurel | Olimpo y El monte Olimpo |
| OM2 | Madera y plata con nudos entrelazados | Asgard y El puente Bifröst |
| OM3 | Oro egipcio, sol alado y esmalte turquesa | Nilo y Las pirámides de Guiza |
| OM4 | Grecas escalonadas mesoamericanas, turquesa y rojo | Quinto Sol y Teotihuacan |
| OM5 | Laca roja, flores de cerezo y olas | Yōkai y El monte Fuji |
| OM6 | Jade verde, dragón y nubes | Jade y Las montañas Kunlun |
| OM7 | Orla floral de manuscrito iluminado, rojo y azul sobre oro | Tradición cristiana: San Francisco, San Nicolás, Hildegarda y Los monjes copistas |
| OM8 | Flores de loto, magenta y oro | India: Savitri, Diwali y Las fábulas del Panchatantra |

Los relatos de cada panteón (La Odisea, El Ragnarök, etc.) usan el marco de su panteón.

### Cómo usarlo

1. Si tu generador acepta imágenes de referencia, sube la lámina y escribe arriba del prompt: «Usa como referencia de estilo el marco N.º X de la imagen (contando de izquierda a derecha y de arriba abajo)».
2. Pega el **prompt base** y reemplaza la línea de estilo con la de la tabla de abajo.
3. Formato vertical 5:7, la mayor resolución disponible (ideal 1600 × 2240).
4. Guarda cada archivo con su código (`OM1.png`, `OM2.png`…) y envíamelos.

**Revisa en cada resultado:**

- La ventana está completamente blanca, sin dibujo.
- No hay números, letras, insignias ni círculos donde iría el puntaje.
- El borde tiene el mismo grosor en los cuatro lados. Los adornos pueden sobresalir un poco hacia afuera, nunca hacia la ventana.

### Prompt base

```
Marco ornamental de carta coleccionable, VACÍO, vista frontal plana, formato vertical 5:7 (1600 × 2240 px), sobre fondo blanco liso.
Estilo del marco: [LÍNEA DE ESTILO].
El marco tiene el mismo grosor en los cuatro lados, cerca del 5 % del ancho de la carta, con esquinas redondeadas pequeñas y un adorno central en el borde superior y otro en el inferior. Los adornos pueden sobresalir hacia afuera, pero nunca invaden la ventana.
La ventana interior es un rectángulo de esquinas redondeadas completamente BLANCO PLANO: sin ilustración, sin placas, sin sellos, sin iconos, sin círculos de puntaje, sin texto, sin números, sin sombra hacia adentro.
Iluminación pareja y suave desde arriba, materiales con relieve y textura visibles, ilustración pintada con mucho detalle, sin perspectiva.
Sin manos, sin objetos alrededor, sin marca de agua, sin texto.
```

### Líneas de estilo

```
OM1 · mármol blanco envejecido tallado como un templo griego: columnas estriadas a ambos lados, una greca (meandro) azul y oro a lo largo de los bordes superior e inferior, ramas de laurel dorado en las esquinas de abajo.
```
```
OM2 · madera oscura tallada con bandas de plata envejecida, cubierta de nudos entrelazados al estilo de las tallas nórdicas y celtas, con cabezas de serpiente estilizadas en las esquinas superiores y un árbol de ramas entrelazadas en el centro del borde superior.
```
```
OM3 · oro bruñido con incrustaciones de esmalte turquesa y lapislázuli, al estilo del antiguo Egipto: un disco solar con alas extendidas en el centro del borde superior, columnas con capiteles de papiro a los lados y franjas de jeroglíficos decorativos sin significado, sin letras legibles.
```
```
OM4 · piedra tallada y pintada al estilo mesoamericano, con grecas escalonadas en turquesa, rojo y ocre a lo largo de los cuatro lados, una máscara de piedra de rasgos geométricos en el centro del borde superior y otra más pequeña en el inferior.
```
```
OM5 · laca roja y negra con detalles de oro, al estilo de la pintura japonesa tradicional: ramas de cerezo en flor que entran por las esquinas superiores y olas azules estilizadas en el borde inferior.
```
```
OM6 · jade verde pulido con filos de oro, al estilo chino tradicional: un dragón verde de cuerpo largo que recorre el borde superior entre nubes enroscadas, celosías geométricas a los lados y una flor de loto dorada en el centro del borde inferior.
```
```
OM7 · orla de manuscrito iluminado medieval sobre fondo de oro: hojas de acanto y flores entrelazadas en rojo bermellón, azul ultramar y verde, con pequeños medallones florales en las esquinas, pintada como un libro copiado a mano.
```
```
OM8 · oro y esmalte magenta, turquesa y naranja, al estilo de la ornamentación tradicional de la India: una gran flor de loto abierta en el centro del borde superior, arcos lobulados en las esquinas y guirnaldas de flores pequeñas a lo largo de los lados.
```

## 4. Voz del narrador (B)

El narrador lee el nombre y el dato de cada carta, como en los cursos y en «Fin del Mundo». Usa la misma voz del narrador de siempre.

### Cómo usarlo

1. En AI Studio, generación de voz, un solo hablante, la voz del narrador.
2. En **instrucciones de estilo** pega el estilo de abajo. En el texto pega **un bloque** completo.
3. Guarda cada archivo con el nombre del bloque: `ON01.wav` … `ON08.wav`.
4. Escucha que lea todas las frases, en orden y con pausa entre ellas. Si se salta una, vuelve a generar ese bloque.

Son **8 bloques** con las 49 cartas, en el mismo orden que los collages OK01–OK08. Las fábulas del Panchatantra van al final de ON08. La correspondencia carta por carta está en `narrador.json`.

### Estilo del narrador

```
Narrador de documental para niños y niñas de 10 a 14 años, ahora contando mitos y tradiciones de distintas culturas del mundo. Voz masculina grave, cálida y clara, en español latinoamericano neutro, sin imitar acentos de otros países. Ritmo pausado y tono de quien cuenta un relato antiguo, con asombro y respeto, sin dramatizar de más ni asustar. Lee los nombres propios (griegos, nórdicos, egipcios, nahuas, japoneses, chinos y sánscritos) con calma y claridad, tal como están escritos. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente.
```

### Bloques

### ON01

```
Zeus. Para los antiguos griegos, era el rey de los dioses del Olimpo y señor del cielo. Lanzaba rayos y vigilaba que se cumplieran los juramentos.

Hades. Dios griego del inframundo, hermano de Zeus y Poseidón. No era malvado: cuidaba que se respetaran las reglas de su reino. Su yelmo lo volvía invisible.

Poseidón. Dios griego del mar. Con su tridente levantaba olas y, según contaban, causaba los terremotos. En las novelas de Percy Jackson es el padre del protagonista.

Atenea. Diosa griega de la sabiduría y la estrategia, protectora de la ciudad de Atenas. Llevaba la Égida, un escudo que la protegía.

Medusa. En el mito griego, una gorgona con serpientes por cabello cuya mirada convertía en piedra. Por eso en esta carta solo aparece su sombra.

El monte Olimpo. La montaña más alta de Grecia, de casi 2.920 metros. Los griegos imaginaban en su cumbre, entre las nubes, el palacio de sus dioses.
```

### ON02

```
Thor. Dios nórdico del trueno y protector de los humanos. Su martillo, Mjölnir, volvía a su mano después de cada lanzamiento.

Odín. El dios principal de los pueblos nórdicos. Según el mito, entregó un ojo para beber del pozo de la sabiduría. Dos cuervos le traían noticias del mundo.

Freya. Diosa nórdica del amor, la magia y la guerra. Tenía un manto de plumas de halcón para volar, y su carro lo tiraban gatos.

Loki. El embaucador de los mitos nórdicos. Cambiaba de forma, ayudaba a los dioses o los metía en problemas, y en el Ragnarök se pone del otro lado.

Heimdall. El guardián del puente Bifröst. Los mitos dicen que veía y oía a enormes distancias, y que su cuerno anunciará el Ragnarök.

El puente Bifröst. En los mitos nórdicos, un puente de arcoíris unía Asgard, el mundo de los dioses, con Midgard, el de los humanos. Heimdall lo vigilaba.
```

### ON03

```
Ra. El dios del sol del antiguo Egipto. Los egipcios contaban que cruzaba el cielo en una barca de día y el mundo de los muertos de noche.

Anubis. Dios egipcio con cabeza de chacal, protector de las tumbas. Guiaba a los difuntos y vigilaba la balanza del juicio.

Horus. Dios egipcio con cabeza de halcón, hijo de Isis y Osiris. Su ojo se volvió un símbolo de protección y salud.

Isis. Diosa egipcia de la magia y la sanación. El mito cuenta que reunió las partes de Osiris para devolverlo a la vida.

Bastet. Diosa egipcia con forma de gata, protectora del hogar y las familias. Con el tiempo también se la asoció con la luna.

Las pirámides de Guiza. Tumbas de los faraones construidas en Egipto hace unos 4.500 años. La Gran Pirámide es la única maravilla del mundo antiguo que sigue en pie.
```

### ON04

```
Quetzalcóatl. Para los pueblos de Mesoamérica, la serpiente emplumada se asociaba al viento, al saber y a la creación. El mito mexica cuenta que dio el maíz a los humanos.

Tezcatlipoca. Dios mexica de la noche y de los cambios, con un espejo de obsidiana humeante. En los mitos, él y Quetzalcóatl son las dos caras de la creación.

Los Gemelos Héroes. En el Popol Vuh, libro de los mayas k’iche’, Hunahpú e Ixbalanqué vencen a los señores de Xibalbá con astucia y el juego de pelota. Al final se vuelven el sol y la luna.

Ixchel. Diosa maya de la luna, el tejido y la medicina, protectora de las madres y las parteras. Su santuario estaba en la isla de Cozumel.

Itzamná. Uno de los dioses principales de los mayas, asociado al cielo y a la sabiduría. La tradición le atribuye la escritura y el calendario.

Teotihuacan. Gran ciudad de México con las pirámides del Sol y de la Luna. Los mexicas la encontraron abandonada, le pusieron ese nombre y contaban que allí nació el Quinto Sol.
```

### ON05

```
Yamata no Orochi. La gran serpiente de los relatos japoneses más antiguos. Fue vencida con astucia: la hicieron dormir antes de enfrentarla.

La Kitsune de nueve colas. En el folclore de Japón, los zorros sabios ganan colas con los años. Con nueve, su magia es enorme, y sus llamas azules alumbran la noche.

El Tengu. Espíritus de las montañas japonesas, con alas y nariz larga. Una leyenda cuenta que enseñaron esgrima al joven guerrero Minamoto no Yoshitsune.

El Kappa. Criatura de los ríos japoneses, con caparazón y un plato de agua en la cabeza. Si hace una reverencia, pierde el agua y su fuerza.

Momotarō. Cuento popular japonés. Momotarō viaja con un perro, un mono y un faisán, y juntos vencen a los ogros de una isla.

El monte Fuji. Volcán de 3.776 metros, símbolo de Japón y retratado por pintores y poetas durante siglos. Es Patrimonio de la Humanidad.
```

### ON06

```
Sun Wukong. Protagonista de Viaje al Oeste, novela china del siglo XVI. Tiene un bastón que cambia de tamaño y domina 72 transformaciones.

Long, el dragón de la lluvia. En China, el dragón es un ser bondadoso que gobierna las aguas, los ríos y la lluvia, y simboliza la buena fortuna.

Hou Yi. El mito chino cuenta que salieron diez soles a la vez y que el arquero Hou Yi derribó nueve para que la Tierra no se quemara.

Nian. Bestia de las leyendas chinas que aparecía en Año Nuevo. Por eso, según la tradición, se adorna con rojo y se lanzan petardos.

Chang'e. Según el mito chino, bebió el elixir de la inmortalidad y subió a vivir a la luna junto a un conejo de jade. Se la recuerda en la Fiesta de Medio Otoño.

Las montañas Kunlun. En los mitos chinos, en estas montañas vivía la Reina Madre del Oeste, que cuidaba un jardín de duraznos de la inmortalidad.
```

### ON07

```
San Francisco de Asís. Fraile italiano del siglo XIII que vivió con sencillez y cuidó a pobres y enfermos. Se lo recuerda por su amor a los animales y a la naturaleza.

San Nicolás de Mira. Obispo del siglo IV en Mira, en la actual Turquía. Se cuenta que daba regalos sin que nadie lo supiera. De su historia nació el Viejito Pascuero.

Hildegarda de Bingen. Abadesa alemana del siglo XII. Compuso música, escribió sobre plantas y medicina, y fue una de las sabias más importantes de la Edad Media.

Savitri. Heroína de un relato del Mahabharata, el gran poema épico de la India. Siguió a la muerte y, con inteligencia y constancia, logró que le devolviera a su esposo.

Los monjes copistas. En los monasterios medievales, los monjes copiaban libros a mano. Así se conservaron muchas obras griegas y romanas, entre ellas relatos de sus dioses.

Diwali, la fiesta de las luces. Una de las fiestas más importantes de la India. Se encienden lámparas de aceite, las diyas, por el triunfo de la luz sobre la oscuridad. La celebran hindúes, jainistas y sijs.
```

### ON08

```
La Odisea. Poema griego atribuido a Homero. Odiseo tarda diez años en volver a Ítaca tras la guerra de Troya y enfrenta cíclopes, sirenas y tormentas.

El Ragnarök. En los mitos nórdicos, el fin del mundo de los dioses. Tras un largo invierno, dioses y gigantes se enfrentan, y después la tierra vuelve a nacer, verde y nueva.

El juicio de Osiris. Los antiguos egipcios creían que, al morir, el corazón se pesaba contra la pluma de Maat, la verdad. Si era justo, la persona seguía a una nueva vida.

La leyenda de los Cinco Soles. Los mexicas contaban que el mundo había tenido cuatro soles, o eras, antes del actual. Según el relato, el quinto nació en Teotihuacan.

El desfile de los cien yōkai. En el folclore japonés, ciertas noches los yōkai desfilan por las calles. Muchos pintores antiguos lo dibujaron en largos rollos de papel.

El Viaje al Oeste. Novela china del siglo XVI. El monje Xuanzang viaja a la India en busca de libros, protegido por Sun Wukong y otros compañeros.

Las fábulas del Panchatantra. Colección de fábulas de la antigua India en que animales astutos enseñan a pensar y a elegir bien. Muchas viajaron hasta Europa.
```

## 5. Dos frases nuevas de La Cronista (C)

Se graban con la voz y el estilo de La Cronista de siempre (`docs/voces-guion.md`), **una por audio**:

- `C25.wav`
  ```
  ¡Cae la noche! Mientras dure, las cartas de sombra hacen diez puntos más de daño.
  ```
- `C26.wav`
  ```
  ¡Llega el día! Ahora son las cartas de luz las que hacen diez puntos más de daño.
  ```

## 6. Ambientes sonoros (D)

Son 7 sonidos: uno general, que suena cuando no hay ningún Lugar en juego, y uno por cada Lugar. Las reglas son las de siempre:

- licencia CC0 (o CC BY, enviando el enlace para el crédito);
- más de 30 segundos;
- sin voces que se entiendan, sin música y sin golpes fuertes;
- cada archivo con su código y el enlace de su página.

| Código | Escena | Buscar (en inglés) | Debe sonar a |
|---|---|---|---|
| AO00 | El Ocaso de los Dioses (fondo general) | `ancient temple ambience wind`, `mystic dusk ambience` | Viento suave en un lugar alto y antiguo al atardecer, con un eco amplio |
| AO01 | El monte Olimpo | `mountain summit wind clouds`, `high altitude wind ambience` | Viento de cumbre sobre las nubes, limpio y abierto, con algún pájaro lejano |
| AO02 | El puente Bifröst | `arctic wind night ambience`, `northern night wind fjord` | Noche fría del norte: viento helado, quietud, un leve zumbido lejano |
| AO03 | Las pirámides de Guiza | `desert wind sand ambience day`, `egypt desert wind` | Desierto de día: viento con arena, silencio amplio, algún insecto |
| AO04 | Teotihuacan | `mexico highlands ambience birds`, `dry valley ambience cicadas` | Valle seco de altura: aves, chicharras y brisa, sin ciudad ni tráfico |
| AO05 | El monte Fuji | `japanese forest ambience stream`, `japan mountain forest birds` | Bosque de montaña en Japón: arroyo, aves y hojas; sin campanas de templo |
| AO06 | Las montañas Kunlun | `misty mountain valley ambience`, `mountain river valley wind` | Valle de montaña con neblina: río lejano, viento y una calma profunda |

Si AO03 se parece demasiado al ambiente del desierto de Atacama de «Fin del Mundo» (ME03), busca uno de día y con más arena en el viento.

## 7. Tema musical del Ocaso (E, opcional)

Hoy, al abrir el juego suena un solo tema. Si quieres uno propio para cuando el Ocaso esté seleccionado, este es el prompt para un generador de música:

```
Pieza instrumental de 75 segundos para el menú de un juego de cartas educativo sobre mitos del mundo. Orquesta pequeña con cuerdas, cornos suaves, arpa y percusión ligada a varias culturas (tambor de marco, taiko suave, campanillas), sin melodías tradicionales reconocibles. Empieza tranquila, como un amanecer, sube a un tema heroico y luminoso a la mitad y vuelve a calmarse para poder repetirse en bucle sin corte. Tono épico pero amable, apto para niños de 10 a 14 años. Sin voces, sin coros con letra.
```

Guárdalo como `tema-ocaso.wav`. Si no lo haces, el Ocaso usa el tema de siempre y no pasa nada.

## 8. Mapas del minijuego de geografía (F)

Los mapas **no conviene pedirlos a una IA de imágenes**. Inventan costas, islas y fronteras, y en un juego de ubicar en el mapa eso sería un error de contenido.

Los dibujo yo, por código, a partir de datos geográficos de dominio público (Natural Earth), con el estilo del juego:

- **Ocaso:** mapamundi con las zonas de cada panteón: Grecia, Escandinavia, Egipto, el centro de México, Japón, China e India.
- **«Fin del Mundo»:** mapa de Chile con sus zonas: Norte Grande, Atacama, zona central, Araucanía, Chiloé, Patagonia, Tierra del Fuego y Rapa Nui.

Para eso necesito el archivo de datos. Te pediré permiso para descargarlo, o te pasaré el enlace para que lo descargues y me lo adjuntes, cuando apruebes el diseño del minijuego.
