-- Run this in Supabase Dashboard > SQL Editor (or via `supabase db push`).
-- All prices are stored in TOMAN.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories(id) on delete set null,
  name text not null,
  description text,
  price bigint not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  total bigint not null,
  shipping_fee bigint not null default 0,
  full_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  address text not null,
  postal_code text not null,
  authority text,
  ref_id text,
  tracking_code text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  name text not null,
  price bigint not null,
  quantity int not null check (quantity > 0),
  size text
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profile read own or admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profile update own" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- users may only change these columns (so nobody can make themselves admin)
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "products public read" on public.products for select
  using (is_active or public.is_admin());
create policy "products admin write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

create policy "orders read own or admin" on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
-- no insert policy: orders are created only through create_order()

create policy "items read own or admin" on public.order_items for select
  using (public.is_admin() or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ---------- Create order (prices are computed on the server) ----------
-- p_items: [{"product_id":1,"quantity":2,"size":"M"}]
-- p_shipping: {"full_name","phone","province","city","address","postal_code"}
create function public.create_order(p_items jsonb, p_shipping jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order_id bigint;
  v_total bigint := 0;
  v_fee bigint := 0;           -- change here for a flat shipping fee (Toman)
  it jsonb;
  p public.products;
  q int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'empty cart'; end if;

  insert into public.orders (user_id, total, shipping_fee, full_name, phone, province, city, address, postal_code)
  values (v_uid, 0, v_fee, p_shipping->>'full_name', p_shipping->>'phone', p_shipping->>'province',
          p_shipping->>'city', p_shipping->>'address', p_shipping->>'postal_code')
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'quantity')::int;
    select * into p from public.products where id = (it->>'product_id')::bigint and is_active;
    if not found then raise exception 'product not found'; end if;
    if q < 1 or p.stock < q then raise exception 'insufficient stock: %', p.name; end if;
    insert into public.order_items (order_id, product_id, name, price, quantity, size)
    values (v_order_id, p.id, p.name, p.price, q, nullif(it->>'size', ''));
    v_total := v_total + p.price * q;
  end loop;

  v_total := v_total + v_fee;
  update public.orders set total = v_total where id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'total', v_total);
end $$;
grant execute on function public.create_order(jsonb, jsonb) to authenticated;

-- ---------- Mark paid (only callable by the Edge Function / service role) ----------
create function public.mark_order_paid(p_order_id bigint, p_ref_id text) returns boolean
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found or o.status <> 'pending' then return false; end if;
  update public.products p set stock = greatest(p.stock - i.quantity, 0)
    from public.order_items i where i.order_id = p_order_id and i.product_id = p.id;
  update public.orders set status = 'paid', ref_id = p_ref_id, paid_at = now() where id = p_order_id;
  return true;
end $$;
revoke execute on function public.mark_order_paid(bigint, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(bigint, text) to service_role;

-- ---------- Storage bucket for product images ----------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict do nothing;

create policy "product images admin insert" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin update" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin delete" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
