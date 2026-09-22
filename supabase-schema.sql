-- ==============================================================================
-- KONEKTA CONNECT (São Tomé e Príncipe) - Esquema de Base de Dados Supabase
-- Copie e cole este código no SQL Editor do seu projeto Supabase e clique em "RUN"
-- ==============================================================================

-- 1. Tabela de Perfis de Utilizadores
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  role text not null check (role in ('cliente', 'prestador', 'ambos')),
  district text default 'Água Grande',
  city text default 'São Tomé',
  avatar_url text,
  rating numeric(3,2) default 5.0,
  completed_jobs integer default 0,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Pedidos de Serviço
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  client_phone text not null,
  client_name text not null,
  title text not null,
  category text not null,
  description text not null,
  budget numeric(12,2) not null,
  urgency text not null default 'normal',
  status text not null default 'pendente' check (status in ('pendente', 'em_progresso', 'aguardando_validacao', 'concluido', 'cancelado')),
  district text not null default 'Água Grande',
  location text,
  preferred_date text,
  preferred_time text,
  pin_code text,
  assigned_provider_phone text,
  escrow_amount numeric(12,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Transações e Movimentos de Carteira
create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_phone text not null,
  type text not null check (type in ('deposito', 'bloqueio_custodia', 'liberacao_prestador', 'reembolso', 'taxa_comissao', 'levantamento')),
  amount numeric(12,2) not null,
  status text not null default 'concluido' check (status in ('pendente', 'concluido', 'falhado', 'rejeitado')),
  reference text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar Row Level Security (RLS) nas Tabelas
alter table public.profiles enable row level security;
alter table public.pedidos enable row level security;
alter table public.transacoes enable row level security;

-- Políticas de leitura e escrita públicas para arranque do protótipo
create policy "Acesso público de leitura em pedidos" on public.pedidos for select using (true);
create policy "Acesso público de inserção em pedidos" on public.pedidos for insert with check (true);
create policy "Acesso público de atualização em pedidos" on public.pedidos for update using (true);

create policy "Acesso público de leitura em perfis" on public.profiles for select using (true);
create policy "Acesso público de inserção em perfis" on public.profiles for insert with check (true);
create policy "Acesso público de atualização em perfis" on public.profiles for update using (true);

create policy "Acesso público de leitura em transações" on public.transacoes for select using (true);
create policy "Acesso público de inserção em transações" on public.transacoes for insert with check (true);
