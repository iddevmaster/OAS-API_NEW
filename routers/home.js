const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
  return res.json({
    project_name: "DoT Smart App",
    deverlopment: "Siwakorn Banluesapy",
  });
});

module.exports = router;
