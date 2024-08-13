'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read and parse the HadithsId.json file
const hadithIdsPath = path.join(__dirname, 'HadithsId.json');
let currentHadith;

const hadithIdsData = fs.readFileSync(hadithIdsPath, 'utf8');
const parsedData = JSON.parse(hadithIdsData);
currentHadith = parsedData.data.map(item => item.Record);


class UpdateHadithWorkload extends WorkloadModuleBase {
    
    constructor() {
        super();
        this.currentHadith = currentHadith;
        this.txIndex = 1; // Start from index 0
    }

    async submitTransaction() {
        try {
            const currentHadith = this.currentHadith[this.txIndex];
            this.txIndex++;
            if (this.txIndex >= this.currentHadith.length) {
                this.txIndex = 0; // Reset index if it exceeds array length
            }

            const user = {
                orgId: 1,
                email: `bashayer@gmail.com`,
                registrationType: 'scholar'
            };

            const previousId = currentHadith.hadithId;
            console.log(`Previous Hadith ID: ${previousId}`);

            const id = crypto.createHash('sha256').update(previousId +"bashayer").digest('hex');
            console.log(`Hadith ID: ${id}`);

            const dateTime = new Date();

            const data = {
                hadithId: id, // Assuming id is correct for the existing Hadith
                previousHadithId: previousId,
                Hadith: currentHadith.Hadith,
                TheFirstNarrator: currentHadith.TheFirstNarrator,
                ReportedBy: currentHadith.ReportedBy,
                RulingOfTheReported: currentHadith.RulingOfTheReported,
                Source: [currentHadith.Source],
                PageOrNumber: currentHadith.PageOrNumber,
                orgId: parseInt(user.orgId),
                registrationType: user.registrationType,
                hadithStatus: 'UPDATE',
                createBy: user.email,
                createAt: dateTime,
                description: currentHadith.description,
                document: currentHadith.document || {}
            };

            console.log(`Updating Hadith with ID: ${id}`);
            console.log(`Data: ${JSON.stringify(data)}`);

            await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'updateHadith',
                contractArguments: [JSON.stringify(data)],
                readOnly: false
            });

        } catch (error) {
            console.error(`Failed to update Hadith: ${error.message}`);
            throw new Error(`Failed to update Hadith: ${error.message}`);
        }
    }
}

function createWorkloadModule() {
    return new UpdateHadithWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
