# Desconexión durante importaciones — 26-Oct-2026

## Problema y corrección

ASGI no garantiza cancelar el manejador cuando desaparece el cliente. La importación podía terminar y publicar una grabación después de una desconexión ya observable. Una primera comprobación con Request.is_disconnected pasaba pruebas directas, pero la revisión independiente demostró que BaseHTTPMiddleware puede ocultarle el evento por cancelación inmediata.

La comprobación final se instala en middleware ASGI exterior, exclusivamente para POST de importación grabada. Tras consumir el multipart, decodificar y construir el resumen, la ruta sondea el receive original con presupuesto total de 10 ms. Una desconexión observada impide guardar y produce estado interno HTTP 499. No hay lector de fondo que compita con multipart ni cambio de esquema, propiedad o autorización.

## Evidencia

- RED inicial: cuatro desconexiones guardaban incorrectamente; cuatro conexiones activas funcionaban.
- RED con create_app completo: una desconexión no detectada; control conectado correcto.
- Once pruebas de ciclo de vida correctas tras corregir el middleware; repetidas independientemente por el revisor.
- 83 pruebas afectadas correctas: importación, atomicidad, catálogo, AiM, 2D y aislamiento de equipos.
- Proceso hijo real de control: timeout forzado, hijo recogido y directorio temporal eliminado. El control sustituye trabajo del fabricante por un sleeper; no certifica el lector.
- Wheel construido y cargado fuera del checkout; comprobada posición exterior del middleware empaquetado.
- Revisión independiente final sin bloqueos.

## Límites

No es cancelación inmediata del SDK: el lector mantiene su límite de 120 segundos y se recoge antes de limpiar temporales. No revierte un commit si la desconexión ocurre después del punto de comprobación; tras una pérdida de conexión se debe consultar la biblioteca antes de reintentar. Un proxy que mantenga abierta la conexión con el backend puede retrasar la observación del cierre del navegador. No cambia datos existentes, geometría ni canales.

2D sigue experimental sin referencia independiente de Analyzer. No hay despliegue cloud, migraciones, instalación de dependencias ni redistribución de SDK. Las evidencias y fuentes QA permanecen restringidas en `.superpowers/sdd/2026-10-26-import-disconnect`.

## Regresión y activación final

Regresión completa: 903 pruebas correctas, 20 omitidas, 2 avisos existentes; 319,00 s. Las omisiones mantienen los requisitos identificados de PyTorch y muestras/metadatos públicos ausentes.

Aceptación AiM real repetida sobre la versión final mediante SDK oficial: 110 canales y 286.508 muestras, 8,14 s, hash original intacto y tiempos/unidades conservados en lectura posterior. No acredita precisión externa.

Backend local reiniciado tras comprobar cero análisis activos y verificar tres backups SQLite consistentes. Salud y reclamaciones claim/claim_synthesis del worker devuelven HTTP200. Modelo, gateway y worker conservados; hash del archivo raw de laboratorio intacto. Sin despliegue cloud.
