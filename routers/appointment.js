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


router.post("/newcreate", middleware, async (req, res, next) => {
  const data = req.body;

  // let start = new Date(data.ap_date_start).toISOString().split('T')[0]; // YYYY-MM-DD
  // let end = new Date(data.ap_date_end).toISOString().split('T')[0]; // YYYY-MM-DD

  const startDate = new Date(data.ap_date_start); // วันที่เริ่มต้น
  const endDate = new Date(data.ap_date_end);   // วันที่สิ้นสุด
  
  let currentDate = new Date(data.ap_date_start); // เริ่มต้นที่ startDate




 
     

  const LoaDays = data.day

  const user_id = data.user_id;
  const user_full = data.peop_addrs;

  const group_id = data.group_id;

  const peop_addrs = data.peop_addrs;
  

  let now = new Date();

// Set the time to 21:00:00
now.setHours(data.selectedDateTime.hours); // Set hours to 21
now.setMinutes(data.selectedDateTime.minutes); // Set minutes to 0
now.setSeconds(data.selectedDateTime.seconds); // Set seconds to 0

let time = now.toTimeString().split(' ')[0]; // Extracts '21:00:00'

let fas = [];
let dltas = [];

let _check_user = await runQuery(
  "SELECT A.user_id,A.user_type,B.location_id,C.* FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id WHERE A.user_id = ?",
  [data.user_id]
);



  // วนลูปแต่ละวันจนถึง endDate
  while (currentDate <= endDate) {
    const LoaDay = LoaDays[currentDate.getDay()];
    if(LoaDay.select == true){
      ///////////////////เช็ค วันที่ นัด หมายก่อน  
     
      let getContent = await runQuery(
        "select COUNT(*) as numRows from app_appointment where  cancelled = 1 AND ap_date_first=? AND group_id =?",
        [currentDate.toISOString().split('T')[0],group_id]
      );

  
      if(getContent[0]?.numRows == 0){
        let result = await runQuery(
        "INSERT INTO app_appointment (ap_learn_type,ap_quota,ap_date_start,ap_date_end,ap_date_first,ap_remark,dlt_code,crt_date,udp_date,user_udp,user_crt,time,group_id,day,peop_addrs) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [2, data.ap_quota,data.ap_date_start,data.ap_date_end,currentDate.toISOString().split('T')[0],'-','-',functions.dateAsiaThai(),functions.dateAsiaThai(), user_id,user_id,time,group_id,LoaDay.days,peop_addrs]
        
      )
      let ap_id = result.insertId;
      ////////////////////////////
      /////////////////// Loop  DLT ////////////
      for (var i=0; i<data.dlt_code.length; i++) {
   
            let checktype = await runQuery(
        "select COUNT(*) as numRows from app_appointment_type where ap_id = ? AND dlt_code =?",
        [ap_id,data.dlt_code[i]]
      );   
     
 /////////////////// ตรวจสอบว่า มีข้อมูล DLT ไหม ////////////
      if(checktype[0]?.numRows == 0){
         let result = await runQuery(
        "INSERT INTO app_appointment_type (ap_id,udp_date,dlt_code) VALUES (?,?,?)",
        [ap_id,functions.dateAsiaThai(),data.dlt_code[i]])
      }

     }


      }

       /////////////////// กรณี มีวันแล้วแต่เพิ่ม ประเภท ////////////
      if(getContent[0]?.numRows == 1){
        
        for (var i=0; i<data.dlt_code.length; i++) {
     
          let getday = await runQuery(
            "select * from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id where A.cancelled=1 AND A.ap_date_first = ? AND group_id =?  LIMIT 1",
            [currentDate.toISOString().split('T')[0],group_id]
          );

          let getdayget = await runQuery(
            "select COUNT(*) as numRows from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id where A.cancelled=1 AND A.ap_date_first = ? AND B.dlt_code = ? AND group_id =? LIMIT 1",
            [currentDate.toISOString().split('T')[0],data.dlt_code[i],group_id]
          );

let ap_id = getday[0].ap_id;

if(getdayget[0]?.numRows == 0){
       let result = await runQuery(
      "INSERT INTO app_appointment_type (ap_id,udp_date,dlt_code) VALUES (?,?,?)",
      [ap_id,functions.dateAsiaThai(),data.dlt_code[i]])
    }

    if(getdayget[0]?.numRows == 1){
       t = {day:currentDate.toISOString().split('T')[0],dlt:data.dlt_code[i],status:false};
      fas.push(t);
     }
   }
      }
    
    }

  
  
    // เพิ่มวันที่ทีละ 1 วัน
    currentDate.setDate(currentDate.getDate() + 1);
 

    
  }

  const response = {dayfalse:fas,dltfalase:dltas
  };
  return res.json(response);

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

router.post("/listall", middleware, async (req, res, next) => {
  const data = req.body;

  const start = data.ap_date_start;
  const end = data.ap_date_end;

  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let total = 0;
  let total_filter = 0;


  let _check_user = await runQuery(
    "SELECT A.user_id,A.user_type,B.location_id,C.*,D.group,E.`name` FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id LEFT JOIN app_group_users D ON D.users_id = A.user_id LEFT JOIN app_group E ON E.group_id = D.group_id where A.user_id = ?",
    [data.user_id]
  );


  if(_check_user[0].user_type == '1'){


    let sql = `
    SELECT A.province_code,A.ap_id,SUM(A.ap_quota) As quata,A.time,A.ap_date_first,F.user_firstname,F.user_lastname,A.peop_addrs,GROUP_CONCAT(B.dlt_code ORDER BY B.dlt_code SEPARATOR '/') AS dlt,IFNULL(E.order_count, 0) AS available from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id 
    LEFT JOIN app_user F ON F.user_id = A.user_crt
    LEFT JOIN (select ap_id,dlt_code,COUNT(*) AS order_count  from app_appointment_reserve o GROUP BY o.ap_id) E ON A.ap_id = E.ap_id GROUP BY A.ap_id,A.ap_quota
    HAVING A.ap_date_first BETWEEN ? AND ?
       `;
        // console.log(date_event);
    
    
        sql += ` LIMIT ${offset},${per_page} `;
        let getAppointment = await runQuery(sql,[start,end]);
    
    
    
        let sql_count =
        "select COUNT(*) as numRows  from app_appointment A WHERE A.cancelled = 1 AND A.ap_date_first BETWEEN ? AND ?";
      let getCountAll = await runQuery(sql_count,[start,end]);
    
      total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
    
      
    
      const response = {
        total: total, // จำนวนรายการทั้งหมด
        total_filter: total, // จำนวนรายการทั้งหมด
        current_page: current_page, // หน้าที่กำลังแสดงอยู่
        limit_page: per_page, // limit data
        total_page: Math.ceil(total / per_page), // จำนวนหน้าทั้งหมด
        search: search, // คำค้นหา
        data: getAppointment, // รายการข้อมูล
      };
    
      return res.json(response);

  }

  if(_check_user[0].user_type == '2'){
    

     
 

    
    let sql = `
    SELECT A.day,A.group_id,G.name,A.ap_id,SUM(A.ap_quota) As quata,A.time,A.ap_date_first,F.user_firstname,F.user_lastname,A.peop_addrs,GROUP_CONCAT(B.dlt_code ORDER BY B.dlt_code SEPARATOR '/') AS dlt,IFNULL(E.order_count, 0) AS available from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id 
    LEFT JOIN app_user F ON F.user_id = A.user_crt
    LEFT JOIN app_group G ON G.group_id = A.group_id
    LEFT JOIN (select ap_id,dlt_code,COUNT(*) AS order_count  from app_appointment_reserve o GROUP BY o.ap_id) E ON A.ap_id = E.ap_id GROUP BY A.ap_id,A.ap_quota
    HAVING A.ap_date_first BETWEEN ? AND ? AND A.group_id = ?
       `;
        // console.log(date_event);
    
    
        sql += ` LIMIT ${offset},${per_page} `;
        let getAppointment = await runQuery(sql,[start,end,_check_user[0].group]);
    
    
    
        let sql_count =
        "select COUNT(*) as numRows  from app_appointment A WHERE A.cancelled = 1 AND A.ap_date_first BETWEEN ? AND ?";
      let getCountAll = await runQuery(sql_count,[start,end]);
    
      total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
    
      
    
      const response = {
        total: total, // จำนวนรายการทั้งหมด
        total_filter: total, // จำนวนรายการทั้งหมด
        current_page: current_page, // หน้าที่กำลังแสดงอยู่
        limit_page: per_page, // limit data
        total_page: Math.ceil(total / per_page), // จำนวนหน้าทั้งหมด
        search: search, // คำค้นหา
        data: getAppointment, // รายการข้อมูล
      };
    
      return res.json(response);

  }

 
});


router.post("/totalquata", middleware, async (req, res, next) => {

  const data = req.body;

  const id = data.id;
  
  let sql = `
SELECT A.ap_id,A.dlt_code,C.ap_quota,(Select COUNT(*) from app_appointment_reserve o where o.dlt_code = A.dlt_code AND o.ap_id = A.ap_id)  AS alva from app_appointment_type A 
LEFT JOIN app_appointment_reserve B ON A.ap_id = B.ap_id
LEFT JOIN app_appointment C ON C.ap_id = A.ap_id
where A.ap_id = ? GROUP BY A.dlt_code
   `;

   let getAppointment = await runQuery(sql,[id]);

  return res.json(getAppointment);
});

router.get("/event/new", middleware, async (req, res, next) => {
  let ap_learn_type = req.query.ap_learn_type;
  let dlt_code = req.query.dlt_code;
  let user_id = req.query.user_id;
  const present_day = new Date().toISOString().split("T")[0];
  const ap_date_first = new Date().toISOString().split("T")[0];


  const last_day = new Date(Date.now()+14*24*60*60*1000).toISOString().split("T")[0];


  let _check_user = await runQuery(
    "SELECT A.user_id,A.user_type,B.location_id,C.*,D.group,E.`name` FROM app_user A LEFT JOIN app_user_detail B ON A.user_id = B.user_id LEFT JOIN app_zipcode_lao C ON B.location_id = C.id LEFT JOIN app_group_users D ON D.users_id = A.user_id LEFT JOIN app_group E ON E.group_id = D.group_id where A.user_id = ?",
    [data.user_id]
  );


  const provice = _check_user[0].provice;


  if(_check_user[0].user_type == '1'){

    con.query(
      "SELECT A.province_code,A.ap_id,A.ap_quota,A.ap_date_first,B.dlt_code,A.time,IFNULL(E.order_count, 0) AS available,A.province_code,F.province_name from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id LEFT JOIN (select ap_id,dlt_code,COUNT(*) AS order_count  from app_appointment_reserve o GROUP BY o.ap_id,o.dlt_code) E ON A.ap_id = E.ap_id AND B.dlt_code = E.dlt_code LEFT JOIN app_zipcode_lao F ON A.province_code = F.province_code where B.dlt_code = ? AND A.ap_date_first >= ? and A.ap_date_first <= ?  GROUP BY A.ap_id",
      [dlt_code,present_day,last_day],
      (err, result) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Bad Request", // error.sqlMessage
          });
        }
        return res.json(result);
      }
    );

  }

  if(_check_user[0].user_type == '2'){
  
    con.query(
      "SELECT A.ap_id,A.ap_quota,A.ap_date_first,B.dlt_code,A.time,IFNULL(E.order_count, 0) AS available,A.province_code,F.province_name,A.group_id from app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id LEFT JOIN (select ap_id,dlt_code,COUNT(*) AS order_count  from app_appointment_reserve o GROUP BY o.ap_id,o.dlt_code) E ON A.ap_id = E.ap_id AND B.dlt_code = E.dlt_code LEFT JOIN app_zipcode_lao F ON A.province_code = F.province_code where B.dlt_code = ? AND A.ap_date_first >= ? and A.ap_date_first <= ? AND A.group_id = ? GROUP BY A.ap_id",
      [dlt_code,present_day,last_day,_check_user[0].group],
      (err, result) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Bad Request", // error.sqlMessage
          });
        }
        return res.json(result);
      }
    );
    
  }




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
    "INSERT INTO app_appointment_reserve (ap_id,user_id,udp_date,app_status) VALUES (?,?,?,?)",
    [ap_id, user_id, functions.dateAsiaThai(),'Y']
  );
  return res.json(_content);
});


router.post("/reserve/new/create", middleware, async (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;
  const ap_id = data.ap_id;
  const ap_date_first = data.ap_date_first;
  const id_card = data.id_card;
  const dlt_code = data.dlt_code;
const a = [];
const test = functions.DigitRandom();


///////////////อันที่จองไว้แล้ว
let getMyReserve = await runQuery(
  "SELECT A.*,B.ap_date_first FROM app_appointment_reserve A LEFT JOIN app_appointment B ON A.ap_id = B.ap_id WHERE A.app_status = 'Y' AND A.user_id = ? AND B.ap_date_first = ?",
  [user_id,ap_date_first]
);

///////////////อันที่กำลังจะจอง
let getMyInReserve = await runQuery(
  "SELECT * FROM app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id where A.ap_id = ? And B.dlt_code = ?",
  [ap_id,dlt_code]
);

_check_reserve = getMyReserve.length;


if (_check_reserve >= 1) {
  _check_reserveIn = getMyInReserve;

  

  const datainarray = await functions.Arrayall(getMyReserve,_check_reserveIn);

const checkdup = await functions.Checkdupi(datainarray);



////////////////////กรณี ซ้ำ
if(checkdup == true){
  return res.status(201).json({
    status: 201,
    message:
      "You have entered an ap_id and user_id that already exists in this column. Only unique ap_id and user_id are allowed.",
  });
}
////////////////////กรณี ไม่ซ้ำ
if(checkdup == false){
  const quota = _check_reserveIn[0].ap_quota

  let getquota = await runQuery(
    "SELECT COUNT(*) as total FROM app_appointment_reserve where ap_id = ? AND app_status = 'Y' limit 1",
    [ap_id]
  );
  if(getquota[0].total >= quota){
    return res.status(202).json({
      status: 202,
      message:
        "FULL",
    });
  }else {

    let _content = await runQuery(
      "INSERT INTO app_appointment_reserve (ap_id,user_id,ap_number,udp_date,app_status,id_card,dlt_code) VALUES (?,?,?,?,?,?,?)",
      [ap_id, user_id ,test, functions.dateAsiaThai(),'Y',id_card,dlt_code]
    );
    
    
        return res.status(200).json({
          status: 200,
          message:
          _content,
        });



  }
}

}


if (_check_reserve == 0) {
 


  let getMyInReserve = await runQuery(
    "SELECT * FROM app_appointment A LEFT JOIN app_appointment_type B ON A.ap_id = B.ap_id where A.ap_id = ? And B.dlt_code = ?",
    [ap_id,dlt_code]
  );
  const quota = getMyInReserve[0].ap_quota

  let getquota = await runQuery(
    "SELECT COUNT(*) as total FROM app_appointment_reserve where ap_id = ? AND app_status = 'Y' limit 1",
    [ap_id]
  );
  if(getquota[0].total >= quota){
    return res.status(202).json({
      status: 202,
      message:
        "FULL",
    });
  }else {

    let _content = await runQuery(
  "INSERT INTO app_appointment_reserve (ap_id,user_id,ap_number,udp_date,app_status,id_card,dlt_code) VALUES (?,?,?,?,?,?,?)",
  [ap_id, user_id ,test, functions.dateAsiaThai(),'Y',id_card,dlt_code]
);


    return res.status(200).json({
      status: 200,
      message:
      _content,
    });
  }

}




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
  SELECT t1.*, t2.ap_date_first,t2.dlt_code,t2.type,
  (SELECT   GROUP_CONCAT((JSON_OBJECT('ap_id', t5.ap_id,'ap_learn_type', t5.ap_learn_type,'ap_quota', t5.ap_quota , 'ap_date_start', t5.ap_date_start,'ap_date_end', t5.ap_date_end,'ap_remark', t5.ap_remark,'dlt_code', t5.dlt_code)))  FROM app_appointment t5  WHERE t5.ap_id =  t1.ap_id ) AS appointment_detail
  FROM app_appointment_reserve t1  INNER JOIN app_appointment t2 ON t2.ap_id = t1.ap_id AND t2.cancelled=1 WHERE t1.user_id = ?`;
  con.query(sql, [user_id], function (err, result) {
    if (err) throw err;
    let obj = [];
    result.forEach((el) => {
      let appointment_detail = JSON.parse(el?.appointment_detail);
      let newObj = {
        ar_id: el?.ar_id,
        ap_id: el?.ap_id,
        ap_date_first: el?.ap_date_first,
        dlt_code: el?.dlt_code,
        type: el?.type,
        user_id: el?.user_id,
        udp_date: el?.udp_date,
        ap_number: el?.ap_number,
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

router.post("/dateappointment", middleware, async (req, res, next) => {



  const data = req.body;
  const ap_date_start = data.ap_date_start;
  const user_id = data.user_id;
  const location = data.location_id;
  const user_type = data.user_type;



 

  if(user_type == 1){


    let sql = `select A.ar_id,A.dlt_code,B.ap_date_first,B.time,A.user_id,A.ap_number,A.id_card,A.st_id,A.app_status,(SELECT mr_score FROM app_main_result WHERE user_id= A.user_id AND mr_learn_type = 1 AND dlt_code = A.dlt_code) AS thero,(SELECT mr_score FROM app_main_result WHERE user_id= A.user_id AND mr_learn_type = 2 AND dlt_code = A.dlt_code) AS pratic,(select mr_status from app_main_result  WHERE user_id= A.user_id AND mr_learn_type = 1 AND dlt_code = A.dlt_code) AS mr_status_t,(select mr_status from app_main_result  WHERE user_id= A.user_id AND mr_learn_type = 2 AND dlt_code = A.dlt_code) AS mr_status_p,C.*,D.*
from app_appointment_reserve A 
LEFT JOIN app_appointment B ON A.ap_id = B.ap_id
LEFT JOIN app_user C ON C.user_id = A.user_id
LEFT JOIN app_user_detail D ON C.user_id = D.user_id
WHERE DATE(B.ap_date_first) = ? 
    `;
    let getContent = await runQuery(sql,[ap_date_start]);

      return res.json(getContent);
    

  }

  if(user_type == 2){

    let sqls = `select * from app_zipcode_lao where id = ? `;

    let getContentpr = await runQuery(sqls,[location]);


    let sql = `select A.ar_id,A.dlt_code,B.ap_date_first,B.time,A.user_id,A.ap_number,A.id_card,A.st_id,A.app_status,(SELECT mr_score FROM app_main_result WHERE user_id= A.user_id AND mr_learn_type = 1 AND dlt_code = A.dlt_code) AS thero,(SELECT mr_score FROM app_main_result WHERE user_id= A.user_id AND mr_learn_type = 2 AND dlt_code = A.dlt_code) AS pratic,(select mr_status from app_main_result  WHERE user_id= A.user_id AND mr_learn_type = 1 AND dlt_code = A.dlt_code) AS mr_status_t,(select mr_status from app_main_result  WHERE user_id= A.user_id AND mr_learn_type = 2 AND dlt_code = A.dlt_code) AS mr_status_p,C.*,D.*
from app_appointment_reserve A 
LEFT JOIN app_appointment B ON A.ap_id = B.ap_id
LEFT JOIN app_user C ON C.user_id = A.user_id
LEFT JOIN app_user_detail D ON C.user_id = D.user_id
LEFT JOIN app_zipcode_lao E ON E.id = D.location_id
WHERE DATE(B.ap_date_first) = ? AND E.province_code = ?
`;
let getContent = await runQuery(sql,[ap_date_start,getContentpr[0].province_code]);
  return res.json(getContent);
  }


});

////////////ยกเลิกนัดหมาย
router.post("/cancelapp", middleware, async (req, res, next) => {
  const data = req.body;

  con.query(
    "UPDATE app_appointment_reserve SET app_status=?,remark=? WHERE ap_number=?",
    [
      "C",
      data.remark,
      data.ap_number
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );

  });
////////////ยืนยันเอกสาร
  router.post("/veri", middleware, async (req, res, next) => {
    const data = req.body;
  
    con.query(
      "UPDATE app_appointment_reserve SET remark_verify=?,st_id=?,check_document=? WHERE ap_number=?",
      [
        data.remarkcheck,
        data.division,
       'pass',
        data.ap_number
      ],
      function (err, result) {
        if (err) throw err;
        return res.json(result);
      }
    );
    });

////////////ค้นหาหมายเลขนัดหมาย
router.post("/dateappointment/appbyuser", middleware, async (req, res, next) => {
  const data = req.body;
  const ap_number = req.ap_number;
  
  let getContent = await runQuery(
    "SELECT *,A.dlt_code As dlt_types from app_appointment_reserve A LEFT JOIN app_user B ON A.user_id = B.user_id LEFT JOIN app_appointment C ON C.ap_id = A.ap_id LEFT JOIN app_user_detail D ON D.user_id = A.user_id LEFT JOIN app_zipcode_lao E ON D.location_id = E.id LEFT JOIN app_country F ON D.country_id = F.country_id WHERE A.ap_number =? LIMIT 1",
    [data.ap_number]
  );
  const response = getContent;
  return res.json(response);

  });


  router.post("/dateappointment/divso", middleware, async (req, res, next) => {
    const data = req.body;
    const ap_id = req.ap_id;

    
    
  
    if(data.stat == 'new'){
      let getContent = await runQuery(
        "SELECT COUNT(*) as numRows from app_appointment_reserve A LEFT JOIN app_appointment B ON A.ap_id = B.ap_id WHERE A.ap_id =? AND A.dlt_code =? AND A.st_id IS NOT NULL",
        [data.ap_id,data.dlt_code]
      );
      return res.json(getContent[0]?.numRows + 1);
    }
    if(data.stat == 'same'){
      return res.json(0);
    }

  

    // return res.json(getContent[0]?.numRows);
  
    });

//

module.exports = router;
