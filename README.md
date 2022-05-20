# Budgetier

A expenses tracking app for the budget conscious travellers.

## Why I created this app

I will normally set a fixed budget before I travel for vacation. I don't want to mess with my usual daily expenses system and I want to be able to keep my vacation spending within the fixed budget I set before hand. Therefore, this app was born.

#### Libraries Used

- [express](https://www.npmjs.com/package/express)
- [pg](https://www.npmjs.com/package/pg)
- [method-override](https://www.npmjs.com/package/method-override)
- [jssha](https://www.npmjs.com/package/jssha)
- [cookier-parser](https://www.npmjs.com/package/cookie-parser)
- [EJS](https://ejs.co/)
- [Nodemon](https://www.npmjs.com/package/nodemon)
- [Moment.js](https://momentjs.com/)
- [chart.js](https://www.chartjs.org/)
- [fuse.js](https://fusejs.io/)

#### Other Resources Used

- [Bootstrap 4.6](https://getbootstrap.com/) for UI
- [PostgreSQL](https://www.postgresql.org/) for database
- [LucidChart](https://www.lucidchart.com/pages/) for ERD and UFD creation
- [Uizard](https://uizard.io/) for Wireframe mockup
- [Google Material Icons](https://fonts.google.com/icons)

## How to setup and run

### Setup Instructions

1. Create a DB in psql with database name `budgetier`
2. Run npm script to create tables and seed data - `npm run db:create` followed by `npm run db:seed`

### Run and Test

3. Launch app locally by running `nodemon app.js`
4. Go to url - `localhost:3004/
5. Create your own account
6. Test and navigate app
