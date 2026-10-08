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

## Stack tecnológico actual

- Next.js 16 con App Router
- React 19
- TypeScript
- CSS Modules y variables CSS
- Supabase PostgreSQL
- Supabase Auth y Row-Level Security
- `@supabase/ssr` para sesiones mediante cookies
- Zod

Las decisiones técnicas completas se encuentran en [docs/product-spec.md](docs/product-spec.md).

## Estado actual

Foaie ha completado la base visual, el acceso privado, el catálogo manual, la Biblioteca personal y la Etapa 5 de lecturas y progreso. La aplicación funciona como sistema multiusuario privado por defecto.

Actualmente están implementados:

- Registro, confirmación de correo, inicio y cierre de sesión y recuperación de contraseña.
- Rutas privadas y rutas exclusivas para personas sin sesión.
- `public.profiles` enlazado uno a uno con `auth.users`.
- Preferencias iniciales de nombre visible y zona horaria IANA.
- Row-Level Security y pruebas de aislamiento entre cuentas.
- Catálogo compartido de obras y ediciones con alta y edición manual.
- Biblioteca personal con pertenencias privadas y filtros de lectura.
- Inicio y relectura como sesiones independientes, con fecha local editable.
- Registro y corrección atómicos del progreso, además de cierre y abandono conservando el historial.
- Filtros históricos que permiten localizar una misma pertenencia por sus sesiones terminadas y abandonadas.
- Protección del borrado normal de una pertenencia cuando conserva historial de lectura.
- Migraciones SQL versionadas y sincronizadas con el proyecto remoto de desarrollo.

La Etapa 5 — Lecturas y progreso está completada. Las etapas de objetivos y continuidad lectora, Inicio, Mi álbum, importación y estadísticas continúan pendientes.

## En desarrollo

Foaie está en desarrollo. La especificación de producto es la fuente de verdad para las decisiones de producto, el alcance del MVP, la arquitectura y la hoja de ruta.

El desarrollo utiliza actualmente un proyecto Supabase hosted exclusivo. El stack local con Docker y `supabase start` está pospuesto deliberadamente hasta que aporte valor para pruebas aisladas, CI o restauraciones desechables.

## Estructura relevante

```text
src/
  app/
    (auth)/
      (guest-only)/
      restablecer-acceso/
    (app)/
    auth/callback/
  components/
    auth/
    layout/
    library/
    profile/
    reading/
    ui/
  lib/
    auth/
    db/
    library/
    profile/
    reading/
    supabase/
  styles/
    tokens.css
    globals.css

supabase/
  config.toml
  migrations/
  tests/database/

docs/
  product-spec.md
```

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

La configuración local reside en `.env.local`, que nunca debe versionarse. `.env.example` documenta únicamente los nombres de variables necesarios sin valores reales.

## Hoja de ruta

1. ✅ Decisiones de producto y prototipo de baja fidelidad.
2. ✅ Preparación de Git, GitHub y documentación inicial.
3. ✅ Base visual navegable y responsive.
4. ✅ Base de datos, autenticación y aislamiento multiusuario.
5. ✅ Catálogo manual de libros.
6. ✅ Biblioteca.
7. ✅ Etapa 5 — Lecturas y progreso.
8. Etapa 5.5 — Objetivos y continuidad lectora.
9. Etapa 6 — Inicio.
10. Etapa 7 — Mi álbum.
11. Etapa 8 — Importación opcional por API.
12. Etapa 9 — Estadísticas del MVP.
13. Etapa 10 — Exportación, seguridad, accesibilidad y calidad.

## Licencia

La licencia del proyecto se decidirá más adelante.
