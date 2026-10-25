-- Launchpad onboarding (HackMeridian): a Didit KYC/KYB verification, the
-- account created from it, and the Privy embedded Stellar wallet tied to both.
-- Written only by neko-backend (domains/launchpad) with the service-role key.
-- Separate from public.users on purpose: Launchpad identity starts at the
-- verification, not at a wallet connect.

create table if not exists public.launchpad_verifications (
  id                   uuid primary key default gen_random_uuid(),
  kind                 text not null check (kind in ('kyc', 'kyb')),
  provider             text not null check (provider in ('didit', 'mock')),
  provider_session_id  text unique,
  status               text not null default 'pending'
                       check (status in ('pending', 'in_progress', 'in_review', 'approved', 'declined', 'expired')),
  full_name            text,
  business_name        text,
  country              text,
  decision             jsonb,
  -- sha256 of the one-time token handed to the browser that started the
  -- session; required to read the verification or claim it.
  claim_token_hash     text not null,
  claimed_at           timestamptz,
  network              text not null default 'testnet' check (network in ('testnet', 'mainnet')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists launchpad_verifications_status_idx
  on public.launchpad_verifications (status);

create table if not exists public.launchpad_accounts (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  privy_user_id    text not null unique,
  display_name     text,
  verification_id  uuid not null unique
                   references public.launchpad_verifications(id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.launchpad_wallets (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.launchpad_accounts(id) on delete cascade,
  verification_id     uuid not null references public.launchpad_verifications(id) on delete restrict,
  chain               text not null default 'stellar' check (chain = 'stellar'),
  network             text not null check (network in ('testnet', 'mainnet')),
  address             text not null unique,
  kind                text not null default 'embedded' check (kind in ('embedded', 'external')),
  provider            text not null default 'privy',
  provider_wallet_id  text,
  funded_at           timestamptz,
  funding_tx_hash     text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists launchpad_wallets_account_idx
  on public.launchpad_wallets (account_id);
create index if not exists launchpad_wallets_verification_idx
  on public.launchpad_wallets (verification_id);

drop trigger if exists launchpad_verifications_touch_updated_at on public.launchpad_verifications;
create trigger launchpad_verifications_touch_updated_at
  before update on public.launchpad_verifications
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists launchpad_accounts_touch_updated_at on public.launchpad_accounts;
create trigger launchpad_accounts_touch_updated_at
  before update on public.launchpad_accounts
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists launchpad_wallets_touch_updated_at on public.launchpad_wallets;
create trigger launchpad_wallets_touch_updated_at
  before update on public.launchpad_wallets
  for each row execute function public.tg_touch_updated_at();

alter table public.launchpad_verifications enable row level security;
alter table public.launchpad_accounts enable row level security;
alter table public.launchpad_wallets enable row level security;

revoke all on public.launchpad_verifications from anon, authenticated, public;
revoke all on public.launchpad_accounts from anon, authenticated, public;
revoke all on public.launchpad_wallets from anon, authenticated, public;
