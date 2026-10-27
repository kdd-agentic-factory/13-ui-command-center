# Chassis: un producto con vistas por perfil

Estado: propuesta para revisión; el usuario ya ha elegido el enfoque de producto único. No se ha implementado esta ampliación. Continúa sobre la sesión, telemetría, Chassis, agentes, autoridad y taller existentes.

## Intención

Hacer que cada integrante encuentre su siguiente tarea sin recorrer todos los controles técnicos. La misma evidencia debe permitir al piloto explicar sensaciones, al analista comprobar la fuente, al ingeniero comparar alternativas, al Crew Chief decidir y al mecánico ejecutar una orden vigente. No se promete utilidad comercial universal por disponer de varias vistas: requiere pruebas de uso con esos perfiles.

## Enfoques y decisión

Se ofrecieron un producto con vistas por perfil y aplicaciones separadas por perfil. El usuario eligió el primero el 26-Oct-2026. Mantiene una sesión y evita reconciliar varias versiones de setup, decisiones y órdenes. Coste: organizar la complejidad y probar que cambiar de vista no borra trabajo ni modifica permisos. Aplicaciones separadas multiplicarían almacenamiento, soporte y divergencia de evidencia; no son el enfoque elegido.

## Base real y restricciones

`ChassisPage` contiene contexto de ingeniería, comparación/taller, datos y análisis humano. `useChassisWorkspace` mantiene A/B y preview; hay protección de borradores. La autoridad pertenece al servidor y a la designación de Crew Chief/sustituto. Los perfiles históricos de `AuthContext` controlan navegación, no acreditan por sí mismos permisos de equipo. Existen seis: race-engineer, team-principal, data-analyst, mechanic, spectator, founding-node. No hay todavía vistas operativas completas de piloto y Crew Chief.

`garageProfile.ts` contiene semillas, porcentajes e historias de ejemplo. No serán fuente del nuevo espacio de trabajo ni de recomendaciones. El contexto real procede de catálogos y sesiones del servidor. El producto conserva React/TypeScript/CSS y backend actuales; no requiere dependencias nuevas, nube, modificación de roles DB ni migración.

## Experiencia propuesta

Después de elegir circuito, moto, piloto y tipo de sesión, una barra muestra ese contexto, calidad de fuente y siguiente paso. Un selector «Vista de trabajo» cambia el foco de tarea, no la identidad. Las vistas son:

| Vista | Tarea principal | Evidencia y acciones |
|---|---|---|
| Piloto | Entender qué revisar en la siguiente tanda | Resumen comprensible de comparación/análisis existentes, incertidumbres y preguntas pendientes. Sin diagnósticos, coaching inventado ni biometría. Notas solo cuando haya persistencia existente comprobada; si no, fuera de esta entrega. |
| Mecánico | Consultar y ejecutar el trabajo autorizado | Orden vigente, pieza, antes/después, fuente, herramienta, par documentado, comprobaciones y evento de aplicación. Sin pares o presets genéricos. |
| Ingeniero | Preparar y contrastar A/B | Chassis visual, medidas, curvas, calibración, Target Lock y evidencia. Mantiene acceso a controles completos. |
| Analista | Verificar qué datos se pueden usar | Canales, unidades, reloj, fuente, calibración y cobertura. No convierte disponibilidad en validación. |
| Crew Chief | Revisar argumentos y decidir | Conclusiones principal/contraste, desacuerdos, propuesta concreta y autoridad vigente. Solo titular/sustituto designados pueden aprobar mediante el flujo del servidor. |
| Dirección / observación | Revisar estado y resultados | Resumen de sesión e informes autorizados; sin controles de montaje. No crea acceso público ni permite leer otro equipo. |

Los perfiles históricos sugieren la vista inicial: ingeniero→Ingeniero, analista→Analista, mecánico→Mecánico, dirección→Dirección, observador→Observación, nodo técnico→Ingeniero. Es una propuesta del implementador. El nodo no recibe autoridad especial. Piloto y Crew Chief son preferencias de presentación nuevas, no roles de autenticación. Una misma persona puede usar varias vistas con sus permisos reales actuales.

La pantalla debe mostrar una acción siguiente verificable: completar contexto, importar/abrir medición, resolver calidad/calibración, completar medidas, comparar, analizar, revisar propuesta o consultar orden. Se obtiene de estados disponibles del servidor, sin porcentajes arbitrarios ni análisis iniciado automáticamente. Una fuente experimental conserva su bloqueo en todas las vistas.

## Estado y contratos

Se reutilizan tipos y consultas existentes. La nueva proyección de presentación se deriva de contexto, fuente, comparación guardada y análisis/orden actuales. No se introduce un segundo estado de aprobación o setup. Un selector de vista nunca llama a una mutación ni ejecuta IA.

La preferencia comienza en memoria para limitar riesgos de restauración y no guardar datos personales fuera del contexto autorizado; es una decisión propuesta del implementador. Cambio de usuario/equipo reinicia la preferencia y descarta respuestas del contexto previo. Cambio de sesión conserva las protecciones de borrador. Cambiar de vista conserva A/B y formularios sin guardar; si algún formulario no puede mantenerse, se usa el guard existente antes de desmontarlo.

La visibilidad no sustituye autorización. Reader/engineer/admin y la designación humana se verifican en las rutas existentes. No se amplían roles para que «Mecánico» o «Piloto» puedan escribir. Un usuario puede ver la vista Crew Chief y aun así recibir «Sin autoridad para aprobar». El modo local permanece sin autoridad humana autenticada. Mientras no haya permisos conocidos, acciones de escritura quedan deshabilitadas con motivo; no se deducen de etiquetas de perfil.

Precisión tras inspeccionar navegación: las listas históricas de dirección y observador no incluyen Chassis. El plan deberá permitir encontrar la entrada común también desde esos perfiles, modificando únicamente navegación/presentación. Esto no altera requiresAuth, membresías, credenciales, permisos del backend ni crea acceso público a datos. TelemetryGate y aislamiento por equipo siguen siendo obligatorios. La referencia anterior a conservar AuthContext significa conservar sus contratos de identidad, no perpetuar una lista de navegación que impida abrir el producto común.

## Diseño operativo

Conservar identidad KDD/Keedio y tokens de `design.md`. Selector y siguiente tarea visibles sin un panel de bienvenida adicional. Información por prioridad, etiquetas cortas, unidades junto al dato y medición/estimación/escenario distinguibles. Navegación por teclado, foco visible, botones táctiles y diseño adaptable a box/tableta. Usar divulgación progresiva para detalles técnicos, sin ocultar bloqueos que cambien una decisión.

## Aceptación

1. La misma sesión y comparación producen el mismo resultado/evidencia en todas las vistas; se reorganiza la información, no se recalcula física en cliente.
2. Cambio de vista conserva borradores A/B, curva, escenario y orden; no produce llamadas de modelo ni escrituras.
3. Perfil visual no habilita aprobación, montaje o acceso a otro equipo. Pruebas reader/engineer/designado/no designado/local y respuestas tardías al cambiar contexto.
4. Estados sin sesión, sin fuente, fuente experimental, medidas incompletas, propuesta pendiente, autoridad caducada, orden cancelada y error de servicio tienen siguiente acción honesta.
5. Ninguna semilla de garage, métricas de demostración o nueva promesa de precisión llega al flujo real.
6. Pruebas de interfaz, TypeScript, build y regresiones de identidad/decisión/taller; inspección visual acotada escritorio/tableta/móvil con datos controlados sin escribir fixtures en la base principal.
7. Una prueba de uso por perfil deberá verificar que encuentra la tarea y entiende sus bloqueos. La implementación no sustituye entrevistas, validación de disposición a pagar o soporte productivo.

## Fuera de esta entrega

Precios, pagos y planes comerciales; publicación; altas cloud; roles DB nuevos; nuevas integraciones físicas; biometría, visión, optimización bayesiana o recomendaciones sin datos; garantizar fidelidad 2D sin contraste externo. No se anuncian agentes nuevos por ofrecer una vista. La hoja de ruta de la suite integral permanece vinculada a sus contratos y evidencias pendientes.

## Decisiones para revisión

Revisar especialmente la correspondencia de perfiles históricos, preferencia inicialmente en memoria y que la vista Piloto empiece con resumen/preguntas ya existentes, sin abrir todavía un sistema de feedback no persistido. Tras aprobar esta especificación se preparará el plan de implementación en esta sesión.
