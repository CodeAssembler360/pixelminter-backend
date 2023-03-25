const {
  buildSetup,
  createFiles,
  createMetaData,
} = require("../controller/main");
const {
  addLayers,
  numberOfCollections,
  defaultEdition,
} = require("../controller/config");
const archiver = require("../helper/archiver");
const { Nft } = require("../models/Nft");
const _ = require("lodash");

const generateNfts = async (req, res) => {
  try {
    await numberOfCollections(req.query.collection);
    const result = await addLayers(req);
    console.log(result,"result")
    if (result.length > 0) {
    
      await buildSetup(req);
      await createFiles(req.query.collection, req, req.body.layerOrder);
      const results = await createMetaData(req);
      if (results) {
        const buildDir = `${process.env.PWD}/layers/${req.user.id}`;
        let deleteZip = await archiver.deleteFolder(buildDir);
        if (deleteZip) {
          return res.status(200).send({ msg: "generated" });
        }
      }
      return res.status(400).send({ msg: "nft not generated" });
    } else {
      return res
        .status(400)
        .send({ msg: "please add layers before generating the NFTs" });
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
};
module.exports = { generateNfts };
