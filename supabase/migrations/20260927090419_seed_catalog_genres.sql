insert into public.genres (id, name, slug)
values
  ('3f000000-0000-4000-8000-000000000001', 'Novela', 'novela'),
  ('3f000000-0000-4000-8000-000000000002', 'Misterio', 'misterio'),
  ('3f000000-0000-4000-8000-000000000003', 'Thriller', 'thriller'),
  ('3f000000-0000-4000-8000-000000000004', 'Fantasía', 'fantasia'),
  ('3f000000-0000-4000-8000-000000000005', 'Ciencia ficción', 'ciencia-ficcion'),
  ('3f000000-0000-4000-8000-000000000006', 'Romance', 'romance'),
  ('3f000000-0000-4000-8000-000000000007', 'Terror', 'terror'),
  ('3f000000-0000-4000-8000-000000000008', 'Ficción histórica', 'ficcion-historica'),
  ('3f000000-0000-4000-8000-000000000009', 'Aventuras', 'aventuras'),
  ('3f000000-0000-4000-8000-000000000010', 'Infantil y juvenil', 'infantil-juvenil'),
  ('3f000000-0000-4000-8000-000000000011', 'Poesía', 'poesia'),
  ('3f000000-0000-4000-8000-000000000012', 'Teatro', 'teatro'),
  ('3f000000-0000-4000-8000-000000000013', 'Ensayo', 'ensayo'),
  ('3f000000-0000-4000-8000-000000000014', 'Biografía y memorias', 'biografia-memorias'),
  ('3f000000-0000-4000-8000-000000000015', 'Historia', 'historia'),
  ('3f000000-0000-4000-8000-000000000016', 'Ciencia', 'ciencia'),
  ('3f000000-0000-4000-8000-000000000017', 'Filosofía', 'filosofia'),
  ('3f000000-0000-4000-8000-000000000018', 'Psicología', 'psicologia'),
  ('3f000000-0000-4000-8000-000000000019', 'Ciencias sociales', 'ciencias-sociales')
on conflict (slug)
do update set
  name = excluded.name;
