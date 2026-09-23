# Árboles PA · Capacitación de campo

Presentación web interactiva (34 slides: las 30 del guion + 4 de novedades de la app) para enseñar al equipo operativo de Parques Alegres a registrar correctamente un árbol con **Árboles PA · Registro de Campo**.

Narrativa: **SENTIR → OBSERVAR → DESCUBRIR → USAR → PRACTICAR → DOMINAR**

## Cómo abrirla

1. Descomprime la carpeta.
2. Doble clic en `index.html` (Chrome o Edge recomendados).
3. Presiona `F` para pantalla completa.

No necesita internet ni instalación: las tipografías están incluidas en `assets/fonts/`.

## Controles

| Acción | Teclado | Táctil / ratón |
|---|---|---|
| Siguiente / anterior | `→` `←` · `Espacio` · `AvPág` `RePág` | Deslizar ← → · botones abajo a la derecha |
| Primera / última | `Inicio` / `Fin` | — |
| Ir a una slide | número + `Enter` (ej. `2` `3` `Enter`) | Índice |
| Pantalla completa | `F` | botón ⤢ |
| Índice de las 35 slides | `G` (`Esc` para cerrar) | botón ▦ |
| Notas del presentador | `N` | botón ☰ |
| Responder retos 11 y 27 | `A` `B` `C` | tocar opción |
| QR de la app en grande | `Q` (`Esc` o clic fuera para cerrar) | botón QR |
| Ocultar etiquetas de fotos pendientes | `H` | — |

La última slide (misión) avanza por partes (Misión → Después → Cierre → Regla) antes de terminar e incluye un temporizador de 10 minutos.
La dirección `index.html#12` abre directamente la slide 12.

## QR de la app

El QR abre `https://ecosistemicaconsultoria.github.io/arboles-pa/`. Se generó localmente (no depende de internet) y está en `assets/qr/`
(`qr-arboles-pa.svg` para pantalla y `qr-arboles-pa.png` para imprimir).

- **Slide 05 · Teléfono como herramienta:** tarjeta con el QR, 3 pasos (escanear, agregar a la pantalla de inicio, ajustar la letra) y el aviso “No guardes árboles hasta la Misión de campo”.
- **Slide 34 · Misión de campo:** QR pequeño para quien no alcanzó y la indicación de escribir **PRÁCTICA** en Observaciones, para separar esos registros en el CSV.
- **Tecla `Q`:** muestra el QR en grande en cualquier slide.

Antes de la sesión, confirma que la versión publicada en GitHub Pages es la más reciente (campo **Mes**). Al abrir la app una vez con internet
queda guardada en el teléfono y después funciona sin señal.

## Retos interactivos

- **11 · Reto 01**: opción única (correcta: B). Muestra si la respuesta es correcta o incorrecta, una explicación breve, el número de intentos y el botón Continuar.
- **29 · Reto 02**: lista de verificación con 6 respuestas correctas y 3 distractores (Protocolo —es opcional—, Observaciones y Señal de internet). Al acertar, la barra real de la app cambia a “Todo listo · presiona Guardar”. Va **después** de Fotografía y Observaciones, justo antes de Guardar: el reto pregunta por todo lo que ya se explicó.
- **27 · Reto 03**: elegir la foto que sirve como evidencia (correcta: C).

Los intentos se registran y aparecen en el índice (`G`).

Otras slides interactivas:
- **09 · Estabilizar:** el teléfono repite en bucle la carga del GPS con capturas reales (iniciando → acumulando lecturas → precisión lista).
- **13 · Contexto:** se toca cada campo de *Datos del registro* para ver si lo captura la persona o lo completa la app con el ID de Parque, con un ejemplo.
- **12 · ID del parque:** botones **Sí / No** para mostrar cómo se llena un sitio con ID de Parque o un espacio sin ID (escuela u otro sitio nuevo), con capturas reales de ambos casos.
- **23 · Copa y condición:** criterio de **Condición general** (Buena 90–100 %, Regular 75–89 %, Mala 50–74 %, Crítica < 50 % de copa viva, basado en i-Tree Eco); al tocar cada fila el anillo muestra un ejemplo.

## Interfaz real de la app

Todas las pantallas y recortes en `assets/screenshots/` son **capturas reales** de la versión local de la app
(`Cowork/index.html`, **v19**, 22 de septiembre de 2026), la versión que usará el equipo. Incluye 14 especies, secciones que se
desbloquean en orden, protocolo opcional de 4 pasos, 2 fotografías obligatorias con el ID sellado, el botón Aa, Compartir y la pestaña Monitoreo con fotos de la muestra.
Se tomaron en un teléfono de 390 × 800 px a 3× (los mockups agregan la barra de estado del teléfono) con GPS simulado en Villa Universidad (parque 14664)
y con el código de teléfono fijo `7F3A`.
Los registros de ejemplo (14664-7F3A-00040 a 00042, “María Pérez”) son datos de demostración.

- `app_*.png` → pantalla completa dentro del smartphone
- `ui_*.png` → recortes para los zooms de interfaz

Si la app cambia, reemplaza el archivo con el **mismo nombre** y el diseño se ajusta solo.
Si falta un screenshot, la slide muestra un bloque “SCREENSHOT REAL PENDIENTE”.

### Slides nuevas (fuera del guion)
- **06 · Letra a tu medida:** botón Aa con 3 niveles.
- **14 · La app te lleva en orden:** bloqueo de avance entre secciones.
- **32 · El ID viaja dentro de la foto:** botón Compartir y sello del ID en cada foto.
- **33 · Monitoreo: volver al árbol** y **34 · Una revisita en 4 pasos:** pestaña Monitoreo.

### Ajustes por la versión v19 de la app (22 de septiembre de 2026)
- **Corrección botánica:** Amapa = *Tabebuia rosea* (i-Tree TARO) y Lluvia de oro = *Cassia fistula* (CAFI). Se actualizaron los nombres y las dos fotos del catálogo (slides 15 y 16).
- Base de parques de Parques Alegres actualizada: **791 parques**.

### Ajustes por la versión v17 de la app (20 de septiembre de 2026)
- **15 campos obligatorios** (antes 19): el **Protocolo de plantación es opcional** y quedó fuera de la cadena de secciones (slides 14, 24, 25 y 30).
- Los 4 pasos del protocolo se marcan **en cualquier orden**; lo que se deja sin marcar es el dato que explica una baja sobrevivencia.
- **Compartir** (Registros → 📤) envía el CSV y las fotos con su nombre; al guardar, la app graba el **ID y la fecha** en una franja al pie de cada foto (slides 26 y 32).
- **Monitoreo** carga también las **fotos de la muestra**: la app muestra la foto del día de la plantación para confirmar el árbol antes de revisitarlo (slides 33 y 34).

### Ajustes al guion por la versión local
- **Slide 17 · ID del árbol:** el ID ya no es `ARB-00042`; ahora es `ID de Parque-código del teléfono-número` (ej. `14664-7F3A-00042`). `ARB-00000` solo aparece antes de capturar datos.
- **Slide 24 · Protocolo:** se agregaron los pasos que ahora pide la app (cama de tierra fertilizada y tutor) entre el hoyo y el riego.
- **Slide 26 · Fotografía:** se agregó la foto 2 (desde arriba). El nombre de ejemplo es `14664-7F3A-00001_finalizado.jpg`.

## Instalación en el teléfono (slide 05)

El QR abre la app; los pasos de la tarjeta explican cómo dejarla como ícono:
**iPhone (Safari)** Compartir → Agregar a pantalla de inicio → Agregar · **Android (Chrome)** Menú ⋮ → Agregar a pantalla principal / Instalar aplicación → Instalar.
En iPhone tiene que abrirse en Safari: en Chrome no aparece la opción.

## Marca

La portada y el cierre llevan el logotipo de **Ecosistémica** (versión horizontal negativa, `assets/brand/`), tomado de la carpeta
`Cowork/Marca Ecosistémica`. Sobre fondo oscuro o fotografía se usa la versión negativa, como pide el manual de marca.

## Fotografías

Las fotos son **reales, con licencia libre** (Unsplash y Wikimedia Commons) y muestran el crédito del autor sobre cada imagen.
No son fotos de Parques Alegres; la de la misión final es de una campaña de reforestación en México.
Detalle de autores y licencias: `assets/photos/CREDITOS.md`.
Para usar fotos propias del equipo, consulta `assets/photos/LEEME.md`.

Las imágenes de las 14 especies (`assets/photos/especies/`) provienen del catálogo visual de la app.
Corrección del 17 de septiembre de 2026: **Palo Verde = *Parkinsonia aculeata*** (i-Tree PAAC3) y **Bacapora = *Parkinsonia praecox*** (i-Tree PAPR); las fotos, las capturas y la slide 16 ya lo reflejan.

## Estructura

```
index.html      35 slides (contenido y notas del presentador)
styles.css      sistema visual, layouts horizontal/vertical, animaciones
script.js       navegación, retos, assets, ilustraciones SVG
assets/
  screenshots/  capturas reales de Árboles PA
  photos/       fotos de campo (licencia libre) + especies de la app
  icons/        ícono de la app
  brand/        logo de Ecosistémica (SVG)
  qr/           código QR de la app (SVG y PNG)
  fonts/        Inter, Instrument Serif, JetBrains Mono (licencia OFL)
```

## Formatos de pantalla

- Pantallas horizontales (proyector, laptop, tablet horizontal): lienzo 16:9 de 1920 × 1080 escalado sin recortes.
- Teléfono o tablet en vertical: lienzo de 1080 × 1920 con las columnas apiladas.
