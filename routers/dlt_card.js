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
  console.log(dateStr);
  
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

module.exports = router;
