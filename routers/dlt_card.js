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

router.post("/create", middleware, async (req, res, next) => {
  const data = req.body;
  const dlt_code = data.dlt_code;
  const obj = common.drivinglicense_type;

  const id = functions.randomCode();
  const getUser = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_id]
  );
  const getUserCreate = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_create]
  );
  const user_id = getUser[0] !== undefined ? getUser[0]?.user_id : 0;
  const user_create =
    getUserCreate[0] !== undefined ? getUserCreate[0]?.user_id : 0;
  if (user_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Username Error",
    });
  }
  let objValue = [];
  for (let i = 0; i < dlt_code.length; i++) {
    const el = dlt_code[i];
    const result_filter = obj.filter(function (e) {
      return e.dlt_code === el;
    });
    if (result_filter.length <= 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'dlt_code' ",
      });
    }
    let newObj = [`${el}`, `${id}`];
    objValue.push(newObj);
  }

  const date = new Date(functions.dateAsiaThai());
  const dateStr = date.toISOString().split("T")[0];
  const getAllCard = await runQuery(
    "SELECT COUNT(*) as numRows FROM app_dlt_card WHERE DATE(crt_date) = ?",
    [dateStr]
  );
  const total = getAllCard[0] !== undefined ? getAllCard[0]?.numRows : 1;
  const card_number =
    functions.yyyymmdd(dateStr) + functions.treeDigit(total + 1);
  // dlt_type
  let sql = " INSERT INTO app_dlt_card_type (dlt_code,dlt_card_id) VALUES ? ";
  await runQuery(sql, [objValue]);
  con.query(
    "INSERT INTO app_dlt_card (id,card_number,full_name,address,front_img,back_img,issue_date,expiry_date,crt_date,udp_date,user_id,user_create) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      id,
      card_number,
      data.full_name,
      data.address,
      data.front_img,
      data.back_img,
      data.issue_date,
      data.expiry_date,
      functions.dateAsiaThai(),
      functions.dateAsiaThai(),
      user_id,
      user_create,
    ],
    function (err, result) {
      if (err) throw err;
      result.insertId = id;
      return res.json(result);
    }
  );
});

router.put("/update/:id", middleware, async (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  const dlt_code = data.dlt_code;
  const obj = common.drivinglicense_type;

  const getDltCard = await runQuery(
    "SELECT * FROM  app_dlt_card WHERE  id= ? ",
    [id]
  );
  const card_number = getDltCard[0] !== undefined ? getDltCard[0]?.card_number : false;
  if (card_number === false) {
    return res.status(404).json({
      status: 404,
      message: "Data is null",
    });
  }

  let objValue = [];
  for (let i = 0; i < dlt_code.length; i++) {
    const el = dlt_code[i];
    const result_filter = obj.filter(function (e) {
      return e.dlt_code === el;
    });
    if (result_filter.length <= 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'dlt_code' ",
      });
    }
    let newObj = [`${el}`, `${id}`];
    objValue.push(newObj);
  }


  await runQuery("DELETE FROM  app_dlt_card_type WHERE dlt_card_id=?", [id]);
  // dlt_type
  let sql = " INSERT INTO app_dlt_card_type (dlt_code,dlt_card_id) VALUES ? ";
  await runQuery(sql, [objValue]);
  con.query(
    "UPDATE  app_dlt_card SET full_name = ? ,address = ?, front_img=?,back_img=?,issue_date=? , expiry_date=? ,udp_date=? WHERE id=?",
    [
      data.full_name,
      data.address,
      data.front_img,
      data.back_img,
      data.issue_date,
      data.expiry_date,
      functions.dateAsiaThai(),
      id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});

router.delete("/delete/:id", middleware, async (req, res, next) => {
  const { id } = req.params;

  const getDltCard = await runQuery(
    "SELECT * FROM  app_dlt_card WHERE  id= ? ",
    [id]
  );
  const card_number = getDltCard[0] !== undefined ? getDltCard[0]?.card_number : false;
  if (card_number === false) {
    return res.status(404).json({
      status: 404,
      message: "Data is null",
    });
  }

  const r = await runQuery("DELETE FROM  app_dlt_card WHERE id=?", [id]);
  await runQuery("DELETE FROM  app_dlt_card_type WHERE dlt_card_id=?", [id]);
  return res.json(r);
});

router.get("/list?", middleware,async (req, res, next) => {
  const user_id = req.query.user_id;
  //   console.log(user_id);
  const date = new Date(functions.dateAsiaThai());
  const dateStr = date.toISOString().split("T")[0];

  
  const getDltCardAll = await runQuery(
    "SELECT app_dlt_card.*,CONCAT(app_user.user_firstname ,' ' , app_user.user_lastname) AS fullname_create FROM  app_dlt_card INNER JOIN app_user ON app_user.user_id = app_dlt_card.user_id WHERE  app_dlt_card.user_id = ?  AND DATE(app_dlt_card.expiry_date) > ? ORDER BY app_dlt_card.id DESC",
    [user_id,dateStr]
  );
  let obj = [];
  for (let i = 0; i < getDltCardAll.length; i++) {
    const el = getDltCardAll[i];
    const dlttypes = await runQuery(
      "SELECT * FROM `app_dlt_card_type` WHERE dlt_card_id = ?",
      [el?.id]
    );
    const newObj = {
      id: el?.id,
      card_number: el?.card_number,
      full_name: el?.full_name,
      address: el?.address,
      front_img: el?.front_img,
      back_img: el?.back_img,
      issue_date: el?.issue_date,
      expiry_date: el?.expiry_date,
      crt_date: el?.crt_date,
      udp_date: el?.udp_date,
      user_create: el?.fullname_create,
      dlt_types: dlttypes,
    };
    obj.push(newObj);
  }
  return res.json(obj)
});

router.get("/check/expiry_date", middleware, (req, res, next) => {
  const user_id = req.query.user_id;
  Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };
  const date = new Date();
  const start = date.toISOString().split("T")[0];
  const end = date.addDays(30).toISOString().split("T")[0];

  con.query(
    " SELECT  *  FROM app_dlt_card WHERE user_id  = ? AND DATE(expiry_date) BETWEEN ? AND  ? ",
    [user_id, start, end],
    (err, rows) => {
      return res.json(rows);
    }
  );
});



router.post("/create/news", middleware, async (req, res, next) => {
  const data = req.body;


  const dlt_code = data.dlt_code;
  const obj = common.drivinglicense_type;

  const id = functions.randomCode();
  const getUser = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_id]
  );
  const getUserCreate = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_create]
  );
  const user_id = getUser[0] !== undefined ? getUser[0]?.user_id : 0;
  const user_create =
    getUserCreate[0] !== undefined ? getUserCreate[0]?.user_id : 0;
  if (user_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Username Error",
    });
  }
  let objValue = [];
  for (let i = 0; i < dlt_code.length; i++) {
    const el = dlt_code[i];
    const result_filter = obj.filter(function (e) {
      return e.dlt_code === el;
    });
    if (result_filter.length <= 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'dlt_code' ",
      });
    }
    let newObj = [`${el}`, `${id}`];
    objValue.push(newObj);
  }

  const date = new Date(functions.dateAsiaThai());
  const dateStr = date.toISOString().split("T")[0];
  const getAllCard = await runQuery(
    "SELECT COUNT(*) as numRows FROM app_dlt_card WHERE DATE(crt_date) = ?",
    [dateStr]
  );
  const total = getAllCard[0] !== undefined ? getAllCard[0]?.numRows : 1;
  const card_number =
    functions.yyyymmdd(dateStr) + functions.treeDigit(total + 1);
  // dlt_type
  let sql = " INSERT INTO app_dlt_card_type (dlt_code,dlt_card_id) VALUES ? ";
  await runQuery(sql, [objValue]);
  con.query(
    "INSERT INTO app_dlt_card (id,card_number,full_name,address,front_img,back_img,issue_date,expiry_date,crt_date,udp_date,user_id,user_create,address_lic,ap_number,type,number_licen,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      id,
      card_number,
      "-",
      "-",
      data.image_dlt,
      "-",
      data.issue_date,
      data.expiry_date,
      functions.dateAsiaThai(),
      functions.dateAsiaThai(),
      user_id,
      user_create,
      data.address_lic,
      data.ap_number,
      data.type,
      data.number_licen,
      'Y'
    ],
    function (err, result) {
      if (err) throw err;
      result.insertId = id;
      return res.json(result);
    }
  );
 

});




router.post("/old", middleware, async (req, res, next) => {
  const data = req.body;


  con.query(
    "UPDATE  app_dlt_card SET status = ? WHERE user_id=?",
    [
      "D",
      data.user_id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );


});


router.get("/lastes/list?", middleware,async (req, res, next) => {
  const user_id = req.query.user_id;

  const getDltCardAll = await runQuery(
    "SELECT * FROM  app_dlt_card where status = 'Y' AND user_id = ? LIMIT 1",
    [user_id]
  );
  let obj = [];
  for (let i = 0; i < getDltCardAll.length; i++) {
    const el = getDltCardAll[i];
    const dlttypes = await runQuery(
      "SELECT * FROM `app_dlt_card_type` WHERE dlt_card_id = ?",
      [el?.id]
    );
    const newObj = {
      id: el?.id,
      address_lic: el?.address_lic,
      ap_number: el?.ap_number,
      type: el?.type,
      number_licen: el?.number_licen,
      front_img: el?.front_img,
      issue_date: el?.issue_date,
      expiry_date: el?.expiry_date,
      crt_date: el?.crt_date,
      udp_date: el?.udp_date,
      user_create: el?.fullname_create,
      dlt_types: dlttypes,
    };
    obj.push(newObj);
  }
  return res.json(obj)
});

router.get("/lastesid/list?", middleware,async (req, res, next) => {
  const id = req.query.id;

  const getDltCardAll = await runQuery(
    "SELECT * FROM  app_dlt_card where status = 'Y' AND id = ? LIMIT 1",
    [id]
  );
  let obj = [];
  for (let i = 0; i < getDltCardAll.length; i++) {
    const el = getDltCardAll[i];
    const dlttypes = await runQuery(
      "SELECT * FROM `app_dlt_card_type` WHERE dlt_card_id = ?",
      [el?.id]
    );
    const newObj = {
      id: el?.id,
      address_lic: el?.address_lic,
      ap_number: el?.ap_number,
      type: el?.type,
      number_licen: el?.number_licen,
      front_img: el?.front_img,
      issue_date: el?.issue_date,
      expiry_date: el?.expiry_date,
      crt_date: el?.crt_date,
      udp_date: el?.udp_date,
      user_create: el?.fullname_create,
      dlt_types: dlttypes,
    };
    obj.push(newObj);
  }
  return res.json(obj)
});


router.get("/listall?", middleware,async (req, res, next) => {
  const user_id = req.query.user_id;

  const getDltCardAll = await runQuery(
    "SELECT A.id,GROUP_CONCAT(C.dlt_code ORDER BY C.dlt_code SEPARATOR '/') AS dlt,A.*,(SELECT user_name from app_user where user_id = A.user_create) as full_name_create FROM  app_dlt_card A LEFT JOIN app_user B ON A.user_id = B.user_id  LEFT JOIN app_dlt_card_type C ON A.id = C.dlt_card_id WHERE A.user_id = ? GROUP BY A.id ORDER BY A.crt_date ASC",
    [user_id]
  );

  return res.json(getDltCardAll)
});


router.post("/listoneway", middleware,async (req, res, next) => {
  const data = req.body;

  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  

  let search_param = [];
  let u = "";
  let c = "";


  let _check_user = await runQuery(
    "SELECT A.user_id,A.user_type,B.location_id,C.* FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id WHERE A.user_id = ?",
    [data.user_id]
  );

  if(_check_user[0].user_type == '1'){

    let sql = "SELECT A.id as ids,GROUP_CONCAT(C.dlt_code ORDER BY C.dlt_code SEPARATOR '/') AS dlt,A.*,(SELECT user_name from app_user where user_id = A.user_create) as full_name_create,D.location_id,D.country_id,E.* FROM  app_dlt_card A LEFT JOIN app_user B ON A.user_id = B.user_id LEFT JOIN app_dlt_card_type C ON A.id = C.dlt_card_id LEFT JOIN app_user_detail D ON A.user_id = D.user_id LEFT JOIN app_zipcode_lao E ON E.id = D.location_id  WHERE A.status = 'Y'";
    let sql_count = `SELECT COUNT(*) as numRows FROM  app_dlt_card A WHERE A.status = 'Y'`;
  
    if (search !== "" || search.length > 0) {
      // sql += ` AND (user_name  LIKE  '%${search}%' OR user_firstname  LIKE  '%${search}%' OR user_lastname  LIKE  '%${search}%' OR user_email  LIKE  '%${search}%' OR user_phone  LIKE  '%${search}%')`; //
      let q = ` AND (A.id  LIKE ? OR A.number_licen  LIKE  ? OR A.address_lic  LIKE  ?)`; //
      sql += q;
      sql_count += q;
      search_param = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ];
    }
  
   c = "GROUP BY A.id ORDER BY A.crt_date ASC"; 
     sql += c;
   
  
  const getCountAll = await runQuery(sql_count,search_param);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
  const total_filter = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
   
  sql += ` LIMIT ${offset},${per_page} `;
  
      let getContent = await runQuery(sql, search_param);
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
    
  }

  if(_check_user[0].user_type == '2'){

    let sql = "SELECT A.id as ids,GROUP_CONCAT(C.dlt_code ORDER BY C.dlt_code SEPARATOR '/') AS dlt,A.*,(SELECT user_name from app_user where user_id = A.user_create) as full_name_create,D.location_id,D.country_id,E.* FROM  app_dlt_card A LEFT JOIN app_user B ON A.user_id = B.user_id LEFT JOIN app_dlt_card_type C ON A.id = C.dlt_card_id LEFT JOIN app_user_detail D ON A.user_id = D.user_id LEFT JOIN app_zipcode_lao E ON E.id = D.location_id  WHERE A.status = 'Y' AND E.province_code =?";
    let sql_count = `SELECT COUNT(*) as numRows FROM  app_dlt_card A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id WHERE A.status = 'Y' AND C.province_code = ?`;
  
    if (search !== "" || search.length > 0) {
      // sql += ` AND (user_name  LIKE  '%${search}%' OR user_firstname  LIKE  '%${search}%' OR user_lastname  LIKE  '%${search}%' OR user_email  LIKE  '%${search}%' OR user_phone  LIKE  '%${search}%')`; //
      let q = ` AND (A.id  LIKE ? OR A.number_licen  LIKE  ? OR A.address_lic  LIKE  ?)`; //
      sql += q;
      sql_count += q;
      search_param = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ];
    }
  
   c = "GROUP BY A.id ORDER BY A.crt_date ASC"; 
     sql += c;
   
  
  const getCountAll = await runQuery(sql_count,[_check_user[0].province_code],search_param);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
  const total_filter = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
   
  sql += ` LIMIT ${offset},${per_page} `;
  
      let getContent = await runQuery(sql,[_check_user[0].province_code], search_param);
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
    
  }
});



router.post("/listallway", middleware,async (req, res, next) => {
  const data = req.body;

  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  

  let search_param = [];
  let u = "";
  let c = "";


  let sql = "SELECT A.id as ids,GROUP_CONCAT(C.dlt_code ORDER BY C.dlt_code SEPARATOR '/') AS dlt,A.*,(SELECT user_name from app_user where user_id = A.user_create) as full_name_create,D.location_id,D.country_id,E.* FROM  app_dlt_card A LEFT JOIN app_user B ON A.user_id = B.user_id LEFT JOIN app_dlt_card_type C ON A.id = C.dlt_card_id LEFT JOIN app_user_detail D ON A.user_id = D.user_id LEFT JOIN app_zipcode_lao E ON E.id = D.location_id  WHERE A.status = 'Y'";
  let sql_count = `SELECT COUNT(*) as numRows FROM  app_dlt_card A WHERE A.status = 'Y'`;

  if (search !== "" || search.length > 0) {
    // sql += ` AND (user_name  LIKE  '%${search}%' OR user_firstname  LIKE  '%${search}%' OR user_lastname  LIKE  '%${search}%' OR user_email  LIKE  '%${search}%' OR user_phone  LIKE  '%${search}%')`; //
    let q = ` AND (A.id  LIKE ? OR A.number_licen  LIKE  ? OR A.address_lic  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];
  }

 c = "GROUP BY A.id ORDER BY A.crt_date ASC"; 
   sql += c;
 

const getCountAll = await runQuery(sql_count,search_param);
const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
const total_filter = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
 
sql += ` LIMIT ${offset},${per_page} `;

    let getContent = await runQuery(sql, search_param);
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







router.put("/updatenew/:id", middleware, async (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  const dlt_code = data.dlt_code;
  const obj = common.drivinglicense_type;

  const getDltCard = await runQuery(
    "SELECT * FROM  app_dlt_card WHERE  id= ? ",
    [id]
  );
  const card_number = getDltCard[0] !== undefined ? getDltCard[0]?.card_number : false;
  if (card_number === false) {
    return res.status(404).json({
      status: 404,
      message: "Data is null",
    });
  }

  let objValue = [];
  for (let i = 0; i < dlt_code.length; i++) {
    const el = dlt_code[i];
    const result_filter = obj.filter(function (e) {
      return e.dlt_code === el;
    });
    if (result_filter.length <= 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'dlt_code' ",
      });
    }
    let newObj = [`${el}`, `${id}`];
    objValue.push(newObj);
  }


  await runQuery("DELETE FROM  app_dlt_card_type WHERE dlt_card_id=?", [id]);
  // dlt_type
  let sql = " INSERT INTO app_dlt_card_type (dlt_code,dlt_card_id) VALUES ? ";
  await runQuery(sql, [objValue]);
  con.query(
    "UPDATE  app_dlt_card SET number_licen = ? ,address_lic = ?, front_img=?,issue_date=? ,expiry_date=? ,type=? ,udp_date=? WHERE id=?",
    [
      data.number_licen,
      data.address_lic,
      data.image_dlt,
      data.issue_date,
      data.expiry_date,
      data.type,
      functions.dateAsiaThai(),
      id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});


router.post("/updatedltstatus", middleware,async (req, res, next) => {
  const data = req.body;

  con.query(
    "UPDATE app_dlt_card SET type_status =?, etc=? WHERE id=?",
    [
      data.type_status,
      data.etc,
      data.id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );



});

module.exports = router;
