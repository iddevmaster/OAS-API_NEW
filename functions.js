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

f.DigitRandom = () => {
  let result = '';
  let result2 = '';
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const charactersLength = characters.length;
let counter = 0;
while (counter < 6) {
  result += characters.charAt(Math.floor(Math.random() * charactersLength));
  counter += 1;
}

const characters2 = '0123456789';
const charactersLength2 = characters2.length;
let counter2 = 0;
while (counter2 < 2) {
  result2 += characters2.charAt(Math.floor(Math.random() * charactersLength2));
  counter2 += 1;
}
return result+result2;
};


f.Arrayall = (item,data) => {

 const resvr = [];
for (let i = 0; i < item.length; i++) {
  resvr.push(item[i].dlt_code);
}
resvr.push(data[0].dlt_code);
return resvr

}
f.Checkdupi = (data) => {


 const a = data.some((item, index) => data.indexOf(item) !== index);
  return a
}

module.exports = f;
