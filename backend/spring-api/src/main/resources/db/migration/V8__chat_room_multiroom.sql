alter table chat_room
    drop constraint if exists chat_room_project_id_key;

drop index if exists idx_chat_room_project_default;

create unique index if not exists idx_chat_room_project_default
    on chat_room (project_id)
    where default_room is true;
