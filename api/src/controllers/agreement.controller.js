const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, agreementService } = require('../services');
const { getPagination } = require('../utils/pagination');
const { getSuccessResponse } = require('../utils/Response');

const addHadith = catchAsync(async (req, res) => {
  const { user } = req.loggerInfo;
  const fileMetadata = req.body.fileMetadata;
    const result = await agreementService.addHadith(req.body, fileMetadata, user);
    res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'Hadith created successfully', result));
  
});

const updateHadith = catchAsync(async (req, res) => {
  const { user } = req.loggerInfo;
  console.log('user', user);
  const fileMetadata = req.body.fileMetadata;
  // Check if the user is a scholar
  if (user.registrationType !='scholar') {
    return res.status(403).send({ error: 'Only scholars can update Hadith' });
  }

  const result = await agreementService.updateHadith(req.body, fileMetadata, user);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'Hadith created successfully', result));
});


const approveAndRejectHadith = catchAsync(async (req, res) => {
  const { user: loggerUser } = req.loggerInfo;

  // Check if the user is a scholar
  if (loggerUser.registrationType != 'scholar') {
      return res.status(403).send({ error: 'Only scholars can approve Hadith' });
  }

  let status = req.body;
  let hadithId = req.params.id;
  const result = await agreementService.approveAndRejectHadith(status, hadithId, loggerUser);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'approval submitted successfully', result));
});


const approveAndRejectHadithForUpdateHadith = catchAsync(async (req, res) => {
  const { user: loggerUser } = req.loggerInfo;

  // Check if the user is a scholar
  if (loggerUser.registrationType != 'scholar') {
      return res.status(403).send({ error: 'Only scholars can approve Hadith' });
  }
  let status = req.body;
  let hadithId = req.params.id;
  const result = await agreementService.approveAndRejectHadithForUpdateHadith(status, hadithId, loggerUser);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'approval submitted successfully', result));
});


const getAllHadiths = catchAsync(async (req, res) => {
  const { pageSize, bookmark, filterType } = req.query;

  let { orgId, email } = req.loggerInfo.user;
  let orgName = `org${orgId}`;

  let filter = {
    orgId: parseInt(req.loggerInfo.user.orgId),
    pageSize: pageSize || 10,
    bookmark: bookmark || '',
    orgName,
    email,
    filterType,
  };

  console.log(filter);

  let data = await agreementService.queryAgreements(filter);
  if (data?.data) {
    data.data = data.data.map((elm) => elm.Record);
  }

  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'Users fetched successfully', data));
});

const getHistoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { user } = req.loggerInfo;
  const data = await agreementService.queryHistoryById(id, user);
  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'Hadith history fetched successfully', data));
});

const getApprovalsByHadithId = catchAsync(async (req, res) => {
  try {
    const hadithId = req.params.id;
    const { user } = req.loggerInfo;

    // Query approvals by Hadith ID
    let responseData = await agreementService.queryApprovalsByHadithId(hadithId, user);
    // Map the data to extract the Record property
    let data = responseData.data.map((elm) => elm.Record);

    // Check if data is an array and has elements
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'No approvals found for this Hadith ID' });
    }

    // Send the successful response
    res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'Users fetched successfully', { approvals: data }));
  } catch (error) {
    console.error('Error in getApprovalsByHadithId:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while fetching approvals' });
  }
});

const getHadithById = catchAsync(async (req, res) => {
  const { id } = req.params;

  let { user } = req.loggerInfo;
  let data = await agreementService.queryHadithById(id, user);  
  if (data && data.approvals) {
    data.approvals = data.approvals.filter(approval => !approval.Hadith);
  }

  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'Hadith fetched successfully', data));
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'User fetched successfully', user));
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  addHadith,
  updateHadith,
  approveAndRejectHadithForUpdateHadith,
  getAllHadiths,
  getUser,
  updateUser,
  deleteUser,
  getHadithById,
  approveAndRejectHadith,
  getApprovalsByHadithId,
  getHistoryById,

};
