CREATE TABLE "user" (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password TEXT);

CREATE TABLE expense (id SERIAL PRIMARY KEY, name TEXT, user_id INTEGER, note_id INTEGER, group_id INTEGER, date DATE, created_at TIMESTAMP, amount NUMERIC);

CREATE TABLE note (id SERIAL PRIMARY KEY, description TEXT, expense_id INTEGER);

CREATE TABLE "group" (id SERIAL PRIMARY KEY, name TEXT, vacation_date DATE, days_of_vacation INTEGER, budget NUMERIC);

CREATE TABLE user_group (id SERIAL PRIMARY KEY, user_id INTEGER, group_id INTEGER);

INSERT INTO "group" (name, vacation_date, days_of_vacation, budget) VALUES ('Phuket trip', '2022-05-28', 5, '300');

INSERT INTO "group" (name, vacation_date, days_of_vacation, budget) VALUES ('Cruise trip', '2022-07-03', 3, '500');

INSERT INTO user_group (user_id,group_id) VALUES (1,1);
INSERT INTO user_group (user_id,group_id) VALUES (1,2);

ALTER TABLE expense RENAME COLUMN note_id to note;


SELECT vacation_date, days_of_vacation
FROM "group"
WHERE group_id = ${req.params.groupID}

run a loop, i<days_of_vacation

SELECT expense.amount, 
FROM expense
WHERE expense.group_id = ${req.params.groupID}
AND date = ($1 + i)

run a loop


