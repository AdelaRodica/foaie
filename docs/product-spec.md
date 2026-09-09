# Especificación de producto — Foaie

**Versión:** 1.0  
**Fecha:** 4 de agosto de 2026  
**Estado:** lista para diseño y desarrollo; no incluye implementación  
**Nombre oficial:** Foaie  
**Descriptor:** **Foaie — Tu diario visual de lectura**  
**Tipo de producto:** aplicación web multiusuario y privada por defecto en el MVP, preparada para evolucionar a una PWA en una fase posterior

---

## Resumen ejecutivo

**Foaie** es un diario visual de lecturas para registrar libros físicos, ebooks y audiolibros, conservar recuerdos y comprender los propios hábitos lectores. Su unidad principal no es “el libro del catálogo”, sino **la experiencia personal de lectura**: cuándo se leyó, en qué formato, cuánto se avanzó, qué se sintió, qué frases se guardaron y cómo encaja esa lectura en el historial.

El diario adopta visualmente la forma de **Mi álbum**: cada año es un álbum, cada mes un capítulo, cada página lógica un fragmento de ese capítulo y cada sesión terminada un cromo. Esta experiencia reúne portadas, resúmenes temporales y huellas personales sin sustituir la Biblioteca ni duplicar los datos de lectura.

*Foaie* significa “hoja” en rumano, la lengua materna de su creadora. Representa simultáneamente una hoja de papel, la página de un libro y el lugar donde permanecen las huellas de una lectura. Esta historia personal es parte central de la marca, no una explicación secundaria.

La aplicación debe diferenciar claramente tres conceptos:

1. **Obra:** el contenido intelectual, por ejemplo, *Orgullo y prejuicio*.
2. **Edición:** una publicación concreta con ISBN, editorial, idioma, páginas, portada y formato.
3. **Lectura:** una experiencia personal concreta, con fechas, progreso, valoración, reseña y posible relectura.

Esta separación evita duplicidades y permite registrar varias ediciones o relecturas correctamente.

La recomendación tecnológica definitiva es **Next.js con TypeScript, PostgreSQL y Prisma**, usando autenticación gestionada y almacenamiento de imágenes externo. Es una opción moderna y atractiva para portfolio que permite construir interfaz, servidor y API en un solo proyecto. La primera versión será multiusuario, con cuentas, sesiones y datos aislados por propietario, un despliegue inicial y ninguna función social. El aislamiento por `user_id`, la autorización por recurso, el almacenamiento por cuenta, la configuración por usuario y las consultas filtradas se consideran requisitos del MVP, no una preparación futura.

---

# Fase 1. Visión del producto

## 1.1 Problema que resuelve

Las lectoras suelen repartir su historial entre notas, hojas de cálculo, Goodreads, fotografías, aplicaciones de audiolibros y recuerdos dispersos. Las soluciones sociales priorizan el catálogo, la actividad pública y las reseñas comunitarias; las herramientas genéricas exigen construir y mantener un sistema propio.

Foaie reúne en un espacio privado:

- Biblioteca y lista de pendientes.
- Seguimiento de lecturas actuales.
- Historial de cada lectura y relectura.
- Valoraciones, reseñas, notas y citas.
- Resúmenes mensuales y estadísticas personales.
- Objetivos alcanzables sin presión social.

## 1.2 Persona principal

**Lectora habitual y visual** que consume varios formatos, quiere recordar lo leído y disfruta viendo portadas, patrones y resúmenes. Tiene conocimientos digitales medios, utiliza móvil y ordenador y valora la privacidad.

Persona secundaria futura: lectora que desea importar un historial existente, comparar años o compartir una tarjeta-resumen, pero no busca una red social.

## 1.3 Propuesta de valor

> “Tu memoria lectora, contada con portadas, progreso y recuerdos; privada, visual y bajo tu control.”

Los pilares son:

- **Cover-first:** las portadas organizan y dan identidad a la experiencia.
- **Diario, no red social:** los datos personales importan más que la popularidad.
- **Registro progresivo:** se puede guardar un libro con pocos datos y enriquecerlo después.
- **Multiformato real:** páginas para papel/ebook y minutos para audiolibros, sin forzar equivalencias engañosas.
- **Datos propios:** exportación y copia de seguridad como requisito de confianza.
- **Recuerdo, no solo conteo:** citas, notas, reseñas y favoritos aportan contexto emocional.
- **Diario con forma de álbum:** Mi álbum convierte el historial en una experiencia anual y mensual que se disfruta visualmente sin perder acceso a cada sesión y sus recuerdos.

## 1.4 Diferencias frente a Goodreads y similares

| Área | Productos sociales | Lectoria |
|---|---|---|
| Objetivo | Descubrimiento y actividad comunitaria | Memoria y análisis personal |
| Interfaz | Listas, texto y actividad | Portadas, álbumes y visualizaciones |
| Datos | Libro + estado general | Edición + múltiples sesiones de lectura |
| Privacidad | Perfil y actividad compartida | Privado por defecto |
| Relecturas | A menudo secundarias | Entidad de primera clase |
| Estadísticas | Generales o anuales | Mensuales, anuales y comparables |
| Propiedad | Exportación limitada o irregular | Exportación estructurada prevista |

## 1.5 Funciones realmente importantes

1. Añadir una edición sin rellenar un formulario interminable.
2. Iniciar, actualizar y terminar una lectura.
3. Encontrar cualquier libro mediante búsqueda, filtros y portadas.
4. Consultar una ficha que conserve todas las lecturas y recuerdos.
5. Ver un resumen mensual fiable.
6. Corregir, exportar y recuperar los datos.

Las recomendaciones automáticas, mapas, medallas y Wrapped son atractivos, pero no validan el núcleo del producto.

## 1.6 Principios de producto

- **Privado por defecto.** Ningún dato se publica accidentalmente.
- **Guardar pronto, completar después.** Solo título, autor y formato son necesarios para empezar.
- **Una cifra debe poder explicarse.** Cada estadística tendrá definición y periodo visible.
- **No convertir ocio en obligación.** Rachas y retos deben poder ocultarse.
- **La accesibilidad no es un modo adicional.** Forma parte de cada componente.

## 1.7 Identidad de marca

### Propósito

Ayudar a las personas a conservar la huella de su vida lectora. Foaie transforma libros terminados, avances, citas, impresiones y relecturas en una memoria personal que se puede recorrer y comprender.

### Misión

Crear el diario de lectura más íntimo, visual y respetuoso con los datos personales: sencillo para registrar una lectura hoy y suficientemente sólido para acompañar años de historia lectora.

### Valores

- **Memoria:** una lectura importa por lo que deja, no solo por haber sido contada.
- **Intimidad:** privacidad por defecto y control real de los datos.
- **Calma:** motivar sin convertir la lectura en productividad obligatoria.
- **Claridad:** interfaces y estadísticas comprensibles, honestas y accesibles.
- **Cuidado:** atención a portadas, palabras, detalles y estados emocionales.
- **Autonomía:** exportación, copias y ausencia de dependencias innecesarias.
- **Inclusión:** experiencia responsive, accesible e internacionalizable.

### Personalidad

Foaie es serena, curiosa, sensible, editorial y contemporánea. Se siente personal sin ser infantil; culta sin resultar elitista; tecnológica sin parecer fría. No adopta el tono competitivo de una aplicación de hábitos ni el ruido de una red social.

### Tono de comunicación

- Cercano, claro y breve.
- Habla de “tu lectura”, “tus recuerdos” y “tu biblioteca”.
- Celebra sin presionar: “Has terminado una historia” mejor que “¡Objetivo aplastado!”.
- Explica los errores sin culpar: “No hemos podido guardar el cambio” y cómo recuperarlo.
- Evita infantilización, exceso de signos de exclamación y metáforas en controles críticos.
- Usa lenguaje inclusivo y traducible; las frases de interfaz no se construyen concatenando fragmentos.

### Territorio visual

La identidad se construye alrededor de tres capas: **la hoja** como objeto, **la página** como unidad de lectura y **la huella** como recuerdo. Recursos posibles: esquinas plegadas, márgenes, capas de papel, líneas de anotación, transparencias suaves y movimientos de pasar página. Las portadas siguen siendo las protagonistas; la marca crea el marco sereno que las contiene.

### Logotipo aprobado

La identidad principal combina un símbolo de hoja/página aprobado, formado por dos planos curvos en salmón y terracota, con el wordmark `Foaie` en Lora y tinta oscura. Lora es también la serif editorial de la aplicación. La composición es editorial, cálida, literaria, cercana y serena, elegante sin resultar solemne y reconocible sin competir con las portadas.

La gama cromática de marfil, rosa/blush suave, terracota, marrón tinta y marrón/gris secundario queda aprobada. Los valores hexadecimales documentados son valores de trabajo hasta disponer del activo maestro o vectorial definitivo. El logo debe conservar versiones horizontal, símbolo independiente y monocroma. Los componentes de aplicación no reconstruirán el símbolo ni el wordmark con texto y CSS; consumirán el SVG oficial cuando se incorpore al repositorio.

### Favicon e icono de aplicación

Símbolo independiente de una hoja plegada o una `F` en negativo, con geometría gruesa y reconocible a 16×16 px. Preparar versiones de 16, 32, 180, 192 y 512 px, además de máscara monocroma. No usar texto completo dentro del favicon.

### Iconografía

Iconos de trazo sencillo, extremos ligeramente redondeados y retícula coherente de 20/24 px. La hoja puede aparecer en acciones de diario o notas, pero no debe sustituir indiscriminadamente todos los iconos. Estados y formatos necesitan texto accesible, no solo símbolos.

### Eslogan y descriptor

- **Descriptor oficial inicial:** **Foaie — Tu diario visual de lectura**.
- **Eslogan de marca recomendado:** **Cada lectura deja una página.**
- Alternativa emocional: “Guarda lo que cada libro deja en ti”.

El descriptor se usa en metadatos, portada del README, landing y presentaciones mientras la marca necesite explicar la categoría. El eslogan se reserva para comunicación de marca, no reemplaza descripciones funcionales.

### Gobierno de marca

Nombre, descriptor, eslogan, URLs de activos, metadatos y nombres de producto deben centralizarse en una configuración compartida, por ejemplo `config/brand.ts`, cuando comience la implementación. Los componentes no escribirán “Foaie” repetidamente como literal. Logo, favicon y metadatos tendrán una única fuente documentada, de modo que puedan actualizarse sin buscar cadenas por toda la aplicación.

## 1.8 Métricas de éxito iniciales

Para uso personal, importan más la utilidad y consistencia que el crecimiento:

- Registrar un libro manualmente en menos de 90 segundos.
- Actualizar progreso en menos de 15 segundos.
- Cero pérdida de datos en operaciones normales.
- Encontrar un libro en menos de 20 segundos.
- Comprender el resumen mensual sin documentación.
- Uso recurrente durante al menos tres meses.

---

# Fase 2. Alcance y MVP

## 2.1 Clasificación de funcionalidades

| Nivel | Incluye | Se excluye deliberadamente |
|---|---|---|
| **MVP** | Acceso privado; CRUD de libros/ediciones; importación opcional por búsqueda/ISBN con edición manual; portada; biblioteca; filtros básicos; lecturas y relecturas; progreso; valoración con medias estrellas; reseña/notas/citas; recuerdo reflexivo opcional; dashboard simple; Mi álbum anual con capítulos mensuales y páginas lógicas; objetivo anual; tema claro/oscuro; exportación JSON/CSV | Social, recomendaciones, mapa, logros, Wrapped, estadísticas complejas |
| **V2** | Colecciones personalizadas; retos configurables; estadísticas ampliadas; calendario; historial de actividad; importación masiva; PWA; copia/restauración; tarjetas compartibles; ficha de autores y sagas; animaciones editoriales, spreads, personalización y exportación visual de Mi álbum | Algoritmo de recomendaciones avanzado |
| **Futuro** | Wrapped anual; logros opt-in; selector aleatorio; mapa; emociones; recomendaciones; OCR de ISBN; importadores de terceros; funciones sociales opcionales | Comercio o lectura de ebooks dentro de la app |

## 2.2 Lista cerrada del MVP

El MVP queda limitado a estas **18 capacidades**:

1. Crear una cuenta, iniciar y cerrar sesión y recuperar el acceso mediante correo y contraseña, enlace mágico o el método de autenticación elegido.
2. Crear, editar y eliminar una ficha de edición.
3. Buscar metadatos por título, autor o ISBN y elegir un resultado.
4. Completar o corregir manualmente cualquier dato importado.
5. Subir/seleccionar portada y mostrar un placeholder accesible si falta.
6. Registrar autoría, saga, género, editorial, ISBN, idioma, año, páginas/duración y formato.
7. Mantener estados: pendiente, leyendo, terminado y abandonado.
8. Crear varias lecturas del mismo libro para representar relecturas.
9. Guardar fecha de inicio/fin y progreso en páginas, porcentaje o minutos.
10. Valorar de 0 a 5 en pasos de 0,5 al finalizar o abandonar.
11. Guardar reseña, notas, múltiples citas por sesión —con página/localización y nota personal opcionales—, elegir una cita destacada opcional y conservar un recuerdo de lectura opcional formado por una pregunta reflexiva y una respuesta editable.
12. Marcar favorito, comprado y prestado.
13. Consultar biblioteca en cuadrícula y lista.
14. Buscar y filtrar por estado, formato, género, valoración y año leído.
15. Ver dashboard con lectura actual, acceso rápido, objetivo anual y cifras del mes/año.
16. Recorrer **Mi álbum** por años y meses: sesiones terminadas como cromos paginados de forma lógica y estable, con portada, datos de sesión, relecturas identificadas, cita destacada opcional, resumen mensual, favorito del mes y cierre anual básico.
17. Cambiar entre modo claro, oscuro y sistema.
18. Exportar datos propios en JSON y las lecturas en CSV.

**Fuera del MVP:** colecciones, retos distintos del objetivo anual, gráficos avanzados, calendario, estadísticas de países, recomendaciones, logros, Wrapped, PWA offline, importación masiva y, para Mi álbum, animación de pegado, paso de página animado, celebración al completar una página, spreads, personalización, reordenación manual y exportación visual.

## 2.3 Límites del MVP multiusuario y privado

El MVP permitirá que cada persona cree su propia cuenta, inicie y cierre sesión y recupere el acceso. Cada cuenta tendrá su biblioteca, lecturas, recuerdos, estadísticas, preferencias y exportaciones separadas. No ofrecerá perfiles públicos, seguir a otras personas, comentarios, likes, mensajes, clubes de lectura, recomendaciones sociales, listas colaborativas ni actividad compartida. Multiusuario define la identidad, el aislamiento y la autorización; no convierte el MVP en una red social.

Desde la primera migración:

- Toda entidad personal tendrá propietario directo o una ruta inequívoca hasta `users.id`; las preferencias de cuenta también pertenecerán a ese usuario.
- Toda lectura/escritura comprobará la pertenencia en el servidor; ocultar elementos en la interfaz no constituye autorización.
- No se utilizará un `SINGLE_USER_ID` global ni se asumirán datos compartidos implícitamente.
- El catálogo bibliográfico podrá separar datos comunes (obra/edición) de datos personales (`user_editions`, lecturas y recuerdos).
- El alta, el inicio de sesión, el cierre de sesión y la recuperación de acceso forman parte del MVP; el registro y la recuperación tendrán controles de abuso y verificación adecuados.
- No se añadirá infraestructura distribuida ni microservicios “por si acaso”: se conservará un monolito modular que pueda escalar horizontalmente cuando haya demanda real.

## 2.4 Criterio de validación del MVP

La versión está validada cuando la usuaria puede completar sin ayuda este ciclo: añadir edición → iniciar lectura → actualizar progreso y guardar citas → terminar sin campos reflexivos obligatorios → localizarla en Biblioteca → verla como cromo en Mi álbum y abrir su sesión → exportar sus datos.

---

# Fase 3. Arquitectura de información

## 3.1 Revisión y agrupación de páginas

| Idea inicial | Decisión | Motivo |
|---|---|---|
| Inicio/dashboard | Mantener | Resume lo importante y activa tareas rápidas |
| Biblioteca completa + lecturas actuales + historial | Agrupar en **Biblioteca** con vistas/filtros | Evita tres destinos que muestran los mismos objetos |
| Pendientes por leer | Añadir una vista exploratoria por estanterías dinámicas de género dentro de **Biblioteca > Pendientes** | Ayuda a decidir “¿Qué me apetece leer ahora?” sin sustituir las herramientas de gestión |
| Vista temporal mensual + anual | Unificar en **Mi álbum**: año como álbum, mes como capítulo y sesión terminada como cromo | Evita duplicar las mismas lecturas en destinos paralelos y convierte el diario visual en una experiencia coherente |
| Estadísticas | Mantener; básica en MVP | Necesita espacio propio al crecer |
| Retos | V2, destino propio | No es imprescindible para registrar lecturas |
| Colecciones | Integrar dentro de Biblioteca en V2 | Son una forma de organizar libros, no un mundo aparte |
| Autores y sagas | Páginas contextuales en V2, no navegación principal | Se accede desde libros o filtros |
| Perfil lector | Combinar con Configuración | Las preferencias y los datos de cuenta pertenecen a cada usuario |
| Añadir/editar | Flujo modal/página dedicado | Acción, no destino persistente |
| Página de libro | Mantener | Núcleo de recuerdos e historial |

Nueva página útil: **Importar y exportar**, dentro de Configuración, para control de datos y copias.

## 3.2 Mapa del sitio

```text
Acceso
└── Iniciar sesión / recuperar acceso

Aplicación
├── Inicio
│   ├── Continuar lectura
│   └── Añadir libro
├── Biblioteca
│   ├── Todo
│   ├── Leyendo
│   ├── Pendientes
│   │   ├── Explorar por estanterías de género
│   │   └── Vista completa de un género
│   ├── Leídos
│   ├── Abandonados
│   ├── Ficha de libro/edición
│   │   ├── Resumen
│   │   ├── Lecturas
│   │   └── Notas y citas
│   └── Añadir / editar
├── Mi álbum
│   ├── Año
│   │   ├── Índice de meses
│   │   ├── Mes
│   │   │   ├── Resumen mensual
│   │   │   ├── Página lógica
│   │   │   └── Lectura / cromo
│   │   └── Mi [año]
│   └── Calendario (V2)
├── Estadísticas
│   ├── Resumen (MVP mínimo)
│   └── Explorador (V2)
├── Retos (V2)
└── Configuración
    ├── Perfil y preferencias
    ├── Apariencia
    ├── Datos y privacidad
    └── Importar / exportar
```

## 3.3 Navegación

**Escritorio:** barra lateral con Inicio, Biblioteca, Mi álbum y Estadísticas; botón destacado “Añadir”; Configuración al pie. Retos se incorpora en V2.

**Móvil:** barra inferior con Inicio, Biblioteca, botón central Añadir, Mi álbum y Más. “Más” contiene Estadísticas y Configuración. La etiqueta acompaña siempre al icono.

**Secundaria:** `Todos`, `Leyendo`, `Pendientes`, `Leídos` y `Abandonados` funcionan principalmente como filtros o vistas de una Biblioteca unificada; pestañas dentro de la ficha; selector de año, índice de meses y navegación de páginas en Mi álbum; filtros en panel lateral (escritorio) o panel inferior (móvil). Dentro de `Pendientes`, cada estantería de género incluye “Ver todos”, que abre Biblioteca filtrada por estado pendiente y ese género.

La separación de destinos es: **Biblioteca** para gestionar y decidir qué leer; **Mi álbum** para recordar y disfrutar la historia de lectura; **Estadísticas** para analizar hábitos lectores. Foaie continúa siendo “Tu diario visual de lectura”, pero Diario no existe como destino independiente: Mi álbum es su representación visual.

## 3.4 Relaciones principales

- Una portada del dashboard abre la ficha del libro.
- “Actualizar progreso” abre una acción compacta, no el formulario completo.
- Una cifra del dashboard abre la vista ya filtrada que la explica.
- Un autor, saga, género o etiqueta abre Biblioteca con ese filtro.
- Una estantería de género permite explorar pendientes y “Ver todos” abre la cuadrícula o lista de Biblioteca filtrada por `Pendientes + género`.
- Un cromo de Mi álbum abre la sesión de lectura concreta y conserva año, mes y página como contexto de retorno.
- Un resumen mensual o anual enlaza a Estadísticas cuando se necesita ampliar el análisis, reutilizando las mismas reglas de cálculo.

## 3.5 Recorrido habitual

```text
Inicio → Añadir → Buscar/importar o manual → Revisar datos mínimos
→ Guardar como pendiente o iniciar lectura → Inicio
→ Actualizar progreso → Terminar → Valorar/reseñar
→ Mi álbum → capítulo mensual → cromo → sesión e historial
```

---

# Fase 4. Diseño de pantallas

## 4.1 Patrón común de estados

Todas las pantallas de datos deben contemplar:

- **Carga:** esqueleto con la geometría final; no spinner como único contenido.
- **Vacío inicial:** explicación amable + una acción primaria.
- **Sin resultados:** conservar filtros, explicar que no hay coincidencias y ofrecer limpiarlos.
- **Error recuperable:** texto concreto, botón “Reintentar” y datos ya introducidos intactos.
- **Error de conexión:** indicar si el último cambio no se guardó.
- **Éxito:** confirmación breve mediante toast y cambio visible en pantalla.

## 4.2 Inicio / dashboard

**Objetivo:** mostrar qué hacer ahora y ofrecer una lectura rápida del periodo actual.

**Información:** lecturas activas, último libro terminado, objetivo anual, libros/páginas/minutos de audio del mes y del año, media, mini gráfico mensual y distribuciones simples.

**Componentes:** `CurrentReadingHero`, `QuickAddButton`, `StatisticCard`, `AnnualGoal`, `MonthlyChart`, lista de terminados recientes.

**Acciones:** actualizar progreso, terminar/abandonar, añadir libro, abrir mes, abrir biblioteca filtrada.

**Vacío:** una portada ilustrada/placeholder, mensaje “Tu diario empieza con un libro” y botones “Buscar libro” / “Añadir manualmente”. No mostrar doce tarjetas con ceros.

**Error:** si falla solo una estadística, esa tarjeta ofrece reintento sin inutilizar el resto.

**Móvil:** una lectura activa protagonista; carrusel horizontal accesible si hay varias; cifras en cuadrícula 2×2; gráficos simplificados.

**Escritorio:** lectura actual ocupa 2/3 del primer bloque; objetivo 1/3; rejilla de métricas y gráficos debajo. Máximo 12 módulos visibles.

## 4.3 Biblioteca

**Objetivo:** explorar y localizar rápidamente todas las ediciones.

La Biblioteca es un destino unificado. `Todos`, `Leyendo`, `Pendientes`, `Leídos` y `Abandonados` son principalmente filtros o vistas sobre el mismo conjunto, no carruseles independientes. La separación de responsabilidades es:

```text
Estados → acceder y filtrar
Estanterías → descubrir qué leer
Cuadrícula/lista → consultar y gestionar
```

La vista `Pendientes` añade una experiencia exploratoria orientada a responder **“¿Qué me apetece leer ahora?”**. Organiza automáticamente los libros pendientes en estanterías horizontales según su género principal; solo muestra géneros que tengan pendientes y evita duplicar una edición en varias estanterías. Los géneros secundarios continúan disponibles como filtros. Los libros sin género aparecen en una estantería final `Sin género`, de modo que ninguno quede oculto.

Cada estantería prioriza las portadas y ofrece “Ver todos”, que abre la vista completa de Biblioteca filtrada por `Pendientes + género`, donde se mantienen cuadrícula/lista, búsqueda, ordenación y filtros para consultar y gestionar. Las estanterías son agrupaciones automáticas, no colecciones personalizadas.

**Información:** portada, título, autor, estado, valoración, progreso y formato; metadatos adicionales en lista.

**Componentes:** buscador persistente, filtros de estado, botón de filtros con contador, ordenación, conmutador cuadrícula/lista, `BookCard`, `PendingGenreShelves`, `GenreShelf`, `HorizontalBookRail`, paginación o carga incremental.

**Acciones:** abrir ficha, actualizar progreso desde menú contextual, editar, iniciar/releer y eliminar con confirmación.

**Vacío inicial:** llamada a añadir/importar. **Sin resultados:** resumen de filtros como chips y “Limpiar filtros”.

**Móvil:** cuadrícula de 2 columnas; estanterías desplazables horizontalmente con el dedo desde 320 px; filtros como bottom sheet a pantalla casi completa; controles importantes no dependen de hover.

**Escritorio:** 5–7 columnas según ancho; estanterías operables con trackpad, ratón y teclado, con botones anterior/siguiente cuando sean necesarios; filtros laterales opcionales; densidad cómoda; vista lista sin tabla pesada.

La referencia a una biblioteca física será sutil, editorial y contemporánea: una línea, borde, sombra baja o cambio leve de superficie puede sugerir una balda, sin madera, texturas ni skeuomorfismo. La interfaz permanece neutra para que las portadas sean la principal fuente de color. No hay autoplay, bucle infinito ni desplazamiento circular; los extremos y la posición dentro de la colección deben resultar comprensibles.

## 4.4 Ficha de libro

**Objetivo:** reunir la edición y todos los recuerdos asociados.

**Información:** portada grande; título/autor; edición; estado actual; progreso; valoración; reseña; historial de lecturas; citas/notas; recuerdo reflexivo de cada sesión; saga, géneros y etiquetas.

**Componentes:** cabecera visual con color derivado de portada (con contraste verificado), `BookCover`, estado, CTA contextual, pestañas Resumen/Lecturas/Recuerdos, cronología.

En el detalle de una sesión terminada, la portada puede aportar una capa cromática contextual para sugerir que la persona entra en el recuerdo visual de esa lectura. Esta capa se limita a superficies secundarias, cita destacada, bordes, pequeños acentos y elementos decorativos. No transforma el tema completo ni modifica tipografía, estructura, navegación principal, controles críticos, estados semánticos o foco. Si no existe un color válido, la pantalla usa íntegramente la paleta estable de Foaie.

**Acciones:** iniciar/releer, actualizar, terminar, editar ficha, añadir nota/cita, marcar favorito, eliminar.

**Vacíos parciales:** “Todavía no has guardado citas” + “Añadir cita” y “Aún no has escrito qué te dejó esta lectura” + una acción opcional; no ocultar la sección sin explicación ni presionar para completarla.

**Móvil:** portada centrada, datos esenciales debajo, CTA fija inferior; pestañas desplazables; metadatos en acordeón.

**Escritorio:** cabecera en dos columnas; portada fija al desplazarse solo si no tapa contenido; cuerpo con columna principal y panel de metadatos.

## 4.5 Añadir / editar libro

**Objetivo:** registrar con el menor esfuerzo y permitir precisión cuando se necesite.

**Flujo:** (1) Buscar por título/autor/ISBN o elegir manual; (2) seleccionar resultado; (3) revisar datos esenciales; (4) opcionalmente completar detalles/estado; (5) guardar.

**Secciones:** Esencial (título, autor, formato, portada), Edición (ISBN, editorial, idioma, año, páginas/duración), Organización (género, saga, etiquetas), Estado inicial.

**Acciones:** guardar borrador/ficha, guardar e iniciar lectura, cancelar con aviso si hay cambios.

**Validaciones:** mensajes junto al campo; resumen al inicio solo al enviar; foco al primer error; ISBN normalizado y no duplicado por edición.

**Carga de API:** resultados con skeleton; si tarda o falla, entrada manual disponible de inmediato.

**Móvil:** una columna, secciones plegables tras “Esencial”, teclado apropiado y CTA fija sin cubrir campos.

**Escritorio:** formulario de máximo 720 px; portada/preview lateral; nunca más de dos columnas de campos.

## 4.6 Actualizar progreso

**Objetivo:** completar la acción más frecuente en segundos.

Panel compacto con valor actual, nuevo valor, unidad y botones rápidos (+10 páginas, +15 min, 25/50/75/100 %). Permite fecha del registro y nota opcional. Al llegar al total, pregunta si se desea terminar, sin hacerlo automáticamente.

## 4.7 Finalizar o abandonar

Finalizar una lectura debe seguir siendo rápido: cambiar el estado y guardar la fecha es la única acción esencial. La valoración, la reseña, la cita destacada y el recuerdo reflexivo son opcionales, se pueden omitir mediante “Ahora no” y completar o editar posteriormente. “Sin valoración” es distinto de 0 estrellas. Si se termina una relectura, se cierra la sesión actual sin sobrescribir la anterior y se genera otro cromo identificado como `Relectura`.

El flujo recomendado es: confirmar fecha y guardar la finalización → enriquecimiento opcional con valoración → elegir cita destacada si existen citas → responder una pregunta reflexiva opcional → guardar esos recuerdos y ofrecer “Ver en mi álbum”. La sesión queda terminada en el primer paso; cerrar, usar “Ahora no” o fallar después no revierte ese estado. “Otra pregunta” permite cambiar la propuesta sin convertir el cierre en un cuestionario.

Banco inicial: “¿Qué imagen se me ha quedado?”, “¿A qué me ha recordado?”, “¿Qué idea me ha molestado?” y “¿Qué pregunta me deja este libro?”. Se pueden añadir preguntas del mismo tono, por ejemplo, “¿Qué quiero conservar de esta lectura?” y “¿Qué ha cambiado en mi forma de mirar?”. La selección rota un banco pequeño y excluye, cuando sea posible, las últimas preguntas mostradas a esa persona; no necesita recomendación algorítmica. Solo se persisten la pregunta finalmente aceptada y su respuesta cuando la persona guarda el recuerdo.

Al abandonar, el flujo solicita fecha de cierre, permite motivo privado y progreso final, sin mostrar la incorporación al álbum.

## 4.8 Mi álbum

**Objetivo:** representar visualmente el diario de lectura para recordar y disfrutar lo leído sin duplicar Biblioteca ni Estadísticas.

Cada año es un álbum; los meses son capítulos; una página lógica es un fragmento del capítulo; cada `reading_session` terminada es un cromo. El álbum es una proyección de las sesiones, no una entidad independiente.

**Información:** selector de año, índice de meses, mes y página actuales, portadas, título, autor, fecha, valoración opcional, distintivo de relectura y cita destacada opcional. Cada capítulo incluye libros terminados, páginas, audio, media, favorito del mes y comparación útil con el mes anterior. `Mi [año]` cierra el álbum con libros, páginas, audio y media; en la Etapa 9 incorpora géneros, autores, libros de cinco estrellas y otras estadísticas ya aprobadas.

**Regla temporal:** una sesión pertenece al año y mes de `finished_at`, según la zona horaria de la usuaria. Se ordena por `finished_at` y un desempate estable. Una relectura genera otro cromo con sus propios datos, citas y recuerdo, identificado como `Relectura`.

**Paginación:** un mes puede ocupar una o varias páginas lógicas; nunca se asume `1 mes = 1 página`. El tamaño se decide mediante prototipos que comparen inicialmente 8, 10 y 12 cromos. Una vez elegido, la pertenencia a cada página se calcula antes del layout y permanece estable entre dispositivos. Un mes con pocas lecturas usa una composición más abierta sin crear huecos falsos; un mes vacío no genera páginas de cromos.

**Acciones:** cambiar año o mes, ir a página anterior/siguiente, abrir la sesión concreta, elegir favorito mensual y acceder a Estadísticas. La URL conserva año, mes y página. No se depende de gestos ni animaciones.

**Recuerdo:** el cromo puede mostrar una única cita destacada, si existe. El resto de citas, la pregunta y respuesta reflexivas, reseña y notas se consultan en el detalle de la sesión, bajo una sección como “Lo que me dejó”; no se crea otra ficha ni se sobrecarga la página general.

**Vacío:** “Este mes aún no tiene lecturas terminadas”; conserva el índice anual y permite ir a otro mes. Los estados loading y error mantienen la geometría, el contexto temporal y una recuperación clara.

**Móvil:** una página lógica cada vez, cuadrícula habitual de 2 columnas, resumen apilado, controles explícitos e indicador “Página n de total”. Una página puede requerir desplazamiento vertical sin cambiar su contenido lógico.

**Escritorio:** 4–6 columnas según el prototipo, índice de meses lateral o superior y resumen junto al contenido cuando haya espacio. El MVP muestra una página lógica; los spreads son posteriores.

**Evolución posterior:** animación breve de incorporación o “pegado” del cromo, paso de página, celebración al completar una página, spreads, personalización, reordenación manual y exportación visual. Son mejoras progresivas; Mi álbum funciona completamente sin ellas y respeta `prefers-reduced-motion`.

## 4.9 Estadísticas

**Objetivo:** responder preguntas, no decorar con gráficas.

**MVP:** selector de periodo; libros, páginas, audio, media; barras de lecturas por mes; formatos y géneros. Cada gráfico incluye título, definición, leyenda, alternativa tabular accesible y enlace a los registros de origen.

**V2:** valoraciones, autores, editoriales, idiomas, abandonos, relecturas, sagas, duración, comparación anual y calendario de actividad.

**Vacío:** mínimo de datos recomendado y enlace para registrar una lectura. **Error:** cada visualización falla de forma aislada.

**Móvil:** una visualización por fila; barras horizontales; leyendas bajo el gráfico; posibilidad de cambiar a lista. Evitar donuts con muchas categorías.

**Escritorio:** rejilla de 2 columnas; gráficos de detalle pueden ocupar ancho completo.

## 4.10 Retos (V2)

**Objetivo:** crear objetivos motivadores y opcionales.

**Información:** nombre, periodo, regla, meta, progreso, porcentaje, estado y contribuciones. Plantillas: libros, páginas, géneros, autores nuevos, saga, países, racha y personalizado.

**Acciones:** crear, editar, pausar, archivar, ver contribuciones. No restar progreso histórico si se edita un libro sin avisar.

**Vacío:** explica que los retos son privados y ofrece tres plantillas. **Móvil/escritorio:** tarjetas con barra y cifra textual; formulario por pasos.

## 4.11 Configuración

Preferencias de idioma, zona horaria, inicio de semana, tema, privacidad, objetivo anual, unidad de progreso, datos y cuenta. Todas se guardan por usuario. Exportación muestra fecha, alcance y formato, y solo incluye los datos de la cuenta autenticada. Eliminar cuenta exige contraseña o reautenticación, confirmación explícita y periodo de recuperación.

---

# Fase 5. Wireframes textuales

## 5.1 Dashboard — escritorio

```text
┌──────────────┬──────────────────────────────────────────────────────┐
│ LECTORIA     │ Buenos días                              [+ Añadir] │
│ Inicio ●     ├───────────────────────────────┬──────────────────────┤
│ Biblioteca   │ LEYENDO AHORA                 │ OBJETIVO 2026        │
│ Mi álbum     │ [PORTADA] Título              │ 24 / 40 libros       │
│ Estadísticas │           Autor               │ [████████░░] 60 %    │
│              │           186 / 420 páginas   │ Ver lecturas →       │
│              │           [████░░░] 44 %      │                      │
│              │           [Actualizar]        │                      │
│              ├───────────────────────────────┴──────────────────────┤
│ Configuración│ ESTE MES: 4 libros · 1.240 páginas · 7 h audio       │
│              ├───────────────────────────────┬──────────────────────┤
│              │ Lecturas por mes [barras]     │ Formatos [barras]    │
│              ├───────────────────────────────┴──────────────────────┤
│              │ TERMINADOS RECIENTEMENTE [▥] [▥] [▥] [▥]            │
└──────────────┴──────────────────────────────────────────────────────┘
```

## 5.2 Biblioteca — escritorio

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Biblioteca (128)                                      [+ Añadir]   │
│ [Buscar título o autor................] [Filtros 3] [Orden ▼] [▦≡] │
│ Todo | Leyendo | Pendiente | Terminado | Abandonado                 │
│ [Físico ×] [2026 ×] [≥4 ★ ×]                         Limpiar       │
├─────────────────────────────────────────────────────────────────────┤
│ [PORTADA] [PORTADA] [PORTADA] [PORTADA] [PORTADA] [PORTADA]        │
│ Título    Título    Título    Título    Título    Título            │
│ Autor     Autor     Autor     Autor     Autor     Autor             │
│ 4.5 ★     38 %      5 ★       Pend.     4 ★       Aband.            │
└─────────────────────────────────────────────────────────────────────┘
```

### Biblioteca — Pendientes por género

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Biblioteca                                            [+ Añadir]   │
│ Todo | Leyendo | Pendientes ● | Leídos | Abandonados               │
│                                                                     │
│ PENDIENTES POR LEER                                                 │
│                                                                     │
│ Thriller y misterio                              Ver todos →        │
│ ‹  [PORTADA] [PORTADA] [PORTADA] [PORTADA] [PORTADA]  ›            │
│ ─────────────────────────────────────────────────────────           │
│                                                                     │
│ Fantasía                                         Ver todos →        │
│ ‹  [PORTADA] [PORTADA] [PORTADA] [PORTADA] [PORTADA]  ›            │
│ ─────────────────────────────────────────────────────────           │
│                                                                     │
│ Sin género                                       Ver todos →        │
│ ‹  [PORTADA] [PORTADA] [PORTADA]                    ›              │
└─────────────────────────────────────────────────────────────────────┘
```

Las filas son listas horizontales desplazables y finitas, no carruseles tradicionales. “Ver todos” conduce a la cuadrícula o lista filtrada del género correspondiente.

## 5.3 Ficha individual

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ← Biblioteca                                      [Editar] [•••]   │
├──────────────────┬──────────────────────────────────────────────────┤
│                  │ TÍTULO DEL LIBRO                    ♥ Favorito   │
│    [PORTADA]     │ Autor · Saga #2                                  │
│                  │ Leyendo · Físico                                 │
│                  │ 186 / 420 páginas  [████░░░] 44 %                │
│                  │ [Actualizar progreso] [Terminar]                 │
│                  │                                                  │
│                  │ Resumen | Lecturas | Notas y citas               │
│                  │ Mi reseña…                                       │
│                  │ Historial: 3 ago 2026 · +24 páginas              │
│                  │ Edición: ISBN · Editorial · Idioma · 2025        │
└──────────────────┴──────────────────────────────────────────────────┘
```

## 5.4 Formulario

```text
┌──────────────────────────────────────────────────────────────┐
│ Añadir libro                                      [Cerrar]  │
│ [Buscar por título, autor o ISBN................] [Buscar]  │
│ o [Añadir manualmente]                                      │
├──────────────────────────────────────────────────────────────┤
│ [PORTADA]  ESENCIAL                                         │
│            Título * [.................................]      │
│            Autor *  [.................................]      │
│            Formato * (Físico) (Ebook) (Audiolibro)          │
│                                                              │
│ ▸ Datos de edición   ▸ Organización   ▸ Estado inicial      │
├──────────────────────────────────────────────────────────────┤
│                         [Cancelar] [Guardar] [Guardar e iniciar]│
└──────────────────────────────────────────────────────────────┘
```

## 5.5 Mi álbum — año, mes y página

```text
┌────────────────────────────────────────────────────────────────────┐
│ Mi álbum                         [‹ 2025]  2026  [2027 ›]          │
│ Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic   [Mi 2026]       │
├────────────────────────────────────────┬───────────────────────────┤
│ JULIO · PÁGINA 1 DE 2                  │ RESUMEN DE JULIO          │
│                                        │ 10 libros · 1.842 páginas │
│ [CROMO] [CROMO] [CROMO] [CROMO]       │ 11 h 20 min · 4,3 ★      │
│ [CROMO] [CROMO] [CROMO] [CROMO]       │ Favorito: [PORTADA]       │
│                                        │ vs junio: +2 libros       │
│ [Página anterior] [Página siguiente]   │                           │
└────────────────────────────────────────┴───────────────────────────┘
```

Cada cromo representa una sesión terminada y puede incluir portada, título, autor, fecha, valoración, `Relectura` y una cita destacada opcional. El número lógico de cromos por página se decidirá tras comparar prototipos de 8, 10 y 12; no cambia según el viewport.

## 5.6 Estadísticas

```text
┌───────────────────────────────────────────────────────────────────┐
│ Estadísticas                         [2026 ▼] [Año completo ▼]   │
│ [24 libros] [7.430 páginas] [41 h audio] [4,2 ★]                │
├──────────────────────────────────┬────────────────────────────────┤
│ LECTURAS POR MES                 │ FORMATOS                       │
│ [gráfico de barras]              │ Físico  ███████ 55 %           │
│                                  │ Ebook   ████    30 %           │
├──────────────────────────────────┼────────────────────────────────┤
│ GÉNEROS                          │ VALORACIONES (V2)              │
│ [barras horizontales]            │ [distribución]                 │
└──────────────────────────────────┴────────────────────────────────┘
```

## 5.7 Retos

```text
┌───────────────────────────────────────────────────────────────────┐
│ Retos 2026                                         [+ Crear reto]│
│ ACTIVOS                                                          │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Leer 40 libros                 24 / 40      [██████░░░░] 60 %│ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Descubrir 8 autores nuevos      5 / 8       [██████░░░░] 63 %│ │
│ └───────────────────────────────────────────────────────────────┘ │
│ Completados (3) | Archivados (1)                                │
└───────────────────────────────────────────────────────────────────┘
```

---

# Fase 6. Sistema de diseño

## 6.1 Dirección visual

Editorial contemporánea: fondos tranquilos, tipografía muy legible, portadas saturadas como fuente principal de color y animación discreta. La UI no compite con las cubiertas.

Mi álbum traduce la metáfora de hoja, página y huella a una composición editorial: cromos con portada protagonista, capítulos mensuales y páginas con ritmo y espacio en blanco. Puede sugerir un álbum físico mediante márgenes, capas, líneas y cambios sutiles de superficie, sin texturas realistas, adhesivos infantiles ni skeuomorfismo excesivo. La cita destacada aporta una huella personal breve; preguntas y respuestas completas permanecen en el detalle para conservar una vista general limpia.

### Color contextual en el detalle del cromo

La identidad global de Foaie permanece estable. Al abrir el detalle de un cromo o `reading_session` terminada, una capa contextual opcional puede usar colores inspirados en su portada para reforzar la sensación de entrar en el pequeño mundo o recuerdo de ese libro. No es un tema completo por lectura y no se aplica a la aplicación, Biblioteca, Mi álbum ni navegación global.

Puede afectar de forma controlada a fondos o superficies secundarios, la sección de cita destacada, bordes, pequeños acentos y elementos decorativos o secundarios. Permanecen siempre definidos por los tokens base de Foaie: tipografía, fondo general, texto principal, estructura, navegación, error, éxito, aviso, foco visible y controles críticos.

**MVP:** la interfaz y sus tokens semánticos quedan preparados para aceptar valores contextuales con fallback a la paleta normal. Los prototipos pueden usar valores mock o manuales previamente validados; no se añade extracción automática ni una dependencia técnica de las portadas.

**Evolución:** se extraen varios colores candidatos de la portada y se elige uno cromáticamente útil, no necesariamente el dominante. Antes de exponerlo a la interfaz se normalizan luminosidad y saturación, se generan variantes para temas claro y oscuro, acento/hover/superficie suave/borde y texto compatible, y se valida cada combinación. Si ninguna opción cumple, se conserva el fallback de Foaie.

La jerarquía visual es `paleta base de Foaie → tema claro/oscuro → color contextual validado del detalle → elementos secundarios que optan por usarlo`. Ningún componente hereda el color contextual de manera indiscriminada.

## 6.2 Paleta clara

| Token | Color | Uso |
|---|---:|---|
| `canvas` | `#F9F6F1` | Fondo general marfil cálido |
| `surface` | `#FFFFFC` | Tarjetas, menús y formularios |
| `surface-subtle` | `#F3E9E2` | Fondos secundarios y skeleton |
| `text` | `#352522` | Texto principal, derivado de la tinta del wordmark |
| `text-muted` | `#6B5B56` | Metadatos y texto secundario |
| `border` | `#D8C8C0` | Divisores decorativos suaves |
| `border-strong` | `#8D776F` | Límites necesarios para reconocer controles |
| `brand-terracotta` | `#CF6545` | Plano principal del símbolo; decoración |
| `brand-blush` | `#E6ADA2` | Plano claro del símbolo; decoración |
| `action` | `#A5452E` | CTA y enlaces que necesitan contraste |
| `action-hover` | `#843522` | Hover del primario |
| `action-soft` | `#F6DED7` | Selecciones y fondos de marca suaves |
| `on-action` | `#FFFFFC` | Texto sobre acciones principales |
| `success` | `#267057` | Confirmaciones y objetivo alcanzado |
| `warning` | `#8A4B12` | Avisos y lectura abandonada contextual |
| `danger` | `#A63D3D` | Eliminación y errores |
| `focus` | `#175CD3` | Anillo de foco estable e independiente de marca |
| `rating` | `#9A570F` | Estrellas con contraste; no depender solo del color |

Los colores del símbolo no se usan automáticamente como texto o fondo de controles: `action` es una adaptación accesible del terracota. No usar la marca para todo; las portadas aportan la variedad principal. Éxito, aviso y error mantienen significado constante.

## 6.3 Paleta oscura

| Token | Color | Uso |
|---|---:|---|
| `canvas` | `#181210` | Fondo general tinta cálida |
| `surface` | `#221A17` | Tarjetas y formularios |
| `surface-subtle` | `#30231F` | Campos y skeleton |
| `text` | `#F8F1EA` | Texto principal |
| `text-muted` | `#C6B6AF` | Metadatos |
| `border` | `#4B3933` | Divisores decorativos |
| `border-strong` | `#8C756D` | Límites de controles |
| `brand-terracotta` | `#E47C5C` | Adaptación oscura del plano principal |
| `brand-blush` | `#DCA094` | Adaptación oscura del plano claro |
| `action` | `#E98767` | Acciones principales y enlaces |
| `action-hover` | `#F09B7E` | Hover |
| `action-soft` | `#46241C` | Selección y fondos de marca suaves |
| `on-action` | `#2B1712` | Texto sobre acciones principales |
| `success` | `#73C7A3` | Éxito |
| `warning` | `#F0B56A` | Aviso |
| `danger` | `#FF9A9A` | Error |
| `focus` | `#8AB4FF` | Foco estable |
| `rating` | `#F2B35F` | Estrellas |

## 6.4 Tipografía

- **Interfaz funcional:** pila sans-serif del sistema para navegación, botones, formularios, metadatos, cifras pequeñas y texto de interfaz: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. No se carga por ahora una segunda fuente web.
- **Marca/editorial:** Lora es la serif oficial del wordmark y de los títulos editoriales. Su fuente variable se aloja en el proyecto bajo la SIL Open Font License 1.1, se integra mediante `next/font/local`, se expone a través de una variable CSS y conserva `Georgia, "Times New Roman", serif` únicamente como fallback técnico. Puede emplearse en citas destacadas cuando exista su componente específico, pero no se aplica indiscriminadamente a la interfaz funcional.

Escala: 12 px metadato auxiliar; 14 px secundario; 16 px cuerpo y controles; 20 px subtítulo; 24 px título de sección; 32/40 px título de página; 48 px solo para portada mensual en escritorio. Interlineado 1,4–1,6. Nunca texto funcional por debajo de 14 px.

## 6.5 Espaciado, forma y elevación

- Base de 4 px; escala: 4, 8, 12, 16, 24, 32, 48, 64.
- Radio: 8 px campos, 12 px botones/tarjetas, 16 px paneles protagonistas, cápsula solo para chips.
- Bordes de 1 px; 2 px para selección/foco.
- Sombra baja `0 1px 2px rgba(32,29,27,.08)`; elevada `0 8px 24px rgba(32,29,27,.14)` solo para menús/modales.

## 6.6 Elementos

- **Botón primario:** fondo brand, texto contrastado, altura 44 px mínimo.
- **Secundario:** superficie + borde; **terciario:** texto/icono sin caja.
- **Destructivo:** danger, reservado para confirmación final.
- **Tarjetas de libro:** relación de portada original; título máximo dos líneas; metadatos una línea; foco/selección visibles.
- **Formularios:** etiqueta siempre visible; ayuda antes del error; opcional indicado; no usar placeholder como etiqueta.
- **Chips:** filtros/etiquetas; incluyen texto y botón de quitar con nombre accesible.
- **Iconos:** trazo consistente de 20/24 px; nunca como único indicador de estado sin nombre accesible.
- **Gráficos:** paleta secuencial y categórica apta para daltonismo; etiquetas directas; patrones o texto cuando sea necesario.

## 6.7 Estados interactivos

Todos los controles tienen default, hover, active, focus-visible, disabled, loading y error cuando corresponda. Movimiento entre 120–220 ms; respetar `prefers-reduced-motion`. Elevación de portadas máxima 4 px en hover; nada se mueve al recibir foco.

---

# Fase 7. Componentes reutilizables

| Componente | Función / datos de entrada | Uso | Variantes |
|---|---|---|---|
| `AppShell` | Navegación, usuario, contenido | Toda la app | desktop, mobile |
| `BookCover` | URL, título, autor, tamaños, prioridad | Todas las vistas | xs–hero, placeholder, seleccionable |
| `BookCard` | Edición, estado, progreso, rating | Biblioteca, recientes, mes | grid, list, compact, selectable |
| `ReadingAlbum` | Año, capítulos mensuales, páginas y resúmenes | Mi álbum | loading, empty, error |
| `AlbumYearPicker` | Año disponible y selección | Mi álbum | compact, full |
| `AlbumMonthIndex` | Meses, actividad y destino | Mi álbum | horizontal, sidebar |
| `AlbumPageNavigation` | Página actual, total y destinos | Mi álbum | compact, full |
| `AlbumPage` | Sesiones de un mes y página lógica | Mi álbum | sparse, regular |
| `ReadingSticker` | Sesión terminada, edición, cita destacada | Mi álbum | standard, reread, without-quote |
| `ReadingReflection` | Pregunta, respuesta y edición posterior | Cierre/detalle de sesión | prompt, read-only, edit |
| `PendingGenreShelves` | Estanterías derivadas de pendientes agrupados por género principal | Biblioteca > Pendientes | loading, empty, error |
| `GenreShelf` | Género, selección de libros, total y enlace filtrado | Exploración de pendientes | genre, uncategorized |
| `HorizontalBookRail` | Lista finita de libros y controles de desplazamiento | Estanterías de género | touch, controls cuando sean necesarios |
| `RatingStars` | Valor, máximo, paso 0,5, editable | Ficha, formulario, mes | input, read-only, compact |
| `ReadingProgress` | actual, total, unidad, porcentaje | Inicio, ficha, reto | lineal, circular, compacta |
| `CurrentReadingHero` | lectura activa + edición | Inicio | single, carousel |
| `StatisticCard` | etiqueta, valor, periodo, tendencia | Inicio/estadísticas | neutral, positive, warning |
| `MonthlyChart` | serie por mes, unidad, enlaces | Inicio/estadísticas | bars, compact |
| `CategoryChart` | categorías, valores, total | Estadísticas | horizontal bars, donut ≤5 categorías |
| `AnnualGoal` | meta, progreso, año | Inicio | compact, detailed |
| `CollectionCard` | nombre, portadas, cantidad | V2 Biblioteca | collage, simple |
| `FilterPanel` | definición, valores, selección | Biblioteca | sidebar, bottom-sheet |
| `FilterChip` | etiqueta, valor, quitar | Biblioteca | removable, static |
| `SearchBar` | valor, scope, loading | Biblioteca/formulario | instant, submit |
| `BookForm` | valores, errores, modo | Añadir/editar | manual, imported-review |
| `ProgressUpdate` | lectura, valor, fecha | Inicio/ficha | dialog, bottom-sheet |
| `ReadingTimeline` | lecturas y eventos | Ficha | compact, full |
| `QuoteCard` | texto, página/tiempo, nota | Ficha | plain, highlighted |
| `EmptyState` | icono/imagen, título, acción | Todas | first-use, no-results, error |
| `LoadingSkeleton` | forma y cantidad | Todas | cover, card, chart, form |
| `ConfirmDialog` | título, consecuencias, confirmación | Eliminar/abandonar | standard, destructive |
| `ToastNotification` | tipo, mensaje, acción | Global | success, error, undo |
| `PeriodPicker` | periodo, límites | Mi álbum/estadísticas | month, year, range V2 |
| `AccessibleChart` | datos, etiquetas, descripción | Estadísticas | chart + table toggle |

### Contratos importantes

- `rating: number | null`; `null` significa sin valorar y `0` una valoración explícita solo si se decide conservar esa posibilidad.
- El progreso recibe unidad (`PAGES`, `PERCENT`, `MINUTES`) y no deduce conversiones.
- Toda portada requiere `alt`; en contexto redundante puede usar `alt=""` para no repetir título adyacente.
- Componentes de datos admiten `loading`, `empty` y `error`, evitando que cada pantalla reinvente esos estados.
- La composición futura será `PendingGenreShelves → GenreShelf → HorizontalBookRail → BookCover / BookCard`. `HorizontalBookRail` es una lista horizontal desplazable con semántica de lista, no un carrusel tradicional: no tiene autoplay, bucle infinito ni una diapositiva activa obligatoria.
- La composición de Mi álbum será `ReadingAlbum → AlbumMonthIndex → AlbumPage → ReadingSticker`, acompañada por `AlbumYearPicker` y `AlbumPageNavigation`. El cromo recibe una sesión terminada; no representa una obra ni crea una copia persistente del libro.
- Los componentes de resumen mensual, anual, Dashboard y Estadísticas consumen las mismas funciones de cálculo y definiciones; solo cambia su presentación.

---

# Fase 8. Modelo de datos

## 8.1 Decisiones

- PostgreSQL por integridad, relaciones y consultas analíticas.
- UUID como claves públicas.
- Fechas de evento como `timestamptz`; fechas de lectura que solo representan día como `date`.
- Guardar duración en **minutos**, no texto.
- Guardar progreso como eventos y un valor actual derivado/cacheado en la lectura.
- `created_at`, `updated_at` y, cuando proceda, `deleted_at` en entidades principales.
- Las APIs externas enriquecen datos; nunca son la fuente única. Se conserva proveedor + ID + fecha de sincronización.

## 8.2 Principios de arquitectura escalable sin sobrearquitectura

Foaie comenzará como un **monolito modular**: una aplicación Next.js y una base PostgreSQL gestionada. Este enfoque reduce operaciones y aprendizaje inicial, pero mantiene fronteras internas claras entre identidad, catálogo, biblioteca, lecturas, estadísticas, integraciones y exportación. Escalar no significa comenzar con microservicios; significa evitar acoplamientos que hagan imposible separarlos si algún día fuera necesario.

### Autenticación

- Un proveedor/librería mantenida gestionará registro, inicio y cierre de sesión, recuperación de acceso y sesiones seguras; no se diseñará criptografía propia.
- El MVP permite múltiples cuentas. Cada persona solo puede acceder a sus propios datos y no existe ningún flujo social o de descubrimiento entre cuentas.
- Las sesiones usarán cookies `HttpOnly`, `Secure` y `SameSite` apropiado, expiración y rotación según el sistema elegido.
- La identidad interna será siempre `users.id`, no el correo, para permitir cambios de dirección o distintos proveedores futuros.
- El modelo podrá incorporar OAuth, MFA y gestión avanzada de dispositivos sin alterar las entidades de lectura.

### Usuarios, permisos y aislamiento

- Cada cuenta solo accede a sus libros incorporados, lecturas, progreso, valoraciones, notas, citas, etiquetas, colecciones, retos, estadísticas, exportaciones y configuración.
- Las operaciones del servidor obtendrán `user_id` de la sesión autenticada; nunca confiarán en un `user_id` enviado por el navegador.
- Consultas y mutaciones filtrarán simultáneamente por ID del recurso y propietario.
- El MVP necesita los roles `USER` y `ADMIN` solo si existe una necesidad operativa real; no se construirá un sistema complejo de permisos. El rol nunca sustituye la comprobación de propiedad.
- Se crearán pruebas negativas: una cuenta A no puede leer ni modificar recursos de una cuenta B, aunque conozca su UUID.
- PostgreSQL Row-Level Security puede incorporarse como defensa adicional si el proveedor y la capa de acceso elegidos la integran bien; no reemplaza las comprobaciones de aplicación.

### Base de datos y crecimiento

- PostgreSQL gestionado con migraciones versionadas, claves foráneas, restricciones e índices guiados por consultas reales.
- `user_id` se incluye desde el inicio en entidades personales e índices compuestos frecuentes, por ejemplo (`user_id`, `status`) o (`user_id`, `finished_at`).
- Los UUID evitan identificadores públicos secuenciales, pero no son una barrera de autorización.
- Las estadísticas se calcularán inicialmente con SQL/consultas agregadas, siempre filtradas por el `user_id` de la sesión y por el periodo solicitado. Cuando el volumen lo justifique, podrán añadirse cachés, vistas materializadas o trabajos asíncronos sin cambiar la fuente de verdad ni mezclar cuentas.
- Migraciones compatibles y revisables; los cambios destructivos requieren copia, estrategia de transición y rollback documentado.
- Evitar JSON para relaciones esenciales. `jsonb` se reserva a reglas flexibles o payloads externos.

### Almacenamiento de imágenes

- Las portadas subidas se guardan en almacenamiento de objetos, no en el disco efímero del servidor ni como blobs de la base.
- Las rutas usan IDs opacos, prefijos por entorno y, cuando proceda, un ámbito de propietario; no incluyen correos ni datos personales.
- Se validan tipo real, tamaño y dimensiones; se generan variantes optimizadas y se sirven mediante CDN.
- Las cargas usan URLs firmadas o un endpoint autenticado y limitado; el servidor comprueba que la cuenta autenticada puede crear, leer, reemplazar o eliminar cada archivo.
- Al eliminar/reemplazar una portada se emplea una estrategia de limpieza recuperable/asíncrona para evitar registros rotos.
- Las portadas externas se muestran o copian únicamente conforme a los términos del proveedor.

### Rendimiento y escalabilidad

- Renderizado y obtención de datos apropiados por pantalla; evitar descargar bibliotecas completas al cliente.
- Paginación basada en cursor cuando el volumen crezca; búsquedas e índices medidos con datos representativos.
- Optimización de imágenes, tamaños responsive, lazy loading y CDN.
- Caché solo donde la privacidad y la invalidación estén claras; las claves deben incluir el usuario cuando la respuesta sea personal y nunca se compartirán respuestas entre usuarios.
- Endpoints sin estado local para permitir varias instancias en el futuro.
- Rate limiting en autenticación, búsqueda externa, exportación y subidas.
- Observabilidad gradual: errores, latencia y métricas técnicas sin registrar reseñas, notas, citas, tokens ni credenciales.

### Seguridad

- Validación en servidor, consultas parametrizadas mediante ORM y codificación segura de salida.
- Protección CSRF según el patrón de autenticación, cabeceras de seguridad y política CSP compatible con portadas externas.
- Secretos únicamente en el gestor del entorno; `.env.example` contiene nombres y valores ficticios.
- Dependencias revisadas y actualizadas de forma controlada.
- Eliminación de cuenta, cambios sensibles y exportación completa requieren reautenticación cuando el riesgo lo justifique; una exportación nunca puede incluir datos de otra cuenta.
- Política de privacidad y retención antes de abrir el registro a terceros.

### Copias de seguridad y recuperación

- Base gestionada con backups automáticos; confirmar frecuencia, retención y restauración del proveedor.
- Antes de cambios de esquema delicados, crear punto de recuperación y probar el procedimiento en un entorno no productivo.
- El almacenamiento de objetos necesita versionado o retención acorde al riesgo.
- La exportación personal no sustituye el backup operativo.
- Definir objetivos RPO/RTO antes de admitir usuarios externos y realizar restauraciones de prueba periódicas.

### Internacionalización

- Español como idioma inicial, pero interfaz preparada con claves de traducción desde el comienzo o antes de abrirla públicamente.
- No concatenar frases; usar `Intl` para fechas, números y plurales.
- Guardar zona horaria, locale e idioma por usuario.
- Códigos BCP 47/ISO para idiomas y países; texto Unicode en toda la cadena.
- Diseño preparado para textos más largos y futura dirección RTL, aunque no se implemente en el MVP.
- Rumano e inglés son candidatos naturales posteriores por identidad y alcance.

### SEO y contenido público

- El área privada no se indexa: metadatos `noindex`, protección por autenticación y ninguna información personal en HTML público o sitemap.
- El MVP puede tener una landing mínima indexable con nombre, descriptor y propósito, separada de la aplicación; ninguna cuenta ni actividad personal será pública.
- Nombre, descriptor, título, plantilla de metadatos, Open Graph, favicon y logos se obtienen de la configuración central de marca.
- Perfiles y reseñas futuras serán privadas por defecto y solo indexables mediante consentimiento explícito, URLs estables y controles para volver a ocultarlas.
- SEO no justifica generar páginas públicas con datos privados.

### Despliegue y entornos

- Entornos separados de desarrollo, preview/staging y producción, con bases y credenciales distintas.
- Despliegues reproducibles desde GitHub mediante CI; `main` representa el estado desplegable.
- Las migraciones se ejecutan de forma controlada y observable, no automáticamente desde múltiples instancias concurrentes.
- Variables validadas al arrancar y configuradas por entorno.
- Región de aplicación, base y almacenamiento cercana a las personas usuarias y coherente con requisitos de protección de datos.
- El proveedor inicial puede cambiar: no se introducirán APIs propietarias en el dominio sin un adaptador claro.

## 8.3 Tablas del núcleo

Leyenda: **PK** clave primaria, **FK** clave foránea, **NN** obligatorio.

### `users`

| Campo | Tipo aproximado | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `email` | varchar(320) | NN, unique, normalizado para identidad |
| `password_hash` | text nullable | Opcional si hay enlace mágico |
| `display_name` | varchar(80) | NN |
| `timezone` | varchar(64) | NN, `Europe/Madrid` por defecto |
| `locale` | varchar(10) | NN, `es-ES` |
| `theme` | enum | NN: SYSTEM/LIGHT/DARK |
| `role` | enum | NN: USER; ADMIN solo si se necesita |
| `status` | enum | NN: ACTIVE/SUSPENDED/DELETION_PENDING |
| `week_starts_on` | smallint | NN, 1=lunes |
| `created_at`, `updated_at` | timestamptz | NN |

### `works`

Representa la obra, independiente de edición.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `title` | varchar(300) | NN |
| `original_title` | varchar(300) | Opcional |
| `description` | text | Opcional |
| `original_publication_year` | smallint | Opcional |
| `original_language_code` | varchar(10) | Opcional |
| `created_at`, `updated_at` | timestamptz | NN |

### `authors`

`id` uuid PK; `name` varchar(200) NN; `sort_name` varchar(200); `country_code` char(2); `birth_date` date; `death_date` date; `external_ids` jsonb opcional; timestamps. País y fechas son opcionales porque suelen faltar o ser ambiguos.

### `work_authors`

`work_id` uuid FK→works NN; `author_id` uuid FK→authors NN; `role` enum AUTHOR/EDITOR/ILLUSTRATOR/OTHER NN; `position` smallint NN. PK compuesta (`work_id`,`author_id`,`role`).

### `publishers`

`id` uuid PK; `name` varchar(200) NN; `normalized_name` varchar(200) NN; timestamps. Índice/unique razonable sobre nombre normalizado.

### `series`

`id` uuid PK; `name` varchar(250) NN; `description` text opcional; timestamps.

### `work_series`

`work_id` FK; `series_id` FK; `position` numeric(6,2) opcional; `label` varchar(30) opcional. PK compuesta. `position` admite novelas 0.5 o anexos; `label` permite “Precuela”.

### `editions`

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `work_id` | uuid | FK→works, NN |
| `publisher_id` | uuid | FK→publishers, opcional |
| `edition_title` | varchar(300) | Opcional; título mostrado si difiere |
| `isbn10`, `isbn13` | varchar(13) | Opcional; normalizados; unique parcial por usuario/catálogo según alcance |
| `publication_date` | date | Opcional; admite solo año mediante campo de precisión |
| `publication_date_precision` | enum | YEAR/MONTH/DAY, opcional |
| `language_code` | varchar(10) | Opcional |
| `page_count` | integer | Opcional, >0 |
| `audio_duration_minutes` | integer | Opcional, >0 |
| `format` | enum | NN: PHYSICAL/EBOOK/AUDIOBOOK |
| `cover_url` | text | Opcional |
| `cover_storage_key` | text | Opcional |
| `source` | enum | NN: MANUAL/GOOGLE_BOOKS/OPEN_LIBRARY |
| `source_id` | varchar(100) | Opcional |
| `source_synced_at` | timestamptz | Opcional |
| `created_at`, `updated_at` | timestamptz | NN |

### `contributors`

Para traductores y narradores ligados a una edición: `id` uuid PK; `name` varchar(200) NN; timestamps.

### `edition_contributors`

`edition_id` FK; `contributor_id` FK; `role` enum TRANSLATOR/NARRATOR/EDITOR/ILLUSTRATOR/OTHER; `position` smallint. PK compuesta.

### `user_editions`

Relaciona la biblioteca personal con la edición y separa datos de propiedad de los bibliográficos.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK→users, NN |
| `edition_id` | uuid | FK→editions, NN |
| `library_status` | enum | NN: PENDING/READING/FINISHED/ABANDONED |
| `is_favorite` | boolean | NN false |
| `is_owned` | boolean | NN false (“comprado”) |
| `is_loaned` | boolean | NN false |
| `loaned_to` | varchar(120) | Opcional, privado |
| `acquired_at` | date | Opcional |
| `personal_characters` | text | Opcional en MVP; normalizable después |
| `created_at`, `updated_at` | timestamptz | NN |

Unique (`user_id`,`edition_id`). El estado se sincroniza desde la lectura abierta, pero no sustituye al historial.

### `reading_sessions`

Cada fila es una lectura o relectura.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK |
| `user_edition_id` | uuid | FK→user_editions, NN |
| `sequence_number` | smallint | NN, 1 primera lectura |
| `status` | enum | NN: PLANNED/READING/FINISHED/ABANDONED |
| `started_at`, `finished_at` | date | Opcionales según estado |
| `current_value` | integer | NN, 0 |
| `progress_unit` | enum | NN: PAGES/PERCENT/MINUTES |
| `rating` | numeric(2,1) | Opcional, 0–5, múltiplo de 0,5 |
| `review` | text | Opcional |
| `abandon_reason` | text | Opcional |
| `is_month_favorite` | boolean | NN false |
| `created_at`, `updated_at` | timestamptz | NN |

Restricciones: `finished_at >= started_at`; una sola sesión READING por `user_edition_id`; unique (`user_edition_id`,`sequence_number`). El total se toma de la edición, pero podría guardarse snapshot si se necesita preservar historia ante correcciones.

### `progress_entries`

`id` uuid PK; `reading_session_id` FK NN; `recorded_at` timestamptz NN; `value` integer NN; `unit` enum NN; `note` varchar(500) opcional; timestamps. Unique opcional por sesión/fecha/valor para evitar doble envío. Los valores deben ser no decrecientes salvo corrección explícita.

## 8.4 Organización y recuerdos

### `genres` y `work_genres`

`genres`: id, name NN, slug unique, parent_id FK opcional. `work_genres`: work_id + genre_id PK compuesta, `is_primary` boolean. En MVP se recomienda un género principal y varios secundarios.

### `tags` y `user_edition_tags`

`tags`: id, user_id FK, name NN, color_token opcional; unique (`user_id`, nombre normalizado). Unión: `user_edition_id`, `tag_id`, PK compuesta.

### `notes`

`id` uuid PK; `reading_session_id` FK NN; `content` text NN; `location_label` varchar(50) opcional (“p. 142”, “01:23:10”); `is_spoiler` boolean NN false; timestamps.

### `quotes`

Cada cita pertenece a una sesión concreta: `id` uuid PK; `reading_session_id` FK NN; `quote_text` text NN; `location_label` varchar(50) opcional; `comment` text opcional; `is_spoiler` boolean NN false; `is_featured` boolean NN false; timestamps. La persona puede crear, editar y eliminar varias citas propias durante o después de la lectura. Un índice único parcial garantiza como máximo una cita destacada por sesión. Al eliminar la destacada, la sesión queda sin cita destacada; no se copia el texto a Mi álbum.

### `reading_reflections`

Recuerdo reflexivo opcional y uno-a-uno con la sesión: `id` uuid PK; `reading_session_id` FK NN unique; `prompt_key` varchar(80) NN; `prompt_text` text NN; `response_text` text NN; timestamps. La fila solo existe cuando la persona guarda una respuesta; ausencia significa que omitió el recuerdo. Se conserva `prompt_text` como instantánea para que cambios futuros de redacción o traducción no alteren el sentido de una respuesta histórica, mientras `prompt_key` identifica la pregunta del banco.

El banco de preguntas vive en configuración/código, no en una tabla por usuario. Una rotación determinista ordena el banco a partir de la cuenta y la sesión para variar el primer resultado, excluye cuando sea posible las preguntas de recuerdos guardados recientemente y avanza localmente con “Otra pregunta”. No se persisten preguntas meramente mostradas ni posiciones derivadas. Esta estrategia reduce repeticiones sin introducir recomendaciones ni historial técnico innecesario.

Tanto `quotes` como `reading_reflections` heredan la propiedad mediante `reading_session → user_edition → user`; toda lectura y mutación comprueba esa ruta en el servidor. Una lectura de 2026 y una relectura de 2031 conservan citas y recuerdo independientes.

### `collections`, `collection_items` (V2)

Colección: id, user_id, name, description, cover_style, timestamps; unique por usuario/nombre. Elementos: collection_id + user_edition_id PK, position, added_at. Favorito/comprado/prestado siguen siendo propiedades, no colecciones duplicadas del sistema.

## 8.5 Objetivos y retos

### `goals`

`id` uuid PK; `user_id` FK; `name`; `type` enum BOOKS/PAGES/AUDIO_MINUTES/GENRES/NEW_AUTHORS/SERIES/COUNTRIES/STREAK/CUSTOM; `period_start`, `period_end`; `target_value` numeric; `rule_json` jsonb para filtros; `status` enum ACTIVE/PAUSED/COMPLETED/ARCHIVED; timestamps.

El progreso se calcula desde lecturas salvo retos personalizados manuales. `goal_progress_snapshots` puede añadirse en V2 para rendimiento/auditoría, no en MVP.

## 8.6 Integración y seguridad

- `external_mappings(entity_type, entity_id, provider, external_id, payload_hash, synced_at)` evita llenar cada tabla de columnas por proveedor.
- `export_jobs` solo si la exportación llega a ser asíncrona.
- Todas las consultas personales filtran por el `user_id` obtenido de la sesión; nunca se acepta un identificador del cliente sin comprobar pertenencia.
- Las relaciones personales usan `user_id` y restricciones de propiedad; borrar datos de una cuenta no debe afectar a otra. El borrado en cascada se limita a los recuerdos dependientes de esa cuenta o lectura, y las entidades de catálogo compartibles no deben arrastrar datos personales de otros usuarios.

## 8.7 Relaciones resumidas

```text
User 1─N UserEdition N─1 Edition N─1 Work
Work N─M Author       Work N─M Genre       Work N─M Series
Edition N─M Contributor
UserEdition 1─N ReadingSession 1─N ProgressEntry
ReadingSession 1─N Note / Quote
ReadingSession 1─0..1 ReadingReflection
UserEdition N─M Tag / Collection
User 1─N Goal
```

Mi álbum se deriva de `reading_sessions` con estado `FINISHED`; no añade `album_items`, `album_pages` ni `stickers`. Cada sesión terminada produce un cromo, incluidas las relecturas. Año y mes proceden de `finished_at`; dentro del mes se usa un orden estable por `finished_at`, `created_at` e `id`. La página lógica se calcula a partir de la posición y un tamaño global pendiente de prototipado entre 8, 10 y 12 cromos. El viewport solo cambia la cuadrícula visual, nunca la pertenencia a la página.

---

# Fase 9. Lógica de estadísticas

## 9.1 Reglas generales

- Contar **sesiones de lectura terminadas**, no ediciones únicas, salvo que la etiqueta diga “títulos únicos”.
- Periodos según `finished_at` y zona horaria del usuario.
- Páginas y audio se muestran separados; no convertir horas a páginas.
- “Sin valorar” se excluye de la media.
- Los filtros y definiciones deben aparecer junto a la cifra.
- Dashboard, Mi álbum y Estadísticas reutilizan estas funciones de cálculo; ninguna pantalla mantiene una fórmula alternativa. En la Etapa 7, `Mi [año]` usa solo libros, páginas, audio y media ya disponibles. La Etapa 9 añade géneros, autores, libros de cinco estrellas y otras estadísticas aprobadas mediante la misma capa.

| Estadística | Cálculo | Datos necesarios / excepciones |
|---|---|---|
| Libros por mes | `COUNT(reading_sessions)` con estado FINISHED, agrupado por mes de fin | `finished_at`, estado; relecturas cuentan |
| Libros por año | Igual, agrupado por año | Zona horaria/fecha de fin |
| Páginas por mes | Suma de `edition.page_count` para sesiones terminadas no-audio | Si faltan páginas, excluir e indicar “n lecturas sin páginas”; a futuro usar deltas diarios |
| Horas de audio | Suma de minutos de ediciones audio terminadas / 60 | Mostrar h/min; datos incompletos visibles |
| Media de estrellas | `AVG(rating)` donde rating no nulo | Redondear a 2 decimales en cálculo, 1 al mostrar |
| Género favorito | Mayor número de sesiones terminadas por género primario | Desempate: páginas/minutos no mezclables; mostrar empate |
| Formato favorito | Formato con más sesiones terminadas | Indicar criterio “por número de lecturas” |
| Racha | Días consecutivos con al menos una entrada de progreso o finalización | Requiere `progress_entries`; zona horaria; permitir día de gracia solo si se define explícitamente |
| Tiempo medio | Media inclusiva de `finished_at - started_at + 1` | Excluir fechas faltantes y sesiones abandonadas; mediana en V2 por valores extremos |
| Progreso de reto | `min(valor_actual/meta*100,100)`; conservar valor real aparte | Regla y periodo del reto; evitar división por cero |
| Comparación anual | `(actual-anterior)` y, si anterior >0, `%` | Si anterior=0 mostrar diferencia absoluta, no “∞ %” |
| Abandono | abandonadas / (terminadas + abandonadas) | Periodo basado en fecha de cierre; requiere `finished_at` también al abandonar o `closed_at` futuro |
| Relecturas | Sesiones terminadas con `sequence_number > 1` | No inferir por duplicar edición |
| Sagas iniciadas | Saga con ≥1 obra terminada | `work_series` + sesiones |
| Sagas completadas | Todas las obras marcadas como principales están terminadas | Difícil por sagas abiertas/incompletas; debe permitirse marcar alcance manualmente |

### Favorito mensual

Es una elección manual entre las sesiones terminadas ese mes. Restricción única por usuaria/mes. Si no se elige, no inferirlo de la mayor valoración.

### Calendario de actividad (V2)

Cuenta días con entradas de progreso, no días “supuestamente leídos” entre inicio y fin. Intensidad por cantidad de actividad dentro de su propia unidad; si se mezclan formatos, usar número de registros o una escala normalizada claramente explicada.

---

# Fase 10. Integraciones de libros

## 10.1 Comparación

| Criterio | Google Books | Open Library |
|---|---|---|
| Búsqueda | Texto, título, autor, ISBN y filtros | Búsqueda amplia de obras, ediciones, autores y materias |
| Metadatos habituales | Título, autores, editorial, fecha, ISBN, páginas, categorías, descripción, idioma, imágenes | Obras/ediciones, autores, ISBN, fechas, editoriales, idiomas, materias y portadas según registro |
| Portadas | Varias resoluciones cuando existen | Covers API por ISBN o ID |
| Identificación | API key u OAuth según datos; lectura pública de volúmenes | API pública para uso moderado |
| Ventaja | Respuesta de volumen compacta y cómoda para un MVP | Datos abiertos, separación obra/edición y buen complemento de portadas |
| Limitación | Datos/cobertura y calidad variables; ediciones duplicadas; clave/cuota y condiciones | Registros heterogéneos, campos incompletos, límites de uso responsable; no es para importación masiva vía API |

Google documenta búsqueda y lectura de volúmenes, incluida información como autores, editorial, fecha, ISBN, páginas, categorías, idioma e imágenes; las solicitudes públicas se identifican con clave o token ([Google Books API](https://developers.google.com/books/docs/v1/using)). Open Library ofrece APIs de búsqueda, obras/ediciones, autores y cubiertas, y recomienda sus volcados para usos masivos en lugar de sobrecargar la API ([Open Library APIs](https://openlibrary.org/developers/api), [Covers API](https://openlibrary.org/dev/docs/api/covers)).

## 10.2 Recomendación

Usar **Google Books como proveedor principal del MVP** por su respuesta sencilla para búsqueda/ISBN y sus imágenes; usar **Open Library como fallback** para ISBN/portada o como segunda fuente seleccionable. No fusionar silenciosamente resultados dudosos.

Flujo:

1. Normalizar consulta/ISBN.
2. Buscar en Google Books desde el servidor (la clave no se expone innecesariamente).
3. Puntuar coincidencias por ISBN exacto, título, autor, idioma y formato.
4. Mostrar 5–10 candidatos con fuente y datos esenciales.
5. La usuaria selecciona uno.
6. Copiar una instantánea editable a la base propia; no depender de la API para renderizar cada pantalla.
7. Si no hay portada o resultado adecuado, consultar Open Library.

## 10.3 Ausencias y conflictos

- “No encontrado” nunca bloquea: botón visible “Añadir manualmente”.
- Todo dato importado se puede corregir antes y después de guardar.
- Si el ISBN ya existe, mostrar la edición existente y ofrecer añadirla a la biblioteca o registrar otra edición.
- Si páginas/editorial/fecha difieren, preferir ISBN exacto y permitir decidir; conservar `source` y `source_id`.
- Portada manual: JPG/PNG/WebP, límite razonable (p. ej. 5 MB), recorte no destructivo y texto alternativo derivado del contexto.
- Audiolibros suelen tener metadatos pobres en estas APIs: duración y narrador deben ser manuales en MVP.

## 10.4 Resiliencia y privacidad

Timeout, un reintento breve, caché de búsquedas, límites por IP/usuario y mensajes independientes. No enviar notas, valoraciones ni biblioteca personal a los proveedores. Revisar términos, atribución, cuotas y política de imágenes antes de publicar.

---

# Fase 11. Accesibilidad y responsive

## 11.1 Objetivo

Cumplir **WCAG 2.2 nivel AA** como criterio de aceptación, incluidas zonas objetivo de tamaño suficiente, foco visible y alternativas a gestos/drag.

## 11.2 Teclado y foco

- Orden de tabulación coincide con el visual.
- Enlace “Saltar al contenido”.
- Todos los menús, tabs, diálogos, estrellas y filtros operables con teclado.
- Escape cierra overlays; el foco queda atrapado en modal y vuelve al disparador.
- No usar una tarjeta entera con controles anidados inválidos; enlace de título/portada y menú son objetivos separados.
- Tras guardar, foco en confirmación o encabezado pertinente; tras error, resumen anunciado.
- Las estanterías de pendientes usan secciones con encabezado y listas semánticas. Sus libros se recorren mediante enlaces y tabulación normal; los botones anterior/siguiente, si aparecen, tienen nombres accesibles, se desactivan en los extremos y nunca crean un bucle.
- Al mover una estantería mediante sus controles, el elemento enfocado permanece visible y la nueva posición conserva contexto; no se depende de gestos, hover ni arrastre como única interacción.
- Mi álbum ofrece selectores y botones nativos para año, mes y página; pasar página mediante gesto o animación nunca es la única vía. Tras navegar, el foco se mueve al encabezado de la nueva página o capítulo y se anuncia “{Mes}, página {n} de {total}” sin repetir toda la lista.
- El cromo es un elemento de lista enlazado a una sesión concreta. `Relectura`, valoración y existencia de cita destacada se comunican mediante texto accesible, no solo por posición, icono o color.

## 11.3 Semántica y lectores de pantalla

- HTML semántico: `nav`, `main`, encabezados jerárquicos, listas para rejillas de libros.
- Portada con alt “Portada de {título}, de {autor}”; alt vacío si el texto idéntico está justo al lado y la imagen es redundante.
- Estrellas anunciadas como “4,5 de 5”; input con radios/slider accesible y opción “Sin valorar”.
- Barras con nombre, valor actual, mínimo y máximo textuales.
- Toasts importantes con región `aria-live`; errores no desaparecen automáticamente.
- La cita destacada usa `blockquote` cuando se muestra; su ausencia no genera controles vacíos. La pregunta y respuesta reflexivas se presentan con encabezados y texto normal dentro del detalle de sesión.

## 11.4 Contraste y percepción

- 4,5:1 para texto normal, 3:1 para texto grande y componentes/gráficos relevantes.
- Estado no comunicado solo por color: icono + texto/patrón.
- Zoom al 200 % sin pérdida y reflow a 320 CSS px.
- Movimiento reducido respetado; no autoplay.
- El color contextual del detalle de una lectura nunca se usa directamente desde una portada: debe validarse y adaptarse para el tema activo. WCAG 2.2 AA prevalece sobre la fidelidad cromática; texto principal, estados, foco y controles críticos conservan los colores estables de Foaie. La ausencia o rechazo de un candidato activa el fallback y ninguna información depende solo del color contextual.

## 11.5 Formularios y tacto

- Etiquetas persistentes, ejemplo/formato separado, errores concretos.
- Objetivos táctiles preferentemente 44×44 px; mínimo WCAG 2.2 AA cuando aplique.
- Teclados: numérico para páginas/minutos, búsqueda para ISBN/título.
- Guardado evita doble envío y mantiene datos ante fallo.
- En el cierre de lectura, valoración, cita destacada y recuerdo están etiquetados como opcionales, admiten “Ahora no” y no impiden marcar la sesión como terminada. “Otra pregunta” anuncia la nueva pregunta y conserva el foco en la región reflexiva.

## 11.6 Breakpoints por contenido

| Rango orientativo | Comportamiento |
|---|---|
| 320–599 px | Barra inferior; 2 portadas; una columna; bottom sheets; CTA fija |
| 600–1023 px | 3–5 portadas; navegación compacta; paneles a 1–2 columnas |
| ≥1024 px | Sidebar; 5–7 portadas; filtros laterales; 2 columnas analíticas |
| ≥1440 px | Contenedor máximo 1440 px; no estirar líneas ni portadas indefinidamente |

Las estanterías funcionan desde 320 px mediante desplazamiento táctil nativo y admiten trackpad, rueda/ratón cuando el sistema lo permita y teclado. Una portada parcialmente visible puede indicar que existe más contenido, sin ocultar el enlace “Ver todos”. En escritorio pueden añadirse controles anterior/siguiente cuando mejoren el descubrimiento. No se usa autoplay, carrusel infinito ni desplazamiento circular; los extremos deben ser perceptibles y la posición dentro de la colección comprensible.

El desplazamiento iniciado por controles puede ser suave solo cuando no exista preferencia de movimiento reducido. Con `prefers-reduced-motion: reduce` será inmediato y no añadirá animaciones de entrada, barridos ni movimientos decorativos. La balda visual mantiene contraste suficiente y una apariencia neutra para no competir con las portadas.

Las páginas lógicas de Mi álbum conservan las mismas sesiones entre 320 y 1440 px. En móvil se presenta una página en 2 columnas y puede continuar verticalmente; en escritorio usa 4–6 columnas. El orden visual coincide con el DOM. Las futuras animaciones de pegado, celebración, paso de página y spreads se desactivan o sustituyen por cambios instantáneos con `prefers-reduced-motion`, sin ocultar contenido ni acciones.

## 11.7 Gráficos pequeños

- Preferir barras horizontales y resúmenes textuales.
- Permitir desplazamiento horizontal solo dentro de series temporales, con indicación visible.
- Leyendas fuera del área del gráfico.
- Botón “Ver como tabla/lista”.
- Tooltips accesibles por foco y toque, pero ningún dato depende exclusivamente de ellos.

## 11.8 Pruebas

Teclado manual; lectores de pantalla (NVDA en Windows y VoiceOver en iOS); zoom/reflow; contraste; modo oscuro; reducción de movimiento; tamaños 320, 375, 768, 1024 y 1440; datos extremos (títulos largos, sin portada, 0/500 libros). Mi álbum se prueba con meses vacíos, escasos y de varias páginas, fechas empatadas, relecturas, citas ausentes o largas, retorno desde la sesión y pertenencia lógica idéntica en todos los viewports.

---

# Fase 12. Recomendación tecnológica y plan de desarrollo

## 12.1 Comparación de alternativas

| Alternativa | Ventajas | Costes/riesgos | Ajuste al caso |
|---|---|---|---|
| HTML/CSS/JS + PHP + MySQL | Parte de conocimientos actuales; hosting económico; fundamentos visibles; control total | Más decisiones manuales de routing, componentes, validación, estado y API; UI compleja puede volverse difícil de mantener | **Bueno** para aprender fundamentos, menos potente como demostración full-stack moderna |
| React + backend + BD | Ecosistema y portfolio fuertes; separación clara; interfaz rica | Dos aplicaciones/despliegues, CORS, autenticación duplicada y más infraestructura | **Regular**: flexibilidad innecesaria para una app personal inicial |
| Next.js + BD | React, routing, servidor y endpoints en un proyecto; TypeScript; buen rendimiento; crecimiento razonable | Curva de React/TypeScript/Server Components; despliegue y caché requieren comprensión | **Mejor equilibrio** si se controla el alcance |
| WordPress personalizado | Tecnología conocida; auth/admin/media resueltos; REST y tipos personalizados posibles | Modelo de posts/meta incómodo para lecturas/estadísticas; personalización de app, tablas y build aumenta complejidad; portfolio se percibe más CMS | **No recomendado** para este dominio relacional, salvo que el objetivo principal sea especializarse en WordPress |

Next.js App Router integra enrutado por archivos y capacidades de servidor/cliente en un proyecto; la configuración oficial actual parte de TypeScript y herramientas de calidad ([documentación de Next.js](https://nextjs.org/docs/app), [instalación](https://nextjs.org/docs/app/getting-started/installation)). WordPress puede exponer tipos y taxonomías personalizados por REST, pero esa posibilidad no elimina el desajuste entre su modelo de contenido y un historial relacional de sesiones ([WordPress REST API](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-rest-api-support-for-custom-content-types/)).

## 12.2 Stack recomendado

- **Next.js (App Router) + TypeScript**: aplicación completa.
- **React**: interfaz y componentes.
- **CSS Modules + variables CSS** como opción pedagógica recomendada; Tailwind es válido, pero no necesario. CSS propio demuestra fundamentos y hace visible el sistema de diseño.
- **PostgreSQL**: base de datos relacional.
- **Prisma ORM**: migraciones y acceso tipado; aprender SQL en paralelo para estadísticas.
- **Auth.js o proveedor gestionado sencillo**: registro, inicio y cierre de sesión y recuperación de acceso para múltiples cuentas. La identidad, las sesiones y la propiedad se vinculan a `users.id`; no construir criptografía.
- **Zod**: validación compartida servidor/formulario.
- **React Hook Form**: formularios extensos por secciones.
- **Recharts** o **Nivo** solo al llegar a estadísticas; verificar accesibilidad y ofrecer tabla alternativa.
- **Almacenamiento de objetos** compatible con S3/servicio del despliegue para portadas manuales.
- **Vitest + Testing Library** para lógica/componentes; **Playwright** para el recorrido crítico.
- **Vercel** u otro host compatible + PostgreSQL gestionado. No acoplar dominio a un proveedor.
- **Configuración central de producto y marca**: nombre, descriptor, URLs, metadatos, logos y favicon consumidos desde una única fuente tipada.

### Alternativa de menor curva

Si React/TypeScript resultan demasiado nuevos a la vez, una primera versión con PHP moderno, MySQL, plantillas y JavaScript progresivo es perfectamente válida. Pero para el objetivo combinado de aprendizaje, portfolio y crecimiento, se mantiene Next.js como decisión definitiva.

## 12.3 Estructura conceptual de módulos

```text
app/
  (auth)/
  (app)/dashboard, library, album, statistics, settings
  api/ o server-actions según caso
components/
  books, readings, charts, forms, ui, layout
lib/
  auth, db, validation, dates, statistics, book-providers
prisma/
  schema + migrations + seed
styles/
  tokens + globals + componentes
tests/
  unit, integration, e2e
```

Es una guía para implementación posterior, no código ni obligación de una carpeta por cada concepto.

## 12.4 Política de Git y GitHub durante el desarrollo

Git forma parte del proceso de calidad, no es una tarea que se deja para el final. Se aplicarán estas reglas durante todo el proyecto:

1. Antes de ejecutar un comando de Git, se explicará qué hace y qué archivos o historial puede afectar.
2. Antes de cada commit se revisarán `git status` y `git diff`; también `git diff --staged` después de preparar los archivos.
3. Los commits serán pequeños, coherentes y corresponderán a una funcionalidad estable o a una mejora técnica claramente delimitada.
4. Codex propondrá un mensaje de commit, pero no ejecutará el commit automáticamente: esperará la indicación expresa de la usuaria.
5. No se incluirán cambios ajenos o incompletos solo para “limpiar” el estado del repositorio.
6. Se utilizarán ramas `feature/...` para funcionalidades importantes. Ajustes pequeños y seguros de documentación o mantenimiento pueden hacerse en `main` si la usuaria lo autoriza.
7. Una rama solo se fusionará con `main` después de revisar los cambios y comprobar lint, tipos, pruebas aplicables y funcionamiento manual del recorrido afectado.
8. Se realizará `push` después de cada commit estable que merezca copia remota y siempre antes de solicitar revisión o fusionar una rama.
9. No se usarán comandos destructivos —por ejemplo, `reset --hard`, restauraciones que descarten cambios, borrados de ramas no fusionadas o reescritura de historia— sin explicar primero sus consecuencias y obtener autorización.
10. No se usará `git push --force`. Si surgiera una razón excepcional, se explicará el riesgo, se comprobará la rama exacta y se solicitará autorización; se preferirá `--force-with-lease` cuando sea técnicamente apropiado.
11. Secretos y credenciales nunca se guardarán en Git. Si un secreto se incluyera por error, eliminarlo del archivo no sería suficiente: habría que revocarlo/rotarlo y evaluar la limpieza segura del historial.
12. La rama `main` debe permanecer funcional y desplegable.

### Convención de ramas y commits

- Ramas: `feature/<nombre-corto>`, `fix/<nombre-corto>`, `docs/<nombre-corto>` y `chore/<nombre-corto>`.
- Commits: estilo Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:` y `chore:`.
- No crear una rama para cada modificación mínima. Una rama agrupa una capacidad que pueda revisarse y probarse como unidad.
- Si una etapa es demasiado grande para un solo commit, se permiten varios commits estables; el “punto de commit” indicado en el plan es el mínimo obligatorio al cerrar la etapa.

## 12.5 Orden exacto recomendado

### Etapa 0 — Decisiones y prototipo de baja fidelidad

**Objetivo:** eliminar ambigüedades.  
**Tareas:** cerrar decisiones del final de este documento; probar wireframes móvil/escritorio; definir glosario y reglas estadísticas.  
**Artefactos:** `docs/product-spec.md`, `docs/data-rules.md`, prototipo.  
**Dependencias:** ninguna.  
**Resultado:** flujo validado sin código.  
**Terminada cuando:** se puede narrar el ciclo completo y no hay campos esenciales sin definición.

**Git:** todavía no requiere repositorio. Si ya existiera, rama `docs/product-spec`; commit al aprobar la especificación; mensaje sugerido `docs: define product specification and MVP scope`; `push` después del commit aprobado; fusionar con `main` cuando la documentación esté revisada y no contenga secretos.

### Etapa 0.5 — Git, GitHub y preparación del repositorio

**Objetivo:** crear una base versionada, segura y comprensible antes de generar la aplicación.  
**Rama recomendada:** `main`; esta preparación inicial establece la rama principal. No hace falta una rama feature antes del primer commit.  
**Dependencias:** Etapa 0 aprobada; cuenta de GitHub disponible; nombre definitivo o provisional de la carpeta y del repositorio.  
**Resultado:** carpeta definitiva con repositorio local, documentación inicial y repositorio remoto sincronizado, todavía sin código de la aplicación.

**Tareas, en orden:**

1. Comprobar que Git está instalado con `git --version`. El comando solo consulta la versión y no modifica archivos.
2. Verificar la identidad efectiva con `git config --get user.name` y `git config --get user.email`. Para conocer su origen se puede usar `git config --show-origin --get user.name` y el equivalente para el correo. Si se desea revisar la configuración global: `git config --global --list`. Antes de cambiarla se decidirá si el ajuste debe ser global (`--global`) o solo de este repositorio (sin `--global`).
3. Crear la carpeta definitiva del proyecto con el nombre `foaie`, en una ubicación acordada y no dentro de otro repositorio por accidente.
4. Entrar en esa carpeta e inicializar el repositorio con `git init -b main`. Si la versión de Git no acepta `-b`, usar `git init` seguido de `git branch -M main`. Se comprobará la rama con `git branch --show-current`.
5. Crear un `.gitignore` adecuado para Next.js, Node.js y Prisma. Como mínimo debe ignorar:

   ```gitignore
   # Dependencies
   node_modules/

   # Next.js and generated output
   .next/
   out/
   dist/
   build/
   coverage/
   *.tsbuildinfo
   next-env.d.ts

   # Environment variables and secrets
   .env
   .env.*
   !.env.example

   # Logs
   *.log
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   pnpm-debug.log*

   # Local databases and Prisma-generated local data
   *.db
   *.db-journal
   prisma/dev.db
   prisma/dev.db-journal

   # OS and editors
   .DS_Store
   Thumbs.db
   .idea/
   .vscode/*
   !.vscode/extensions.json
   !.vscode/settings.json

   # Deployment providers
   .vercel/
   ```

   La regla `.env.*` protege también `.env.local`, `.env.development.local` y equivalentes. Se permitirá únicamente `.env.example`, que contendrá nombres de variables y valores ficticios, nunca claves reales. Las migraciones de Prisma sí deben versionarse; los clientes o artefactos generados no.
6. Comprobar que `.env`, `.env.local`, claves de API, contraseñas, URLs con credenciales, `node_modules` y archivos generados no aparecen en `git status`. Si existe duda, usar `git check-ignore -v <archivo>` para comprobar qué regla lo excluye.
7. Crear un `README.md` inicial con nombre, problema, estado del proyecto, stack previsto, requisitos aún no instalados, enlace a la especificación, hoja de ruta resumida, instrucciones de seguridad y futura forma de ejecución.
8. Guardar esta especificación como `docs/product-spec.md` dentro de la carpeta definitiva. La copia de trabajo pasa a ser la fuente oficial versionada.
9. Revisar los archivos con `git status`, `git diff -- .gitignore README.md docs/product-spec.md` y, tras prepararlos, `git diff --staged`.
10. Preparar exclusivamente `.gitignore`, `README.md` y `docs/product-spec.md` con `git add` explícito, evitando `git add .` en este primer commit para reducir inclusiones accidentales.
11. Crear el primer commit solo tras autorización: `git commit -m "chore: configure Git and project documentation"`.
12. Crear un repositorio vacío en GitHub, preferiblemente privado al inicio. No inicializarlo con README, `.gitignore` ni licencia si esos archivos ya existen localmente, para evitar historias divergentes.
13. Conectar el remoto con `git remote add origin <URL-DEL-REPOSITORIO>` y verificarlo con `git remote -v`. La URL nunca debe incluir tokens o contraseñas.
14. Realizar el primer push, tras autorización, con `git push -u origin main`. `-u` establece el seguimiento entre la rama local `main` y `origin/main`.
15. Confirmar en GitHub que solo están los archivos previstos, que la rama predeterminada es `main` y que no aparece ningún secreto.

**Punto de commit:** cuando `.gitignore`, `README.md` y `docs/product-spec.md` estén revisados y el estado preparado no contenga secretos ni archivos generados.  
**Mensaje sugerido:** `chore: configure Git and project documentation`.  
**Momento del push:** inmediatamente después de aprobar y crear el primer commit, una vez creado y verificado el remoto de GitHub.  
**Criterio para fusionar con `main`:** no aplica, porque el repositorio nace en `main`. La etapa termina cuando `main` local y `origin/main` apuntan al mismo commit y GitHub muestra únicamente los archivos esperados.  
**Terminada cuando:** Git e identidad están comprobados; la rama es `main`; los secretos están ignorados; la especificación vive en `docs/product-spec.md`; existe el commit inicial; y el primer push se ha verificado en GitHub.

### Etapa 1 — Base visual navegable

**Objetivo:** aplicación desplegada, accesible y responsive con datos simulados.  
**Tareas:** proyecto, TypeScript, lint/formato, tokens, AppShell, rutas, componentes UI, estados vacíos/carga/error; preparar tokens semánticos con fallback para que el futuro detalle de sesión pueda aceptar un color contextual mock/manual sin alterar el tema global.<br>
**Módulos:** `app`, `components/ui`, `components/layout`, `styles`.  
**Dependencias:** Etapas 0 y 0.5.  
**Resultado:** navegación funcional sin base de datos.  
**Terminada cuando:** todas las rutas núcleo funcionan a 320–1440 px y por teclado.

**Git:** rama `feature/base-visual`; commits al inicializar Next.js y al completar la base navegable; mensajes sugeridos `chore: initialize Next.js project` y `feat: create responsive application shell`; `push` tras cada commit estable y antes de revisión; fusionar con `main` cuando lint, comprobación de tipos, pruebas disponibles y revisión responsive/teclado pasen.

### Etapa 2 — Base de datos y acceso privado

**Objetivo:** persistencia y límites de seguridad.  
**Tareas:** PostgreSQL, Prisma, migraciones de núcleo, seed, auth, autorización por usuario, variables seguras.  
**Módulos:** `prisma`, `lib/db`, `lib/auth`.  
**Dependencias:** proveedor de BD y decisión de auth.  
**Resultado:** cuentas multiusuario, recuperación de acceso, sesiones privadas y datos persistentes.  
**Terminada cuando:** dos cuentas pueden registrarse y autenticarse; cada una solo accede a sus registros, preferencias, archivos, estadísticas y exportaciones; la migración es limpia y el backup está probado en entorno de desarrollo.

**Git:** rama `feature/database`; commit al completar esquema/migración y otro al cerrar autenticación si ambos cambios son grandes; mensajes sugeridos `feat: add database schema for books and readings` y `feat: add private user authentication`; `push` después de cada hito estable, nunca con `.env`; fusionar cuando migraciones desde cero, autorización, pruebas y revisión de secretos pasen.

### Etapa 3 — Catálogo manual de libros

**Objetivo:** crear y mantener obras/ediciones.  
**Tareas:** validaciones, formulario progresivo, autores/géneros/editorial/saga, portada, editar/eliminar, duplicados.  
**Módulos:** `components/books`, `lib/validation/books`, acciones/servicios de libros.  
**Dependencias:** Etapa 2, almacenamiento de imágenes.  
**Resultado:** CRUD manual completo.  
**Terminada cuando:** se puede crear mínimo y completo, corregir, eliminar con confirmación y recuperar errores sin perder el formulario.

**Git:** rama `feature/book-catalog`; commit cuando el CRUD manual sea estable, con commits previos separados para validación o subida de portadas si lo requieren; mensaje sugerido `feat: implement manual book catalog`; `push` al cerrar cada parte comprobable y antes de revisión; fusionar cuando crear, editar, eliminar, duplicados, errores y permisos estén probados.

### Etapa 4 — Biblioteca

**Objetivo:** encontrar y explorar.  
**Tareas:** cuadrícula/lista, búsqueda, filtros MVP, ordenación, URL con estado de filtros, paginación, skeleton/empty/error; vista exploratoria de pendientes con estanterías dinámicas por género principal, estantería `Sin género` y acceso “Ver todos” a la Biblioteca filtrada por `Pendientes + género`.<br>
**Módulos:** `app/library`, `BookCard`, `FilterPanel`, `PendingGenreShelves`, `GenreShelf`, `HorizontalBookRail`, consultas.<br>
**Dependencias:** Etapa 3.  
**Resultado:** biblioteca funcional con 500 registros de prueba.  
**Terminada cuando:** las combinaciones devuelven datos correctos, los filtros se pueden compartir/recargar y el rendimiento es aceptable; las estanterías solo muestran géneros con pendientes, no duplican libros por géneros secundarios, incluyen los pendientes sin género y funcionan desde 320 px con tacto, trackpad, ratón y teclado, sin autoplay ni bucle infinito y respetando WCAG 2.2 AA y `prefers-reduced-motion`.

**Git:** rama `feature/library`; punto de commit al estabilizar vistas y al completar búsqueda/filtros; mensaje final sugerido `feat: add library search and filters`; `push` después de cada commit estable; fusionar cuando pruebas de filtros, recarga de URL, accesibilidad, responsive y rendimiento con datos de prueba pasen.

### Etapa 5 — Lecturas y progreso

**Objetivo:** completar el núcleo del diario.  
**Tareas:** iniciar, actualizar, terminar, abandonar, relectura, historial, rating de medias estrellas y reseña; crear, editar y eliminar múltiples citas por sesión con localización y nota personal opcionales; elegir una cita destacada; guardar o editar un recuerdo reflexivo opcional.<br>
**Módulos:** `components/readings`, servicios, ficha.  
**Dependencias:** Etapa 4.  
**Resultado:** ciclo de lectura completo.  
**Terminada cuando:** estados y fechas permanecen consistentes, una relectura no sobrescribe historia, citas y recuerdo pertenecen a la sesión correcta y finalizar sigue siendo posible sin valoración, cita destacada ni respuesta reflexiva; el E2E crítico pasa.

**Git:** rama `feature/readings`; commits separados para ciclo de estado y recuerdos si facilita la revisión; mensaje sugerido `feat: implement reading progress tracking`; `push` tras cada flujo estable; fusionar cuando el E2E iniciar→actualizar→terminar pase y relectura, abandono, fechas y autorización estén verificados.

### Etapa 6 — Dashboard

**Objetivo:** dar utilidad inmediata al entrar.  
**Tareas:** lectura actual, actualización rápida, terminado reciente, métricas mes/año y objetivo anual.  
**Módulos:** `app/dashboard`, consultas agregadas, tarjetas.  
**Dependencias:** Etapa 5.  
**Resultado:** inicio personalizado con datos reales.  
**Terminada cuando:** cada cifra coincide con casos de prueba y enlaza a sus registros.

**Git:** rama `feature/dashboard`; punto de commit con dashboard completo y cifras verificadas; mensaje sugerido `feat: create reading dashboard`; `push` después de comprobar datos reales y estados vacío/error; fusionar cuando consultas, enlaces, responsive, accesibilidad y pruebas pasen.

### Etapa 7 — Mi álbum

**Objetivo:** representar visualmente el diario por años, capítulos mensuales, páginas lógicas y cromos de sesiones terminadas.<br>
**Tareas:** selector anual, índice de meses, navegación de páginas, tamaño lógico decidido tras prototipos de 8/10/12, cromos con portada y datos de sesión, relectura, cita destacada opcional y acceso al detalle; resumen mensual, favorito y cierre `Mi [año]` con libros, páginas, audio y media; loading/empty/error, URL con contexto y aislamiento multiusuario.<br>
**Módulos:** `app/album`, `components/album`, `lib/statistics/monthly`, agregados anuales básicos.<br>
**Dependencias:** Etapa 5.  
**Resultado:** cualquier año y mes puede recorrerse como álbum sin duplicar datos de Biblioteca, sesiones o Estadísticas.<br>
**Terminada cuando:** límites de mes/zona horaria, orden estable, paginación idéntica entre dispositivos, relecturas, citas opcionales, datos faltantes, estados de interfaz, teclado, lector de pantalla y aislamiento tienen pruebas.

**Git:** rama `feature/reading-album`; puntos de commit al estabilizar navegación/paginación y al completar resúmenes/recuerdos; mensaje final sugerido `feat: add personal reading album`; `push` tras probar meses con y sin datos; fusionar cuando zona horaria, páginas lógicas, relecturas, favorito, responsive, accesibilidad y privacidad estén verificados.

### Etapa 8 — Importación por API

**Objetivo:** acelerar el alta sin volverla dependiente.  
**Tareas:** adaptador de proveedores, Google Books, fallback Open Library, caché, límites, candidatos, revisión manual y deduplicación.  
**Módulos:** `lib/book-providers`, búsqueda del formulario.  
**Dependencias:** claves/términos revisados; Etapa 3 estable.  
**Resultado:** buscar → elegir → corregir → guardar.  
**Terminada cuando:** API caída/no encontrado/datos conflictivos permiten continuar manualmente.

**Git:** rama `feature/book-import`; commits separados para adaptador y experiencia de importación si conviene; mensaje sugerido `feat: import book metadata from external providers`; `push` solo después de confirmar que ninguna clave está versionada; fusionar cuando éxito, timeout, error, fallback, corrección manual, límites y deduplicación pasen.

### Etapa 9 — Estadísticas MVP

**Objetivo:** análisis fiable.  
**Tareas:** consultas compartidas de libros/páginas/audio/media, meses, formatos/géneros, autores y libros de cinco estrellas, selector anual y alternativa tabular; enriquecer `Mi [año]` mediante esas mismas funciones, sin duplicar lógica.<br>
**Módulos:** `app/statistics`, `lib/statistics`, charts.  
**Dependencias:** datos reales suficientes.  
**Resultado:** estadísticas explicables y accesibles.  
**Terminada cuando:** pruebas con dataset conocido coinciden exactamente y gráficos funcionan con teclado/lector.

**Git:** rama `feature/statistics`; punto de commit al validar primero la lógica y otro al completar la presentación; mensaje sugerido `feat: add accessible reading statistics`; `push` después de cada conjunto estable; fusionar cuando los resultados coincidan con el dataset de referencia y gráficos, tabla alternativa, filtros y accesibilidad estén comprobados.

### Etapa 10 — Confianza, exportación y calidad

**Objetivo:** MVP publicable.  
**Tareas:** JSON/CSV, privacidad, errores globales, logging sin contenido privado, seguridad, rendimiento de imágenes, pruebas, auditoría accesible, README y demo.  
**Módulos:** settings/data, exportadores, suite E2E.  
**Dependencias:** todas las anteriores.  
**Resultado:** release 1.0.  
**Terminada cuando:** ciclo crítico, exportación/restauración manual verificada, auditorías y checklist de release pasan.

**Git:** rama `feature/release-quality` o ramas pequeñas `feature/data-export` y `chore/release-quality` si la revisión sería demasiado grande; mensajes sugeridos `feat: add personal data export` y `chore: prepare MVP release`; `push` tras cada bloque estable y antes de la revisión final; fusionar cuando CI, pruebas, exportación, seguridad, accesibilidad, rendimiento, documentación y checklist de release pasen. Crear después una etiqueta versionada `v1.0.0` solo con autorización.

### Después del MVP

Orden V2: colecciones → retos → estadísticas avanzadas/calendario → extracción y normalización automática del color contextual → animaciones y personalización de Mi álbum → importación masiva → PWA → tarjetas compartibles → Wrapped. Para Mi álbum quedan previstos pegado del cromo, paso de página, celebración al completar una página, spreads, reordenación manual y exportación visual; serán mejoras progresivas y opcionales. La extracción de portada seguirá siendo opcional, validada y desacoplada del tema global. Recomendaciones y gamificación solo después de confirmar utilidad y calidad de datos.

---

# Visión a largo plazo

## Principio rector

Foaie puede evolucionar de diario privado a plataforma lectora sin convertir el MVP en una plataforma prematura. La evolución se guiará por uso real, consentimiento y sostenibilidad. Las funciones sociales serán **opcionales y privadas por defecto**; el diario personal seguirá funcionando aunque una persona no participe en ninguna comunidad.

## Horizonte 1 — Álbum y diario privado sólidos

Objetivo: perfeccionar registro, biblioteca, recuerdos, estadísticas, exportación y sincronización web.

- Varias cuentas privadas con registro controlado.
- Sincronización transparente entre dispositivos mediante la misma cuenta.
- PWA y experiencia móvil optimizada.
- Importación estructurada desde Goodreads y otros CSV, con previsualización, mapeo y deshacer.
- Importación desde Kindle cuando exista un mecanismo técnico y legal fiable; nunca pedir credenciales de Kindle ni depender de scraping frágil.
- Notificaciones opt-in para recordatorios de lectura, préstamos o cierres de mes.
- Widgets de lectura actual, objetivo y acceso rápido.

**Preparación actual necesaria:** propiedad por usuario, importadores mediante adaptadores, eventos de progreso, almacenamiento externo, exportación y API interna estable.

## Horizonte 2 — Compartir de forma controlada

Objetivo: permitir expresión pública sin hacer pública toda la biblioteca.

- Perfil público opcional y campos seleccionables.
- Compartir una reseña, colección o resumen mediante enlace individual.
- Controles por recurso: privado, enlace no listado o público.
- Bloqueo, denuncia, moderación y eliminación antes de habilitar interacción entre desconocidos.
- SEO únicamente para contenido marcado expresamente como público.

**Preparación actual necesaria:** separar propiedad de visibilidad, URLs públicas no enumerables, consentimiento explícito, auditoría y política de privacidad. No es necesario implementar campos de visibilidad en el MVP salvo que simplifique el futuro sin añadir interfaz.

## Horizonte 3 — Comunidad lectora

Objetivo: conectar personas sin sacrificar la experiencia individual.

- Seguir a otros lectores mediante relaciones aprobadas o públicas.
- Feed cronológico controlable, sin obligación de ranking algorítmico.
- Comentarios o conversaciones en reseñas compartidas.
- Retos compartidos y clubes de lectura.
- Listas colaborativas con roles de propietario, editor y participante.
- Preferencias de seguridad, privacidad y moderación desde el diseño.

**Preparación actual necesaria:** identidades estables, autorización basada en políticas, eventos y notificaciones asíncronas. Estas tablas y servicios se añadirán cuando se construya la función; no forman parte del esquema MVP.

## Horizonte 4 — Descubrimiento e inteligencia personal

Objetivo: ayudar a elegir y recordar, no sustituir el criterio de la persona.

- Recomendaciones explicables basadas en biblioteca, formatos y preferencias.
- API pública con OAuth, scopes, límites, versionado y portal para desarrolladores.
- IA opt-in para resumir **las notas personales de la usuaria**, encontrar temas o crear recapitulaciones privadas.
- Los resúmenes generados se marcarán como tales, podrán editarse/eliminarse y nunca se confundirán con el texto del libro.
- No enviar a proveedores de IA notas, citas o reseñas sin consentimiento informado y controles de retención.
- Aplicaciones móviles nativas si las capacidades del dispositivo justifican mantenerlas; compartirán contrato de API, no lógica duplicada.

## Posibles componentes de escala futura

Solo cuando las métricas lo exijan:

- Cola de trabajos para importaciones, imágenes, notificaciones y resúmenes.
- Caché distribuida y rate limiting compartido.
- CDN y procesamiento dedicado de imágenes.
- Réplicas de lectura o vistas materializadas para analítica.
- Búsqueda especializada si PostgreSQL deja de cumplir los objetivos medidos.
- Separación de servicios con límites de dominio comprobados.

No se adoptarán microservicios, Kubernetes, colas o motores de búsqueda externos únicamente por una expectativa de “miles de personas”. Una aplicación monolítica bien indexada, sin estado local y con servicios gestionados puede atender ese crecimiento inicial con mucha menos complejidad.

## Condiciones antes de abrir Foaie al público

1. Pruebas automáticas de aislamiento entre usuarios.
2. Verificación de correo, recuperación de cuenta y protección contra abuso.
3. Política de privacidad, términos y proceso de eliminación/exportación.
4. Backups automáticos y restauración probada.
5. Monitorización, alertas y gestión de incidentes.
6. Rate limiting y límites de almacenamiento/importación.
7. Revisión de licencias y términos de portadas/metadatos.
8. Accesibilidad, internacionalización y soporte operativo mínimos.
9. Presupuesto y límites de costes por usuario.
10. Registro público activado mediante configuración reversible, no mediante un cambio improvisado de arquitectura.

---

# Fase 13. Presentación en portfolio

## 13.1 Nombre y relato

**Nombre definitivo:** **Foaie**. Significa “hoja” en rumano y representa una hoja de papel, la página de un libro y la huella que deja cada lectura. **Descriptor:** **Foaie — Tu diario visual de lectura**. Antes de publicar, comprobar y documentar disponibilidad de marca, dominio y nombres en plataformas.

**Descripción corta:**

> Foaie es un diario de lectura privado y visual que permite registrar libros, ebooks y audiolibros, seguir el progreso y recorrer el historial en Mi álbum y mediante estadísticas personales.

**Problema:** los recuerdos y datos lectores están dispersos; las plataformas sociales priorizan comunidad sobre experiencia personal.

## 13.2 Tecnologías a presentar

Next.js, React, TypeScript, PostgreSQL, Prisma, autenticación, APIs REST externas, CSS responsive, pruebas de componentes/E2E, accesibilidad WCAG y despliegue continuo. Solo listar lo realmente implementado.

## 13.3 Funciones destacadas

- Modelo obra–edición–lectura y relecturas.
- Registro progresivo manual o por ISBN/API.
- Biblioteca cover-first con filtros combinables.
- Actualización rápida de progreso.
- Mi álbum anual con capítulos mensuales, cromos de sesiones y recuerdos personales; estadísticas explicables.
- Exportación de datos, tema oscuro y accesibilidad.

## 13.4 Capturas recomendadas

1. Dashboard desktop con datos realistas.
2. Biblioteca móvil y desktop con filtros activos.
3. Ficha con historial de relectura, notas y citas.
4. Flujo “buscar por ISBN → revisar → guardar”.
5. Mi álbum: año, capítulo mensual, cromos y cierre `Mi [año]`.
6. Estadísticas con alternativa accesible.
7. Modo oscuro y navegación por teclado/foco.
8. Diagrama de datos simplificado y una vista de estados vacíos/errores.

Usar datos ficticios o propios con permiso; nunca exponer correos, claves ni notas privadas.

## 13.5 Decisiones para explicar en entrevista

- Por qué separar obra, edición y lectura.
- Por qué Next.js monolítico modular antes que frontend/backend separados.
- Cómo se impide que una API externa sea punto único de fallo.
- Cómo se definen estadísticas y se prueban fechas/relecturas.
- Cómo se evita confundir “sin valoración” con 0.
- Cómo se diseñaron formularios progresivos y estados accesibles.
- Cómo se autorizan recursos por usuaria.
- Qué se dejó fuera del MVP y por qué.

## 13.6 Capacidades demostradas

| Capacidad | Evidencia |
|---|---|
| Producto | Alcance cerrado, roadmap y criterios de éxito |
| UX/UI | Arquitectura, responsive, formularios, estados y design system |
| Frontend | Componentes, filtros, interacción y gráficas |
| Backend | Auth, validación, integraciones, exportación |
| Datos | Normalización y consultas estadísticas |
| Calidad | Pruebas, accesibilidad, seguridad y documentación |

## 13.7 Estructura del caso de estudio

Contexto → investigación/hipótesis → restricciones → decisiones de alcance → wireframes → sistema visual → arquitectura → dificultades → pruebas → resultado → aprendizajes → próximos pasos. Mostrar iteración y decisiones, no solo pantallas finales.

---

# Entregables finales para comenzar

## A. Recomendación tecnológica definitiva

**Next.js App Router + TypeScript + PostgreSQL + Prisma**, CSS Modules/variables CSS, autenticación sencilla gestionada, Zod, React Hook Form, pruebas con Vitest/Testing Library y Playwright, y almacenamiento de objetos para portadas. Un único repositorio y despliegue. Google Books como API principal, Open Library como fallback.

## B. MVP cerrado

Las 18 capacidades de la sección 2.2 constituyen el contrato. Cualquier idea nueva desplaza otra, pasa a V2 o requiere una decisión explícita de cambio de alcance.

## C. Orden exacto de construcción

0. Decisiones/prototipo.  
0.5. Git, GitHub y preparación del repositorio.  
1. Base visual.  
2. Base de datos y acceso.  
3. Catálogo manual.  
4. Biblioteca.  
5. Lecturas y progreso.  
6. Dashboard.  
7. Mi álbum.<br>
8. APIs de libros.  
9. Estadísticas MVP.  
10. Exportación, accesibilidad, seguridad, pruebas y release.

## D. Principales riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Alcance excesivo | Proyecto interminable | Contrato de 18 capacidades; backlog separado |
| Aprender demasiadas herramientas | Bloqueo | Una etapa a la vez; CSS propio; un solo deploy |
| Modelo de datos pobre | Relecturas/ediciones incorrectas | Obra–edición–lectura desde el inicio |
| Metadatos externos incompletos | Altas erróneas | Revisión y corrección manual; fuente guardada |
| Estadísticas inconsistentes | Pérdida de confianza | Definiciones visibles + dataset de prueba |
| Fechas/zonas horarias | Meses y rachas erróneos | `date` para lectura, timezone de usuaria y pruebas límite |
| Portadas lentas/rotas | Deteriora el diseño central | Optimización, placeholder, caché y almacenamiento controlado |
| Formulario largo | Abandono | Datos esenciales primero; secciones progresivas |
| Accesibilidad tardía | Reescritura | Criterios AA por etapa y componentes semánticos |
| Pérdida o filtración de datos | Daño alto | autorización por recurso, backups/exportación, secretos de servidor |
| PWA/offline prematuro | Conflictos de sincronización | Posponer a V2 tras estabilizar persistencia online |
| Portfolio con datos vacíos | Poco convincente | Seed ficticio coherente y caso de estudio |

## E. Decisiones que debes tomar antes de programar

### Obligatorias

1. **Resuelta:** nombre oficial Foaie, descriptor “Foaie — Tu diario visual de lectura” y tono definido en Identidad de marca.
2. **Resuelta:** MVP multiusuario y privado por defecto, con cuentas independientes, autenticación, recuperación de acceso y aislamiento estricto entre usuarios; sin funciones sociales.
3. Método de autenticación inicial: contraseña, enlace mágico o proveedor externo, incluyendo recuperación de acceso.
4. Qué significa exactamente “0 estrellas”: valoración real o ausencia de valoración (recomendación: ausencia = `null`; permitir 0 solo si de verdad aporta valor).
5. Regla de conteo: relecturas cuentan como libros leídos (recomendación: sí, con etiqueta visible).
6. Qué fecha asigna un libro al mes (recomendación: fecha de finalización).
7. Cómo se registra progreso de ebook: páginas si se conocen; porcentaje si no.
8. Audiolibros: minutos escuchados y duración total, sin convertir a páginas.
9. Un género principal más secundarios, o varios iguales (recomendación: principal + secundarios).
10. Política de portadas: enlace externo, copia propia o subida manual; revisar términos.
11. Proveedor de base de datos, alojamiento y almacenamiento dentro de un presupuesto mensual.
12. Datos que serán obligatorios: recomendación título, al menos un autor y formato; lo demás opcional.

### Pueden decidirse durante el MVP

13. CSS Modules frente a Tailwind (recomendación pedagógica: CSS Modules + tokens).
14. Librería de gráficos después de probar accesibilidad.
15. **Resuelta:** las citas pertenecen a cada sesión, pueden guardarse durante la lectura y se consultan/editan en su detalle; la forma concreta de panel o página puede decidirse al diseñar el componente.
16. Si se permiten varias lecturas simultáneas del mismo libro (recomendación MVP: una sesión activa por edición).
17. Si una edición puede pertenecer a varios formatos (recomendación: no; cada formato es una edición/registro distinto).
18. Plazo y política de conservación de exportaciones.
19. Tamaño lógico de página de Mi álbum tras prototipar 8, 10 y 12 cromos; el resultado será único y estable entre dispositivos.

### Deliberadamente pospuestas

20. Compartir públicamente.
21. Algoritmo de recomendaciones.
22. Logros, emociones y puntuaciones de racha.
23. Modo offline y sincronización.
24. Importadores de Goodreads/StoryGraph/CSV ajeno.
25. Animaciones, spreads, personalización, reordenación y exportación visual de Mi álbum.

---

# Checklist de preparación

- [ ] Se han respondido las 12 decisiones obligatorias.
- [ ] Se han probado los siete wireframes con 3–5 tareas reales.
- [ ] El modelo obra–edición–lectura se entiende y acepta.
- [ ] El MVP no ha incorporado elementos de V2.
- [ ] Hay definiciones aprobadas para mes, relectura, rating y progreso.
- [ ] Se han elegido presupuesto y proveedores.
- [ ] Existe un conjunto ficticio de datos con casos límite.
- [ ] Se han definido criterios de accesibilidad y privacidad.
- [ ] Git está instalado y la identidad configurada se ha verificado.
- [ ] La carpeta definitiva, el repositorio `main`, `.gitignore`, README y remoto de GitHub están preparados.
- [ ] `docs/product-spec.md` es la copia oficial versionada de esta especificación.
- [ ] Se ha verificado que el primer commit y el remoto no contienen secretos ni archivos generados.
- [ ] Solo entonces comienza la Etapa 1.

La especificación debe versionarse: cualquier cambio de regla de negocio se registra con fecha, motivo e impacto en datos, diseño y pruebas.
