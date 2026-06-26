# Release 2.0

Notas de la versión **2.0** de Digi TechSupport (cambios desde la **1.2**).

## Novedades principales

### Catálogo de dispositivos
- Catálogo completo de dispositivos agregado (líneas y productos ampliados).
- **Búsqueda por dispositivo** en todo el catálogo.
- Correcciones de catálogo y de productos, manejo de fotos y soporte USB.

### SSH
- **Dock multi-sesión**: la terminal SSH se puede **minimizar** y mantener varias sesiones a la vez.
- **Copiar / pegar habilitado** dentro de la terminal.
- Botones separados para **cerrar** vs. **minimizar** sesión.
- Controles de ventana diferenciados (claridad en la barra de la terminal).

### IA
- Generación y análisis de plantillas de soporte mejorados.

## Detalle de commits (1.2 → HEAD)

```
833cb69 fix.photos
e2d0617 1
1ada119 new-catalog2
c6879f4 fix-catalog
c85f25f feat(ssh): remove copy/paste toolbar buttons, distinguish window controls
0d60ce4 fix-ssh-issues1
7b972f7 feat(ssh): multi-session minimize dock + paste in terminal
37fcb0c docs: split SSH close vs minimize into two distinct buttons
fe226c8 docs: spec for SSH multi-session dock + paste
3e75e88 12
91ff66b Update renderer.js
c404b5d 12
40a0554 tc
7b54472 Update renderer.js
3314881 products-update
0d31877 more
85e48b0 products.
10e19cc usb
cebbe84 12
42951b6 Merge branch 'main' of https://github.com/4rji/digi-techsupport
5cdc312 products
ca89ddb Update package.json
```

## Cómo publicar el tag

Cuando quieras crear el tag en GitHub (mismo patrón que 1.0/1.1/1.2):

```bash
# subir versión en package.json a 2.0.0 (opcional)
git tag -a 2.0 -m "Release 2.0"
git push origin 2.0
```
