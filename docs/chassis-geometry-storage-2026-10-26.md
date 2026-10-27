# Guardado de geometría de la grabación — 26-Oct-2026

La revisión geométrica podía publicarse parcialmente si fallaba la serialización. La actualización de cabecera usaba un temporal sin fsync ni limpieza garantizada; además mutaba el objeto de entrada antes de terminar. La ruta no traducía fallos de almacenamiento a una respuesta recuperable.

Ahora se prepara el resumen antes de escribir. Una revisión nueva se serializa y sincroniza en staging privado, se publica sin sobrescritura y después se reemplaza atómicamente la cabecera de la grabación mediante otro staging sincronizado. Se conserva el bloqueo de autoridad que abarca recarga, revisión y cabecera. No cambian muestras, relojes, unidades, propiedad, esquemas ni parámetros físicos.

Si falla una etapa, la cabecera anterior permanece válida. Si la revisión ya estaba completa pero falla la cabecera, queda una revisión no activada para auditoría; no se elimina ni se presenta como geometría vigente. No es una transacción de dos archivos ni garantía de durabilidad de directorio ante corte eléctrico. Las revisiones requieren enlaces duros en el almacenamiento; no hay fallback de copia parcial. Un fallo de almacenamiento responde HTTP503.

## Verificación

- RED inicial: seis fallos del comportamiento y un error de preparación de fixture, corregido antes de verificar la ruta HTTP.
- 139 pruebas afectadas correctas: geometría, atomicidad de importación, desconexiones, AiM/2D, catálogo, aislamiento, snapshots y autoridad.
- Prueba HTTP concurrente: dos ediciones conservan sus dos revisiones completas, cabecera coherente y muestras originales.
- Controles de disco lleno, fsync y reemplazo fallidos: cabecera original intacta, sin temporales parciales.
- Revisión independiente sin bloqueos; el revisor ejecutó otras 23 pruebas de almacenamiento e importación.
- Wheel construido sin instalar dependencias e importado fuera del checkout.

La última regresión general anterior a este delta pasó 903 pruebas con20 omisiones. No se presenta como ejecutada sobre esta versión: el delta actual se verificó con las139 pruebas afectadas indicadas arriba. La precisión del lector2D y las medidas físicas reales siguen requiriendo referencia externa. Evidencias restringidas en `.superpowers/sdd/2026-10-26-geometry-storage`.

Activación local: cero análisis activos comprobados, tres backups SQLite consistentes y backend reiniciado; salud HTTP200. Hash del raw de laboratorio intacto. Sin cambios cloud.
