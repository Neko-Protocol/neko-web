-- Accounts, identities and wallets for the Privy smart wallet (SCF #45 T1).
--
-- Additive only: public.users is untouched and keeps serving every existing
-- wallet-first user. Moving those rows into accounts is a later migration.
--
-- Rule: provider ids (Privy DIDs, Privy wallet ids) live ONLY in
-- account_identities.provider_subject and wallets.provider_wallet_id. Every
-- other table references accounts.id / wallets.id, so a provider can be
-- swapped without touching them.

create table if not exists public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  display_name       text,
  country            text,
  locale             text,
  terms_version      text,
  terms_accepted_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists accounts_email_idx
  on public.accounts (lower(email))
  where email is not null;

create table if not exists public.account_identities (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id) on delete cascade,
  provider          text not null,
  provider_subject  text not null,
  email             text,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  unique (provider, provider_subject)
);

create index if not exists account_identities_account_idx
  on public.account_identities (account_id);

create table if not exists public.wallets (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.accounts(id) on delete cascade,
  chain               text not null default 'stellar' check (chain in ('stellar')),
  network             text not null check (network in ('testnet', 'mainnet')),
  address             text not null,
  kind                text not null check (kind in ('embedded', 'external')),
  provider            text,
  provider_wallet_id  text,
  is_primary          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (chain, network, address)
);

create index if not exists wallets_account_idx
  on public.wallets (account_id);

-- At most one primary wallet per account and network.
create unique index if not exists wallets_one_primary_idx
  on public.wallets (account_id, chain, network)
  where is_primary;

-- One row per wallet and network: the sponsored activation of that account
-- on chain. Named wallet_activations to stay clear of the unrelated
-- activations / activation_participants campaign tables (0012).
create table if not exists public.wallet_activations (
  id               uuid primary key default gen_random_uuid(),
  wallet_id        uuid not null references public.wallets(id) on delete cascade,
  network          text not null check (network in ('testnet', 'mainnet')),
  -- Null when the account was already usable on chain without our sponsor.
  sponsor_address  text,
  status           text not null check (status in ('pending', 'activated', 'failed')),
  tx_hash          text,
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (wallet_id, network)
);

drop trigger if exists accounts_touch_updated_at on public.accounts;
create trigger accounts_touch_updated_at
  before update on public.accounts
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists wallets_touch_updated_at on public.wallets;
create trigger wallets_touch_updated_at
  before update on public.wallets
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists wallet_activations_touch_updated_at on public.wallet_activations;
create trigger wallet_activations_touch_updated_at
  before update on public.wallet_activations
  for each row execute function public.tg_touch_updated_at();

-- Server-only access through the backend's service-role key, same as users.
alter table public.accounts enable row level security;
alter table public.account_identities enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_activations enable row level security;
