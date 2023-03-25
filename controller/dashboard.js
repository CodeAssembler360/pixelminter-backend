const fs = require('fs');
const path = require('path');
const util = require('util');
const myArgs = process.argv.slice(2);
const { buildSetup, createFiles, createMetaData } = require('./main.js');
const { defaultEdition } = require('./config.js');
const jwt = require('jsonwebtoken');
const { addLayers, numberOfCollections } = require("./config");
const mongoose = require("mongoose");
const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const generate = require("../Services/generateNfts");
const archiver = require("../helper/archiver");
const { ObjectId } = require("mongodb");
const { Nft } = require("../models/Nft");
const _ = require("lodash");
const { upload, writeFiles } = require("./upload-folder.js");
const { Cid } = require("../models/Cid.js");
const { request } = require('http');
const axios = require('axios');

const signup = async (req, res) => {
  try {
    try {
      let user = await User.findOne({ email: req.body.email });

      if (user) {
        return res
          .status(409)
          .send({ msg: "User already exists!", success: false });
      }

      let password = req.body.password;
      let saltRounds = parseInt(process.env.saltRounds);
      const encryptedPassword = await bcrypt.hash(password, saltRounds);
      console.log(encryptedPassword);

      delete req.body.password;
      req.body.password = encryptedPassword;
      console.log("body  of ", req.body);

      let newUser = new User({
        email: req.body.email,
        password: req.body.password,
      });
      console.log("newUser", newUser);
      let saveUser = await newUser.save();

      console.log(saveUser);
      return res.status(200).send({
        msg: "Email sent Successfully. To Login, Please verify your email",
        success: true,
      });
    } catch (error) {
      console.log("error", error);

      return res.status(400).send({
        success: false,
        msg: "Ooops, something went wrong - Registration failed",
        error: error,
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      msg: "Server Error - Registration failed",
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(400)
        .send({ msg: `${email} is not a user`, success: false });
    }
    bcrypt.compare(password, user.password, async (err, response) => {
      console.log(err);
      if (response) {
        userLoginResponse(user, res);
      } else {
        return res.status(401).send({
          msg: "Password is incorrect",
          success: false,
        });
      }
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      msg: error.message,
    });
  }
};
const walletLogin = async (req, res) => {
  try {
    const { signature } = req.body;
    let user = await User.findOne({ signature: signature });
    if (!user) {
      return res.status(400).send({ msg: `Not a user`, success: false });
    } else userLoginResponse(user, res);
  } catch (error) {
    return res.status(500).send({
      success: false,
      msg: error.message,
    });
  }
};

const userLoginResponse = async (user, res) => {
  try {
    return res.status(200).send({
      status: 200,
      msg: "Successfully logged in",
      data: {
        token: jwt.sign(
          {
            id: user._id,
            email: user.email,
          },
          process.env.jwtSecret
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const walletSignup = async (req, res) => {
  console.log("req",req)
  try {
    const { signature } = req.body;
    const sign = await User.findOne({ signature: signature });
    if (sign) {
      return res.status(401).send({ msg: "User already exists" });
    }
    
    const create_user = new User({ signature: signature });
    const save_user = create_user.save();
    if (save_user) return res.status(201).send({ msg: "User is created" });
    else return res.status(401).send({ msg: "user is not created" });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

const uploadPics = async (req, res) => {
  try {
    if (_.isEmpty(req.files.pics)) {
      return res.status(400).send({
        success: false,
        msg: "please uploads pics",
      });
    }
    return res.status(200).send({
      msg: "all the layers are uploaded",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};
const uploadPicsPinata = async (req, res) => {
  let save_res;
  try {
    const urls = await forPreview(req, res);
    let FOLDER_PATH = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/nfts`;
    if (fs.existsSync(FOLDER_PATH)) {
      const result_zip = await archiver.createZipArchive(req, res);
      if (result_zip) {
        const uploader = await archiver.uploadToCloudinary(req);
        console.log(uploader);
        if (uploader) {
          let new_record = {
            user: req.user.id,
            collectionName:req.body.collection,
            url: uploader.secure_url,
            preview: urls,
            file_name: uploader.original_filename,
          };

          let response_create = new Nft(new_record);
           save_res = await response_create.save();
        }
      }
      let result = await upload(req, FOLDER_PATH);
      const overwrite = await writeFiles(req, result);

      if (overwrite) {
        FOLDER_PATH = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/metadata`;
        result = await upload(req, FOLDER_PATH);

        if (result) {
          let new_record = {
            user: req.user.id,
            collectionName:req.body.collection,
            cid: result,
            nftId:save_res._id
          };

          let response_create = new Cid(new_record);
          let save_response = await response_create.save();
          const buildDir = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}`;
          let deleteZip = await archiver.deleteFolder(buildDir);
          if (deleteZip) {
            console.log("pinata",deleteZip)
            return res.status(200).send({ msg: "folder uploaded to pinata" });
          }
        }
      }
    } else {
      return res.status(400).send({ msg: "generate NFT's then deploy them" });
    }
  } catch (error) {
    return res.status(400).send({ msg: "generated", error: error.message });
  }
};

const createNfts = async (req, res) => {
  try {
    const { collection } = req.query;
    const user = await User.findById({ _id: req.user.id });
    if (collection > 100 && user.collection_payment) {
      const generateNft = await generate.generateNfts(req, res);
      await User.updateOne({ _id: req.user.id }, { collection_payment: false });
      return generateNft;
    } else if (collection <= 100) {
      const generateNft = await generate.generateNfts(req, res);
      return generateNft;
    } else {
      return res.status(400).send({ msg: "Please recharge your account" });
    }
  } catch (error) {
    return res
      .status(400)
      .send({ msg: " not generated", error: error.message });
  }
};

const forPreview = async (req, res) => {
  try {
    const dir = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/nfts`;
    const files = fs.readdirSync(dir);
    let i = 0;
    let urls = [];
    for (const file of files) {
      console.log(file);
      let filePath = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}/nfts/${file}`;
      let url = await archiver.singlefileupload(filePath);
      // urls[i] = url.secure_url;
      // console.log(url);
      urls.push(url.secure_url);
      if (i === 5) break;
      i++;
    }

    return urls;
  } catch (error) {
    return res.status(400).send({ msg: "preview problem" });
  }
};

const zipFolder = async (req, res) => {
  try {
    const urls = await forPreview(req, res);
    const result = archiver.createZipArchive(req, res);
    if (result) {
      const uploader = await archiver.uploadToCloudinary(req);
      if (uploader) {
        let new_record = {
          collectionName:req.body.collection,
          user: req.user.id,
          url: uploader.secure_url,
          preview: urls,
          file_name: uploader.original_filename,
        };

        let response_create = new Nft(new_record);
        let save_response = await response_create.save();
        console.log(save_response,"Save");
        const buildDir = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}.zip`;
        const buildDirectory = `${process.env.PWD}/build/${req.user.id}`;
        let deleteZip = await archiver.deleteFolder(buildDir);
        // let deleteDirectory=await archiver.deleteFolder(buildDirectory);
        if (save_response) {
          return res.status(200).json({ msg: "file upload",save_response });
        }
        return res.status(400).send({ msg: "error in deletion" });
      } else {
        return res.status(400).send({ msg: `file didn't upload` });
      }
    } else {
      return res.status(400).send({ msg: `there is no NFT's generated` });
    }
  } catch (error) {
    return res.status(400).send({ msg: `error in uploading` });
  }
};

const getAllLinks = async (req, res) => {
  try {
    let user = req.user.id;
    let links = await Nft.find({ user: user });
    // console.log("lonk",links)
    return res.status(200).send({ msg: "file upload", data: links || {} });
  } catch (error) {
    return res.status(400).send({ msg: `error to get all the files` });
  }
};

const getCid = async (req, res) => {
  try {
    let user = req.user.id;
    console.log("user",user)
    const getAllCid = await Cid.find({ user: user }, { user: 0 });
    return res
      .status(200)
      .send({ msg: "All deployed Cid's", data: getAllCid || {} });
  } catch (error) {
    return res
      .status(400)
      .send({ msg: `Didn't get the Cids `, error: error.message });
  }
};
const getSignature = async (req, res) => {
  try {
    return res.status(200).send(process.env.signature);
  } catch (error) {
    return res
      .status(400)
      .send({ msg: `Didn't get the Cids `, error: error.message });
  }
};
const getLayers = async (req, res) => {
  try {
    const directoryPath = path.join(`${process.env.PWD}/layers/${req.user.id}`);
    let folders = [];

    fs.readdirSync(directoryPath).map((name) => {
      folders.push(name);
      console.log(name,"folder");
    });

    return res.status(200).send(folders);
  } catch (error) {
    return res.status(400).send({ msg: `No layers `, error: error.message });
  }
};
const deleteDirectory = async (req, res) => {
  try {
    const { directory } = req.body;
    fs.rmSync(`${process.env.PWD}/layers/${req.user.id}/${directory}`, {
      recursive: true,
    });
    return res.status(200).send({ msg: `${directory} layer is deleted` });
  } catch (error) {
    return res
      .status(400)
      .send({ msg: `No such layer found `, error: error.message });
  }
};
const updatePayment = async (req, res) => {
  try {
    if (![true, false].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        msg: `Verify payment status can only be true or false`,
      });
    }
    const user = await User.updateOne(
      { _id: req.user.id },
      { collection_payment: req.body.status }
    );
    if (user) {
      return res.status(200).json({
        success: true,
        msg: `Verify payment status updated ${req.body.status}`,
      });
    }
    return res.status(400).json({
      success: false,
      msg: `Verify payment is not status updated ${req.body.status}`,
    });
  } catch (error) {
    return res
      .status(400)
      .send({ msg: `No such layer found `, error: error.message });
  }
};

const editZip=async(req,res)=>{
  let zip= await Nft.findById(req.params.id)
  try{
    if(!zip){
      res.status(200).json({message:"Not Found"})
    }
    Object.assign(zip,req.body)
    await zip.save();
    res.status(200).json({message:"Nft Updated Sucessfully"})


  }
  catch(err){
    res.status(500).send(err)
  }
}
const deleteCid=async(req,res)=>{
  let cid= await Cid.findByIdAndDelete(req.params.id)
  try{
    if(cid!=null){
      res.status(200).json({msg:"cid deleted Successfull!!!"})
    }
    else{
      res.status(200).json({msg:"cid not found"})

    }

  }
  catch(err){
    res.status(500).send(err)

  }
}
const getEthereum=async(req,res)=>{
  const data=await axios({
    method:"get",
    url:"https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
    headers: {
      "X-CMC_PRO_API_KEY": "c8c09315-8379-47dc-91c0-e33f1d598231",
    },
  })
 try{
  res.status(200).json(data.data)
 }
 catch(err){
  res.status(500).json({message:"not found"})
 }

}

module.exports = {
  uploadPics,
  uploadPicsPinata,
  createNfts,
  signup,
  editZip,
  userLogin,
  zipFolder,
  getAllLinks,
  getCid,
  walletLogin,
  getSignature,
  getLayers,
  deleteDirectory,
  walletSignup,
  updatePayment,
  deleteCid,
  getEthereum,
};
