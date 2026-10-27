# Banco y señales — estado local 2026-10-26

Ampliación integrada dentro de Chassis sin sustituir el taller ni el flujo A/B. La revisión independiente recibió una pasada conjunta de correcciones. El producto aún necesita aceptación externa y operativa antes de anunciarlo listo para vender.

## Implementado

- Movimiento registrado con recorrido original completo, velocidad medida o estimada explícitamente, máscara de derivación, cobertura e histograma.
- CSV privado con fuerza y desplazamiento, velocidad o ambos; calibración y condiciones explícitas. Originales, resultados y manifiestos inmutables. Catálogos paginados sin cargar muestras.
- Curvas fuerza/velocidad y fuerza/desplazamiento, series temporales y cursor común. Trabajo por ciclo solo con sincronización y convención declaradas; no se unen ciclos separados por una parada. Fuerza total no se presenta como hidráulica aislada.
- Welch y STFT con política temporal, banda, unidades y límites de recursos. Última ventana completa conservada; no se publican ventanas rellenadas ni diagnósticos a partir de picos.
- Worker supervisado; cancelación comprobada también al esperar el bloqueo SQLite y antes de publicar. Reintentos con identificador estable; recuperación, protección de cambios locales y retirada del anexo del próximo snapshot.
- Anexos acotados y referencias escalares verificadas en los contratos de 01/02/18. Los especialistas pueden citar observaciones; datos exploratorios mantienen el bloqueo de autorización física. La decisión final sigue siendo del Crew Chief humano o sustituto designado.
- Base nueva por defecto en `18/data/suspension-lab.sqlite`, fuera de raw. La base antigua bajo raw se conserva sin mover, adoptar ni borrar.

## Evidencia comprobada

- Interfaz: 95 archivos, 433 pruebas pasan antes de la última protección de acciones durante el cálculo; después pasan las 8 pruebas focales de laboratorio/contexto. TypeScript y build final pasan. Persiste la advertencia de tamaño de bundle.
- Backend actualizado: 114 pruebas de laboratorio, contratos, snapshots y contexto pasan. Tras corregir el arranque concurrente, pasan 43 focales y 76 regresiones de identidad, sesiones y propuestas.
- Física de señales, banco y espectro: 15 pruebas pasan. Gateway: 52 pasan. Orquestador: 126 pasan usando el entorno con las dependencias de validación disponibles.
- Regresión de propuestas, informes, ejecuciones, sesiones, snapshots y evidencias en PostgreSQL aislado: 127 pasan, 3 omitidas. La ejecución global anterior agotó su límite; no se cuenta como aprobada. Los bloques restantes pasan: 130 pruebas de autoridad/integración y 65 de contratos/contexto/decisiones.
- Wheels 17/18 construidos sin instalar e importados desde artefactos desempaquetados; backend numérico, cuatro esquemas y ruta comprobados.
- Reducción de 250.000 muestras a 4.000 puntos: 0,032 s en esta máquina, medida sobre entrada controlada; no es garantía de latencia completa del servicio.
- Modelo local real qwen3:0.6b: cuatro especialistas emitieron decisiones con referencias verificadas en un contexto sintético controlado. El Chief también completó síntesis con el modelo real en 4,14 s sobre un caso sintético incompleto y aislado. Estos controles no equivalen a aceptación integral sobre telemetría contrastada.

## Datos existentes y pendientes

La grabación nativa 2D examinada contiene 75.920 muestras de suspensión delantera a 100 Hz y cumple la política temporal. Movimiento conserva las 75.920 muestras; cobertura de la velocidad estimada 99,9947 %. Welch usa 592 segmentos. Ambos resultados son exploratorios por falta de contraste independiente, calibración y documentación de antialias. Comprobación solo lectura, sin persistencia ni exportación de muestras.

La grabación derivada de AiM inspeccionada contiene 10.370 muestras de aceleración, frecuencia efectiva aproximada 50 Hz y jitter máximo aproximado 65 %. Se rechaza el espectro bajo la política del 1 %; no se remuestrea ni se disimula el defecto temporal.

La aceptación de navegador del laboratorio pasa en Chromium contra un backend real vacío y separado: importar CSV controlado con desplazamiento y velocidad, curvas de banco, seis vistas, Welch, STFT, anexo, recarga y recuperación con la misma referencia/digest. No emplea respuestas HTTP simuladas ni escribe en las sesiones del usuario. Este caso no certifica el recorrido completo de pista, aprobación humana y agentes sobre telemetría contrastada. No se ha acreditado un ensayo externo de banco con fuerza medida y referencia independiente. Permanecen pendientes el contraste fabricante 2D, aceptación integral con IA/Chief y datos contrastados, hardware AiM, identidad productiva y operación de nodos federados. Backend, gateway y worker locales recargados con backup consistente y sin ejecuciones activas; health ok y siete rutas nuevas. La huella del antiguo DB bajo raw no cambia. No se han desplegado servicios cloud ni aplicado migraciones. No hay diagnóstico certificado de cavitación, chatter, fatiga, RUL o ganancia de vuelta.

Logs y manifiestos locales: `.superpowers/sdd/2026-10-26-chassis-suspension-spectral/`. La captura móvil muestra el laboratorio vacío, sin exponer telemetría. El original CSV se almacena como BLOB privado en una transacción con catálogo e índice; esta decisión sustituye el staging de archivos previsto y evita publicaciones parciales.

## Cierre de fallos detectados durante la aceptación

1. El formulario de importación ya no se trata como un borrador de cálculo pendiente al completarse la importación.
2. Sin comparación activa no se ofrece adjuntar evidencia al snapshot.
3. Las acciones del resultado anterior quedan deshabilitadas durante un cálculo; la cancelación sigue siendo explícita.
4. Los números decimales de los anexos se normalizan antes de construir la huella canónica del snapshot. El esquema de contexto/gateway acepta los decimales SI normalizados; el snapshot histórico conserva exactamente sus bytes. Se rechaza un anexo de otra comparación.
5. La migración local de propiedad se serializa mediante una reserva SQLite y vuelve a comprobar columnas. La copia previa se obtiene por una conexión de lectura separada; los objetos antiguos mantienen propietario nulo. Una base nueva nace con las columnas completas.

Comando reproducible de navegador desde 13: `npx playwright test --config playwright.suspension.config.ts`. Usa puertos locales 5174/8184 exclusivos y conserva datos sintéticos en el workspace de aceptación. El proxy sigue siendo del mismo origen y conserva la CSP; no apunta al backend habitual 8180. No requiere Analyzer ni credenciales cloud.

Resultado del E2E final: 1 prueba pasa en 41,2 s, incluyendo 37,1 s de caso; los controles anteriores fallidos se conservan como evidencia de depuración. Las cuatro inferencias locales sobre cantidades normalizadas pasan (3,84/1,14/1,16/1,12 s), siempre con contexto sintético identificado. Registro de esquemas 7.2.1 / contrato de herramientas 5.1.1.

## Continuación — contexto de pista, equipo y Chief

Corregidos dos bloqueos descubiertos por una prueba autenticada de extremo a extremo:

- La política de rutas no incluía el laboratorio. Ahora enumera sus seis rutas de consulta y dos operaciones de escritura: los lectores consultan y solo ingenieros/administradores importan o calculan. Las rutas desconocidas y las acciones físicas siguen denegadas; la pertenencia y propiedad se comprueban en servidor.
- Veinticuatro definiciones embebidas de TaskContract todavía exigían snapshot1.0, aunque el modelo de agente admitía1.1. Esto rechazaba el claim o los resultados antes de la inferencia. Contratos de herramientas y ambos alias de resultado ahora aceptan1.0/1.1 y rechazan versiones desconocidas. Las versiones wire y huellas históricas no se reescriben. Registro7.2.2, herramientas5.1.2, artefactos de resultado3.0.1 (wire3.0.0).

Aceptación nueva: **2 casos pasan en74,70s**, en HTTP real con SQL de autoridad en un PostgreSQL local efímero, gateway y workers independientes. El contexto incluye circuito, moto, piloto, comparación A/B y movimiento calculado por el worker numérico; el anexo se resuelve y se guarda en snapshot1.1. En el caso con transporte de inferencia controlado también se aprueba mediante la identidad designada de Chief y se comprueba la invalidación al editar la sesión y al revocar la membresía.

En el segundo caso se usa **Ollama real qwen3:0.6b**: los cuatro agentes chassis, mechanical-check, evidence-quality y alternative-hypotheses completan revisión con referencias verificadas de geometría y suspensión, seguida de síntesis del Chief. Total5llamadas, sin ampliar presupuestos. Los datos son **controles sintéticos**, no evidencia de precisión de AiM/2D ni validación del banco. Los otros cinco dominios del run carecen aquí de contexto proyectado y declaran bloqueo o indisponibilidad; esta prueba no acredita su análisis.

Regresiones finales:89pruebas de contratos/identidad/snapshots/decisiones pasan;5casos integrales históricos pasan en84,30s;52del gateway pasan; wheels17/18 reconstruidos e importados fuera del checkout. Los logs RED se conservan. El runner Linux de dependencias prestadas desde Windows no puede ejecutar el nuevo worker NumPy; la aceptación numérica completa se ejecutó en el entorno nativo compatible. El harness permite `KDD_QA_SHARED_PYTHON=1`, añadiendo dependencias faltantes al final de sys.path para conservar la ABI del intérprete; no instala ni sustituye paquetes.

Servicios locales recargados con copia consistente `chassis-before-annex-contracts-20261026T194428999260Z.sqlite`, sin ejecuciones de usuario activas. La referencia independiente de2D, el ensayo de banco externo y la aceptación científica con datos contrastados permanecen abiertos. No se aplican migraciones cloud ni se otorga aprobación humana a los agentes.
