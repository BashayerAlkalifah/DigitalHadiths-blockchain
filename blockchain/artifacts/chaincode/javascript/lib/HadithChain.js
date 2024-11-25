"use strict";

const { Contract, Transaction } = require("fabric-contract-api");
const ClientIdentity = require('fabric-shim').ClientIdentity;
const { getDataForQuery } = require('fabric-shim');
const utf8Decoder = new TextDecoder();
const AGREEMENT_STATUS = {
  ACTIVE: 'active',
  REJECTED: 'rejected',
  INPROGRESS: 'inprogress'
};


class HadithContract extends Contract {
  
  async AddHadith(ctx, hadithData) {
    try {

      // Parse hadithData into an object
      const hadith = JSON.parse(hadithData);
       // Get client identity and check authorization
      let cid = new ClientIdentity(ctx.stub)
      if(!cid.assertAttributeValue('registrationType', 'scholar')&&!cid.assertAttributeValue('registrationType', 'StudentOfHadith')){
        throw new Error('غير مصرح لك بتنفيذ هذه العملية')
      }
      // Check if Hadith already exists
      const exists = await this.HadithExists(ctx, hadith.hadithId);
      if (exists) {
        throw new Error(`الحديث الذي يحمل المعرف ${hadith.hadithId} موجود بالفعل`);
      }
       // Store Hadith in ledger
      await ctx.stub.putState(hadith.hadithId, hadithData);
      // Return transaction ID
      return ctx.stub.getTxID();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  
  async updateHadith(ctx, hadithData) {
    try {

      // Parse hadithData into an object
      const hadith = JSON.parse(hadithData);
    
      // Check if the client has the 'scholar' role.
      await this.verifyScholarAuthorization(ctx);

	    // Retrieve and check the status of the previous hadith.
      const previousHadit = await this.getHadithByID(ctx, hadith.previousHadithId);
      if (previousHadit.hadithStatus == 'inprogress') {
        throw new Error(`الحديث ذو المعرف ${hadith.previousHadithId} قيد التنفيذ.`);
      }
	    // Store the update hadith data on the ledger.
      await ctx.stub.putState(hadith.hadithId, hadithData);
      // Return transaction ID
      return ctx.stub.getTxID();
    } catch (error) {
      throw new Error(error.message);

    }}

  async HadithExists(ctx, id) {
    try {
      const hadithJSON = await ctx.stub.getState(id);
      return hadithJSON && hadithJSON.length > 0;
    } catch (error) {
      throw new Error(error.message);
    }
    }

  async getHadithByID(ctx, hadithId) {
      try {
        const hadithJSON = await ctx.stub.getState(hadithId);
        if (!hadithJSON || hadithJSON.length == 0) {
          throw new Error(`الحديث ذو المعرف ${hadithId} غير موجود`);
        }
        const hadith = JSON.parse(hadithJSON.toString());
        return hadith;
      } catch (error) {
        throw new Error(error.message);
      }
      }
  
  async deleteHadith(ctx, id, deletedBy , active = "true") {
        try {
          const hadithId = JSON.parse(id);

          // Check if the client has the 'scholar' role.
          await this.verifyScholarAuthorization(ctx);

          // Validate conditions for deleting the hadith.
          const Hadith = await this.getHadithByID(ctx, hadithId);  
          if (Hadith.previousHadithId && active == "true" ) {
            throw new Error(`هذه العملية مخصصة لرفض الأحاديث الجديدة فقط.`);
          } else if (Hadith.hadithStatus == 'active' && active == "true" ) {
            throw new Error(`الحديث تم تنشيطه بالفعل. يمكنك البحث عن أحاديث أخرى للموافقة عليها.`);
          }
          // Store deletion metadata under a separate key
          const deleteMetadata = {
            hadithId: hadithId,
            deletedBy: deletedBy,
          };
          await ctx.stub.putState(`delete_${hadithId}`, JSON.stringify(deleteMetadata));
	        // Delete the hadith from the world state.
          await ctx.stub.deleteState(hadithId);
        	// Delete the Approvals from the world state.
           const approvals = await this.queryApprovalsByHadithId(ctx, hadithId);
          for (const approval of approvals) {
            await ctx.stub.deleteState(approval.Key);
          }
          return `تم حذف الحديث بنجاح.`;
        } catch (error) {
          throw new Error(error.message);
        }
      }



      

  // async queryHadiths(ctx, queryString) {
  //   try {
  //     const iterator = await ctx.stub.getQueryResult(queryString);
  //     return await this.getAllResults(iterator, false);
  //   } catch (error) {
  //     throw new Error(`Failed to query Hadiths: ${error.message}`);
  //   }
  // }


  async approveHadith(ctx, hadithData){
    try {
      let hadith = JSON.parse(hadithData)
      const hadithId = hadith.hadithId;

      // Check if the client has the 'scholar' role.
      await this.verifyScholarAuthorization(ctx);

      // If the Hadith status is "active", retrieve and update it
     if (hadith.hadithStatus == "active"){
      const hadithBuffer = await ctx.stub.getState(hadithId);
      const existingHadith = JSON.parse(hadithBuffer.toString());

      // Update the Hadith status to "active"
      existingHadith.hadithStatus = hadith.hadithStatus;

      // Store the updated Hadith on the ledger.
      await ctx.stub.putState(hadithId, JSON.stringify(existingHadith));
     }

     // remove the status before storing the approval data.
     delete hadith.hadithStatus;

     // Store the approval data on the ledger.
     await ctx.stub.putState(hadith.id, JSON.stringify(hadith))
     return ctx.stub.getTxID();
      
    } catch (error) {
      throw new Error(error.message);
    } 
  }
  async validateApprovals(ctx, hadithId, userStr) {
    try {
      // Check if the client has the 'scholar' role.
      await this.verifyScholarAuthorization(ctx);
      // Validate if the Hadith is eligible for approval.
      await this.validateHadithEligibility(ctx, hadithId);
      
      const user = JSON.parse(userStr);
      // Query for existing approvals for the given Hadith ID.
      const queryString = `{"selector":{"hadithId":"${hadithId}"}}`;
      const iterator = await ctx.stub.getQueryResult(queryString);
  
      let scholarCount = 0;
      let result = await iterator.next();
  
      // Iterate over approval records.
      while (!result.done) {
        const approval = JSON.parse(result.value.value.toString('utf8'));
  		// Check if the user's institution has already approved this Hadith
        if (approval.registrationType == user.registrationType && approval.orgId == user.orgId) {
          throw new Error('لقد وافق عالم من مؤسستك على هذا الحديث بالفعل. يمكنك البحث عن أحاديث أخرى للموافقة عليها.');
        }
        // Increment the count if the approval is from a scholar.
        if (approval.registrationType == 'scholar') {
          scholarCount++;
        }
        result = await iterator.next();
      }
      // Return the appropriate status based on the number of scholar approvals.
      if (scholarCount > 0) {
        return AGREEMENT_STATUS.ACTIVE;
      }
      return AGREEMENT_STATUS.INPROGRESS;
  
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async approveAndRejectForUpdateHadith(ctx, hadithData) {
    try {
        const hadith = JSON.parse(hadithData);
        const { hadithId, hadithStatus, id, createBy } = hadith;
        
        // Check if the client has the 'scholar' role.
        await this.verifyScholarAuthorization(ctx);

        // Delete the update Hadith request directly if it is rejected.
        if (hadithStatus == "rejected") {
        await this.deleteHadith(ctx, JSON.stringify(hadithId), JSON.stringify(createBy), JSON.stringify("false"));
        return ctx.stub.getTxID();
      }
        // The old Hadith is removed from the world state and replaced with the updated one.
        if (hadithStatus == "active") {
        // Retrieve the Hadith to update its status
        const hadithBuffer = await ctx.stub.getState(hadithId);
        const existingHadith = JSON.parse(hadithBuffer.toString());
  
        // Update the Hadith status from "update" to "active".
        existingHadith.hadithStatus = hadithStatus;
  
        // Store the updated Hadith
        await ctx.stub.putState(hadithId, JSON.stringify(existingHadith));
  
        // Delete the previous Hadith from the world state
        await this.deleteHadith(ctx, JSON.stringify(existingHadith.previousHadithId), JSON.stringify(existingHadith.createBy), JSON.stringify("false"));
        
      }
        // Remove the status before storing the approval/rejection data.
        delete hadith.hadithStatus;
  
        // Store the approval/rejection data on the ledger.
        await ctx.stub.putState(id, JSON.stringify(hadith));
        return ctx.stub.getTxID();
  
    } catch (error) {
      throw new Error(error.message);
    }
  }


  async validateHadithUpdateApprovalAndRejection(ctx, hadithId, status, userStr) {
    try {
      // Check if the client has the 'scholar' role.
      await this.verifyScholarAuthorization(ctx);

     // Validate the Hadith's eligibility for updates.
      await this.checkHadithEligibility(hadithId);

     // Parse user and status using the external async function.
      const { email, userOrgId, userStatus } = await this.parseUserAndStatus(userStr, status);

      // Query all related Hadith approvals
      const queryString = `{"selector":{"hadithId":"${hadithId}"}}`;
      const iterator = await ctx.stub.getQueryResult(queryString);

      let approvalCount = userStatus == 'approved' ? 1 : 0;
      let rejectionCount = userStatus == 'rejected' ? 1 : 0;
      // Iterate through the approvals
      while (true) {
        const result = await iterator.next();
        if (result.done) break;
        const approval = JSON.parse(result.value.value.toString('utf8'));
        const { orgId, createBy, status: approvalStatus } = approval;
  
        // Check if the user has already reviewed the Hadith
        if (createBy == email) {
          throw new Error(`لقد قمت بالفعل بالموافقة أو الرفض على هذا الحديث.`);
        }
        if (approvalStatus) {
         if (orgId == userOrgId) {
            // If the Hadith has already been approved by scholar from the same organization
          if (approvalStatus.status == 'approved' && userStatus == 'approved') {
            throw new Error(`لقد وافق عالم من مؤسستك على هذا الحديث بالفعل. لا يمكنك الموافقة عليه مرة أخرى.`);
          } 
          // If the Hadith has already been rejected by scholar from the same organization
          else if (approvalStatus.status =='rejected' && userStatus == 'rejected') {
            throw new Error(`لقد رفض عالم من مؤسستك هذا الحديث بالفعل. لا يمكنك رفضه مرة أخرى.`);
          } }
         // Update counts based on approval status.
         approvalStatus.status == 'approved' ? approvalCount++ : rejectionCount++;
       }
       // Return the appropriate status based on the number of scholar approvals/rejected.
        if (approvalCount >= 2 ) {
          return AGREEMENT_STATUS.ACTIVE;
        } else if (rejectionCount >= 2) {
          return AGREEMENT_STATUS.REJECTED;
        }
      }
      return AGREEMENT_STATUS.INPROGRESS;
    } catch (error) {
      throw new Error(error.message);
    }
  }




  async queryApprovalsByHadithId(ctx, hadithId) {
      try {
        const queryString = JSON.stringify({ selector: { hadithId } });
        const iterator = await ctx.stub.getQueryResult(queryString);
        return await this.getAllResults(iterator, false);
      } catch (error) {
        throw new Error(error.message);
      }
    }
  
  async getHadithHistory(ctx, id) {
    try {
      let results = await this.getHistoryById(ctx, id);

      let approvalResults = await this.queryApprovalsByHadithId(ctx, id);  
      return { results, approvalResults };
    } catch (err) {
      return new Error(err.stack);
    }
  }
  
  async getHistoryById(ctx, id) {
    const iterator = await ctx.stub.getHistoryForKey(id);
    const allResults = [];
  
    try {
      while (true) {
        const res = await iterator.next();
        if (res.value) {
          const txId = res.value.txId;
          const timestamp = new Date(res.value.timestamp.seconds * 1000).toISOString();
          const isDelete = res.value.isDelete;
          let action, value, deletedBy;
  
          if (isDelete) {
            action = 'DELETED';
            const deleteMetadataKey = `delete_${id}`;
            const deleteMetadataBytes = await ctx.stub.getState(deleteMetadataKey);
            if (deleteMetadataBytes?.length) {
              const deleteMetadata = JSON.parse(deleteMetadataBytes.toString());
              deletedBy = deleteMetadata.deletedBy || 'Unknown';
            } else {
              deletedBy = 'Unknown';
            }
            value = null;
          } else {
            value = JSON.parse(res.value.value.toString('utf8'));
            action = value.hadithStatus == 'inprogress' ? 'CREATED' : 'UPDATED';
          }
  
          allResults.push({ TxId: txId, Action: action, Timestamp: timestamp, DeletedBy: deletedBy, Value: value });
        }
  
        if (res.done) {
          await iterator.close();
          break;
        }
      }
    } catch (err) {
      throw new Error(err.message);
    }
  
    return allResults;
  }

  async getAllResults(iterator, isHistory) {
    try {
      let allResults = [];
      while (true) {
        let res = await iterator.next();
        console.log(res.value);

        if (res.value && res.value.value.toString()) {
          let jsonRes = {};
          console.log(res.value.value.toString("utf8"));

          if (isHistory && isHistory == true) {
            jsonRes.txId = res.value.txId;
            jsonRes.Timestamp = res.value.timestamp;
            jsonRes.IsDelete = res.value.isDelete
              ? res.value.isDelete.toString()
              : "false";
            try {
              jsonRes.Value = JSON.parse(res.value.value.toString("utf8"));
            } catch (err) {
              console.log(err);
              jsonRes.Value = res.value.value.toString("utf8");
            }
          } else {
            jsonRes.Key = res.value.key;
            try {
              jsonRes.Record = JSON.parse(res.value.value.toString("utf8"));
            } catch (err) {
              console.log(err);
              jsonRes.Record = res.value.value.toString("utf8");
            }
          }
          allResults.push(jsonRes);
        }
        if (res.done) {
          await iterator.close();
          return allResults;
        }
      }
    } catch (err) {
      return new Error(err.message);
    }
  }

  async getDataWithPagination(ctx, queryString, pageSize, bookmark) {
    try {
      const pageSizeInt = parseInt(pageSize, 10);
      const { iterator, metadata } =
        await ctx.stub.getQueryResultWithPagination(
          queryString,
          pageSizeInt,
          bookmark
        );
      const results = await this.getAllResults(iterator, false);
      let finalData = {
        data: results,
        metadata: {
          RecordsCount: metadata.fetchedRecordsCount,
          Bookmark: metadata.bookmark,
        },
      };
      return finalData;
    } catch (err) {
      return new Error(err.message);
    }
  }

                                            // Helper functions

  async verifyScholarAuthorization(ctx) {
    const cid = new ClientIdentity(ctx.stub);
    if (!cid.assertAttributeValue('registrationType', 'scholar')) {
      throw new Error('غير مصرح لك بتنفيذ هذه العملية')
    }
  }
  async validateHadithEligibility(ctx, hadithId) {
    // Retrieve the Hadith by its ID
    const hadith = await this.getHadithByID(ctx, hadithId);
    // Check if the Hadith is part of a previous submission
    if (hadith.previousHadithId) {
      throw new Error('فشلت العملية: هذه العملية مخصصة فقط للموافقة على الأحاديث الجديدة.');
    }
    // Check if the Hadith is already active
    if (hadith.hadithStatus === 'active') {
      throw new Error('فشلت العملية: الحديث تم تنشيطه بالفعل. يمكنك البحث عن أحاديث أخرى للموافقة عليها.');
    }
  }
  async checkHadithEligibility(ctx, hadithId) {
    // Retrieve the Hadith by its ID
    const hadith = await this.getHadithByID(ctx, hadithId);
 
    if (!hadith.previousHadithId) {
      throw new Error(`فشلت العملية: هذه العملية مخصصة للموافقة أو الرفض على طلب تحديث الحديث.`);
    }
    // Check if the Hadith is already active
    if (hadith.hadithStatus === 'active') {
      throw new Error(`فشلت العملية: الحديث تم تنشيطه بالفعل. يمكنك البحث عن أحاديث أخرى.`);
    }
  }
  async  parseUserAndStatus(userStr, statusStr) {
    const user = JSON.parse(userStr);
    const status = JSON.parse(statusStr);
    const { email, orgId: userOrgId } = user;
    const userStatus = status.status;
    return { email, userOrgId, userStatus };
  }
    async  parseUserAndStatus(userStr, statusStr) {
    const user = JSON.parse(userStr);
    const status = JSON.parse(statusStr);
    const { email, orgId: userOrgId } = user;
    const userStatus = status.status;
    return { email, userOrgId, userStatus };
  }

  
  
}

module.exports = HadithContract;
