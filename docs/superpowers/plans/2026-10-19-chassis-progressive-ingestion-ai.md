# Progressive Chassis, 2D and Evidence AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comparar suspensión progresiva con datos reales y producir recomendaciones trazables, ampliando la ingestión de los paquetes 2D encontrados sin fingir validación.

**Architecture:** Extender el núcleo puro de 17 con curvas versionadas. El servicio 18 valida archivos, calibra señales y produce evidencia y hallazgos; 13 permite introducir curvas, seleccionar mediciones y consultar recomendaciones. Un modelo local opcional solo prioriza hallazgos verificables, sin inventar cálculos.

**Tech Stack:** Python 3.11+, Pydantic, stdlib ZIP/struct, FastAPI/httpx, pytest; React/TypeScript, Vitest, Playwright. Núcleo de interpolación independiente de SciPy; SciPy puede servir como referencia de desarrollo.

**Spec:** `../specs/2026-10-19-chassis-progressive-ingestion-ai-design.md`, aprobada en esta conversación.

## Global Constraints

- SI interno, datos finitos, 3–500 puntos, ambos ejes estrictamente crecientes y referencia de extensión completa declarada.
- Interpolación cúbica Hermite monótona PCHIP, sin extrapolación.
- Usar todos los puntos de telemetría válidos para los extremos, no solamente mínimo y máximo de desplazamiento.
- Leer sin extraer sobre raw y limitar recursos también durante la descompresión.
- No fingir que reglas son inferencia de un LLM.
- No se elimina el bloqueo de producción multiusuario del trabajo anterior.
- Mantener ramas, checkouts y cambios anteriores; no realizar commits, publicaciones o descargas masivas de modelos sin una decisión explícita.

## Review Focus

- Unidades, ceros y referencia de carrera incoherentes: no convertir silenciosamente ni producir fuerzas (tareas 1–3).
- Curvas con nodos, extremos interiores o muestras fuera de rango: devolver cobertura y límites, nunca extrapolar (tareas 1–2).
- ZIP con traversal, duplicados, truncamiento o expansión excesiva: fallo antes de persistir una sesión parcial (tarea 4).
- Variantes 2D desconocidas, pausas o escalas ambiguas: excluir o bloquear e informar cobertura, sin valores plausibles inventados (tarea 4).
- Modelo local ausente o salida inventada: conservar evidencia y reglas e indicar el fallo de inferencia (tarea 5).

Rutas relativas al directorio que contiene los repositorios numerados. Ejecución nativa preservada; se solicita revisión de este plan antes de comenzar.

### Task 1: Curva progresiva y referencia numérica

**Files:** Crear `17-digital-twin-simulation-lab/src/digital_twin_lab/chassis/linkage.py`, `tests/unit/test_chassis_linkage.py`; modificar `chassis/models.py` y `chassis/physics.py`.

**Interfaces:** `LinkagePoint(wheel_m: float, shock_m: float)`; `LinkageCurve(points: list[LinkagePoint], provenance: measured|assumed, reference: full_extension, source: str)`; `SetupRevision.linkage_curve: LinkageCurve | None = None`. `linkage_at_shock(curve, shock_m) -> {wheel_m,q,dq_dz,left_dq_dz?,at_knot}` y `progressive_response(curve,k_n_m,preload_m,shock_m) -> PhysicsResult`. Modelo nuevo `chassis-planar-1.1.0`; revisiones previas permanecen legibles.

- [ ] Escribir pruebas lineales con z=[0,.05,.1], s=[0,.025,.05]: q=.5 y rigidez 25000 N/m para k=100000, precarga .01 y s=.02. Probar inversión, extremos, dato fuera del intervalo y duplicados. Ejecutar `python -m pytest tests/unit/test_chassis_linkage.py -q` desde 17 y observar rojo.
- [ ] Implementar PCHIP con pendientes armónicas y limitación de extremos según referencia, coeficientes Hermite y derivadas analíticas. Invertir por bisección acotada a error de rueda <=1e-9 m. No importar servicios o SciPy en el núcleo.
- [ ] Añadir curva z=[0,.03,.06,.09,.12], s=[0,.012,.027,.045,.066]; contrastar valores y derivadas con referencia independiente, incluidos nodos y límites laterales. Rechazar referencia distinta de extensión completa, entradas no finitas y q no positiva; probar equivalencia de fuerza/rigidez con la fórmula física puntual.
- [ ] Ejecutar pruebas nuevas y `tests/unit/test_chassis_physics.py`; todos los casos pasan. Guardar el resultado y diferencias en el ledger, sin mezclar archivos previos en un commit.

### Task 2: Persistencia, replay y cobertura

**Files:** Modificar `18-telemetry-dataset/src/telemetry_dataset/chassis/{models,service,evidence}.py`, esquema empaquetado y `schema-version.yaml`; crear `tests/test_progressive_evidence.py`.

**Interfaces:** `SetupInput.linkage_curve` consume tarea 1 y se incluye en fingerprint/idempotencia. `revision()` conserva la curva. Evidencia progresiva añade `valid_sample_count`, `excluded_sample_count`, `coverage_fraction`, extremos y causas de exclusión. Producir resultados por revisión A/B usando la misma señal de amortiguador.

- [ ] Escribir pruebas de guardado/recarga de curva, revisión antigua sin curva, reintento conflictivo y replay donde el extremo de rigidez no coincide con extremo de carrera. Confirmar rojo.
- [ ] Implementar evaluación por muestra sobre carrera de amortiguador calibrada y referenciada. Hasta 250000 muestras por cálculo; si excede, bloquear ese cálculo e informar el límite, sin reducir silenciosamente muestras para física. Conservar geometría ante fallo dependiente.
- [ ] Añadir pruebas de cobertura parcial/cero, nodo, desbordamiento, referencia incompatible y A/B con dominios diferentes. Para rigidez en nodos comprobar ambos límites cuando proceda; etiquetar la discontinuidad del interpolante.
- [ ] Bump de contrato compatible a 1.1.0 y registro 1.3.0; esquema admite tanto versión previa como nueva. Ejecutar `python -m pytest tests/test_progressive_evidence.py tests/test_chassis_api.py tests/test_chassis_package.py -q` desde 18 y confirmar verde.

### Task 3: Curva y resultados en el espacio Chassis

**Files:** Crear `13-ui-command-center/src/components/chassis/LinkageCurveEditor.tsx`; modificar dominio, `SetupEditor.tsx`, `ChassisComparison.tsx`, `EvidencePanel.tsx`, `recorded.css`; crear `tests/linkageCurveUI.test.tsx`.

**Interfaces:** Curva tipada igual a API. Editor recibe curva A/B y callback; entrada de pares rueda/amortiguador en mm, procedencia y referencia. La aplicación convierte a metros solo con unidad explícita. La gráfica no altera los puntos guardados ni representa una curva de ejemplo cuando falta medición.

- [ ] Escribir pruebas de pares válidos, unidades, orden/duplicados, restauración y separación A/B; confirmar rojo con `npx vitest run tests/linkageCurveUI.test.tsx`.
- [ ] Implementar edición y pegado de tabla de dos columnas con unidad visible, vista de puntos y validación. Mantener los inputs previos y la recuperación tras fallo. Mostrar cobertura, exclusiones y aviso de datos asumidos.
- [ ] Verificar que editar curva marca resultados anteriores como no recalculados; cambiar sesión no mezcla curvas ni resultados. Ejecutar pruebas nuevas, `tests/chassisComparisonUI.test.tsx` y `npm run typecheck`.

### Task 4: AiM verificable y paquetes 2D reales

**Files:** Crear `18-telemetry-dataset/src/telemetry_dataset/parsers/two_d_package.py`, `tests/test_two_d_package.py`, `tests/test_reader_capabilities.py`; modificar `verified.py`, `routers/recorded.py`, diccionario de sensores y registro de esquema si se amplía el contrato; modificar `13/src/pages/ConnectDataPage.tsx` y servicio de importación.

**Interfaces:** `inspect_2d_zip(content: bytes) -> MeasurementManifest[]`; `decode_2d_measurement(content: bytes, measurement_path: str) -> RecordedPayload`. Añadir ruta multipart `POST /api/v1/recorded/inspect-2d` y selector de medición en importación. `GET /api/v1/recorded/capabilities` informa plataforma/lector disponible y validación, sin simular hardware.

- [ ] Escribir fixtures pequeños de MES con DDD/canales/relojes, ZIP traversal/duplicado/bomba/cifrado/truncado y multimedición; observar fallo inicial. Límites: 100MiB comprimidos, 512MiB expandidos, 5000 entradas, ratio agregado 100:1; verificar lecturas acotadas y CRC.
- [ ] Inspeccionar en memoria los dos ZIP ASPAR originales y documentar las variantes observadas. Tipos, escala, frecuencia y reloj que no puedan identificarse inequívocamente no producen muestras. Separar metadatos legibles de lectura numérica.
- [ ] Implementar lector del subconjunto inequívoco, sin extraer raw, con exclusiones detalladas y estado experimental hasta contraste del fabricante. No llamar DLL AiM para archivos 2D. Identificar `Susp_F` y `Susp_R` mediante IDs del diccionario, conservando nombres y unidades originales.
- [ ] Contrastar una medición/canales con exportación 2D o referencia equivalente. Si falta, registrar el bloqueo de validación, conservar importación oficial CSV y no marcar el lector nativo como comercialmente validado. Añadir guía de exportación/script usando documentación oficial; no inventar un SDK ni ejecutar programas sin verificar su presencia.
- [ ] Probar AiM real en dos sesiones distintas con SDK existente, validar estructura y persistencia e informar versión/plataforma. `python -m pytest tests/test_two_d_package.py tests/test_reader_capabilities.py tests/test_verified_import.py tests/test_aim_channel_groups.py -q` debe pasar. Las pruebas reales se mantienen locales y no versionan datos privados.

### Task 5: Hallazgos y modelo local con salida restringida

**Files:** Crear `18-telemetry-dataset/src/telemetry_dataset/chassis/findings.py`, `local_explainer.py`, `tests/test_chassis_findings.py`, `tests/test_local_explainer.py`; ampliar `recommendations.py`, esquema y panel de evidencia.

**Interfaces:** `build_findings(evidence) -> list[Finding]`, con ID, tipo, evidencia referenciada, magnitud/unidad, limitación y prueba sugerida. `explain_local(findings, model, endpoint) -> ExplanationStatus`. El modelo devuelve solo orden de IDs y selección de pruebas de un catálogo permitido; los números y afirmaciones mecánicas los fija el motor.

- [ ] Escribir pruebas para cobertura nula/parcial, diferencias de rigidez sin calificar “mejor”, datos estimados y ausencia de canales. No usar límites mecánicos universales: cualquier alerta de margen necesita margen explícito del setup.
- [ ] Implementar hallazgos y recomendaciones con referencias. Si solo falta una medición, proponer medirla; si el modelo salió de dominio, no recomendar ajustes de chasis basados en ese cálculo.
- [ ] Añadir adaptador HTTP local compatible con Ollama, endpoint exclusivamente loopback sin credenciales ni redirecciones, timeout 8s y sin reintentos. Configuración solo servidor (`CHASSIS_LOCAL_MODEL`, `CHASSIS_LOCAL_MODEL_URL`); sin descarga automática de modelos. Proveedor no configurado/no disponible se muestra explícitamente.
- [ ] Probar modelos ausentes, timeout, JSON inválido, IDs inventados, duplicados y selección fuera del catálogo; comprobar que no se envían raw/GPS/identidades. Solo aceptar ordenación verificable; conservar salida determinista ante cualquier fallo.
- [ ] Ejecutar `python -m pytest tests/test_chassis_findings.py tests/test_local_explainer.py tests/test_chassis_recommendations.py -q`. Mostrar proveedor y estado reales en la interfaz; no atribuir inferencia a reglas locales.

### Task 6: Revisión, empaquetado y puertas comerciales

**Files:** Ampliar `13/tests/e2e/chassis-recorded.spec.ts`, `docs/chassis-operation.md` y docs del lector; conservar ledger de esta ejecución.

- [ ] Probar en navegador: selección 2D, importación compatible, A/B con curva, calibración, cobertura y recomendaciones, recarga y fallo de servicio. Añadir escritorio/móvil y teclado. Fixtures explícitos y validación real separadas.
- [ ] Ejecutar suites de motor/backend, frontend completo, tipos/build, Ruff y Playwright. Verificar wheel fuera del checkout y Docker `chassis-core`. No anunciar runtime completo histórico sin construirlo.
- [ ] Solicitar una revisión independiente final de contratos, unidades, relojes, seguridad de ZIP y procedencia de recomendaciones; corregir importantes mediante RED→GREEN y suite verde.
- [ ] Actualizar matriz de venta con evidencia: lectura AiM, subconjunto 2D, contraste 2D pendiente/validado, curvas medidas disponibles/ausentes, modelo local disponible/ausente, y autenticación/despliegue separados. Mantener restricciones concretas visibles.

## Autorrevisión

Curvas y fuerzas están en tareas 1–2; editor en 3; datos reales/ZIP y reloj en 4; recomendaciones e inferencia opcional en 5; operación y empaquetado en 6. Los fallos principales tienen pruebas asignadas. No se exige comprar licencias, instalar un modelo grande o inventar medidas para que la parte determinista funcione. Si falta referencia 2D o medición de bieletas, se informa como condición pendiente de validación, no como éxito simulado.
