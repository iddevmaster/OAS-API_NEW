const f = {};

f.randomCode = () => {
  var pwdChars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var pwdLen = 10;
  var randomstring = Array(pwdLen)
    .fill(pwdChars)
    .map(function (x) {
      return x[Math.floor(Math.random() * x.length)];
    })
    .join("");
  return randomstring;
};
f.urlFriendly = (value) => {
  return value == undefined
    ? ""
    : value
        .replace(/[\s+]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
};
f.datetimeNow = () => {
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOTime = new Date(Date.now() - tzoffset)
    .toISOString()
    .slice(0, -1);
  return localISOTime;
};
f.setZero = (val) => {
  let z = parseInt(val);
  if (val <= 0) {
    z = 0;
  }
  return z;
};
f.dateAsiaThai = () => {
  const date = new Date();
  const r = new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
  );
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOTime = new Date(r - tzoffset).toISOString().slice(0, -1);
  return localISOTime;
};

f.yyyymmdd = () => {
  let date = new Date();
  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
  let day = ("0" + date.getDate()).slice(-2);
  let formattedDate = year + month + day;
  // console.log(formattedDate);
  return formattedDate;
};

f.treeDigit = (number) => {
  let n = 1;
  if (parseInt(number) > 0){
    n = number;
  }
  const formattedNum = String(n).padStart(3, '0');
  // console.log(formattedNum); // Outputs: 001
  return formattedNum;
};


module.exports = f;
