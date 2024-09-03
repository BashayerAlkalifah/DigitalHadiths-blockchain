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


            const hashInput = `${currentHadith.Hadith}${currentHadith.TheFirstNarrator}${currentHadith.ReportedBy}${currentHadith.Hadith_number}${currentHadith.Source}${currentHadith.RulingOfTheReported}${roundArguments}${"jjwwwj"}${appraisedValue}`;
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
                // invokerIdentity: 'Admin@org1.example.com',
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


// 'use strict';

// const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
// const crypto = require('crypto');
// const hadith = require('./hadithData.json'); // Assuming hadithData is an array

// class AddHadithWorkload extends WorkloadModuleBase {
    
//     constructor() {
//         super();
//         this.txIndex = 0; // Start from index 0
//         this.hadithData = hadith; // Assigning the imported JSON data to a class member
//     }



//     async submitTransaction() {
//         try {
//             const currentHadith = this.hadithData[this.txIndex];
//             this.txIndex++;
//             if (this.txIndex >= this.hadithData.length) {
//                 this.txIndex = 0; // Reset index if it exceeds array length
//             }

//             const user = {
//                 orgId: 1,
//                 email: `bashayer@gmail.com`,
//                 registrationType: 'scholar'
//             };

//             // Accessing arguments passed from the test configuration
//             const roundArguments = this.roundArguments.assets;
//             //console.log('roundArguments', roundArguments);

//             const hashInput = currentHadith.Hadith + currentHadith.TheFirstNarrator + currentHadith.ReportedBy + currentHadith.Hadith_number + currentHadith.Source + currentHadith.RulingOfTheReported + roundArguments +"" ;
//             const id = crypto.createHash('sha256').update(hashInput).digest('hex');

//             const dateTime = new Date();

//             const data = {
//                 hadithId: id,
//                 Hadith: currentHadith.Hadith,
//                 TheFirstNarrator: currentHadith.TheFirstNarrator,
//                 ReportedBy: currentHadith.ReportedBy,
//                 RulingOfTheReported: currentHadith.RulingOfTheReported,
//                 Source: [currentHadith.Source],
//                 HadithNumber: currentHadith.Hadith_number,
//                 orgId: parseInt(user.orgId),
//                 registrationType: user.registrationType,
//                 hadithStatus: 'INPROGRESS',
//                 createBy: user.email,
//                 createAt: dateTime,
//             };

//          //   console.log(`Sending transaction for Hadith ID: ${id}`);

//             await this.sutAdapter.sendRequests({
//                 contractId: 'HadithChain',
//                 contractFunction: 'AddHadith',
//                 invokerIdentity: 'Admin@org1.example.com',
//                 contractArguments: [JSON.stringify(data)],
//                 readOnly: false
//             });



//         } catch (error) {
//             console.error(`Failed to add Hadith: ${error.message}`);
//             throw new Error(`Failed to add Hadith: ${error.message}`);
//         }
//     }
// }

// function createWorkloadModule() {
//     return new AddHadithWorkload();
// }

// module.exports.createWorkloadModule = createWorkloadModule;

// 'use strict';

// const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
// const crypto = require('crypto');
// const hadith = require('./hadithData.json'); // Assuming hadithData is an array

// class AddHadithWorkload extends WorkloadModuleBase {
    
//     constructor() {
//         super();
//         this.txIndex = 0; // Start from index 0
//         this.hadithData = hadith; // Assigning the imported JSON data to a class member

//     }

//     async submitTransaction() {
//         try {
//             const currentHadith = this.hadithData[this.txIndex];
//             this.txIndex++;
//             if (this.txIndex >= this.hadithData.length) {
//                 this.txIndex = 0; // Reset index if it exceeds array length
//             }

//             const user = {
//                 orgId: 1,
//                 email: `bashayer@gmail.com`,
//                 registrationType: 'scholar'
//             };


//          // Accessing arguments passed from the test configuration
//             const roundArguments = this.roundArguments.assets;
//             console.log('roundArguments', roundArguments);

//             const hashInput = currentHadith.Hadith + currentHadith.TheFirstNarrator + currentHadith.ReportedBy + currentHadith.Hadith_number + currentHadith.Source + currentHadith.RulingOfTheReported + roundArguments   ;
//             const id = crypto.createHash('sha256').update(hashInput).digest('hex');

//             const dateTime = new Date();

//             const data = {
//                 hadithId: id,
//                 Hadith: currentHadith.Hadith,
//                 TheFirstNarrator: currentHadith.TheFirstNarrator,
//                 ReportedBy: currentHadith.ReportedBy,
//                 RulingOfTheReported: currentHadith.RulingOfTheReported,
//                 Source: [currentHadith.Source],
//                 HadithNumber: currentHadith.Hadith_number,
//                 orgId: parseInt(user.orgId),
//                 registrationType: user.registrationType,
//                 hadithStatus: 'INPROGRESS',
//                 createBy: user.email,
//                 createAt: dateTime,
//             };



//             await this.sutAdapter.sendRequests({
//                 contractId: 'HadithChain',
//                 contractFunction: 'AddHadith',
//                 invokerIdentity: 'Admin@org1.example.com',
//                 contractArguments: [JSON.stringify(data)],
//                 readOnly: false
//             });

//         } catch (error) {
//             console.error(`Failed to add Hadith: ${error.message}`);
//             throw new Error(`Failed to add Hadith: ${error.message}`);
//         }
        
//     }

// }

// function createWorkloadModule() {
//     return new AddHadithWorkload();
// }

// module.exports.createWorkloadModule = createWorkloadModule;


// 'use strict';

// const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
// const crypto = require('crypto');
// const hadith = require('./hadithData.json'); // Assuming hadithData is an array
// const fs = require('fs');
// const path = require('path');
// const pinataSDK = require('@pinata/sdk');
// //require('dotenv').config();
// //const { PINATA_API_KEY, PINATA_SECRET_API_KEY } = process.env;
// const { Readable } = require('stream');
// const pinata = new pinataSDK('e1e2d0e29386bf540b43', 'fb3092db0ef5fde544ee2689d884b53b16db3aa97cc85dc3828ec2906a517fb2');

// class AddHadithWorkload extends WorkloadModuleBase {
    
//     constructor() {
//         super();
//         this.txIndex = 12; // Start from index 0
//         this.hadithData = hadith; // Assigning the imported JSON data to a class member
//         console.log(' hhhi bashayer ');
//     }

//     async submitTransaction() {
//         try {
//             const currentHadith = this.hadithData[this.txIndex];
//             this.txIndex++;
//             if (this.txIndex >= this.hadithData.length) {
//                 this.txIndex = 0; // Reset index if it exceeds array length
//             }

//             const user = {
//                 orgId: 1,
//                 email: `bashayer@gmail.com`,
//                 registrationType: 'scholar'
//             };

//             const hashInput = currentHadith.Hadith + currentHadith.TheFirstNarrator + currentHadith.ReportedBy + currentHadith.Hadith_number + currentHadith.Source + currentHadith.RulingOfTheReported ;
//             const id = crypto.createHash('sha256').update(hashInput).digest('hex');

//             const dateTime = new Date();

//             const data = {
//                 hadithId: id,
//                 Hadith: currentHadith.Hadith,
//                 TheFirstNarrator: currentHadith.TheFirstNarrator,
//                 ReportedBy: currentHadith.ReportedBy,
//                 RulingOfTheReported: currentHadith.RulingOfTheReported,
//                 Source: [currentHadith.Source],
//                 HadithNumber: currentHadith.Hadith_number,
//                 orgId: parseInt(user.orgId),
//                 registrationType: user.registrationType,
//                 hadithStatus: 'INPROGRESS',
//                 createBy: user.email,
//                 createAt: dateTime,
//                 //document: { /* file metadata if necessary */ }
//             };
//             console.log(' hhhi bashayer ');
//             const pdfPath = path.join(__dirname, 'Sand.pdf'); // Path to your PDF file
//             if (fs.existsSync(pdfPath)) {
//                 const fileMetadata = await this.uploadFile(pdfPath);
//                 data.document = {
//                     name: fileMetadata.name,
//                     url: fileMetadata.url
//                 };
//             }

//             await this.sutAdapter.sendRequests({
//                 contractId: 'HadithChain',
//                 contractFunction: 'AddHadith',
//                 contractArguments: [JSON.stringify(data)],
//                 readOnly: false
//             });

//         } catch (error) {
//             console.error(`Failed to add Hadith: ${error.message}`);
//             throw new Error(`Failed to add Hadith: ${error.message}`);
//         }
        
//     }
//     async uploadFile(filePath) {
//         const fileBuffer = fs.readFileSync(filePath);
//         const fileData = new Readable();
//         fileData.push(fileBuffer);
//         fileData.push(null); // indicates end of stream

//         const originalFileName = path.basename(filePath);

//         const options = {
//             pinataMetadata: {
//                 name: originalFileName.replace(/\.[^/.]+$/, ''),
//             },
//             pinataOptions: {
//                 cidVersion: 0,
//             },
//         };

//         const result = await pinata.pinFileToIPFS(fileData, options);
//         const fileUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

//         return { name: originalFileName.replace(/\.[^/.]+$/, ''), url: fileUrl };
//     }
// }

// function createWorkloadModule() {
//     return new AddHadithWorkload();
// }

// module.exports.createWorkloadModule = createWorkloadModule;

