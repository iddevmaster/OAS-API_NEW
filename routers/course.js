const express = require("express");
const router = express.Router();
const con = require("../database");
const fs = require("fs");
const middleware = require("../middleware");
const functions = require("../functions");
const common = require("../common");
async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}
async function delFile(path) {
  var filePath = path;
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return reject({ error: "Failed to delete the file." });
      }
      resolve({ message: "File deleted successfully." });
    });
  });
}

router.post("/create", middleware, (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;

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
      con.query(
        "INSERT INTO app_course (course_cover,course_code,course_name_lo,course_name_eng,course_description,course_remark_a,course_remark_b,crt_date,udp_date,user_crt,user_udp) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          data.course_cover,
          data.course_code,
          data.course_name_lo,
          data.course_name_eng,
          data.course_description,
          data.course_remark_a,
          data.course_remark_b,
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

router.put("/update/:course_id", middleware, (req, res, next) => {
  const { course_id } = req.params;
  const data = req.body;

  const user_id = data.user_id;
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

      con.query(
        "UPDATE  app_course SET course_cover=? , course_code=? ,course_name_lo=? ,course_name_eng = ? , course_description=?,course_remark_a=?,course_remark_b=?,udp_date=? , user_udp=? WHERE course_id=? ",
        [
          data.course_cover,
          data.course_code,
          data.course_name_lo,
          data.course_name_eng,
          data.course_description,
          data.course_remark_a,
          data.course_remark_b,
          functions.dateAsiaThai(),
          user_id,
          course_id,
        ],
        function (err, result) {
          if (err) throw err;

          return res.json(result);
        }
      );
    }
  );
});

router.delete("/delete/:course_id", middleware, (req, res, next) => {
  const { course_id } = req.params;
  con.query(
    "SELECT course_id FROM app_course WHERE course_id = ?",
    [course_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }

      con.query(
        "UPDATE  app_course SET cancelled=0 WHERE course_id=? ",
        [course_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});
router.get("/active/:active/:course_id", middleware, (req, res, next) => {
  const { active, course_id } = req.params;
  let val = active;
  if (active != 0 && active != 1) {
    val = 1;
  }
  con.query(
    "SELECT course_id FROM app_course WHERE course_id = ?",
    [course_id],
    (err, rows) => {
      let _content = rows.length;
      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      con.query(
        "UPDATE  app_course SET active = ? WHERE course_id=? ",
        [val, course_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.post("/list", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  const active_include = data.active_include;
  let ex = '("0")';
  if (active_include.length > 0) {
    const toArr = active_include.toString();
    ex = `(${toArr})`;
  }
  let search_param = [];
  let sql = `SELECT 
  app_course.course_id,
  app_course.course_cover,
  app_course.course_code,
  app_course.course_name_lo,
  app_course.course_name_eng,
  app_course.course_description,
  app_course.course_remark_a,
  app_course.course_remark_b,
  app_course.is_complete,
  app_course.crt_date,
  app_course.udp_date ,
  app_course.active,
  CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create , CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update ,
  IFNULL((SELECT COUNT(DISTINCT(app_course_lesson.cg_id))  AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id   LIMIT 1), 0) AS total_course_group,
  (SELECT COUNT(app_course_lesson.cs_id)  AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id  LIMIT 1) AS total_lesson ,
  (SELECT COUNT(app_course_lesson.cs_id)  AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id AND  app_course_lesson.cs_video != ''   LIMIT 1) AS total_video,
  (SELECT COUNT(*)  AS total  FROM  app_course_document  WHERE app_course_document.course_id=app_course.course_id   LIMIT 1) AS total_document,
  (SELECT COUNT(*)  AS total  FROM  app_exam_question INNER JOIN app_course_cluster ON app_course_cluster.cg_id = app_exam_question.cg_id AND app_course_cluster.course_id=app_course.course_id LIMIT 1) AS total_exam
  FROM app_course 
   LEFT JOIN  app_user u1 ON u1.user_id = app_course.user_crt  
   LEFT JOIN  app_user u2 ON u2.user_id = app_course.user_udp 
   WHERE 
   app_course.cancelled=1 AND
   app_course.active IN ${ex}
   `;

  let sql_count = ` SELECT  COUNT(*) as numRows FROM  app_course WHERE  cancelled=1 AND active IN ${ex} `;

  const getCountAll = await runQuery(sql_count);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_course.course_code  LIKE ? OR app_course.course_name_lo  LIKE  ? OR app_course.course_name_eng  LIKE  ? OR app_course.course_description  LIKE  ? OR app_course.course_remark_a  LIKE  ? OR app_course.course_remark_b  LIKE  ?)`; //
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

  const getCountFilter = await runQuery(sql_count, search_param);
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += `  ORDER BY app_course.course_id ASC LIMIT ${offset},${per_page} `;

  const getContent = await runQuery(sql, search_param);
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

router.get("/get/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const obj = common.drivinglicense_type;
  const getCourse = await runQuery(
    `SELECT app_course.*, 
  IFNULL((SELECT COUNT(DISTINCT(app_course_lesson.cg_id))   AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id   LIMIT 1), 0) AS total_course_group,
  (SELECT COUNT(app_course_lesson.cs_id)  AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id  LIMIT 1) AS total_lesson ,
  (SELECT COUNT(app_course_lesson.cs_id)  AS total  FROM  app_course_cluster INNER JOIN app_course_lesson ON app_course_cluster.cg_id = app_course_lesson.cg_id  WHERE app_course_cluster.course_id=app_course.course_id AND  app_course_lesson.cs_video != ''   LIMIT 1) AS total_video,
  (SELECT COUNT(*)  AS total  FROM  app_course_document  WHERE app_course_document.course_id=app_course.course_id   LIMIT 1) AS total_document,
  (SELECT COUNT(*)  AS total  FROM  app_exam_question INNER JOIN app_course_cluster ON app_course_cluster.cg_id = app_exam_question.cg_id AND app_course_cluster.course_id=app_course.course_id LIMIT 1) AS total_exam
    FROM 
    app_course 
    WHERE 
    app_course.course_id = ? AND
    app_course.cancelled = 1`,
    [course_id]
  );
  const getExam = await runQuery(
    "SELECT * FROM app_exam_main WHERE  course_id = ?",
    [course_id]
  );
  const reslut = getCourse[0];
  const reslutExam = getExam[0] !== undefined ? getExam[0] : {};

  if (getCourse[0] === undefined) {
    return res.status(204).json({
      status: 204,
      message: "Data is null",
    });
  }

  const result_filter = obj.filter(function (e) {
    return e.dlt_code === reslutExam?.dlt_code;
  });

  const exam = {
    em_id: reslutExam?.em_id,
    em_code: reslutExam?.em_code,
    em_name_lo: reslutExam?.em_name_lo,
    em_name_eng: reslutExam?.em_name_eng,
    em_cover: reslutExam?.em_cover,
    em_description: reslutExam?.em_description,
    em_random_amount: reslutExam?.em_random_amount,
    em_time: reslutExam?.em_time,
    em_measure: reslutExam?.em_measure,
    dlt_code: reslutExam?.dlt_code,
    crt_date: reslutExam?.crt_date,
    udp_date: reslutExam?.udp_date,
    course_id: reslutExam?.course_id,
    dlt_desc:result_filter[0] !== undefined ? result_filter[0] : {}
  };

  const response = {
    course_id: reslut?.course_id,
    course_cover: reslut?.course_cover,
    course_code: reslut?.course_code,
    course_name_lo: reslut?.course_name_lo,
    course_name_eng: reslut?.course_name_eng,
    course_description: reslut?.course_description,
    course_remark_a: reslut?.course_remark_a,
    course_remark_b: reslut?.course_remark_b,
    is_complete: reslut?.is_complete,
    crt_date: reslut?.crt_date,
    udp_date: reslut?.udp_date,
    active: reslut?.active,
    total_course_group: reslut?.total_course_group,
    total_lesson: reslut?.total_lesson,
    total_video: reslut?.total_video,
    total_document: reslut?.total_document,
    total_exam: reslut?.total_exam,
    exam_desc: exam,
  };
  return res.json(response);
});

router.post("/group/create", middleware, (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;

  con.query(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [user_id],
    (err, rows) => {
      let checkuser = rows?.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Username Error", // error.sqlMessage
        });
      }

      con.query(
        "INSERT INTO app_course_group (cg_name_lo,cg_name_eng,crt_date,udp_date,user_crt,user_udp) VALUES (?,?,?,?,?,?)",
        [
          data.cg_name_lo,
          data.cg_name_eng,
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

router.put("/group/update/:cg_id", middleware, (req, res, next) => {
  const { cg_id } = req.params;
  const data = req.body;

  const user_id = data.user_id;
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

      con.query(
        "UPDATE  app_course_group SET cg_name_lo=? ,cg_name_eng=?, udp_date=? , user_udp=? WHERE cg_id=? ",
        [
          data.cg_name_lo,
          data.cg_name_eng,
          functions.dateAsiaThai(),
          user_id,
          cg_id,
        ],
        function (err, result) {
          if (err) throw err;

          return res.json(result);
        }
      );
    }
  );
});
router.delete("/group/delete/:cg_id", middleware, (req, res, next) => {
  const { cg_id } = req.params;
  con.query(
    "UPDATE  app_course_group SET cancelled = 0 WHERE cg_id=? ",
    [cg_id],
    function (err, result) {
      if (err) throw err;

      return res.json(result);
    }
  );
});

router.get("/group/active/:active/:cg_id", middleware, (req, res, next) => {
  const { active, cg_id } = req.params;
  let val = active;
  if (active != 0 && active != 1) {
    val = 1;
  }
  con.query(
    "SELECT cg_id FROM app_course_group WHERE cg_id = ?",
    [cg_id],
    (err, rows) => {
      let _content = rows.length;
      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      con.query(
        "UPDATE  app_course_group SET active = ? WHERE cg_id=? ",
        [val, cg_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.post("/group/all", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  const active_include = data.active_include;
  let ex = '("0")';
  if (active_include.length > 0) {
    const toArr = active_include.toString();
    ex = `(${toArr})`;
  }
  let search_param = [];
  let sql = `SELECT 
     app_course_group.cg_id,
     app_course_group.cg_name_lo,
     app_course_group.cg_name_eng,
     app_course_group.crt_date,
     app_course_group.udp_date ,
     app_course_group.active ,
     CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create , 
     CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
     FROM app_course_group 
     LEFT JOIN  app_user u1 ON u1.user_id = app_course_group.user_crt  
     LEFT JOIN  app_user u2 ON u2.user_id = app_course_group.user_udp 
     WHERE 
     app_course_group.cancelled=1 AND
     app_course_group.active IN ${ex}`;
  let p = [];
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_course_group WHERE  app_course_group.cancelled=1 ";
  const getCountAll = await runQuery(sql_count, p);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_course_group.cg_name_lo  LIKE ? OR app_course_group.cg_name_eng  LIKE ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(sql_count, p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += `  ORDER BY app_course_group.cg_name_lo ASC LIMIT ${offset},${per_page} `;
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

router.get("/group/get/:cg_id", middleware, (req, res, next) => {
  const { cg_id } = req.params;
  con.query(
    "SELECT * FROM app_course_group WHERE cg_id = ? AND cancelled = 1",
    [cg_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      const reslut = rows[0];
      const response = {
        cg_id: reslut?.cg_id,
        cg_name_lo: reslut?.cg_name_lo,
        cg_name_eng: reslut?.cg_name_eng,
        cg_amount_random: reslut?.cg_amount_random,
        crt_date: reslut?.crt_date,
        udp_date: reslut?.udp_date,
        user_crt: reslut?.user_crt,
        user_udp: reslut?.user_udp,
        active: reslut?.active,
      };
      return res.json(response);
    }
  );
});

router.post("/lesson/create", middleware, async (req, res, next) => {
  const data = req.body;
  const user_id = data.user_id;

  const getCountCourseGroup = await runQuery(
    " SELECT  COUNT(*) as numRows FROM  app_course_group WHERE  cg_id = ? ",
    [data?.cg_id]
  );
  const check_coruse_group =
    getCountCourseGroup[0] !== undefined ? getCountCourseGroup[0]?.numRows : 0;
  if (check_coruse_group <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'cg_id' ",
    });
  }
  const getCountAll = await runQuery(
    " SELECT  COUNT(*) as numRows FROM  app_course_lesson WHERE  cg_id=? ",
    [data?.cg_id]
  );
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
  const insert = await runQuery(
    "INSERT INTO app_course_lesson (cs_cover,cs_name_lo,cs_name_eng,cs_video,cs_description,cs_sort,file_path,crt_date,udp_date,user_crt,user_udp,cg_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      data.cs_cover,
      data.cs_name_lo,
      data.cs_name_eng,
      data.cs_video,
      data.cs_description,
      parseInt(total) + 1,
      data.file_path,
      functions.dateAsiaThai(),
      functions.dateAsiaThai(),
      user_id,
      user_id,
      data.cg_id,
    ]
  );
  return res.json(insert);
});

router.put("/lesson/update/:cs_id", middleware, (req, res, next) => {
  const { cs_id } = req.params;
  const data = req.body;
  const user_id = data.user_id;

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

      con.query(
        "UPDATE  app_course_lesson SET cs_cover=? , cs_name_lo=? ,cs_name_eng=? ,cs_video=? ,cs_description=?,file_path=?,udp_date=? , user_udp=? ,cg_id=? WHERE cs_id=? ",
        [
          data.cs_cover,
          data.cs_name_lo,
          data.cs_name_eng,
          data.cs_video,
          data.cs_description,
          data.file_path,
          functions.dateAsiaThai(),
          user_id,
          data.cg_id,
          cs_id,
        ],
        function (err, result) {
          if (err) throw err;

          return res.json(result);
        }
      );
    }
  );
});

router.get("/lesson/get/:cs_id", middleware, (req, res, next) => {
  const { cs_id } = req.params;
  con.query(
    "SELECT * FROM app_course_lesson WHERE cs_id = ? AND cancelled = 1 ORDER BY cs_sort ASC",
    [cs_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      const reslut = rows[0];
      const response = {
        cs_id: reslut?.cs_id,
        cs_cover: reslut?.cs_cover,
        cs_name_lo: reslut?.cs_name_lo,
        cs_name_eng: reslut?.cs_name_eng,
        cs_video: reslut?.cs_video,
        cs_description: reslut?.cs_description,
        file_path: reslut?.file_path,
        crt_date: reslut?.crt_date,
        udp_date: reslut?.udp_date,
        user_crt: reslut?.user_crt,
        user_udp: reslut?.user_udp,
        cg_id: reslut?.cg_id, 
      };
      return res.json(response);
    }
  );
});

router.delete("/lesson/delete/:cs_id", middleware, (req, res, next) => {
  const { cs_id } = req.params;
  con.query(
    "SELECT * FROM app_course_lesson WHERE cs_id = ?",
    [cs_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }

      con.query(
        "UPDATE  app_course_lesson SET cancelled=0 WHERE cs_id=? ",
        [cs_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.post("/lesson/all/:cg_id", middleware, async (req, res, next) => {
  const { cg_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let search_param = [];
  let sql = `SELECT 
  app_course_lesson.cs_id,
  app_course_lesson.cs_cover,
  app_course_lesson.cs_name_lo,
  app_course_lesson.cs_name_eng,
  app_course_lesson.cs_video,
  app_course_lesson.cs_description ,
  app_course_lesson.crt_date,
  app_course_lesson.udp_date,
  app_course_group.cg_name_lo,   
  app_course_group.cg_name_eng,  
  CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create ,
  CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
     FROM  app_course_lesson 
     LEFT JOIN  app_user u1 ON u1.user_id = app_course_lesson.user_crt  
     LEFT JOIN  app_user u2 ON u2.user_id = app_course_lesson.user_udp 
     INNER JOIN  app_course_group ON app_course_group.cg_id  = app_course_lesson.cg_id 
     WHERE app_course_lesson.cancelled=1 AND 
     app_course_lesson.cg_id=?`;
  let p = [cg_id];
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_course_lesson WHERE  app_course_lesson.cg_id =? ";
  const getCountAll = await runQuery(sql_count, p);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
  if (total <= 0) {
    return res.status(400).json({
      status: 400,
      message: "Error Transactions",
    });
  }

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_course_lesson.cs_name_lo  LIKE ? OR app_course_lesson.cs_name_eng  LIKE ? OR app_course_lesson.cs_description  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(sql_count, p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += `ORDER BY app_course_lesson.cs_sort ASC LIMIT ${offset},${per_page}`;
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

router.put("/lesson/sort/:cg_id", middleware,async (req, res, next) => {
  const { cg_id } = req.params;
  const data = req.body;
  for (let i = 0; i < data.length; i++) {
    const el = data[i];
    await runQuery(
      " UPDATE  app_course_lesson SET cs_sort= ?  WHERE cs_id=? AND cg_id=? ",
      [i,el?.cs_id,cg_id]
    );
  }
  const getLessonAll = await runQuery(
    " SELECT * FROM app_course_lesson WHERE cg_id = ? ORDER BY cs_sort ASC",
    [cg_id]
  );
  return res.json(getLessonAll);
});


router.post(
  "/cluster/create/single/:course_id",
  middleware,
  async (req, res, next) => {
    const data = req.body;
    const { course_id } = req.params;
    const getCountAll = await runQuery(
      " SELECT  COUNT(*) as numRows FROM  app_course_cluster WHERE  course_id=? ",
      [course_id]
    );
    const id = functions.randomCode();
    //
    const getCountCourseGroup = await runQuery(
      " SELECT  COUNT(*) as numRows FROM  app_course_cluster WHERE  course_id=? AND cg_id = ? ",
      [course_id, data?.cg_id]
    );
    await runQuery(
      "UPDATE  app_course SET is_complete=1 ,udp_date=?  WHERE course_id = ? ",
      [functions.dateAsiaThai(), course_id]
    );
    const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
    const check_coruse_group =
      getCountCourseGroup[0] !== undefined
        ? getCountCourseGroup[0]?.numRows
        : 0;
    if (check_coruse_group > 0) {
      return res.status(404).json({
        status: 404,
        message: "Invalid 'cg_id' ",
      });
    }
    const insert = await runQuery(
      "INSERT INTO app_course_cluster (cct_id,cg_id,cg_amount_random,cg_sort,course_id) VALUES  (?,?,?,?,?)",
      [
        `${id}`,
        `${data?.cg_id}`,
        `${data?.cg_amount_random}`,
        `${parseInt(total) + 1}`,
        `${course_id}`,
      ]
    );
    insert.insertId = id;
    return res.json(insert);
  }
);
router.post(
  "/cluster/create/:course_id",
  middleware,
  async (req, res, next) => {
    const data = req.body;
    const { course_id } = req.params;
    const total = data.length;
    if (total <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Error Transaction",
      });
    }
    // Clear Last Data
    await runQuery("DELETE FROM app_course_cluster WHERE course_id = ? ", [
      course_id,
    ]);
    // Update Course
    await runQuery(
      "UPDATE  app_course SET is_complete=1 ,udp_date=?  WHERE course_id = ? ",
      [functions.dateAsiaThai(), course_id]
    );
    const sql =
      " INSERT INTO app_course_cluster (cct_id,cg_id,cg_amount_random,cg_sort,course_id) VALUES ? ";
    let obj = [];
    for (let i = 0; i < data.length; i++) {
      const el = data[i];
      let newObj = [
        `${functions.randomCode()}`,
        `${el?.cg_id}`,
        `${el?.cg_amount_random}`,
        `${i + 1}`,
        `${course_id}`,
      ];
      obj.push(newObj);
    }
    const r = await runQuery(sql, [obj]);
    return res.json(r);
  }
);
router.get("/cluster/get/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const getCourseGroupClustering = await runQuery(
    `SELECT app_course_cluster.* ,
    app_course_group.cg_name_lo,
    app_course_group.cg_name_eng,
    (SELECT COUNT(cl.cs_id)  AS total  FROM  app_course_cluster cc INNER JOIN app_course_lesson cl ON cc.cg_id = cl.cg_id  WHERE cc.course_id=app_course_cluster.course_id AND cc.cg_id =app_course_cluster.cg_id   LIMIT 1) AS total_lesson 
     FROM app_course_cluster 
     INNER JOIN app_course_group ON app_course_group.cg_id = app_course_cluster.cg_id
     WHERE  
    app_course_cluster.course_id = ? 
    ORDER BY 
    app_course_cluster.cg_sort ASC`,
    [course_id]
  );
  return res.json(getCourseGroupClustering);
});
router.get("/cluster/view/:cct_id", middleware, async (req, res, next) => {
  const { cct_id } = req.params;
  const r = await runQuery(
    "SELECT * FROM `app_course_cluster` WHERE cct_id =?",
    [cct_id]
  );
  return res.json(r);
});
router.put("/cluster/view/:cct_id", middleware, async (req, res, next) => {
  const data = req.body;
  const { cct_id } = req.params;
  const r = await runQuery(
    "UPDATE  app_course_cluster SET cg_amount_random= ? WHERE cct_id = ? ",
    [data?.cg_amount_random, cct_id]
  );
  r.insertId = cct_id;
  return res.json(r);
});
router.delete("/cluster/view/:cct_id", middleware, async (req, res, next) => {
  const { cct_id } = req.params;
  const r = await runQuery("DELETE FROM app_course_cluster WHERE cct_id = ? ", [
    cct_id,
  ]);
  return res.json(r);
});
router.delete(
  "/cluster/empty/:course_id",
  middleware,
  async (req, res, next) => {
    const { course_id } = req.params;
    // Update Course
    await runQuery(
      "UPDATE  app_course SET is_complete=0 ,udp_date=?  WHERE course_id = ? ",
      [functions.dateAsiaThai(), course_id]
    );
    const r = // Clear Last Data
      await runQuery("DELETE FROM app_course_cluster WHERE course_id = ? ", [
        course_id,
      ]);
    return res.json(r);
  }
);
// router.delete("/cluster/delete/:cct_id", middleware, (req, res, next) => {
//   const { cct_id } = req.params;
//   con.query(
//     "DELETE FROM app_course_cluster WHERE cct_id = ?",
//     [cct_id],
//     function (err, result) {
//       if (err) throw err;

//       return res.json(result);
//     }
//   );
// });

router.get("/get/option/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const user_id = req.query.user_id;
  const course_content = await runQuery(
    `SELECT
    app_course_group.*,
    (SELECT COUNT(*) FROM app_course_lesson WHERE cg_id=app_course_group.cg_id) AS total_lesson
    FROM app_course_cluster 
    INNER JOIN app_course_group ON app_course_cluster.cg_id = app_course_group.cg_id
    WHERE app_course_cluster.course_id = ? 
    GROUP BY app_course_group.cg_id 
    ORDER BY app_course_cluster.cg_sort ASC
    `,
    [course_id]
  );
  let obj = [];
  for (let i = 0; i < course_content.length; i++) {
    const el = course_content[i];
    const lessons = await runQuery(
      `SELECT
      app_course_lesson.cs_id,
      app_course_lesson.cs_cover,
      app_course_lesson.cs_name_lo,
      app_course_lesson.cs_name_eng,
      app_course_lesson.cs_video,
      app_course_lesson.cs_description,
      app_course_lesson.file_path,
      app_course_lesson.crt_date,
      app_course_lesson.udp_date,
      IF((SELECT COUNT(cs_id) AS total FROM app_course_log  WHERE user_id=? AND  cs_id=app_course_lesson.cs_id AND course_id=? ) < 1, "false", "true") AS learning_status
      FROM app_course_lesson 
      WHERE 
      app_course_lesson.cancelled=1 AND
      app_course_lesson.cg_id=?
      ORDER BY  app_course_lesson.cs_sort ASC
      `,
      [user_id, course_id, el?.cg_id]
    );
    let newObj = {
      cg_id: el?.cg_id,
      cg_name_lo: el?.cg_name_lo,
      cg_name_eng: el?.cg_name_eng,
      total_lesson: el?.total_lesson,
      lessons: lessons,
    };
    obj.push(newObj);
  }

  return res.json(obj);
});

router.get("/lesson/list/learn/q", middleware, async (req, res, next) => {
  const course_id = req.query.course_id;
  const cg_id = req.query.cg_id;
  const user_id = req.query.user_id;
  const cs_id = req.query.cs_id;
  const sort =
    req.query.sort === undefined ||
    (req.query.sort.toUpperCase() !== "ASC" &&
      req.query.sort.toUpperCase() !== "DESC")
      ? "ASC"
      : req.query.sort;
  if (
    course_id === undefined ||
    cg_id === undefined ||
    user_id === undefined ||
    cs_id === undefined
  ) {
    return res.status(404).json({
      status: 404,
      message: "Invalid  Data",
    });
  }
  const sql = `
  SELECT 
  app_course_lesson.cs_id,
  app_course_lesson.cs_cover,
  app_course_lesson.cs_name_lo,
  app_course_lesson.cs_name_eng,
  app_course_lesson.cs_video,
  app_course_lesson.cs_description,
  app_course_lesson.file_path,
  app_course_lesson.crt_date,
  app_course_lesson.udp_date,
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM app_course_lesson 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_lesson.cg_id
  INNER JOIN app_course_cluster ON app_course_lesson.cg_id = app_course_cluster.cg_id
  WHERE
  app_course_lesson.cancelled= 1 AND
  app_course_lesson.cg_id = ? AND 
  app_course_lesson.cs_id = ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY app_course_lesson.cs_sort ASC`;

  const sql_count = ` SELECT  COUNT(*) as numRows 
  FROM  
  app_course_lesson 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_lesson.cg_id
  INNER JOIN app_course_cluster ON app_course_lesson.cg_id = app_course_cluster.cg_id
  WHERE  
  app_course_lesson.cancelled= 1 AND
  app_course_lesson.cg_id = ? AND 
  app_course_cluster.course_id = ? `;

  const sql_next = ` SELECT  
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM  
  app_course_cluster 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_cluster.cg_id
  WHERE  
  app_course_cluster.cg_sort > ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY  app_course_cluster.cg_sort ASC  
  LIMIT 0,1`;

  const sql_previous = ` SELECT  
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM  
  app_course_cluster 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_cluster.cg_id
  WHERE  
  app_course_cluster.cg_sort < ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY  app_course_cluster.cg_sort DESC  
  LIMIT 0,1`;

  const sql_curent = ` SELECT  
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM  
  app_course_cluster 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_cluster.cg_id
  WHERE  
  app_course_cluster.cg_id = ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY  app_course_cluster.cg_sort DESC  
  LIMIT 0,1`;

  const getIndexCourseGroup = await runQuery(
    "SELECT  cg_sort  FROM app_course_cluster WHERE cg_id = ? AND  course_id=?  LIMIT 0 ,1",
    [cg_id, course_id]
  );
  const getIndexCourseLesson = await runQuery(
    "SELECT  cs_sort  FROM app_course_lesson WHERE cs_id = ?LIMIT 0 ,1",
    [cs_id]
  );
  // cs_sort

  // ตรวจสอบว่ามี log หรือไม่
  const checkLog = await runQuery(
    "SELECT  *  FROM app_course_log WHERE cs_id = ? AND  course_id=? AND  user_id=? ORDER BY cl_id DESC LIMIT 0 ,1",
    [cs_id, course_id, user_id]
  );

  const cg_sort =
  getIndexCourseGroup[0] !== undefined ? getIndexCourseGroup[0]?.cg_sort : 0; // ลำดับหมวดหมู่
const cs_sort =
  getIndexCourseLesson[0] !== undefined
    ? getIndexCourseLesson[0]?.cs_sort
    : 0; // ลำดับบทเรียน
    
  const getNext = await runQuery(sql_next, [cg_sort, course_id]); // หมวดหมู่ถัดไป
  const getPrevious = await runQuery(sql_previous, [cg_sort, course_id]); // หมวดหมู่ก่อนหน้านี้
  const getCurent = await runQuery(sql_curent, [cg_id, course_id]); // หมวดหมู่ปัจจุบัน

  const getContent = await runQuery(sql, [cg_id, cs_id, course_id]); //บทเรียนปัจจุบัน
  const getCountAll = await runQuery(sql_count, [cg_id, course_id]); //บทเรียนทั้งหมด


  const last_cl_id = checkLog[0] !== undefined ? checkLog[0]?.cl_id : 0; //บทเรียนล่าสุดที่มีการบันทึกหรือพึ่งเรียนไป
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0; //บทเรียนทั้งหมด

  // บทเรียนที่แสดงข้อมูลอันดับแรก นำมาเก็บ log เพื่อเป็นประวัติเรียนล่าสุด
  const first_cs_id = getContent[0] !== undefined ? getContent[0].cs_id : 0;
  // ถ้ารหัสบทเรียนที่รับค่ามา ไม่มีในหมวดหมู่ ให้ไปหา บทเรียนแรกของหมวดหมู่เรียนนั้น
  let debug_data_curent_lesson = {};
  let debug_cs_id = 0;
  let debug_cs_sort = 0;
  if (first_cs_id === 0) {
    const r = await runQuery(
      `
  SELECT 
  app_course_lesson.cs_id,
  app_course_lesson.cs_cover,
  app_course_lesson.cs_name_lo,
  app_course_lesson.cs_name_eng,
  app_course_lesson.cs_video,
  app_course_lesson.cs_description,
  app_course_lesson.cs_sort,
  app_course_lesson.file_path,
  app_course_lesson.crt_date,
  app_course_lesson.udp_date,
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM app_course_lesson 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_lesson.cg_id
  INNER JOIN app_course_cluster ON app_course_lesson.cg_id = app_course_cluster.cg_id
  WHERE
  app_course_lesson.cancelled= 1 AND
  app_course_lesson.cg_id = ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY app_course_lesson.cs_sort ${sort.toUpperCase()} LIMIT 0,1 `,
      [cg_id, course_id]
    );
    debug_cs_id = r[0]?.cs_id !== undefined ? r[0]?.cs_id : 0;
    debug_cs_sort = r[0]?.cs_sort !== undefined ? r[0]?.cs_sort : 0;
    debug_data_curent_lesson = r[0] !== undefined ? r[0] : {};
    await runQuery(
      "INSERT INTO app_course_log (cs_id,course_id,user_id,udp_date) VALUES (?,?,?,?)",
      [debug_cs_id, course_id, user_id, functions.dateAsiaThai()]
    );
  }
  if (
    first_cs_id !== undefined &&
    first_cs_id !== "" &&
    first_cs_id !== 0 &&
    last_cl_id === 0
  ) {
    await runQuery(
      "INSERT INTO app_course_log (cs_id,course_id,user_id,udp_date) VALUES (?,?,?,?)",
      [first_cs_id, course_id, user_id, functions.dateAsiaThai()]
    );
  }

  // บทเรียนก่อนหน้านี้
  const getPreviousLesson = await runQuery(
    `SELECT 
  app_course_lesson.cs_id,
  app_course_lesson.cs_cover,
  app_course_lesson.cs_name_lo,
  app_course_lesson.cs_name_eng,
  app_course_lesson.cs_video,
  app_course_lesson.cs_description,
  app_course_lesson.file_path,
  app_course_lesson.crt_date,
  app_course_lesson.udp_date,
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM app_course_lesson 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_lesson.cg_id
  INNER JOIN app_course_cluster ON app_course_lesson.cg_id = app_course_cluster.cg_id
  WHERE
  app_course_lesson.cancelled= 1 AND
  app_course_lesson.cg_id = ? AND 
  app_course_lesson.cs_sort < ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY app_course_lesson.cs_sort DESC LIMIT 0 ,1`,
    [cg_id, debug_cs_sort !== 0 ? debug_cs_sort : cs_sort, course_id]
  );

  // บทเรียนถัดไป
  const getNextLesson = await runQuery(
    `SELECT 
  app_course_lesson.cs_id,
  app_course_lesson.cs_cover,
  app_course_lesson.cs_name_lo,
  app_course_lesson.cs_name_eng,
  app_course_lesson.cs_video,
  app_course_lesson.cs_description,
  app_course_lesson.file_path,
  app_course_lesson.crt_date,
  app_course_lesson.udp_date,
  app_course_group.cg_id,
  app_course_group.cg_name_lo,
  app_course_group.cg_name_eng
  FROM app_course_lesson 
  INNER JOIN app_course_group ON app_course_group.cg_id = app_course_lesson.cg_id
  INNER JOIN app_course_cluster ON app_course_lesson.cg_id = app_course_cluster.cg_id
  WHERE
  app_course_lesson.cancelled= 1 AND
  app_course_lesson.cg_id = ? AND 
  app_course_lesson.cs_sort > ? AND 
  app_course_cluster.course_id = ? 
  ORDER BY app_course_lesson.cs_sort ASC LIMIT 0 ,1`,
    [cg_id, debug_cs_sort !== 0 ? debug_cs_sort : cs_sort, course_id]
  );

  const check_learning = await runQuery(
    "SELECT COUNT(cs_id) AS total_learing FROM app_course_log WHERE cs_id = ? AND user_id = ? AND course_id = ?",
    [debug_cs_id !== 0 ? debug_cs_id : cs_id, user_id, course_id]
  );
  const lesson_course = await runQuery(
    "SELECT course_id ,course_cover,course_code,course_name_lo,course_name_eng,course_description,course_remark_a,course_remark_b FROM app_course WHERE course_id  = ? ",
    [course_id]
  );

  let learning_status = "false";
  const total_learing =
    check_learning[0]?.total_learing !== undefined
      ? check_learning[0]?.total_learing
      : 0;
  if (total_learing > 0) {
    learning_status = "true";
  }

  const response = {
    total_lesson: total,
    learning_status: learning_status,
    previous_couse_group: getPrevious[0] !== undefined ? getPrevious[0] : {},
    curent_couse_group: getCurent[0] !== undefined ? getCurent[0] : {},
    next_couse_group: getNext[0] !== undefined ? getNext[0] : {},
    previous_lesson:
      getPreviousLesson[0] !== undefined ? getPreviousLesson[0] : {},
    curent_lesson:
      getContent[0] !== undefined ? getContent[0] : debug_data_curent_lesson,
    next_lesson: getNextLesson[0] !== undefined ? getNextLesson[0] : {},
    course: lesson_course[0] !== undefined ? lesson_course[0] : {},
  };
  return res.json(response);
});

router.get("/learn/status?", middleware, async (req, res, next) => {
  const user_id = req.query.user_id;
  const course_id = req.query.course_id;
  const learned_content = await runQuery(
    "SELECT COUNT(DISTINCT(cs_id)) AS numRows  FROM app_course_log WHERE user_id = ? AND course_id = ? LIMIT 0,1",
    [user_id, course_id]
  );
  const group_content = await runQuery(
    "SELECT COUNT(*) AS numRows FROM app_course_cluster WHERE course_id = ?  LIMIT 0,1",
    [course_id]
  );

  const lesson_content = await runQuery(
    "SELECT COUNT(*) AS numRows FROM app_course_lesson INNER JOIN  app_course_cluster ON app_course_cluster.cg_id=app_course_lesson.cg_id WHERE app_course_lesson.cancelled=1 AND app_course_cluster.course_id = ? LIMIT 0,1",
    [course_id]
  );

  const learned_last = await runQuery(
    "SELECT app_course_log.* ,app_course_lesson.cg_id FROM app_course_log  INNER JOIN app_course_lesson ON app_course_lesson.cs_id = app_course_log.cs_id WHERE app_course_log.user_id = ? AND app_course_log.course_id = ? ORDER BY app_course_log.cl_id DESC LIMIT 0,1 ",
    [user_id, course_id]
  );
  const cs_id =
    learned_last[0]?.cs_id !== undefined ? learned_last[0]?.cs_id : 0;
  const cg_id =
    learned_last[0]?.cg_id !== undefined ? learned_last[0]?.cg_id : 0;
  const lesson_content_plus = await runQuery(
    "SELECT cs_id ,cs_cover,cs_name_lo,cs_name_eng,cs_video,cs_description FROM app_course_lesson WHERE cs_id  = ? ",
    [cs_id]
  );
  const lesson_course_group = await runQuery(
    "SELECT cg_id,cg_name_lo,cg_name_eng FROM app_course_group WHERE cg_id  = ? ",
    [cg_id]
  );

  const lesson_course = await runQuery(
    "SELECT course_id ,course_cover,course_code,course_name_lo,course_name_eng,course_description,course_remark_a,course_remark_b FROM app_course WHERE course_id  = ? ",
    [course_id]
  );

  if (learned_content.length <= 0 || lesson_content.length <= 0) {
    return res.status(204).json({
      status: 204,
      message: "Data is null",
    });
  }
  const totalGroup =
    group_content[0] !== undefined ? group_content[0]?.numRows : 0;
  const totalLesson =
    lesson_content[0] !== undefined ? lesson_content[0]?.numRows : 0;
  const totalLearned =
    learned_content[0] !== undefined ? learned_content[0].numRows : 0;
  const progress = (parseFloat(totalLearned) / parseFloat(totalLesson)) * 100;

  const response = {
    learning_status: progress >= 100 ? "true" : "false",
    learned: totalLearned,
    total_group: totalGroup,
    total_lesson: totalLesson,
    progress: progress.toFixed(2),
    last_date:
      learned_last[0]?.udp_date !== undefined ? learned_last[0]?.udp_date : "",
    last_lesson:
      lesson_content_plus[0] !== undefined ? lesson_content_plus[0] : {},
    last_course_group:
      lesson_course_group[0] !== undefined ? lesson_course_group[0] : {},
    last_course: lesson_course[0] !== undefined ? lesson_course[0] : {},
  };
  return res.json(response);
});

router.post("/learn/history/:user_id", middleware, async (req, res, next) => {
  const { user_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let p = [user_id];
  let search_param = [];
  let sql = `SELECT 
  app_course.course_id,
  app_course.course_cover,
  app_course.course_code,
  app_course.course_name_lo,
  app_course.course_name_eng,
  app_course.course_description,
  app_course.course_remark_a,
  app_course.course_remark_b,
  app_course.is_complete,
  app_course.crt_date,
  app_course.udp_date,
  app_course_lesson.cg_id
  FROM app_course_log 
  INNER JOIN app_course ON app_course.course_id=app_course_log.course_id  
  INNER JOIN app_course_lesson ON app_course_lesson.cs_id	= app_course_log.cs_id AND app_course_lesson.cg_id != 0
  WHERE app_course_log.user_id =? `;
  let sql_count =
    " SELECT  app_course_log.* FROM  app_course_log INNER JOIN app_course ON app_course.course_id=app_course_log.course_id WHERE  app_course_log.user_id =? ";

  sql_count_group = " GROUP BY  app_course_log.course_id ";
  const getCountAll = await runQuery(sql_count + sql_count_group, p);
  const total = getCountAll?.length !== undefined ? getCountAll?.length : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_course.course_code  LIKE ? OR app_course.course_name_lo  LIKE  ? OR app_course.course_description  LIKE  ? OR app_course.course_remark_a  LIKE  ? OR app_course.course_remark_b  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];
  }

  let getCountFilter = await runQuery(
    sql_count + sql_count_group,
    p.concat(search_param)
  );
  const total_filter =
    getCountFilter?.length !== undefined ? getCountFilter?.length : 0;

  sql += ` GROUP BY  app_course_log.course_id ORDER BY app_course_log.cl_id DESC LIMIT ${offset},${per_page} `;

  const getContent = await runQuery(sql, p.concat(search_param));

  let obj = [];
  for (let i = 0; i < getContent.length; i++) {
    const el = getContent[i];

    const learned_last = await runQuery(
      "SELECT app_course_log.* ,app_course_lesson.cg_id FROM app_course_log  INNER JOIN app_course_lesson ON app_course_lesson.cs_id = app_course_log.cs_id WHERE app_course_log.user_id = ? AND app_course_log.course_id = ? ORDER BY app_course_log.cl_id DESC LIMIT 0,1 ",
      [user_id, el?.course_id]
    );

    const learned_content = await runQuery(
      "SELECT COUNT(DISTINCT(cs_id)) AS numRows  FROM app_course_log WHERE user_id = ? AND course_id = ?   LIMIT 0,1",
      [user_id, el?.course_id]
    );
    const group_content = await runQuery(
      "SELECT COUNT(*) AS numRows FROM app_course_cluster WHERE course_id = ?  LIMIT 0,1",
      [el?.course_id]
    );
    const lesson_content = await runQuery(
      "SELECT COUNT(*) AS numRows FROM app_course_lesson WHERE cancelled=1 AND cg_id = ? LIMIT 0,1",
      [el?.cg_id]
    );
    const totalGroup =
      group_content[0] !== undefined ? group_content[0]?.numRows : 0;
    const totalLesson =
      lesson_content[0] !== undefined ? lesson_content[0]?.numRows : 0;
    const totalLearned =
      learned_content[0] !== undefined ? learned_content[0].numRows : 0;
    const progress = (parseFloat(totalLearned) / parseFloat(totalLesson)) * 100;

    const newObj = {
      learned: totalLearned,
      total_group: totalGroup,
      total_lesson: totalLesson,
      progress: progress.toFixed(2),
      last_date:
      learned_last[0]?.udp_date !== undefined
          ? learned_last[0]?.udp_date
          : "",
    };
    const data_merg = { ...el, ...newObj };
    obj.push(data_merg);
  }
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

router.post("/document/create", middleware, (req, res, next) => {
  const data = req.body;
  const course_id = data.course_id;

  con.query(
    "SELECT * FROM app_course WHERE course_id = ?",
    [course_id],
    (err, rows) => {
      let checkuser = rows.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Document Error",
        });
      }

      con.query(
        "INSERT INTO app_course_document (cd_path,cd_name,course_id) VALUES (?,?,?)",
        [data.cd_path, data.cd_name, course_id],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.delete("/document/delete/:id", middleware, async (req, res, next) => {
  const { id } = req.params;

  const getContentImage = await runQuery(
    "SELECT * FROM app_course_document WHERE id = ?",
    [id]
  );
  const path =
    getContentImage[0] !== undefined ? getContentImage[0]?.cd_path : "";

  if (path === "") {
    return res.status(204).json({
      status: 204,
      message: "Data is null",
    });
  }

  const r = await runQuery("  DELETE FROM  app_course_document WHERE id=?  ", [
    id,
  ]);
  if (path !== "") {
    await delFile(path);
  }

  return res.json(r);
});

router.get("/document/get/:course_id", middleware, (req, res, next) => {
  const { course_id } = req.params;

  con.query(
    "SELECT * FROM app_course_document WHERE course_id = ?",
    [course_id],
    (err, result) => {
      return res.json(result);
    }
  );
});

router.get("/condition/list/?", middleware, async (req, res, next) => {
  const course_id = req.query.course_id;
  const getCourseGroup = await runQuery(
    `SELECT 
     app_course_group.cg_id,
     app_course_group.cg_name_lo,
     app_course_group.cg_name_eng,
     app_course_group.cg_amount_random,
     (SELECT COUNT(*) AS total FROM app_course_lesson  WHERE cg_id=app_course_group.cg_id) AS total_lesson,
     (SELECT COUNT(*) AS total FROM app_exam_question  WHERE cg_id=app_course_group.cg_id) AS total_question
     FROM  
     app_course_cluster 
     INNER JOIN app_course_group ON app_course_group.cg_id = app_course_cluster.cg_id
     WHERE  app_course_cluster.course_id=?
    `,
    [course_id]
  );
  return res.json(getCourseGroup);
});

module.exports = router;
