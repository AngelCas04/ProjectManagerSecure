create extension if not exists pgcrypto;

create table if not exists chat_room (
    id uuid primary key,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    work_group_id uuid not null references work_group(id) on delete cascade,
    project_id uuid unique references project_workspace(id) on delete cascade,
    created_by_user_id uuid not null references app_user(id) on delete cascade,
    code varchar(40) not null unique,
    name varchar(120) not null,
    slug varchar(120) not null,
    description varchar(600),
    default_room boolean not null default false
);

create unique index if not exists idx_chat_room_group_slug on chat_room (work_group_id, slug);
create index if not exists idx_chat_room_group_created on chat_room (work_group_id, created_at);
create index if not exists idx_chat_room_project on chat_room (project_id);

alter table chat_message add column if not exists room_id uuid;
alter table chat_message alter column project_id drop not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'fk_chat_message_room'
    ) then
        alter table chat_message
            add constraint fk_chat_message_room
            foreign key (room_id) references chat_room(id) on delete cascade;
    end if;
end $$;

create index if not exists idx_chat_message_room_created on chat_message (room_id, created_at);

insert into chat_room (id, created_at, updated_at, work_group_id, project_id, created_by_user_id, code, name, slug, description, default_room)
select
    gen_random_uuid(),
    now(),
    now(),
    wg.id,
    p.id,
    p.owner_id,
    wg.code || '-ROOM-' || lpad(row_number() over (partition by wg.id order by p.created_at asc)::text, 2, '0'),
    coalesce(nullif(btrim(p.name), ''), 'General'),
    lower(regexp_replace(coalesce(nullif(btrim(p.code), ''), 'project'), '[^a-zA-Z0-9]+', '-', 'g')),
    'Sala principal del proyecto.',
    true
from project_workspace p
join lateral (
    select wg.id, wg.code
    from work_group wg
    where wg.owner_id = p.owner_id
    order by wg.created_at asc
    limit 1
) wg on true
where not exists (
    select 1
    from chat_room cr
    where cr.project_id = p.id
);

update chat_message m
set room_id = cr.id
from chat_room cr
where m.room_id is null
  and m.project_id = cr.project_id;
