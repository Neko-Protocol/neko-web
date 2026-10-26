-- Launchpad deployments (HackMeridian): the on-chain side of an approved
-- application once the issuer launches it. One row per application; `steps`
-- holds the tx hash of each launch step so a failed launch resumes where it
-- stopped. Also records each Neko Pro investor's on-chain identity.
-- Written only by neko-backend (domains/launchpad) with the service-role key.
-- Idempotent: safe to re-run.

create table if not exists public.launchpad_deployments (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null unique
                   references public.launchpad_applications(id) on delete cascade,
  vault_id         text not null unique,
  token_symbol     text not null,
  funding_deadline timestamptz not null,
  token            text,
  compliance       text,
  vault            text,
  status           text not null default 'launching'
                   check (status in ('launching', 'live', 'failed')),
  steps            jsonb not null default '{}'::jsonb,
  error            jsonb,
  launched_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists launchpad_deployments_status_idx
  on public.launchpad_deployments (status);

drop trigger if exists launchpad_deployments_touch_updated_at on public.launchpad_deployments;
create trigger launchpad_deployments_touch_updated_at
  before update on public.launchpad_deployments
  for each row execute function public.tg_touch_updated_at();

alter table public.launchpad_deployments enable row level security;

revoke all on public.launchpad_deployments from anon, authenticated, public;

alter table public.launchpad_investors
  add column if not exists identity_contract text,
  add column if not exists onchain_registered_at timestamptz;
