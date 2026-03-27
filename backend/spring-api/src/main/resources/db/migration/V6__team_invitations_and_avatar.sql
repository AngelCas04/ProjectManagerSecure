alter table app_user
    add column if not exists avatar_url varchar(200000);

create table if not exists work_group_invitation (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    work_group_id uuid not null references work_group(id) on delete cascade,
    invited_by_user_id uuid not null references app_user(id) on delete cascade,
    email varchar(190) not null,
    token_hash varchar(64) not null unique,
    role varchar(20) not null,
    expires_at timestamp with time zone not null,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone
);

create index if not exists idx_work_group_invitation_group_email
    on work_group_invitation (work_group_id, email);

delete from work_group_member
where user_id in (select id from app_user where name = 'Angel Recovery Test');

delete from refresh_token
where user_id in (select id from app_user where name = 'Angel Recovery Test');

delete from password_recovery_token
where user_id in (select id from app_user where name = 'Angel Recovery Test');

delete from login_attempt
where email in (select email from app_user where name = 'Angel Recovery Test');

delete from app_user
where name = 'Angel Recovery Test';
