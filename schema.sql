DROP SCHEMA IF EXISTS Weatherbook;
CREATE SCHEMA Weatherbook;
USE Weatherbook;

CREATE TABLE Weatherbook (
  wbID int unsigned not null auto_increment primary key,
  firstName varchar(255) not null default '',
  lastName varchar(255) not null default '',
  address varchar(255) not null default '',
  unique key (firstName, lastName, address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8, DEFAULT COLLATE=utf8_unicode_ci;
