# Integridad de importaciones AiM/2D — 26-Oct-2026

## Corrección

Una interrupción de escritura podía dejar un UUID.json incompleto visible para lectores. Además, el resumen podía desbordarse con muestras finitas y fallar después de guardar. La inspección2D no respondía413 explícitamente al superar el límite.

Ahora el resumen se prepara antes de guardar; el promedio evita desbordamiento sin alterar arrays. La grabación completa se serializa en staging privado, se sincroniza y se publica mediante enlace duro exclusivo, sin sobrescribir. Los fallos de almacenamiento devuelven503 recuperable; importación e inspección2D rechazan más de100MiB con413. No cambia el contrato JSON ni la propiedad por equipo.

## Evidencia

- RED reproducido:13 fallos y1 prueba correcta antes de la corrección.
- Regresión focal:72 pruebas correctas, incluidas escritura parcial, disco lleno, fsync/link fallidos, concurrencia, no sobrescritura, aislamiento y extremos numéricos.
- AiM real mediante SDK oficial:110 canales,286.508 muestras; importación, resumen y canal completo recuperables, tiempos/unidades conservados y hash del original intacto. Directorio QA privado separado del catálogo del operador.
- Wheel construido sin instalar dependencias; módulo incluido e importado fuera del checkout.
- Revisión independiente del delta:sin defectos importantes; no sustituye las pruebas ejecutadas.

## Límites de producción

El destino debe admitir enlaces duros en el mismo sistema de archivos; de lo contrario falla cerrado con503. No se garantiza durabilidad de la entrada de directorio ante corte eléctrico en todos los sistemas. Si únicamente falla limpiar staging tras publicar, se registra advertencia sin convertir el éxito en error; esos temporales no son entradas del catálogo.

No se modifica la persistencia geométrica ni se añade cancelación del proceso nativo. La prueba AiM valida integridad del software, no metrología externa. El lector2D sigue experimental y falta contraste independiente de escalas/signos/relojes con Analyzer. No se ha desplegado cloud, aplicado migraciones ni autorizado redistribuir SDK.

Evidencias restringidas y huellas en `.superpowers/sdd/2026-10-26-recorded-import-atomicity`; no publicar mediciones ni rutas de fuentes privadas.

## Cierre y activación local

Regresión completa del backend: 892 passed, 20 skipped, 2 avisos existentes, 315,54 s. Las omisiones conservan los límites previamente identificados de PyTorch y muestras/metadatos públicos ausentes. No se instalaron dependencias ni se publicaron datos para eliminarlas.

Backend reiniciado tras comprobar ausencia de análisis activos y respaldar las tres bases mediante SQLite backup con integrity_check correcto. Salud HTTP200 y reclamaciones del worker (claim/claim_synthesis) HTTP200. Gateway, modelo y worker conservados. Hash del archivo raw de laboratorio intacto. Activación exclusivamente local; no despliegue comercial.
