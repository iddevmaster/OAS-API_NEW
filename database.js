const mysql = require("mysql2");
const util = require("util");
// const connection = mysql.createConnection({
//   host: "127.0.0.1",
//   user: "root",
//   port: "3306",
//   // password: "",
//   password: "@P@SS.W0rd",
//   database: "oas",
//   // timezone: "Asia/Bangkok",
//   // timezone: "+016:00",
// });
const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  port: "3306",
  // password: "",
  password: "@P@SS.W0rd",
  database: "oas",
  waitForConnections: true,
  // connectionLimit: 100,
  queueLimit: 0,
  dateStrings: true,
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  }

  if (connection) connection.release();

  return;
});

pool.query = util.promisify(pool.query);

module.exports = pool;
