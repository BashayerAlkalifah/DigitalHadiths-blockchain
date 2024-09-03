'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const utf8Decoder = new TextDecoder();

class QueryHadithByIdWorkload extends WorkloadModuleBase {

    async submitTransaction() {
        try {
            const id = "9498ac74ea962d72975589cbb4df6540e51787c6dab30a63355683fa402bc5ba";

            const result = await this.queryHadithById(id);
            console.log(`Query result for Hadith ID ${id}:`, result);
        } catch (error) {
            console.error(`Failed to query Hadith: ${error.message}`);
            throw new Error(`Failed to query Hadith: ${error.message}`);
        }
    }

    async queryHadithById(id) {
        try {
            // Querying the Hadith by ID
            const hadithResponse = await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'getHadithByID',
                contractArguments: [id],
                readOnly: true
            });

    
            // Extract and decode the result from TxStatus
            const hadithResult = JSON.parse(utf8Decoder.decode(hadithResponse.status.result));
    
            // Querying the approvals by Hadith ID
            const approvalsResponse = await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'queryApprovalsByHadithId',
                contractArguments: [id],
                readOnly: true
            });
    
            // Extract and decode the result from TxStatus
            const approvalsResult = JSON.parse(utf8Decoder.decode(approvalsResponse.status.result));
            // Combine results
            hadithResult.approvals = approvalsResult.map(approval => approval.Record);

    
            return hadithResult;
    
        } catch (error) {
            console.error(`Failed to query Hadith by ID ${id}: ${error.message}`);
            throw error;
        }
    }
    
    

 
}

function createWorkloadModule() {
    return new QueryHadithByIdWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;