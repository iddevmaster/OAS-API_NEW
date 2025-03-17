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
router.post("/zipcode", middleware, (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 250 ? data.per_page : 250;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let total = 0;
  let total_filter = 0;
  let search_param = [];

  let sql = "SELECT * FROM app_zipcode_lao";
  con.query(sql, (err, results) => {
    total = results.length;
  });

  if (search !== "" || search.length > 0) {
    sql += ` WHERE zipcode  LIKE ? OR zipcode_name  LIKE  ? OR amphur_name  LIKE  ? OR province_name  LIKE  ? `; //
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }

  con.query(sql, search_param, (err, rows) => {
    total_filter = rows.length;
  });

  sql += ` ORDER BY province_name ASC LIMIT ${offset},${per_page} `;
  // query ข้อมูล
  con.query(sql, search_param, (err, results) => {
    if (err) {
      return res.status(400).json({
        status: 400,
        message: "Bad Request", // error.sqlMessage
      });
    }

    const result = {
      status: 200,
      total: total, // จำนวนรายการทั้งหมด
      total_filter: total_filter, // จำนวนรายการทั้งหมด
      current_page: current_page, // หน้าที่กำลังแสดงอยู่
      total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
      search: search, // คำค้นหา
      data: results, // รายการข้อมูล
    };
    return res.json(result);
  });
});


router.post("/provice", middleware, async (req, res, next) => {
  const data = req.body;



  let _check_user = await runQuery(
    "SELECT A.user_id,A.user_type,B.location_id,C.*,D.group_id,E.`name` FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id LEFT JOIN app_group_users D ON D.users_id = A.user_id LEFT JOIN app_group E ON E.group_id = D.group_id where A.user_id = ?",
    [data.user_id]
  );
 if(_check_user[0].user_type == 1){
  let sql = "select A.*,B.province_name from app_group A INNER JOIN app_zipcode_lao B ON A.province_code = B.province_code GROUP BY A.province_code";
  
  let results = await runQuery(sql);
  const result = {
    data: results, // รายการข้อมูล
  };
  return res.json(result);
 }

 if(_check_user[0].user_type == 2){

  let sql = "SELECT A.group_id,A.group,A.users_id,B.name,B.province_code,C.province_name FROM app_group_users A LEFT JOIN app_group B ON A.group = B.group_id LEFT JOIN app_zipcode_lao C ON C.province_code = B.province_code WHERE A.users_id = ? GROUP BY A.group_id,A.users_id";


  let results = await runQuery(sql,data.user_id);

  const result = {
    data: results, // รายการข้อมูล
  };


  return res.json(result);
 }
 

  


});



router.post("/proviceall", middleware, async (req, res, next) => {
  const data = req.body;

  let sql = "SELECT province_code,province_name from app_zipcode_lao GROUP BY province_code,province_name";
  
  let results = await runQuery(sql);
  const result = {
    data: results, // รายการข้อมูล
  };
  return res.json(result);

});

router.post("/provicegroup", middleware, async (req, res, next) => {
  const data = req.body;
  const province_code = data.province_code;

  let sql = "SELECT * from app_group where province_code = ?";
  
  let results = await runQuery(sql,province_code);
  const result = {
    data: results, // รายการข้อมูล
  };
  return res.json(result);

});


router.post("/group", middleware, async (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;


  let _check_user = await runQuery(
    "SELECT A.user_id,A.user_type,B.location_id,C.*,D.group_id,E.`name` FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id LEFT JOIN app_group_users D ON D.users_id = A.user_id LEFT JOIN app_group E ON E.group_id = D.group_id where A.user_id = ?",
    [data.user_id]
  );

  let sql = "select * from app_zipcode_lao where id = ?";

  let _check_user_pro = await runQuery(
    "select * from app_zipcode_lao where id = ?",
    [_check_user[0].location_id]
  );
  
  let sqlgroup = "select A.*,B.province_name from app_group A LEFT JOIN app_zipcode_lao B ON A.province_code = B.province_code WHERE B.province_code = ? GROUP BY A.group_id";
 let results = await runQuery(sqlgroup,_check_user_pro[0].province_code);
  const result = {
    data: results, // รายการข้อมูล
  };
  return res.json(result);

});


router.post("/contry", middleware, (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 250 ? data.per_page : 250;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let total = 0;
  let total_filter = 0;
  let search_param = [];

  let sql =
    "SELECT country_id,country_name_eng,country_official_name_eng,capital_name_eng,zone FROM app_country";
  con.query(sql, (err, results) => {
    total = results.length;
  });

  if (search !== "" || search.length > 0) {
    sql += ` WHERE country_name_eng  LIKE ? OR country_official_name_eng  LIKE  ? OR capital_name_eng  LIKE  ? OR zone  LIKE  ? `; //
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
  }

  con.query(sql, search_param, (err, rows) => {
    total_filter = rows.length;
  });

  sql += ` ORDER BY country_name_eng ASC LIMIT ${offset},${per_page} `;
  // query ข้อมูล
  con.query(sql, search_param, (err, results) => {
    if (err) {
      return res.status(400).json({
        status: 400,
        message: "Bad Request", // error.sqlMessage
      });
    }

    const result = {
      status: 200,
      total: total, // จำนวนรายการทั้งหมด
      total_filter: total_filter, // จำนวนรายการทั้งหมด
      current_page: current_page, // หน้าที่กำลังแสดงอยู่
      total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
      search: search, // คำค้นหา
      data: results, // รายการข้อมูล
    };
    return res.json(result);
  });
});

router.get("/drivinglicense_type", middleware, (req, res, next) => {
  const obj = common.drivinglicense_type;
  return res.json(obj);
});

module.exports = router;
