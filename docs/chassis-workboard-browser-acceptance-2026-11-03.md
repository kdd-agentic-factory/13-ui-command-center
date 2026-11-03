# Aceptación del tablero con identidad real — 2026-11-03

Resultado: PASS acotado al tablero y revisión de entregas. No equivale a aceptación completa del producto ni autoriza montaje mecánico.

## Fuentes y artefactos

- API fuente `5673d142dd522e75e183efdc54100061aa10b0b9`; imagen `sha256:d3f274905df6fe0c361fb2a144245b9815966b453b715c09d121e67096654392`.
- Frontend fuente `52696df74001859069ad4c3e522cd16aa4f5cb6c`; imagen `sha256:6b254e7f33f32482e6c2af3f2026e367cfe5102aef7747264f5ba10b5b137052`.
- Fuentes exportadas desde Git, sin superponer código de aplicación ni incorporar los cambios visuales sin guardar. Ocho archivos API instalados coinciden con sus fuentes; pip check pasa. API construida sin red con dependencias verificadas.

## Ensayo real acotado

Identidad y persistencia de preproducción reales, con cuentas QA existentes. Una sesión explícitamente sintética y dos tareas de inspección sin evidencia física analizable. No se modificaron cuentas ni designaciones.

Once controles de navegador pasan: ingeniero sin aceptación, Chief acepta su entrega exacta y la recupera tras recarga, suplente hace lo mismo, lector sin aceptación y equipo B sin sesión ajena en todas sus páginas; sin errores de página en los espacios comprobados. Se realizaron exactamente dos POST de aceptación, uno por autoridad designada. Una lectura independiente posterior confirma ambas tareas cerradas en revisión 5 y los mismos identificadores de decisión.

El ejecutor fue revisado independientemente antes de su ejecución. Navegador con sandbox, seccomp fijado, red interna, TLS verificado y credenciales de ensayo montadas solo lectura; ninguna clave administrativa en el navegador. Sin puertos host. Contenedores y redes propios retirados e identidad de entradas preservada.

## Corrección del ensayo y recuperación

Los dos primeros intentos se detuvieron antes de escribir decisiones porque el ensayo examinaba las opciones de sesión antes de concluir la actualización de React. Se corrigió la espera del navegador sin cambiar las imágenes. Las lecturas posteriores de ambos intentos confirmaron cero decisiones. Se conservaron las mismas tareas y operaciones.

El ensayo admite recuperar decisiones previas exactas y realiza reconciliación autoritativa antes y después, incluso si falla el navegador. No se debe volver a preparar la fixture tras una aceptación.

## Límites y pendientes

No hubo despliegue, push, merge, nuevas migraciones ni inferencia en este ensayo. No acredita datos físicos, contraste independiente AiM/2D, Cicerone conversacional, creación de tareas por agentes ni paquete completo por sesión. La aceptación integral de todos esos módulos continúa pendiente. La revocación histórica sigue pendiente por indicación del usuario.

Recibo detallado: `chassis-workboard-browser-acceptance-2026-11-03.json`. Probes: `tests/delivery/prepare_workboard_browser.py`, `readback_workboard_browser.py`, `workboard_browser.cjs`.
