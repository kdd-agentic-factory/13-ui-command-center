# Banco de suspensión y análisis espectral integrado en Chassis

Fecha: 2026-10-26. Estado: diseño aprobado por el usuario para preparar el plan; implementación no iniciada.

Revisión independiente de planificabilidad: `suspension_spectral_builder_check`, 2026-10-26. Resultado: «nothing important left». Esta revisión comprueba claridad para preparar un plan, no valida física, hardware ni aceptación comercial.

## Decisión y propósito

El usuario eligió integración progresiva dentro de Chassis, sin sustituir capacidades existentes, empezando por banco de suspensión y análisis espectral con datos reales. Esta entrega permitirá inspeccionar movimiento de suspensión registrado, incorporar ensayos de amortiguador medidos y comparar resultados reproducibles. No convertirá una curva ilustrativa en un ensayo ni un espectro en un diagnóstico mecánico certificado.

Fuentes: los seis textos conservados en `docs/references/2026-10-26-engineering-expansion/`, con manifiesto SHA-256; especialmente 03/04 (banco) y 06 (análisis espectral). Las cifras y el código de esos textos son referencias, no criterios de aceptación científica.

## Alternativas y elección

1. **Extender Chassis y sus contratos de evidencia**: reutiliza sesión, comparación A/B, revisiones, identidad y órdenes. Exige contratos aditivos y pruebas de regresión. Es la opción elegida por el usuario.
2. Laboratorio separado: facilita experimentar, pero duplica contexto y controles, dificulta llevar evidencia al Chief y no corresponde al enfoque elegido.
3. Incorporar directamente la suite JSX aportada: reemplaza estado y cálculos con supuestos y resultados prefijados; se descarta por contrariar la conservación del producto y el uso de datos reales.

Decisiones técnicas propuestas por el autor: cálculo determinista en 17, acceso y persistencia en 18, interfaz en 13; SciPy para Welch y STFT, con parámetros explícitos. No son decisiones adicionales atribuidas al usuario.

## Base existente comprobada

- 13: `ChassisPage`, `ChassisComparison`, `workshop/ChassisWorkshop` y seis vistas por perfil comparten contexto y borrador. El taller ya presenta geometría, horquilla, tren trasero y curva. Se conservan todas esas vistas, Target Lock, replay y órdenes.
- 18: `chassis/calibration.py` convierte desplazamiento/aceleración y deriva velocidad mediante regresión local sobre los tiempos originales, con bordes y huecos ausentes. **No identifica fuerza de amortiguación**. `alignment.py` interpola solo dentro de un hueco permitido; no se utilizará para ocultar pérdidas de datos.
- 18: `chassis/progressive.py` calcula respuesta elástica condicionada al movimiento registrado y una curva de bieletas. No predice el movimiento de B, amortiguación hidráulica ni tiempo por vuelta.
- 17: motor de chasis determinista, con NumPy/SciPy declarados en `pyproject.toml`; su compatibilidad real de empaquetado debe verificarse, no suponerse por estar declarados.
- 18: objetos de taller append-only por ámbito, auditoría, idempotencia y snapshots de referencias sin muestras. Se reutilizan estas garantías; una ampliación de snapshot requiere versión explícita, no modificar históricos.
- Diccionario: existen `suspension_front`, `suspension_rear` y sus velocidades. Las frecuencias típicas del diccionario no prueban la frecuencia real de un archivo. Los tipos nuevos de fuerza de banco y temperatura de amortiguador se registrarán en el diccionario antes de usarse; este documento no inventa IDs productivos.
- AiM sigue necesitando comprobar su puente en el dispositivo; 2D nativo conserva su estado experimental por falta de referencia independiente. No se ha demostrado aquí disponer de ensayos reales de fuerza de amortiguador o adquisición acústica de alta frecuencia.

## Alcance de la primera ampliación

### A. Inspección de suspensión registrada

Se elige una grabación del equipo, eje/componente, canal calibrado y un intervalo original. Se muestran recorrido-tiempo, velocidad-tiempo, histograma compresión/extensión, cobertura y distribución de velocidades. La velocidad será medida si existe un canal con referencia válida o estimada por el método actual, siempre identificando el caso.

La compresión positiva se define hacia el interior de la suspensión. Debe indicarse si se mide horquilla, amortiguador o rueda; no convertir movimiento de rueda a vástago sin curva/cinemática aplicable. Se conserva la referencia de cero y la escala. No hace falta identificar una comparación para inspeccionar una grabación; para anexarla a una conclusión A/B sí se exige la asociación exacta.

Sin canal de fuerza: la pantalla se denomina **Movimiento en pista**, con fuerza, histéresis y energía no disponibles. No se dibuja una fuerza obtenida multiplicando velocidad por una constante arbitraria. La fuerza elástica calculada por el módulo progresivo permanece identificada como tal y no se reutiliza como fuerza hidráulica medida.

### B. Ensayo de amortiguador medido

Entrada inicial: CSV de ensayo a través de un adaptador específico, no modificación del lector de sesiones de pista. Columnas mínimas: tiempo y fuerza, más desplazamiento o velocidad del vástago. Se declara delimitador, separador decimal, unidades y asignación de columnas; no adivinarlos silenciosamente. Unidades admitidas iniciales: s/ms, N/kN, m/mm y m/s/mm/s. No Excel, archivos comprimidos, fórmulas ni formatos propietarios en esta entrega.

Metadatos requeridos: componente/modelo y serie o identificador de pieza del equipo, revisión de configuración, fecha de ensayo, referencia de calibración, dirección de fuerza y desplazamiento, origen de reloj, frecuencia declarada si existe, montaje y tratamiento de cero. Opcionales: temperatura de aceite, frecuencia/amplitud del ensayo y condición de retirada del muelle. La temperatura no medida se muestra desconocida.

El archivo original es inmutable, privado y catalogado/indexado conforme a gobernanza. Se guardan checksum y calibración; nunca se sustituye la grabación de pista por un ensayo. Se amplía el catálogo con un tipo de adquisición `suspension_bench` versionado y metadatos propios, sin exigir piloto/circuito ficticios. Se puede asociar a moto/componente y más tarde a una sesión. La asociación no demuestra que esa configuración estuviera montada durante la sesión.

Resultados: nube/ramas fuerza-velocidad; fuerza-desplazamiento cuando existe desplazamiento; series temporales originales. Se distingue fuerza total de banco de fuerza hidráulica aislada. Retirar fuerza de gas, muelle o inercia queda fuera de esta entrega salvo que el dato de entrada ya sea una medición identificada como corregida, con método documentado; no se infiere automáticamente.

Energía por ciclo: solo cuando hay fuerza y desplazamiento sincronizados, convención de trabajo identificada y ciclos completos. Integración de F·dx por ciclo, en J, preservando signo y reportando método. Un cero de velocidad no demuestra por sí solo un ciclo cerrado. Si solo hay velocidad se permite fuerza-velocidad, pero no energía por ciclo mediante integración acumulada implícita.

Comparación de dos ensayos: mismo componente/modelo, unidades normalizadas, convenciones compatibles y condiciones declaradas. Diferencias de temperatura o condiciones desconocidas impiden calificar una curva como mejora y aparecen junto al gráfico. No promediar puntos por velocidad mezclando ramas sin mostrar dispersión y dirección. Esta entrega no ajusta automáticamente un modelo de shim stack.

### C. Análisis espectral con señal real

Primera versión: PSD de Welch y espectrograma STFT sobre desplazamiento, velocidad o aceleración con unidad calibrada. La interfaz solicita canal, intervalo y banda; el servidor determina elegibilidad. Se conserva la unidad física: PSD en unidad²/Hz; espectrograma con escala y referencia documentadas. Escala logarítmica nunca se rotula como dB absolutos sin referencia explícita.

Los métodos son complementarios: Welch resume distribución de potencia y STFT muestra su evolución temporal. No se implementa la afirmación de que toda FFT asume que una señal completa es estacionaria. El espectro de velocidad derivada conserva la advertencia del filtro y su respuesta; no equivale a un acelerómetro de alta frecuencia.

Elegibilidad inicial conservadora, política versionada `spectral-quality-v1`:

- Tiempos finitos estrictamente crecientes y valores finitos. No ordenar, rellenar NaN, extrapolar ni eliminar duplicados silenciosamente.
- Analizar un tramo continuo seleccionado. Estimar dt por mediana y mostrar fs efectiva, jitter máximo y huecos. Para Welch/STFT, exigir desviación máxima de dt respecto a mediana <=1%; un hueco >1.5 dt corta el tramo. No concatenar tramos. El usuario puede seleccionar otro tramo válido; no resamplear automáticamente en esta entrega.
- Umbral de 1% es una política de ingeniería conservadora propuesta, no garantía metrológica. Una señal elegible sigue mostrando su incertidumbre de reloj. Rejecutar exige conservar la política usada.
- Mínimo 256 muestras útiles; segmentos de potencia de dos entre 256 y 8192, seleccionables. Al menos 3 segmentos Welch con 50% de solape. Hann periódica explícita, detrend constante, `nfft=nperseg`, salida unilateral y densidad; no depender de defaults cambiantes. STFT con mismos ventana/solape y sin padding de bordes; excluir ventanas incompletas.
- Mostrar fs, Nyquist, duración, resolución fs/nperseg y número de segmentos. Banda solicitada estrictamente por debajo de Nyquist y por debajo del límite calibrado de sensor/adquisición si se conoce. Sin información de filtro antialias o ancho de banda, resultado solo exploratorio, no evidencia mecánica aprobable. No aumentar fs por interpolación para habilitar una banda.
- Pico dominante solo dentro de la banda solicitada, excluido DC, como observación espectral con resolución e incertidumbre; nunca etiqueta automática de chatter, cavitación, desgaste, fallo o vida restante.
- No coherencia ni relación de fase entre sensores sin contrato de sincronización medido. Una señal aislada no requiere inventar sincronización multisensor.

CWT/Morlet queda recogida como siguiente extensión, no se elimina: necesita validar backend, escalas, aliasing, bordes y coste antes de habilitarla. No se añade PyWavelets ni se ejecuta el script aportado durante esta entrega. Los datos de alta frecuencia futuros podrán entrar mediante un adaptador posterior; esta entrega no promete adquisición CAN/LSL, diagnóstico acústico ultrasónico ni tiempo real.

## Arquitectura y contratos aditivos

### Motor 17

Nuevos módulos puros para métricas de movimiento, curvas de banco, calidad espectral, Welch y STFT. No leen archivos, identidad, red o base de datos; reciben arrays SI y parámetros validados y devuelven resultados y razones de exclusión. SciPy con versión efectiva registrada; usar STFT moderna si la versión instalada la admite. Si el runtime no dispone del backend validado, servicio no disponible: sin sustitución por un cálculo diferente silencioso.

### Servicio 18

Familia propuesta `/api/v1/chassis/suspension-lab`: importar ensayo, consultar manifiesto, crear análisis, listar y consultar análisis. Esquemas estrictos versionados 1.0.0 y registro en `schema-version.yaml`; endpoints de importación bajo el mismo control de identidad/lectura-escritura que la ingestión existente, sin abrir accesos nuevos por perfil visual.

La petición referencia adquisición y digest, canales del diccionario/asignación validada, calibraciones, intervalo, parámetros y opcional comparación/revisiones. Nunca acepta arrays de señales arbitrarios para reemplazar una adquisición ya persistida. El servidor resuelve propiedad, hashes, compatibilidad de moto y revisión. Si procede un ensayo sin moto, solo se vincula después de identificar componente y compatibilidad; no asignación automática.

Resultado inmutable: id, revision, digest, ámbito, esquema/algoritmo/backend/política, procedencia, transformaciones ordenadas, intervalo, cobertura, parámetros, métricas, curvas limitadas, warnings y `observation_eligibility`. Valores permitidos: `exploratory`, `eligible_for_review`, `blocked`. Son elegibilidad de observaciones, no aprobación mecánica. Fuente 2D no contrastada impide `eligible_for_review` aunque el cálculo numérico sea correcto.

Idempotencia por operación+fingerprint; replay exacto devuelve el objeto original; reutilizar operación con otro contenido da conflicto. Lectura/paginación filtra por equipo en servidor; un ID ajeno responde como inexistente. Auditoría con los tres headers KDD. Sin modificación de raw, exportación pública ni envío de muestras al modelo.

Límites iniciales propuestos: CSV <=25 MiB y <=250000 filas, máximo 8 columnas numéricas mapeadas; análisis <=250000 muestras, STFT <=262144 celdas calculadas. Si se supera, pedir reducir intervalo o aumentar segmento; no truncar o decimar antes de calcular silenciosamente. Trabajo local fuera del event loop HTTP con timeout 30 s y una ejecución concurrente por proceso inicialmente. Exceso responde 429/503; timeout y cancelación sin resultado parcial marcado completo. Curvas de presentación pueden reducirse a <=4000 puntos mediante envolvente min/max y STFT agregada hasta 256×512, documentando reducción; métricas se calculan antes sobre datos completos. Cancelar petición evita publicar resultado; cambiar contexto impide adoptar respuesta obsoleta en UI.

Artefactos derivados privados, fuera de git, con retención ligada a la adquisición. Si la fuente vence o desaparece por retención autorizada, el manifiesto histórico permanece pero la reproducción indica fuente no disponible; nunca se promete recalcular sin muestras. No borrar fuentes al eliminar un análisis de pantalla. Migraciones locales y cloud preparadas y probadas en banco aislado; no activar cloud por esta aprobación de diseño.

### Interfaz 13

Añadir **Banco y señales** como vista operativa del taller existente, con dos modos: **Movimiento en pista** y **Ensayo de banco**, y análisis espectral común. No nueva aplicación, copia de borrador ni selector paralelo de moto/piloto. El ensayo de banco puede abrirse sin sesión de pista; asociarlo a una comparación exige su contexto.

Orden de lectura: fuente/estado → canal e intervalo → limitaciones/datos faltantes → gráficos y métricas → guardar evidencia. Gráficos con ejes/unidades/leyenda, cursor temporal común dentro de la misma adquisición y alternativa tabular. No gráficas de demostración en vacíos. Botón de cálculo bloqueado con motivo concreto. Avanzado plegado para parámetros espectrales; metadatos y exclusiones disponibles sin saturar al mecánico.

Ingeniero/analista preparan análisis según permisos existentes; mecánico consulta banco y configuración medida; piloto ve resumen de observaciones; Chief ve evidencias y discrepancias; dirección ve informe. Cambiar vista no concede permisos, remonta ni borra selección. Orden DOM y foco corresponden al orden visual; teclado, nombres accesibles, estados con texto y vista de 390 px son aceptación obligatoria. Se conserva la protección de borradores y contexto compartido actual.

## Evidencia, agentes y aprobación humana

Guardar un análisis no modifica la comparación ni sus hashes históricos. Se crea un anexo referenciado por digest. Para usarlo en IA se crea un snapshot nuevo con referencias explícitas a análisis y fuentes; versión nueva del contrato, campos ausentes compatibles con históricos. El catálogo de evidencias debe reconocer esos tipos antes de que un especialista pueda citarlos; referencias inventadas o de otro equipo se rechazan.

El especialista de suspensión describe movimiento/curvas y límites; el de señales aporta observaciones espectrales, sin atribuir causas no verificadas. El contraste independiente recibe la misma evidencia sellada sin las conclusiones de la línea coordinada. El Chief sintetiza acuerdos, discrepancias y siguientes medidas. Se conserva la abstención y la petición de datos. Si el modelo no puede producir referencias válidas, el análisis determinista sigue consultable y la conclusión IA queda bloqueada.

Ninguna observación nueva habilita por sí sola cambio físico ni sortea el catálogo de acciones o las fichas. Las órdenes siguen requiriendo cobertura física, fuente aceptada, especificación y aprobación vigente del Crew Chief humano o sustituto. Una firma humana no convierte un diagnóstico experimental en validación científica.

## Criterios de aceptación

1. Regresión: geometría, bieletas progresivas, Target Lock, replay, A/B, roles, contexto, órdenes y contratos anteriores siguen pasando sus bancos pertinentes.
2. Señales conocidas controladas: seno/multiseno con picos en el bin esperado, varianza integrada de PSD dentro de 5% para señales de prueba largas y sin filtrado; escala/unidades y energía de ciclo contrastadas contra referencias analíticas. Estas pruebas numéricas no sustituyen datos de cliente.
3. Tiempo irregular, huecos, duplicados, NaN, calibración incompatible, banda imposible y límites de recursos producen motivos explícitos; sin espectro aparentemente válido sobre huecos rellenados.
4. Banco sin fuerza solo muestra movimiento; sin desplazamiento no publica energía por ciclo. Ensayo sin muelle retirado no se rotula amortiguación hidráulica aislada. Comparación con temperatura desconocida no se presenta como mejora.
5. Aislamiento entre dos equipos, roles de escritura, idempotencia, anexos históricos y respuestas obsoletas cubiertos por pruebas de API/UI. Datos sintéticos solo en tests y siempre identificados.
6. Prueba con al menos una grabación real autorizada: manifestar canal, frecuencia efectiva, banda utilizable y limitaciones; no requiere publicar muestras ni identidad. 2D experimental puede demostrar inspección, no contraste del fabricante.
7. Para aceptar el modo banco como validado externamente, ensayo real con fuerza y movimiento y referencia independiente del instrumento. Si falta, puede entregarse el software de importación/cálculo probado, pero la aceptación comercial de ese modo permanece pendiente y visible. No fabricar ese archivo para cerrar el criterio.
8. PSD/STFT reproducibles en artefacto guardado con los mismos datos/parámetros/versiones. La IA local debe citar un análisis real o abstenerse; no se acredita con mocks. Human approval y falta de ella comprobadas sin conceder autoridad a agentes.
9. Empaquetado limpio de 17/18, tipos, tests y build de 13; prueba de memoria/timeout al límite y navegación por teclado. Registrar qué no pudo verificarse; no declarar todo el producto listo para vender por esta entrega.

## Fuera de esta primera entrega, conservado en la ampliación

Cavitación diagnosticada, fuerza inferida desde shim stack, estimación Rainflow/RUL, CWT de producción, coherencia multisensor, simulación de carrera, exportadores propietarios, aero/CFD, TPMS, FeatureScript, LSL/CAN, MAPPO/actuación háptica y federación. Permanecen en el mapa de ampliación; no se implementan como sustitutos ni se presentan como activos. No se transmiten comandos CAN ni mapas ECU.

## Referencias técnicas consultadas

- SciPy, Welch: https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.welch.html — PSD, ventana, solape y unidades. Parámetros se fijan explícitamente en el contrato.
- SciPy, spectrogram: https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.spectrogram.html — API histórica; recomienda implementación STFT moderna. Verificar soporte en versión real, no aumentar dependencia sin necesidad.
- PyWavelets, CWT: https://pywavelets.readthedocs.io/en/latest/ref/cwt.html — escala/frecuencia, muestreo y advertencias de implementación; extensión diferida con validación propia.

## Pendientes para planificar

No se requiere cambiar de arquitectura ni obtener hardware para escribir el plan. El implementador concretará nombres de DTO, módulos, nuevas entradas del diccionario, tablas/índices y fixtures siguiendo este contrato. Debe comprobar las versiones reales de SciPy antes de elegir API y conservar las restricciones descritas. La disponibilidad de un ensayo externo real es un bloqueo de aceptación del banco, no motivo para sustituir medición por simulación.
