const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { Gateway, Wallets } = require('fabric-network');
const crypto = require('crypto');

const { getContractObject, getWalletPath, getCCP, getAgreementsWithPagination } = require('../utils/blockchainUtils');
const {
  NETWORK_ARTIFACTS_DEFAULT,
  BLOCKCHAIN_DOC_TYPE,
  AGREEMENT_STATUS,
  FILTER_TYPE,
} = require('../utils/Constants');
const { getUUID } = require('../utils/uuid');
const { getSignedUrl } = require('../utils/fileUpload');
const { log } = require('winston');
const { hash } = require('bcryptjs');
const THIRTY_DAYS = 2592000000;

// If we are sure that max records are limited, we can use any max number
const DEFAULT_MAX_RECORDS = 100
const utf8Decoder = new TextDecoder();


/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<Agreement>}
 */

const addHadith = async (hadithData, fileMetadata, user) => {
  let gateway;
  let client;
  const dateTime = new Date();


  try {
    const orgName = `org${user.orgId}`;
    const hashInput = hadithData.Hadith + hadithData.TheFirstNarrator + hadithData.ReportedBy + hadithData.Source;
    const id = crypto.createHash('sha256').update(hashInput).digest('hex');
    const data = {
      hadithId: id,
      Hadith: hadithData.Hadith,
      TheFirstNarrator: hadithData.TheFirstNarrator,
      ReportedBy: hadithData.ReportedBy,
      RulingOfTheReported: hadithData.RulingOfTheReported,
      Source: [hadithData.Source],
      PageOrNumber: hadithData.PageOrNumber,
      orgId: parseInt(user.orgId),
      registrationType: user.registrationType,
      hadithStatus: AGREEMENT_STATUS.INPROGRESS,
      createBy: user.email,
      createAt: dateTime,
      document: { ...fileMetadata }
    };
    console.error(`data: ${JSON.stringify(data)}`);

    const contract = await getContractObject(
      orgName,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );

    await contract.submitTransaction('AddHadith', JSON.stringify(data));
    return data;
  } catch (error) {
    const errorMessage = error.message || 'Unknown error occurred';
    const detailedMessage = (error.details && error.details.length > 0)
      ? error.details[0].message.replace(/chaincode response 500,/i, '').trim()
      : 'No additional details';
    console.error(`Error adding Hadith: ${errorMessage}, Details: ${detailedMessage}`);
    throw new Error(`Error adding Hadith: ${detailedMessage}`);
  } finally {
    if (gateway) gateway.close();
    if (client) client.close();
  }
};


const updateHadith = async (hadithData, fileMetadata, user) => {
  let gateway;
  let client;
  const dateTime = new Date();
  try {
    const orgName = `org${user.orgId}`;
    const hashInput = hadithData.Hadith + hadithData.TheFirstNarrator + hadithData.ReportedBy + hadithData.Source;
    const id = crypto.createHash('sha256').update(hashInput).digest('hex');
    const data = {
      hadithId: id,
      previousHadithId: hadithData.id,
      Hadith: hadithData.Hadith,
      TheFirstNarrator: hadithData.TheFirstNarrator,
      ReportedBy: hadithData.ReportedBy,
      RulingOfTheReported: hadithData.RulingOfTheReported,
      Source: [hadithData.Source],
      PageOrNumber: hadithData.PageOrNumber,
      orgId: parseInt(user.orgId),
      registrationType: user.registrationType,
      hadithStatus: AGREEMENT_STATUS.UPDATE,
      createBy: user.email,
      createAt: dateTime,
      description: hadithData.description,
      document: { ...fileMetadata }
    };

    const contract = await getContractObject(
      orgName,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );

    await contract.submitTransaction('updateHadith', JSON.stringify(data));
    return data;
  } catch (error) {
    const errorMessage = error.message || 'Unknown error occurred';
    const detailedMessage = (error.details && error.details.length > 0)
      ? error.details[0].message.replace(/chaincode response 500,/i, '').trim()
      : 'No additional details';
    console.error(`Error updating Hadith: ${errorMessage}, Details: ${detailedMessage}`);
    throw new Error(`Error updating Hadith: ${detailedMessage}`);
  } finally {
    if (gateway) gateway.close();
    if (client) client.close();
  }
}

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<Agreement>}
 */


const approveAndRejectHadith = async (status, hadithId, user) => {
  let gateway;
  let client;

  if (status.status == 'rejected') {
    return rejectHadith(hadithId, user);
  }

  try {
    // Retrieve contract object
    const contract = await getContractObject(
      `org${user.orgId}`,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );
    // JSON.stringify(hadithId)
    // Validate approvals and get Hadith status
    const hadithStatusBuffer = await contract.evaluateTransaction('validateApprovals', hadithId, JSON.stringify(user));
    const hadithStatusAscii = hadithStatusBuffer.toString();
    const hadithStatus = hadithStatusAscii.split(',').map(Number).map(charCode => String.fromCharCode(charCode)).join('');
    const dateTime = new Date();

    // Prepare data for the transaction
    const data = {
      id: getUUID(),
      hadithId: hadithId,
      status: status,
      hadithStatus: hadithStatus,
      createBy: user.email,
      createAt: dateTime,
      orgId: parseInt(user.orgId),
      registrationType: user.registrationType,
    };

    // Submit transaction
    const result = await contract.submitTransaction('approveHadith', JSON.stringify(data));
    return { txid: utf8Decoder.decode(result) };

  } catch (error) {
     // Extract and log detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    let detailedMessage = 'No additional details';
    if (error.details && error.details.length > 0) {
      detailedMessage = error.details[0].message;
    }
    // Remove "chaincode response 500," from the error message
      detailedMessage = detailedMessage.replace(/chaincode response 500,/i, '').trim();
      console.error(`Error approving Hadith: ${errorMessage}, Details: ${detailedMessage}`);
    throw new Error(`Error approving Hadith:, Details: ${detailedMessage}`);
  } finally {
    // Close resources
    if (gateway) {
      gateway.close();
    }
    if (client) {
      client.close();
    }
  }
};



const rejectHadith = async (hadithId, user) => {
  let gateway;
  let client;

  try {
    // Retrieve contract object
    const contract = await getContractObject(
      `org${user.orgId}`,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );
    
    // JSON.stringify(hadithId)
   // JSON.stringify(user.email), JSON.stringify("true")
    // Submit transaction to delete Hadith
    await contract.submitTransaction('deleteHadith',hadithId, user.email, "true");
    return { message: 'This Hadith has been rejected by a scholar. It has been removed from the blockchain.' };

  } catch (error) {
    // Extract and log detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    let detailedMessage = 'No additional details';
    if (error.details && error.details.length > 0) {
      detailedMessage = error.details[0].message;
    }
    // Remove "chaincode response 500," from the error message
      detailedMessage = detailedMessage.replace(/chaincode response 500,/i, '').trim();
      console.error(`Error rejecting Hadith: ${errorMessage}, Details: ${detailedMessage}`);
      throw new Error(`Error rejecting Hadith:, Details: ${detailedMessage}`);
  } finally {
    // Close resources
    if (gateway) {
      gateway.close();
    }
    if (client) {
      client.close();
    }
  }
};


const approveAndRejectHadithForUpdateHadith = async (status, hadithId, user) => {
  let gateway;
  let client;

  try {
    // Retrieve contract object
    const contract = await getContractObject(
      `org${user.orgId}`,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );

    // Validate approvals and get Hadith status
    const hadithStatusBuffer = await contract.evaluateTransaction('validateHadithUpdateApprovalAndRejection', hadithId, JSON.stringify(status),JSON.stringify(user));
    const hadithStatusAscii = hadithStatusBuffer.toString();
    const hadithStatus = hadithStatusAscii.split(',').map(Number).map(charCode => String.fromCharCode(charCode)).join('');
    const dateTime = new Date();
    console.log("hadithStatus" , hadithStatus)

    // Prepare data for the transaction
    const data = {
      id: getUUID(),
      hadithId: hadithId,
      status: status,
      hadithStatus: hadithStatus,
      createBy: user.email,
      createAt: dateTime,
      orgId: parseInt(user.orgId),
      registrationType: user.registrationType,
    };

    // Submit transaction
    const result = await contract.submitTransaction('approveAndRejectForUpdateHadith', JSON.stringify(data));
    return { txid: utf8Decoder.decode(result) };

  } catch (error) {
     // Extract and log detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    let detailedMessage = 'No additional details';
    if (error.details && error.details.length > 0) {
      detailedMessage = error.details[0].message;
    }
    // Remove "chaincode response 500," from the error message
      detailedMessage = detailedMessage.replace(/chaincode response 500,/i, '').trim();
      console.error(`Error approving Hadith: ${errorMessage}, Details: ${detailedMessage}`);
    throw new Error(`Error approving Hadith:, Details: ${detailedMessage}`);
  } finally {
    // Close resources
    if (gateway) {
      gateway.close();
    }
    if (client) {
      client.close();
    }
  }
};
/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAgreements = async (filter) => {
  try {
    let query;
    if (filter?.filterType) {
      switch (filter.filterType) {
        case FILTER_TYPE.ALL:
          query = `{\"selector\":{}}`;
          break;
        case FILTER_TYPE.ACTIVE:
        case FILTER_TYPE.INPROGRESS:
        case FILTER_TYPE.UPDATE:
          query = `{\"selector\":{\"Hadith\": {\"$exists\": true}, \"hadithStatus\":\"${filter.filterType}\"}}`;
          break;
        default:
          query = `{\"selector\":{}}`;
          break;
      }
    } else {
      query = `{\"selector\":{}}`;
    }
    console.log('query--------------', query);
    let data = await getAgreementsWithPagination(
      query,
      filter.pageSize,
      filter.bookmark,
      filter.orgName,
      filter.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME
    );
    
    return data;
  } catch (error) {
    console.log('error--------------', error);

  }
};



/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryApprovalsByHadithId = async (hadithId, user) => {
  let gateway;
  let client;
  try {
    // Retrieve contract object
    const contract = await getContractObject(
      `org${user.orgId}`,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );
    // Submit transaction to queryApprovalsByHadithId
    let data = await contract.submitTransaction('queryApprovalsByHadithId', hadithId);

    // Convert Uint8Array to string and parse as JSON
      data = JSON.parse(new TextDecoder('utf8').decode(data));
      console.warn(`Error querying approvals by Hadith ID: ${data}`);

    // Remove Hadith details from each approval
    data = data.map(approval => {
      if (approval && approval.Record) {
        const {
          Hadith,
          PageOrNumber,
          ReportedBy,
          RulingOfTheReported,
          Source,
          TheFirstNarrator,
          document,
          hadithStatus,
          ...filteredRecord
        } = approval.Record;


        return { ...approval, Record: filteredRecord };
      
      }
      console.warn('Approval or Record is undefined:', approval);
      return approval; // In case approval or Record is undefined, return as is
    });

    return { data };
  } catch (error) {
    console.error(`Error querying approvals by Hadith ID: ${error.message}`);
    throw new Error('Failed to query approvals');
  } finally {
    if (gateway) {
      gateway.close();
    }
    if (client) {
      client.close();
    }
  }
};


const queryHistoryById = async (id, user) => {
  let gateway;
  let client
  try {
    let orgName = `org${user.orgId}`;
    const contract = await getContractObject(
      orgName,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );
    // let result = await contract.submitTransaction('getHadithHistory', id);
    // result = JSON.parse(utf8Decoder.decode(result));
    // console.log("result" , result)

    // return {
    //   hadithHistory: result.results?.map(elm => ({
    //     txId: elm.TxId,
    //     Action: elm.Action,
    //     timeStamp: elm.Timestamp ? new Date(elm.Timestamp).getTime() : null,
    //     DeletedBy: elm.DeletedBy,
    //     ...elm.Value,
    //   })) || [],
    //   approvals: result.approvalResults?.map(elm => ({
    //     ...elm.Record,
    //     key: elm.Key,
    //   })) || []
    // };
    let result = await contract.submitTransaction('getHadithHistory', id);
    result = JSON.parse(utf8Decoder.decode(result));
    console.log("result" , result)
    return {
      hadithHistory: result.results?.map(elm => ({
        txId: elm.TxId,
        Action: elm.Action,
        timeStamp: elm.Timestamp ? new Date(elm.Timestamp).getTime() : null,
        DeletedBy: elm.DeletedBy,
        ...elm.Value,
      })) || [],
      approvals: result.approvalResults?.map(elm => ({
        CreateAt: elm.CreateAt,
        CreateBy: elm.CreateBy,
        HadithId: elm.HadithId,
        OrgId: elm.OrgId,
        RegistrationType: elm.RegistrationType,
        Status: elm.Status,
      })) || []
    };
  } catch (error) {
    console.log(error);
  } finally {
    gateway && gateway.close();
    client && client.close();
  }
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const queryHadithById = async (id, user) => {
  let gateway;
  let client;
  try {
    let orgName = `org${user.orgId}`;

    const contract = await getContractObject(
      orgName,
      user.email,
      NETWORK_ARTIFACTS_DEFAULT.CHANNEL_NAME,
      NETWORK_ARTIFACTS_DEFAULT.CHAINCODE_NAME,
      gateway,
      client
    );
    let result = await contract.submitTransaction('getHadithByID', id);
      
    // Decode the Uint8Array into a string
    result = JSON.parse(utf8Decoder.decode(result));
    // let approvals = await queryApprovalsByHadithId(id , user)
    // result.approvals = approvals?.data?.map(elm => elm.Record) || []
    
    let approvals = await queryApprovalsByHadithId(id, user);
    // Safely map `approvals.data` to get records
    console.warn('approvals:', approvals);

    // let approvalsRecords = approvals.data.map(elm => elm.Record).filter(record => record !== undefined);
    // console.warn('approvalsRecords:', approvalsRecords);
   // Safely map `approvals.data` to get only defined records

// Map the `approvals.data` to the desired format, and include only records with non-empty CreateAt and HadithId

 return {
  hadithDetails: {
    hadithId: result.hadithId,
    Hadith: result.Hadith,
    TheFirstNarrator: result.TheFirstNarrator,
    ReportedBy: result.ReportedBy,
    RulingOfTheReported: result.RulingOfTheReported,
    PageOrNumber: result.PageOrNumber,
    orgId: result.orgId,
    registrationType: result.registrationType,
    hadithStatus: result.hadithStatus,
    createBy: result.createBy,
    createAt: result.createAt,
    previousHadithId: result.previousHadithId
  },
  approvals: approvals.data?.map(elm => ({
    CreateAt: elm.CreateAt,
    CreateBy: elm.CreateBy,
    HadithId: elm.HadithId,
    OrgId: elm.OrgId,
    RegistrationType: elm.RegistrationType,
    Status: elm.Status,
  })) || []
  };
    // Add the results to approvals
    // result.approvals = approvalsRecords;
    // return result;
  
  } catch (error) {
    // Extract and log detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    let detailedMessage = 'No additional details';
    if (error.details && error.details.length > 0) {
      detailedMessage = error.details[0].message;
    }
    // Remove "chaincode response 500," from the error message
      detailedMessage = detailedMessage.replace(/chaincode response 500,/i, '').trim();
      console.error(` ${errorMessage}, Details: ${detailedMessage}`);
    throw new Error(`Details: ${detailedMessage}`);
  } finally {
    if (gateway) {
      gateway.close();
    }
    if(client){
      client.close()
    }
  }
};


/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  addHadith,
  updateHadith,
  approveAndRejectHadithForUpdateHadith,
  queryAgreements,
  queryHadithById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  approveAndRejectHadith,
  queryApprovalsByHadithId,
  queryHistoryById,
};
