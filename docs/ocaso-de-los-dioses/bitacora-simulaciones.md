# Bitácora de simulaciones · El Ocaso de los Dioses

*25 de noviembre de 2026. Partidas tablet contra tablet con el motor real del juego.*

## Resumen

- **La expansión ya está en el motor**, oculta en los menús. Tiene sus 49 cartas, el ciclo de día y noche, sus 3 Duelos, sonidos e íconos. Aparecerá cuando su arte esté en el juego.
- **Se simularon más de 60.000 partidas** en tres niveles de la tablet: Aprendiz, Historiador y Erudito.
  - Duelos temáticos: 3.000 por Duelo con Historiador, 1.000 con Erudito y 2.000 con Aprendiz.
  - Panteones entre sí: 600 por par.
  - Modo libre con mazos completos: 1.000 por par, con y sin línea de tiempo.
  - Todos los arquetipos de cursos y expansiones contra todos: 60 por par.
- **Se encontraron 4 errores y se arreglaron.** Dos eran de la expansión y dos afectaban también a los cursos.
- **Los tres Duelos quedaron cerca del 50 %.** «Los Hijos del Sol» depende del nivel: el Nilo gana algo más contra la tablet Historiador y algo menos contra la Erudito.
- Al final hay **7 preguntas** que debes decidir tú.

## 1. Errores encontrados y arreglados

| # | Error | Qué pasaba | Arreglo |
|---|---|---|---|
| E1 | **Ronda de ventajas mal armada** | Cada Duelo enfrentaba a dos panteones vecinos en la ronda. Por eso uno le hacía doble daño al otro. | La ronda quedó Olimpo → Nilo → Yōkai → Asgard → Quinto Sol → Jade → Olimpo. Así los rivales de cada Duelo quedan opuestos, como en «Fin del Mundo». Se actualizaron el diseño y las frases de ventaja. |
| E2 | **Partidas que no terminaban** | Entre el 5 y el 8 % de los Duelos no terminaba. Con dos copias de «Los monjes copistas», cada una devolvía a la otra a la mano y se podían jugar sin fin. Lo mismo podía pasar en 7° con dos «Escritura jeroglífica». | «Recuperar» trae la última carta del descarte **que no recupere a su vez**. El texto de la carta lo dice. Ahora el 100 % de las partidas termina. |
| E3 | **La tablet perdía Saber al cambiar de activo** | Con «Las fábulas del Panchatantra» (y con Magallanes en 5°), la tablet primero le daba el Saber al activo y después lo cambiaba. El Saber se iba a la reserva. | Ahora cambia primero y le da el Saber al que entra. Además, solo cambia si el de la reserva está en mejor estado. |
| E4 | **La tablet miraba solo el primer efecto** | En las cartas con dos efectos, por ejemplo «El Ragnarök» (noche y daño a todos), ignoraba el segundo. | Revisa todos los efectos. Si uno es de ciclo, juega la carta cuando la fase nueva no la perjudica. |

Las 596 pruebas automáticas pasan. Se sumaron pruebas del ciclo, de los datos de la expansión, de «Recuperar» y de los sonidos.

## 2. Duelos temáticos

**Porcentaje de victorias del primer bando** (el que aparece a la izquierda).

| Duelo | Al empezar (ronda ya corregida) | Final, Historiador | Final, Erudito | Final, Aprendiz |
|---|---|---|---|---|
| El Trueno contra el Rayo (Olimpo vs Asgard) | 53,0 · 5 % sin terminar | **51,5** | 44,7 | 45,4 |
| Los Hijos del Sol (Nilo vs Quinto Sol) | 62,7 · 8 % sin terminar | **57,8** | 46,0 | 35,4 |
| El Día y la Noche (Yōkai vs Jade) | **15,4** | **48,1** | 50,2 | 55,4 |

**Ajustes que llevaron a estos números:**
- **Reparto de las tradiciones vivas.** Se buscó el que deja los tres Duelos más cerca del 50 %, sin cambiar cuántas veces aparece cada carta:
  - Olimpo: Savitri, Hildegarda y Monjes copistas.
  - Asgard: San Francisco, Savitri y Panchatantra.
  - Nilo: San Francisco, San Nicolás y Diwali.
  - Quinto Sol: Hildegarda, Savitri y Monjes copistas.
  - Tierra de Yōkai: San Francisco, San Nicolás y Panchatantra.
  - Reino de Jade: San Nicolás, Hildegarda y Diwali.
- **Las fábulas del Panchatantra:** ahora cambia de activo sin costo **y roba 1 carta**, igual que Magallanes en 5°. Sola era la carta más débil: bajaba a su bando casi 25 puntos.
- **Se probaron y descartaron:**
  - «El juicio de Osiris» con curación 20: deja el Duelo en 53 % con Historiador, pero en 35 % con Erudito.
  - Itzamná con 2 de Saber al entrar: no cambia nada.
  - Teotihuacan con +20: rompe la plantilla de Lugares.

**Por qué «El Día y la Noche» estaba en 15 %.** No era el ciclo: sin él daba lo mismo. Era el paquete de apoyo. Panchatantra, mal usado por la tablet (E3), hundía a los Yōkai.

## 3. El ciclo de día y noche en juego

- **Ataques con +10:** el 51 % de los ataques recibe el bonus del ciclo. De esos, el 64 % son de luz y el 36 % de sombra, porque hay 18 Protagonistas de luz y 12 de sombra.
- **Relatos de ciclo:** se juegan 0,7 por partida en promedio (Ragnarök, Desfile, Cinco Soles y Diwali).
- **Quién parte:** sin el ciclo, la ventaja de quien parte es la misma. **El ciclo no la causa**, así que no hace falta empezar al atardecer.
- **Largo de las partidas:** 13 a 15 turnos con Historiador, como «Fin del Mundo», y 19 a 21 con Erudito.

## 4. Cartas una por una

**Ninguna se desvía más de 5 puntos del promedio de su bando**, salvo las tres de abajo. Medí el porcentaje de victorias cuando el bando tuvo la carta en la mano, frente al promedio del bando.

- **Lugares (+6 a +9):** es normal. Se ven más en partidas largas y hay solo uno por mazo.
- **Savitri (+5,6) y El desfile de los cien yōkai (+7,4):** algo fuertes, pero sin romper nada. Conviene revisarlos de nuevo con niños jugando.
- **Cartas de 60 de resistencia con un ataque de 1·20** (Medusa, Bastet, Chang'e, Itzamná y Heimdall): pegan poco, de 6 a 19 de daño por partida jugada. No es un error: valen por su habilidad (robar, Saber, resistir) y sirven de reserva.

## 5. Panteones fuera de sus Duelos

Cada panteón jugó contra los otros cinco con su núcleo.

- **Con ventaja ×2:** quien la tiene gana entre el 94 y el 99 %. Es la misma regla de los cursos, solo que con mazos de una sola fuerza. Por eso los Duelos enfrentan opuestos.
- **Sin ventaja:** los resultados van del 41 al 64 %.

Hoy el juego no ofrece panteón contra panteón fuera de los Duelos. Si algún día se agrega, habría que limitarlo a pares sin ventaja.

## 6. Modo libre: mazos completos

1.000 partidas por par, con la línea de tiempo activada, como viene en el juego. Cada valor es el **% de victorias de la fila** frente a la columna.

| | 5° | 6° | 7° | 8° | Fin del Mundo | Ocaso | Media |
|---|---|---|---|---|---|---|---|
| **5°** | – | 34,7 | 39,5 | 34,4 | 50,6 | 38,7 | **39,6** |
| **6°** | 65,3 | – | 56,2 | 53,5 | 72,5 | 64,8 | **62,5** |
| **7°** | 60,5 | 43,8 | – | 47,6 | 62,7 | 51,8 | **53,3** |
| **8°** | 65,6 | 46,5 | 52,4 | – | 66,1 | 61,9 | **58,5** |
| **Fin del Mundo** | 49,4 | 27,5 | 37,3 | 33,9 | – | 42,0 | **38,0** |
| **Ocaso** | 61,3 | 35,2 | 48,2 | 38,1 | 58,0 | – | **48,2** |

- **El Ocaso queda en el medio:** 48 %.
- **Lo más desparejo viene de antes:** 6° es el más fuerte (62 %). 5° y «Fin del Mundo» son los más débiles (38 a 40 %).
- **La línea de tiempo** les suma a los cursos 2 a 4 puntos contra las expansiones. Sus cartas no tienen fecha, así que el lado de la expansión nunca gana ese Saber extra. Sin línea, el Ocaso sube a 50,7 % y «Fin del Mundo» a 40,3 %.
- **Arquetipos todos contra todos** (60 partidas por par, más ruidoso):
  - Pelucones (6°) es el más fuerte: 61 %.
  - Los bandos de 5° y Cielo y Viento y Bosque y Noche («Fin del Mundo») son los más débiles: alrededor de 40 %.
  - Los seis panteones del Ocaso quedan entre 47 y 54 %.

## 7. Otros cambios hechos

- **Sonidos** (`audio/sfx/`):
  - una invocación para cada panteón:
    - Olimpo: rayo, lira y bronces;
    - Asgard: cuerno, yunque y tambor;
    - Nilo: sistro, arpa y caña;
    - Quinto Sol: caracola, tambores y flauta de barro;
    - Yōkai: taiko, campana de templo y flauta de bambú;
    - Jade: gong, guzheng y campanitas;
  - otra para las tradiciones vivas (coro suave y campanitas);
  - el amanecer y el anochecer.
- **Animaciones de invocación por panteón:**
  - Olimpo: un rayo;
  - Asgard: un martillo con chispas;
  - Nilo: el ojo de Horus sobre una pirámide;
  - Quinto Sol: una serpiente con plumas;
  - Yōkai: un zorro y fuegos azules;
  - Jade: un dragón entre nubes;
  - tradiciones vivas: lámparas diya.
- **Medallones** de los seis panteones (`img/iconos/`). El rayo, el martillo, el ojo y el zorro quedaron bien; la serpiente y el dragón son provisionales.
- **En la mesa:**
  - de noche, el escenario se oscurece hacia el azul;
  - la bitácora de la partida avisa «Cae la noche» y «Llega el día»;
  - el desglose del daño dice «+10 de día» o «+10 de noche».
- **Textos:** las cartas de las tradiciones vivas dicen «Quién fue» o «Qué es», en vez de «De dónde viene».

## 8. Preguntas para decidir

1. **Ventaja de quien parte en «El Trueno contra el Rayo»:** 59 % con Historiador y 64 % con Erudito, frente al 52 % de «Fin del Mundo». No viene del ciclo. ¿Lo dejamos así, o probamos que en el Ocaso quien parte segundo empiece con +1 de Saber?
2. **Línea de tiempo entre un curso y una expansión:** hoy solo la aprovecha el curso. ¿La apagamos sola cuando un lado es expansión, como ya pasa cuando los dos lo son?
3. **5° y «Fin del Mundo» quedan débiles en el modo libre** (38 a 40 %). Dentro de su propio curso no importa, porque los dos juegan con el mismo mazo. ¿Los reforzamos para el modo libre, o lo dejamos?
4. **Duelo de 5° «Conquistadores contra Pueblos originarios»:** ya estaba en 45 %. Con el arreglo de la tablet (E3) quedó en 43 %. ¿Lo reviso ahora o después?
5. **Medallones de la serpiente y el dragón:** ¿te preparo un prompt para generarlos con IA, o te sirven los provisionales?
6. **Para mostrar la expansión en el menú faltan:**
   - el arte en el juego (cuando el otro chat termine de mejorarlo);
   - los marcos por panteón, sacados de la lámina;
   - el sol o la luna en cada carta y en la franja central;
   - el narrador grabado en AI Studio;
   - los ambientes de cada Lugar.

   ¿Sigo con eso cuando estén las imágenes?
7. **Sonidos:** los hice sin poder escucharlos; solo revisé niveles y duración. Te dejé `sonidos-ocaso.mp3` con los nueve seguidos, en este orden: Olimpo, Asgard, Nilo, Quinto Sol, Yōkai, Jade, tradiciones, amanecer y anochecer. ¿Cuál cambiarías?

## 9. Lo que decidimos (25 de noviembre)

- **Pregunta 3, reforzar 5° y «Fin del Mundo»:** todos los protagonistas de los dos mazos tienen +10 de resistencia.
  - En el modo libre, 5° sube de 40 % a 50 %, y «Fin del Mundo» de 38 % a 46 %.
  - Con +20 se pasaban (56 % y 54 %).
  - El Ocaso queda en 42 % en el modo libre. No lo toqué: +5 no cambia nada, porque el daño va de 10 en 10, y +10 lo subía a 55 %. Se ajusta antes de lanzarlo.
  - Duelos de «Fin del Mundo»: 52 % y 46 %.
- **Pregunta 4, duelo «La Conquista de Chile»:**
  - **Causa:** cambiar el núcleo no movía nada, porque el mazo lleva solo 3 personajes y 3 acontecimientos. Los conquistadores tienen cuatro personajes que solo buscan protagonistas, mientras que los pueblos originarios llevan Lautaro (+20 de daño), Caupolicán y Curalaba, que pegan directo.
  - **Arreglo:**
    - Pedro de Valdivia: además de buscar, da +10 de daño.
    - Diego de Almagro: busca entre las 3 primeras cartas, en vez de 4, y da +1 de Saber.
    - Fundación de ciudades: además de buscar, el activo recupera 20.
  - **Resultado** (2000 partidas): 43 % → 50 %. «La Colonia» sube de 54 % a 57 %, y «Norte y Sur» queda en 52 %.
- **Test:** `sintonia.test.js` leía el primer número del texto como lo que cura. Fallaba con cartas que buscan y curan a la vez. Ahora busca el número del efecto en el texto.

## 10. Ventaja de quien parte en «El Trueno contra el Rayo» (25 de noviembre)

Se probó si alguna carta, por sí sola, causa la ventaja. Con 1000 partidas por prueba:

| Prueba | Historiador | Erudito |
|---|---|---|
| Hoy | 58 % | 64 % |
| +10 de resistencia a Olimpo y Asgard | 56 % | 66 % |
| Sin habilidades (Atenea, Loki, Heimdall) | — | 64 % |
| Asgard con más luz o más sombra | 59 % | 61–64 % |
| La Odisea también trae el día | 58 % | 63 % |
| Sin ciclo de día y noche | — | 58 % |
| Otro paquete de apoyo para Asgard (San Nicolás, Hildegarda, Diwali) | 54 % | 56 % |

**Lectura:**
- La ventaja no viene de una carta. Viene de que los dos mazos son espejos, con las mismas resistencias, los mismos costos y los mismos aspectos.
- En un espejo, quien derriba primero gana el 71 % de las veces, y quien parte derriba primero el 70 %.
- El ciclo suma unos 5 puntos con la tablet Erudita.
- Cambiar el paquete de apoyo de Asgard baja la ventaja a 54–56 %. Pero desequilibra el duelo: Olimpo queda en 39–45 %, y para compensarlo habría que reforzar a Olimpo.

**Minijuego de geografía en el modo libre:** los mazos completos quedan más parejos:

| Mazo | Antes | Ahora |
|---|---|---|
| 5° | 50 % | 47 % |
| 6° | 59 % | 54 % |
| 7° | 48 % | 44 % |
| 8° | 55 % | 51 % |
| Fin del Mundo | 46 % | 52 % |
| Ocaso | 42 % | 51 % |

La distancia entre el mazo más fuerte y el más débil baja de 17 a 10 puntos.
