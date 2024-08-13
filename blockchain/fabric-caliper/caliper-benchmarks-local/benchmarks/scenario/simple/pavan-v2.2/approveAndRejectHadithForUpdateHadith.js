'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const utf8Decoder = new TextDecoder();

// Read and parse the HadithsId.json file
const hadithIdsPath = path.join(__dirname, 'HadithsId.json');
let hadithIds;

const hadithIdsData = fs.readFileSync(hadithIdsPath, 'utf8');
const parsedData = JSON.parse(hadithIdsData);
hadithIds = parsedData.data.map(item => item.Record.hadithId);

const getUUID = () => {
    return uuidv4();
};

class ApproveAndRejectForUpdateHadithWorkload extends WorkloadModuleBase {

    constructor() {
        super();
        this.hadithIds = hadithIds;
        this.txIndex = 0; // Start from index 0
    }

    async submitTransaction() {
        try {

            const hadithId = this.hadithIds[this.txIndex];
            this.txIndex++;
            if (this.txIndex >= this.hadithIds.length) {
                this.txIndex = 0; // Reset index if it exceeds array length
            }

            const user = {
                email: `yara@gmail.com`,
                orgId: 2,
                registrationType: 'scholar'
            };


            const status = 'approved'; 
            console.log(`Approving Hadith with ID: ${hadithId} and status: ${status}`);

            // Validate approvals and get Hadith status
            const hadithStatusBuffer = await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'validateHadithUpdateApprovalAndRejection',
                contractArguments: [hadithId, JSON.stringify(status), JSON.stringify(user)],
                readOnly: true
            });

            // Log the raw buffer response for debugging
            //console.log(`Raw hadithStatusBuffer:`, hadithStatusBuffer);

            const hadithStatus = utf8Decoder.decode(hadithStatusBuffer.status.result);
            //console.log(`Hadith status (ASCII): ${hadithStatus}`);

  
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

            // Log the data being sent for debugging
            //console.log(`Data being sent: ${JSON.stringify(data)}`);

            // Submit transaction
            await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'approveAndRejectForUpdateHadith',
                contractArguments: [JSON.stringify(data)],
                readOnly: false
            });

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
            throw new Error(`Error approving Hadith: ${detailedMessage}`);
        }
    }
}

function createWorkloadModule() {
    return new ApproveAndRejectForUpdateHadithWorkload();
}



module.exports.createWorkloadModule = createWorkloadModule;
