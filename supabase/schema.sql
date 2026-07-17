-- Esquema de la base de asistencia. Ejecutar una vez en el SQL Editor de Supabase.
-- Todo el acceso pasa por el servidor (llave secreta, que ignora RLS).
-- RLS queda activado sin políticas: el navegador (anon) no puede leer ni escribir nada.

create table if not exists public.students (
  id text primary key,
  name text not null,
  name_normalized text not null,
  active boolean not null default true,
  phone text, -- E.164, ej. +526141234567; solo para contacto en el export
  email text -- solo para la base; no se muestra en la app ni en el export
);

-- Si la tabla ya existía sin las columnas:
alter table public.students add column if not exists phone text;
alter table public.students add column if not exists email text;

create table if not exists public.sessions (
  id text primary key, -- YYYY-MM-DD
  code text not null,
  open boolean not null default true,
  opened_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  session_id text not null references public.sessions (id) on delete cascade,
  student_id text not null references public.students (id) on delete cascade,
  student_name text not null,
  marked_by text not null check (marked_by in ('self', 'admin')),
  checked_in_at timestamptz not null default now(),
  primary key (session_id, student_id)
);

alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
