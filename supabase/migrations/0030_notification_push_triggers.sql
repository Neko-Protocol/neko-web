-- On-chain outcome triggers for the mobile app's push notifications
-- (SCF #45 T1 D1).
--
-- tx_confirmed:        a transaction relayed through /v1/tx/submit succeeded.
-- vault_run:           the keeper invested or rebalanced a vault the wallet
--                      deposited into (at most once per vault per UTC day).
-- portfolio_valuation: daily valuation reminder for wallets with vault
--                      positions (at most once per UTC day).
--
-- They are in-app and push only, so mailing_messages is left unchanged.
--
-- admin_wallet_low_balance is kept: both Neko-Staging and Neko-Prod already
-- allow it in this constraint, although 0018 did not list it.
-- public.notifications.trigger_type has no check constraint, so it already
-- accepts the new values.
--
-- emit() only delivers a trigger that has an active message, so nothing is
-- sent for these until an admin creates and activates one per trigger.

alter table public.notification_messages
  drop constraint if exists notification_messages_trigger_type_check;

alter table public.notification_messages
  add constraint notification_messages_trigger_type_check
  check (trigger_type in (
    'signup','first_deposit','swap_completed',
    'inactivity','referral_confirmed','admin_wallet_low_balance',
    'tx_confirmed','vault_run','portfolio_valuation'
  ));
