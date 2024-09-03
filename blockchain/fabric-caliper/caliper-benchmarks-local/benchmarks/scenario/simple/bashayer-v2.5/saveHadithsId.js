'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const fs = require('fs');
const path = require('path');
const utf8Decoder = new TextDecoder();

class QueryAllHadithsWorkload extends WorkloadModuleBase {

    async submitTransaction() {
        try {
            const pageSize = 6000; // Default page size
            const bookmark = ''; // Default bookmark
            const filterType = 'all'; // Example filter type
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
            this.saveHadiths(result);
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
            console.log('Filter:', filter.filterType);
            if (filter.filterType) {
                switch (filter.filterType) {
                    case 'all':
                        query = `{\"selector\":{}}`;
                        break;
                    case 'active':
                    case 'INPROGRESS':
                    case 'UPDATE':
                        query = `{\"selector\":{\"Hadith\": {\"$exists\": true}, \"hadithStatus\":\"${filter.filterType}\"}}`;
                        break;
                    default:
                        query = `{\"selector\":{}}`;
                        break;
                }
            }

            console.log('Executing query:', JSON.stringify(query));

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
            console.error(`Failed to query all Hadiths with filter ${JSON.stringify(filter)}: ${error.message}`);
            throw error;
        }
    }

    saveHadiths(hadiths) {
        const filePath = path.join(__dirname, 'HadithsId.json');
        fs.writeFileSync(filePath, JSON.stringify(hadiths, null, 2));
        console.log(`Hadiths have been saved to ${filePath}`);
    }
}

function createWorkloadModule() {
    return new QueryAllHadithsWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
