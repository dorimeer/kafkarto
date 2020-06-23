
CREATE DATABASE IF NOT EXISTS darina DEFAULT CHARACTER SET utf8;
use darina;

DROP TABLE IF EXISTS coffee;
DROP TABLE IF EXISTS additions;

DROP TABLE IF EXISTS shop;
CREATE TABLE shop (
    id int unsigned NOT NULL AUTO_INCREMENT,
    name varchar(64) CHARACTER SET utf8 NOT NULL,
    latitude DECIMAL(11,7) NOT NULL,
    longitude DECIMAL(11,7) NOT NULL,
    url varchar(64) CHARACTER SET utf8,
    address varchar(64) CHARACTER SET utf8,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET utf8;

DROP TABLE IF EXISTS coffee_type;
CREATE TABLE coffee_type (
    id int unsigned NOT NULL AUTO_INCREMENT,
    name varchar(64) CHARACTER SET utf8 NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET utf8;

DROP TABLE IF EXISTS additions_type;
CREATE TABLE additions_type (
    id int unsigned NOT NULL AUTO_INCREMENT,
    name varchar(64) CHARACTER SET utf8 NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET utf8;

CREATE TABLE coffee (
    shop int unsigned NOT NULL,
    coffee_type int unsigned NOT NULL,
    price DECIMAL(7,2) NOT NULL,
    CONSTRAINT fk_coffee_shop FOREIGN KEY (shop) REFERENCES shop (id),
    CONSTRAINT fk_coffee_coffee_type FOREIGN KEY (coffee_type) REFERENCES coffee_type (id)
) ENGINE=InnoDB DEFAULT CHARSET utf8;

CREATE TABLE additions (
    shop int unsigned NOT NULL,
    additions_type int unsigned NOT NULL,
    price DECIMAL(7,2) NOT NULL,
    CONSTRAINT fk_additions_shop FOREIGN KEY (shop) REFERENCES shop (id),
    CONSTRAINT fk_additions_additions_type FOREIGN KEY (additions_type) REFERENCES additions_type (id)
) ENGINE=InnoDB DEFAULT CHARSET utf8;


