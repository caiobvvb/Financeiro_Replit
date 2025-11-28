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
-- Top 20 bancos do Brasil com logo_url do repositório Tgentil/Bancos-em-SVG (via jsDelivr)
insert into public.banks (code, name, short_name, slug, color, logo_url) values
('001','Banco do Brasil S.A','BB','banco-do-brasil','#ffcc00','https://cdn.jsdelivr.net/gh/Tgentil/Bancos-em-SVG@main/Banco%20do%20Brasil%20S.A/banco-do-brasil-sem-fundo.svg'),
('237','Bradesco S.A','Bradesco','bradesco','#cc0000','https://logo.clearbit.com/bradesco.com.br'),
('341','Itaú Unibanco S.A','Itaú','itau','#ff6600','https://logo.clearbit.com/itau.com.br'),
('033','Banco Santander Brasil S.A','Santander','santander','#c8102e','https://logo.clearbit.com/santander.com.br'),
('104','Caixa Econômica Federal','Caixa','caixa','#0b63ce','https://logo.clearbit.com/caixa.gov.br'),
('260','Nu Pagamentos S.A (Nubank)','Nubank','nubank','#8309fd','https://logo.clearbit.com/nubank.com.br'),
('077','Banco Inter S.A','Inter','inter','#ff6e00','https://logo.clearbit.com/inter.co'),
('208','Banco BTG Pactual','BTG','btg','#001e3c','https://logo.clearbit.com/btg.com.br'),
('336','Banco C6 S.A','C6','c6','#000000','https://logo.clearbit.com/c6bank.com.br'),
('748','Sicredi','Sicredi','sicredi','#39a935','https://logo.clearbit.com/sicredi.com.br'),
('756','Sicoob','Sicoob','sicoob','#0b5d2b',null),
('041','Banrisul','Banrisul','banrisul','#1e90ff',null),
('422','Banco Safra S.A','Safra','safra','#0a1a2b','https://logo.clearbit.com/safra.com.br'),
('212','Banco Original S.A','Original','original','#00c853','https://logo.clearbit.com/bancooriginal.com.br'),
('623','Banco PAN','PAN','pan','#0076ff','https://logo.clearbit.com/bancopan.com.br'),
('318','BMG','BMG','bmg','#ff6e00','https://logo.clearbit.com/bmg.com.br'),
('389','Banco Mercantil do Brasil','Mercantil','mercantil','#003399','https://logo.clearbit.com/mercantildobrasil.com.br'),
('707','Banco Daycoval','Daycoval','daycoval','#1a4f8b','https://logo.clearbit.com/daycoval.com.br'),
('102','XP Investimentos','XP','xp','#000000','https://logo.clearbit.com/xp.com.br'),
('655','Banco Votorantim (BV)','BV','bv','#00a651','https://logo.clearbit.com/bv.com.br')
on conflict (code) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  slug = excluded.slug,
  color = excluded.color,
  logo_url = excluded.logo_url;
