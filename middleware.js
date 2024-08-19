const middleware = (req, res, next) => {
  /* ตรวจสอบว่า authorization คือ Boy หรือไม่*/
  let pwd = "ZeBuphebrltl3uthIFraspubroST80Atr9tHuw5bODowi26p";
  if (req.headers.authorization === pwd) next(); //อนุญาตให้ไปฟังก์ชันถัดไป
  else res.send("Bad API");
};

module.exports = middleware;
