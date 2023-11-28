-- Table: public.bank_account

-- DROP TABLE IF EXISTS public.bank_account;

CREATE TABLE IF NOT EXISTS public.bank_account
(
    id integer NOT NULL DEFAULT nextval('bank_account_id_seq'::regclass),
    "number" integer,
    sum integer,
    blocked bit(1),
    CONSTRAINT bank_account_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.bank_account
    OWNER to postgres;