const express = require("express");
const router = express.Router();
const con = require("../database");
const middleware = require("../middleware");
const common = require("../common");
const functions = require("../functions");
// const localISOTime = functions.dateAsiaThai();
async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}

router.post("/main/create/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const data = req.body;
  const obj = common.drivinglicense_type;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === data.dlt_code;
  });

  const getCourse = await runQuery(
    "SELECT course_id FROM  app_course WHERE  course_id= ? ",
    [course_id]
  );
  const getCourseExam = await runQuery(
    "SELECT course_id FROM  app_exam_main WHERE course_id= ? ",
    [course_id]
  );

  const getUser = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_id]
  );
  const course_id_distinct =
    getCourseExam[0] !== undefined ? getCourseExam[0]?.course_id : 0;
  const course_id_check =
    getCourse[0] !== undefined ? getCourse[0]?.course_id : 0;
  const user_id = getUser[0] !== undefined ? getUser[0]?.user_id : 0;

  if (course_id_check === 0) {
    return res.status(404).json({
      status: 404,
      message: "This course is not available in the system.",
    });
  }
  if (user_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Username Error",
    });
  }

  if (result_filter.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'drivinglicense_type' ",
    });
  }

  if (course_id_distinct === 0) {
    con.query(
      "INSERT INTO app_exam_main (em_code,em_name_lo,em_name_eng,em_cover,em_description,em_random_amount,em_time,em_measure,dlt_code,crt_date,udp_date,user_crt,user_udp,course_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        data.em_code,
        data.em_name_lo,
        data.em_name_eng,
        data.em_cover,
        data.em_description,
        data.em_random_amount,
        data.em_time,
        data.em_measure,
        data.dlt_code,
        functions.dateAsiaThai(),
        functions.dateAsiaThai(),
        user_id,
        user_id,
        course_id,
      ],
      function (err, result) {
        if (err) throw err;
        return res.json(result);
      }
    );
  } else {
    con.query(
      "UPDATE  app_exam_main SET em_code=? , em_name_lo=? ,em_name_eng=? ,em_cover=? ,em_description=?,em_random_amount=?,em_time=?,em_measure=?,dlt_code=?,udp_date=?,user_udp=?,course_id=? WHERE course_id=? ",
      [
        data.em_code,
        data.em_name_lo,
        data.em_name_eng,
        data.em_cover,
        data.em_description,
        data.em_random_amount,
        data.em_time,
        data.em_measure,
        data.dlt_code,
        functions.dateAsiaThai(),
        user_id,
        course_id,
        course_id,
      ],
      function (err, result) {
        if (err) throw err;
        return res.json(result);
      }
    );
  }
});

router.put("/main/update/:em_id", middleware, async (req, res, next) => {
  const { em_id } = req.params;
  const data = req.body;
  const obj = common.drivinglicense_type;
  const result_filter = obj.filter(function (e) {
    return e.dlt_code === data.dlt_code;
  });
  const getCourse = await runQuery(
    "SELECT course_id FROM  app_course WHERE  course_id = ? ",
    [data.course_id]
  );
  const getCourseExam = await runQuery(
    "SELECT course_id FROM  app_exam_main WHERE course_id= ? AND em_id != ? AND cancelled = 1",
    [data.course_id, em_id]
  );
  const getUser = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [data.user_id]
  );
  const course_id_distinct =
    getCourseExam[0] !== undefined ? getCourseExam[0]?.course_id : 0;
  const course_id = getCourse[0] !== undefined ? getCourse[0]?.course_id : 0;
  const user_id = getUser[0] !== undefined ? getUser[0]?.user_id : 0;

  if (course_id_distinct !== 0) {
    return res.status(404).json({
      status: 404,
      message: "This course already exists in the system.",
    });
  }

  if (course_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "This course is not available in the system.",
    });
  }

  if (user_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Username Error",
    });
  }

  if (result_filter.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'drivinglicense_type' ",
    });
  }

  con.query(
    "UPDATE  app_exam_main SET em_code=? , em_name_lo=? ,em_name_eng=? ,em_cover=? ,em_description=?,em_random_amount=?,em_time=?,em_measure=?,dlt_code=?,udp_date=?,user_udp=?,course_id=? WHERE em_id=? ",
    [
      data.em_code,
      data.em_name_lo,
      data.em_name_eng,
      data.em_cover,
      data.em_description,
      data.em_random_amount,
      data.em_time,
      data.em_measure,
      data.dlt_code,
      functions.dateAsiaThai(),
      user_id,
      course_id,
      em_id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});

router.post("/main/list", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let search_param = [];
  const p = [];
  let sql = `SELECT 
    app_exam_main.em_id,
    app_exam_main.em_code,
    app_exam_main.em_name_lo,
    app_exam_main.em_name_eng,
    app_exam_main.em_cover,
    app_exam_main.em_description,
    app_exam_main.em_random_amount,
    app_exam_main.em_time,
    app_exam_main.em_measure,
    app_exam_main.dlt_code,
    app_exam_main.crt_date,
    app_exam_main.udp_date,
    app_exam_main.course_id ,
    CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create ,
    CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update, 
     (SELECT SUM(app_course_cluster.cg_amount_random) FROM app_course_cluster WHERE app_course_cluster.course_id=app_exam_main.course_id )  AS total_question
     FROM app_exam_main
     INNER JOIN  app_course uc ON uc.course_id = app_exam_main.course_id  AND uc.active = 1
     LEFT JOIN  app_user u1 ON u1.user_id = app_exam_main.user_crt  
     LEFT JOIN  app_user u2 ON u2.user_id = app_exam_main.user_udp 
     WHERE 
     app_exam_main.cancelled=1`;
  let order = ` ORDER BY app_exam_main.course_id ASC LIMIT ${offset},${per_page} `;
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_exam_main WHERE app_exam_main.cancelled=1";

  const getCountAll = await runQuery(sql_count, p.concat(search_param));
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_exam_main.em_code  LIKE ? OR app_exam_main.em_name_lo  LIKE  ? OR app_exam_main.em_description  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const getCountFilter = await runQuery(sql_count, p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  // query ข้อมูล
  const getContent = await runQuery(sql + order, p.concat(search_param));
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

router.delete("/main/delete/:em_id", middleware, (req, res, next) => {
  const { em_id } = req.params;
  con.query(
    "SELECT em_id FROM app_exam_main WHERE em_id = ?",
    [em_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }
      con.query(
        "UPDATE  app_exam_main SET cancelled=0 WHERE em_id=? ",
        [em_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.get("/main/get/:em_id", middleware, (req, res, next) => {
  const { em_id } = req.params;

  con.query(
    `SELECT 
    app_exam_main.*,
    (SELECT SUM(app_course_cluster.cg_amount_random) FROM app_course_cluster WHERE app_course_cluster.course_id=app_exam_main.course_id)  AS total_question
    FROM 
    app_exam_main 
    WHERE  
    app_exam_main.cancelled = 1 AND 
    (app_exam_main.em_id = ? OR app_exam_main.course_id = ?)`,
    [em_id, em_id],
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
        em_id: reslut?.em_id,
        em_code: reslut?.em_code,
        em_name_lo: reslut?.em_name_lo,
        em_name_eng: reslut?.em_name_eng,
        em_cover: reslut?.em_cover,
        em_description: reslut?.em_description,
        em_random_amount: reslut?.em_random_amount,
        em_time: reslut?.em_time,
        em_measure: reslut?.em_measure,
        crt_date: reslut?.crt_date,
        udp_date: reslut?.udp_date,
        course_id: reslut?.course_id,
        total_question: reslut?.total_question
      };
      return res.json(response);
    }
  );
});

router.post("/question/create", middleware, async (req, res, next) => {
  const data = req.body;

  const getCourseGroup = await runQuery(
    "SELECT cg_id FROM app_course_group WHERE cg_id = ?",
    [data.cg_id]
  );
  const cg_id = getCourseGroup[0] !== undefined ? getCourseGroup[0]?.cg_id : 0;
  if (cg_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid cg_id.",
    });
  }
  con.query(
    "INSERT INTO app_exam_question (eq_name_lo,eq_name_eng,eq_image,eq_answer,cg_id) VALUES (?,?,?,?,?)",
    [data.eq_name_lo, data.eq_name_eng, data.eq_image, data.eq_answer, cg_id],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});

router.put("/question/update/:eq_id", middleware, async (req, res, next) => {
  const data = req.body;
  const { eq_id } = req.params;

  const getCourseGroup = await runQuery(
    "SELECT cg_id FROM app_course_group WHERE cg_id = ?",
    [data.cg_id]
  );
  const cg_id = getCourseGroup[0] !== undefined ? getCourseGroup[0]?.cg_id : 0;
  if (cg_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid cg_id.",
    });
  }
  con.query(
    "UPDATE  app_exam_question SET eq_name_lo=? ,eq_name_eng = ? , eq_image=?,eq_answer=?, cg_id=? WHERE eq_id=? ",
    [
      data.eq_name_lo,
      data.eq_name_eng,
      data.eq_image,
      data.eq_answer,
      cg_id,
      eq_id,
    ],
    function (err, result) {
      if (err) throw err;

      return res.json(result);
    }
  );
});

router.post("/question/:cg_id/list", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const { cg_id } = req.params;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let search_param = [];
  let sql = `SELECT
	t1.eq_id, 
	t1.eq_name_lo, 
  t1.eq_name_eng,
	t1.eq_image, 
	t1.eq_answer, 
	t1.cg_id
FROM
	app_exam_question t1
	WHERE
  t1.cg_id =? AND
	t1.cancelled =1
  `;
  let param1 = [cg_id];

  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_exam_question t1 WHERE t1.cg_id=? AND t1.cancelled=1 ";

  const getCountAll = await runQuery(sql_count, param1);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (t1.eq_name_lo  LIKE ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`];
  }

  const getCountFilter = await runQuery(sql_count, param1.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += `  ORDER BY t1.eq_id ASC LIMIT ${offset},${per_page} `;

  // query ข้อมูล
  const getQuestion = await runQuery(sql, param1.concat(search_param));
  let obj = [];
  for (let i = 0; i < getQuestion.length; i++) {
    const el = getQuestion[i];
    // console.log(el);
    // let choices = JSON.parse(el?.choices);
    const choices = await runQuery(
      "SELECT * FROM `app_exam_choice` WHERE cancelled =1 AND  eq_id = ? AND cg_id = ? ORDER BY ec_index ASC",
      [el?.eq_id, cg_id]
    );
    const newObj = {
      eq_id: el?.eq_id,
      eq_name_lo: el?.eq_name_lo,
      eq_image: el?.eq_image,
      eq_answer: el?.eq_answer,
      cg_id: parseInt(cg_id),
      choices: choices,
    };
    obj.push(newObj);
  }

  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการที่ค้นหา
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: obj, // รายการข้อมูล
  };
  return res.json(response);
});

router.delete("/question/delete/:eq_id", middleware, (req, res, next) => {
  const { eq_id } = req.params;
  con.query(
    "SELECT eq_id FROM app_exam_question WHERE eq_id = ?",
    [eq_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }

      con.query(
        "UPDATE  app_exam_question SET cancelled=0 WHERE eq_id=? ",
        [eq_id],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.get("/question/get/:eq_id", middleware, async (req, res, next) => {
  const { eq_id } = req.params;
  const choices = await runQuery(
    "SELECT * FROM `app_exam_choice` WHERE app_exam_choice.cancelled =1 AND  app_exam_choice.eq_id = ?",
    [eq_id]
  );

  con.query(
    "SELECT * FROM app_exam_question WHERE  cancelled = 1 AND eq_id = ?",
    [eq_id],
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
        eq_id: reslut?.eq_id,
        eq_name_lo: reslut?.eq_name_lo,
        eq_name_eng: reslut?.eq_name_eng,
        eq_image: reslut?.eq_image,
        eq_answer: reslut?.eq_answer,
        cg_id: reslut?.cg_id,
        choices: choices,
      };
      return res.json(response);
    }
  );
});

router.post("/choice/create", middleware, async (req, res, next) => {
  const data = req.body;
  const getQuestion = await runQuery(
    "SELECT eq_id,cg_id FROM  app_exam_question WHERE  eq_id = ? AND cancelled=1",
    [data.eq_id]
  );
  const cg_id = getQuestion[0] !== undefined ? getQuestion[0]?.cg_id : 0;
  const eq_id = getQuestion[0] !== undefined ? getQuestion[0]?.eq_id : 0;

  const getChoiceIndex = await runQuery(
    "SELECT ec_index FROM app_exam_choice WHERE eq_id = ? AND ec_index=? AND cancelled=1",
    [eq_id, data.ec_index]
  );

  const ec_index_distinct =
    getChoiceIndex[0] !== undefined ? getChoiceIndex[0]?.ec_index : 0;
  if (eq_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid eq_id.",
    });
  }
  if (cg_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid cg_id.",
    });
  }
  // คำถามนี้มีลำดับตัวเลือกซ้ำกันหรือไม่
  if (ec_index_distinct !== 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid ec_index.",
    });
  }
  con.query(
    "INSERT INTO app_exam_choice (ec_index,ec_name_lo,ec_name_eng,ec_image,eq_id,cg_id) VALUES (?,?,?,?,?,?)",
    [
      data.ec_index,
      data.ec_name_lo,
      data.ec_name_eng,
      data.ec_image,
      eq_id,
      cg_id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});

router.put("/choice/update/:ec_id", middleware, async (req, res, next) => {
  const { ec_id } = req.params;
  const data = req.body;

  const getQuestion = await runQuery(
    "SELECT eq_id,cg_id FROM  app_exam_question WHERE  eq_id = ? AND cancelled=1",
    [data.eq_id]
  );
  const cg_id = getQuestion[0] !== undefined ? getQuestion[0]?.cg_id : 0;
  const eq_id = getQuestion[0] !== undefined ? getQuestion[0]?.eq_id : 0;

  const getChoiceIndex = await runQuery(
    "SELECT ec_index FROM app_exam_choice WHERE eq_id = ? AND ec_index=? AND ec_id !=? AND cancelled=1",
    [eq_id, data.ec_index, ec_id]
  );

  const ec_index_distinct =
    getChoiceIndex[0] !== undefined ? getChoiceIndex[0]?.ec_index : 0;
  if (eq_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid eq_id.",
    });
  }
  if (cg_id === 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid cg_id.",
    });
  }
  // คำถามนี้มีลำดับตัวเลือกซ้ำกันหรือไม่
  if (ec_index_distinct !== 0) {
    return res.status(404).json({
      status: 404,
      message: "Invalid ec_index.",
    });
  }
  con.query(
    "UPDATE  app_exam_choice SET ec_index=?,ec_name_lo=?,ec_name_eng=?, ec_image=?,eq_id=?,cg_id=? WHERE ec_id=? ",
    [
      data.ec_index,
      data.ec_name_lo,
      data.ec_name_eng,
      data.ec_image,
      eq_id,
      cg_id,
      ec_id,
    ],
    function (err, result) {
      if (err) throw err;
      return res.json(result);
    }
  );
});

router.get("/choice/list/:eq_id", middleware, (req, res, next) => {
  const { eq_id } = req.params;
  con.query(
    "SELECT ec_id,ec_index,ec_name_lo,ec_name_eng,ec_image,eq_id,cg_id FROM app_exam_choice WHERE eq_id = ? AND  cancelled = 1 ORDER BY ec_index ASC",
    [eq_id],
    function (err, results) {
      return res.json(results);
    }
  );
});

router.delete("/choice/delete/:ec_id", middleware, (req, res, next) => {
  const { ec_id } = req.params;
  con.query(
    "UPDATE  app_exam_choice SET cancelled=0  WHERE ec_id = ?",
    [ec_id],
    function (err, results) {
      return res.json(results);
    }
  );
});

router.get("/choice/get/:ec_id", middleware, (req, res, next) => {
  const { ec_id } = req.params;
  con.query(
    "SELECT * FROM app_exam_choice WHERE  cancelled = 1 AND ec_id = ?",
    [ec_id],
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
        ec_id: reslut?.ec_id,
        ec_index: reslut?.ec_index,
        ec_name_lo: reslut?.ec_name_lo,
        ec_name_eng: reslut?.ec_name_eng,
        ec_image: reslut?.ec_image,
        eq_id: reslut?.eq_id,
        cg_id: reslut?.cg_id,
      };
      return res.json(response);
    }
  );
});

router.post("/start/render", middleware, async (req, res, next) => {
  // const present_day = new Date().getDate();
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const clear_cach = data.clear_cach; // 0 = ไม่เคลียร์ , 1 = เคลียร์
  const course_id = data.course_id;
  const user_id = data.user_id;
  const offset = functions.setZero((current_page - 1) * per_page);
  let exam_complete = 0;
  // --IFNULL(CONCAT('[',(SELECT    GROUP_CONCAT((JSON_OBJECT('ec_id', t2.ec_id,'ec_index', t2.ec_index,'ec_name_lo', t2.ec_name_lo,'ec_image', t2.ec_image,'eq_id', t2.eq_id,'em_id', t2.em_id)))  FROM app_exam_choice t2  WHERE eq_id =  t1.eq_id AND cancelled=1 ) ,']'),'[]') AS choices
  const sql_question = `
  SELECT
  t0.id,
  t0.ec_score,
  t0.is_complete,
  t0.ec_id,
  t1.eq_id, 
  t1.eq_name_lo,
  t1.eq_name_eng,  
  t1.eq_image, 
  t1.eq_answer, 
  t1.cg_id
FROM
  app_exam_cache t0
  INNER JOIN  app_exam_question t1 ON t1.eq_id = t0.eq_id  AND  t1.cancelled = 1
  INNER JOIN  app_user t2 ON t2.user_id = t0.user_id 
  WHERE
  t0.course_id =?  AND
  t0.user_id =?
  ORDER BY 
  t0.eq_id ASC,
  t0.cg_id ASC
  LIMIT ${offset},${per_page}
  `;
  const getCourseGroupInClustter = await runQuery(
    "SELECT * FROM app_course_cluster WHERE course_id = ?  ORDER BY cg_id ASC",
    [course_id]
  );
  // ลบแคชของวันที่ผ่านมาออก
  // console.log(new Date().getDate());
  const count_cache_yesterday = await runQuery(
    "SELECT COUNT(*) AS total_cache   FROM app_exam_cache WHERE DAY(udp_date) < ? ",
    [new Date().getDate()]
  );
  const total_cache_yesterday =
    count_cache_yesterday[0]?.total_cache !== undefined
      ? count_cache_yesterday[0]?.total_cache
      : 0;
  if (total_cache_yesterday > 0) {
    await runQuery("TRUNCATE TABLE app_exam_cache", []);
    await runQuery("TRUNCATE TABLE app_exam_time", []);
  }

  if (clear_cach === 1) {
    await runQuery(
      "DELETE FROM app_exam_cache WHERE course_id = ? AND user_id =?",
      [course_id, user_id]
    );
  }
  // จำนวน Cache
  const count_cache = await runQuery(
    "SELECT COUNT(*) AS total_cache FROM app_exam_cache WHERE course_id = ? AND user_id =? ",
    [course_id, user_id]
  );
  const total_cache =
    count_cache[0]?.total_cache !== undefined ? count_cache[0]?.total_cache : 0;

  // จำนวน Cache ข้อสอบที่ทำเสร็จ
  const count_cache_complete = await runQuery(
    "SELECT COUNT(*) AS total_cache_complete FROM app_exam_cache WHERE course_id = ? AND user_id =? AND is_complete=1",
    [course_id, user_id]
  );
  //จำนวนข้อสอบที่ทำแล้วทั้งหมด
  const total_cache_complete =
    count_cache_complete[0]?.total_cache_complete !== undefined
      ? count_cache_complete[0]?.total_cache_complete
      : 0;
  // ดึงข้อสอบที่จะให้สอบ
  if (total_cache < 1) {
    for (let i = 0; i < getCourseGroupInClustter.length; i++) {
      const el = getCourseGroupInClustter[i];
      const cg_amount_random = el?.cg_amount_random;
      const cg_id = el?.cg_id;
      await runQuery(
        `INSERT INTO app_exam_cache (ec_id,eq_id,cg_id,course_id,user_id,udp_date) 
          SELECT 
          0 AS ec_id ,
          eq_id,
          '${cg_id}' AS cg_id,
          '${course_id}' AS course_id,
          '${user_id}' AS user_id, 
          '${functions.dateAsiaThai()}' AS udp_date
          FROM app_exam_question WHERE cancelled = 1  AND cg_id = ? ORDER BY RAND() LIMIT ?`,
        [cg_id, cg_amount_random]
      );
    }
  }

  // ตรวจสอบว่าทำข้อสอบเสร้จหมดทุกข้อยัง
  if (
    total_cache_complete >= total_cache &&
    clear_cach !== 1 &&
    total_cache !== 0
  ) {
    exam_complete = 1;
  }

  const getQuestion = await runQuery(sql_question, [course_id, user_id]);
  let obj = [];
  for (let i = 0; i < getQuestion.length; i++) {
    let el = getQuestion[i];
    // console.log(el?.eq_id);
    // let choices = JSON.parse(el?.choices);
    const choices = await runQuery(
      "SELECT * FROM `app_exam_choice` WHERE eq_id = ? AND cancelled =1 ORDER BY ec_index ASC",
      [el?.eq_id]
    );
    let newObj = {
      cache_id: el?.id,
      user_id: user_id,
      ec_score: el?.ec_score,
      is_complete: el?.is_complete,
      eq_id: el?.eq_id,
      eq_name_lo: el?.eq_name_lo,
      eq_name_eng: el?.eq_name_eng,
      eq_image: el?.eq_image,
      eq_answer: el?.eq_answer,
      cg_id: el?.cg_id,
      ec_id: el?.ec_id,
      choices: choices,
    };
    obj.push(newObj);
  }
  // จำนวน Cache
  const count_cache_repeat = await runQuery(
    "SELECT COUNT(*) AS total_cache FROM app_exam_cache WHERE course_id = ? AND user_id =? ",
    [course_id, user_id]
  );
  const repeat =
    count_cache_repeat[0]?.total_cache !== undefined
      ? count_cache_repeat[0]?.total_cache
      : 0;

  const response = {
    total: repeat, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(repeat / per_page), // จำนวนหน้าทั้งหมด
    exam_complete: exam_complete, ///สถานะการทำข้อสอบเสร็จต่อรอบ
    data: obj, // รายการข้อมูล
  };
  return res.json(response);
});

router.post("/send/render", middleware, async (req, res, next) => {
  const data = req.body;
  const ec_id = data.ec_id;
  const cache_id = data.cache_id;
  let score = 0;
  // เช็คคำตอบที่ถุกกำหนดในคำถาม
  const chkQuestion = await runQuery(
    ` SELECT * FROM app_exam_choice WHERE app_exam_choice.ec_id = ?
    `,
    [ec_id]
  );
  const eq_id = chkQuestion[0]?.eq_id !== undefined ? chkQuestion[0]?.eq_id : 0;
  const ec_index =
    chkQuestion[0]?.ec_index !== undefined ? chkQuestion[0]?.ec_index : 0;

  const chkAnswer = await runQuery(
    "SELECT eq_answer FROM app_exam_question WHERE eq_id = ?",
    [eq_id]
  );

  const eq_answer =
    chkAnswer[0]?.eq_answer !== undefined ? chkAnswer[0]?.eq_answer : 0;
  if (eq_answer === ec_index) {
    score = 1;
  }

  const result = await runQuery(
    "UPDATE  app_exam_cache SET ec_score=?,is_complete=?,ec_id=? WHERE id = ? ",
    [score, 1, ec_id, cache_id]
  );
  return res.json(result);
});

router.post("/result/render", middleware, async (req, res, next) => {
  const data = req.body;
  const course_id = data.course_id;
  const er_use_time = data.er_use_time;
  const user_id = data.user_id;
  // เช็คคำตอบที่ถุกกำหนดในคำถาม
  const checkMainCache = await runQuery(
    " SELECT SUM(ec_score) AS sum_score, COUNT(*) AS total_question FROM app_exam_cache WHERE course_id	 = ? AND  user_id=? GROUP BY user_id",
    [course_id, user_id]
  );
  if (checkMainCache === undefined) {
    return res.status(404).json({
      status: 404,
      message:
        "Data already exists in the system. Unable to proceed with the transaction.",
    });
  }
  const sum_score =
    checkMainCache[0]?.sum_score !== undefined
      ? checkMainCache[0]?.sum_score
      : 0;
  const total_question =
    checkMainCache[0]?.total_question !== undefined
      ? checkMainCache[0]?.total_question
      : 0;

  const getCacheFirst = await runQuery(
    "SELECT * FROM app_exam_cache WHERE course_id = ? AND user_id = ? LIMIT 0 , 1",
    [course_id,user_id]
  );
  const er_start_time = getCacheFirst[0]?.udp_date !== undefined ? getCacheFirst[0]?.udp_date: "";
  // console.log(er_start_time);
  
  // นำคำตอบที่เลือกมาตรวจสอบกับหมายเลขในคำถามว่าตรงกันหรือไม่
  con.query(
    "INSERT INTO app_exam_result (er_score_total,er_question_total,er_start_time,er_use_time,crt_date,udp_date,user_id,course_id) VALUES (?,?,?,?,?,?,?,?)",
    [
      sum_score,
      total_question,
      er_start_time,
      er_use_time,
      functions.dateAsiaThai(),
      functions.dateAsiaThai(),
      user_id,
      course_id,
    ],
    (err, rs_end) => {
      // Update ข้อสอบที่กำลังทำทั้งหมดเป็น ทำครบแล้ว
      con.query(
        "UPDATE  app_exam_cache SET is_complete = 1 WHERE course_id=?  AND user_id=? ",
        [course_id, user_id],
        function (err, result) {
          // if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.post("/time/render", middleware, (req, res, next) => {
  const data = req.body;
  const em_id = data.em_id;
  const user_id = data.user_id;
  const et_time = data.et_time;
  con.query(
    " SELECT * FROM app_exam_time WHERE em_id = ? AND user_id=?",
    [em_id, user_id],
    (err, rs_time) => {
      if (err) throw err;
      let _check_data = rs_time.length;
      if (_check_data <= 0) {
        con.query(
          "INSERT INTO app_exam_time (et_time,em_id,user_id,udp_date) VALUES (?,?,?,?)",
          [et_time, em_id, user_id, functions.dateAsiaThai()],
          (err, rs) => {
            return res.json(rs);
          }
        );
      } else {
        con.query(
          "UPDATE  app_exam_time SET et_time=? ,  udp_date=? WHERE em_id=?  AND user_id=? ",
          [et_time, functions.dateAsiaThai(), em_id, user_id],
          (err, rs) => {
            return res.json(rs);
          }
        );
      }
    }
  );
});
router.get("/time?", middleware, (req, res, next) => {
  const em_id = req.query.em_id;
  const user_id = req.query.user_id;
  con.query(
    " SELECT * FROM app_exam_time WHERE em_id = ? AND user_id = ?",
    [em_id, user_id],
    (err, rs) => {
      return res.json(rs[0]);
    }
  );
});

router.get("/history?", middleware, async (req, res, next) => {
  const course_id = req.query.course_id;
  const user_id = req.query.user_id;
  let p = [user_id];
  let p2 = [];
  let sql = `SELECT 
  app_exam_result.*,
  app_course.course_code,
  app_course.course_name_lo,
  app_course.course_name_eng,
  app_exam_main.em_random_amount,
  app_exam_main.em_time,
  app_exam_main.em_measure,
  app_exam_main.dlt_code,
  IF( app_exam_result.er_score_total >= app_exam_main.em_measure, "pass", "fail") AS status,
  CONCAT(app_user.user_firstname ,' ' , app_user.user_lastname) AS fullname_tuter
  FROM  app_exam_result 
  INNER JOIN app_course ON app_course.course_id = app_exam_result.course_id
  INNER JOIN app_exam_main ON app_exam_main.course_id = app_exam_result.course_id
  INNER JOIN app_user ON app_user.user_id = app_exam_result.user_id
  WHERE  
  app_exam_result.user_id = ?`;

  if (parseInt(course_id) !== 0 && course_id !== undefined) {
    sql += " AND  app_course.course_id = ? ";
    p2 = [course_id];
  }

  const getResultExamHistory = await runQuery(
    sql + " ORDER BY app_exam_result.er_id DESC  LIMIT 0,300 ",
    p.concat(p2)
  );
  return res.json(getResultExamHistory);
});

router.post("/history/all/:course_id", middleware, async (req, res, next) => {
  const { course_id } = req.params;
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 150 ? data.per_page : 150;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let search_param = [];
  let p = [course_id];
  let sql = `SELECT 
    app_exam_result.*,
    app_course.course_code,
    app_course.course_name_lo,
    app_course.course_name_eng,
    app_exam_main.em_random_amount,
    app_exam_main.em_time,
    app_exam_main.em_measure,
    app_exam_main.dlt_code,
    IF( app_exam_result.er_score_total >= app_exam_main.em_measure, "pass", "fail") AS status,
    CONCAT(app_user.user_firstname ,' ' , app_user.user_lastname) AS fullname_tuter
    FROM  app_exam_result 
    INNER JOIN app_course ON app_course.course_id = app_exam_result.course_id
    INNER JOIN app_exam_main ON app_exam_main.course_id = app_exam_result.course_id
    INNER JOIN app_user ON app_user.user_id = app_exam_result.user_id
    WHERE  
    app_exam_result.course_id = ?
    `;
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_exam_result INNER JOIN app_user ON app_user.user_id = app_exam_result.user_id WHERE app_exam_result.course_id = ? ";

  const getCountAll = await runQuery(sql_count, p);
  const total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;
  if (search !== "" || search.length > 0) {
    let q = ` AND (app_exam_result.er_score_total LIKE ? OR app_user.user_firstname  LIKE ? OR app_user.user_lastname  LIKE ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  const getCountFilter = await runQuery(sql_count, p.concat(search_param));
  const total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  sql += `  ORDER BY app_exam_result.er_id DESC LIMIT ${offset},${per_page} `;
  const getResultExamHistory = await runQuery(sql, p.concat(search_param));
  const response = {
    total: total, // จำนวนรายการทั้งหมด
    total_filter: total_filter, // จำนวนรายการทั้งหมด
    current_page: current_page, // หน้าที่กำลังแสดงอยู่
    limit_page: per_page, // limit data
    total_page: Math.ceil(total_filter / per_page), // จำนวนหน้าทั้งหมด
    search: search, // คำค้นหา
    data: getResultExamHistory, // รายการข้อมูล
  };
  return res.json(response);
});
module.exports = router;
