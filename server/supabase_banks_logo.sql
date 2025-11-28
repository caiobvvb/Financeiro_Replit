alter table public.banks add column if not exists logo_url text;
create unique index if not exists idx_banks_code_unique on public.banks(code);

insert into public.banks (code, name, short_name, slug, color, logo_url) values
('001','Banco do Brasil','BB','banco-do-brasil','#ffcc00','https://logo.clearbit.com/bancodobrasil.com.br'),
('341','Itaú Unibanco','Itaú','itau','#ff6600','https://logo.clearbit.com/itau.com.br'),
('237','Bradesco','Bradesco','bradesco','#cc0000','https://logo.clearbit.com/bradesco.com.br'),
('033','Santander','Santander','santander','#c8102e','https://logo.clearbit.com/santander.com.br'),
('104','Caixa','Caixa','caixa','#0b63ce','https://logo.clearbit.com/caixa.gov.br'),
('260','Nubank','Nubank','nubank','#8309fd','https://logo.clearbit.com/nubank.com.br'),
('077','Banco Inter','Inter','inter','#ff6e00','https://logo.clearbit.com/inter.co'),
('208','BTG Pactual','BTG','btg','#001e3c','https://logo.clearbit.com/btg.com.br'),
('336','C6 Bank','C6','c6','#000000','https://logo.clearbit.com/c6bank.com.br'),
('748','Sicredi','Sicredi','sicredi','#39a935','https://logo.clearbit.com/sicredi.com.br')
on conflict (code) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  slug = excluded.slug,
  color = excluded.color,
  logo_url = excluded.logo_url;
