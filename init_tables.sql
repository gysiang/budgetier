CREATE TABLE IF NOT EXISTS "user" (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password TEXT);

CREATE TABLE IF NOT EXISTS expense (id SERIAL PRIMARY KEY, name TEXT, user_id INTEGER, note TEXT, group_id INTEGER, date DATE, created_at TIMESTAMP, amount NUMERIC);

CREATE TABLE IF NOT EXISTS note (id SERIAL PRIMARY KEY, description TEXT, expense_id INTEGER);

CREATE TABLE IF NOT EXISTS "group" (id SERIAL PRIMARY KEY, name TEXT, vacation_date DATE, days_of_vacation INTEGER, budget NUMERIC);

CREATE TABLE IF NOT EXISTS user_group (id SERIAL PRIMARY KEY, user_id INTEGER, group_id INTEGER);



