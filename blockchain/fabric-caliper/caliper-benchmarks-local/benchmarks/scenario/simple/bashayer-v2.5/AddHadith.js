'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const crypto = require('crypto');
const hadith = require('./hadithData.json'); // Assuming hadithData is an array

class AddHadithWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.hadithData = hadith;
    }

    async submitTransaction() {
        try {
            const currentHadith = this.hadithData[this.txIndex];
            this.txIndex++;
            if (this.txIndex >= this.hadithData.length) {
                this.txIndex = 0; // Reset index if it exceeds array length
            }

            const user = {
                orgId: 1,
                email: `bashayer@gmail.com`,
                registrationType: 'scholar'
            };

            const roundArguments = this.roundArguments.assets;
            let appraisedValue = Math.floor(Math.random() * (1000000 - 100 + 1) + 100) // random number between 100 and 1000000


            const hashInput = `${currentHadith.Hadith}${currentHadith.TheFirstNarrator}${currentHadith.ReportedBy}${currentHadith.Hadith_number}${currentHadith.Source}${currentHadith.RulingOfTheReported}${roundArguments}${"hi"}${appraisedValue}`;
            const id = crypto.createHash('sha256').update(hashInput).digest('hex');

            const dateTime = new Date();

            const data = {
                hadithId: id,
                Hadith: currentHadith.Hadith,
                TheFirstNarrator: currentHadith.TheFirstNarrator,
                ReportedBy: currentHadith.ReportedBy,
                RulingOfTheReported: currentHadith.RulingOfTheReported,
                Source: [currentHadith.Source],
                HadithNumber: currentHadith.Hadith_number,
                orgId: parseInt(user.orgId),
                registrationType: user.registrationType,
                hadithStatus: 'INPROGRESS',
                createBy: user.email,
                createAt: dateTime,
            };

            await this.sutAdapter.sendRequests({
                contractId: 'HadithChain',
                contractFunction: 'AddHadith',
                invokerIdentity: 'Admin@org1.example.com',
                contractArguments: [JSON.stringify(data)],
                readOnly: false
            });
        } catch (error) {
            console.error(`Failed to add Hadith: ${error.message}`);
            throw new Error(`Failed to add Hadith: ${error.message}`);
        }
    }
}

function createWorkloadModule() {
    return new AddHadithWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
