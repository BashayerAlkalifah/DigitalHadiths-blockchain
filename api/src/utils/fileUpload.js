const multer = require('multer');
const fs = require('fs');
const ath = require('path');
const pinataSDK = require('@pinata/sdk');
require('dotenv').config();
const {PINATA_API_KEY , PINATA_SECRET_API_KEY} = process.env;
const httpStatus = require('http-status');
const config = require('../config/config');
const { getSuccessResponse } = require('./Response');
const logger = require('../logger')(module);
const path = require('path');
//npx kill-port 3000
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY);

const crypto = require('crypto');
const { Readable } = require('stream');


// 5MB Max File size allowed
const fileSizeLimit = 5 * 1024 * 1024;  // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: fileSizeLimit },  // limit file size
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf format allowed!'), false);
    }
  },
});
const imageUpload = upload.fields([{ name: 'sanad', maxCount: 1 }]);

const validate = require('../middlewares/validate')
const agreementValidation = require('../validations/agreement.validation');

exports.uploadFileToPinata = async (req, res, next) => {
  logger.info({ userInfo: req.loggerInfo, method: 'uploadFileToPinata' });
  imageUpload(req, res, async (err) => {
    if (err) {
      // Handle the error here
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
    try {
      let validation;
      if (req.route.path == '/update') {
        validation = agreementValidation.updateHadith;
      } else {
        validation = agreementValidation.addHadith;
      }
      const { value: data, error } = validation.prefs({ errors: { label: 'key' }, abortEarly: false  }).validate(req.body)
      if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return res.status(httpStatus.BAD_REQUEST).send(getSuccessResponse(httpStatus.BAD_REQUEST, errorMessage));
      }
      if (err) {
        logger.error({ userInfo: req.loggerInfo, method: 'uploadFileToPinata', error: 'Error in imageUpload : ' + err });
        if (err.message == 'Unexpected field') {
          err.message = 'Invalid number of files / Invalid key in form data';
        }
        return res.status(httpStatus.FORBIDDEN).send(getSuccessResponse(httpStatus.FORBIDDEN, err.message));
      }
      if (req.body.isUpdate && !req.files?.length) {
        next();
      } else {
        const files = req.files;
        if (!files?.sanad?.length) {
          console.log('No files selected');
          logger.error({ userInfo: req.loggerInfo, method: 'uploadFileToPinata', error: 'No files selected' });
          return res.status(httpStatus.FORBIDDEN).send(getSuccessResponse(httpStatus.FORBIDDEN, 'No files selected'));
        }
        if (req.files.sanad) {
          let fileMetadata = await uploadFile(req.files.sanad[0]);
          logger.info({ userInfo: req.loggerInfo, method: 'uploadFileToPinata', info: fileMetadata });
          req.body.fileMetadata = fileMetadata;
        }
        next();
      }
    } catch (error) {
      logger.error({ userInfo: req.loggerInfo, method: 'uploadDocument', error: error });
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send(getSuccessResponse(httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  });
};

const uploadFile = async (data) => {
  const fileData = new Readable();
  fileData.push(data.buffer);
  fileData.push(null); // indicates end of stream

  const originalFileName = data.originalname;
  
  const options = {
    pinataMetadata: {
      name: originalFileName.replace(/\.[^/.]+$/, ''),
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };
  
  const result = await pinata.pinFileToIPFS(fileData, options);
  const fileUrl = result.IpfsHash;
  
  return { name: originalFileName.replace(/\.[^/.]+$/, ''), url: fileUrl };
};



module.exports.imageUpload = imageUpload;
module.exports.uploadFile = uploadFile;