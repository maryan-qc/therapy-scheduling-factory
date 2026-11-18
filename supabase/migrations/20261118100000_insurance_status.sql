-- Статус перевірки страхування клієнта (openspec/specs/insurance-status). Колонка читається разом із карткою (RLS
-- clients_select), а змінює її лише функція: authenticated не має UPDATE на clients.
alter table public.clients
  add column insurance_status text not null default 'not_set'
  constraint clients_insurance_status_check check (insurance_status in ('not_set', 'verified', 'not_accepted', 'private_pay'));

-- Порядок перевірок: роль → значення → клієнт існує (терапевт не вивідує, які id існують).
create or replace function public.set_insurance_status(p_client_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_staff()) then
    return jsonb_build_object('code', 'FORBIDDEN');
  end if;

  if p_status is null or p_status not in ('verified', 'not_accepted', 'private_pay') then
    return jsonb_build_object('code', 'INVALID_STATUS');
  end if;

  update public.clients set insurance_status = p_status where id = p_client_id;
  if not found then
    return jsonb_build_object('code', 'NOT_FOUND');
  end if;

  return jsonb_build_object('code', 'OK');
end;
$$;

revoke execute on function public.set_insurance_status(uuid, text) from public, anon;
grant execute on function public.set_insurance_status(uuid, text) to authenticated;
