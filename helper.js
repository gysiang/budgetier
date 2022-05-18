import jsSHA from 'jssha';
const SALT = 'Milk is delicious';
import moment from 'moment';


/**
 * hashes an input string according to the salt variable
 * @param {string} input
 * @return {string} - hashed string result after hashing and salting
 */
export const getHash = (input) => {
  // create new SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // create an unhashed cookie string based on user ID and salt
  const unhashedString = `${input}-${SALT}`;
  // generate a hashed cookie string using SHA object
  shaObj.update(unhashedString);
  return shaObj.getHash('HEX');
};

/**
 * checks and sets login status to restrict certain routes to unly be usable by logged-in users
 * compares the existing hash cookie to a resh hash of the raw userId cookie to verify that no changes were made by the user
 * @param {*} req - request as sent by client
 * @param {*} res - response as sent by server
 * @param {func} next - next function to execute
 */
const loginCheck = (req, res, next) => {
  if (!req.cookies.loggedInHash) {
    res.redirect('/login', { message: 'Please log in to continue.' });
  }
  // set the default value
  req.isUserLoggedIn = false;

  // check to see if the cookies you need exists
  if (req.cookies.userID) {
      req.isUserLoggedIn = true;
      app.locals.userID = req.cookies.userID;
    }
  next();
};

export const getDateLabel = (vacation_date, days) => {
let dateArray = [];
for (let i=0; i<days; i+=1){
  dateArray.push(moment(vacation_date).add(i, 'days').format("DD MMM YY"))
  }
  return dateArray;
} 

export const getExpenseDate = (vacation_date, days) => {
let dateArray = [];
for (let i=0; i<days; i+=1){
  dateArray.push([moment(vacation_date).add(i, 'days').format("YYYY-MM-DD")])
  }
  return dateArray;
} 

