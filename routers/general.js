const express = require("express");
const router = express.Router();
const request = require("request");
const con = require("../database");
const middleware = require("../middleware");
const functions = require("../functions");
const common = require("../common");
const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds

router.post("/sms/laotel/send", middleware, (req, res, next) => {
  const data = req.body;
  //   const transaction_id = data.transaction_id;
  const header = data.header;
  const phoneNumber = data.phoneNumber;
  const message = data.message;
  const genNumber = Math.floor(100 + Math.random() * 100);
  const date = new Date();
  const dateText =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  // SMS API
  let post = {
    transaction_id: "DTC" + dateText + genNumber.toString(),
    header: header,
    phoneNumber: phoneNumber,
    message: message,
  };

  request(
    {
      method: "POST",
      body: post,
      json: true,
      url: "https://apicenter.laotel.com:9443/api/sms_center/submit_sms",
      headers: {
        Apikey: "ufCeK941cimODrm6iCtisQg1JFAdGu62",
        "Content-Type": "application/json",
      },
    },
    function (error, response, body) {
      console.log(body);
    }
  );
  return res.json({ msg: "success" });
});
router.get("/mobile/version/detect", middleware, (req, res, next) => {
  con.query(
    "SELECT  *  FROM app_mobile_log_version  ORDER BY	id DESC LIMIT 0,1",
    (err, rows) => {
      return res.json(rows[0]);
    }
  );
});

module.exports = router;
