# Chassis Suspension and Spectral Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Ejecución nativa en esta sesión elegida previamente por el usuario; se conserva ese método. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir inspección de suspensión registrada, importación de ensayos medidos y PSD/STFT reproducibles al taller de Chassis, preservando producto, datos y decisión humana.

**Architecture:** 17 calcula sobre señales SI sin I/O; 18 resuelve fuentes privadas, calibra, limita recursos y persiste resultados inmutables; 13 ofrece una vista adicional del taller sobre el contexto compartido. Anexos y snapshots nuevos llevan referencias verificadas a los agentes, sin alterar históricos ni habilitar acciones físicas nuevas.

**Tech Stack:** Python/Pydantic/FastAPI/SQLite, NumPy/SciPy existentes, React/TypeScript/CSS. Sin PyWavelets, hardware CAN/LSL ni bibliotecas de gráficos nuevas.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-suspension-spectral-design.md`, aprobada por el usuario el 2026-10-26; revisión de planificabilidad independiente sin cuestiones importantes pendientes.

**Estado:** plan preparado; sin implementación. El usuario ha aprobado el diseño y solicitado preparar este plan, todavía debe confirmar que refleja el alcance antes de ejecutarlo.

## Global Constraints

- Conservar geometría, bieletas, Target Lock, replay, A/B, informes, roles y autoridad del Crew Chief humano/sustituto. Ningún cálculo nuevo concede aprobación.
- Datos crudos inmutables/restringidos; catálogo, índice, diccionario, versiones y tres headers KDD obligatorios. No publicar muestras ni enviar arrays al modelo.
- Lectura 2D experimental no obtiene validación por pasar un análisis numérico. Sin fuerza medida no se publica fuerza hidráulica; sin desplazamiento no se publica energía por ciclo.
- Política `spectral-quality-v1`: dt mediana, desviación máxima <=1%, hueco >1.5 dt corta tramo, >=256 muestras, >=3 segmentos Welch, segmentos potencia de dos 256–8192, 50% solape, Hann periódica, detrend constante, `nfft=nperseg`, unilateral/densidad. Sin padding ni ventanas incompletas en STFT, sin resampleo automático.
- Banda estrictamente inferior a Nyquist y al ancho de banda calibrado conocido. Antialias/ancho de banda desconocidos: solo exploratorio. No etiquetas automáticas de chatter, cavitación, desgaste o RUL.
- CSV <=25 MiB, <=250000 filas y <=8 columnas numéricas mapeadas; análisis <=250000 muestras y STFT <=262144 celdas calculadas. Presentación <=4000 puntos y hasta 256×512 celdas con reducción identificada. Timeout 30 s, una ejecución por proceso, sin resultado parcial completo.
- Continuar sobre base dirty aceptada, con baseline exacto de archivos afectados. Sin commits/push, limpieza, instalación, despliegue ni migración cloud. No usar base principal para fixtures. Leer AGENTS y gobernanza antes de operar.
- Datos sintéticos solo para tests identificados; aceptación de ensayo real independiente queda pendiente si no existe. No ajustar modelos/presupuestos para ocultar fallos de IA.

## Review Focus

1. Fuerza total con muelle/gas montados confundida con amortiguación hidráulica: conservar definición de fuerza y bloquear ese rótulo; T2/T7.
2. Dos pulsos separados, ciclo incompleto o desfase de fuerza frente a posición: no producir energía de ciclo falsa; T2/T4.
3. CSV parcialmente importado tras desconexión o exceso de tamaño: no dejar adquisición publicable ni archivo original huérfano; T3.
4. Timeout/cancelación de un cálculo que sigue vivo: no liberar capacidad antes de terminar el proceso ni publicar éxito tardío; T5/T7.
5. Resultado numérico correcto sobre fuente experimental o revisión antigua: no convertirlo en evidencia aprobable ni aplicarlo a otro contexto; T4/T6/T7.

## Archivos y fronteras

Prefijos de este plan: `UI=13-ui-command-center`, `PHY=17-digital-twin-simulation-lab`, `DATA=18-telemetry-dataset`, relativos a `C:/Users/usuario/Desktop/kdd-agentic-factory`. Rutas abreviadas para legibilidad; no contienen datos de cliente.

- PHY: crear `src/digital_twin_lab/chassis/suspension_signals.py`, `suspension_bench.py`, `spectral.py` y `signal_models.py`; tests `tests/unit/test_suspension_signals.py`, `test_suspension_bench.py`, `test_spectral.py`.
- DATA: crear paquete `src/telemetry_dataset/chassis/suspension_lab/` con `models.py`, `csv_import.py`, `acquisitions.py`, `service.py`, `worker.py`, `store.py`, `evidence.py`; router `routers/suspension_lab.py`. Esquemas nuevos en `chassis/schemas/`; pruebas `tests/test_suspension_lab_{contracts,import,service,routes,worker,evidence}.py`.
- DATA: modificar `main.py` para montar router; `sensor-dictionary.yaml`, `schema-version.yaml` y esquemas de catálogo para adquisiciones de banco. Adaptadores de catálogo no transforman bancos en sesiones de pista. Versionar cambios en `chassis/engineering/{snapshots,technical_context,reference_codec,decision_context,decision_contracts}.py` y esquemas asociados solo según T6. No modificar hashes de objetos anteriores.
- UI: crear `src/domain/suspensionLab.ts`, `src/services/suspensionLab.ts`, `src/components/chassis/suspension/{SuspensionLabPanel,BenchImportForm,MovementView,BenchView,SpectralView,SignalPlot}.tsx`, `src/styles/suspension-lab.css`; tests T7. Modificar `workshop/ChassisWorkshop.tsx`, `ChassisComparison.tsx` y `ChassisPage.tsx` únicamente para pasar contexto y añadir vista; extender informe/AnalysisRunPanel para anexos sin desmontar estado.
- Documentación final: `UI/docs/chassis-suspension-spectral-acceptance-2026-10-26.md`, `chassis-operation.md`, `product-completion-matrix.md`, `PRODUCT.md`.

No se ejecutan scripts de las fuentes. Existe ya `DATA/routers/chatter.py` con entrada de arrays y frecuencia declarada por cliente: queda histórico y fuera de la nueva cadena de evidencias; no reutilizar su umbral diagnóstico como validación de PSD. No sustituirlo ni migrar silenciosamente sus resultados.

## Convención de pruebas y baseline

Antes de T1: guardar hashes y copias exactas de archivos afectados en `UI/.superpowers/sdd/2026-10-26-chassis-suspension-spectral/`, sin copiar datos crudos. Verificar artefactos adjuntos por manifiesto. Leer el diseño completo y versiones reales de NumPy/SciPy en runtime validado.

Cada tarea contiene ciclo RED→implementación→GREEN, con logs. Los comandos Python siguientes se ejecutan desde su repositorio con `PYTHONPATH=src` en el banco confiable existente. Si el Python Windows no tiene entorno válido, usar los runners aislados de `C:/Users/usuario/.codex/tmp/kdd-actionable-ai-tools-20261026` tras leer sus argumentos; ampliar montajes de código/metadatos de forma limitada si el runner lo necesita, sin raw ni DB principal. Un fallo de montaje se registra y corrige en el runner, nunca relajando una prueba. Comandos no autorizan instalar dependencias.

### T1. Contratos y validación de calidad temporal

**Interfaces:** `SignalSeries(times_s:list[float], values:list[float], unit:str, sensor_id:str, provenance:dict)` y `SignalQuality(status, reasons, dt_s, effective_fs_hz, max_relative_jitter, contiguous_intervals, sample_count)` en PHY `signal_models.py`. `inspect_signal(series:SignalSeries)->SignalQuality` en `suspension_signals.py`. DTO DATA `AnalysisRequest(schema_version='1.0.0',operation_id,source:AcquisitionRef,channels,calibration_refs,interval_s,method,parameters,comparison_ref=None)` y `AnalysisResult` con digest, versiones, estado, cobertura, métricas y elegibilidad. `AcquisitionRef` lleva `kind:'recording'|'suspension_bench'`, UUID y digest; no arrays del cliente.

- [ ] Escribir `test_original_clock_quality` y `test_quality_does_not_repair_samples`: reloj uniforme, 1% aceptado, >1% rechazado para espectro, hueco >1.5dt, duplicados, NaN y negativos en intervalo. Afirmar arrays originales intactos y al menos un motivo específico cuando bloqueado.
- [ ] RED: `python -m pytest tests/unit/test_suspension_signals.py -q` desde PHY; fallo esperado por contrato/comportamiento ausente, no dependencia rota.
- [ ] Implementar tipos puros y `inspect_signal`, sin inventar fs desde diccionario. En DATA escribir `test_suspension_lab_contracts.py`: `extra=forbid`, límites exactos, IDs canónicos, intervalo ordenado, enums y referencias; generar esquemas desde DTO, registrar nuevas versiones sin modificar contratos históricos.
- [ ] GREEN: repetir focal PHY y `python -m pytest tests/test_suspension_lab_contracts.py -q` DATA. Verificar que schemas generados coinciden con DTO y que referencias nuevas del diccionario se registran antes de uso.

### T2. Movimiento y curvas de banco medido

**Interfaces:** `movement_metrics(series:SignalSeries, velocity:SignalSeries|None, bins:int=40)->MovementResult`; `bench_curves(force:SignalSeries, displacement:SignalSeries|None, velocity:SignalSeries|None, metadata:BenchConditions)->BenchResult`. `BenchConditions` declara convención de trabajo, sincronización, fuerza total/corregida y método, montaje y temperatura. Reutilizar derivación actual mediante adaptación DATA, no crear un filtro divergente en PHY. Banco no estima velocidad si no se solicitó derivación trazable.

- [ ] Tests RED `test_movement_without_force_has_no_damping`, `test_total_force_never_labelled_hydraulic`, `test_closed_cycle_work_matches_analytic_integral`, `test_incomplete_or_desynchronized_cycle_has_no_work`, `test_velocity_only_has_no_cycle_energy`. Datos controlados F=c·v, x=A·sin(wt), trabajo analítico por ciclo pi·c·A²·w con convención declarada; error <=1% para fixture suficientemente muestreado. Dos pulsos separados no se fusionan en un ciclo.
- [ ] Ejecutar focal T2 y comprobar RED. Implementar histogramas por signo/tiempo válido, ramas identificadas sin mezclar dispersión y trabajo por ciclos completos definidos por cruces de posición de referencia con la misma dirección. Si no hay dos cruces fiables consecutivos o sincronización no está documentada, energía ausente con motivo; no cerrar curva artificialmente.
- [ ] Comparación de dos bancos expone diferencias de configuración/temperatura y no emite «mejora». Unidades SI, ninguna inferencia sobre RUL/cavitación/shims.
- [ ] GREEN: `python -m pytest tests/unit/test_suspension_signals.py tests/unit/test_suspension_bench.py -q`.

### T3. Importación de banco privada, atómica y catalogada

**Interfaces:** `parse_bench_csv(stream, mapping:BenchColumnMapping, metadata:BenchMetadata)->ParsedBench` sin persistencia; `import_bench(stream,mapping,metadata,principal,audit,operation_id)->BenchAcquisition`. `BenchAcquisition` 1.0.0 identifica original/checksum, normalizado/calibración, catálogo y propietario, no circuito/piloto ficticios. `load_acquisition(ref,principal,audit)->AcquisitionManifest`; arrays solo desde adaptador interno autorizado. Entradas del diccionario propuestas `suspension_bench_force` y `suspension_shock_oil_temperature`, registradas con unidades y carácter contextual; revisar colisiones antes de crear. Posición/velocidad usan IDs existentes y ubicación real.

- [ ] RED `test_bench_csv_requires_explicit_units_and_mapping`, `test_import_size_rows_columns_boundaries`, `test_import_is_atomic_on_disconnect_and_bad_last_row`, `test_duplicate_operation_conflicts`, `test_other_team_cannot_read_bench`. Casos decimal-coma/delimitador explícitos, UTF-8/BOM, cabeceras duplicadas, fórmula en campo numérico, unidades incompatibles, fila truncada y nombre de archivo con ruta.
- [ ] `python -m pytest tests/test_suspension_lab_import.py -q`; comprobar RED.
- [ ] Implementar almacenamiento gobernado: staging restringido con nombre UUID y checksum en streaming, validar completamente, registrar un intento persistente y publicar manifiesto/catálogo/índice de forma transaccional o journal recuperable. Si falla entre archivo y DB, el registro incompleto es invisible y la recuperación lo finaliza o elimina solo staging propio; no tocar raw publicado. Original y normalizado no ejecutables, rutas resueltas dentro de directorio autorizado. Bumps de esquema explícitos.
- [ ] GREEN focal, incluido fallo inyectado después de cada etapa de publicación. Ensayo no aparece en listado de sesiones de pista y sí en su listado paginado del ámbito correcto; datos antiguos sin propietario no se adoptan.

### T4. PSD y STFT deterministas

**Interfaces:** `analyze_spectrum(series:SignalSeries, options:SpectralOptions)->SpectralResult` en PHY `spectral.py`; métodos `welch` y `stft`. Resultado incluye fs, resolución, segmentos, banda, unidades, matriz/frecuencias/tiempos y parámetros efectivos. Calidad/elegibilidad se mantiene separada del cálculo numérico.

- [ ] RED `test_welch_multisine_bins_and_variance`, `test_stft_localizes_burst_without_padding`, `test_reject_nyquist_and_unsupported_sensor_band`, `test_unknown_antialias_is_exploratory`, `test_sample_and_cell_budgets`. Seno exactamente alineado al bin y multiseno: pico <=1 bin y PSD integrada/varianza relativa <=5%; constante sin NaN ni falso pico DC. No rellenar huecos.
- [ ] Ejecutar `python -m pytest tests/unit/test_spectral.py -q`, confirmar RED.
- [ ] Fijar ventana con `get_window('hann',nperseg,fftbins=True)`, Welch explícito y STFT moderna disponible en runtime. Probar normalización numérica por integración; no asumir que escala de STFT coincide con PSD. Usar solo ventanas completas y parámetros del diseño. Validar límite de celdas antes de asignar matrices; no zero-padding para aparentar resolución.
- [ ] GREEN focal; comparar escalado en dos amplitudes (PSD ×4 al duplicar amplitud). Registrar versiones reales y comprobar import de módulo desde wheel fuera de checkout. Si backend no está disponible, devolver bloqueo explícito en T5, no un espectro alternativo.

### T5. Servicio con resolución de fuentes, aislamiento y ejecución limitada

**Interfaces:** `prepare_analysis(request,principal,audit)->PreparedAnalysis` resuelve fuente, calibración y calidad; `run_analysis(prepared:PreparedAnalysis)->AnalysisResult` se ejecuta fuera de HTTP; `create_analysis(request,principal,audit)->AnalysisResult` persiste solo al completar. Worker proceso supervisado: `execute_bounded(prepared,timeout_s=30,cancel_token)->AnalysisResult`, una ejecución por proceso servidor. No timeout meramente sobre thread que siga calculando sin control.

Rutas: `POST /bench-imports` multipart; `GET /acquisitions`, `GET /acquisitions/{id}`; `POST /analyses`, `GET /analyses`, `GET /analyses/{id}`, bajo `/api/v1/chassis/suspension-lab`. GET devuelve manifiestos/resultados acotados, no originales por defecto. Router usa autenticación y ámbito actuales. Mutaciones engineer/admin en modo autenticado; local conserva operador/auditoría y nunca autoridad humana.

- [ ] RED en service/routes/worker: `test_source_digest_and_calibration_are_bound`, `test_experimental_source_cannot_be_eligible`, `test_reader_cannot_write`, `test_foreign_id_is_404`, `test_exact_idempotent_replay`, `test_worker_timeout_reaps_child`, `test_cancel_has_no_late_publish`, `test_busy_is_rejected`, `test_oversize_stft_fails_before_allocation`. Repetir con scope local separado, sin dar validez productiva.
- [ ] Ejecutar `python -m pytest tests/test_suspension_lab_service.py tests/test_suspension_lab_routes.py tests/test_suspension_lab_worker.py -q`; confirmar RED.
- [ ] Implementar lectura mediante `recorded_store.load_recording` para pista y T3 para banco; identidad y checksums comprobados en servidor. Transformaciones contienen calibración y filtro; sin usar `alignment.align` para reparar huecos espectrales. Adaptar calibración de aceleración/velocidad solo con IDs/unidades autorizados; no cambiar semántica de calibraciones existentes.
- [ ] Persistir análisis append-only y paginación por ámbito; ejecutar proceso aislado con presupuesto, cancelar/terminar/recolectar antes de liberar plaza. Recibir resultados solo del intento vigente. Reducir gráficos después de calcular métricas, dejando algoritmo/factor de agregación en manifiesto. Errores de formato 422, fuente ajena 404, conflicto 409, saturación 429, backend no disponible 503, timeout 504.
- [ ] GREEN focal y prueba de recuperación tras reinicio con intento incompleto. Fuente expirada mantiene manifiesto histórico pero impide reproducción con motivo; no borrar raw al retirar una selección de UI.

### T6. Anexos y referencias verificadas para agentes

**Interfaces:** `build_analysis_evidence(analysis_ref,principal,audit)->SuspensionAnalysisEvidence` con digest, intervalos, métricas acotadas, exclusiones, elegibilidad y procedencia, sin arrays. Anexo `suspension_analysis` vinculado a comparación exacta. `SnapshotSelection` incorpora lista opcional de referencias de laboratorio en versión nueva, ausente en serialización histórica. `technical_context.project` añade sección acotada de observaciones y límites; catálogo/codec acepta solo referencias persistidas del snapshot.

- [ ] RED `test_old_snapshot_digest_unchanged`, `test_analysis_ref_bound_to_team_source_and_comparison`, `test_exploratory_evidence_cannot_authorize_action`, `test_forged_analysis_reference_rejected`, `test_raw_samples_absent_from_model_context`, `test_independent_line_has_no_coordinated_conclusions`. Capturar bytes/digest de objetos históricos antes del cambio.
- [ ] `python -m pytest tests/test_suspension_lab_evidence.py -q`; confirmar RED.
- [ ] Implementar anexo independiente del informe antiguo; crear snapshot nuevo al incorporar observaciones. Añadir razón de ausencia/solicitud concreta mediante catálogo comprobado, sin nuevo especialista si basta rol existente. La línea independiente ve el mismo manifiesto, no respuestas coordinadas. No ampliar catálogo de acciones físicas ni convertir `eligible_for_review` en aprobación.
- [ ] GREEN focal más tests existentes de snapshots/codec/decisiones y ciclo de aprobación humana. Un modelo que inventa referencias se rechaza; mantener abstención válida. No usar el endpoint histórico `chatter/analyze` como evidencia nueva ni alterar su contrato por esta entrega.

### T7. Vista de banco y señales sobre el contexto compartido

**Interfaces:** DTO TypeScript alineados con T1/T5; servicio `importBench(input,signal)`, `createAnalysis(input,signal)`, `listAcquisitions(query,signal)`, `getAnalysis(id,signal)` con el cliente autenticado actual. `SuspensionLabPanel({contextKey,bikeId,recordingId,comparisonRef,workView,onEvidenceSaved})`. `SignalPlot({series,axes,units,description})` ofrece tabla y gráfico; no hace física. La vista no forma parte de la key del workspace.

- [ ] RED `tests/suspensionLabUI.test.tsx`: vacío sin datos ficticios, falta fuerza deja solo movimiento, temperatura desconocida visible, selector de intervalo no inventa fs, espectro bloqueado por banda/hueco, y explicación de fuente experimental. `tests/suspensionLabContext.test.tsx`: respuesta A tardía tras cambio a B no se adopta, cancelar impide guardado tardío, cambiar seis perfiles conserva borrador y selección.
- [ ] `npx vitest run tests/suspensionLabUI.test.tsx tests/suspensionLabContext.test.tsx`; confirmar RED.
- [ ] Añadir pestaña «Banco y señales» en taller existente con teclado y DOM coherentes; conservar todas las pestañas y una sola instancia del laboratorio. El banco puede importarse sin sesión de pista; asociar evidencia exige contexto compatible. Mostrar «Movimiento en pista»/«Ensayo de banco», fuente y estado antes de métricas, opciones avanzadas plegadas y motivos textuales. Fuerza total conserva rótulo, nunca hidráulica por estilo visual.
- [ ] Integrar importación con progreso/errores sin mutar raw ni usar defaults de equipo. Aplicar permisos de servidor; vista reader puede consultar, pero no habilita importar/calcular/guardar. Anexos e informe muestran digest, parámetros y limitaciones, manteniendo decisiones humanas existentes.
- [ ] GREEN focal, `npm run typecheck`, tests de roles y checks de taller. Añadir prueba de teclado pestañas→selección→parámetros→tabla y botón; gráfico con unidades y alternativa textual. Revisar ancho 390/1024/1366, orden de foco igual al visual y sin desbordamiento. No nuevas bibliotecas visuales.

### T8. Aceptación integrada, datos reales y revisión final

- [ ] Crear `tests/e2e/chassis-suspension-lab.spec.ts`: flujo con fixture explícito de pista, importación de banco controlado, PSD/STFT, evidencia guardada, seis vistas, informe y rechazo de autorización física ausente. Caso de banco sin sesión y posterior asociación sin inventar piloto/circuito.
- [ ] Ejecutar focals PHY/DATA, banco de autoridad real aislado y E2E. Después `npm test`, `npm run typecheck`, `npm run build`, checks de taller, regresiones pertinentes de 17/18 y paquetes fuera del checkout. Revisar argumentos de runners existentes antes de ejecutar; no repetir bancos verdes sin cambios relevantes. Diferenciar fallos previos de nuevos con evidencia, sin llamar globalmente verde a un banco parcial.
- [ ] Identificar una grabación real autorizada disponible mediante catálogo y gobernanza. Ejecutar análisis sobre copia derivada/almacenamiento de aceptación restringido; registrar canal, frecuencia/banda/cobertura y resultado reproducible sin exponer muestras. Si solo hay 2D experimental, conservar ese estado y limitar aceptación a inspección exploratoria.
- [ ] Buscar ensayo real de banco únicamente en ubicaciones autorizadas/catalogadas. Si no existe fuerza medida con referencia independiente, dejar aceptación externa pendiente: tests analíticos no la sustituyen. No pedir otra vez Analyzer como requisito del banco ni descargar un supuesto archivo validado para cerrar el bloqueo.
- [ ] Ejecutar IA local sobre snapshot real con anexo; comprobar especialista, contraste y Chief: referencias válidas y límites o abstención explícita. Registrar modelo/latencia/errores sin cambiar presupuesto ni llamar real a un mock. Si falla, modo determinista sigue consultable y conexión IA no se marca aceptada.
- [ ] Congelar paquete de revisión (archivos modificados, hashes, logs y alcance) y solicitar una revisión independiente completa según executing-plans. Aplicar una única pasada final de correcciones importantes con pruebas focales; no abrir bucle ilimitado de revisión.
- [ ] Documentar aceptación y bloqueos, actualización de matriz/operación/PRODUCT. Activación local solo tras identificar procesos propios, comprobar inactividad y backup consistente; no reiniciar servicios ajenos ni desplegar cloud. Resultado final distingue software verificado, datos reales ensayados y validación externa pendiente.

## Autorrevisión del plan

- Cobertura: A movimiento T1/T2/T5/T7; B banco T2/T3/T5/T7; C espectro T1/T4/T5/T7; persistencia/identidad T3/T5; agentes/humano T6/T8; compatibilidad y aceptación T8. Extensiones diferidas siguen en el diseño y mapa original.
- Interfaces: `AcquisitionRef` resuelve pista o banco; `SignalSeries` solo interno del motor; `AnalysisResult` almacenado no se reemplaza por arrays del cliente; agentes reciben `SuspensionAnalysisEvidence`, no curvas completas. CWT y diagnóstico no aparecen como entregables activos.
- Review Focus: los cinco fallos tienen tests nombrados en sus tareas. Resource timeout se resuelve con proceso supervisado, no thread abandonado. Catálogo de banco independiente no obliga contexto ficticio.
- Método conservado: ejecutar aquí tras confirmación del plan, sin nuevos implementadores paralelos; revisión completa al final. No implementación ni tests de producto ejecutados al redactar este documento.

## Constancia de ejecución local

Implementación y revisión final con una pasada de correcciones registradas en `docs/chassis-suspension-spectral-acceptance-2026-10-26.md`. Las casillas originales se conservan como lista de aceptación: no se declara completado el E2E integral de navegador ni IA/Chief sobre datos contrastados. Sí pasan controles HTTP, física, UI, autoridad y contratos; medición2D exploratoria ejecutada solo lectura. El Chief y cuatro especialistas pasan controles separados con modelo local real y datos sintéticos. Validación externa de banco/fabricante pendiente.

Continuación de T8: E2E de laboratorio aislado pasa, incluida recuperación después de recarga; snapshot con anexo persistido pasa sin alterar el anterior y rechaza comparación ajena. Corregidos cinco problemas operativos descubiertos por aceptación; ver informe y ledger. Permanece pendiente el escenario completo de pista/aprobación humana/Chief con referencia externa.

Continuación T8 de contexto de pista: dos casos integrales autenticados pasan, incluido Ollama real con cuatro especialistas+Chief y caso controlado de aprobación humana e invalidación. Resueltos inventario de permisos y24contratos embebidos de snapshot. La aceptación usa datos sintéticos; metrología externa/telemetría contrastada y cinco dominios sin contexto permanecen pendientes.
