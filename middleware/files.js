const multer = require('multer');
const fs = require('fs');
const path = require('path');
const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
};

const upload = (fileds) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isValid = MIME_TYPE_MAP[file.mimetype];
      let error = new Error('Invalid mime type');
      if (isValid) {
        error = null;
      }
      let dir = `./layers/${req.user.id}/${req.body.name}`;
      if (!fs.existsSync("./layers")) {
        fs.mkdirSync("./layers");
      }
      if (!fs.existsSync(`./layers/${req.user.id}`)) {
        fs.mkdirSync(`./layers/${req.user.id}`);
      }
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      cb(error, `./layers/${req.user.id}/${req.body.name}`);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
    // filename: (req, file, cb) => {
    //   const name = file.fieldname
    //     .replace(/([A-Z])/g, " $1")
    //     .replace(/ /g, "_")
    //     .toLowerCase();
    //   cb(null, name + "_" + Date.now() + "." + MIME_TYPE_MAP[file.mimetype]);
    // },
  });

  return multer({
    storage: storage,
    
    limits: { fieldSize: 100 * 1024 * 1024 },
  }).fields(fileds);
};

module.exports = upload;
