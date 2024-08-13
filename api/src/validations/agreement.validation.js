const Joi = require('joi');
const { REGISTRATION_TYPE, APPROVAL_STATUS } = require('../utils/Constants');
const { password } = require('./custom.validation');

const addHadith = Joi.object().keys({
    Hadith: Joi.string().required(),
    TheFirstNarrator: Joi.string().required(),
    ReportedBy: Joi.string().required(),
    RulingOfTheReported: Joi.string().required(),
    Source: Joi.string().required(),
    PageOrNumber: Joi.string().required()
  })

  const updateHadith = Joi.object().keys({
    id: Joi.string().required(),
    Hadith: Joi.string().required(),
    TheFirstNarrator: Joi.string().required(),
    ReportedBy: Joi.string().required(),
    RulingOfTheReported: Joi.string().required(),
    Source: Joi.string().required(),
    PageOrNumber: Joi.string().required(),
    description: Joi.string().required()
  })

const approveHadith = {
  body: Joi.object().keys({
    status: Joi.string().required().valid(APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED)
  }),
};

const getHadithById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
}



const getHadithApprovals = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};


module.exports = {
  addHadith,
  updateHadith,
  approveHadith,
  getHadithApprovals,
  getHadithById,
  

};
