# Extensión de Chassis: suspensión progresiva, 2D real y recomendaciones

Estado: propuesta concreta para revisión; no constituye implementación ni validación comercial.

## Intención y punto de partida

El usuario pide continuar hasta un Chassis vendible, centrando esta entrega en suspensión progresiva, lectura real de AiM/2D y recomendaciones sustentadas en la telemetría. Se conserva el método de ejecución nativa aprobado previamente, los cambios pendientes y la inmutabilidad de datos.

AiM ya se ha leído mediante DLL oficial y sesiones reales. La entrega anterior limita el replay de suspensión a relación constante y devuelve explicaciones locales sin hipótesis. La ampliación necesita contratos nuevos, no cambiar el nombre de esos resultados por “IA”.

Se localizaron archivos reales de 2D en `18-telemetry-dataset/data/raw/ASPAR_CIRCUIT_12_04 (1).zip` y `ASPAR_CIRCUIT_02_05 (1).zip`. Contienen mediciones como carpetas `.MES`, con DDD, HED, canales y relojes asociados. En una DDD aparecen `Susp_F` y `Susp_R`, unidades mm y parámetros binarios de escala. La interpretación numérica sigue pendiente de contraste; no se presume que esos ficheros sean AiM DRK ni se usa el antiguo escáner de floats.

## Alternativas

1. **Curvas medidas y lectores por variante verificada**, recomendada: cálculo reproducible, cobertura explícita y referencia al fabricante. La exportación oficial sirve de contraste y fallback.
2. Solver multicuerpo y reconocimiento binario universal: exige puntos de anclaje y especificaciones que aún faltan; no permite declarar compatibilidad universal hoy.
3. Solo exportaciones y texto generado: facilita un primer acceso, pero no cubre la suspensión progresiva ni la precisión de una integración real.

## Suspensión progresiva

Añadir a cada revisión una curva inmutable `s=f(z)` de compresión de amortiguador frente a compresión de rueda. SI interno, datos finitos, 3–500 puntos, ambos ejes estrictamente crecientes y referencia de extensión completa declarada. No rellenar curvas de una moto con ejemplos. Permitir entrada manual y pegado tabular con unidades, procedencia y referencia de medición; mantener los setups antiguos compatibles.

Interpolación cúbica Hermite monótona PCHIP, sin extrapolación. Evaluar cada muestra calibrada de amortiguador invirtiendo la curva monótona; obtener q=ds/dz y dq/dz en el punto correspondiente. Calcular Fs=k(s+p), Fw=Fs*q y kw=k*q²+Fs*dq/dz. Usar todos los puntos de telemetría válidos para los extremos, no solamente mínimo y máximo de desplazamiento: una relación variable puede tener extremos interiores.

La segunda derivada puede saltar en los nodos. Declarar el convenio de lado, conservar ese aviso y comprobar ambos límites si se informa un extremo de rigidez. Bloquear puntos con relación no positiva, salidas del dominio y desbordamientos; contabilizar muestras excluidas y cobertura. No sustituirlas por cero ni extender la curva hasta cubrirlas. Una cobertura parcial no representa toda la sesión. Si no hay puntos válidos, conservar geometría y mostrar qué falta.

Comparar A/B sobre el mismo movimiento registrado es una comparación condicionada; no predice que la alternativa reproduzca ese movimiento en pista. Mantener esta diferencia en resultados, recomendaciones e interfaz. No inferir fuerza hidráulica ni clics del amortiguador a partir del muelle.

[Referencia de PCHIP y límites de derivadas](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html). La implementación debe contrastarse con referencia independiente y casos analíticos; no añadir SciPy como dependencia obligatoria del núcleo si puede mantenerse el empaquetado mínimo con una implementación contrastada.

## Lectura real y validación

Separar capacidad del lector, identificación del formato y lectura numérica. AiM: diagnóstico de plataforma/DLL, versión, grupos registrados/GPS y pruebas sobre más de una sesión real. Una lectura fallida nunca genera canales o vueltas de ejemplo.

2D: inspección segura de ZIP con selección explícita de medición. Rechazar rutas absolutas, traversal, enlaces, entradas duplicadas ambiguas, cifrado, archivos truncados y paquetes que superen 100 MiB comprimidos, 512 MiB descomprimidos, 5000 entradas o ratio agregado 100:1. Leer sin extraer sobre raw y limitar recursos también durante la descompresión. Los paquetes encontrados caben dentro de estos límites según sus directorios ZIP.

El lector soportará solamente tipos de canal cuyos parámetros DDD, tamaño de muestra, signo, endian, escala, frecuencia y cronología estén verificados. Etiquetar canales calculados del fabricante frente a registrados. No asumir un reloj uniforme cuando el paquete describa pausas, eventos o relojes distintos. Rechazar o excluir explícitamente variantes desconocidas con informe de cobertura; no anunciarlas como lectura completa.

Contrastar canales, unidades, tiempos, número de muestras y varios valores con una exportación de 2D Analyzer o referencia oficial. Un rango plausible no valida escala o tiempo. Si no se dispone de esa referencia, el lector nativo queda experimental y ese criterio bloquea la etiqueta comercial “validado”. Preservar hash del archivo, medición seleccionada, archivos internos y versión de decodificación.

La documentación oficial permite CSV/ASCII y automatización de exportaciones; esa vía debe permanecer disponible. Registrar si el fabricante interpoló o limitó frecuencias: “sin interpolación en KDD” no significa que la exportación conserve las muestras del logger.

[Exportaciones de 2D](https://help.2d-datarecording.com/Analyzer_Export), [scripts y automatización](https://help.2d-datarecording.com/Analyzer_Script), [DLL oficial de AiM](https://docs.aim-sportline.com/racestudio3/html/xrk-dll.html).

## Recomendaciones fundamentadas

Crear hallazgos deterministas a partir de evidencias válidas: cobertura insuficiente, datos fuera de curva, cercanía a un límite medido, diferencia de rigidez/carga entre candidatos y mediciones ausentes. Los umbrales mecánicos provienen del setup y límites medidos, no de números universales. Cada hallazgo incluye sesión, revisión, canal, intervalo, muestras/porcentaje, fórmula y motivo.

Las recomendaciones proponen una comprobación concreta y explican qué observación la respalda. Distinguir medido, calculado, estimado e hipótesis. No calificar una alternativa como mejor ni prescribir clics o ganancias sin un modelo validado que lo justifique.

Un adaptador de modelo de lenguaje local puede reformular evidencia estructurada bajo un esquema estricto, con referencias verificadas y rechazo de números o prescripciones no soportados. El servicio local de modelos no responde actualmente; su indisponibilidad debe dejar operativo el motor de hallazgos y mostrarse con claridad. No fingir que reglas son inferencia de un LLM. No habilitar servicios externos ni enviar raw, GPS o identidades a proveedores por tener una credencial configurada. El proveedor solo recibe un resumen mínimo autorizado; el texto devuelto se trata como datos, nunca instrucciones.

Guardar configuración/versiones y salida aceptada junto a la comparación. Ante error, timeout o referencias inexistentes, conservar resultados y explicación determinista, indicando qué componente falló.

## Interfaz y criterios de entrega

Mantener Chassis como centro: curva A/B con cotas y edición validada; desplazamiento original y cobertura; resultados con rango de validez; recomendaciones con sus referencias desplegables. Importador con selector de medición 2D y detalle de canales admitidos/excluidos. No afirmar “conectado” cuando solo se ha importado un archivo.

Pruebas requeridas: curva lineal equivalente al modelo anterior; curva progresiva con referencia independiente; inversión, nodos y límites; extremos interiores; muestras fuera de cobertura; compatibilidad de revisiones antiguas; ZIP malicioso/truncado/multimedición; AiM real; 2D real frente a referencia; salida de IA inventada/no disponible; persistencia y recorrido completo de navegador en escritorio y móvil.

No se elimina el bloqueo de producción multiusuario del trabajo anterior: identidad de tenant, aislamiento, despliegue, licencias y validación experimental siguen siendo puertas independientes para vender el servicio completo. Esta ampliación debe mostrar qué criterios están verificados y cuáles continúan pendientes, sin declarar el producto listo para vender por pasar pruebas sintéticas.
