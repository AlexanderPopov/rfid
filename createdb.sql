DROP TABLE IF EXISTS region;
CREATE TABLE region (
	id integer primary key not null, 
	name text, 
	currency text
);

DROP TABLE IF EXISTS firm;
CREATE TABLE firm (
	id integer primary key not null,
	name text not null,
	account real default 0.0,
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
