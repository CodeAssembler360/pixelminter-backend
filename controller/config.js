// const layersOrder = [
//     { name: 'background', number: 1 },
//     { name: 'ball', number: 2 },
//     { name: 'eye color', number: 12 },
//     { name: 'iris', number: 3 },
//     { name: 'shine', number: 1 },
//     { name: 'shine', number: 1 },
//     { name: 'bottom lid', number: 3 },
//     { name: 'top lid', number: 3 },
// ];
const path = require("path");

const fs = require("fs");
const addLayers = async (req) => {
  // layersOrder=[];
  let layersOrder = []
 const {number}=req.body;
  try {
    const directoryPath = path.join(__dirname, `../layers/${req.user.id}`);
    console.log(req.user.id);

    if (fs.existsSync(directoryPath)) {
      const data = {};
      let arr = []

      const files = await fs.readdirSync(directoryPath);
      let i = 0;
      await files.forEach(function (file) {
        let layer = {};
        layer.name = file;
        layer.number = number[i];
        layersOrder.push(layer);
        i++;
        // layersOrder=[...arr];
        console.log("layers orde1r", layersOrder);
      });
      return layersOrder;
    } else {
      return [];
    }
  } catch (error) {
    return error;
  }
};
const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 230,
  height: 230,
};

const rarity = [
  { key: "", val: "original" },
  { key: "_r", val: "rare" },
  { key: "_sr", val: "super rare" },
];
const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};


const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;
var defaultEdition;
const numberOfCollections = async (collection) => {
  defaultEdition = collection;
};

module.exports = {
  format,
  rarity,
  text,
  defaultEdition,
  background,
  uniqueDnaTorrance,
  addLayers,
  rarityDelimiter,
  extraMetadata,
  shuffleLayerConfigurations,
  debugLogs,
  numberOfCollections,
};
