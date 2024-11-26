const express = require("express");
const router = express.Router();
const con = require("../database");
const middleware = require("../middleware");
const functions = require("../functions");

const common = require("../common");

router.post("/create", middleware, (req, res, next) => {
  const data = req.body;
  const identification_number = data.identification_number;
  const dlt_code = data.dlt_code;
  const mr_status = data.mr_status;
  const ref_number = data.ref_number;
  const remark = data.remark;
  const obj = common.drivinglicense_type;
  const user_id_staff = data.user_id_staff;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });
  con.query(
    "SELECT user_id FROM app_user_detail WHERE identification_number = ?",
    [identification_number],
    (err, rows) => {
      let checkuser = rows.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Username Error", // error.sqlMessage
        });
      }
      if (result_filter.length <= 0) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'dlt_code' ",
        });
      }
      if (mr_status !== "pass" && mr_status !== "fail") {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'mr_status' ",
        });
      }
      let user_id = rows[0]?.user_id;
      con.query(
        "INSERT INTO app_main_result (mr_score,mr_learn_type,mr_status,dlt_code,crt_date,udp_date,user_id,user_create,ref_number,remark,ap_number) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          data.mr_score,
          data.mr_learn_type,
          mr_status,
          dlt_code,
          functions.dateAsiaThai(),
          functions.dateAsiaThai(),
          user_id,
          user_id_staff,
          ref_number,
          remark,
          data.ap_number,
        ],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.put("/update/:mr_id", middleware, (req, res, next) => {
  const { mr_id } = req.params;
  const data = req.body;
  const identification_number = data.identification_number;
  const dlt_code = data.dlt_code;
  const mr_status = data.mr_status;
  const obj = common.drivinglicense_type;
  const user_id_staff = data.user_id_staff;
  const ref_number = data.ref_number;
  const remark = data.remark;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });

  con.query(
    "SELECT user_id FROM app_user_detail WHERE identification_number = ?",
    [identification_number],
    (err, rows) => {
      let checkuser = rows.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Username Error", // error.sqlMessage
        });
      }
      if (result_filter.length <= 0) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'dlt_code' ",
        });
      }
      if (mr_status !== "pass" && mr_status !== "fail") {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'mr_status' ",
        });
      }
      let user_id = rows[0]?.user_id;
      con.query(
        "UPDATE  app_main_result SET mr_score=?,mr_status=?,dlt_code=?,udp_date=?,user_id=?,user_create=?,ref_number=?,remark=? WHERE ap_number=? AND mr_learn_type=?",
        [
          data.mr_score,
          mr_status,
          dlt_code,
          functions.dateAsiaThai(),
          user_id,
          user_id_staff,
          data.ref_number,
          data.remark,
          data.ap_number,
          data.mr_learn_type,
     
        ],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.delete("/delete/:mr_id", middleware, (req, res, next) => {
  const { mr_id } = req.params;
  con.query(
    "SELECT mr_id  FROM app_main_result WHERE mr_id  = ?",
    [mr_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      con.query(
        "   DELETE FROM  app_main_result WHERE mr_id=? ",
        [mr_id],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.get("/list?", middleware, (req, res, next) => {
  const user_id = req.query.user_id;
  con.query(
    "SELECT  A.mr_id,A.dlt_code,A.mr_learn_type,A.mr_score,A.mr_status,A.udp_date AS time,B.*  FROM app_main_result A LEFT JOIN app_user B ON A.user_create = B.user_id WHERE A.user_id  = ? ORDER BY mr_id DESC",
    [user_id],
    (err, rows) => {
      return res.json(rows);
    }
  );
});

router.get("/listprat?", middleware, (req, res, next) => {
  const user_id = req.query.user_id;
  con.query(
    "SELECT  A.mr_id,A.dlt_code,A.mr_learn_type,A.mr_score,A.mr_status,A.udp_date AS time,B.*  FROM app_main_result A LEFT JOIN app_user B ON A.user_create = B.user_id WHERE A.user_id  = ? AND A.mr_learn_type = '2'  ORDER BY mr_id DESC",
    [user_id],
    (err, rows) => {
      return res.json(rows);
    }
  );
});
//
router.get("/list/option/?", middleware, (req, res, next) => {
  const dlt_code = req.query.dlt_code;
  const mr_learn_type = req.query.mr_learn_type;
  const present_day = new Date(req.query.present_day);
  let sql = `
  SELECT  t1.* ,
  (SELECT   GROUP_CONCAT((JSON_OBJECT('user_id', t2.user_id,'user_firstname', t2.user_firstname,'user_lastname', t2.user_lastname , 'user_email', t2.user_email,'user_phone', t2.user_phone,'identification_number', t3.identification_number
  )))  FROM app_user t2   INNER JOIN app_user_detail t3 ON t3.user_id = t2.user_id WHERE t2.user_id =  t1.user_id) AS user_detail
  FROM app_main_result t1 WHERE t1.dlt_code  = ? AND t1.mr_learn_type=? ORDER BY t1.mr_id DESC 
  `;
  con.query(
    sql,
    [dlt_code, mr_learn_type, present_day.toISOString().split("T")[0]],
    (err, rows) => {
      let obj = [];
      rows.forEach((el) => {
        let user_detail = JSON.parse(el?.user_detail);
        let newObj = {
          mr_id: el?.mr_id,
          mr_score: el?.mr_score,
          mr_learn_type: el?.mr_learn_type,
          mr_status: el?.mr_status,
          dlt_code: el?.dlt_code,
          crt_date: el?.crt_date,
          udp_date: el?.udp_date,
          user_id: el?.user_id,
          user_detail: user_detail,
        };
        obj.push(newObj);
      });

      return res.json(obj);
    }
  );
});

module.exports = router;
