const fs = require("fs");
const basePath = process.cwd();
const { createCanvas, loadImage } = require("canvas");
const console = require("console");

const {
  format, rarity,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require("./config.js");
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
//woe
ctx.imageSmoothingEnabled = format.smoothing;
var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";



//end

if (!process.env.PWD) {
  process.env.PWD = process.cwd();
}

let buildDir;
const metDataFile = "_metadata.json";
let layersDir;
let metadatFiles;
let metadata = [];
let attributes = [];
let hash = [];
let decodedHash = [];
const Exists = new Map();

const addRarity = (_str) => {
  let itemRarity;

  rarity.forEach((r) => {
    if (_str.includes(r.key)) {
      itemRarity = r.val;
    }
  });

  return itemRarity;
};

// const cleanName = (_str) => {
//   let name = _str.slice(0, -4);
//   rarity.forEach((r) => {
//     name = name.replace(r.key, "");
//   });
//   return name;
// };

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      return {
        id: index + 1,
        name: cleanName(i),
        fileName: i,
        path:`${path}${i}`,
        rarity: addRarity(i),
        weight:getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    location: `${layersDir}/${layerObj.name}/`,
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    position: { x: 0, y: 0 },
    size: { width: format.width, height: format.height },
    number: layerObj.number,
  }));

  return layers;
};

const buildSetup = async (req) => {
  buildDir = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/nfts`;
  layersDir = `${process.env.PWD}/layers/${req.user.id}`;
  metDataFiles = null;
  metadatFiles = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/metadata`;
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });
  fs.mkdirSync(metadatFiles, { recursive: true });
};

const saveLayer = async (_canvas, _edition) => {
  await fs.writeFileSync(
    `${buildDir}/${_edition}.png`,
    _canvas.toBuffer("image/png")
  );
};

const addMetadata = async (_edition, req) => {
  let dateTime = Date.now();
  let tempMetadata = {
    hash: hash.join(""),
    decodedHash: decodedHash,
    edition: _edition,
    date: dateTime,
    attributes: attributes,
  };
  await createJson(_edition, tempMetadata, req);
  metadata.push(tempMetadata);
  attributes = [];
  hash = [];
  decodedHash = [];
};

const createJson = async (_edition, tempMetadata, req) => {
  let data = JSON.stringify(tempMetadata);
  await fs.writeFileSync(`${metadatFiles}/${_edition}.json`, data);
};

const addAttributes = async (_element, _layer) => {
  let tempAttr = {
    id: _element.layer.selectedElement.id,
    layer: _element.layer.name,
    name: _element.layer.selectedElement.name,
    rarity: _element.layer.selectedElement.rarity,
  };
  attributes.push(tempAttr);
  hash.push(_element.layer.name);
  hash.push(_element.layer.selectedElement.id);
  await decodedHash.push({
    [_element.layer.name]: _element.layer.selectedElement.id,
  });
};

const drawLayer = async (_layer, _edition) => {
  let rand = Math.random();
  let element = _layer.elements[Math.floor(rand * _layer.number)];
  if (element != null) {
    await addAttributes(element, _layer);
    const image = await loadImage(`${_layer.location}${element.fileName}`);

    await ctx.drawImage(
      image,
      _layer.position.x,
      _layer.position.y,
      _layer.size.width,
      _layer.size.height
    );
    await saveLayer(canvas, _edition);
  }
};

// const createFiles = async (edition, req, layersOrder) => {
//   const layers = await layersSetup(layersOrder);
//   let numDupes = 0;
//   if (layers.length > 0) {
//     for (let i = 1; i <= edition; i++) {
//       // console.log("inde11x", edition);

//       await layers.forEach(async (layer, index) => {
//         // console.log("inde11x", layer);
//         await drawLayer(layer, i);
//       });

//       let key = hash.toString();
//       if (Exists.has(key)) {
//         console.log(
//           `Duplicate creation for edition ${i}. Same as edition ${Exists.get(
//             key
//           )}`
//         );
//         numDupes++;
//         if (numDupes > edition) break; //prevents infinite loop if no more unique items can be created
//         i--;
//       } else {
//         Exists.set(key, i);
//         await addMetadata(i, req);
//       }
//     }
//   }
//   console.log("end create files");
// };

const createMetaData = async (req) => {
  let mainFile = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/${metDataFile}`;

  fs.stat(mainFile, (err) => {
    if (err == null || err.code === "ENOENT") {
      fs.writeFileSync(mainFile, JSON.stringify(metadata, null, 2));
    } else {
      console.log("Oh no, error: ", err.code);
    }
  });
  return true;
};
//wow


const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};
const loadLayerImg = async (_layer) => {
  console.log("laod",_layer);
  try {
    return new Promise(async (resolve) => {
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        console.log(`${layer.elements[i].id}:${layer.elements[i].fileName}${
          layer.bypassDNA ? "?bypassDNA=true" : ""
        }`,'rand');
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].fileName}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};
const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const createFiles = async (edition, req, layersOrder) => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (let i = 0; i <= edition; i++) {
    abstractedIndexes.push(i);

  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
    
  }
  while (layerConfigIndex < layersOrder.length) {

    const layers = await layersSetup(layersOrder);

    while (editionCount <= edition) {
      let newDna =  createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {

        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];
        
        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });
        
        await Promise.all(loadedElements).then((renderObjectArray) => {
          console.log("result",renderObjectArray);
          ctx.clearRect(0, 0, format.width, format.height);
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(renderObject, index, layersOrder.length);
          });
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveLayer(canvas, abstractedIndexes[0]);
          addMetadata( abstractedIndexes[0],req);
          // saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log("Editions left to create: ", abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${
              newDna
            }`
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${edition} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  // writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { buildSetup, createFiles, createMetaData };
