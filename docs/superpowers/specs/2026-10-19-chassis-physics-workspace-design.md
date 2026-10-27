# Chassis Tool: modelo físico y espacio de trabajo

Estado: propuesta para revisión; motor ampliado e interfaz todavía sin implementar.

## Resultado buscado

El ingeniero importa una sesión real, identifica moto y configuración, compara dos setups medidos y consulta qué observaciones respaldan cada hipótesis de cambio. Chassis Tool es la entrada operativa de la aplicación. La web pública explica el producto y conduce a este espacio. Una pantalla visible no equivale a una integración operativa.

## Punto de partida verificado

- La aplicación principal importa AiM mediante su DLL oficial de Windows y exportaciones tabulares con unidades; conserva los relojes originales de cada canal. Las sesiones probadas de AiM incluyen GPS y RPM, sin canales identificados de suspensión.
- La lectura tabular de 2D tiene pruebas de formato; falta validarla con una exportación real del cliente. Los binarios nativos 2D siguen rechazándose de forma explícita.
- El chasis actual guarda radio delantero, lanzamiento y offset; calcula avance estático. No calcula una dinámica completa ni justifica cambios de hidráulicos.
- El laboratorio 17 contiene ecuaciones elementales aprovechables y servicios heurísticos. Sus multiplicadores de grip, parámetros fijos y ejemplos no constituyen validación física.
- Los módulos sin integración real muestran su estado pendiente. Conexiones de hardware, nube e IA requieren verificación independiente; no se activan por un temporizador.

## Alternativas y decisión propuesta

1. **Geometría medida y modelo cuasiestático**, recomendado: resultados auditables, requisitos de medición explícitos y comparación A/B útil antes de disponer de todos los sensores.
2. Simulación multicuerpo completa: permite explorar fenómenos adicionales, pero exige identificación de masas, inercias, neumáticos y amortiguadores y una campaña de validación mucho mayor.
3. Recomendaciones directas de un LLM sobre gráficas: rápida presentación, insuficiente trazabilidad mecánica. No se adopta como motor de cálculo.

## Contratos y responsabilidad del cálculo

El backend de telemetría conserva el registro original inmutable. El motor físico será un módulo Python puro del laboratorio 17, con funciones deterministas y sin dependencias de interfaz; el backend 18 lo consumirá como dependencia versionada. La integración deberá probar también su empaquetado y arranque aislado.

Se añaden entidades versionadas: `BikeGeometry`, `SetupRevision`, `SensorCalibration`, `SessionSetupBinding`, `ComparisonRun` y `EvidenceItem`. Cada valor físico incluye unidad SI, origen, fecha y estado medido/asumido; incertidumbre cuando esté disponible. Un valor desconocido permanece nulo. Cada ejecución guarda versiones de modelo y entradas, selección temporal, transformaciones y advertencias. Una sesión puede asociarse a revisiones distintas por intervalos explícitos, sin sobrescribir el original.

La API propuesta crea revisiones de setup y ejecuta comparaciones por identificadores de revisión y sesión; nunca acepta resultados precalculados del navegador como evidencia. Conserva los encabezados de auditoría y controles de acceso existentes. El aislamiento entre equipos deberá quedar verificado antes de exposición externa. Datos restringidos por defecto; ningún envío de telemetría a un proveedor de IA por defecto.

Las geometrías antiguas de tres campos se conservan como revisiones parciales; se solicitan las mediciones que falten para cada cálculo. No se completan silenciosamente con una moto de ejemplo.

## Modelo físico inicial

Convenciones: SI interno; interfaz en mm, grados y N/mm. Lanzamiento ε desde la vertical, offset d perpendicular al eje de dirección, aceleración longitudinal positiva hacia delante. El modelo inicial es plano, moto vertical, dirección centrada y terreno nivelado.

- Avance en el suelo: `t = (Rf sin ε − d) / cos ε`; avance normal `tn = t cos ε`. Mostrar también batalla, no convertir un avance aislado en una puntuación de estabilidad. La geometría con inclinación requiere un modelo adicional de dirección y neumático. [Referencia geométrica de Dynamotion](https://www.dynamotion.it/dinamoto/8_on-line_papers/Avancorsa/avancorsa_eng.htm).
- Transferencia longitudinal sin aerodinámica: `Fzf = m g rf − m ax h / L`, `Fzr = m g − Fzf`. Requiere masa total con piloto y combustible, reparto estático delantero rf, altura del centro de gravedad h y batalla L. Las cargas negativas señalan salida del dominio, no se recortan silenciosamente. Pendiente, cabeceo transitorio y aero quedan fuera de esta versión. [Modelo de cuerpo y cargas de MathWorks](https://www.mathworks.com/help/sdl/ref/vehiclebody.html).
- Suspensión: una curva medida `s=f(z)` relaciona compresión de amortiguador y rueda. Con `q=ds/dz`, `Fs=k(s+p)`, resulta `Fw=Fs q` y rigidez tangente `kw=k q² + Fs dq/dz`. Para relación constante, `kw=k q²`. La precarga cambia fuerza inicial; no cambia la constante del muelle. La relación inversa de palanca debe etiquetarse como `dz/ds` para evitar errores de convención.
- La cinemática de bieletas requiere puntos de anclaje, longitudes y referencias de extensión medidos. No deducir lanzamiento dinámico o anti-squat únicamente de la altura trasera. Esa extensión necesita solver geométrico y ensayos específicos posteriores.

Las revisiones A/B pueden comparar geometría y respuesta cuasiestática bajo la misma entrada. Comparar dos sesiones observadas permite detectar diferencias, pero no atribuirlas causalmente al setup sin controlar piloto, neumáticos, combustible, meteorología y trazada.

## Telemetría y calibración

Cada canal conserva reloj, unidad y nombre originales, identificador canónico si se conoce, escala, signo, cero y calidad. Cualquier señal derivada referencia sus canales y parámetros. La conversión a SI es explícita; unidades desconocidas bloquean cálculos dependientes. No mezclar relojes ni rellenar huecos silenciosamente.

La alineación para cálculos multicanal declara rejilla temporal, método y tolerancia máxima; fuera de cobertura o sobre huecos devuelve dato ausente. Los gráficos distinguen vista reducida y muestras completas. Derivar velocidad de suspensión exige filtro identificado y sensibilidad al ruido. La aceleración obtenida de GPS se etiqueta como estimación cinemática con su incertidumbre; no sustituye una medición directa sin indicarlo.

GPS y RPM permiten análisis limitado de movimiento. No identifican por sí solos hidráulicos, fuerzas del amortiguador, grip o anti-squat. Los clics de regulación requieren curvas de banco o un modelo identificado; presión de freno no es directamente par de frenado.

## Evidencia y recomendaciones de IA

Primero se generan resultados y condiciones mediante reglas deterministas. Cada evidencia contiene sesión, revisión, versión del modelo, canales, intervalo, fórmula y calidad. La IA puede explicar estos resultados y proponer hipótesis; debe separar observación, cálculo e hipótesis y citar los identificadores utilizados.

Una propuesta muestra motivo, magnitud observable, limitaciones y qué medición o prueba A/B podría confirmarla. Si faltan datos, recomienda medir. No promete ganancias de vuelta ni número de clics sin un modelo validado que lo sustente. La aplicación sigue siendo útil con IA desactivada.

## Diseño operativo

Mantener los tokens y accesibilidad de `design.md`. Barra superior: moto, sesión real, estado de lectura y acción de importación. Navegación principal: Chassis, Sesiones, Comparaciones; los restantes módulos indican disponibilidad verificable.

En escritorio: selector y parámetros A/B a la izquierda; esquema geométrico 2D con cotas y trazas sincronizadas en el centro; diferencias, calidad y evidencias a la derecha. En tablet, dos columnas; en móvil, secuencia mediciones → comparación → trazas → evidencia. No introducir una escena 3D decorativa como requisito del flujo.

Valores medidos, asumidos y ausentes usan texto además de color. Controles con unidad y límites visibles, foco de teclado, errores asociados al campo y estado estable al cargar. Cambiar de sesión mantiene la geometría únicamente mediante una asociación confirmada, nunca por herencia accidental. La aplicación preserva el trabajo ante errores de lectura y permite retirar una selección sin borrar el archivo original.

## Validación y aceptación

1. Importar un AiM real y repetir lectura: mismos canales, unidades, tiempos y hash. Probar archivos truncados, errores del SDK y límites de recursos.
2. Validar una exportación 2D real contra valores del software del fabricante. Hasta entonces mostrar compatibilidad tabular pendiente de validación; no anunciar binarios nativos.
3. Casos analíticos: geometría conocida, transferencia nula a aceleración cero, conservación de carga y simetría de signo; relación de suspensión constante y variable. Probar conversiones, datos incompletos y salidas del dominio.
4. Comparar mediciones de banco y básculas con incertidumbres declaradas. Una fórmula correcta no basta para etiquetar el conjunto como modelo validado de una moto.
5. Reproducir una comparación guardada con idénticas entradas/versiones; las trazas originales permanecen inmutables.
6. Verificar por navegador importación → asociación → A/B → evidencia → recarga, incluyendo fallo de backend, teclado y vista móvil.
7. Para declarar un módulo operativo: servicio accesible, contrato probado, persistencia, errores visibles y recorrido de extremo a extremo con datos reales o claramente identificado como no aplicable. Ningún estado conectado sin comprobación.

## Orden y límites de entrega

Primero contratos, revisiones de setup y cálculos estáticos con comparación A/B. Después calibración y transferencia con telemetría suficiente. Luego curvas de suspensión y cinemática medidas; finalmente explicación de IA sobre evidencia. Cada fase tiene pruebas propias y puede desactivarse sin perder sesiones o revisiones.

La puesta en servicio completa exige inventario de dependencias, secretos configurados fuera del frontend, autorización, almacenamiento y monitorización de cada servicio. Arrancar las dos webs y el lector local no demuestra esa puesta en servicio. El formato nativo 2D, la validación experimental y el modelo de neumático completo quedan como capacidades pendientes explícitas.
