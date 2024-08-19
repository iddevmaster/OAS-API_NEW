const express = require("express");
const router = express.Router();
const con = require("../database");
const middleware = require("../middleware");
const common = require("../common");
const functions = require("../functions");

async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}
router.post("/lesson/create", middleware, (req, res, next) => {
  const data = req.body;
  const cs_id = data.cs_id;
  const course_id = data.course_id;
  const user_id = data.user_id;
  con.query(
    "SELECT * FROM app_course_lesson WHERE cs_id = ?",
    [cs_id],
    (err, rows) => {
      let checkuser = rows?.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Username Error", // error.sqlMessage
        });
      }
      con.query(
        "INSERT INTO app_course_log (cs_id,course_id,user_id,udp_date) VALUES (?,?,?,?)",
        [cs_id, course_id, user_id, functions.dateAsiaThai()],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.get("/lesson/:cs_id/:year", middleware, async (req, res, next) => {
  const { cs_id, year } = req.params;

  let obj = [];
  for (let i = 1; i <= 12; i++) {
    let getLog = await runQuery(
      "SELECT COUNT(cs_id) AS total FROM app_course_log WHERE cs_id = ? AND MONTH(udp_date) = ?  AND  YEAR(udp_date) = ? ",
      [cs_id, i, year]
    );
    let newObj = {
      month: i,
      total: getLog[0]?.total,
    };
    obj.push(newObj);
  }
  return res.json(obj);
});

router.get("/course/:course_id/:year", middleware, async (req, res, next) => {
  const { course_id, year } = req.params;

  let obj = [];
  for (let i = 1; i <= 12; i++) {
    let getLog = await runQuery(
      `SELECT COUNT(t1.cs_id) AS total 
          FROM app_course_log t1  
          WHERE   t1.course_id=? AND MONTH(t1.udp_date) = ?  AND  YEAR(t1.udp_date) = ? `,
      [course_id, i, year]
    );
    let newObj = {
      month: i,
      total: getLog[0]?.total,
    };
    obj.push(newObj);
  }
  return res.json(obj);
});

router.get(
  "/course/:course_id/:year/f?",
  middleware,
  async (req, res, next) => {
    const { course_id, year } = req.params;
    const user_id = req.query.user_id;
    let obj = [];
    for (let i = 1; i <= 12; i++) {
      let getLog = await runQuery(
        `SELECT COUNT(t1.cs_id) AS total 
          FROM app_course_log t1  
          WHERE t1.course_id=? AND MONTH(t1.udp_date) = ?  AND  YEAR(t1.udp_date) = ? AND t1.user_id = ?`,
        [course_id, i, year, user_id]
      );
      let newObj = {
        month: i,
        total: getLog[0]?.total,
      };
      obj.push(newObj);
    }
    return res.json(obj);
  }
);

router.get(
  "/appointment/reserve/:dlt_code/:year",
  middleware,
  async (req, res, next) => {
    const { dlt_code, year } = req.params;
    const dltObj = common.drivinglicense_type;
    const result_filter = dltObj.filter(function (e) {
      return e.dlt_code === dlt_code;
    });
    if (result_filter.length <= 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'dlt_code' ",
      });
    }

    let obj = [];
    for (let i = 1; i <= 12; i++) {
      let getLog = await runQuery(
        "SELECT COUNT(t1.ap_id) AS total FROM app_appointment_reserve t1  INNER JOIN  app_appointment t2 ON t2.ap_id = t1.ap_id    WHERE  MONTH(t1.udp_date) = ?  AND  YEAR(t1.udp_date) = ? AND t2.dlt_code = ?",
        [i, year, dlt_code]
      );
      let newObj = {
        month: i,
        total: getLog[0]?.total,
      };
      obj.push(newObj);
    }
    return res.json(obj);
  }
);

router.get("/exam/:dlt_code/:year", middleware, async (req, res, next) => {
  const { dlt_code, year } = req.params;
  const dltObj = common.drivinglicense_type;
  const result_filter = dltObj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });
  if (result_filter.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'dlt_code' ",
    });
  }
  let obj = [];
  for (let i = 1; i <= 12; i++) {
    let getLog = await runQuery(
      "SELECT COUNT(t1.er_id) AS total FROM app_exam_result t1 INNER JOIN  app_exam_main t2 ON t2.course_id = t1.course_id  WHERE  MONTH(t1.udp_date) = ?  AND  YEAR(t1.udp_date) = ? AND t2.dlt_code = ? ",
      [i, year, dlt_code]
    );
    let newObj = {
      month: i,
      total: getLog[0]?.total,
    };
    obj.push(newObj);
  }
  return res.json(obj);
});

module.exports = router;
