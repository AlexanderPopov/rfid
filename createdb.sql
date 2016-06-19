DROP TABLE IF EXISTS region;
CREATE TABLE region (
	id integer primary key not null, 
	name text, 
	currency text,
	coef real not null default 1.0,
	PIT real not null default 10.0,
	ANP real not null default 10.0
);
INSERT INTO region (name, currency, coef, PIT, ANP)
VALUES ('Государство', 'Базовая валюта', 1.0, 0.0, 0.0);

DROP TABLE IF EXISTS firm;
CREATE TABLE firm (
	id integer primary key not null,
	name text not null,
	account real default 0.0,
	account_number char(8) not null,
	region_id integer,
	type integer,

	foreign key(region_id) references region(id)
);

DROP TABLE IF EXISTS citizen;
CREATE TABLE citizen (
	card_id char(8) primary key not null,
	account_number char(8) not null,
	name text not null,
	last_name text not null,
	account real default 0.0,
	pension real default 0.0,
	region_id integer not null,

	foreign key(region_id) references region(id)
);

DROP TABLE IF EXISTS firm_citizen;
CREATE TABLE firm_citizen (
	citizen_id char(8) not null,
	firm_id integer not null,
	percent integer not null,

	foreign key(firm_id) references firm(id),
	foreign key(citizen_id) references citizen(id),
	primary key(citizen_id, firm_id)
);

DROP TABLE IF EXISTS transact;
CREATE TABLE transact (
	id integer primary key not null,
	sender char(8) null,
	sender_type integer not null,
	receiver char(8) null,
	receiver_type integer not null,
	dt integer,
	base_sum real not null,
	sender_sum real not null,
	receiver_sum real not null,
	sender_course real not null,
	receiver_course read not null,
	transaction_type integer,
	is_counted boolean not null default false
);


DROP TABLE IF EXISTS budget;
CREATE TABLE budget (
	region_id integer not null,
	account real not null,
	foreign key(region_id) references region(id)
);
INSERT INTO budget values(1, 100000);
