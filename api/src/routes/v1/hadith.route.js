const express = require('express');
const {auth, adminAuth} = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const hadithValidation = require('../../validations/agreement.validation')
const hadithController = require('../../controllers/agreement.controller');
const { uploadFileToPinata } = require('../../utils/fileUpload');

const router = express.Router();

router
  .route('/:id')
  .get(auth, validate(hadithValidation.getHadithById), hadithController.getHadithById); 

router
  .route('/approvals/:id')
  .post(auth, validate(hadithValidation.approveHadith), hadithController.approveAndRejectHadith)
  .get(auth, validate(hadithValidation.getHadithApprovals), hadithController.getApprovalsByHadithId);
router
  .route('/history/:id')
  .get(auth, validate(hadithValidation.getHadithApprovals), hadithController.getHistoryById);
  
router
  .route('/update')
  .post(auth, uploadFileToPinata, validate(hadithValidation.updateHadith), hadithController.updateHadith)  
router
  .route('/update/approvals/:id')
  .post(auth, validate(hadithValidation.approveHadith), hadithController.approveAndRejectHadithForUpdateHadith)

router
  .route('/')
  .post(auth, uploadFileToPinata,validate(hadithValidation.addHadith), hadithController.addHadith )
  .get(auth, hadithController.getAllHadiths);


module.exports = router;
