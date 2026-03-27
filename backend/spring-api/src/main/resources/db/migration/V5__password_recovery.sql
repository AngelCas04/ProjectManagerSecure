alter table app_user
    add column if not exists recovery_phrase_hash varchar(120),
    add column if not exists recovery_phrase_issued_at timestamp with time zone;

create table if not exists password_recovery_token (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    user_id uuid not null references app_user(id) on delete cascade,
    token_hash varchar(128) not null unique,
    expires_at timestamp with time zone not null,
    consumed_at timestamp with time zone,
    requested_by_ip varchar(60) not null,
    requested_user_agent varchar(255) not null
);

create index if not exists idx_password_recovery_user on password_recovery_token (user_id);
create index if not exists idx_password_recovery_hash on password_recovery_token (token_hash);
