alter table messages
  add column if not exists sender_type text;

update messages
set sender_type = case when role = 'user' then 'customer' else 'ai' end
where sender_type is null;

alter table messages
  alter column sender_type set default 'ai';

alter table messages
  add column if not exists read_at timestamp with time zone;

alter table messages
  drop constraint if exists messages_sender_type_check;

alter table messages
  add constraint messages_sender_type_check
  check (sender_type in ('customer', 'ai', 'owner'));

create index if not exists idx_messages_unread
  on messages(conversation_id, read_at)
  where sender_type = 'customer' and read_at is null;
