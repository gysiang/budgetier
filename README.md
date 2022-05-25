# Budgetier

![budgetier logo](./public/images/logo_transparent.png)

A expenses tracking app for the budget conscious travellers.

**DEMO** : [https://youtu.be/uwQAM_rj1d8](https://youtu.be/uwQAM_rj1d8)
**Heroku** : [https://guarded-hollows-16773.herokuapp.com/](https://guarded-hollows-16773.herokuapp.com/)

#### Why I created this app

I will normally set a fixed budget before I travel for vacation. I don't want to mess with my usual daily expenses system and I want to be able to keep my vacation spending within the fixed budget I set before hand. Therefore, this app was born.

#### Features

- Individual accounts for each user
- Each user can create vacations and can invite others who have signed up to join their vacation
- Chart that tracks expenses per day
- See how much you spent in one go on the vacation

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
- [express-session](https://www.npmjs.com/package/express-session)
- [connect-flash](https://www.npmjs.com/package/connect-flash)

#### Other Resources Used

- [Bootstrap 4.6](https://getbootstrap.com/) for UI
- [PostgreSQL](https://www.postgresql.org/) for database
- [LucidChart](https://www.lucidchart.com/pages/) for ERD and UFD creation
- [Uizard](https://uizard.io/) for Wireframe mockup
- [Google Material Icons](https://fonts.google.com/icons)

#### Setup Instructions

1. Create a DB in psql with database name `budgetier`
2. Run npm script to create tables - `npm run db:create`
3. Launch app locally by running `nodemon app.js`
4. Go to url - `localhost:3004/
5. Create your own account
6. Test and navigate app

#### Wireframe

- [Uizard Wireframe](https://app.uizard.io/p/8567cea1) for Wireframe mockup

#### Entity Relationship Diagram (ERD)

![Budgetier ERD](https://raw.githubusercontent.com/gysiang/budgetier/main/public/images/budgetier_erd.png)

#### User Flow

![Budgetier User Flow](https://raw.githubusercontent.com/gysiang/budgetier/main/public/images/budgetier_userflow.png)
