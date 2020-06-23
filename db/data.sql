use darina;

INSERT INTO coffee_type (id, name) VALUES (1, 'espresso');
INSERT INTO coffee_type (id, name) VALUES (2, 'americano');
INSERT INTO additions_type (id, name) VALUES (1, 'sugar');
INSERT INTO additions_type (id, name) VALUES (2, 'chocolate');

INSERT INTO shop (id, name, latitude, longitude, url, address) VALUES (1, 'Львівська Майстерня Шоколаду', 50.460268,30.610817, 'https://goo.gl/maps/mRkrupddqyBxCZap8', 'вулиця Будівельників, 40, Київ, 02000');
INSERT INTO shop (id, name, latitude, longitude, url, address) VALUES (2, 'Кав\'ярня Пітчер', 50.440812,30.435643, 'https://goo.gl/maps/sfxx9MHPCtdufMi47', 'вулиця Гарматна, 57, Київ');

INSERT INTO coffee (shop, coffee_type, price) VALUES (1, 1, 11);
INSERT INTO coffee (shop, coffee_type, price) VALUES (2, 2, 22);
INSERT INTO additions (shop, additions_type, price) VALUES (1, 1, 0);
INSERT INTO additions (shop, additions_type, price) VALUES (2, 2, 0);


