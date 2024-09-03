'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const utf8Decoder = new TextDecoder();

class QueryHadithHistoryByIdWorkload extends WorkloadModuleBase {

    async submitTransaction() {
        try {
            const id = "9498ac74ea962d72975589cbb4df6540e51787c6dab30a63355683fa402bc5ba";

            const result = await this.queryHistoryById(id);
            console.log(`Query result for Hadith History ID ${id}:`, result);
        } catch (error) {
            console.error(`Failed to query Hadith History: ${error.message}`);
            throw new Error(`Failed to query Hadith History: ${error.message}`);
        }
    }

    async queryHistoryById(id) {
        try {
            // Querying the Hadith by ID
            const hadithResponse = await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'getHadithHistory',
                contractArguments: [id],
                readOnly: true
            });

    
            // Extract and decode the result from TxStatus
            const result = JSON.parse(utf8Decoder.decode(hadithResponse.status.result));
    
            // return {
            //     hadithHistory: result.results?.map(elm => ({
            //       txId: elm.TxId,
            //       Action: elm.Action,
            //       timeStamp: elm.Timestamp ? new Date(elm.Timestamp).getTime() : null,
            //       DeletedBy: elm.DeletedBy,
            //       ...elm.Value,
            //     })) || [],
            //     approvals: result.approvalResults?.map(elm => ({
            //       ...elm.Record,
            //       key: elm.Key,
            //     })) || []
            //   };
    
        } catch (error) {
            console.error(`Failed to query Hadith by ID ${id}: ${error.message}`);
            throw error;
        }
    }
    
    

 
}

function createWorkloadModule() {
    return new QueryHadithHistoryByIdWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;