-- Neko Pro investors (HackMeridian): a connected wallet whitelisted by an
-- approved Didit KYC/KYB verification. Gates the Pro opportunities page.
-- Unlike launchpad_accounts there is no Privy user or embedded wallet: the
-- investor keeps the wallet they connected to Neko Web.
-- Written only by neko-backend (domains/launchpad) with the service-role key.
-- Idempotent: safe to re-run.

create table if not exists public.launchpad_investors (
  id               uuid primary key default gen_random_uuid(),
  wallet_address   text not null unique,
  verification_id  uuid not null unique
                   references public.launchpad_verifications(id) on delete restrict,
  network          text not null default 'testnet' check (network in ('testnet', 'mainnet')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists launchpad_investors_touch_updated_at on public.launchpad_investors;
create trigger launchpad_investors_touch_updated_at
  before update on public.launchpad_investors
  for each row execute function public.tg_touch_updated_at();

alter table public.launchpad_investors enable row level security;

revoke all on public.launchpad_investors from anon, authenticated, public;
