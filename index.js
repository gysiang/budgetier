import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';
import cookieParser from 'cookie-parser';
import moment from 'moment';
import flash from 'connect-flash' 
import session from 'express-session';

const SALT = 'Milk is delicious';

import { getHash , getDateLabel, getExpenseDate } from './helper.js'

const app = express();

const PORT =  process.env.PORT || 3004;

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'secret',
  cookie: {maxAge: 60000},
  resave: true,
  saveUninitialized:true
}));
app.use(flash());

// Initialise DB connection
const { Pool } = pg;
let pgConnectionConfigs;
if (process.env.DATABASE_URL) {
  // pg will take in the entire value and use it to connect
  pgConnectionConfigs = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
const pgConnectionConfigs = {
  user: 'gysiang',
  host: 'localhost',
  database: 'budgetier',
  port: 5432, // Postgres server always runs on this port by default
  };
}
const pool = new Pool(pgConnectionConfigs);

/**
 * checks and sets login status to restrict certain routes to unly be usable by logged-in users
 * compares the existing hash cookie to a resh hash of the raw userId cookie to verify that no changes were made by the user
 * @param {*} req - request as sent by client
 * @param {*} res - response as sent by server
 * @param {func} next - next function to execute
 */
const loginCheck = (req, res, next) => {
  if (!req.cookies.loggedInHash) {
    req.session.message="Please login again!"
    res.redirect('/login');
  }
  // set the default value
  req.isUserLoggedIn = false;

  // check to see if the cookies you need exists
  if (req.cookies.userID) {
      req.isUserLoggedIn = true;
    }
  next();
};

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  console.log('request to signup came in');
  console.log(req.body)
  const { name, email, password } = req.body;

  // get the hashed password as output from the SHA object
  const hashedPassword = getHash(password);

  const signupvalue = [name, email, hashedPassword];
  const query = 'INSERT INTO "user" (name, email, password) VALUES ($1, $2, $3)';

  pool
    .query(query, signupvalue)
    .then((result) => {
      req.flash("msg","Signup Success!");
      res.locals.messages = req.flash(); 
      res.redirect('/login')
    })
    .catch((error) => {
      console.log('Error on Signup')
      console.log('error.message');
  })
})

app.get('/login', (req, res)=> {
  res.render('login');
})

app.post('/login', (req, res) => {

  const {email, password } = req.body;

  const hashedPassword = getHash(password);

  const loginValues = [email, hashedPassword];

  pool
    .query('SELECT * from "user" WHERE email=$1 AND password=$2', loginValues)
    .then((result) => {
    const user = result.rows[0];
    const unhashedCookieString = `${user.email}-${SALT}`;

    if (user.password !== hashedPassword) {
      res.redirect('/login')
      return;
    }
      res.cookie('loggedInHash', getHash(unhashedCookieString));
      res.cookie('userID', user.id);
      res.redirect('/dashboard');
  })
  .catch((error) => {
    req.flash("msg","Wrong Email or Password");
    res.locals.messages = req.flash();    
    res.render('login');
    return
  })
});

app.delete('/logout', (request, response) => {
  response.clearCookie('loggedInHash');
  response.clearCookie('userID');
  response.redirect('/');
});

app.get('/user-profile', (request, response) => {
  const userValue = [request.cookies.userID];

  pool
    .query('SELECT * from "user" WHERE "user".id = $1', userValue)
    .then((result) => {
      const data = {
        userData: result.rows[0],
      };   
      console.log(data);
      response.render('userprofile', data)
    })
    .catch((error) => {
      console.log('error getting user profile', error.stack);
  })
});


app.put('/user-profile/:userid/edit', (req, res) => {
  const { userid } = req.params;
  const { name, email,password } = req.body;
  
  const hashedPassword = getHash(password);

  const updatesqlquery = 'UPDATE "user" SET name = $1, password = $2, email = $3 WHERE id = $4';

  const updateprofilevalue = [name, hashedPassword, email, userid];
  pool
    .query(updatesqlquery, updateprofilevalue)
    .then((result) => {
      req.session.message="User Profile Successfully Updated!"
      res.redirect('/dashboard');
    })
    .catch((error) => {
      console.log('Error caught while updating user profile')
      console.log('error', error.stack)
    })
  });

app.get('/dashboard', loginCheck, (req,res) => {
  const userValue = [req.cookies.userID];
  let data = {};
  let groupArray = [];

  const userQuery = 'SELECT "user".name FROM "user" WHERE "user".id = $1'
  const groupQuery = 'SELECT group_id from user_group WHERE user_id =$1'

  // create the promise to get user name and group ids
  const result = Promise.all([
    pool.query(userQuery,userValue),
    pool.query(groupQuery,userValue)
  ])

  result.then((results)=> {
    const [userQueryResults, groupQueryResults] = results;

    data = {
      userData: userQueryResults.rows[0],
      group: groupQueryResults.rows,
      moment: moment,
      groupInfo: [],
      message: req.session.message
    };

    for (let i=0; i<data.group.length; i+=1){
      groupArray.push([data.group[i]['group_id']])
    }
    console.log(groupArray)
    const getGroupData = async (group) => {
      return await pool.query('SELECT * from "group" WHERE id = $1',group)
    }
    const groupDataResult = async (groupArray) => {
      for (let i=0;i<groupArray.length; i+=1){
        let groupQuery = await getGroupData(groupArray[i]);
        data.groupInfo.push(groupQuery.rows[0]);
      }
      res.render('dashboard', data);
    }
      groupDataResult(groupArray);
    })
    .catch((error) => {
    console.log('Error caught')
    console.log(error.stack)
  });
})

app.get('/newgroup', loginCheck, (req, res) => {
  res.render('new-group')
});

app.post('/newgroup',loginCheck, (req, res) => {
  const userValue = Number([req.cookies.userID]);
  console.log(req.body)

  const { name, date, days, budget } = req.body;

  const insertGroupQuery = 'INSERT INTO "group" (name, vacation_date, days_of_vacation, budget) VALUES ($1, $2, $3, $4) RETURNING id';

  const insertGroupValue = [name, date, days, budget];

  const insertUserGroupQuery = 'INSERT INTO user_group (user_id,group_id) VALUES ($1,$2)';

  pool
    .query(insertGroupQuery, insertGroupValue)
    .then((result) =>{
      // console.log(result.rows[0].id)
      const groupID = result.rows[0].id;
      const insertUserGroupValue = [userValue, groupID]
      pool.query(insertUserGroupQuery,insertUserGroupValue);
      res.redirect('/dashboard');
    })
    .catch((error) => {
      console.log('Insert Error', error.stack)
    })
  });

app.get('/dashboard/:groupid/edit',loginCheck, (req, res) => {

  const editgroupquery = 'SELECT * FROM "group" WHERE id = $1';

  pool
    .query(editgroupquery,[Number(req.params.groupid)])
    .then((result)=> {
    let data = {
          groupInfo : result.rows,
          moment: moment,
        };  
    res.render('edit-group', data);
  })
});

app.put('/dashboard/:groupid/edit',loginCheck, (req, res) => {
  const { groupid } = req.params;
  const { name, date, vacation_days, budget} = req.body;
  console.log(req.body)
  const updategroupquery = 'UPDATE "group" SET name = $1, vacation_date = $2, days_of_vacation = $3, budget = $4 where id = $5';

  const updategroupvalues = [name, date, vacation_days,budget,groupid]

  pool
    .query(updategroupquery,updategroupvalues)
    .then((result)=> {
      req.session.message = "Vacation is successfully updated!";
      res.redirect('/dashboard');
  })
    .catch((error) => {
    console.log('Group Update Error');
    console.error(error.message);
  })
});

app.delete('/dashboard/:groupid/delete',loginCheck, (req, res) => {
  console.log('incoming delete request')
  const deleteID = [req.params.groupid];
  
  const result = Promise.all([
    pool.query(`DELETE FROM "group" WHERE id= $1`,deleteID),
    pool.query('DELETE FROM user_group WHERE group_id = $1',deleteID),
    pool.query('DELETE FROM expense WHERE group_id = $1',deleteID)
  ])
  
    result.then((result)=> {
      req.session.message = "Vacation had been successfully deleted!";
      res.redirect('/dashboard')
    })
    .catch((error) => {
        console.log('ERROR CAUGHT');
        console.error(error.message);
      })
  });

app.get('/dashboard/:groupid',loginCheck, (req, res) => {
  const { groupid } = req.params;

  const viewgroupExpense = 'SELECT id,name, user_id, date, amount, note from expense WHERE group_id= $1';

  let data = {
      groupData: [],
      moment: moment,
      groupid:groupid,
      expense: [],
      message: req.session.message
  }
  const getExpensebyDay = async (array) => {
      return await pool.query('SELECT amount from expense WHERE date = $1',array)}

  const expensebyDayResult = async (querydateArray) => {
    const results = await Promise.all(querydateArray.map(async (querydateArray) => getExpensebyDay(querydateArray)))
    for (let i=0; i<querydateArray.length; i+=1){
    let dailysum=0;
    if (!results[i].rows.length){
      data['expense'].push(Number(0));
    } else {
      results[i]['rows'].forEach(element =>{
      dailysum += (Number(element.amount))
      }) 
      data['expense'].push(dailysum);
    } dailysum=0;}
      console.log(data)
      res.render('view-group', data)
  }

  pool
    .query('SELECT * from "group" WHERE id=$1',[groupid])
    .then((result) => {
        data['groupInfo'] = result.rows[0]

        const dateLabel = JSON.stringify(getDateLabel(data.groupInfo.vacation_date, data.groupInfo.days_of_vacation))
        data['label'] = dateLabel;

       const querydateArray = getExpenseDate(data.groupInfo.vacation_date, data.groupInfo.days_of_vacation)

       pool.query(viewgroupExpense,[groupid])
       .then((viewgroupExpenseResult) => {
        data['groupData'] = viewgroupExpenseResult.rows
        expensebyDayResult(querydateArray);
        })
       })
       .catch((error) => {
        console.log('ERROR CAUGHT');
        console.error(error.message);
  })
})

app.get('/dashboard/:groupid/new-expense/',loginCheck, (req, res) => {
  const { groupid } = req.params;

  const getGroupNameQuery = 'SELECT name, vacation_date, days_of_vacation from "group" WHERE id=$1'
  const getGroupNameValue = [groupid]

  pool.
    query(getGroupNameQuery,getGroupNameValue)
    .then((result) => {
      let data = {
        groupInfo: result.rows,
        groupid: groupid,
        moment:moment
      }
    console.log(data)
    res.render('new-expense', data)
  })
    .catch((error) => {
    console.log('ERROR CAUGHT');
    console.error(error.message);
  })
})

// create a new expense inside a group - post route
app.post('/dashboard/:groupid/new-expense/',loginCheck, (req, res) => {
  const { groupid } = req.params;
  const { userID } = req.cookies
  const  createddate  = new Date();
  const { name, date, amount, note} = req.body;

  const insertExpenseQuery = 'INSERT INTO expense (name, user_id, note, group_id, date, amount, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)';

  const getExpenseValue = [name, userID, note, groupid, date, amount, createddate]
  console.log(getExpenseValue)
  pool.query(insertExpenseQuery,getExpenseValue);
  req.session.message ="New expense successfully added"
  res.redirect(`/dashboard/${groupid}`);
})

// get route to add new users
app.get('/dashboard/:groupid/add-user/',loginCheck, (req, res) => {
  const { groupid } = req.params;

  const getGroupNameQuery = 'SELECT name, vacation_date, days_of_vacation from "group" WHERE id=$1'
  const getGroupNameValue = [groupid]

  const getUserEmailQuery = 'SELECT email from "user"'

  const result = Promise.all([
    pool.query(getGroupNameQuery,getGroupNameValue),
    pool.query(getUserEmailQuery)
  ])
  
   result.then((results)=> {
    const [getGroupNameResults, getUserEmailResults] = results;
  
    const data = {
      email: getUserEmailResults.rows,
      groupInfo: getGroupNameResults.rows,
      moment: moment,
      groupid: groupid,
    };
    res.render('add-user', data)
   })
})

// post route to add new users
app.post('/dashboard/:groupid/add-user/',loginCheck, (req, res) => {
  const { groupid } = req.params;
  const { email } = req.body;

  const userQuery = 'SELECT "user".id FROM "user" WHERE email=$1';
  const emailValue = [email]
  pool
  .query(userQuery,emailValue)
  .then((result)=>{
    const insertValue = [result.rows[0].id,groupid]
    pool.query('INSERT INTO user_group (user_id,group_id) VALUES ($1,$2)',insertValue)
    req.session.message ="New user successfully added"
    res.redirect(`/dashboard/${groupid}`)
  })
  .catch((error) => {
      console.log('INSERT ERROR CAUGHT');
      console.error(error.message);
  })
})

// edit individual expense inside a group
app.get('/dashboard/:groupid/:expenseid/edit',loginCheck, (req, res) => {
  const { groupid, expenseid } = req.params;
  
  const sqlQuery = 'SELECT * from expense WHERE group_id=$1 AND expense.id=$2';

  const getexpenseQuery = [groupid,expenseid]

  pool
    .query(sqlQuery,getexpenseQuery)
    .then((result)=> {
       let data = { 
         expenseInfo: result.rows[0],
         moment:moment
       }
      res.render('edit-expense', data);
    })
  .catch((error) => {
    console.log('ERROR CAUGHT')
    console.log(error.message);
  })
})

// update individual expense inside a group
app.put('/dashboard/:groupid/:expenseid/edit',loginCheck, (req, res) => {
  const { groupid, expenseid } = req.params;
  const { name, date, amount, note} = req.body;

  const updateExpenseValues = [name,date,amount,note,expenseid,groupid];

  const updateSQLQUERY = 'UPDATE expense SET name = $1, date= $2, amount= $3, note= $4 WHERE expense.id = $5 AND expense.group_id = $6'

  pool
    .query(updateSQLQUERY, updateExpenseValues)
    .then(() => {
      req.session.message="Expense updated successfully!"
      res.redirect(`/dashboard/${groupid}`);
    })  
    .catch((error) => {
    console.log('ERROR CAUGHT')
    console.log(error.message);
    })
  });

// delete individual expense inside a group
app.delete('/dashboard/:groupid/:expenseid/delete',loginCheck, (req, res) => {
  const { groupid, expenseid } = req.params;

  const deleteExpenseValues = [expenseid,groupid];

  const deleteSQLQUERY = 'DELETE FROM expense WHERE id = $1 AND group_id = $2'

  pool
    .query(deleteSQLQUERY, deleteExpenseValues)
    .then(() => {
      req.session.message = "Expense deleted successfully!"
      res.redirect(`/dashboard/${groupid}`);
    })  
    .catch((error) => {
    console.log('ERROR CAUGHT')
    console.log(error.message);
    })
  });

app.listen(process.env.PORT || PORT, ()=> console.log(`app is running at PORT ${PORT}...`));
