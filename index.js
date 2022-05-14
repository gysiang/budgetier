import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';
import cookieParser from 'cookie-parser';
import moment from 'moment';
const SALT = 'Milk is delicious';
 
import { getHash , loginCheck} from './helper.js'

const app = express();

const PORT =  process.env.PORT || 3004;

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'gysiang',
  host: 'localhost',
  database: 'budgetier',
  port: 5432, // Postgres server always runs on this port by default
};

const pool = new Pool(pgConnectionConfigs);


app.get('/', (request, response) => {
  response.render('index');
});

app.get('/signup', (request, response) => {
  response.render('signup');
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
      res.redirect('/login')
    })
    .catch((error) => {
      console.log('Error on Signup')
      console.log('error.message');
  })
})

app.get('/login', (request, response)=> {
  response.render('login');
})

app.post('/login', (req, res) => {

  const {email, password } = req.body;

  const hashedPassword = getHash(password);

  const loginValues = [email, hashedPassword];

  pool
    .query('SELECT * from "user" WHERE email=$1 AND password=$2', loginValues)
    .then((result) => {
    console.log(result);
    const user = result.rows[0];
    const unhashedCookieString = `${user.email}-${SALT}`;

    if (user.password !== hashedPassword) {
      res.status(403).send('Invalid Username or Password.');
      return;
    }
      res.cookie('loggedInHash', getHash(unhashedCookieString));
      res.cookie('userID', user.id);
      res.redirect('/dashboard');
  })
  .catch((error) => {
    console.log('Error executing query', error.stack);
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


app.put('/user-profile', (req, res) => {
  console.log(req.body);
  const { name, email,password } = req.body;

  const hashedPassword = getHash(password);

  const updatesqlquery = 'UPDATE "user" SET name = $1, password = $2 FROM "user" WHERE "user".email = $3';

  const updateprofilevalue = [name, hashedPassword, email];
  pool
    .query(updatesqlquery, updateprofilevalue)
    .then((result) => {
      res.redirect('/dashboard');
    })
    .catch((error) => {
      console.log('Error caught while updating user profile')
      console.log('error', error.stack)
    })
  });

app.get('/dashboard', (req,res) => {
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
      groupInfo: []
    };

    for (let i=0; i<data.group.length; i+=1){
      groupArray.push([data.group[i]['group_id']])
    }

    const getGroupData = async (group) => {
      return await pool.query('SELECT * from "group" WHERE id = $1',group)
    }
    const groupDataResult = async (groupArray) => {
      for (let i=0;i<groupArray.length; i+=1){
        let groupQuery = await getGroupData(groupArray[i]);
        data.groupInfo.push(groupQuery.rows[0]);
      }
      // console.log(data)
      res.render('dashboard', data);
    }
      groupDataResult(groupArray);
    })
    .catch((error) => {
    console.log('Error caught')
    console.log(error.stack)
  });
})

app.get('/newgroup', (req, res) => {
  res.render('new-group')
});

app.post('/newgroup', (req, res) => {
  const userValue = Number([req.cookies.userID]);
  console.log(req.body)

  const { name, date, vacation_days, budget } = req.body;

  const insertGroupQuery = 'INSERT INTO "group" (name, vacation_date, days_of_vacation, budget) VALUES ($1, $2, $3, $4) RETURNING id';

  const insertGroupValue = [name, date, vacation_days, budget];

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

app.get('/dashboard/:groupid/edit', (req, res) => {

  const editgroupquery = 'SELECT * FROM "group" WHERE id = $1';

  pool
    .query(editgroupquery,[Number(req.params.groupid)])
    .then((result)=> {
    let data = {
          groupInfo : result.rows,
          moment: moment,
        };
    console.log(moment(data.groupInfo[0].vacation_date).format("YYYY-MM-DD"))    
    res.render('edit-group', data);
  })
});

app.put('/dashboard/:groupid/edit', (req, res) => {
  const { groupid } = req.params;
  const { name, date, vacation_days, budget} = req.body;

  const updategroupquery = 'UPDATE "group" SET name = $1, vacation_date = $2, days_of_vacation = $3, budget = $4 where id = $5';

  const updategroupvalues = [name, date, vacation_days,budget,groupid]

  pool
    .query(updategroupquery,updategroupvalues)
    .then((result)=> {
      res.redirect('/dashboard');
  })
    .catch((error) => {
    console.log('Group Update Error');
    console.error(error.message);
  })
});

app.delete('/dashboard/:groupid/delete', (req, res) => {
  console.log(req.params)
  console.log('incoming delete request')
  const deleteID = [req.params.groupid];
  const deleteQuery = `DELETE FROM "group" WHERE id= $1`;
  pool
    .query(deleteQuery, deleteID)
    .then((result) => {
      pool.query('DELETE FROM user_group WHERE group_id = $1',deleteID)
      res.redirect('/dashboard')
    })
    .catch((error) => {
        console.log('ERROR CAUGHT');
        console.error(error.message);
      })
  });

app.get('/dashboard/:groupid', (req, res) => {
  const { groupid } = req.params;

  const viewgroupQuery = 'SELECT expense.id,expense.name, "group".name AS group_name, user_id, date, amount, note from expense INNER JOIN "group" ON group_id = "group".id WHERE group_id= $1';

  pool
    .query(viewgroupQuery,[groupid])
    .then((result) => {
      let data = {
        groupInfo: result.rows,
        moment: moment,
        groupid:groupid
      }
      console.log(data);
      res.render('view-group', data)
    })
      .catch((error) => {
        console.log('ERROR CAUGHT');
        console.error(error.message);
    })
  })

app.get('/dashboard/:groupid/new-expense/', (req, res) => {
  const { groupid } = req.params;

  const getGroupNameQuery = 'SELECT name from "group" WHERE id=$1'
  const getGroupNameValue = [groupid]

  pool.
    query(getGroupNameQuery,getGroupNameValue)
    .then((result) => {
      let data = {
        groupInfo: result.rows,
        groupid: groupid
      }
    console.log(data)
    res.render('new-expense', data)
  })
})


// create a new expense inside a group - post route
app.post('/dashboard/:groupid/new-expense/', (req, res) => {
  const { groupid } = req.params;
  const userID = Number(req.cookies.userID);

  const { name, date, amount, note} = req.body;

  const insertExpenseQuery = 'INSERT INTO expense (name, user_id, note, group_id, date, amount) VALUES ($1, $2, $3, $4, $5, $6)';

  const getExpenseValue = [name, userID, note, groupid, date, amount]
  pool.query(insertExpenseQuery,getExpenseValue);
  res.redirect(`/dashboard/'${groupid}'`)

  .catch((error) => {
        console.log('INSERT ERROR CAUGHT');
        console.error(error.message);
  })
})

// edit individual expense inside a group
app.get('/dashboard/:groupid/:expenseid/edit', (req, res) => {
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
app.put('/dashboard/:groupid/:expenseid/edit', (req, res) => {
  const { groupid, expenseid } = req.params;
  const { name, date, amount, note} = req.body;

  const updateExpenseValues = [name,date,amount,note,expenseid,groupid];

  const updateSQLQUERY = 'UPDATE expense SET name = $1, date= $2, amount= $3, note= $4 WHERE expense.id = $5 AND expense.group_id = $6'

  pool
    .query(updateSQLQUERY, updateExpenseValues)
    .then(() => {
      res.redirect(`/dashboard/${groupid}`);
    })  
    .catch((error) => {
    console.log('ERROR CAUGHT')
    console.log(error.message);
    })
  });


//create a function to get the days //

// 1. pool.query('SELECT * from "group" where id=1)
// 2. obtain vacation day and days of vacation from this
// 3. get an array of all the dates of the vacation,
// eg. for (let i=0; i< days_of_vacation){
//  dateArray.push(moment(vacation_date,DD-MM-YYYY).add(i,'days')
//}


//create a function to get the total amount spend for each day for each group//

//1. pool.query('SELECT * from expense WHERE group_id =$1 AND date = $2)
//2. do a async and promise.all to run all the promises at the same time and return one array with all the amounts from the different dates



app.listen(PORT, ()=> console.log(`app is running at PORT ${PORT}...`));
