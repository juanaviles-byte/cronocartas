# Revisión de interfaz · 19 de noviembre de 2026

Revisión hecha sobre la app en funcionamiento, en celular vertical (390 × 844), celular horizontal (844 × 390), tablet horizontal (1280 × 800), tablet vertical (800 × 1280) y computador (1440 × 900).

## Para qué es cada pantalla

- **Inicio:** entrar a jugar, o seguir jugando, con un toque.
- **Jugar:** elegir cómo jugar (rival, mazo, curso o expansión) y empezar, con la menor cantidad de decisiones.
- **Mesa:** jugar. Siempre se debe saber, de un vistazo, de quién es el turno, qué puede hacer el activo propio y qué hay en juego (Lugar y tablero).

## Hay que arreglar

1. **La mesa no funciona en un celular vertical.** Las cartas se montan sobre los paneles y no se puede jugar. Los juegos de cartas para celular eligen una sola orientación. Arreglo: en la mesa, si el celular está vertical, mostrar un aviso de «Gira el teléfono»; el inicio y los menús siguen funcionando en vertical.
2. **La mesa en un celular horizontal está apretada.** El globo de la Cronista tapa el «Tu turno», las cartas de la mano son diminutas y «Pasar turno» queda cortado abajo. Arreglo: un modo compacto para pantallas bajas (menos de 520 px de alto), con textos secundarios ocultos, botones y mano a la medida, y nada fuera de la pantalla.
3. **El globo de la Cronista y el cartel «Tu turno» se pisan** en todas las pantallas. Arreglo: el globo espera a que el cartel termine.
4. **La casilla del Lugar es una pastilla de 30 px** («Lugar») entre la regla del tablero y el «Tu turno». No se ve qué Lugar hay ni qué hace. Arreglo: una casilla con forma de carta en la franja central, con la ilustración del Lugar en juego, su nombre y su efecto. Vacía, que se vea como una casilla para cartas. Así lo hacen Hearthstone y Legends of Runeterra con el campo de juego: cada cosa en juego tiene su sitio visible.

## Conviene arreglar

5. **El inicio no se ve como un juego.** Es un menú oscuro alineado a la izquierda, con un gran vacío al lado y nada del arte del juego. Arreglo: un fondo con el arte de Cronocartas (escenarios), el logo grande, «Jugar» como acción principal y el resto del menú como fichas con ícono.
6. **Jugar se ve como un formulario web.** Las opciones son pastillas oscuras iguales. En celular, «Empezar» queda muy abajo y hay que desplazarse para encontrarlo. Arreglo: opciones como fichas con ícono, cursos con su color, y una barra inferior fija con un resumen de lo elegido y el botón «Empezar», siempre visible.
7. **La tablet vertical desaprovecha el alto.** Sobran franjas vacías arriba y abajo, y la mano queda pequeña. Arreglo: en vertical, cartas y mano más grandes.

## Detalles

8. En la mesa se mezclan una tipografía con serifa (en las etiquetas) y la sin serifa del resto, sin un criterio claro.
9. El texto «Reserva» de las casillas vacías tiene poco contraste. Es aceptable porque solo indica dónde va una carta.

## Lo que ya funciona bien

- Los tableros como fichas con imagen en la pantalla Jugar.
- Las cartas: jerarquía clara, costo y daño legibles, colores por dimensión y por fuerza.
- La mesa en tablet horizontal y computador: el activo, las acciones y el mazo se leen bien.
