const express = require('express');
const {auth, adminAuth} = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');

const router = express.Router();

// router
// .route('/')
// // .put(adminAuth, validate(userValidation.updateUserStatus), userController.updateUserStatus)
// .get(adminAuth, validate(userValidation.getUsers), userController.getUsers);

router
.route('/:id')
.put(adminAuth, validate(userValidation.updateUserStatus), userController.updateUserStatus)

router
  .route('/')
  .post(adminAuth, validate(userValidation.createUser), userController.createUser)
  .get(adminAuth, validate(userValidation.getUsers), userController.getUsers);

module.exports = router;
