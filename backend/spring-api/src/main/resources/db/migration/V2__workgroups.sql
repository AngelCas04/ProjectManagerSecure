create table if not exists work_group (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    code varchar(30) not null unique,
    name varchar(80) not null unique,
    description varchar(600) not null,
    owner_id uuid not null references app_user(id)
);

create table if not exists work_group_member (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    work_group_id uuid not null references work_group(id) on delete cascade,
    user_id uuid not null references app_user(id) on delete cascade,
    role varchar(20) not null,
    status varchar(20) not null,
    constraint uq_work_group_member unique (work_group_id, user_id)
);

create index if not exists idx_work_group_code on work_group (code);
create index if not exists idx_work_group_owner on work_group (owner_id);
create index if not exists idx_work_group_member_user on work_group_member (user_id);
create index if not exists idx_work_group_member_group on work_group_member (work_group_id, status);

with legacy_groups as (
    select distinct team
    from app_user
    where team is not null
      and btrim(team) <> ''
)
insert into work_group (
    id,
    created_at,
    updated_at,
    code,
    name,
    description,
    owner_id
)
select
    (
        substr(md5('grp:' || lower(legacy_groups.team)), 1, 8) || '-' ||
        substr(md5('grp:' || lower(legacy_groups.team)), 9, 4) || '-' ||
        substr(md5('grp:' || lower(legacy_groups.team)), 13, 4) || '-' ||
        substr(md5('grp:' || lower(legacy_groups.team)), 17, 4) || '-' ||
        substr(md5('grp:' || lower(legacy_groups.team)), 21, 12)
    )::uuid,
    now(),
    now(),
    upper(left(regexp_replace(legacy_groups.team, '[^A-Za-z0-9]+', '', 'g'), 20)) || '-' || upper(substr(md5(legacy_groups.team), 1, 4)),
    legacy_groups.team,
    'Imported from legacy team assignments.',
    (
        select owner_candidate.id
        from app_user owner_candidate
        where owner_candidate.team = legacy_groups.team
        order by owner_candidate.created_at asc
        limit 1
    )
from legacy_groups
on conflict (name) do nothing;

insert into work_group_member (
    id,
    created_at,
    updated_at,
    work_group_id,
    user_id,
    role,
    status
)
select
    (
        substr(md5('grp-member:' || lower(u.email) || ':' || lower(u.team)), 1, 8) || '-' ||
        substr(md5('grp-member:' || lower(u.email) || ':' || lower(u.team)), 9, 4) || '-' ||
        substr(md5('grp-member:' || lower(u.email) || ':' || lower(u.team)), 13, 4) || '-' ||
        substr(md5('grp-member:' || lower(u.email) || ':' || lower(u.team)), 17, 4) || '-' ||
        substr(md5('grp-member:' || lower(u.email) || ':' || lower(u.team)), 21, 12)
    )::uuid,
    now(),
    now(),
    g.id,
    u.id,
    case
        when u.role = 'ADMINISTRADOR' then 'LEAD'
        else 'MEMBER'
    end,
    'ACTIVE'
from app_user u
join work_group g
    on g.name = u.team
on conflict (work_group_id, user_id) do nothing;
