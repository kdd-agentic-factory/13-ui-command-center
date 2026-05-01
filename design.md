# Design System: Command Center

Este repositorio debe producir una interfaz de mando consistente para una fabrica agentica KDD. Cualquier agente que edite la UI debe seguir estas reglas antes de crear componentes nuevos.

## Principios

- La primera pantalla es operativa, no una landing page.
- La informacion debe ser escaneable: estados, metricas, alertas y proximas acciones tienen prioridad sobre texto explicativo.
- Los componentes deben compartir el mismo lenguaje visual: densidad media, radios de 8px o menos, bordes sutiles, fondos sobrios y estados codificados por color.
- La UI debe ser utilitaria y profesional; evitar composiciones decorativas, tarjetas anidadas, gradientes dominantes y bloques hero.

## Layout

- Usar una barra superior fija en contenido, no flotante, con nombre del sistema, estado global y acciones principales.
- Usar una cuadricula responsive:
  - Desktop: columnas 12, separacion 16px.
  - Tablet: 2 columnas.
  - Mobile: 1 columna.
- No meter cards dentro de cards. Las cards representan entidades repetibles o paneles de herramienta.
- Cada panel debe tener titulo, estado o metrica principal y contenido accionable.

## Color

Tokens:

- `--color-page`: fondo general.
- `--color-surface`: superficie de panel.
- `--color-surface-muted`: superficie secundaria.
- `--color-border`: divisores y contornos.
- `--color-text`: texto principal.
- `--color-text-muted`: texto secundario.
- `--color-accent`: acciones y foco.
- `--color-success`: correcto, saludable, completado.
- `--color-warning`: degradado, pendiente, atencion.
- `--color-danger`: error, bloqueo, caida.
- `--color-info`: procesamiento, sincronizacion, observabilidad.

No dominar la UI con una sola familia cromatica. Los colores de estado deben aparecer como pequenos indicadores, barras y etiquetas, no como fondos masivos.

## Tipografia

- Usar una pila sans-serif del sistema.
- No escalar tipografia con `vw`.
- Mantener `letter-spacing: 0`.
- Titulos de panel compactos: 15px a 18px.
- Numeros y metricas: peso alto, tamano estable, sin romper el layout.

## Componentes

- Botones: icono + texto solo para acciones claras; icon-only con `aria-label` cuando sea una herramienta.
- Estados: usar punto, barra o etiqueta con color semantico.
- Tablas/listas: preferir filas densas con columnas alineadas.
- Graficos simples: usar barras CSS, timelines y medidores nativos antes de introducir librerias pesadas.
- Skeletons y vacios deben mantener dimensiones estables.

## Accesibilidad

- Contraste suficiente entre texto y superficie.
- Todos los icon buttons deben tener `aria-label`.
- El foco interactivo debe ser visible.
- No comunicar estado solo por color: incluir texto corto como `activo`, `bloqueado`, `degradado`.

## Archivos Esperados

- `src/app`: arranque de React y composicion principal.
- `src/pages`: pantallas de alto nivel.
- `src/components`: paneles reutilizables del command center.
- `src/services`: datos, adaptadores y contratos tipados.
- `src/styles`: tokens y estilos globales.
