alter table chat_message
    add column if not exists chat_team varchar(80);

update chat_message m
set chat_team = coalesce(nullif(btrim(u.team), ''), 'General Delivery')
from app_user u
where m.author_id = u.id
  and (m.chat_team is null or btrim(m.chat_team) = '');

alter table chat_message
    alter column chat_team set not null;

create index if not exists idx_chat_team_project_created
    on chat_message (chat_team, project_id, created_at);
