# AGENTS.md

## Objetivo

Mantener una interfaz de centro de mando KDD coherente, operativa y alineada con `design.md`.

## Reglas Para Agentes

- Leer `design.md` antes de modificar estilos o componentes.
- No crear landing pages para este repositorio: la primera pantalla es el command center.
- Mantener los componentes de `src/components` desacoplados y alimentados por tipos de `src/services`.
- Evitar tarjetas anidadas, decoracion gratuita y paletas monocromaticas.
- Preferir CSS simple y tokens globales antes de estilos inline.
- Si se agrega un componente visual nuevo, debe tener un proposito operativo claro: estado, metrica, alerta, herramienta, skill, experimento o flujo KDD.

## Verificacion Recomendada

```bash
npm run build
npm test
```
