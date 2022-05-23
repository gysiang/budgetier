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
 * get a array of dates that is used for the chart
 * @param {date} - date of vacation 
 * @param {integer} - no of days of vacation
 * @return {date} - an array of the dates in DD/MM/YY format
 * */
export const getDateLabel = (vacation_date, days) => {
let dateArray = [];
for (let i=0; i<days; i+=1){
  dateArray.push(moment(vacation_date).add(i, 'days').format("DD MMM YY"))
  }
  return dateArray;
} 
/**
 * get a array of dates that is used for to query
 * for the expenses per day
 * @param {string} - date of vacation 
 * @return {string} - no of days of vacation
 * @return {date} - an array of the dates in YYYY-MM-DD format
 * */
export const getExpenseDate = (vacation_date, days) => {
let dateArray = [];
for (let i=0; i<days; i+=1){
  dateArray.push([moment(vacation_date).add(i, 'days').format("YYYY-MM-DD")])
  }
  return dateArray;
} 

