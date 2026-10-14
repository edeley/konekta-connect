-- ==============================================================================
-- KONEKTA CONNECT (São Tomé e Príncipe) - ESQUEMA COMPLETO SUPABASE POSTGRESQL
-- Copie TODO este código e cole no SQL Editor do Supabase (https://supabase.com)
-- Depois clique no botão verde "RUN"
-- ==============================================================================

-- 1. TABELA DE PERFIS DE UTILIZADORES (Clientes e Prestadores)
create table if not exists public.profiles (
  id text primary key,
  phone text unique not null,
  name text not null,
  email text,
  role text not null default 'cliente' check (role in ('cliente', 'prestador', 'ambos', 'admin')),
  district text default 'Água Grande',
  city text default 'São Tomé',
  address text,
  avatar_url text,
  rating numeric(3,2) default 5.0,
  completed_jobs integer default 0,
  is_verified boolean default false,
  wallet_balance numeric(12,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE PRESTADORES E CATÁLOGO TÉCNICO
create table if not exists public.prestadores (
  id text primary key,
  name text not null,
  phone text,
  category text not null,
  category_slug text,
  district text default 'Água Grande',
  districts text[] default array['Água Grande']::text[],
  price_from numeric(12,2) default 0,
  rating numeric(3,2) default 5.0,
  reviews_count integer default 0,
  verified boolean default true,
  bio text,
  image_url text,
  services jsonb default '[]'::jsonb,
  detailed_services jsonb default '[]'::jsonb,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE PEDIDOS DE SERVIÇOS (Ordens de Trabalho & Escrow)
create table if not exists public.pedidos (
  id text primary key,
  provider_id text,
  service text not null,
  category text,
  scheduled_for text,
  status text not null default 'pendente',
  total numeric(12,2) not null default 0,
  address text,
  district text default 'Água Grande',
  location text,
  client_phone text,
  client_name text,
  client_avatar text,
  reference_point text,
  notes text,
  payment_method text default 'carteira',
  completion_code text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  maps_url text,
  directions_url text,
  photos jsonb default '[]'::jsonb,
  breakdown jsonb default '{}'::jsonb,
  warranty text,
  started_at bigint,
  finished_at bigint,
  completed_at bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABELA DE TRANSAÇÕES E MOVIMENTOS DE CARTEIRA (STN / Dobras)
create table if not exists public.transacoes (
  id text primary key,
  user_phone text,
  kind text not null default 'in' check (kind in ('in', 'out')),
  label text not null,
  amount numeric(12,2) not null,
  at bigint,
  status text not null default 'concluido',
  reference text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABELA DE PEDIDOS DE DEPÓSITO / RECARGA DE SALDO
create table if not exists public.pedidos_deposito (
  id text primary key,
  user_id text not null,
  user_name text not null,
  user_role text not null default 'cliente',
  user_phone text,
  amount numeric(12,2) not null,
  method text not null,
  bank_or_provider_name text,
  reference_or_phone text,
  proof_image text,
  notes text,
  status text not null default 'pendente_aprovacao',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABELA DE PEDIDOS DE LEVANTAMENTO (Payouts Prestadores)
create table if not exists public.pedidos_levantamento (
  id text primary key,
  provider_id text not null,
  provider_name text not null,
  provider_phone text,
  amount numeric(12,2) not null,
  method text not null,
  account_details text not null,
  holder_name text not null,
  status text not null default 'pendente',
  rejection_reason text,
  proof_ref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABELA DE VISITAS TÉCNICAS E ORÇAMENTOS PRESENCIAIS
create table if not exists public.visitas_tecnicas (
  id text primary key,
  provider_id text not null,
  provider_name text not null,
  client_id text not null,
  client_name text not null,
  client_phone text,
  service_title text not null,
  category text,
  district text not null default 'Água Grande',
  address text,
  scheduled_date text not null,
  scheduled_time text not null,
  visit_fee numeric(12,2) default 150,
  status text not null default 'pendente',
  diagnostic_report text,
  proposed_quote numeric(12,2),
  declared_amount_by_provider numeric(12,2),
  declared_amount_by_client numeric(12,2),
  divergence_percent numeric(5,2),
  divergence_tier text,
  completion_otp text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TABELA DE AVALIAÇÕES E REPUTAÇÃO TÉCNICA
create table if not exists public.avaliacoes (
  id text primary key,
  order_id text,
  provider_id text not null,
  client_name text not null,
  client_avatar text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  tags text[] default array[]::text[],
  recommended boolean default true,
  service_name text,
  district text,
  photos text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TABELA DE NOTIFICAÇÕES
create table if not exists public.notificacoes (
  id text primary key,
  user_phone text,
  title text not null,
  body text not null,
  tone text default 'info',
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 10. SEGURANÇA E POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.prestadores enable row level security;
alter table public.pedidos enable row level security;
alter table public.transacoes enable row level security;
alter table public.pedidos_deposito enable row level security;
alter table public.pedidos_levantamento enable row level security;
alter table public.visitas_tecnicas enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.notificacoes enable row level security;

-- Políticas de acesso aberto (Anon / Public Access com API Key)
drop policy if exists "Acesso geral profiles" on public.profiles;
create policy "Acesso geral profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Acesso geral prestadores" on public.prestadores;
create policy "Acesso geral prestadores" on public.prestadores for all using (true) with check (true);

drop policy if exists "Acesso geral pedidos" on public.pedidos;
create policy "Acesso geral pedidos" on public.pedidos for all using (true) with check (true);

drop policy if exists "Acesso geral transacoes" on public.transacoes;
create policy "Acesso geral transacoes" on public.transacoes for all using (true) with check (true);

drop policy if exists "Acesso geral pedidos_deposito" on public.pedidos_deposito;
create policy "Acesso geral pedidos_deposito" on public.pedidos_deposito for all using (true) with check (true);

drop policy if exists "Acesso geral pedidos_levantamento" on public.pedidos_levantamento;
create policy "Acesso geral pedidos_levantamento" on public.pedidos_levantamento for all using (true) with check (true);

drop policy if exists "Acesso geral visitas_tecnicas" on public.visitas_tecnicas;
create policy "Acesso geral visitas_tecnicas" on public.visitas_tecnicas for all using (true) with check (true);

drop policy if exists "Acesso geral avaliacoes" on public.avaliacoes;
create policy "Acesso geral avaliacoes" on public.avaliacoes for all using (true) with check (true);

drop policy if exists "Acesso geral notificacoes" on public.notificacoes;
create policy "Acesso geral notificacoes" on public.notificacoes for all using (true) with check (true);

-- Criar índices de alta performance para buscas frequentes
create index if not exists idx_pedidos_provider on public.pedidos(provider_id);
create index if not exists idx_pedidos_status on public.pedidos(status);
create index if not exists idx_transacoes_user on public.transacoes(user_phone);
create index if not exists idx_prestadores_category on public.prestadores(category_slug);
