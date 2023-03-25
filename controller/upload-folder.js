/*
MIT License

Copyright (c) 2022 Rob (Coderrob) Lindley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

const { post } = require("axios");
const { createReadStream, outputJsonSync } = require("fs-extra");
const { read } = require("recursive-fs");
const FormData = require("form-data");
const basePathConverter = require("base-path-converter");
const fs = require("fs");
const { Console } = require("console");

require("dotenv").config();

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;

const { log, error } = console;

const PINATA_API_PINFILETOIPFS =
  "https://api.pinata.cloud/pinning/pinFileToIPFS";

const upload = async (req, FOLDER_PATH) => {
  try {
    const OUTPUT_PATH = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/folder-cid.json`;
    const FOLDER_NAME = "metadata"; // Display name of folder in Pinata
    // const FOLDER_PATH = `${process.env.PWD}/build/${req.user.id}/nfts`; // Folder to be uploaded
    const { files } = await read(FOLDER_PATH);
    if ((files && files.length) <= 0) {
      log(`No files were found in folder '${FOLDER_PATH}'`);
      return;
    }
    log(`'${FOLDER_PATH}' upload started`);
    const formData = new FormData();
    files.forEach((filePath) => {
      log(`Adding file: ${filePath}`);
      formData.append("file", createReadStream(filePath), {
        filepath: basePathConverter(FOLDER_PATH, filePath),
      });
    });
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: FOLDER_NAME,
      })
    );
    const {
      data: { IpfsHash: cid },
    } = await post(PINATA_API_PINFILETOIPFS, formData, {
      maxBodyLength: "Infinity",
      headers: {
        // eslint-disable-next-line no-underscore-dangle
        "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });
    log(`'${FOLDER_PATH}' upload complete; CID: ${cid}`);
    outputJsonSync(OUTPUT_PATH, { [FOLDER_NAME]: cid });
    return cid;
  } catch (err) {
    error(err);
    return false;
  }
};

const writeFiles = async (req, result) => {
  try {
    const FOLDER_PATH = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/metadata`;
    const { files } = await read(FOLDER_PATH);
    if ((files && files.length) <= 0) {
      log(`No files were found in folder '${FOLDER_PATH}'`);
      return;
    }
    let i = 1;
    files.forEach((file) => {
      let rawdata = fs.readFileSync(file);

      let metadata_pic = JSON.parse(rawdata);

      metadata_pic[
        "image"
      ] = `https://gateway.pinata.cloud/ipfs/${result}/${i}.png`;
      metadata_pic["ipfs"] = `${result}/${i}.png`;

      fs.writeFileSync(file, JSON.stringify(metadata_pic));
      i++;
    });
    console.log(files);
    return files;
  } catch (error) {
    return false;
  }
};

module.exports = { upload, writeFiles };
