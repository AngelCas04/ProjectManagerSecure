alter table work_group
    add column if not exists focus varchar(80) not null default '',
    add column if not exists visibility varchar(30) not null default 'Restricted',
    add column if not exists cadence varchar(60) not null default 'Semanal';

update work_group
set focus = case
        when btrim(coalesce(focus, '')) = '' then name
        else focus
    end,
    visibility = case
        when btrim(coalesce(visibility, '')) = '' then 'Restricted'
        else visibility
    end,
    cadence = case
        when btrim(coalesce(cadence, '')) = '' then 'Semanal'
        else cadence
    end;

create table if not exists work_group_project (
    work_group_id uuid not null references work_group(id) on delete cascade,
    project_id uuid not null references project_workspace(id) on delete cascade,
    primary key (work_group_id, project_id)
);

create index if not exists idx_work_group_project_project on work_group_project (project_id);

insert into work_group_project (work_group_id, project_id)
select distinct
    wgm.work_group_id,
    pm.project_id
from work_group_member wgm
join project_member pm
    on pm.user_id = wgm.user_id
where wgm.status = 'ACTIVE'
  and pm.status = 'ACTIVE'
on conflict do nothing;
