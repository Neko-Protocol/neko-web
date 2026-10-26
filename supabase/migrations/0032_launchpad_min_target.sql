-- Launchpad minimum raise (HackMeridian): the least a raise needs to go ahead.
-- Below it by the funding deadline the vault refunds investors.
-- Nullable so applications submitted before this column keep loading.
-- Idempotent: safe to re-run.

alter table public.launchpad_applications
  add column if not exists min_target numeric(18, 2);

alter table public.launchpad_applications
  drop constraint if exists launchpad_applications_min_target_check;
alter table public.launchpad_applications
  add constraint launchpad_applications_min_target_check
  check (min_target > 0 and min_target <= target_amount);
