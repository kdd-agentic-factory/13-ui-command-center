# Evidencia por dominio de Chassis — aceptación local

Fecha: 2026-10-26. Alcance aprobado en `docs/superpowers/plans/2026-10-26-chassis-domain-evidence.md`. Estado: entrega de software validada localmente, con revisión independiente y correcciones verificadas. Sin despliegue ni migraciones cloud.

## Producto implementado

Chassis incorpora medidas documentadas de pista, clima y neumáticos, importación CSV explícita y lectura de canales guardados de propulsión. El paquete conserva original, unidades, reloj, revisión, huella y equipo. Guardar deja el estado aportado; una revisión documental humana separada solo habilita observación de condiciones declaradas. Las fuentes experimentales y los relojes no admisibles siguen siendo exploratorios.

Las referencias se seleccionan para el próximo snapshot1.2; los anteriores conservan sus bytes. El contexto técnico2.2 limita cantidades, tamaño y contenido. Cada especialista obtiene evidencia de su dominio; los revisores independientes trabajan sobre el manifiesto congelado sin conclusiones principales. Físico/neuro registran requisitos de adquisición, con inferencia deshabilitada.

Las seis vistas comparten selección. El informe1.1 conserva cobertura y limitaciones; las referencias anteriores siguen consultables. Editar una evidencia seleccionada invalida la generación vigente, manteniendo la decisión final del Crew Chief humano titular o su sustituto.

## Evidencia ejecutada

- HTTP autenticado con gateway, workers independientes y PostgreSQL efímero: controles sintéticos completo y parcial pasan, incluida aprobación humana e invalidación.
- Ollama real `qwen3:0.6b`: siete especialistas/revisores y Chief completan el caso completo con ocho llamadas; físico/neuro consumen cero. El caso parcial también pasa: clima solicita la revisión documental ausente sin bloquear Chassis. Entradas de control sintéticas, no datos de un instrumento certificado.
- Navegador sobre paquete compilado y backend vacío aislado: medición manual, revisión documental, seis vistas, recarga, snapshot y CSV de reloj original pasan. Capturas a390/1024/1366; estadísticos de media y rango verificados en el navegador de producción (1 prueba,23.9s).
- Backend completo:873 pruebas pasan y20 se omiten; focals finales88 pasan, incluida compatibilidad histórica y el actor local. UI completa:445 pruebas en100 archivos. Gateway completo:118. Typecheck de proyecto y compilación final pasan. Wheels17/18 importados fuera del checkout; recursos JSON y coincidencia de fuentes finales comprobados.
- Orquestador completo:224 pruebas pasan con su intérprete nativo3.14 y dependencias3.14 ya existentes añadidas al final de sys.path; sin instalaciones.

## Límites que continúan abiertos

No se ha certificado el lector2D contra Analyzer o una exportación independiente del fabricante, ni existe ensayo externo de fuerza para validar el banco. Las medidas documentales no sustituyen calibración ni aceptación metrológica. No se han habilitado conectores live nuevos, diagnósticos biométricos, predicciones de adherencia/desgaste/potencia, cambios físicos autónomos o federación operativa. La aceptación comercial y el despliegue de identidad cloud siguen siendo entregas distintas.

## Operación

Arranque coordinado de01/02/18: herramientas6, task2/result3/envelope1, decisiones1.0/1.1 y snapshots1.0/1.1/1.2. No mezclar consumidores anteriores. DB privada por defecto `data_root/domain-evidence.sqlite`, fuera de raw; se requieren los tres headers KDD. En modo autenticado manda el sujeto verificado y el equipo, nunca el actor aportado.

No reutilizar los controles de aceptación como mediciones de pista. Evidencias y hashes de esta entrega en `.superpowers/sdd/2026-10-26-chassis-domain-evidence`, conservados por autorización del usuario.

## Revisión y decisiones de implementación

Revisión independiente de78 archivos congelados: ningún hallazgo crítico, cinco importantes y uno menor. Se corrigieron en una única pasada con regresiones: orden de bloqueos entre bases y CAS; conservación de borradores por formulario; filtrado de todos los valores en el límite de lectura por rol; asociación explícita de citas con calificadores/tiempo; propagación del actor local; entrada físicamente inválida devuelve422. Los grants reales de weather/chassis se comprobaron también contra el código congelado anterior para confirmar que detectan la filtración previa. No se solicitó un segundo ciclo de revisión.

Decisiones registradas en el ledger: conservar los checkouts autorizados y los cambios previos sin commits/limpieza; usar frecuencia nula explícita para magnitudes estáticas; versionar domain_triage con consumidores coordinados y sin autoridad física; invalidar conservadoramente la vigencia al revisar evidencias, incluso si una operación se cancela o falla después del fence. Sus costes son, respectivamente, revisión por manifiestos, consumidores capaces de distinguir cantidades estáticas, despliegue coordinado y posible repetición de revisión humana por disponibilidad. No se ha ocultado ninguno mediante valores ficticios.

Permanecen como mejoras de presentación el solapamiento de la cabecera global a390px y el aviso de bundle grande existente. La suite no acredita accesibilidad integral, metrología ni aceptación comercial.

## Activación local comprobada

Backend, gateway y worker propios reiniciados conjuntamente tras comprobar inactividad y crear copias SQLite consistentes. Health de backend/gateway OK; ocho rutas de dominio disponibles; worker hace claim y claim_synthesis con200. Modelo de ingeniería configurado qwen3:0.6b. El original bajo raw conserva SHA256 `c872f6ccd79a00de2ad211e56cca7f091fa5194ddfafa62a945314c69cecfc52`. Catálogo nuevo vacío, sin convertir controles o rangos históricos en mediciones del usuario. Entorno local de desarrollo; identidad cloud productiva pendiente.

Los controles completo y parcial con Ollama real volvieron a pasar tras las correcciones:2 pruebas en181.61s, ocho llamadas por run, sin ampliar presupuesto/modelo; físico/neuro sin inferencia. Estos controles son sintéticos de software, explícitamente separados de las fuentes de usuario.

## Corrección posterior de interfaz

El solapamiento móvil y el aviso de bundle grande anotados arriba quedaron corregidos en la continuación local. Cabecera comprobada a320/390/768/1024/1366px, y mayor chunk3D reducido de5,08MB a1,07MB conservando los cuatro visores. Ver `chassis-interface-hardening-2026-10-26.md`; las evidencias originales de esta entrega se conservan sin sobrescribir.
