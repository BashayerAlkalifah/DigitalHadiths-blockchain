'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const utf8Decoder = new TextDecoder();

class QueryAllHadithsWorkload extends WorkloadModuleBase {

    async submitTransaction() {
        try {
            const pageSize = 10; // Default page size
            const bookmark = ''; // Default bookmark
            const filterType = 'ACTIVE'; // Example filter type
            const orgId = 1; // Example orgId, replace with actual value
            const email = `bashayer@gmail.com`; // Example email, replace with actual value
            const orgName = `org${orgId}`;

            let filter = {
                orgId: parseInt(orgId),
                pageSize: pageSize,
                bookmark: bookmark,
                orgName: orgName,
                email: email,
                filterType: filterType,
            };

            const result = await this.queryAllHadiths(filter);
           // console.log(`Query result for all Hadiths:`, result);
        } catch (error) {
            console.error(`Failed to query all Hadiths: ${error.message}`);
            throw new Error(`Failed to query all Hadiths: ${error.message}`);
        }
    }

    async queryAllHadiths(filter) {
        try {
            let query = {
                selector: {}
            };

            if (filter.filterType) {
                switch (filter.filterType) {
                    case 'all':
                        query = `{\"selector\":{}}`;
                        break;
                    case 'ACTIVE':
                    case 'INPROGRESS':
                    case 'UPDATE':
                        query = `{\"selector\":{\"Hadith\": {\"$exists\": true}, \"hadithStatus\":\"${filter.filterType}\"}}`;
                        break;
                    default:
                        query = `{\"selector\":{}}`;
                        break;
                }
            }


            const hadithsResponse = await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'getDataWithPagination',
                contractArguments: [query, filter.pageSize.toString(), filter.bookmark],
                readOnly: true
            });


            const result = JSON.parse(utf8Decoder.decode(hadithsResponse.status.result));
            //console.log(`Query result: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            console.error(`Failed to query all Hadiths with filter ${filter}: ${error.message}`);
            throw error;
        }
    }
}

function createWorkloadModule() {
    return new QueryAllHadithsWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
