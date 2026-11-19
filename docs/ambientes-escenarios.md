# Ambientes sonoros de los escenarios (Freesound)

Cada uno de los 14 escenarios suena con un fondo suave en bucle mientras su Lugar está en juego. Al cambiar de escenario, un sonido se funde con el siguiente. Cuando habla un Personaje o el narrador, el fondo baja, y con el botón de sonido apagado no suena.

## Cómo buscar en freesound.org

1. Crea una cuenta gratuita en freesound.org: se necesita para descargar.
2. Busca con las palabras de la tabla. Freesound está casi todo en inglés, así que busca en inglés.
3. En los filtros, elige **Licencia: Creative Commons 0** (CC0). Con CC0 no hay que dar créditos. Si un sonido CC BY te gusta mucho, también sirve, pero envíame su enlace para ponerlo en los créditos. **No uses sonidos con licencia «Attribution NonCommercial» (BY-NC).**
4. Filtra por **duración de más de 30 segundos**. El juego usa hasta 75 segundos por ambiente; un clip más largo se recorta.
5. Escucha el sonido entero antes de descargar. Descarta los que tengan:
   - ruidos modernos en escenarios históricos: motores, autos, aviones, teléfonos, música de radio;
   - voces que se entiendan (conversaciones, insultos, gritos);
   - golpes fuertes, saltos de volumen o música.
6. Descarga el original (WAV, FLAC o MP3), sin conversiones, y renómbralo con el código del escenario: `E01.wav`, `E02.mp3`… Son los mismos códigos que usamos para las imágenes.
7. Envíame los archivos junto con el **enlace de cada sonido** (la página de Freesound). El enlace queda guardado como respaldo de la licencia.

## Qué buscar en cada escenario

| Código | Escenario | Buscar (en inglés) | Debe sonar a |
|---|---|---|---|
| E01 | Puerto de Sevilla (s. XVI) | `harbor ambience wooden ship`, `seagulls harbour creaking` | Puerto antiguo: gaviotas, madera que cruje, agua contra el muelle, gente lejos |
| E02 | Cordillera de los Andes (5°) | `mountain wind ambience`, `high altitude wind` | Viento de altura, amplio y tranquilo |
| E03 | La escuela | `school playground ambience`, `school hallway ambience` | Recreo o pasillo lejano, sin palabras que se entiendan |
| E04 | Cordillera de los Andes (1817) | `mountain pass wind snow`, `blizzard wind mountain` | Viento frío y más duro que en E02: el cruce del Ejército de los Andes |
| E05 | Puerto de Valparaíso (s. XIX) | `sailing ship rigging harbor`, `harbor bell waves` | Puerto con veleros: jarcias, campana de barco, olas |
| E06 | Municipio | `town square ambience`, `town hall lobby ambience` | Plaza o hall con gente, tranquilo |
| E07 | Creciente Fértil | `river reeds birds ambience`, `marsh river wind` | Río con juncos, pájaros, brisa cálida |
| E08 | Mar Mediterráneo | `calm sea waves shore`, `rowing boat oars water` | Mar calmo, olas suaves, remos |
| E09 | Camino del Inca | `andes highland wind birds`, `mountain stream wind` | Altura andina: viento, agua que corre, pájaros |
| E10 | Tenochtitlan | `lake water reeds birds`, `canoe paddle water` | Lago con canoas, agua y aves |
| E11 | Palacio de Versalles | `palace garden fountain`, `large hall room tone` | Jardín con fuentes o gran salón silencioso, sin música |
| E12 | Océano Atlántico | `ship at sea creaking waves`, `open ocean sailing ship` | Alta mar: casco que cruje, olas grandes, viento en las velas |
| E13 | Salones ilustrados | `fireplace crackling room`, `quiet room murmur` | Salón íntimo: chimenea, murmullo bajo, quizás un reloj |
| E14 | Carretera Austral | `patagonia wind forest`, `rainforest rain birds` | Bosque del sur: lluvia suave, río, pájaros, sin tráfico |

E02 y E04 son la misma cordillera en momentos distintos. Busca dos sonidos diferentes para que se distingan.

## Qué hago yo con los archivos

Los convierto con `gen/ambientes.py`, que:

- recorta cada sonido a 75 s como máximo;
- empareja el volumen de todos;
- funde el final con el comienzo para que el bucle no se note;
- los guarda en `audio/ambientes/` y los registra en `data/ambientes.json`, con la licencia, el autor y el enlace.

Cada ambiente pesa unos 500 KB y funciona sin internet, como el resto del juego.
