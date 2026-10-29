> Archivo histórico: diseño/plan aprobado el 28-10-2026. Describe esa fase, no el estado actual de producción. El avance posterior se registra en el plan de factorías y Brain del repositorio 18; conservar esta especificación no declara una aceptación ni un despliegue nuevos.

# Chassis — adaptación para InsForge Compute

Estado: propuesta para revisión; no implementada ni desplegada.
Fecha:2026-10-28.

## Objetivo y decisiones del usuario

Alojar toda la plataforma en InsForge, después de la aceptación. Retirar el servicio antiguo de este proyecto cuando el reemplazo esté operativo. Conservar la decisión del Crew Chief humano y su suplente, los datos de cada equipo, la IA verificable y todas las muestras. La revocación histórica sigue pendiente y no se ejecuta en esta entrega.

## Evidencia del destino

Proyecto The Digital Pit Wall,23afcca6-10d0-4bae-83d0-9999f4717a81. Web vigente del7de julio2026: thedigitalpitwall.insforge.site. Un servicio antiguo detenido: kdd-race-ai-copilot (id70bc8e26-ae98-4ab0-bd9f-42d8ca8ee20b). No variables frontend persistentes configuradas. No se han modificado estos recursos.

InsForge declara que Compute no dispone de volúmenes persistentes, incluso en el proveedor Fly. La entrega actual de Chassis usa SQLite y archivos en volumen persistente. Subir sus imágenes sin adaptar el almacenamiento perdería durabilidad en los cambios de contenedor. Referencia: https://github.com/InsForge/InsForge/blob/main/.env.example .

## Adaptación propuesta

1. Postgres de InsForge para catálogo, setups/revisiones, sesiones, evidencias, runs, leases, operaciones idempotentes y auditoría. Mantener el adaptador SQLite para instalaciones locales. Migraciones nuevas revisadas en preproducción; nunca ejecutar automáticamente migraciones en arranque.
2. Storage privado para grabaciones, originales y derivados inmutables con hashes. Acceso por equipo comprobado en servidor, sin buckets públicos. Publicación con estado pendiente y confirmación transaccional; reconciliación idempotente ante fallos. No cargar archivos completos grandes en memoria.
3. Transacciones y exclusión de escritor en Postgres sustituyen locks de archivo en el perfil cloud. Recuperación no reactiva leases antiguos ni inventa aprobaciones. La autoridad humana existente continúa verificándose contra identidad/membresía reales.
4. Despliegues separados para web/API e ingeniería, con transporte TLS y autenticación de servicio. Las rutas MCP/control continúan fuera del acceso humano público; verificar las capacidades de red privada del proveedor antes de elegir el transporte. Los secretos de producción no se copian de ensayos ni se incluyen en imágenes.
5. La ubicación de la inferencia es un requisito abierto: la aceptación actual utiliza Ollama en el nodo Linux local aislado. No hay enlace productivo desde InsForge a ese nodo. Implementar y aceptar conectividad autenticada y restringida o un servicio de inferencia en InsForge con modelo/digest y recursos explícitos. No sustituir por otro proveedor/modelo de forma silenciosa.
6. La web conserva su dominio. El enrutamiento same-origin y el perímetro comercial deberán verificarse en el alojamiento real; un build estático exitoso no prueba este comportamiento.

## Datos y reversión

Inventariar todas las tiendas de operations/state.py, incluidos archivos históricos en cuarentena. Exportar copia en frío con manifiesto/hash, importar a destino nuevo y comparar cantidades, hashes, revisiones y propietario. Ninguna asignación automática de datos sin equipo. Copia original conservada; vuelta a la versión anterior mediante procedimiento explícito que no acepte escrituras divergentes.

## Aceptación y cambio de tráfico

Primero: aceptación source21 en Chassis-Preproduction con identidades y modelo reales, datos sintéticos declarados. Esa aceptación NO certifica la futura adaptación Postgres/Storage ni la lectura 2D.

Después de implementar la adaptación: pruebas de transacciones concurrentes, aislamiento entre equipos, reinicio/recreación real de Compute sin pérdida de datos, restauración, fallos de publicación, transporte cerrado, agentes reales, navegador, Crew Chief y suplente. Verificar builds y escaneos por digest y procedencia. Sin gates inventados ni cambios de límites para hacer pasar la IA.

Solo después del destino aceptado: desplegar servicios nuevos, verificar salud/estado y cambiar la web. Comprobar que el servicio antiguo no tiene consumidores ni datos por conservar y retirarlo. Conservar evidencia y referencia del despliegue anterior para recuperación; no eliminar otros proyectos o cuentas.

## Bloqueos visibles

- Confirmación de uso del SDK de2D y contraste de sus cinco demos: pendiente.
- Contraste independiente de AiM: pendiente, aunque la corrección del SDK conserva muestras y tiene pruebas reales.
- Revocación histórica: pendiente por decisión del usuario; no presentar la plataforma como totalmente lista para venta mientras este bloqueo siga abierto.
- Recursos/coste y ubicación de inferencia productiva: por concretar antes de crear servicios de pago.

## Alcance de esta aprobación

Aprobar esta propuesta permite preparar el plan y la implementación. No ejecuta por sí misma migraciones cloud, mueve datos, borra servicios o cambia tráfico. El usuario ya ha pedido el redespliegue y retirar el servicio antiguo después de la aceptación; las acciones concretas se harán con artefactos y destino comprobados.
