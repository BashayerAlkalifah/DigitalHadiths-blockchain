"use strict";

const { Contract, Transaction } = require("fabric-contract-api");
const ClientIdentity = require('fabric-shim').ClientIdentity;
// const { getDataForQuery } = require('fabric-shim');
// const utf8Decoder = new TextDecoder();
// const AGREEMENT_STATUS = {
//   ACTIVE: 'active',
//   REJECTED: 'rejected',
//   INPROGRESS: 'inprogress'
// };


class HadithContract extends Contract {
  
  async AddHadith(ctx, hadithData) {
    try {
      const hadith = JSON.parse(hadithData);
      // const exists = await this.HadithExists(ctx, hadith.hadithId);

      // if (exists) {
      //   throw new Error(`Hadith with ID ${hadith.hadithId} already exists`);
      // }

      await ctx.stub.putState(hadith.hadithId, hadithData);
      return ctx.stub.getTxID();
    } catch (error) {
      throw new Error(`Failed to add Hadith: ${error.message}`);
    }
  }
  // updateHadith updates an existing Hadith in the world state with provided parameters.
  // async updateHadith(ctx, hadithData) {
  //   try {
  //     const hadith = JSON.parse(hadithData);
  //     const exists = await this.HadithExists(ctx, hadith.hadithId);
  //     if (exists) {
  //       throw new Error(`Hadith with ID ${hadith.hadithId} already exists`);
  //     }
  //     const previousHadit = await this.getHadithByID(ctx, hadith.previousHadithId);
  //     if (previousHadit.hadithStatus == 'inprogress') {
  //       throw new Error(`Hadith with ID ${hadith.previousHadithId} is in progress`);
  //     }

  //     await ctx.stub.putState(hadith.hadithId, hadithData);
  //     return ctx.stub.getTxID();
  //   } catch (error) {
  //     throw new Error(`Failed to update Hadith: ${error.message}`);

  //   }}

  // async HadithExists(ctx, id) {
  //   try {
  //     const hadithJSON = await ctx.stub.getState(id);
  //     return hadithJSON && hadithJSON.length > 0;
  //   } catch (error) {
  //       throw new Error(`Failed to check Hadith existence: ${error.message}`);
  //     }
  //   }

  // async getHadithByID(ctx, hadithId) {
  //     try {
  //       const hadithJSON = await ctx.stub.getState(hadithId);
  //       if (!hadithJSON || hadithJSON.length === 0) {
  //         throw new Error(`Hadith with ID ${hadithId} does not exist`);
  //       }
  //       const hadith = JSON.parse(hadithJSON.toString());
  //       return hadith;
  //     } catch (error) {
  //       throw new Error(`Failed to get Hadith: ${error.message}`);
  //     }
  //     }
  
  // async deleteHadith(ctx, id, deletedBy , active = "true") {
  //       try {
  //         const hadithId = JSON.parse(id);
  //         const Hadith = await this.getHadithByID(ctx, hadithId);  
  //         if (Hadith.previousHadithId && active == "true" ) {
  //           throw new Error(`Operation failed: This operation is reserved for rejecting new Hadith submissions. If you aim to reject an update to an existing Hadith, please use the specific function designed for that purpose.`);

  //         } else if (Hadith.hadithStatus == 'active' && active == "true" ) {
  //           throw new Error(`Operation failed: The Hadith is already active. You can search for other Hadiths to approve.`);
  //         }
        
  //         // Store deletion metadata under a separate key
  //         const deleteMetadata = {
  //           hadithId: hadithId,
  //           deletedBy: deletedBy,
  //         };
  //         console.log("deleteMetadata",deleteMetadata)
  //         await ctx.stub.putState(`delete_${hadithId}`, JSON.stringify(deleteMetadata));
      
  //         // Delete Hadith
  //         await ctx.stub.deleteState(hadithId);
      
  //         // Delete associated approvals
  //         const approvals = await this.queryApprovalsByHadithId(ctx, hadithId);
  //         for (const approval of approvals) {
  //           await ctx.stub.deleteState(approval.Key);
  //         }
      
  //         return `Hadith ${hadithId} and its approvals have been deleted successfully.`;
  //       } catch (error) {
  //         throw new Error(`Failed to delete Hadith: ${error.message}`);
  //       }
  //     }


  // // async queryHadiths(ctx, queryString) {
  // //   try {
  // //     const iterator = await ctx.stub.getQueryResult(queryString);
  // //     return await this.getAllResults(iterator, false);
  // //   } catch (error) {
  // //     throw new Error(`Failed to query Hadiths: ${error.message}`);
  // //   }
  // // }


  // async approveHadith(ctx, hadithData){
  //   try {
  //     let hadith = JSON.parse(hadithData)
  //     const hadithId = hadith.hadithId;
      
  //    if (hadith.hadithStatus == "active"){
  //     // Retrieve the Hadith to update its status
  //     const hadithBuffer = await ctx.stub.getState(hadithId);

  //     const existingHadith = JSON.parse(hadithBuffer.toString());

  //     // Update the Hadith status
  //     existingHadith.hadithStatus = hadith.hadithStatus;

  //     // Store the updated Hadith
  //     await ctx.stub.putState(hadithId, JSON.stringify(existingHadith));
  //    }
  //     // Delete hadithStatus from hadith
  //     delete hadith.hadithStatus;

  //     await ctx.stub.putState(hadith.id, JSON.stringify(hadith))
  //     return ctx.stub.getTxID();
      
  //   } catch (error) {
  //     throw new Error(error.message);
  //   } 
  // }

  // async validateApprovals(ctx, hadithId, userStr) {
  //   try {
  //     const Hadith = await this.getHadithByID(ctx, hadithId);
  //     if (Hadith.previousHadithId) {
  //       throw new Error(`Operation failed: This operation is intended for approving new Hadith submissions only. If you are trying to approve an update to an existing Hadith, please use the appropriate function for approving updated Hadith.`);
  //     } else if (Hadith.hadithStatus == 'active') {
  //       throw new Error(`Operation failed: The Hadith is already active. You can search for other Hadiths to approve.`);
  //     }
  
  //     const user = JSON.parse(userStr);
  //     const queryString = `{"selector":{"hadithId":"${hadithId}"}}`;
  //     const iterator = await ctx.stub.getQueryResult(queryString);

  //     let scholarCount = 0;
 

  //     let result = await iterator.next();
  //     console.log("result", result)
  //     while (!result.done) {
  //       const approval = JSON.parse(result.value.value.toString('utf8'));

  //       if (approval.registrationType == user.registrationType && approval.orgId == user.orgId) {
  //         const errorMessage = `This Hadith has already been marked as approved by your institution. You can search for other Hadiths to approve.`;
  //         throw new Error(errorMessage);
  //       }

  //       if (approval.registrationType == "scholar") {
  //         scholarCount++;
  //       }

  //       result = await iterator.next();
  //     }

  //     if (scholarCount > 0) {
  //       return AGREEMENT_STATUS.ACTIVE;
  //     }

  //     return AGREEMENT_STATUS.INPROGRESS;
  //   } catch (error) {
  //     throw new Error(error.message);
  //   }
  // }


  // async approveAndRejectForUpdateHadith(ctx, hadithData) {
  //   try {
  //     const hadith = JSON.parse(hadithData);
  //     const { hadithId, hadithStatus, id, createBy } = hadith;
  
  //     if (hadithStatus == "rejected") {
  //       // Delete the hadith directly if it is rejected
  //       await this.deleteHadith(ctx, JSON.stringify(hadithId), JSON.stringify(createBy), JSON.stringify("false"));
  //       return ctx.stub.getTxID();
  //     }
  
  //     if (hadithStatus == "active") {
  //       // Retrieve the Hadith to update its status
  //       const hadithBuffer = await ctx.stub.getState(hadithId);
  //       const existingHadith = JSON.parse(hadithBuffer.toString());
  
  //       // Update the Hadith status
  //       existingHadith.hadithStatus = hadithStatus;
  
  //       // Store the updated Hadith
  //       await ctx.stub.putState(hadithId, JSON.stringify(existingHadith));
  
  //       // Delete the previous Hadith if exists
       
  //       await this.deleteHadith(ctx, JSON.stringify(existingHadith.previousHadithId), JSON.stringify(existingHadith.createBy), JSON.stringify("false"));
        
  //     }
  
  //     // Delete hadithStatus from hadith before storing approval/rejection record
  //     delete hadith.hadithStatus;
  
  //     // Store the approval/rejection record
  //     await ctx.stub.putState(id, JSON.stringify(hadith));
  //     return ctx.stub.getTxID();
  
  //   } catch (error) {
  //     throw new Error(`Failed to approve/update Hadith: ${error.message}`);
  //   }
  // }

  // async validateHadithUpdateApprovalAndRejection(ctx, hadithId, status, userStr) {
  //   try {
  //     const Hadith = await this.getHadithByID(ctx, hadithId);
  //     if (!Hadith.previousHadithId) {
  //       throw new Error(`Operation failed: This operation is intended for updates to an existing Hadith. Please ensure you are using the correct function designed for updating Hadith entries.`);
  //     } else if (Hadith.hadithStatus == 'active') {
  //       throw new Error(`Operation failed: The Hadith is already active. You can search for other Hadiths to approve.`);
  //     }
  //     // Parse user and status once
  //     const user = JSON.parse(userStr);
  //     status = JSON.parse(status);
  
  //     const { email, orgId: userOrgId } = user;
  //     const userStatus = status.status;
  
  //     // Query all related Hadith approvals
  //     const queryString = `{"selector":{"hadithId":"${hadithId}"}}`;
  //     const iterator = await ctx.stub.getQueryResult(queryString);
  

      
  //     let approvalCount = userStatus == 'approved' ? 1 : 0;
  //     let rejectionCount = userStatus == 'rejected' ? 1 : 0;
  
  //     while (true) {
  //       const result = await iterator.next();
  //       if (result.done) break;

  //       const approval = JSON.parse(result.value.value.toString('utf8'));
  //       const { orgId, createBy, status: approvalStatus } = approval;
  
  //       // Check if the user has already reviewed the Hadith
  //       if (createBy == email) {
  //         throw new Error(`This Hadith has already been marked as approved or rejected by you. You cannot review it again.`);
  //       }
  //       if (approvalStatus) {
  //       // Check if the operation is within the same organization
  //        if (orgId == userOrgId) {
  //           // If the Hadith has already been approved by scholar from the same organization
  //         if (approvalStatus.status == 'approved' && userStatus == 'approved') {
  //           throw new Error(`A scholar from your organization has already approved this Hadith. You cannot approve it again.`);
  //         } 
  //         // If the Hadith has already been rejected by scholar from the same organization
  //         else if (approvalStatus.status =='rejected' && userStatus == 'rejected') {
  //           throw new Error(`A scholar from your organization has already rejected this Hadith. You cannot reject it again.`);
  //         }
  //       }
  
  //       // Update counts and sets based on approval status
  //       if (approvalStatus.status == 'approved') {
  //         approvalCount++;
   
  //       } else if (approvalStatus.status == 'rejected') {
  //         rejectionCount++;

  //       }}
  
  //       // Early exit conditions to avoid unnecessary iterations
  //       if (approvalCount >= 2 ) {
  //         return AGREEMENT_STATUS.ACTIVE;
  //       } else if (rejectionCount >= 2) {
  //         return AGREEMENT_STATUS.REJECTED;
  //       }
  //     }
  
  //     return AGREEMENT_STATUS.INPROGRESS;
  //   } catch (error) {
  //     throw new Error(`Failed to validate approvals for updating Hadith: ${error.message}`);
  //   }
  // }

  // async queryApprovalsByHadithId(ctx, hadithId) {
  //     try {
  //       const queryString = JSON.stringify({ selector: { hadithId } });
  //       const iterator = await ctx.stub.getQueryResult(queryString);
  //       return await this.getAllResults(iterator, false);
  //     } catch (error) {
  //       throw new Error(`Failed to query approvals by HadithId: ${error.message}`);
  //     }
  //   }
  



  // /**
  //  * Function getAllResults
  //  * @param {resultsIterator} iterator within scope passed in
  //  * @param {Boolean} isHistory query string created prior to calling this fn
  //  */
  

  // /**
  //  * Function getQueryResultForQueryString
  //  * getQueryResultForQueryString woerk function executes the passed-in query string.
  //  * Result set is built and returned as a byte array containing the JSON results.
  //  * @param {Context} ctx the transaction context
  //  * @param {any}  self within scope passed in
  //  * @param {String} the query string created prior to calling this fn
  //  */

  // /**
  //  * getAssetHistory takes the asset ID as arg, returns results as JSON
  //  * @param {String} id the asset ID
  //  */

  // async getHadithHistory(ctx, id) {
  //   try {
  //     let results = await this.getHistoryById(ctx, id);

  //     let approvalResults = await this.queryApprovalsByHadithId(ctx, id);  
  //     return { results, approvalResults };
  //   } catch (err) {
  //     return new Error(err.stack);
  //   }
  // }
  
  // async getHistoryById(ctx, id) {
  //   const iterator = await ctx.stub.getHistoryForKey(id);
  //   const allResults = [];
  
  //   try {
  //     while (true) {
  //       const res = await iterator.next();
  //       if (res.value) {
  //         const txId = res.value.txId;
  //         const timestamp = new Date(res.value.timestamp.seconds * 1000).toISOString();
  //         const isDelete = res.value.isDelete;
  //         let action, value, deletedBy;
  
  //         if (isDelete) {
  //           action = 'DELETED';
  //           const deleteMetadataKey = `delete_${id}`;
  //           const deleteMetadataBytes = await ctx.stub.getState(deleteMetadataKey);
  //           if (deleteMetadataBytes?.length) {
  //             const deleteMetadata = JSON.parse(deleteMetadataBytes.toString());
  //             deletedBy = deleteMetadata.deletedBy || 'Unknown';
  //           } else {
  //             deletedBy = 'Unknown';
  //           }
  //           value = null;
  //         } else {
  //           value = JSON.parse(res.value.value.toString('utf8'));
  //           action = value.hadithStatus == 'inprogress' ? 'CREATED' : 'UPDATED';
  //         }
  
  //         allResults.push({ TxId: txId, Action: action, Timestamp: timestamp, DeletedBy: deletedBy, Value: value });
  //       }
  
  //       if (res.done) {
  //         await iterator.close();
  //         break;
  //       }
  //     }
  //   } catch (err) {
  //     throw new Error(err.message);
  //   }
  
  //   return allResults;
  // }

  // async getAllResults(iterator, isHistory) {
  //   try {
  //     let allResults = [];
  //     while (true) {
  //       let res = await iterator.next();
  //       console.log(res.value);

  //       if (res.value && res.value.value.toString()) {
  //         let jsonRes = {};
  //         console.log(res.value.value.toString("utf8"));

  //         if (isHistory && isHistory == true) {
  //           jsonRes.txId = res.value.txId;
  //           jsonRes.Timestamp = res.value.timestamp;
  //           jsonRes.IsDelete = res.value.isDelete
  //             ? res.value.isDelete.toString()
  //             : "false";
  //           try {
  //             jsonRes.Value = JSON.parse(res.value.value.toString("utf8"));
  //           } catch (err) {
  //             console.log(err);
  //             jsonRes.Value = res.value.value.toString("utf8");
  //           }
  //         } else {
  //           jsonRes.Key = res.value.key;
  //           try {
  //             jsonRes.Record = JSON.parse(res.value.value.toString("utf8"));
  //           } catch (err) {
  //             console.log(err);
  //             jsonRes.Record = res.value.value.toString("utf8");
  //           }
  //         }
  //         allResults.push(jsonRes);
  //       }
  //       if (res.done) {
  //         console.log("end of data");
  //         await iterator.close();
  //         console.info("allResults : ", allResults);
  //         return allResults;
  //       }
  //     }
  //   } catch (err) {
  //     return new Error(err.message);
  //   }
  // }

  // async getDataWithPagination(ctx, queryString, pageSize, bookmark) {
  //   try {
  //     const pageSizeInt = parseInt(pageSize, 10);
  //     const { iterator, metadata } =
  //       await ctx.stub.getQueryResultWithPagination(
  //         queryString,
  //         pageSizeInt,
  //         bookmark
  //       );
  //     const results = await this.getAllResults(iterator, false);
  //     let finalData = {
  //       data: results,
  //       metadata: {
  //         RecordsCount: metadata.fetchedRecordsCount,
  //         Bookmark: metadata.bookmark,
  //       },
  //     };
  //     return finalData;
  //   } catch (err) {
  //     return new Error(err.message);
  //   }
  // }
  
}

module.exports = HadithContract;
