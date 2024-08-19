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

router.post("/course/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);

  let search_param = [];
  let p = [course_id];
 
  let sql = `SELECT 
  CONCAT(t2.user_firstname ,' ' , t2.user_lastname) AS fullname_learning,
  t3.course_code,
  t3.course_name_lo,
  t3.course_name_eng,
  (SELECT COUNT(t1s.cs_id)  AS total  FROM  app_course_log t1s  WHERE t1s.course_id=t1.course_id AND t1s.user_id = t1.user_id GROUP BY t1s.user_id LIMIT 1) AS total_learn_lesson,
  (SELECT COUNT(t5.cs_id)  AS total  FROM  app_course_cluster t4 INNER JOIN app_course_lesson t5 ON t4.cg_id = t5.cg_id  WHERE t4.course_id=t1.course_id  LIMIT 1) AS total_lesson,
   ROUND(
    IFNULL(
      (SELECT COUNT(t1s.cs_id) FROM app_course_log t1s WHERE t1s.course_id = t1.course_id AND t1s.user_id = t1.user_id GROUP BY t1s.user_id LIMIT 1) / 
      (SELECT COUNT(t5.cs_id) FROM app_course_cluster t4 INNER JOIN app_course_lesson t5 ON t4.cg_id = t5.cg_id WHERE t4.course_id = t1.course_id LIMIT 1) * 100,
      0
    ), 2
  ) AS lesson_completion_percentage
  FROM app_course_log t1
  INNER JOIN app_user t2 ON  t2.user_id = t1.user_id
  INNER JOIN app_course t3 ON  t3.course_id = t1.course_id 
  WHERE 
  t1.course_id = ?  `;
  
  let sql_count =
  " SELECT  COUNT(DISTINCT t1.user_id) as numRows FROM  app_course_log t1 INNER JOIN app_user t2 ON  t2.user_id = t1.user_id INNER JOIN app_course t3 ON  t3.course_id = t1.course_id  WHERE  t1.course_id = ? ";

  const getCountAll = await runQuery(sql_count, p.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t2.user_firstname  LIKE ? OR t2.user_lastname  LIKE ? OR t3.course_code  LIKE ? OR t3.course_name_lo  LIKE  ? OR t3.course_name_eng  LIKE  ? OR t3.course_description  LIKE  ? OR t3.course_remark_a  LIKE  ? OR t3.course_remark_b  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];
  }
  sql += ` GROUP BY t1.user_id  ORDER BY t1.cl_id DESC LIMIT ${offset},${per_page} `;
  const getCountFilter = await runQuery(sql_count , p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  const getContent = await runQuery(sql, p.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getContent, // รายการข้อมูล
  };
  return res.json(response);
});


router.post("/exam/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);

  let search_param = [];
  let p = [course_id];
 
  let sql = `SELECT 
  t1.*,
  IF(t1.er_score_total >= t4.em_measure, 'pass', 'fail') AS status,
  CONCAT(t2.user_firstname ,' ' , t2.user_lastname) AS fullname_exam,
  t3.course_code,
  t3.course_name_lo,
  t3.course_name_eng
  FROM app_exam_result t1
  INNER JOIN app_user t2 ON  t2.user_id = t1.user_id
  INNER JOIN app_course t3 ON  t3.course_id = t1.course_id
  INNER JOIN app_exam_main t4 ON  t4.course_id = t1.course_id 
  WHERE 
  t1.course_id = ?  `;
  
  let sql_count =
  " SELECT  COUNT(*) as numRows FROM  app_exam_result t1 INNER JOIN app_user t2 ON  t2.user_id = t1.user_id INNER JOIN app_course t3 ON  t3.course_id = t1.course_id  WHERE  t1.course_id = ? ";
  const getCountAll = await runQuery(sql_count, p.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t2.user_firstname  LIKE ? OR t2.user_lastname  LIKE ? OR t3.course_code  LIKE ? OR t3.course_name_lo  LIKE  ? OR t3.course_name_eng  LIKE  ? OR t3.course_description  LIKE  ? OR t3.course_remark_a  LIKE  ? OR t3.course_remark_b  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];
  }
  const getCountFilter = await runQuery(sql_count, p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += ` ORDER BY t1.er_id  DESC LIMIT ${offset},${per_page} `;

  const getContent = await runQuery(sql, p.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getContent, // รายการข้อมูล
  };
  return res.json(response);
});


router.post("/register", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);

  const start_date = data.start_date;
  const end_date = data.end_date;

  let search_param = [];
  let join_date = [start_date, end_date];

  let sql = `SELECT 
  t1.user_id ,
  t1.user_name,
  t1.user_firstname,
  t1.user_lastname,
  t1.user_email,
  t1.user_phone,
  t1.user_type,
  t1.crt_date,
  t1.udp_date,
  t2.verify_account,
  t2.identification_number,
  t2.user_img
  FROM app_user t1 
  INNER JOIN app_user_detail t2 ON  t2.user_id = t1.user_id 
  WHERE 
  t1.cancelled =1 AND t1.user_type=3 AND DATE(t1.crt_date) >= ? AND DATE(t1.crt_date) <= ? `;
  let sql_count =
    " SELECT  COUNT(t1.user_id) as numRows FROM  app_user t1  INNER JOIN app_user_detail t2 ON  t2.user_id = t1.user_id WHERE  t1.cancelled=1 AND t1.user_type=3 AND DATE(t1.crt_date) >= ? AND DATE(t1.crt_date) <= ?";

  const getCountAll = await runQuery(sql_count, join_date.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t1.user_firstname  LIKE ? OR t1.user_lastname  LIKE  ? OR t1.user_email  LIKE  ? OR t2.identification_number  LIKE  ?) `; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(
    sql_count,
    join_date.concat(search_param)
  );
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  sql += `  ORDER BY t1.user_id DESC LIMIT ${offset},${per_page} `;

  let getContent = await runQuery(sql, join_date.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getContent, // รายการข้อมูล
  };
  return res.json(response);
});

router.post("/appointment/reserve", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);

  const start_date = data.start_date;
  const end_date = data.end_date;
  const dlt_code = data.dlt_code;
  const ap_learn_type = data.ap_learn_type;

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

  let search_param = [];
  let join_date = [start_date, end_date, dlt_code, ap_learn_type];

  let sql = `SELECT 
  t2.ap_quota,
  t2.ap_date_start,
  t2.ap_date_end,
  t2.ap_remark,
  t2.ap_learn_type,
  t2.dlt_code,
  t3.user_id ,
  t3.user_name,
  t3.user_firstname,
  t3.user_lastname,
  t3.user_email,
  t3.user_phone,
  t3.user_type,
  t3.crt_date,
  t3.udp_date,
  t4.verify_account,
  t4.identification_number,
  t4.user_img
    FROM app_appointment_reserve t1 
    INNER JOIN app_appointment t2 ON  t2.ap_id = t1.ap_id 
    INNER JOIN app_user t3 ON  t3.user_id = t1.user_id 
    INNER JOIN app_user_detail t4 ON  t4.user_id = t1.user_id 
    WHERE 
    DATE(t1.udp_date) >= ? AND DATE(t1.udp_date) <= ? AND t2.dlt_code = ? AND  t2.ap_learn_type = ?`;
  let sql_count =
    " SELECT  COUNT(t1.user_id) as numRows FROM  app_appointment_reserve t1 INNER JOIN app_appointment t2 ON  t2.ap_id = t1.ap_id  INNER JOIN app_user t3 ON  t3.user_id = t1.user_id    INNER JOIN app_user_detail t4 ON  t4.user_id = t1.user_id  WHERE  DATE(t1.udp_date) >= ? AND DATE(t1.udp_date) <= ? AND t2.dlt_code = ? AND  t2.ap_learn_type = ?";

  const getCountAll = await runQuery(sql_count, join_date.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t3.user_firstname  LIKE ? OR t3.user_lastname  LIKE  ? OR t3.user_email  LIKE  ? OR t4.identification_number  LIKE  ?) `; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(
    sql_count,
    join_date.concat(search_param)
  );
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  sql += `  ORDER BY t1.ar_id DESC LIMIT ${offset},${per_page} `;

  const getContent = await runQuery(sql, join_date.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getContent, // รายการข้อมูล
  };
  return res.json(response);
});


router.post("/main_result", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);

  const start_date = data.start_date;
  const end_date = data.end_date;
  const dlt_code = data.dlt_code;
  const mr_learn_type = data.mr_learn_type;
  const mr_status = data.mr_status;

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

  if (mr_status !== "pass" && mr_status !== "fail") {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'mr_status' ",
    });
  }

  let search_param = [];
  let join_date = [start_date, end_date, dlt_code, mr_learn_type, mr_status];

  let sql = `SELECT 
  t1.*,
  t2.user_name,
  t2.user_firstname,
  t2.user_lastname,
  t2.user_email,
  t2.user_phone,
  t2.user_type,
  t2.crt_date,
  t2.udp_date,
  t3.verify_account,
  t3.identification_number,
  t3.user_img
  FROM app_main_result t1 
  INNER JOIN app_user t2 ON  t2.user_id = t1.user_id 
  INNER JOIN app_user_detail t3 ON  t3.user_id = t1.user_id 
  WHERE 
  DATE(t1.crt_date) >= ? AND DATE(t1.crt_date) <= ? AND t1.dlt_code = ? AND t1.mr_learn_type = ? AND t1.mr_status=?`;
  let sql_count =
    " SELECT  COUNT(t1.user_id) as numRows FROM  app_main_result t1    INNER JOIN app_user t2 ON  t2.user_id = t1.user_id  INNER JOIN app_user_detail t3 ON  t3.user_id = t1.user_id   WHERE DATE(t1.crt_date) >= ? AND DATE(t1.crt_date) <= ? AND t1.dlt_code = ? AND t1.mr_learn_type = ? AND t1.mr_status=? ";

  const getCountAll = await runQuery(sql_count, join_date.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t2.user_firstname  LIKE ? OR t2.user_lastname  LIKE  ? OR t2.user_email  LIKE  ? OR t3.identification_number  LIKE  ?) `; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(
    sql_count,
    join_date.concat(search_param)
  );
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  sql += `  ORDER BY t1.mr_id DESC LIMIT ${offset},${per_page} `;

  const getContent = await runQuery(sql, join_date.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getContent, // รายการข้อมูล
  };
  return res.json(response);
});

module.exports = router;
