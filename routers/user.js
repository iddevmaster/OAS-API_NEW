const express = require("express");
const bcrypt = require("bcrypt");
const request = require("request");
const router = express.Router();
const con = require("../database");
const common = require("../common");
const middleware = require("../middleware");
const functions = require("../functions");

const numSaltRounds = 8;

async function runQuery(sql, param) {
  return new Promise((resolve, reject) => {
    resolve(con.query(sql, param));
  });
}

router.post("/list?", middleware, async (req, res, next) => {
  const data = req.body;
  const current_page = data.page;
  const per_page = data.per_page <= 50 ? data.per_page : 50;
  const search = data.search;
  const offset = functions.setZero((current_page - 1) * per_page);
  let total = 0;
  let total_filter = 0;
  let search_param = [];
  let u = "";
  let sql =
    "SELECT 	user_id,  user_name,  user_firstname,  user_lastname, user_email, user_phone, user_type, crt_date, udp_date  FROM app_user WHERE cancelled=1";

  if (req.query.user_type) {
    let user_type = req.query.user_type;
    u = " AND user_type =  " + user_type; // ประเภท User
    sql += u;
  }

  let sql_count =
    " SELECT  COUNT(*) as numRows FROM  app_user WHERE  cancelled=1 ";
  let getCountAll = await runQuery(sql_count + u);
  total = getCountAll[0] !== undefined ? getCountAll[0]?.numRows : 0;

  if (search !== "" || search.length > 0) {
    // sql += ` AND (user_name  LIKE  '%${search}%' OR user_firstname  LIKE  '%${search}%' OR user_lastname  LIKE  '%${search}%' OR user_email  LIKE  '%${search}%' OR user_phone  LIKE  '%${search}%')`; //
    let q = ` AND (user_name  LIKE ? OR user_firstname  LIKE  ? OR user_lastname  LIKE  ? OR user_email  LIKE  ? OR user_phone  LIKE  ?)`; //
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

  let getCountFilter = await runQuery(sql_count + u, search_param);
  total_filter =
    getCountFilter[0] !== undefined ? getCountFilter[0]?.numRows : 0;

  sql += `  ORDER BY user_id DESC LIMIT ${offset},${per_page} `;
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

router.post("/login", middleware, (req, res, next) => {
  const data = req.body;

  con.query(
    "SELECT * FROM app_user WHERE active = 1 AND cancelled=1 AND (user_name = ? OR user_email=? OR user_phone=?)",
    [data.user_name, data.user_name, data.user_name],
    function (err, response) {
      bcrypt
        .compare(data.user_password, response[0]?.user_password)
        .then((result) => {
          if (result === true) {
            const r = response[0];
            const js = {
              user_id: r?.user_id,
              user_prefrix: r?.user_prefrix,
              user_name: r?.user_name,
              user_firstname: r?.user_firstname,
              user_lastname: r?.user_lastname,
              user_email: r?.user_email,
              user_phone: r?.user_phone,
              user_type: r?.user_type,
              active: r?.active,
              crt_date: r?.crt_date,
              udp_date: r?.udp_date,
            };
            return res.json(js);
          } else {
            return res.status(400).json({
              status: 400,
              message:
                "Invalid Credentials Error With Correct Username/Password", // error.sqlMessage
            });
          }
        })
        .catch((err) => {
          //   console.log(err);
          return res.status(400).json({
            status: 400,
            message: "Invalid Credentials Error With Correct Username/Password", // error.sqlMessage
          });
        });
    }
  );
});

router.post("/create", middleware, async (req, res, next) => {
  const data = req.body;
  const user_name = data.user_name;
  const user_phone = data.user_phone;
  const user_email = data.user_email;
  const user_type = data.user_type;
  // ตรวจสอบว่ามี user_name ,email และเบอร์โทรนี้หรือไม่
  if (user_email !== "" && user_type === 3) {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE user_name = ? OR user_email=? OR user_phone=? ",
      [user_name, user_email, user_phone]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  } else if (user_email === "" && user_type === 3) {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE user_name = ?  OR user_phone=? ",
      [user_name, user_phone]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  } else {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE user_name = ?",
      [user_name]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  }

  bcrypt
    .hash(data.user_password, numSaltRounds)
    .then((hash) => {
      let userHash = hash;
      // console.log("Hash ", hash);
      con.query(
        "INSERT INTO app_user (user_name, user_password,user_prefrix,user_firstname,user_lastname,user_email,user_phone,user_type,active,crt_date,udp_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          user_name,
          userHash,
          data.user_prefrix,
          data.user_firstname,
          data.user_lastname,
          user_email,
          user_phone,
          data.user_type,
          data.active,
          functions.dateAsiaThai(),
          functions.dateAsiaThai(),
        ],
        async function (err, result) {
          if (err) throw err;
          // console.log("1 record inserted");
          await runQuery(
            "INSERT INTO app_user_detail (verify_account,identification_number,user_img, user_birthday,user_address,user_village,location_id,country_id,user_id) VALUES (?,?,?,?,?,?,?,?,?)",
            [
              "unactive",
              "",
              "",
              `${functions.datetimeNow()}`,
              "",
              "",
              1,
              33,
              result?.insertId,
            ]
          );
          return res.json(result);
        }
      );
    })
    .catch((err) => console.error(err.message));
});
router.put("/update/:user_id", middleware, async (req, res, next) => {
  const { user_id } = req.params;
  const data = req.body;
  const user_name = data.user_name;
  const user_password = data.user_password;
  const user_phone = data.user_phone;
  const user_email = data.user_email;
  const user_type = data.user_type;
  // ตรวจสอบว่ามี  user_id อยู่นี้หรือไม่
  let _check_user = await runQuery(
    "SELECT user_id FROM app_user WHERE user_id = ?",
    [user_id]
  );

  if (_check_user.length <= 0) {
    return res.status(204).json({
      status: 204,
      message: "Username Error", // error.sqlMessage
    });
  }

  // ตรวจสอบว่ามี user_name ,email และเบอร์โทรนี้หรือไม่
  if (user_email !== "" && user_type === 3) {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE (user_name = ? OR user_email=? OR user_phone=?) AND user_id != ?  ",
      [user_name, user_email, user_phone, user_id]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  } else if (user_email === "" && user_type === 3) {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE (user_name = ?  OR user_phone=?) AND user_id != ?  ",
      [user_name, user_phone, user_id]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  } else {
    let _check_users = await runQuery(
      "SELECT user_name FROM app_user WHERE user_name = ? AND user_id != ?",
      [user_name, user_id]
    );
    if (_check_users.length >= 1) {
      return res.status(404).json({
        status: 404,
        message: "Username Error", // error.sqlMessage
      });
    }
  }

  if (user_password !== "") {
    bcrypt
      .hash(user_password, numSaltRounds)
      .then((hash) => {
        let passHash = hash;
        con.query(
          "UPDATE  app_user SET user_name=? , user_password=? ,user_prefrix=?, user_firstname=? ,user_lastname=? ,user_email=? ,user_phone=? ,user_type=?,active=?, udp_date=? WHERE user_id=? ",
          [
            user_name,
            passHash,
            data.user_prefrix,
            data.user_firstname,
            data.user_lastname,
            user_email,
            user_phone,
            data.user_type,
            data.active,
            functions.dateAsiaThai(),
            user_id,
          ],
          function (err, result) {
            if (err) throw err;
            return res.json(result);
          }
        );
      })
      .catch((err) => console.error(err.message));
  } else {
    con.query(
      "UPDATE  app_user SET user_name=? ,user_prefrix=?, user_firstname=? ,user_lastname=? ,user_email=? ,user_phone=? ,user_type=?,active=?, udp_date=? WHERE user_id=? ",
      [
        user_name,
        data.user_prefrix,
        data.user_firstname,
        data.user_lastname,
        user_email,
        user_phone,
        data.user_type,
        data.active,
        functions.dateAsiaThai(),
        user_id,
      ],
      function (err, result) {
        if (err) throw err;
        return res.json(result);
      }
    );
  }
});

router.get("/get/:user_id", middleware, async (req, res, next) => {
  const { user_id } = req.params;
  let sql = `SELECT 
  t1.* ,
  (SELECT  GROUP_CONCAT((JSON_OBJECT('verify_account', t2.verify_account,'identification_number', t2.identification_number,'user_img', t2.user_img,'user_birthday', t2.user_birthday,'user_address', t2.user_address,'user_village', t2.user_village,'location_id', t2.location_id,'country_id',t2.country_id,
  'location', (SELECT   GROUP_CONCAT((JSON_OBJECT('zipcode', t3.zipcode,'zipcode_name', t3.zipcode_name ,'amphur_code', t3.amphur_code,'amphur_name', t3.amphur_name, 'province_code', t3.province_code,'province_name', t3.province_name)))  FROM app_zipcode_lao t3  WHERE t3.id =  t2.location_id),
  'country', (SELECT   GROUP_CONCAT((JSON_OBJECT('country_name_eng', t4.country_name_eng,'country_official_name_eng', t4.country_official_name_eng , 'capital_name_eng', t4.capital_name_eng,'zone', t4.zone)))  FROM app_country t4  WHERE t4.country_id =  t2.country_id)
  )))  FROM app_user_detail t2  WHERE t2.user_id =  t1.user_id ) AS detail,
 (   (SELECT   GROUP_CONCAT((JSON_OBJECT('idcard_front', t5.idcard_front,'idcard_back', t5.idcard_back)))  FROM app_user_idcard t5 WHERE t5.user_id =  t1.user_id)) AS card
  FROM app_user t1 
  WHERE  t1.user_id = ? 
  `;

  let getUserMain = await runQuery(sql, [user_id]);
  if (getUserMain.length <= 0) {
    return res.status(204).json({
      status: 204,
      message: "Data is null",
    });
  }

  let data = getUserMain[0];
  let detail = data?.detail !== undefined ? JSON.parse(data?.detail) : {};
  let card = data?.card !== undefined ? JSON.parse(data?.card) : {};
  let set_detail = {};
  if (detail != undefined) {
    let location = JSON.parse(detail?.location);
    let country = JSON.parse(detail?.country);

    set_detail = {
      verify_account: detail?.verify_account,
      identification_number: detail?.identification_number,
      user_img: detail?.user_img,
      user_birthday: detail?.user_birthday,
      user_address: detail?.user_address,
      user_village: detail?.user_village,
      location_id: detail?.location_id,
      country_id: detail?.country_id,
      location: location,
      country: country,
    };
  }
  const response = {
    user_id: data?.user_id,
    user_name: data?.user_name,
    user_prefrix: data?.user_prefrix,
    user_firstname: data?.user_firstname,
    user_lastname: data?.user_lastname,
    user_email: data?.user_email,
    user_phone: data?.user_phone,
    user_type: data?.user_type,
    active: data?.active,
    crt_date: data?.crt_date,
    udp_date: data?.udp_date,
    detail: set_detail,
    card: card,
  };
  return res.json(response);
});

router.delete("/delete/:user_id", middleware, (req, res, next) => {
  const { user_id } = req.params;
  con.query(
    "UPDATE  app_user SET cancelled=0  WHERE user_id = ?",
    [user_id],
    function (err, results) {
      return res.json(results);
    }
  );
});

router.put("/change_password/:user_id", middleware, async (req, res, next) => {
  const { user_id } = req.params;
  const data = req.body;
  let curent_password = data.curent_password;
  let new_password = data.new_password;
  let confirm_new_password = data.confirm_new_password;

  if (new_password !== confirm_new_password) {
    return res.status(404).json({
      status: 404,
      message: "Passwords do NOT match!",
    });
  }
  let _content_users = await runQuery(
    "SELECT * FROM app_user WHERE user_id = ?",
    [user_id]
  );
  if (_content_users.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Data is null",
    });
  }
  password_verify = _content_users[0]?.user_password;

  bcrypt
    .compare(curent_password, password_verify)
    .then((result) => {
      if (result === true) {
        bcrypt
          .hash(new_password, numSaltRounds)
          .then((hash) => {
            let passHash = hash;
            con.query(
              "UPDATE  app_user SET  user_password=? , udp_date=? WHERE user_id=? ",
              [passHash, functions.dateAsiaThai(), user_id],
              function (err, result) {
                if (err) throw err;
                return res.json(result);
              }
            );
          })
          .catch((err) => console.error(err.message));
      } else {
        return res.status(400).json({
          status: 400,
          message: "Invalid Credentials Error With Correct Password", // error.sqlMessage
        });
      }
    })
    .catch((err) => {
      //   console.log(err);
      return res.status(400).json({
        status: 400,
        message: "Invalid Credentials Error With Correct Password", // error.sqlMessage
      });
    });
});

router.post("/detail/create", middleware, async (req, res, next) => {
  const data = req.body;
  let user_id = data.user_id;
  let location_id = data.location_id;
  let country_id = data.country_id;
  let verify_account = data.verify_account;
  let identification_number = data.identification_number;

  // ตรวจสอบว่ามีรหัสที่อยู่นี้หรือไม่
  let getLocation = await runQuery(
    "SELECT id FROM app_zipcode_lao WHERE id = ?",
    [location_id]
  );
  if (getLocation.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Data is null", // error.sqlMessage
    });
  }

  // ตรวจสอบว่ามีรหัสประเทศนี้หรือไม่
  let getCountry = await runQuery(
    "SELECT country_id FROM app_country WHERE country_id = ?",
    [country_id]
  );
  if (getCountry.length <= 0) {
    return res.status(404).json({
      status: 404,
      message: "Data is null", // error.sqlMessage
    });
  }

  // ตรวจสอบว่ามีรหัสบัตรคนนี้ในระบบหรือไม่
  let checkUser = await runQuery(
    "SELECT identification_number FROM app_user_detail WHERE identification_number = ? AND user_id !=?",
    [identification_number, user_id]
  );
  if (checkUser.length >= 1 && identification_number !== "") {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'identification_number'", // error.sqlMessage
    });
  }

  let getUser = await runQuery(
    "SELECT app_user.user_name ,app_user_detail.id FROM app_user LEFT JOIN app_user_detail ON app_user_detail.user_id  = app_user.user_id  WHERE app_user.user_id = ?",
    [user_id]
  );
  let id_detail = getUser[0]?.id === undefined ? 0 : getUser[0]?.id;
  if (
    verify_account !== "unactive" &&
    verify_account !== "phone_active" &&
    verify_account !== "phone_unactive" &&
    verify_account !== "system_active" &&
    verify_account !== "system_unactive"
  ) {
    return res.status(404).json({
      status: 404,
      message: "Invalid 'verify_account' ", // error.sqlMessage
    });
  }
  // บันทึก

  if (id_detail <= 0) {
    let result = await runQuery(
      "INSERT INTO app_user_detail (verify_account,identification_number,user_img, user_birthday,user_address,user_village,location_id,country_id,user_id) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        verify_account,
        identification_number,
        data.user_img,
        data.user_birthday,
        data.user_address,
        data.user_village,
        location_id,
        country_id,
        data.user_id,
      ]
    );
    return res.json(result);
  } else {
    let result = await runQuery(
      "UPDATE  app_user_detail SET verify_account=?,identification_number=?, user_img=? , user_birthday=? ,user_address=? ,user_village=?, location_id=? ,country_id=?  WHERE user_id=? ",
      [
        verify_account,
        identification_number,
        data.user_img,
        data.user_birthday,
        data.user_address,
        data.user_village,
        location_id,
        country_id,
        data.user_id,
      ]
    );
    return res.json(result);
  }
});

router.post("/idcard/create", middleware, async (req, res, next) => {
  const data = req.body;
  let user_id = data.user_id;
  let idcard_front = data.idcard_front;
  let idcard_back = data.idcard_back;
  let getUser = await runQuery(
    "SELECT app_user.user_name ,app_user_idcard.id FROM app_user LEFT JOIN app_user_idcard ON app_user_idcard.user_id  = app_user.user_id  WHERE app_user.user_id = ?",
    [user_id]
  );
  let id_detail = getUser[0]?.id === undefined ? 0 : getUser[0]?.id;
  // บันทึก
  if (id_detail <= 0) {
    let result = await runQuery(
      "INSERT INTO app_user_idcard (idcard_front,idcard_back,user_id) VALUES (?,?,?)",
      [idcard_front, idcard_back, user_id]
    );
    return res.json(result);
  } else {
    let result = await runQuery(
      "UPDATE  app_user_idcard SET idcard_front=?,idcard_back=? WHERE user_id=? ",
      [idcard_front, idcard_back, user_id]
    );
    return res.json(result);
  }
});

router.get("/only/detail/:user_param", middleware, (req, res, next) => {
  const { user_param } = req.params;
  con.query(
    "SELECT t1.*,t2.user_firstname,t2.user_lastname,t2.user_email,t2.user_phone FROM app_user_detail t1 INNER JOIN app_user t2 ON  t2.user_id = t1.user_id  WHERE t1.user_id = ? OR t1.identification_number = ? OR t2.user_email = ? OR t2.user_phone = ?",
    [user_param, user_param, user_param, user_param],
    function (err, results) {
      let checkuser = results.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null", // error.sqlMessage
        });
      }
      return res.json(results);
    }
  );
});

// router.get("/otp/:user_id", middleware, (req, res, next) => {
//   const { user_id } = req.params;
//   const otp_code = Math.floor(100000 + Math.random() * 900000);
//   const otp_ref = functions.randomCode();

//   con.query(
//     "SELECT app_user.user_name ,app_user.user_phone,app_user_otp.total_request FROM app_user LEFT JOIN app_user_otp ON app_user_otp.user_id  = app_user.user_id  WHERE app_user.user_id = ?",
//     [user_id],

//     (err, rows) => {
//       let checkuser = rows.length;
//       if (checkuser <= 0) {
//         return res.status(204).json({
//           status: 204,
//           message: "Data is null", // error.sqlMessage
//         });
//       }

//       let user_phone =
//         rows[0]?.user_phone === undefined ? 0 : rows[0]?.user_phone;

//       let total_request =
//         rows[0]?.total_request === undefined ? 0 : rows[0]?.total_request;
//       let total_request_set = total_request + 1;

//       if (total_request <= 0) {
//         con.query(
//           "INSERT INTO app_user_otp (otp_code,otp_ref,total_request, crt_date,udp_date,user_id) VALUES (?,?,?,?,?,?)",
//           [otp_code, otp_ref, 1, functions.dateAsiaThai(), functions.dateAsiaThai(), user_id]
//         );
//       } else {
//         con.query(
//           "UPDATE  app_user_otp SET otp_code=?,otp_ref=?, total_request=? , udp_date=?  WHERE user_id=? ",
//           [otp_code, otp_ref, total_request_set, functions.dateAsiaThai(), user_id]
//         );
//       }
//       // SMS API
//       let data = {
//         sender: "SMS PRO",
//         msisdn: [user_phone],
//         message: "Your OTP is " + otp_code + " REF:" + otp_ref,
//       };
//       request(
//         {
//           method: "POST",
//           body: data,
//           json: true,
//           url: "https://thsms.com/api/send-sms",
//           headers: {
//             Authorization: common.sms_token,
//             "Content-Type": "application/json",
//           },
//         },
//         function (error, response, body) {
//           console.log(body);
//         }
//       );
//       return res.json({
//         otp_code: otp_code,
//         otp_ref: otp_ref,
//         total_request: total_request_set,
//       });
//     }
//   );
// });
router.get("/otp/:user_id", middleware, (req, res, next) => {
  const { user_id } = req.params;
  const otp_code = Math.floor(100000 + Math.random() * 900000);
  const otp_ref = functions.randomCode();
  const sms_key = "ufCeK941cimODrm6iCtisQg1JFAdGu62";
  const genNumber = Math.floor(100 + Math.random() * 100);
  const date = new Date();
  const dateText =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  con.query(
    "SELECT app_user.user_name ,app_user.user_phone,app_user_otp.total_request FROM app_user LEFT JOIN app_user_otp ON app_user_otp.user_id  = app_user.user_id  WHERE app_user.user_id = ?",
    [user_id],

    (err, rows) => {
      let checkuser = rows.length;
      if (checkuser <= 0) {
        return res.status(204).json({
          status: 204,
          message: "Data is null", // error.sqlMessage
        });
      }

      let user_phone =
        rows[0]?.user_phone === undefined ? 0 : rows[0]?.user_phone;

      let total_request =
        rows[0]?.total_request === undefined ? 0 : rows[0]?.total_request;
      let total_request_set = total_request + 1;

      if (total_request <= 0) {
        con.query(
          "INSERT INTO app_user_otp (otp_code,otp_ref,total_request, crt_date,udp_date,user_id) VALUES (?,?,?,?,?,?)",
          [
            otp_code,
            otp_ref,
            1,
            functions.dateAsiaThai(),
            functions.dateAsiaThai(),
            user_id,
          ]
        );
      } else {
        con.query(
          "UPDATE  app_user_otp SET otp_code=?,otp_ref=?, total_request=? , udp_date=?  WHERE user_id=? ",
          [
            otp_code,
            otp_ref,
            total_request_set,
            functions.dateAsiaThai(),
            user_id,
          ]
        );
      }
      // SMS API
      let data = {
        transaction_id: "DTC" + dateText + genNumber.toString(),
        header: "DOT",
        phoneNumber: "856" + user_phone,
        message: "Your OTP is " + otp_code + " REF:" + otp_ref,
      };
      request(
        {
          method: "POST",
          body: data,
          json: true,
          url: "https://apicenter.laotel.com:9443/api/sms_center/submit_sms",
          headers: {
            Apikey: sms_key,
            "Content-Type": "application/json",
          },
        },
        function (error, response, body) {
          console.log(body);
        }
      );
      return res.json({
        otp_code: otp_code,
        otp_ref: otp_ref,
        total_request: total_request_set,
      });
    }
  );
});

router.put("/verify_otp", middleware, (req, res, next) => {
  const data = req.body;
  let otp_code = data.otp_code;
  let user_id = data.user_id;
  con.query(
    "SELECT user_id,  otp_code  FROM app_user_otp WHERE  user_id = ? AND otp_code=?",
    [user_id, otp_code],
    function (err, results) {
      if (results.length <= 0) {
        return res.status(204).json({
          access: false,
        });
      }
      return res.json({ access: true });
    }
  );
});

module.exports = router;
