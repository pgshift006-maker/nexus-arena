-- =============================================
-- Nexus Arena — Schema inicial do banco de dados
-- =============================================

-- Escolas (tenant principal)
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null, -- código de convite para alunos/professores
  plan text not null default 'free', -- free | basic | pro
  created_at timestamptz default now()
);

-- Perfis dos usuários (extensão da auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  school_id uuid references schools on delete cascade,
  name text not null,
  role text not null default 'aluno', -- aluno | professor | admin
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Eventos (competições e gincanas)
create table events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools on delete cascade,
  created_by uuid not null references profiles,
  name text not null,
  description text,
  status text not null default 'aguardando', -- aguardando | ativo | encerrado
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Equipes dentro de um evento
create table teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Membros das equipes
create table team_members (
  team_id uuid references teams on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (team_id, user_id)
);

-- Confrontos entre equipes
create table matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  team_a_id uuid not null references teams,
  team_b_id uuid not null references teams,
  score_a int not null default 0,
  score_b int not null default 0,
  status text not null default 'aguardando', -- aguardando | ao_vivo | encerrado
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

-- Enquetes de confronto
create table polls (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches on delete cascade unique,
  question text not null default 'Quem vai ganhar?',
  is_open boolean not null default true,
  created_at timestamptz default now()
);

-- Votos nas enquetes
create table poll_votes (
  poll_id uuid references polls on delete cascade,
  user_id uuid references profiles on delete cascade,
  team_id uuid not null references teams,
  created_at timestamptz default now(),
  primary key (poll_id, user_id)
);

-- Posts do feed social
create table posts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools on delete cascade,
  event_id uuid references events on delete set null, -- null = feed geral da escola
  author_id uuid not null references profiles,
  content text not null,
  image_url text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz default now()
);

-- Hashtags dos posts
create table post_hashtags (
  post_id uuid references posts on delete cascade,
  tag text not null,
  primary key (post_id, tag)
);

-- Curtidas nos posts
create table post_likes (
  post_id uuid references posts on delete cascade,
  user_id uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Comentários nos posts
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  author_id uuid not null references profiles,
  content text not null,
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table schools enable row level security;
alter table profiles enable row level security;
alter table events enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table matches enable row level security;
alter table polls enable row level security;
alter table poll_votes enable row level security;
alter table posts enable row level security;
alter table post_hashtags enable row level security;
alter table post_likes enable row level security;
alter table comments enable row level security;

-- Usuários só veem dados da própria escola
create policy "school_isolation_profiles" on profiles
  for all using (
    school_id = (select school_id from profiles where id = auth.uid())
  );

create policy "school_isolation_events" on events
  for all using (
    school_id = (select school_id from profiles where id = auth.uid())
  );

create policy "school_isolation_posts" on posts
  for all using (
    school_id = (select school_id from profiles where id = auth.uid())
  );

-- =============================================
-- Realtime (habilitar para placar e enquetes ao vivo)
-- =============================================

alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table posts;
