const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, agreementService } = require('../services');
const { getPagination } = require('../utils/pagination');
const { getSuccessResponse } = require('../utils/Response');

const addHadith = catchAsync(async (req, res) => {
  const { user: loggerUser } = req.loggerInfo;
  const fileMetadata = req.body.fileMetadata;
    // Check if the user is a scholar
  if (loggerUser.registrationType != 'scholar' && loggerUser.registrationType != 'StudentOfHadith') {
    return res.status(403).send({ error: 'أنت غير مصرح لك بتنفيذ هذه العملية.' });
  }
    const result = await agreementService.addHadith(req.body, fileMetadata, loggerUser);
    res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'تم إضافة الحديث بنجاح', result));
  
});

const updateHadith = catchAsync(async (req, res) => {
  const { user } = req.loggerInfo;
  console.log('user', user);
  const fileMetadata = req.body.fileMetadata;
  // Check if the user is a scholar
  if (user.registrationType !='scholar') {
    return res.status(403).send({ error: 'يمكن فقط للعلماء طلب تحديث الحديث' });
  }

  const result = await agreementService.updateHadith(req.body, fileMetadata, user);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'تم ارسال طلب تحديث الحديث بنجاح', result));
});


const approveAndRejectHadith = catchAsync(async (req, res) => {
  const { user: loggerUser } = req.loggerInfo;

  // Check if the user is a scholar
  if (loggerUser.registrationType != 'scholar') {
    return res.status(403).send({ error: 'يمكن فقط للعلماء الموافقة أو الرفض على الحديث.' });
  }

  let status = req.body;
  let hadithId = req.params.id;
  const result = await agreementService.approveAndRejectHadith(status, hadithId, loggerUser);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'تم تقديم الموافقة بنجاح', result));
});


const approveAndRejectHadithForUpdateHadith = catchAsync(async (req, res) => {
  const { user: loggerUser } = req.loggerInfo;

  // Check if the user is a scholar
  if (loggerUser.registrationType != 'scholar') {
      return res.status(403).send({ error: 'يمكن فقط للعلماء القيام بذلك' });
  }
  let status = req.body;
  let hadithId = req.params.id;
  const result = await agreementService.approveAndRejectHadithForUpdateHadith(status, hadithId, loggerUser);
  res.status(httpStatus.CREATED).send(getSuccessResponse(httpStatus.CREATED, 'تم تقديم الموافقة بنجاح', result));
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
  // if (data?.data) {
  //   data.data = data.data.map((elm) => elm.Record);
  // }
  if (data?.data) {
    data.data = data.data.map((elm) => {
      // Ensure that elm.Record is not undefined and is properly formatted
      if (elm.Record) {
        return { ...elm, record: elm.Record };
      }
      return elm;
    });
  }

  // Debugging: Print the full data object to ensure correct formatting
  console.log('Formatted Data:', JSON.stringify(data, null, 2));

  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, '', data));
});

const getHistoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { user } = req.loggerInfo;
  const data = await agreementService.queryHistoryById(id, user);
  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'تم جلب تاريخ الحديث بنجاح', data));
});

const getApprovalsByHadithId = catchAsync(async (req, res) => {
  try {
    const hadithId = req.params.id;
    const { user } = req.loggerInfo;

    // Query approvals by Hadith ID
    let responseData = await agreementService.queryApprovalsByHadithId(hadithId, user);
    // Map the data to extract the Record property
    // let data = responseData.data.map((elm) => elm.Record);

      let data = responseData.data?.map(elm => ({
        CreateAt: elm.CreateAt,
        CreateBy: elm.CreateBy,
        OrgId: elm.OrgId,
        RegistrationType: elm.RegistrationType,
        Status: elm.Status,
      })) || []
  
    // Check if data is an array and has elements
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'لم يتم العثور على موافقات لهذا المعرف الخاص بالحديث' });
    }

    // Send the successful response
    res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'تم جلب الموافقات او الرفض بنجاح ', { approvals: data }));
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'حدث خطأ أثناء جلب الموافقات' });
  }
});

const getHadithById = catchAsync(async (req, res) => {
  const { id } = req.params;

  let { user } = req.loggerInfo;
  let data = await agreementService.queryHadithById(id, user);  
  if (data && data.approvals) {
    data.approvals = data.approvals.filter(approval => !approval.Hadith);
  }

  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'تم جلب الحديث بنجاح', data));
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'المستخدم غير موجود');
  }
  res.status(httpStatus.OK).send(getSuccessResponse(httpStatus.OK, 'تم جلب المستخدم بنجاح', user));
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
