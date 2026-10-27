# SDD ledger — plan: 2026-10-19-chassis-progressive-ingestion-ai.md

Spec y plan aprobados; ejecución nativa preservada. Se reutilizan las ramas/checkouts y el trabajo anterior, sin commits ni publicaciones, según autorización de la entrega anterior.

Pre-flight: 1→2 comparten LinkageCurve y versión de modelo; 2→3 comparten curva y evidencia; 4→2 usa canales originales más procedencia de reloj; 2→5 usa evidencia y cobertura; 6 verifica el conjunto. Las revisiones viejas sin curva siguen válidas.

Descubrimiento: dos ZIP ASPAR auténticos con carpetas MES, DDD y canales Susp_F/Susp_R. El formato no es el DRK de AiM. No hay servicio local de modelos disponible en 11434 ni software 2D localizado en los directorios habituales. Las escalas y relojes binarios requieren contraste antes de declarar validación comercial.

Task 1: complete — PCHIP puro, inversa acotada, fuerzas/rigidez y límites en nodos. 19 pruebas de motor verdes, con referencia independiente SciPy.
Task 2: complete — curva persistida, replay de todas las muestras, cobertura parcial/nula, límites, comparación de extremos interiores y referencia absoluta. Tres pruebas nuevas de evidencia verdes.
Task 3: complete — editor A/B en mm, fuente/procedencia, validación, restauración y cobertura. 328 pruebas frontend verdes; tipos y build verdes (warning previo por tamaño de chunks).
Task 4: complete within experimental scope — SDK AiM oficial probado en dos archivos reales (110/111 canales). Ambos ZIP 2D reales tienen mediciones compatibles (27 canales,48 excluidos); Susp_F/Susp_R con 75920 y40976 muestras a100Hz reconstruidos. Primer MES de mayo sin IST rechazado. Falta exportación del fabricante para validar escalas/signo/reloj.
Task 5: complete within configured scope — hallazgos deterministas trazables y priorización opcional local restringida. Alias remotos bloqueados antes de enviar hallazgos; JSON/IDs/pruebas validados. No hay modelo local ejecutándose; UI declara reglas y estado real.
Task 6: complete — 53 pruebas backend enfocadas,19 motor,328 frontend y1 Playwright (curvas A/B, calibración,recarga,móvil y error503). Tipos/build/Ruff/diff-check verdes. Wheel aislado compara y persiste; Docker chassis-core Linux construido, no runtime histórico completo.

Ruling: curvas reales ausentes — no se inventan medidas; fixtures QA solo verifican software — validación física comercial pendiente.
Ruling: 2D nativo queda experimental aunque los valores parezcan plausibles — falta exportación Analyzer — no se generan recomendaciones mecánicas desde esa fuente.
Ruling: timeout8s es por operación HTTP de metadatos/generación — sin reintentos ni descarga automática — no se promete8s de latencia total.
Ruling: se mantiene trabajo local sin commits/push/publicación, según alcance autorizado anterior.

Final review: fresh independent progressive_final_review. Dos importantes reproducidos y corregidos RED→GREEN: referencia de extensión completa también obligatoria en relación constante; CRC de entradas ZIP no seleccionadas se valida antes de aceptar paquete. Además se corrigió trazabilidad de reloj: evidencia nativa conserva metadata_reconstructed y deja de afirmar original-clock. Suite final53 verde; referencia con medidas desconocidas bloquea cargas pero conserva geometría.

Puertas comerciales abiertas: contraste2D fabricante, medidas/ensayo suspensión real, dominio/incertidumbre y tenants/operación producción. La disponibilidad de adaptador local no constituye inferencia real validada.


Validación manual en IAB: ZIP abril inspeccionado, selección explícita e importación real de27canales. Sesión local ab50d3aa-8f2e-4f35-bc73-119ee5489607 con Susp_F/Susp_R de75920muestras; UI muestra reloj reconstruido, aviso experimental y48exclusiones. Ninguna geometría/curva inventada para esa sesión.
Fallo operativo descubierto en esa prueba: validación JSON Schema y persistencia bloqueaban el event loop durante importación grande. Regresión concurrente RED→GREEN; persist_recording se ejecuta ahora en threadpool. Se reinició8180 sin autoreload y se repitió Playwright verde. La importación grande aún puede tardar; el límite cliente es150s. Optimizar almacenamiento y validación masiva queda como trabajo de rendimiento, sin simular importaciones instantáneas.
