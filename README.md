# Cronocartas · Duelo de Historia

Juego de cartas digital de Historia, Geografía y Ciencias Sociales para **5° a 8° básico**. Toma la mecánica de los juegos de cartas coleccionables y la llena con contenido de las Bases Curriculares y el Marco para la Buena Enseñanza (MBE 2021).

Escuela Gabriela Mistral · Mostazal.

## Qué trae la versión 1

- **Mazos por curso:** de 25 a 27 cartas cada uno, en 4 unidades.
- **Cartas "Aula":** 7 cartas inspiradas en los estándares del MBE.
- **Modos de juego:** cara a cara en la misma tablet, contra la tablet y un tutorial guiado.
- **"¿Sabías que…?":** cada vez que cae una carta aparece un dato real de la unidad.
- **Colección:** todas las cartas por curso y unidad, para estudiar.
- **Banco de ideas:** los estudiantes crean sus cartas, con su propio dibujo, y el docente las aprueba.
- **Panel docente (con PIN):** aprobaciones, cobertura de OA y MBE, traspaso de cartas entre tablets y ajustes.
- **Funciona sin internet** después de abrirlo una vez.

## Novedades v1.1

- **Búsquedas visibles:** Planificación, Fundación de ciudades y Quipu muestran las 3 primeras cartas del mazo. El jugador elige qué Protagonista tomar.
- **Editor de cartas** (Panel docente → *Editar cartas*): el docente puede cambiar nombre, dato, poder y emblema de cualquier carta, y subirle una imagen (formato 4:3; se reduce a 640×480).
  - Las imágenes se guardan en el almacenamiento grande de la tablet (IndexedDB).
  - **Exportar ediciones** descarga un archivo `.json` (con imágenes). **Importar ediciones** lo carga en otra tablet.
- **Nuevo diseño de carta estilo TCG:** marco de color según el tipo, ventana de ilustración 4:3, acciones con íconos de Saber, debilidad ×2, retirada, dato y código de carta.

### Ilustraciones con IA

Las ilustraciones se generan con un prompt maestro: arte original, sin texto, formato 4:3 (1024×768) y paleta según el tipo de carta. Política es roja, Economía dorada, Sociedad azul, Cultura morada, Territorio verde, Acontecimiento gris pizarra, Lugar turquesa y Aula azul marino con dorado. Cada imagen se sube con el editor, o se integra al repositorio como `img/cartas/<código>.jpg`, agregando `"imagen": "img/cartas/<código>.jpg"` a la carta en su JSON.

## Instalar en una tablet Android

1. Con internet, abre la dirección del juego en **Chrome**.
2. Toca el menú **⋮** y luego **"Agregar a la pantalla principal"** (o **"Instalar app"**).
3. Aparece el ícono de Cronocartas, que se abre como una app.
4. Desde ese momento funciona sin internet. Cuando la tablet vuelva a tener conexión, descarga sola las mejoras: se ven la siguiente vez que se abre la app.

## Reglas en breve

- Cada jugador usa un mazo de 20 cartas, armado al azar con las cartas de su curso: 12 Protagonistas, 4 Acontecimientos, 2 Lugares y 2 cartas Aula.
- Cada uno pone 1 Protagonista **activo** y hasta 3 en la **reserva**.
- En cada turno se roba 1 carta y se recibe 1 de **Saber** para dárselo a un Protagonista.
- Las acciones necesitan Saber, pero no lo gastan. Retirarse sí cuesta Saber.
- **Dimensiones:** Política → Economía → Sociedad → Cultura → Territorio → Política. Cada una hace el doble de daño a la siguiente.
- Cuando cae un Protagonista, el rival gana 1 **Hito**. Gana quien llega a 3 Hitos (o 2, si se elige en los Ajustes) o quien deja al rival sin Protagonistas.
- Quien parte no puede atacar en su primer turno.

## Editar o agregar cartas

Las cartas están en `data/mazo-5.json` … `data/mazo-8.json` y las cartas Aula en `data/aula.json`. No hay que programar. Basta con copiar una carta parecida y cambiar sus datos:

```json
{
  "id": "CC-7-U2-008",
  "nombre": "Ciudadano ateniense",
  "tipo": "protagonista",
  "curso": 7, "unidad": 2,
  "dimension": "Politica",
  "resistencia": 70, "retirada": 1,
  "acciones": [{ "nombre": "Votar en la Asamblea", "costo": 2, "danio": 40 }],
  "dato": "En Atenas los ciudadanos votaban en la Asamblea…",
  "oa": "OA 6",
  "emblema": "urna"
}
```

- `tipo`: `protagonista`, `acontecimiento` o `lugar`.
- `dimension`: `Politica`, `Economia`, `Sociedad`, `Cultura` o `Territorio` (sin tildes).
- `evolucionaDe`: solo para cartas Etapa 2; lleva el `id` de la carta base.
- `emblema`: uno de los íconos de `js/ui/arte.js` (`corona`, `moneda`, `personas`, `pergamino`, `montana`, `barco`, `templo`, `escudo`, `libro`, `columna`, `piramide`, `campana`, `pluma`, `mapa`, `urna`, `balanza`, `tren`, `volcan`, `arbol`, `sol`, `maiz`, `casa`, `estrella`, `engranaje`, `ola`, `ancla`).

Antes de publicar un cambio, revisa los mazos con las pruebas:

```bash
npm test   # o: node --test tests/*.test.js
```

Las pruebas detectan errores como ids repetidos, dimensiones mal escritas o evoluciones sin su carta base. También juegan cientos de partidas automáticas para confirmar que siempre terminan y que están equilibradas.

**Para publicar una mejora:** sube la versión en `sw.js` (por ejemplo, de `cc-v1` a `cc-v2`) para que las tablets la descarguen. Si agregas archivos nuevos, súmalos a la lista de `sw.js`; la prueba `tests/sw.test.js` avisa si falta alguno.

## Cómo está construido

| Archivo | Qué hace |
|---|---|
| `js/motor.js` | Reglas del juego: recibe una jugada y devuelve el nuevo estado. No depende de la pantalla. |
| `js/ia.js` | El rival automático. |
| `js/mazos.js` | Revisa los mazos y arma un mazo equilibrado para cada partida. |
| `js/balance.js` | El "presupuesto de poder" de las cartas creadas por estudiantes. |
| `js/almacen.js` | Lo que se guarda en la tablet: banco de ideas, ajustes y partida en curso. |
| `js/compartir.js` | Códigos `CC1:` para mover cartas entre tablets (en el futuro, por QR). |
| `js/ui/*` | Pantallas: mesa, cartas, banco de ideas, panel docente. |
| `sw.js`, `manifest.webmanifest` | Instalación como app y uso sin internet. |

Se usa HTML, CSS y JavaScript simples, sin dependencias ni paso de compilación. Para probarlo en un computador:

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

## Mejoras futuras previstas

1. Preguntas opcionales (por ejemplo, responder bien da +1 de Saber).
2. Cartas físicas con QR que se escanean para jugar. Cada carta ya tiene un código único (por ejemplo, `CC-7-U2-008`).
3. Banco de ideas y partidas en línea, entre tablets.
4. Premios en SIU desde SIUBank.
5. Más cartas por unidad y mazos armados por cada estudiante.
6. Versión nativa en Unity: el motor se traduce a C# y reusa los mismos mazos JSON. Las pruebas del motor sirven para comprobar que la versión de Unity juega igual.
