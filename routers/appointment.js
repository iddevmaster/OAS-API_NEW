const express = require("express");
const router = express.Router();
const con = require("../database");
const middleware = require("../middleware");
const functions = require("../functions");
const common = require("../common");

async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}

router.post("/create", middleware, (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;
  const dlt_code = data.dlt_code;
  const ap_learn_type = data.ap_learn_type;
  const obj = common.drivinglicense_type;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });

  const check_start = new Date(data.ap_date_start).getTime();
  const check_end = new Date(data.ap_date_end).getTime();

  con.query(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [user_id],
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
      if (ap_learn_type !== 1 && ap_learn_type !== 2) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'ap_learn_type' ",
        });
      }
      if (check_start > check_end || check_start === NaN || check_end === NaN) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'ap_date_start' , 'ap_date_end' ", // error.sqlMessage
        });
      }
      con.query(
        "INSERT INTO app_appointment (ap_learn_type,ap_quota,ap_date_start,ap_date_end,ap_remark,dlt_code,crt_date,udp_date,user_crt,user_udp) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
          ap_learn_type,
          data.ap_quota,
          data.ap_date_start,
          data.ap_date_end,
          data.ap_remark,
          data.dlt_code,
          functions.dateAsiaThai(),
          functions.dateAsiaThai(),
          user_id,
          user_id,
        ],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.put("/update/:ap_id", middleware, (req, res, next) => {
  const { ap_id } = req.params;
  const data = req.body;
  const user_id = data.user_id;
  const dlt_code = data.dlt_code;
  const ap_learn_type = data.ap_learn_type;
  const obj = common.drivinglicense_type;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });
  const check_start = new Date(data.ap_date_start).getTime();
  const check_end = new Date(data.ap_date_end).getTime();

  let _check_appointment = 0;
  con.query(
    " SELECT ap_id FROM app_appointment WHERE ap_id = ?",
    [ap_id],
    function (err, result) {
      if (err) throw err;
      _check_appointment = result.length;
    }
  );

  con.query(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [user_id],
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
      if (ap_learn_type !== 1 && ap_learn_type !== 2) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'ap_learn_type' ",
        });
      }
      if (_check_appointment <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null", // error.sqlMessage
        });
      }
      if (check_start > check_end || check_start === NaN || check_end === NaN) {
        return res.status(404).json({
          status: 404,
          message: "Invalid 'ap_date_start' , 'ap_date_end' ", // error.sqlMessage
        });
      }
      con.query(
        "UPDATE  app_appointment SET ap_learn_type=? ,ap_quota=? , ap_date_start=?, ap_date_end=?, ap_remark=?,dlt_code=? ,udp_date=? , user_udp=? WHERE ap_id=? ",
        [
          ap_learn_type,
          data.ap_quota,
          data.ap_date_start,
          data.ap_date_end,
          data.ap_remark,
          data.dlt_code,
          functions.dateAsiaThai(),
          user_id,
          ap_id,
        ],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.get("/get/:ap_id", middleware, (req, res, next) => {
  const { ap_id } = req.params;
  let sql = `SELECT t1.ap_id ,t1.ap_learn_type,t1.ap_quota,t1.ap_date_start,t1.ap_date_end,t1.ap_remark,t1.dlt_code,t1.crt_date,t1.udp_date,
  (SELECT Count(*) FROM app_appointment_reserve WHERE ap_id=t1.ap_id) AS total_reserve,
  CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create , CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
  FROM app_appointment t1 LEFT JOIN  app_user u1 ON u1.user_id = t1.user_crt  LEFT JOIN  app_user u2 ON u2.user_id = t1.user_udp WHERE t1.cancelled=1 AND t1.ap_id =?`;

  con.query(sql, [ap_id], function (err, rs) {
    if (rs.length <= 0) {
      return res.status(204).json({
        status: 204,
        message: "Data is null", // error.sqlMessage
      });
    }

    res.json(rs[0]);
  });
});

router.delete("/delete/:ap_id", middleware, (req, res, next) => {
  const { ap_id } = req.params;
  con.query(
    "SELECT ap_id  FROM app_appointment WHERE ap_id  = ?",
    [ap_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      con.query(
        "UPDATE  app_appointment SET cancelled=0 WHERE ap_id=? ",
        [ap_id],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.post("/list", middleware, async (req, res, next) => {
  const data = req.body;
  const date_event = new Date(data.date_event);
  const ap_learn_type = data.ap_learn_type;
  const user_id = data.user_id;
  const dlt_code = data.dlt_code;
  const obj = common.drivinglicense_type;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === dlt_code;
  });
  if (result_filter.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'dlt_code' ",
    });
  }

  // ตรวจสอบว่านักเรียนสอบผ่านหรือยัง ถ้าผ่านแล้วจบ Process
  let getUser = await runQuery(
    "SELECT user_id FROM app_main_result WHERE dlt_code = ? AND mr_learn_type = ? AND user_id=? AND mr_status ='pass'",
    [dlt_code, ap_learn_type, user_id]
  );

  if (getUser.length >= 1) {
    return res.status(404).json({
      status: 404,
      message: "User is successfully.",
    });
  }

  let sql = `
SELECT 
t1.ap_id,
t1.ap_learn_type,
t1.ap_quota,
t1.ap_date_start,
t1.ap_date_end,
t1.ap_remark,
t1.dlt_code,
t1.crt_date,
t1.udp_date,
(SELECT Count(*) FROM app_appointment_reserve WHERE ap_id=t1.ap_id) AS total_reserve,
CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create ,
CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
FROM app_appointment t1 
LEFT JOIN  app_user u1 ON u1.user_id = t1.user_crt  
LEFT JOIN  app_user u2 ON u2.user_id = t1.user_udp
WHERE 
t1.cancelled=1 AND
t1.dlt_code = ? AND
DATE(t1.ap_date_start) = ?  AND
t1.ap_learn_type = ? 
ORDER BY t1.ap_date_start ASC
 `;
  // console.log(date_event);
  let getAppointment = await runQuery(sql, [
    dlt_code,
    date_event.toISOString().split("T")[0],
    ap_learn_type,
  ]);
  return res.json(getAppointment);
});

router.get("/event", middleware, (req, res, next) => {
  let ap_learn_type = req.query.ap_learn_type;
  let dlt_code = req.query.dlt_code;
  const present_day = new Date().toISOString().split("T")[0];

  con.query(
    "SELECT  DATE_FORMAT(ap_date_start,'%Y-%m-%d') AS event   FROM app_appointment WHERE ap_learn_type  = ? AND dlt_code = ? AND DATE(ap_date_start) > ? GROUP BY event ORDER BY event ASC LIMIT 0,30",
    [ap_learn_type, dlt_code, present_day],
    (err, result) => {
      if (err) {
        return res.status(400).json({
          status: 400,
          message: "Bad Request", // error.sqlMessage
        });
      }
      // console.log(result);
      return res.json(result);
    }
  );
});

router.post("/reserve/create", middleware, async (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;
  const ap_id = data.ap_id;
  let _check_reserve = 0;
  let _check_appointment = 0;
  // ตรวจสอบวาามี User ในระบบหรือไม่
  let getUser = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [user_id]
  );

  if (getUser.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Username Error", // error.sqlMessage
    });
  }

  // ตรวจสอบว่ารหัสนัดหมายนี้มีหรือไม่
  let getAppointment = await runQuery(
    "SELECT * FROM app_appointment WHERE ap_id = ?",
    [ap_id]
  );
  _check_appointment = getAppointment.length;
  if (_check_appointment <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Data is null", // error.sqlMessage
    });
  }
  // ตรวจสอบว่าเต็มโควต้ายัง
  let ap_quota =
    getAppointment[0]?.ap_quota !== undefined ? getAppointment[0]?.ap_quota : 0;
  let geTotalReserve = await runQuery(
    "SELECT user_id FROM app_appointment_reserve WHERE ap_id = ? ",
    [ap_id]
  );
  if (geTotalReserve.length >= ap_quota) {
    return res.status(404).json({
      status: 404,
      message: "Limit data", // error.sqlMessage
    });
  }
  // ตรวจสอบว่าเคยจองมาหรือไม่
  let dlt_code =
    getAppointment[0]?.dlt_code !== undefined
      ? getAppointment[0]?.dlt_code
      : "";
  let ap_learn_type =
    getAppointment[0]?.ap_learn_type !== undefined
      ? getAppointment[0]?.ap_learn_type
      : 0;
  let getMyReserve = await runQuery(
    "SELECT t1.user_id FROM app_appointment_reserve t1 INNER JOIN app_appointment t2 ON t2.ap_id=t1.ap_id AND t2.dlt_code = ? AND ap_learn_type =?  WHERE  t1.user_id=?",
    [dlt_code, ap_learn_type, user_id]
  );
  _check_reserve = getMyReserve.length;

  if (_check_reserve >= 1) {
    return res.status(404).json({
      status: 404,
      message:
        "You have entered an ap_id and user_id that already exists in this column. Only unique ap_id and user_id are allowed.",
    });
  }
  // บันทึกการนัดหมาย
  let _content = await runQuery(
    "INSERT INTO app_appointment_reserve (ap_id,user_id,udp_date) VALUES (?,?,?)",
    [ap_id, user_id, functions.dateAsiaThai()]
  );
  return res.json(_content);
});
router.delete("/reserve/delete/:ar_id", middleware, (req, res, next) => {
  const { ar_id } = req.params;
  const present_day = new Date().toISOString().split("T")[0];
  con.query(
    "SELECT t1.ar_id FROM app_appointment_reserve t1  INNER JOIN app_appointment t2 ON t2.ap_id = t1.ap_id  WHERE t1.ar_id = ? AND DATE(t2.ap_date_start) > ?",
    [ar_id, present_day],
    (err, rows) => {
      if (rows?.length <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null", // error.sqlMessage
        });
      }
      con.query(
        "  DELETE FROM  app_appointment_reserve WHERE ar_id=? ",
        [ar_id],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.get("/reserve/get/:user_id", middleware, (req, res, next) => {
  const { user_id } = req.params;
  let sql = `
  SELECT t1.*, 
  (SELECT   GROUP_CONCAT((JSON_OBJECT('ap_id', t5.ap_id,'ap_learn_type', t5.ap_learn_type,'ap_quota', t5.ap_quota , 'ap_date_start', t5.ap_date_start,'ap_date_end', t5.ap_date_end,'ap_remark', t5.ap_remark,'dlt_code', t5.dlt_code)))  FROM app_appointment t5  WHERE t5.ap_id =  t1.ap_id ) AS appointment_detail
  FROM app_appointment_reserve t1  INNER JOIN app_appointment t2 ON t2.ap_id = t1.ap_id AND t2.cancelled=1 WHERE t1.user_id = ? 
  `;
  con.query(sql, [user_id], function (err, result) {
    if (err) throw err;
    let obj = [];
    result.forEach((el) => {
      let appointment_detail = JSON.parse(el?.appointment_detail);
      let newObj = {
        ar_id: el?.ar_id,
        ap_id: el?.ap_id,
        user_id: el?.user_id,
        udp_date: el?.udp_date,
        appointment_detail: appointment_detail,
      };
      obj.push(newObj);
    });

    return res.json(obj);
  });
});

router.post("/reserve/get/:ap_id", middleware, (req, res, next) => {
  const { ap_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let total = 0;
  let total_filter = 0;
  let search_param = [];
  let sql = `
  SELECT t1.*,
  (SELECT   GROUP_CONCAT((JSON_OBJECT('user_id', t3.user_id,'user_prefrix', t3.user_prefrix,'user_firstname', t3.user_firstname,'user_lastname', t3.user_lastname , 'user_email', t3.user_email,'user_phone', t3.user_phone,'identification_number', t7.identification_number)))  FROM app_user t3   INNER JOIN app_user_detail t7 ON t7.user_id = t3.user_id WHERE t3.user_id =  t1.user_id) AS user_reserve,
  (SELECT   GROUP_CONCAT((JSON_OBJECT('ap_id', t5.ap_id,'ap_learn_type', t5.ap_learn_type,'ap_quota', t5.ap_quota , 'ap_date_start', t5.ap_date_start,'ap_date_end', t5.ap_date_end,'ap_remark', t5.ap_remark,'dlt_code', t5.dlt_code)))  FROM app_appointment t5  WHERE t5.ap_id =  t1.ap_id ) AS appointment_detail
  FROM app_appointment_reserve t1  
  INNER JOIN app_appointment t2 ON t2.ap_id = t1.ap_id AND t2.cancelled=1 
  INNER JOIN app_user t4 ON t4.user_id = t1.user_id
  INNER JOIN app_user_detail t6 ON t6.user_id = t1.user_id
  WHERE t1.ap_id = ?

    `;
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_appointment_reserve  t1 INNER JOIN app_user t4 ON t4.user_id = t1.user_id   INNER JOIN app_user_detail t6 ON t6.user_id = t4.user_id WHERE  t1.ap_id=?  ";
  con.query(sql_count, [ap_id], (err, results) => {
    let res = results[0];
    total = res !== undefined ? res?.numRows : 0;
  });
  if (search !== "" || search.length > 0) {
    let q = ` AND (t4.user_firstname  LIKE ? OR t4.user_lastname  LIKE  ?  OR t6.identification_number  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  con.query(sql_count, [ap_id].concat(search_param), (err, rows) => {
    let res = rows[0];
    total_filter = res !== undefined ? res?.numRows : 0;
  });

  sql += `  ORDER BY t1.ar_id DESC LIMIT ${offset},${per_page} `;
  con.query(sql, [ap_id].concat(search_param), function (err, result) {
    if (err) throw err;
    let obj = [];
    result.forEach((el) => {
      let user_reserve = JSON.parse(el?.user_reserve);
      let appointment_detail = JSON.parse(el?.appointment_detail);
      let newObj = {
        ar_id: el?.ar_id,
        ap_id: el?.ap_id,
        user_id: el?.user_id,
        udp_date: el?.udp_date,
        user_reserve: user_reserve,
        appointment_detail: appointment_detail,
      };
      obj.push(newObj);
    });
    const response = {
      total: total, // จำนวนรายการทั้งหมด
      total_filter: total_filter, // จำนวนรายการทั้งหมด
      current_page: current_page, // หน้าที่กำลังแสดงอยู่
      limit_page: per_page, // limit data
      total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
      search: search, // คำค้นหา
      data: obj, // รายการข้อมูล
    };
    return res.json(response);
  });
});

router.get("/reserve/list?", middleware, (req, res, next) => {
  const dlt_code = req.query.dlt_code;
  const ap_learn_type = req.query.ap_learn_type;
  const present_day = new Date(req.query.present_day);
  let sql = `
  SELECT t1.*, 
  (SELECT   GROUP_CONCAT((JSON_OBJECT('user_id', t3.user_id,'user_prefrix', t3.user_prefrix,'user_firstname', t3.user_firstname,'user_lastname', t3.user_lastname , 'user_email', t3.user_email,
  'user_phone', t3.user_phone,'identification_number', t7.identification_number,'user_img', t7.user_img,'user_birthday', t7.user_birthday,'user_address', t7.user_address,
  'user_location',(SELECT   GROUP_CONCAT( (JSON_OBJECT('zipcode', t4.zipcode,'zipcode_name', t4.zipcode_name,'amphur_name', t4.amphur_name,'province_name', t4.province_name   ) ))   FROM app_zipcode_lao t4 WHERE t4.id = t7.location_id )
  ))) 
   FROM app_user t3   INNER JOIN app_user_detail t7 ON t7.user_id = t3.user_id WHERE t3.user_id =  t1.user_id) AS user_reserve,
  (SELECT   GROUP_CONCAT((JSON_OBJECT('ap_id', t5.ap_id,'ap_learn_type', t5.ap_learn_type,'ap_quota', t5.ap_quota , 'ap_date_start', t5.ap_date_start,'ap_date_end', t5.ap_date_end,'ap_remark', t5.ap_remark,'dlt_code', t5.dlt_code)))  FROM app_appointment t5  WHERE t5.ap_id =  t1.ap_id ) AS appointment_detail
  FROM app_appointment_reserve t1  INNER JOIN app_appointment t2 ON t2.ap_id = t1.ap_id AND t2.cancelled=1 AND t2.dlt_code = ? AND t2.ap_learn_type = ? AND DATE(t1.udp_date) = ? 
  `;
  con.query(
    sql,
    [dlt_code, ap_learn_type, present_day.toISOString().split("T")[0]],
    function (err, result) {
      if (err) throw err;
      let obj = [];
      result.forEach((el) => {
        let user_reserve = JSON.parse(el?.user_reserve);
        let appointment_detail = JSON.parse(el?.appointment_detail);
        let newObj = {
          ar_id: el?.ar_id,
          ap_id: el?.ap_id,
          user_id: el?.user_id,
          udp_date: el?.udp_date,
          user_reserve: {
            user_id: user_reserve?.user_id,
            user_prefrix: user_reserve?.user_prefrix,
            user_firstname: user_reserve?.user_firstname,
            user_lastname: user_reserve?.user_lastname,
            user_email: user_reserve?.user_id,
            user_phone: user_reserve?.user_phone,
            identification_number: user_reserve?.identification_number,
            user_img: user_reserve?.user_img,
            user_birthday: user_reserve?.user_birthday,
            user_address: user_reserve?.user_address,
            user_location: JSON.parse(user_reserve?.user_location),
          },
          appointment_detail: {
            ap_id: appointment_detail?.ap_id,
            ap_learn_type: appointment_detail?.ap_learn_type,
            ap_quota: appointment_detail?.ap_quota,
            ap_date_start: appointment_detail?.ap_date_start,
            ap_date_end: appointment_detail?.ap_date_end,
            ap_remark: appointment_detail?.ap_remark,
            dlt_code: appointment_detail?.dlt_code,
          },
        };
        obj.push(newObj);
      });

      return res.json(obj);
    }
  );
});
//

module.exports = router;
