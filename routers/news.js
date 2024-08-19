const express = require("express");
const router = express.Router();
const con = require("../database");
const middleware = require("../middleware");
const fs = require("fs");
const functions = require("../functions");

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
  const news_friendly = functions.urlFriendly(data.news_title);
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
        "INSERT INTO app_news (news_cover,news_video,news_title,news_description,news_type,news_friendly,news_view,crt_date,udp_date,user_crt,user_udp) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          data.news_cover,
          data.news_video,
          data.news_title,
          data.news_description,
          data.news_type,
          news_friendly,
          0,
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

router.put("/update/:news_id", middleware, (req, res, next) => {
  const { news_id } = req.params;
  const data = req.body;
  const news_friendly = functions.urlFriendly(data.news_title);
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
        "UPDATE  app_news SET news_cover=? ,news_video=? , news_title=? ,news_description=? ,news_type=?,news_friendly=?,udp_date=? , user_udp=? WHERE news_id=? ",
        [
          data.news_cover,
          data.news_video,
          data.news_title,
          data.news_description,
          data.news_type,
          news_friendly,
          functions.dateAsiaThai(),
          user_id,
          news_id,
        ],
        function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          return res.json(result);
        }
      );
    }
  );
});

router.get("/get/:news_id", middleware, async (req, res, next) => {
  const { news_id } = req.params;
  let sql = `SELECT app_news.news_id,app_news.news_cover,app_news.news_video,app_news.news_title,app_news.news_description,app_news.news_type,app_news.news_friendly,app_news.news_view, app_news.crt_date,app_news.udp_date ,
  CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create , CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
  FROM app_news LEFT JOIN  app_user u1 ON u1.user_id = app_news.user_crt  LEFT JOIN  app_user u2 ON u2.user_id = app_news.user_udp WHERE app_news.cancelled=1 AND app_news.news_id=?`;

  const getNews = await runQuery("SELECT * FROM app_news WHERE news_id=?", [
    news_id,
  ]);
  let news_view =
    getNews[0]?.news_view !== undefined ? getNews[0]?.news_view : 0;
  let news_view_set = parseInt(news_view) + 1;
  await runQuery("UPDATE  app_news SET news_view=? WHERE news_id=? ", [
    news_view_set,
    news_id,
  ]);
  con.query(sql, [news_id], function (err, main) {
    if (main.length <= 0) {
      return res.status(204).json({
        status: 204,
        message: "Data is null", // error.sqlMessage
      });
    }

    con.query(
      "SELECT * FROM app_news_image WHERE news_id=? ",
      [news_id],
      (err, images_list) => {
        if (err) throw err;

        // return rows;
        const obj1 = main[0];
        const obj2 = { images_list: images_list };
        const mergedObject = {
          ...obj1,
          ...obj2,
        };
        res.json(mergedObject);
      }
    );
  });
});

router.delete("/delete/:news_id", middleware, (req, res, next) => {
  const { news_id } = req.params;
  con.query(
    "SELECT news_id FROM app_news WHERE news_id = ?",
    [news_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }

      con.query(
        "UPDATE  app_news SET cancelled=0 WHERE news_id=? ",
        [news_id],
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
  let total = 0;
  let total_filter = 0;
  let search_param = [];
  let u = "";

  let sql = `SELECT app_news.news_id,app_news.news_cover,app_news.news_video,app_news.news_title,app_news.news_description,app_news.news_type,app_news.news_friendly,app_news.news_view,app_news.crt_date,app_news.udp_date ,
  CONCAT(u1.user_firstname ,' ' , u1.user_lastname) AS user_create , CONCAT(u2.user_firstname ,' ' , u2.user_lastname) AS user_update
  FROM app_news LEFT JOIN  app_user u1 ON u1.user_id = app_news.user_crt  LEFT JOIN  app_user u2 ON u2.user_id = app_news.user_udp WHERE app_news.cancelled=1`;
  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_news WHERE  app_news.cancelled=1  ";

  if (req.query.news_type) {
    //
    let news_type = req.query.news_type;
    u = " AND app_news.news_type =  " + news_type; // ประเภท News
    sql += u;
  }

  let getCountAll = await runQuery(sql_count + u);
  total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    let q = ` AND (app_news.news_title  LIKE ? OR app_news.news_description  LIKE  ?)`; //
    sql += q;
    sql_count += q;
    search_param = [`%${search}%`, `%${search}%`];
  }

  let getCountFilter = await runQuery(sql_count + u, search_param);
  total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;
  sql += `  ORDER BY app_news.news_id DESC LIMIT ${offset},${per_page} `;

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

router.post("/image/create", middleware, (req, res, next) => {
  const data = req.body;
  const news_id = data.news_id;
  con.query(
    "SELECT news_id FROM app_news WHERE news_id = ?",
    [news_id],
    (err, rows) => {
      let _content = rows.length;

      if (_content <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null",
        });
      }

      con.query(
        "INSERT INTO app_news_image (ni_path_file,ni_name_file,news_id) VALUES (?,?,?)",
        [data.ni_path_file, data.ni_name_file, news_id],
        function (err, result) {
          if (err) throw err;
          return res.json(result);
        }
      );
    }
  );
});

router.delete("/image/delete/:ni_id", middleware, async (req, res, next) => {
  const { ni_id } = req.params;

  const getNewsImage = await runQuery(
    "SELECT * FROM app_news_image WHERE ni_id=?",
    [ni_id]
  );
  const path =
    getNewsImage[0] !== undefined ? getNewsImage[0]?.ni_path_file : "";

  if (path === "") {
    return res.status(204).json({
      status: 204,
      message: "Data is null",
    });
  }

  const r = await runQuery("  DELETE FROM  app_news_image WHERE ni_id=?  ", [
    ni_id,
  ]);
  if (path !== "") {
    await delFile(path);
  }

  return res.json(r);
});

module.exports = router;
