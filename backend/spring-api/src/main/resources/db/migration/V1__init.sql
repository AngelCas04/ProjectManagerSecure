create table if not exists app_user (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    name varchar(60) not null,
    email varchar(190) not null unique,
    password_hash varchar(120) not null,
    team varchar(60) not null,
    role varchar(30) not null,
    enabled boolean not null,
    last_login_at timestamp with time zone
);

create table if not exists project_workspace (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    code varchar(30) not null unique,
    name varchar(120) not null,
    domain varchar(60) not null,
    summary varchar(1200) not null,
    lead varchar(80) not null,
    risk varchar(20) not null,
    classification varchar(30) not null,
    permissions varchar(80) not null,
    due_date date not null,
    owner_id uuid not null references app_user(id)
);

create table if not exists project_member (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    project_id uuid not null references project_workspace(id) on delete cascade,
    user_id uuid not null references app_user(id) on delete cascade,
    role varchar(20) not null,
    status varchar(20) not null,
    constraint uq_project_member unique (project_id, user_id)
);

create table if not exists task_item (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    project_id uuid not null references project_workspace(id) on delete cascade,
    title varchar(140) not null,
    description varchar(2000) not null,
    priority varchar(20) not null,
    status varchar(20) not null,
    due_date date not null,
    assignee varchar(80) not null
);

create table if not exists calendar_entry (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    project_id uuid not null references project_workspace(id) on delete cascade,
    title varchar(120) not null,
    type varchar(20) not null,
    event_date date not null,
    event_time time not null,
    owner varchar(80) not null
);

create table if not exists chat_message (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    project_id uuid not null references project_workspace(id) on delete cascade,
    author_id uuid not null references app_user(id) on delete cascade,
    text varchar(800) not null
);

create table if not exists audit_event (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    project_id uuid references project_workspace(id) on delete cascade,
    scope varchar(60) not null,
    actor varchar(80) not null,
    description varchar(800) not null
);

create table if not exists refresh_token (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    user_id uuid not null references app_user(id) on delete cascade,
    token_hash varchar(128) not null unique,
    expires_at timestamp with time zone not null,
    revoked_at timestamp with time zone,
    created_by_ip varchar(60) not null,
    user_agent varchar(255) not null,
    replaced_by_ip varchar(60)
);

create table if not exists login_attempt (
    id uuid primary key,
    email varchar(190) not null,
    ip_address varchar(60) not null,
    success boolean not null,
    attempted_at timestamp with time zone not null
);

create index if not exists idx_user_email on app_user (email);
create index if not exists idx_project_code on project_workspace (code);
create index if not exists idx_task_project_status on task_item (project_id, status);
create index if not exists idx_calendar_project_date on calendar_entry (project_id, event_date);
create index if not exists idx_chat_project_created on chat_message (project_id, created_at);
create index if not exists idx_audit_project_created on audit_event (project_id, created_at);
create index if not exists idx_refresh_user on refresh_token (user_id);
create index if not exists idx_login_attempt_email_time on login_attempt (email, attempted_at);
