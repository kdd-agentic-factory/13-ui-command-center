# Chassis Physics Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar comparación A/B de setups medidos, con telemetría calibrada, cálculos reproducibles y evidencia explicable desde Chassis Tool.

**Architecture:** Motor determinista en el paquete Python de 17; persistencia y API gobernadas en 18; espacio operativo React en 13. Primero comparación estática, después transferencia y suspensión bajo requisitos de datos explícitos. La IA consume evidencia estructurada y no calcula magnitudes mecánicas.

**Tech Stack:** Python >=3.11, Pydantic, pytest, FastAPI; React, TypeScript, Vitest y Playwright. Sin nueva biblioteca de gráficos o motor 3D.

**Spec:** `../specs/2026-10-19-chassis-physics-workspace-design.md`, aprobada por el usuario el 2026-10-19.

## Global Constraints

- SI interno; interfaz en mm, grados y N/mm.
- El backend de telemetría conserva el registro original inmutable.
- Datos restringidos por defecto; ningún envío de telemetría a un proveedor de IA por defecto.
- Un valor desconocido permanece nulo.
- Las cargas negativas señalan salida del dominio, no se recortan silenciosamente.
- Ningún estado conectado sin comprobación.
- Preservar cambios existentes de los repositorios; revisión por diff antes de cualquier commit, sin publicación automática.

## Review Focus

- Unidades ausentes o incompatibles: bloquear el cálculo dependiente sin convertir conjeturas en medidas (tareas 1 y 4).
- Reintentos y escritura interrumpida: ninguna revisión parcial ni modificación de muestras originales (tarea 2).
- Cambio de sesión o equipo: impedir asociación accidental y acceso cruzado (tareas 2 y 3).
- Relojes dispersos y huecos: no generar evidencia fuera de cobertura común (tarea 4).
- Modelo inaplicable o proveedor IA caído: conservar resultados válidos y explicar la limitación (tareas 1 y 5).

## Entregas y alcance

Las tareas 1–3 forman la primera entrega utilizable de comparación estática. La tarea 4 añade análisis calibrado y la 5 explicación de evidencia. La tarea 6 verifica operación real. La cinemática completa de bieletas, neumáticos, dinámica con inclinación y lectura binaria nativa 2D requieren planes posteriores y mediciones; no se anuncian como incluidas en esta entrega. La ausencia de una exportación 2D real deja ese criterio de validación pendiente, no invalida la comparación estática.

Todas las rutas siguientes son relativas al directorio padre de los repositorios numerados.

### Task 1: Contrato y motor físico determinista

**Files:** Crear `17-digital-twin-simulation-lab/src/digital_twin_lab/chassis/{__init__,models,physics}.py`; crear `17-digital-twin-simulation-lab/tests/unit/test_chassis_physics.py`.

**Interfaces:** `MeasuredValue(value: float | None, unit: str, provenance: str, uncertainty: float | None)`; `SetupRevision(id: str, bike_id: str, version: int, values: dict[str, MeasuredValue])`; `PhysicsResult(model_version: str, metrics: dict[str,float], missing: list[str], warnings: list[str])`. Producir `evaluate_static(setup: SetupRevision) -> PhysicsResult`, `load_transfer(setup: SetupRevision, ax_m_s2: float) -> PhysicsResult` y `spring_response(k_n_m: float, s_m: float, preload_m: float, q: float, dq_dz: float) -> PhysicsResult`. Valores de setup: `front_radius_m`, `rake_rad`, `offset_m`, `wheelbase_m`, `mass_kg`, `front_weight_fraction`, `cg_height_m`.

- [ ] Escribir pruebas: radio .3 m, rake 24°, offset .03 m → avance 0.100729517 m (tolerancia 1e-8); caso ε=0 y d=0 → avance 0. Para masa 200 kg, reparto .5 y ax=0 → cada carga 980.665 N usando g=9.80665; suma constante bajo aceleración y frenada. Muelle 100000 N/m y q=.5 constante → rigidez de rueda 25000 N/m.
- [ ] Ejecutar `python -m pytest tests/unit/test_chassis_physics.py -q` desde 17 y confirmar fallo por interfaz ausente.
- [ ] Implementar contratos y fórmulas de la especificación, validación finita y dominio; añadir pruebas para entradas nulas, NaN, batalla cero, coseno singular y carga negativa sin recorte. No reutilizar multiplicadores heurísticos de grip.
- [ ] Repetir pytest: todos los casos pasan; añadir invariancia de conversión mm↔m y parámetros asumidos identificados en resultados.
- [ ] Revisar diff y separar estos archivos para el commit de motor, sin incluir trabajo previo.

### Task 2: Revisiones persistentes y API de comparación

**Files:** Crear `18-telemetry-dataset/src/telemetry_dataset/chassis/{models,store,service}.py`, `src/telemetry_dataset/routers/chassis.py` y `tests/test_chassis_api.py`; modificar `src/telemetry_dataset/main.py`, `pyproject.toml`, `Dockerfile`, `schema-version.yaml`; crear `schemas/chassis-comparison.json`.

**Interfaces:** Consumir `SetupRevision` y `evaluate_static`. Rutas bajo `/api/v1/chassis`: `POST /setups` crea revisión inmutable con auditoría; `GET /setups/{id}`; `POST /comparisons` recibe `{setup_a_id,setup_b_id,session_id,interval_s?}` y devuelve `{id,model_version,a,b,deltas,evidence,missing,warnings}`. `deltas` es B−A exclusivamente para métricas calculadas en ambos. `POST /bindings` recibe `{session_id,setup_id,interval_s?}` y exige identidad explícita de moto. No asociar por nombre de archivo.

- [ ] Escribir pruebas HTTP para persistencia tras reconstruir el servicio, B−A, entrada incompleta y revisión anterior intacta; reproducir el fallo antes de implementar.
- [ ] Implementar almacenamiento atómico y contratos con encabezados de auditoría/API key existentes. Conservar compatibilidad de geometría antigua como revisión parcial. Añadir dependencia local versionada de 17 y construcción Docker con ambos paquetes; no depender de un PYTHONPATH externo en producción.
- [ ] Añadir pruebas de interrupción de escritura, reintento sin duplicar identificador de operación, acceso cruzado entre propietarios y asociación con sesión inexistente. Si el servicio solo tiene credencial local global, bloquear despliegue multiusuario hasta verificar aislamiento efectivo.
- [ ] Ejecutar `python -m pytest tests/test_chassis_api.py tests/test_recorded_sessions.py -q` desde 18. Verificar instalación en entorno limpio y arranque sin directorio de trabajo del monorepo.
- [ ] Versionar esquema, documentar migración reversible y revisar diff independiente de motor.

### Task 3: Espacio Chassis y comparación A/B

**Files:** Modificar `13-ui-command-center/src/pages/ChassisPage.tsx`, `src/services/recordedTelemetry.ts`, `src/styles/recorded.css`; crear `src/components/chassis/{SetupEditor,GeometryComparison,EvidencePanel}.tsx`, `src/domain/chassisComparison.ts`, `tests/chassisComparisonUI.test.tsx`.

**Interfaces:** `createSetup(input)`, `compareSetups({setup_a_id,setup_b_id,session_id})` y `bindSetup(...)` reflejan contratos de tarea 2. Componentes reciben resultados tipados del backend; no duplican física ni calculan recomendaciones.

- [ ] Escribir pruebas UI que parten de sesión real seleccionada, crean A/B y muestran avance y delta; una medida ausente muestra qué introducir. Confirmar fallo inicial.
- [ ] Implementar paneles de parámetros, esquema SVG 2D con cotas y resultados A/B según la especificación; reutilizar trazas existentes. Añadir etiquetas de procedencia, unidades, carga/error y foco. La acción de comparar indica qué sesión y revisiones se usarán.
- [ ] Probar cambio de sesión durante petición y respuesta fuera de orden: descartar resultados obsoletos; no heredar binding. Probar error de API y recarga conservando revisiones guardadas.
- [ ] Ejecutar `npx vitest run tests/chassisComparisonUI.test.tsx tests/recordedImportUI.test.tsx` y `npm run typecheck`; resultados sin fallos.
- [ ] Revisar visualmente escritorio, 768px y 390px: sin desbordamiento, foco visible y orden de lectura coherente; registrar capturas y revisión del diff.

### Task 4: Calibración y comparación con señales reales

**Files:** Crear `18-telemetry-dataset/src/telemetry_dataset/chassis/{calibration,alignment,evidence}.py`, `tests/test_chassis_signals.py`; extender rutas y contrato de tareas 2–3.

**Interfaces:** `calibrate(signal, calibration) -> DerivedSignal`; `align(signals, grid_s, max_gap_s) -> AlignedSignals`; `build_evidence(session_id, setup_revision, interval_s, transforms) -> list[EvidenceItem]`. Cada señal derivada conserva IDs originales, unidades y parámetros; huecos son ausencias explícitas, nunca ceros. El cliente puede solicitar transferencia solo con aceleración calibrada o estimación GPS identificada.

- [ ] Escribir casos de relojes irregulares, huecos, ms/s, mm/m, signo invertido y cero de extensión; verificar muestras originales idénticas antes/después y ausencia de extrapolación.
- [ ] Ejecutar `python -m pytest tests/test_chassis_signals.py -q`, confirmar rojo y después implementar conversiones declaradas y alineación lineal únicamente dentro de tolerancia explícita.
- [ ] Añadir pruebas de derivación con filtro parametrizado y ausencia de aceleración: transferencia queda bloqueada sin sustituirla por una constante. Curva de suspensión requiere medición de relación o puntos medidos, no un ratio de ejemplo.
- [ ] Repetir pruebas y contrastar canal/intervalo con exportación AiM real. Incorporar una exportación 2D real cuando se facilite y comparar unidades, puntos y tiempos contra software de origen; mantener pendiente ese criterio mientras no exista.
- [ ] Documentar fórmulas, filtros, incertidumbre y limitaciones en cada evidencia; revisar el diff.

### Task 5: Explicación de evidencia por IA

**Files:** Crear `18-telemetry-dataset/src/telemetry_dataset/chassis/recommendations.py`, `tests/test_chassis_recommendations.py`; ampliar `EvidencePanel.tsx`.

**Interfaces:** `recommend(evidence: list[EvidenceItem], provider: ExplanationProvider | None) -> RecommendationResult`; salida con observaciones, cálculos, hipótesis, referencias y prueba sugerida. Proveedor desactivado por defecto; sin proveedor, devuelve explicación determinista útil.

- [ ] Escribir pruebas con evidencia insuficiente, referencias inventadas, respuesta inválida y timeout: no mostrar afirmación sin referencia válida ni clics/ganancias sin modelo identificado.
- [ ] Implementar primero reglas locales de elegibilidad; añadir adaptador opcional sin transmitir raw/GPS/identidades. El envío externo requiere configuración y autorización de datos conforme a gobernanza, nunca se habilita por tener una API key.
- [ ] Ejecutar `python -m pytest tests/test_chassis_recommendations.py -q` y pruebas UI; verificar caída del proveedor conservando métricas y evidencia.
- [ ] Revisar recomendaciones contra mediciones y presentar límites visibles; registrar revisión del diff.

### Task 6: Verificación operativa de extremo a extremo

**Files:** Crear `13-ui-command-center/tests/e2e/chassis-recorded.spec.ts`, `docs/chassis-operation.md`; actualizar `18-telemetry-dataset/docs/recorded-imports.md` con contratos y dependencias.

**Interfaces:** Consumir servicios y recorridos anteriores; producir matriz de capacidad con estado comprobado, plataforma, dependencia y evidencia de prueba. No declarar operativo un módulo por renderizar su pantalla.

- [ ] Probar importación → setup A/B → comparación → evidencia → recarga y error del backend. Añadir circuito desconocido, sesión sin suspensión, navegación por teclado y viewport móvil. Fixtures se etiquetan como tales; no reemplazan validación real.
- [ ] Ejecutar suites focales Python, suite frontend completa, `npm run typecheck`, `npm run build` y Playwright de este flujo; registrar comandos, resultados y limitaciones.
- [ ] Comprobar dos webs, lector, paquete físico, almacenamiento, autorización y estado de IA. Inventariar módulos restantes con estados pendiente/degradado/operativo y prueba asociada. Verificar que no existen éxitos simulados en el flujo real.
- [ ] Revisar conjunto y cambios de cada repositorio; no publicar ni declarar producción lista con aislamiento, SDK, datos 2D o validación experimental pendientes.

## Autorrevisión del plan

Contratos, unidades y responsabilidad del cálculo están definidos en tareas 1–2; interfaz en 3; señales y trazabilidad en 4; explicación en 5; operación en 6. Las cinco clases de riesgo tienen pruebas asignadas. La primera entrega puede funcionar sin proveedor IA ni sensores de suspensión. Las extensiones excluidas permanecen explícitas y no se confunden con criterios satisfechos.

Estado: pendiente de revisión del plan y elección de ejecución. Se recomienda ejecución nativa en esta sesión, con revisión independiente al final, por la dependencia estrecha de los contratos entre los tres repositorios.
