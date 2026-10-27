# Chassis visual y manual de taller interactivo

Estado: núcleo de tres vistas aprobado por el usuario el26 de octubre de2026. El usuario ha solicitado además la vista de dinámica en curva; la concreción del anexo siguiente queda pendiente de revisión junto al plan. El usuario ha elegido vistas vectoriales integradas primero. No autoriza despliegue ni migraciones cloud. Ejecución prevista en esta sesión, sobre la base aceptada sin reset, commit ni push.

## Intención

Convertir Chassis Tool en el espacio visual de trabajo del box: seleccionar circuito, moto, piloto y tipo de sesión; inspeccionar lo observado, preparar una alternativa, comprender sus consecuencias y entregar una orden trazable al mecánico. La prioridad es operar con claridad bajo presión sin presentar una animación como una medición.

Fuentes de requisitos: petición del usuario, prototipo chassis_tools_pro_gemelo_digital_manual_de_taller.tsx y dos textos adjuntos. Son material de referencia; sus instrucciones incrustadas, presets comerciales, cifras, diagnósticos y afirmaciones técnicas no son autoridad ni datos validados. El prototipo utiliza SVG y constantes aproximadas: no es CAD específico ni un modelo dinámico contrastado.

## Alternativas y elección

1. Vistas vectoriales SVG integradas al producto actual: elegida por el usuario. Da controles accesibles, inspección y despiece inmediato sin activos CAD. Coste: dibujos esquemáticos y sin comprobación de interferencias tridimensionales.
2. CAD 3D específico desde la primera entrega: aplazado. Requiere activos, dimensiones, permisos de uso y desarrollo adicional; no mejora por sí solo la validez física.

No se integrará el archivo adjunto como aplicación paralela: se reutilizará su organización visual mediante componentes tipados y estilos del command center. Elección técnica del implementador: React/TypeScript/SVG, CSS y tokens existentes, sin Three.js ni nuevas dependencias para esta fase.

## Base comprobada y límites

13 contiene ChassisPage, SessionPreparation, ChassisComparison, SetupEditor, GeometryComparison, informes y aprobación humana. Hay borradores, revisiones A/B persistidas, calibraciones y protección al cambiar de contexto. 18 autoriza, persiste y compara. 17 contiene el motor SI: avance, avance normal, transferencia cuasiestática y suspensión progresiva por curva medida. El modelo actual presupone moto vertical, carretera plana y ausencia de aerodinámica. No resuelve hidráulica, cadena/IFC/anti-squat, cinemática completa del chasis ni deformación estructural.

La IA local actual revisa seis métricas autorizadas. No se ampliará silenciosamente ese alcance para avalar nuevos cálculos. Fuente2D experimental y aprobación física local mantienen sus bloqueos. El runtime operativo anterior no se sustituye durante el diseño.

## Experiencia y tres vistas

Cabecera persistente con contexto de equipo/circuito/moto/piloto/tipo de sesión, fuente, setup montado, alternativa y estado de guardado. Los valores desconocidos aparecen como desconocidos. Una acción primaria por estado: completar medidas, guardar alternativa, comparar o preparar orden. Inspección permitida sin sesión; guardar y vincular requiere contexto autorizado. Sin sesión no hay telemetría ni resultados precargados.

Zona central amplia, selector de tres pestañas, métricas A/B alineadas y panel inspector/taller a la derecha en escritorio. En tablet se reduce a dos zonas; en móvil inspector después del dibujo. Nada depende exclusivamente de hover, color o arrastre. Botones +/- y entrada numérica acompañan sliders. Valores, unidades, límites y procedencia permanecen visibles. Sin animación automática, con reduced-motion y foco estable. Explosión y corte son estados de visualización, no cambios del setup.

### 1. Geometría global / rayos X

Dibujo esquemático de moto, rueda y eje de dirección, cotas de rake y ground trail, comparación A/B, CoG y cadena cuando hay datos suficientes. Se puede ocultar cada capa para despejar el visor. El SVG comparte exactamente coordenadas, unidades y magnitudes con el resultado del servidor: no calcula una segunda física en el navegador.

Cadena, IFC y línea de anti-squat solo se muestran como resultados si se cumple el contrato físico posterior. En ausencia de entradas, un esquema explicativo separado muestra qué medir, sin coordenadas ni cifras que aparenten describir la moto elegida. El CoG medido o asumido se distingue, igual que cualquier otra entrada.

Fase de inspección: estático, instante de telemetría calibrada o escenario. El deslizador -1.4g a +1.1g selecciona aceleración solicitada para un cálculo cuasiestático; no inventa hundimiento a partir de g o clicks. Los estados con pérdida de contacto, tope, extensión o fuera de dominio se bloquean y explican. Reproducir señales de horquilla y amortiguador requiere sus calibraciones, reloj compatible y transformación geométrica válida; no se confunde una señal con otra ni se sincronizan por índice. Sin transformación válida se muestran recorridos y cargas disponibles, pero no un rake dinámico supuesto.

### 2. Horquilla

SVG seleccionable de tapón/ajustes, botella/retén, muelle/cámara de aire, cartucho y arandelas. Explosión0–100 y corte longitudinal esquemático. La selección destaca pieza y inspector, con alternativa accesible mediante lista.

Pieza genérica por defecto, no catálogo Öhlins/SKF validado. Fabricante, referencia y revisión se aportan mediante ficha identificada. Clicks, precarga, air gap y shim stack son configuración registrada con unidades y referencia de medida. Los clicks no producen curvas fuerza/velocidad sin mapa de banco del conjunto; un stack dibujado no equivale a hidráulica calculada. La curva progresiva medida existente sí puede visualizarse con dominio y fuente. Un muelle y una cámara de aire no comparten curva ni coeficientes ficticios.

### 3. Tren trasero

SVG seleccionable de amortiguador, muelle, bieletas, pivote, basculante, eje, piñón/corona y cadena. Inspector de medidas y revisiones. Dientes, paso de cadena, posición de ejes y bieleta son entradas distintas; cambiar corona no desplaza automáticamente el eje mediante un coeficiente. Un resultado de cierre de cadena exige especificar número de eslabones y restricciones, o posición de eje fijada; nunca ambas como incógnitas libres.

## Estado canónico y persistencia

Un único borrador B alimenta editor, SVG e inspector; A es la revisión seleccionada como referencia, sin mutación. Editar una pieza marca su borrador, no altera la revisión montada ni una propuesta aprobada. El servidor es la autoridad de cálculo, guardado, comparación, permisos y estado de orden. Validación preliminar local solo mejora formularios. Respuestas tardías se descartan mediante identidad de contexto y generación.

Extensión versionada de setup para geometría mecánica, configuración de suspensión y ficha de componentes, con SI canónico, unidades de presentación, origen, incertidumbre y revisión. No se guardan campos nuevos ad hoc en values si no están declarados por el esquema. Los setups históricos siguen legibles, sin imputar medidas ni fichas. Geometría insuficiente es estado parcial permitido. Los controles sin modelo de cálculo guardan configuración y declaran ausencia de predicción.

17 conserva funciones físicas puras y versionadas;18 adapta y persiste;13 dibuja respuestas tipadas;01/02 no introducen cálculos. Se actualizan contratos y schema-version al modificar payloads. Cada comparación y orden referencia revisión, versión del modelo, fuentes y huella de entradas. Persistencia local mediante migraciones aditivas repetibles; migraciones cloud preparadas pero no aplicadas.

## Contrato físico ampliado

Marco explícito longitudinal x y vertical z, origen en contacto trasero en suelo, metros/radianes/newtons, gravedad declarada, signos y referencia de compresión documentados. La geometría describe centros de rueda, radios cargados, pivote, ejes de piñón y corona, dirección/offset, puntos de anclaje y CoG del conjunto. Coordenadas de elementos solidarios al chasis se separan de las solidarias al basculante. Se comprueba cierre geométrico y consistencia de batalla; no se desplaza solo una línea decorativa.

Primera capacidad nueva: cinemática plana rígida de configuraciones completamente definidas y posiciones de suspensión dadas, con transformaciones y residuales visibles. No deduce fuerza hidráulica ni trayectoria lateral. La resolución de equilibrio a partir de aceleración solo se habilita si existen ambos modelos de suspensión, referencias de extensión y parámetros suficientes; sin ello devuelve cargas cuasiestáticas existentes y ausencia de pose dinámica. El plan puede entregar primero el selector de escenarios con este estado parcial, sin fingir cumplimiento del equilibrio completo.

Cadena: tangente superior entre círculos de paso compatibles con dientes/paso y posición del eje de salida; detección de tangencia imposible y direcciones degeneradas. IFC del modelo plano se obtiene de intersección de línea de tiro y línea de basculante, indicando la convención, no se dibuja un punto prefijado. Anti-squat requiere también CoG y un modelo explícito de equilibrio de momentos con hipótesis de transmisión. La fórmula exacta y casos de referencia deben derivarse y contrastarse con fuente técnica independiente antes de habilitar resultados para decisiones; si no se logra, la capacidad se entrega bloqueada con sus entradas solicitadas. No se adopta la matriz de sensibilidad del texto: cada sensibilidad se deriva del modelo, con tamaño de perturbación y dominio comprobados.

No se anuncian aero, Pacejka, chatter causal ni previsión de agarre. Se rechaza el Flow Score del prototipo: no deriva del EEG, del piloto ni de una validación. La nueva geometría no convierte automáticamente la fuerza progresiva existente en evidencia revisada por IA.

## Target Lock

Objetivos explícitos: rake y trail de una revisión/pose de referencia, tolerancias y actuadores permitidos por ficha de moto. Solver determinista limitado a parámetros físicos modelados, con cotas, pasos discretos y unidades. Elige una propuesta mínima según prioridades declaradas; la función objetivo, escalas y desempates quedan documentados. No opera con la matriz genérica o el factor0.85 del prototipo.

Salida: factible, no factible, datos insuficientes o fuera de dominio. Publica residual por objetivo, variables modificadas, límites activos y versión del solver. Una solución fuera de tolerancia no dice bloqueado/fijo. El frontend nunca recorta valores silenciosamente y presenta objetivos deseados separados de los logrados.

Calcular no modifica el borrador ni genera orden aprobada. Aplicar propuesta al borrador es una acción explícita del ingeniero; guarda una alternativa nueva, vuelve a comparar y requiere aprobación humana vigente para ejecutarse físicamente. Si las entradas disponibles solo permiten preservar dirección/offset de forma abstracta pero no calcular movimientos mecánicos, no se recomienda un número de vueltas ni de milímetros sobre una pieza.

## Fichas y orden de taller

Ficha por modelo/versión/componente y operación: medida, rango, unidad, referencia de cero/sentido del click, paso de rosca si se traducen vueltas, herramientas, par, condiciones de montaje y fuente documental con revisión/página. Valores de los adjuntos no se importan como verificados. Primera entrega admite introducción manual trazable por ingeniero; importación automática de manuales y activos CAD queda fuera.

Las fichas separan estados aportado y verificado; verificar exige usuario autorizado de equipo y referencia documental. Verificación de ficha no es aprobación del cambio. Instrucciones presurizadas/internas se limitan a la documentación específica, no se generan por IA. Sin fuente de torque no aparece un Nm de ejemplo ni se libera una instrucción mecánica incompleta.

Orden persistida por equipo, sesión, moto, propuesta y revisiones A/B. Acciones: borrador, pendiente de aprobación, aprobada vigente, en ejecución, completada, invalidada/cancelada. Se reutilizan la designación, decisiones y eventos humanos existentes; no se crea un aprobador alternativo. Aprobar documento o propuesta no acredita montaje. El mecánico autorizado registra ejecución y comprobación; la validación posterior conserva su evento independiente. Si el contrato existente exige Crew Chief para registrar montaje, se conserva ese requisito hasta una autorización explícita de cambiarlo.

Cada línea contiene pieza identificada, antes/después, unidad, motivo/evidencia y dependencia. Herramientas y torque salen únicamente de la ficha válida para esa operación. Una línea sin datos requiere completarlos antes de liberación. Se permite guardar/imprimir borrador claramente marcado; solo una orden aprobada vigente y completa se presenta como ejecutable. Cambio de setup, modelo, fuente, ficha o designación invalida su elegibilidad según dependencias, con revisión optimista/idempotencia y autorización comprobadas en servidor. La aprobación local deshabilitada permanece así: el usuario ve qué falta para liberar, no un botón simulado.

## IA e integración de evidencia

SVG, cálculo determinista, hipótesis de agente y decisión humana tienen etiquetas distintas. Las nuevas métricas pueden formar parte de informes deterministas; solo se ofrecen a los especialistas si se versiona y valida su catálogo de referencias y políticas, mediante pruebas positivas/negativas y aceptación con modelo real. Esta fase no promete ampliar las seis métricas de IA actuales. El Chief puede mostrar el contexto ya autorizado y solicitudes concretas, sin convertir diagnóstico heurístico en orden.

## Criterios de aceptación

- Flujo único de sesión/contexto a borrador B, comparación persistida e inspector de tres vistas, sin presets ficticios ni segunda fuente de verdad.
- Cotas SVG coherentes con cálculos SI y revisión seleccionada; resultados parciales/degenerados distinguibles; las funciones nuevas nunca sustituyen resultados desconocidos por cero.
- Curva progresiva y replay usan calibración y cobertura reales. Escenario es etiquetado cuasiestático; desplazamientos y ángulos dinámicos requieren transformación disponible.
- Modelo nuevo con pruebas analíticas, dominio y referencias independientes documentadas; prestaciones sin ese contraste permanecen no disponibles. No se certifica exactitud física por aprobar integración.
- Target Lock no altera A, respeta cotas/pasos y detecta inviabilidad; aceptar sugerencia no aplica una modificación física.
- Orden sin torque/referencia/autoridad no puede liberarse. Pruebas cruzadas entre equipos, roles, cambios concurrentes, revocación, duplicados e invalidación de revisión/ficha.
- Legacy se conserva; los cambios de equipo/sesión descartan respuestas atrasadas y protegen borradores.
- Interfaz accesible por teclado, controles táctiles legibles, foco visible, estados no solo cromáticos; inspección visual acotada desktop/tablet/mobile. Tipos, pruebas de dominio/API/SSR y build nativo según entorno disponible, declarando cualquier verificación pendiente.
- No se degrada el flujo de decisiones verificables, no se quitan bloqueos2D y no se activa autoridad cloud como efecto lateral.

## Orden propuesto y decisiones del implementador

Entregas propuestas: contrato de medidas/fichas y capacidad real; shell visual y selección de piezas; geometría/replay; ampliación cinemática y cadena contrastada; Target Lock; orden persistida y autorización; integración de informes y aceptación. El plan concretará dependencias y regresiones antes de código.

Decisiones del implementador para revisión del usuario: ampliar el lenguaje visual existente; SVG esquemático explícito; fichas manuales con trazabilidad; cálculos ausentes visibles; modificaciones siempre como alternativa; torque nunca tomado de los ejemplos; ninguna ampliación implícita de capacidades de IA; los seis módulos avanzados del segundo texto se registran como hoja de ruta, no se incluyen como sistemas validados en esta entrega.

## Hoja de ruta separada y límites comerciales

Aerodinámica en inclinación/RHD, flex estructural, FFT/wavelets y chatter, neumático con deslizamiento combinado, freno motor/embrague, termo-hidráulica de frenos, biomecánica, combustible/degradación, biometría y vida de piezas requieren contratos, sensores y modelos propios. No se incorporan como predicción operativa por copiar sus cifras. Se mantendrá su cobertura pendiente en la matriz de producto durante implementación.

2D independiente, metrología real, identidad cloud, auditoría global y distribución/deploy continúan abiertos. Esta entrega mejora operación y trazabilidad; no equivale a certificar el producto para venta ni a un gemelo dinámico completo.

## Revisión de preparación

Revisión independiente del diseño el26 de octubre de2026 por visual_workshop_builder_check: «nothing important left». No detectó decisiones pendientes del usuario que impidan preparar el plan. Fórmulas exactas, contratos, dependencias y casos de prueba se concretarán durante investigación y planificación, manteniendo los criterios de bloqueo descritos. La revisión no acredita física, ejecución ni código implementado.


## Anexo solicitado: cuarta vista de dinámica en curva

Origen: imagen codex-clipboard-1d9204e7-424f-4337-9fde-3db33650d48b.png aportada después de aprobar el núcleo. El usuario pide incorporarla. Este anexo concreta esa ampliación para revisión; sustituye la exclusión general de un visualizador de curva, pero no habilita modelos avanzados sin validación.

### Experiencia

Cuarta pestaña «Dinámica en curva» en el mismo espacio. Conserva contexto, revisiones y procedencia. Selector de escenarios de radio, con entrada numérica y acciones rápidas35/75/140m claramente identificadas como escenarios editables, nunca como radios medidos del circuito. Velocidad, masa y radio sin valores precargados de la moto ni una marcha supuesta. Lectura temporal de telemetría solo con canales identificados y unidades/reloj válidos; el radio no se infiere de una captura ni del nombre de la curva.

Dos dibujos SVG coordinados: vista frontal esquemática de moto/piloto y vectores; plano Fx/Fy con demanda y envolvente del modelo. Se muestran inclinación ideal del conjunto, aceleración lateral y demanda de fuerza. Inclinación de la moto y del conjunto se separan solo cuando hay postura/CoG cuantificados. Un porcentaje genérico de descuelgue no se convierte en grados mediante un coeficiente fijo. La vista frontal por defecto sin postura representa el conjunto, y no simula ángulos de piloto medidos.

Inspector de velocidad/radio/masa y supuestos, con panel de cobertura y próxima medida. Configuración avanzada puede registrar posición/masa de piloto y vector aerodinámico como hipótesis, pero no mueve resultados hasta que exista el modelo correspondiente. El escenario de captura185km/h y140m podrá ser una fixture de aceptación sintética, sin etiquetarlo como sesión real. Los colores de riesgo no sustituyen etiquetas y no se muestra «low-side crítico» como conclusión real.

### Modelo mínimo definido

Función pura de referencia para curva estacionaria en plano horizontal: velocidad no negativa, radio positivo y masa positiva; devuelve a_y=v²/R, F_y=m*a_y y atan2(a_y,g) como inclinación ideal del conjunto sin aerodinámica, con versión/supuestos. Las fuerzas son agregadas del conjunto: no se asignan a una rueda sin un modelo de reparto lateral validado. F_x es entrada independiente opcional; si no se conoce, no se presenta el instante real como «ápice puro». El escenario explícito F_x=0 sí permite explorar ese supuesto.

Envolvente genérica requiere Fz, mu_x y mu_y positivos, sus procedencias y F_x/F_y. Devuelve demanda normalizada sqrt((Fx/(mu_x*Fz))²+(Fy/(mu_y*Fz))²). Se denomina «elipse de fricción idealizada», no Magic Formula ni reserva de agarre medida. Debe admitir incertidumbre desconocida sin inventar un intervalo de confianza. Si la demanda excede1, se comunica «demanda superior a la envolvente asumida»; no se diagnostica que el piloto está perdiendo la rueda. Ausencia de coeficientes no produce100% por defecto.

Para una envolvente normal derivada del escenario sin aero se admite Fz=m*g y se etiqueta como carga normal idealizada del conjunto. La carga normal medida puede usarse solo con su marco/unidad/procedencia y dominio compatibles. No se suman valores de carga por rueda a una envolvente global sin explicitarlo. Las fuerzas de apoyo lateral por aero no se deducen de un deslizador escalar.

### Funciones avanzadas y garantías

El nombre Pacejka solo se habilitará con ecuaciones, coeficientes identificados, rango de carga/temperatura/deslizamiento y comprobación independiente del modelo concreto. Aerodinámica inclinada y corrección de inclinación por postura requieren posición/vector y transformación de marcos contrastados; por ahora su estado es «modelo no disponible» aunque pueda registrarse la hipótesis. No se afirma que180N ahorren1.8° ni que65% de descuelgue equivalga a2.7°. Los sensores ausentes generan peticiones concretas, no recomendaciones de conducir más rápido ni añadir carga aero.

La nueva vista no participa en la aprobación de cambios físicos ni amplía las seis métricas de IA existentes. Sus escenarios, parámetros, fórmulas y resultados pueden guardarse como evidencia determinista separada y aparecer como anexo de informe con etiquetas y huella. El resultado nunca se mezcla con telemetría medida. Un futuro modelo validado requerirá su propia ampliación de catálogo/versiones/aceptación.

### Aceptación adicional

Fixture sintética v=185/3.6m/s, R=140m, m=240kg: comprobar a_y y F_y contra cálculo independiente, coherencia de unidades, ángulo atan2 y que un cambio de masa cambia fuerzas pero no a_y/ángulo en este modelo. Mu desconocido produce envolvente no disponible; coeficientes asumidos producen etiquetas visibles y no diagnóstico de caída. Probar velocidad0, radio0/negativo, NaN/inf/overflow, signos deFx, saturación en1, valores superiores a1 sin recorte y selección de escena sin contaminar el borrador B. Pruebas de autorización para guardar/leer escenarios y anexos por equipo. Inspección desktop/tablet/mobile de los dos dibujos y controles.

Revisión adicional del anexo por visual_workshop_builder_check: «nothing important left». No detectó preguntas materiales previas al plan ni contradicciones con el núcleo; la aprobación del usuario sobre la concreción del anexo sigue pendiente.
