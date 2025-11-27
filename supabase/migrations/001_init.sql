create extension if not exists pgcrypto;

create table if not exists users (
  id varchar primary key default gen_random_uuid(),
  username text not null unique,
  password text not null
);
