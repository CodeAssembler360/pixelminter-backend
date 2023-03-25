const express = require('express');
const router = express.Router();
const files = require('../middleware/files');
const user = require('../controller/dashboard');
const dashboard = require('../controller/dashboard');
const validationMiddleware = require('../middleware/validationMiddleware');
const middleware = require('../middleware/authMiddleware');

router.post('/signup', ...validationMiddleware.signup, user.signup);

router.post('/login', ...validationMiddleware.login, user.userLogin);
router.post(
  "/wallet/login",
  ...validationMiddleware.signature,
  user.walletLogin
);
router.get("/wallet/signature", user.getSignature);
router.post(
  "/wallet/signup",
  ...validationMiddleware.signature,
  user.walletSignup
);
//upload the pics on the server where the backend is deployed
router.post(
  "/upload/pics/server",
  middleware.requireValidToken,

  files([{ name: "pics" }]),
  validationMiddleware.uploadfiles,
  dashboard.uploadPics
);

//nfts which are created on the pinata
router.post(
  "/upload/directories/pinata",
  middleware.requireValidToken,
  dashboard.uploadPicsPinata
);
router.get("/layers",
 middleware.requireValidToken, dashboard.getLayers);
router.delete(
  "/remove/layer",
  middleware.requireValidToken,
  dashboard.deleteDirectory
);

// generate new nfts from the uploaded pics 
router.post(
  '/generate/nfts',
  middleware.requireValidToken,
  dashboard.createNfts
);
router.put(
  "/collection/payments",
  middleware.requireValidToken,
  dashboard.updatePayment
);

//get all the links 
router.get("/get/allnfts", middleware.requireValidToken, dashboard.getAllLinks);

router.post('/create/zip', middleware.requireValidToken, dashboard.zipFolder);

router.get("/get/cid", middleware.requireValidToken, dashboard.getCid);

router.put('/update/allnft/:id',middleware.requireValidToken,dashboard.editZip);

router.delete('/delete/cid/:id',middleware.requireValidToken,dashboard.deleteCid);

router.get('/getEthereum',middleware.requireValidToken,dashboard.getEthereum)

module.exports = router;
