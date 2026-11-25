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
| B | Narradores aventureros para las 49 cartas | Tú, en AI Studio | 7 bloques de la sección 4, uno por arquetipo |
| C | Volver a grabar a La Cronista con más vida (26 frases, 2 nuevas) | Tú, en AI Studio | Sección 5 |
| D | 7 ambientes sonoros | Tú, en Freesound | Búsquedas de la sección 6 |
| E | Tema musical propio del Ocaso | Tú (opcional) | Prompt de la sección 7 |
| F | Minijuego de geografía con mapas | Hecho | Mapas de Natural Earth (dominio público), en el modo libre |
| G | Ícono de sol y luna en cada carta y en la franja central | Yo | Dibujado por código |
| H | Pasar el arte cortado a `img/`, recortar los marcos y mostrar la colección | Yo | Cuando lleguen A y B |
| I | Ajustar el Ocaso en el modo libre (hoy 42 %) | Yo | Antes de lanzarlo |
| J | Novedades y anuncio en el menú | Yo | Al final |
| K | Tipografía propia de cada arquetipo (solo en la expansión) | Hecho | Fuentes libres (OFL) incluidas en el juego, para que funcionen sin internet |

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

## 4. Narradores aventureros (B)

En el Ocaso no narra la voz de los cursos. **Cada arquetipo tiene su aventurero o aventurera**, alguien de esa tierra que cuenta sus mitos como quien los escuchó desde niño.

**Cómo se marca el origen:**
- por lo que cuenta y cómo lo cuenta;
- por cómo dice los nombres de su idioma.

**Lo que no se hace:** imitar acentos al hablar español, ni hacer voces de estereotipo. Hablan español latinoamericano neutro.

Son **7 bloques**, uno por arquetipo. Cada uno trae sus 5 protagonistas, su Lugar y su relato; el séptimo reúne las tradiciones vivas. La correspondencia carta por carta está en `narrador.json`.

### Cómo usarlo

1. En AI Studio, generación de voz, un solo hablante, con **la voz sugerida en cada bloque**. Si no te convence, prueba otra; lo importante es no cambiarla después dentro del mismo bloque.
2. En **instrucciones de estilo** pega el estilo del bloque.
3. En el texto pega el bloque completo. **Expresiones:** donde dice `<gasp>`, `<whispers>`, etc., borra esa marca, escribe `<` en ese mismo lugar y elige la expresión del menú. Si alguna no aparece, elige la más parecida o déjala sin expresión.
4. Guarda cada archivo con el nombre del bloque: `ON01.wav` … `ON07.wav`.
5. Escucha que lea todas las frases, en orden, con pausa entre ellas y los nombres bien dichos. Si se salta una o pronuncia mal un nombre, vuelve a generar el bloque.

### ON01 · Olimpo · voz sugerida: Algenib

Estilo:

```
Eres Nikos, un caminante griego de unos cincuenta años que creció en un pueblo de pastores a los pies del monte Olimpo y ha subido sus senderos toda la vida. Cuentas los mitos de tu tierra a niños y niñas de 10 a 14 años, sentado en una piedra del camino, con voz grave y algo rasposa, cálida y orgullosa. Te asombras con Zeus, bajas la voz con Hades y Medusa, y hablas de la Odisea con nostalgia de viajero. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Zeus, Hades, Poseidón, Atenea y Égida se dicen como en español. Odiseo e Ítaca con acento en la «i»: O-di-SE-o, Í-ta-ca.
```

Texto:

```
<gasp> Zeus. Para los antiguos griegos, era el rey de los dioses del Olimpo y señor del cielo. Lanzaba rayos y vigilaba que se cumplieran los juramentos.

<whispers> Hades. Dios griego del inframundo, hermano de Zeus y Poseidón. No era malvado: cuidaba que se respetaran las reglas de su reino. Su yelmo lo volvía invisible.

Poseidón. Dios griego del mar. Con su tridente levantaba olas y, según contaban, causaba los terremotos. En las novelas de Percy Jackson es el padre del protagonista.

Atenea. Diosa griega de la sabiduría y la estrategia, protectora de la ciudad de Atenas. Llevaba la Égida, un escudo que la protegía.

<whispers> Medusa. En el mito griego, una gorgona con serpientes por cabello cuya mirada convertía en piedra. Por eso en esta carta solo aparece su sombra.

El monte Olimpo. La montaña más alta de Grecia, de casi dos mil novecientos veinte metros. Los griegos imaginaban en su cumbre, entre las nubes, el palacio de sus dioses.

<sigh> La Odisea. Poema griego atribuido a Homero. Odiseo tarda diez años en volver a Ítaca tras la guerra de Troya y enfrenta cíclopes, sirenas y tormentas.
```

### ON02 · Asgard · voz sugerida: Alnilam

Estilo:

```
Eres Sigrid, una navegante de los fiordos de Noruega, de unos treinta y cinco años, que ha cruzado mares helados bajo auroras boreales. Cuentas los mitos de tu tierra a niños y niñas de 10 a 14 años, de pie en la proa, con voz firme, clara y llena de energía. Celebras a Thor, te ríes con las travesuras de Loki y hablas del Ragnarök en voz baja, como quien cuenta algo muy antiguo. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Pronuncia Mjölnir como «MIÓL-nir», Bifröst como «BÍF-rost», Ragnarök como «RAG-na-rok», Asgard como «ÁS-gard», Midgard como «MID-gard», Odín con acento en la «i» y Freya como «FRÉI-a».
```

Texto:

```
<cheer> Thor. Dios nórdico del trueno y protector de los humanos. Su martillo, Mjölnir, volvía a su mano después de cada lanzamiento.

Odín. El dios principal de los pueblos nórdicos. Según el mito, entregó un ojo para beber del pozo de la sabiduría. Dos cuervos le traían noticias del mundo.

Freya. Diosa nórdica del amor, la magia y la guerra. Tenía un manto de plumas de halcón para volar, y su carro lo tiraban gatos.

<chuckle> Loki. El embaucador de los mitos nórdicos. Cambiaba de forma, ayudaba a los dioses o los metía en problemas, y en el Ragnarök se pone del otro lado.

Heimdall. El guardián del puente Bifröst. Los mitos dicen que veía y oía a enormes distancias, y que su cuerno anunciará el Ragnarök.

<gasp> El puente Bifröst. En los mitos nórdicos, un puente de arcoíris unía Asgard, el mundo de los dioses, con Midgard, el de los humanos. Heimdall lo vigilaba.

<whispers> El Ragnarök. En los mitos nórdicos, el fin del mundo de los dioses. Tras un largo invierno, dioses y gigantes se enfrentan, y después la tierra vuelve a nacer, verde y nueva.
```

### ON03 · Nilo · voz sugerida: Gacrux

Estilo:

```
Eres Nefer, una barquera del río Nilo de unos cuarenta y cinco años, que ha navegado entre Asuán y El Cairo viendo templos y pirámides desde el agua. Cuentas los mitos de tu tierra a niños y niñas de 10 a 14 años mientras la barca avanza despacio, con voz madura, serena y misteriosa. Te asombras con Ra, susurras con Anubis y el juicio de Osiris, y hablas de las pirámides con respeto. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Ra, Anubis, Horus, Isis, Osiris y Maat se dicen como en español; Bastet con acento al final, «bas-TET»; Guiza como «GUI-sa».
```

Texto:

```
<gasp> Ra. El dios del sol del antiguo Egipto. Los egipcios contaban que cruzaba el cielo en una barca de día y el mundo de los muertos de noche.

<whispers> Anubis. Dios egipcio con cabeza de chacal, protector de las tumbas. Guiaba a los difuntos y vigilaba la balanza del juicio.

Horus. Dios egipcio con cabeza de halcón, hijo de Isis y Osiris. Su ojo se volvió un símbolo de protección y salud.

Isis. Diosa egipcia de la magia y la sanación. El mito cuenta que reunió las partes de Osiris para devolverlo a la vida.

Bastet. Diosa egipcia con forma de gata, protectora del hogar y las familias. Con el tiempo también se la asoció con la luna.

<sigh> Las pirámides de Guiza. Tumbas de los faraones construidas en Egipto hace unos cuatro mil quinientos años. La Gran Pirámide es la única maravilla del mundo antiguo que sigue en pie.

<whispers> El juicio de Osiris. Los antiguos egipcios creían que, al morir, el corazón se pesaba contra la pluma de Maat, la verdad. Si era justo, la persona seguía a una nueva vida.
```

### ON04 · Quinto Sol · voz sugerida: Iapetus

Estilo:

```
Eres Tonatiuh, un caminante del valle de Teotihuacan, en México, de unos veinticinco años, que conoce cada piedra de las pirámides del Sol y de la Luna y ha recorrido las selvas mayas. Cuentas los mitos de tu tierra a niños y niñas de 10 a 14 años, con voz clara, joven y entusiasta. Te maravillas con Quetzalcóatl y el Quinto Sol, bajas la voz con Tezcatlipoca y te ríes con la astucia de los Gemelos. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Quetzalcóatl: «ket-sal-KÓ-atl». Tezcatlipoca: «tes-ka-tli-PÓ-ka». Ixchel: «ish-CHÉL». Itzamná: «its-am-NÁ». Hunahpú: «u-na-PÚ». Ixbalanqué: «ish-ba-lan-KÉ». Xibalbá: «shi-bal-BÁ». En k’iche’ marca el pequeño corte de la voz: «ki-CHÉ».
```

Texto:

```
<gasp> Quetzalcóatl. Para los pueblos de Mesoamérica, la serpiente emplumada se asociaba al viento, al saber y a la creación. El mito mexica cuenta que dio el maíz a los humanos.

<whispers> Tezcatlipoca. Dios mexica de la noche y de los cambios, con un espejo de obsidiana humeante. En los mitos, él y Quetzalcóatl son las dos caras de la creación.

<chuckle> Los Gemelos Héroes. En el Popol Vuh, libro de los mayas k’iche’, Hunahpú e Ixbalanqué vencen a los señores de Xibalbá con astucia y el juego de pelota. Al final se vuelven el sol y la luna.

Ixchel. Diosa maya de la luna, el tejido y la medicina, protectora de las madres y las parteras. Su santuario estaba en la isla de Cozumel.

Itzamná. Uno de los dioses principales de los mayas, asociado al cielo y a la sabiduría. La tradición le atribuye la escritura y el calendario.

Teotihuacan. Gran ciudad de México con las pirámides del Sol y de la Luna. Los mexicas la encontraron abandonada, le pusieron ese nombre y contaban que allí nació el Quinto Sol.

<gasp> La leyenda de los Cinco Soles. Los mexicas contaban que el mundo había tenido cuatro soles, o eras, antes del actual. Según el relato, el quinto nació en Teotihuacan.
```

### ON05 · Yōkai · voz sugerida: Leda

Estilo:

```
Eres Aiko, una joven peregrina japonesa de unos veinte años que ha caminado por los bosques y templos que rodean el monte Fuji. Cuentas los relatos de tu tierra a niños y niñas de 10 a 14 años, con voz juvenil, curiosa y traviesa. Te asombras con la Kitsune, susurras cuando pasan los yōkai, te ríes con el Kappa y celebras a Momotarō. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Yamata no Orochi: «ya-MA-ta no o-RO-chi». Kitsune: «KI-tsu-ne». Tengu: «TEN-gu». Kappa: «KAP-pa». Momotarō con la última «o» larga. Yōkai: «YOO-kai», con la primera «o» larga. Minamoto no Yoshitsune: «mi-na-MO-to no yo-SHI-tsu-ne».
```

Texto:

```
<whispers> Yamata no Orochi. La gran serpiente de los relatos japoneses más antiguos. Fue vencida con astucia: la hicieron dormir antes de enfrentarla.

<gasp> La Kitsune de nueve colas. En el folclore de Japón, los zorros sabios ganan colas con los años. Con nueve, su magia es enorme, y sus llamas azules alumbran la noche.

El Tengu. Espíritus de las montañas japonesas, con alas y nariz larga. Una leyenda cuenta que enseñaron esgrima al joven guerrero Minamoto no Yoshitsune.

<chuckle> El Kappa. Criatura de los ríos japoneses, con caparazón y un plato de agua en la cabeza. Si hace una reverencia, pierde el agua y su fuerza.

<cheer> Momotarō. Cuento popular japonés. Momotarō viaja con un perro, un mono y un faisán, y juntos vencen a los ogros de una isla.

<sigh> El monte Fuji. Volcán de tres mil setecientos setenta y seis metros, símbolo de Japón y retratado por pintores y poetas durante siglos. Es Patrimonio de la Humanidad.

<whispers> El desfile de los cien yōkai. En el folclore japonés, ciertas noches los yōkai desfilan por las calles. Muchos pintores antiguos lo dibujaron en largos rollos de papel.
```

### ON06 · Jade · voz sugerida: Vindemiatrix

Estilo:

```
Eres Mei, una viajera de unos treinta y cinco años que ha recorrido las montañas Kunlun y los caminos de las antiguas caravanas de China. Cuentas los mitos de tu tierra a niños y niñas de 10 a 14 años, junto a un fuego y con una taza de té, con voz suave, amable y sabia. Te ríes con las travesuras de Sun Wukong, te asombras con el dragón de la lluvia y hablas de Chang'e con ternura. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Sun Wukong: «sun u-KONG». Hou Yi: «JOU yi». Nian: «NIÉN». Chang'e: «CHANG-é». Kunlun: «KUN-lun». Xuanzang: «SHUÉN-tsang».
```

Texto:

```
<laugh> Sun Wukong. Protagonista de Viaje al Oeste, novela china del siglo dieciséis. Tiene un bastón que cambia de tamaño y domina setenta y dos transformaciones.

<gasp> Long, el dragón de la lluvia. En China, el dragón es un ser bondadoso que gobierna las aguas, los ríos y la lluvia, y simboliza la buena fortuna.

Hou Yi. El mito chino cuenta que salieron diez soles a la vez y que el arquero Hou Yi derribó nueve para que la Tierra no se quemara.

<chuckle> Nian. Bestia de las leyendas chinas que aparecía en Año Nuevo. Por eso, según la tradición, se adorna con rojo y se lanzan petardos.

<sigh> Chang'e. Según el mito chino, bebió el elixir de la inmortalidad y subió a vivir a la luna junto a un conejo de jade. Se la recuerda en la Fiesta de Medio Otoño.

<whispers> Las montañas Kunlun. En los mitos chinos, en estas montañas vivía la Reina Madre del Oeste, que cuidaba un jardín de duraznos de la inmortalidad.

El Viaje al Oeste. Novela china del siglo dieciséis. El monje Xuanzang viaja a la India en busca de libros, protegido por Sun Wukong y otros compañeros.
```

### ON07 · Tradiciones vivas · voz sugerida: Sadaltager

Estilo:

```
Eres Tomás, un peregrino de unos sesenta años que ha caminado desde los monasterios de Europa hasta las ciudades de la India, guardando en su libreta las historias de cada lugar. Cuentas estas tradiciones a niños y niñas de 10 a 14 años con voz sabia, pausada y cariñosa, con el respeto de quien habla de algo que muchas personas viven hoy. Te alegras con Diwali, sonríes con San Nicolás y te asombras con la valentía de Savitri. Habla en español latinoamericano neutro y claro: no imites el acento de otro idioma ni hagas voces de estereotipo; lo que muestra de dónde eres es lo que cuentas y cómo lo vives. Di los nombres propios de tu tierra como se pronuncian en su idioma, con naturalidad y sin exagerar. Ritmo pausado, de relato. Lee cada párrafo por separado y deja un silencio de dos segundos entre un párrafo y el siguiente. Pronunciación: Asís con acento al final. Hildegarda de Bingen: «BIN-guen». Savitri: «SA-vi-tri». Mahabharata: «ma-ja-BA-ra-ta». Diwali: «di-UA-li». Diyas: «DI-yas». Panchatantra: «pan-cha-TAN-tra». Jainistas y sijs como en español.
```

Texto:

```
<sigh> San Francisco de Asís. Fraile italiano del siglo trece que vivió con sencillez y cuidó a pobres y enfermos. Se lo recuerda por su amor a los animales y a la naturaleza.

<chuckle> San Nicolás de Mira. Obispo del siglo cuatro en Mira, en la actual Turquía. Se cuenta que daba regalos sin que nadie lo supiera. De su historia nació el Viejito Pascuero.

Hildegarda de Bingen. Abadesa alemana del siglo doce. Compuso música, escribió sobre plantas y medicina, y fue una de las sabias más importantes de la Edad Media.

Los monjes copistas. En los monasterios medievales, los monjes copiaban libros a mano. Así se conservaron muchas obras griegas y romanas, entre ellas relatos de sus dioses.

<gasp> Savitri. Heroína de un relato del Mahabharata, el gran poema épico de la India. Siguió a la muerte y, con inteligencia y constancia, logró que le devolviera a su esposo.

<cheer> Diwali, la fiesta de las luces. Una de las fiestas más importantes de la India. Se encienden lámparas de aceite, las diyas, por el triunfo de la luz sobre la oscuridad. La celebran hindúes, jainistas y sijs.

<chuckle> Las fábulas del Panchatantra. Colección de fábulas de la antigua India en que animales astutos enseñan a pensar y a elegir bien. Muchas viajaron hasta Europa.
```

## 5. La Cronista, con más vida (C)

Se vuelven a grabar **todas** las frases de La Cronista (C01–C24), más dos nuevas para el día y la noche (C25 y C26). El texto de cada frase queda igual, porque es el mismo que aparece en su globo; lo que cambia es la actuación.

### Cómo usarlo

1. En AI Studio, generación de voz, un solo hablante, con la misma voz de La Cronista de siempre.
2. Pega el estilo nuevo en **instrucciones de estilo**.
3. Pega **una frase por audio**. Donde dice `<cheer>`, `<gasp>`, etc., borra la marca, escribe `<` en ese lugar y elige la expresión del menú. Si una no aparece, usa la más parecida.
4. Junto a cada frase va una nota de cómo decirla. Si la primera toma sale plana, puedes agregar esa nota al final del estilo.
5. Guarda cada audio con su número: `C01.wav` … `C26.wav`.

### Estilo nuevo

```
La Cronista: mujer latinoamericana de unos treinta años, guía de un juego de cartas de Historia para niños y niñas de 10 a 14 años, que adora la historia y lo demuestra. Habla en español latinoamericano neutro, cercana y cómplice, como una guía de museo muy simpática que juega junto a los niños. Sonríe al hablar y se nota. Varía mucho la entonación: se sorprende de verdad, celebra con alegría los logros, baja la voz para dar pistas o advertencias y vuelve a subirla para animar. Energía alta pero sin gritar, ritmo ágil y muy claro, con pequeñas pausas antes de lo importante. Nunca suena a locutora leyendo: suena a alguien que está mirando la partida en ese momento.
```

### Frases

**C01** · acogedora, invitando a empezar

```
<chuckle> Elige un Protagonista de tu mano y ponlo como activo: es quien combate. Conviene uno con buena resistencia.
```

**C02** · cómplice, la última frase como advertencia seria pero cariñosa

```
Pon Protagonistas en tu reserva, hasta tres. <whispers> Si tu activo cae y no tienes reserva, pierdes la partida.
```

**C03** · un segundo de pena y enseguida ánimo

```
<sigh> Tu activo cayó. Elige quién de tu reserva pasa al frente: mira su resistencia y contra quién tiene ventaja.
```

**C04** · emocionada, como quien anuncia un juego

```
<cheer> ¡Línea de tiempo! Pon la carta en su lugar: lo más antiguo va a la izquierda. <chuckle> Si aciertas, tu activo gana uno de Saber.
```

**C05** · clara y paciente, como un buen consejo

```
Cada turno ganas uno de Saber. Toca un Protagonista para dárselo: las acciones necesitan Saber, <chuckle> y no se pierde al atacar.
```

**C06** · tranquila, con una sonrisa: todavía no hay prisa

```
<chuckle> En el primer turno de la partida no se puede atacar. Prepara tu mesa: baja Protagonistas o juega cartas, y luego pasa el turno.
```

**C07** · alarma breve y luego un consejo rápido

```
<gasp> ¡Ojo! El activo rival tiene ventaja sobre el tuyo: te hará el doble de daño. Podrías retirar a tu activo.
```

**C08** · entusiasta, contagiando confianza

```
<cheer> ¡Tu activo tiene ventaja! <chuckle> Contra este rival, sus acciones hacen el doble de daño.
```

**C09** · asombro, como quien descubre algo

```
<gasp> ¡Puedes evolucionar! Una Etapa dos muestra cómo algo cambió en la historia, y es más fuerte. Toca la carta que brilla en tu mano.
```

**C10** · curiosa, contando un dato interesante

```
Tienes un Personaje: una persona real de la historia. <chuckle> Su efecto ocurre al instante, y puedes jugar solo uno por turno.
```

**C11** · como quien abre un telón

```
Tienes un Lugar: cambia el escenario y da una ventaja mientras esté en juego. <whispers> Si el rival juega otro, el tuyo se va.
```

**C12** · orgullosa, como profesora que presenta a su curso

```
<chuckle> Las cartas Aula muestran buenas prácticas de una sala de clases. Te ayudan, y puedes jugar una por turno.
```

**C13** · urgente pero sin asustar

```
<gasp> ¡Cuidado! Tu activo puede caer en el próximo ataque. Retirarlo cuesta Saber, pero salva al Protagonista.
```

**C14** · animando a pasar a la acción

```
<cheer> Ya puedes usar una acción: los botones junto a tu activo. Al atacar se termina tu turno, así que primero juega tus cartas.
```

**C15** · admirada, felicitando a quien pensó bien

```
<gasp> ¡Una conexión entre causa y consecuencia! <cheer> Por entender cómo se relacionan los hechos, tu activo gana uno de Saber.
```

**C16** · celebración grande

```
<cheer> ¡Ganaste un Hito por derrotar a un Protagonista rival! <chuckle> Los Hitos son los puntos: el primero en reunir los necesarios gana.
```

**C17** · orgullosa y cálida

```
<laugh> ¡Muy bien ubicada en tu línea de tiempo! Ordenar los hechos en el tiempo es pensar como historiador.
```

**C18** · comprensiva, y luego decidida

```
<sigh> Perdiste un Protagonista y el rival gana un Hito. Elige bien quién sigue: busca a quien tenga ventaja.
```

**C19** · en secreto, como contando un truco

```
<whispers> Te doy una pista: mira lo que brilla en la mesa.
```

**C20** · pensativa, dando tiempo para pensar

```
<whispers> Piensa en las fechas que ya tienes en tu línea. Lo más antiguo va a la izquierda.
```

**C21** · intrigada, invitando a observar

```
<whispers> Ahora juega el rival. <chuckle> Mira qué hace: así también se aprende.
```

**C22** · amable y práctica

```
Juega cartas de tu mano, <chuckle> las que brillan se pueden usar, o toca Pasar turno.
```

**C23** · fiesta: risa y felicitación

```
<laugh> ¡Ya sabes jugar! Gana quien consigue tres Hitos, derrotando Protagonistas. <cheer> Sigue jugando o vuelve al menú.
```

**C24** · expectante, bajando la voz

```
<whispers> Ahora juega la tablet. Mira con atención.
```

**C25** · misterio: la luz se apaga

```
<whispers> ¡Cae la noche! Mientras dure, las cartas de sombra hacen diez puntos más de daño.
```

**C26** · alegría: sale el sol

```
<cheer> ¡Llega el día! Ahora son las cartas de luz las que hacen diez puntos más de daño.
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

## 8. Minijuego de geografía (F, hecho)

En el modo libre, con «Línea de tiempo y mapa» encendida, los Personajes, Acontecimientos y Lugares de las expansiones se sitúan en el mapa: el mundo para el Ocaso y Chile para «Fin del Mundo». Si se acierta, el activo gana +1 de Saber. Las cartas de la tradición cristiana se preguntan con 3 alternativas.

Los mapas están dibujados por código con datos de Natural Earth (dominio público), así que no hay que generar nada.

El diseño está en `docs/superpowers/specs/2026-11-25-minijuego-geografia-design.md`.
