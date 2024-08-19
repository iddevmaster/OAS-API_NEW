const express = require("express");
const router = express.Router();
const con = require("../database");
const request = require("request");
const middleware = require("../middleware");
const functions = require("../functions");

async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}

router.post("/verify/student", middleware, async (req, res, next) => {
  const data = req.body;
  const student_id = data.student_id;
  const user_id = data.user_id;
  const getUser = await runQuery("SELECT * FROM app_user WHERE user_id=?", [
    user_id,
  ]);
  const getUserVrdls = await runQuery(
    "SELECT * FROM app_user_vrdls WHERE user_id=? AND student_id=?",
    [user_id, student_id]
  );

  //   console.log(getUser[0]?.["user_firstname"]);
  if (getUser[0]?.["user_firstname"] === undefined) {
    return res.status(404).json({
      verify: false,
    });
  }
  const user_firstname = getUser[0]?.["user_firstname"];
  const user_lastname = getUser[0]?.["user_lastname"];
  const user_phone = getUser[0]?.["user_phone"];
  const vrdls = getUserVrdls[0]?.["student_id"];
  request(
    {
      method: "GET",
      json: false,
      url:
        "http://xn--p6ccf8h.xn--q7ce6a/thongpong/c/action/simdatadatacom?pass=ati123&type=license&province_no=" +
        student_id,
    },
    async function (error, response, body) {
      const arr = body.split("\r\n");

      if (arr[0] === "" || arr[0] === null || arr[0] === undefined) {
        return res.status(400).json({
          verify: false,
        });
      }
      const name = arr[0];
      const phone = arr[14];
      //   const nameText = name.split(":")[1];
      //   console.log(phone);
      const chk_firtname = name.search(user_firstname);
      const chk_lastname = name.search(user_lastname);
      const chk_phone = phone.search(user_phone);
      if (chk_firtname >= 0 && chk_lastname >= 0 && chk_phone >= 0) {
        if (vrdls === undefined) {
          await runQuery(
            "INSERT INTO  app_user_vrdls (student_id,user_id) VALUES (?,?)",
            [student_id, user_id]
          );
        }
        await runQuery(
          "UPDATE app_user_detail SET verify_account='system_active'  WHERE user_id=?",
          [user_id]
        );
        return res.status(200).json({
          verify: true,
        });
      }

      return res.status(400).json({
        verify: false,
      });
    }
  );
});

module.exports = router;
