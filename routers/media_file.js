const express = require("express");
const router = express.Router();
const middleware = require("../middleware");
const functions = require("../functions");
const multer = require("multer");
const mime = require("mime-types");
const fs = require("fs");
const d = new Date();
const year = d.getFullYear();
const month = d.getMonth() + 1;
const base_path = "static/upload/" + year + "/" + month;
const crt_path = multer({
  dest: base_path,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(file.mimetype);
    cb(null, base_path);
  },
  filename: function (req, file, cb) {
    // console.log(file.originalname);
    const extension = file.originalname.split(".").pop();
    cb(null, file.fieldname + "-" + functions.randomCode() + "." + extension);
  },
});
const upload = multer({ storage: storage });

router.post("/upload/file", upload.array("files"), middleware, (req, res) => {
  res.json(req.files);
});

router.get("/file/?", (req, res) => {
  let path = req.query.f;
  const mimeType = mime.lookup(path);
  //   console.log(mimeType);
  const extension = mimeType.split("/")[0];
  //   console.log(extension);
  let file = path;
  // console.log(extension);R
  if (extension === "image") {
    fileToLoad = fs.readFileSync(file);
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(fileToLoad, "binary");
  } else if (extension === "application") {
    fileToLoad = fs.readFileSync(file);
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(fileToLoad, "binary");
  } else {
    fileToLoad = fs.readFileSync(file, "utf8");
    res.writeHead(200, { "Content-Type": mimeType });
    res.end(fileToLoad, "binary");
  }
});

router.delete("/file/?", (req, res) => {
  let path = req.query.f;
  var filePath = path;
  fs.unlinkSync(filePath);
  res.end();
});



module.exports = router;
