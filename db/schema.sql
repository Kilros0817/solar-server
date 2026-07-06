-- Template tables for solar-server
-- These tables store user-created contract, section, and clause templates

-- Drop tables in reverse dependency order
drop table if exists contract_templates;
drop table if exists section_templates;
drop table if exists clause_templates;

-- Clause Templates table
create table clause_templates (
  id serial primary key,
  template_id text unique not null,
  name text not null,
  description text not null,
  content text not null,
  category text not null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- Create indexes for clause template queries
create index idx_clause_templates_template_id on clause_templates(template_id);
create index idx_clause_templates_category on clause_templates(category);
create index idx_clause_templates_name on clause_templates(name);

-- Section Templates table
create table section_templates (
  id serial primary key,
  template_id text unique not null,
  section_name text not null,
  name text not null,
  description text not null,
  category text not null,
  clause_ids text[] default '{}',
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- Create indexes for section template queries
create index idx_section_templates_template_id on section_templates(template_id);
create index idx_section_templates_section_name on section_templates(section_name);
create index idx_section_templates_category on section_templates(category);
create index idx_section_templates_name on section_templates(name);

-- Contract Templates table
create table contract_templates (
  id serial primary key,
  template_id text unique not null,
  name text not null,
  description text not null,
  category text not null,
  created_by text not null,
  section_ids text[] default '{}',
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- Create indexes for contract template queries
create index idx_contract_templates_template_id on contract_templates(template_id);
create index idx_contract_templates_category on contract_templates(category);
create index idx_contract_templates_name on contract_templates(name);
