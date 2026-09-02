# Foaie

## Tu diario visual de lectura

Foaie es una aplicación web para que cada persona pueda construir y explorar su propio diario visual de lectura.

Permite registrar libros físicos, ebooks y audiolibros, conservar el historial de cada lectura y reunir progresos, valoraciones, reseñas, notas, citas y otros recuerdos en un espacio privado y personal.

Foaie está diseñada para funcionar desde el principio como una aplicación multiusuario. Cada persona dispone de su propia cuenta y solo puede acceder a su biblioteca, sus lecturas, sus estadísticas, sus preferencias y sus datos exportados.

## El significado de Foaie

“Foaie” significa “hoja” en rumano, la lengua materna de la creadora del proyecto.

El nombre representa al mismo tiempo una hoja de papel, la página de un libro y el lugar donde permanecen las huellas de una lectura. Esta idea conecta la identidad del producto con la memoria, la escritura y la experiencia íntima de leer.

## Objetivo

El objetivo principal de Foaie es ayudar a cada persona a construir una memoria lectora propia: no solo registrar qué libros ha leído, sino también cómo, cuándo y qué significaron esas lecturas.

El producto prioriza:

- La privacidad y el aislamiento entre cuentas.
- El control de cada persona sobre sus propios datos.
- Una experiencia visual organizada alrededor de las portadas.
- El registro progresivo, sin formularios innecesariamente largos.
- La posibilidad de conservar y exportar la información personal.
- Estadísticas claras, explicables y vinculadas a los registros originales.

## Funcionalidades previstas

El MVP contempla:

- Crear una cuenta e iniciar sesión.
- Cerrar sesión y recuperar el acceso.
- Mantener una biblioteca independiente por usuario.
- Crear, editar y eliminar fichas de libros y ediciones.
- Buscar metadatos por título, autor o ISBN.
- Corregir manualmente los datos importados.
- Añadir portadas y mostrar placeholders accesibles cuando falten.
- Registrar autoría, saga, género, editorial, ISBN, idioma, año, páginas, duración y formato.
- Mantener los estados pendiente, leyendo, terminado y abandonado.
- Registrar varias lecturas y relecturas de una misma edición.
- Guardar fechas y progreso en páginas, porcentaje o minutos.
- Valorar las lecturas de cero a cinco estrellas en pasos de media estrella.
- Guardar reseñas, notas, citas y personajes favoritos.
- Marcar libros como favoritos, comprados o prestados.
- Consultar la biblioteca en cuadrícula o lista.
- Buscar y filtrar por estado, formato, género, valoración y año leído.
- Ver un dashboard con la lectura actual, el objetivo anual y cifras del periodo.
- Consultar un álbum mensual con portadas, totales, páginas, audio y media.
- Configurar idioma, zona horaria, inicio de semana, tema y unidad de progreso.
- Exportar los datos propios en JSON y las lecturas propias en CSV.

Cada cuenta solo podrá consultar y modificar sus propios datos.

El MVP no incluye:

- Seguir a otras personas.
- Perfiles públicos.
- Comentarios o likes.
- Mensajes.
- Clubes de lectura.
- Recomendaciones sociales.
- Listas colaborativas.
- Compartir actividad.
- Mapas, logros o Wrapped anual.
- PWA offline.
- Importación masiva.

## Stack tecnológico previsto

- Next.js con App Router
- TypeScript
- React
- CSS Modules y variables CSS
- PostgreSQL
- Prisma ORM
- Auth.js o un proveedor de autenticación gestionado
- Zod
- React Hook Form
- Vitest y Testing Library
- Playwright
- Almacenamiento de objetos compatible con S3 para portadas
- Vercel u otro host compatible con PostgreSQL gestionado

Las decisiones técnicas completas se encuentran en [docs/product-spec.md](docs/product-spec.md).

## Estado actual

Foaie se encuentra en la Etapa 0.5: Git, GitHub y preparación del repositorio.

Actualmente están preparados:

- La rama principal `main`.
- La configuración inicial de exclusiones de Git.
- La especificación de producto.
- La definición del MVP multiusuario.
- La arquitectura inicial de privacidad, autorización y aislamiento.

Todavía no se ha implementado código de aplicación ni se ha creado el commit inicial.

## En desarrollo

Foaie está en desarrollo. La especificación de producto es la fuente de verdad para las decisiones de producto, el alcance del MVP, la arquitectura y la hoja de ruta.

La primera versión será multiusuario y privada por defecto. Cada persona podrá crear y gestionar su propia cuenta, mientras que las funciones sociales permanecerán fuera del MVP.

## Estructura inicial prevista

```text
src/
  app/
    (auth)/
      login/
      register/
      recover/
    (app)/
      dashboard/
      library/
      diary/
      statistics/
      settings/
    api/
  components/
    books/
    readings/
    charts/
    forms/
    layout/
    ui/
  lib/
    auth/
    db/
    validation/
    dates/
    statistics/
    book-providers/
    storage/
    export/
  styles/
    tokens/
    globals/

prisma/
  schema.prisma
  migrations/
  seed/

tests/
  unit/
  integration/
  e2e/

docs/
  product-spec.md
```

Esta estructura es una guía para la implementación posterior y podrá ajustarse según las necesidades reales del proyecto.

## Privacidad y seguridad

Foaie es privada por defecto y debe aislar los datos entre cuentas.

La aplicación deberá:

- Obtener el usuario desde la sesión autenticada.
- Comprobar la propiedad en cada lectura y mutación del servidor.
- Filtrar consultas, estadísticas, cachés y exportaciones por usuario.
- Proteger las portadas mediante almacenamiento y acceso autenticados.
- No registrar reseñas, notas, citas, tokens ni credenciales en logs.
- Mantener los secretos únicamente en variables de entorno.
- Probar explícitamente que una cuenta no puede leer ni modificar recursos de otra cuenta.

No se incluirán en el repositorio contraseñas, tokens, claves API, bases de datos locales, archivos `.env` reales ni artefactos generados.

## Hoja de ruta

1. Decisiones de producto y prototipo de baja fidelidad.
2. Preparación de Git, GitHub y documentación inicial.
3. Base visual navegable y responsive.
4. Base de datos, autenticación y aislamiento multiusuario.
5. Catálogo manual de libros.
6. Biblioteca.
7. Lecturas y progreso.
8. Dashboard.
9. Diario mensual.
10. Importación opcional por API.
11. Estadísticas del MVP.
12. Exportación, seguridad, accesibilidad y calidad.

## Licencia

La licencia del proyecto se decidirá más adelante.
