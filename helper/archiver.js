var file_system = require('fs');
const cloudinary = require('cloudinary');

const AdmZip = require('adm-zip');
const zipLocal=require('zip-local')
const zip = new AdmZip();

async function createZipArchive(req, res) {
  const outputFile = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}.zip`;
  console.log("!file_system.existsSync(outputFile)",file_system.existsSync(outputFile));
  if (!file_system.existsSync(outputFile)) {
    zipLocal.sync.zip(`${process.env.PWD}/build/${req.user.id}/${req.body.collection}`).compress().save(outputFile)
    // zip.addLocalFolder(`${process.env.PWD}/build/${req.user.id}/${req.body.collection}`);
    // zip.writeZip(outputFile);
    console.log(`Created ${outputFile} successfully`);
    return true;
  } else {
    return false;
  }
}
async function createZipArchiveForPinata(req, res) {
  const outputFile = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}.zip`;
  console.log("in zip");
  console.log(outputFile);
  if (!file_system.existsSync(outputFile)) {
    console.log("here");
    zip.addLocalFolder(`${process.env.PWD}/build/${req.user.id}/${req.body.collection}`);
    zip.writeZip(outputFile);
    console.log(zip);

    console.log(`Created ${outputFile} successfully`);
    return true;
  } else {
    return false;
  }
}
async function singlefileupload(file) {
  console.log("ffffff",file);
  try {
    await cloudinary.config({
      cloud_name: process.env.cloudinaryName,
      api_key: process.env.cloudinaryAPI,
      api_secret: process.env.cloudinarySecret,
    });
    const response = await cloudinary.v2.uploader.upload(
      file,
      // { resource_type: "raw" },
      function (error, result) {
        if (error) {
          console.log(error);
          return error;
        }

        return result;
      }
    );

    return response;
  } catch (error) {
    return error;
  }
}

async function uploadToCloudinary(req) {
  try {
    await cloudinary.config({
      cloud_name: process.env.cloudinaryName,
      api_key: process.env.cloudinaryAPI,
      api_secret: process.env.cloudinarySecret,
    });

    const pathZip = `${process.env.PWD}/build/${req.user.id}/${req.body.collection}.zip`;
    const response = await cloudinary.v2.uploader.upload(
      pathZip,
      { resource_type: "raw" },
      function (error, result) {
        if (error) {
          console.log(error);
          return error;
        }
        console.log("whatthe",result);
        return result;
      }
    );

    console.log("ewsponse",response);
    return response;
  } catch (error) {
    console.log(error);
    return false;
  }
}

const deleteFolder = async (buildDir) => {
  try {
    // const deleteFolder = `${process.env.PWD}/build/${req.user.id}.zip`;
    file_system.rmSync(buildDir, { recursive: true });
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createZipArchive,
  uploadToCloudinary,
  deleteFolder,
  createZipArchiveForPinata,
  singlefileupload,
};
