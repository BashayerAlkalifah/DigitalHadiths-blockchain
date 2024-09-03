. envVar.sh
. utils.sh
# export PATH=/Users/bshayralkhlyfh/Desktop/t/H/bin
# export PATH=/Users/bshayralkhlyfh/Desktop/t/H/bin:$PATH

# Ensure the custom binary directory is in the PATH

# DIRECTORY=/Users/bshayralkhlyfh/Desktop/t/H/bin:$PATH

# Ensure the custom binary directory is in the PATH
export PATH=/Users/bshayralkhlyfh/Desktop/t/H/bin:$PATH

# Set GOROOT to the directory where Go is installed
export GOROOT=/usr/local/opt/go/libexec

# Add Go binary directory to PATH
export PATH=$PATH:$GOROOT/bin

# Set GOPATH to your Go workspace
export GOPATH=/Users/bshayralkhlyfh/go

# Add GOPATH binary directory to PATH
export PATH=$PATH:$GOPATH/bin




presetup() {
    echo Installing npm packages ...
    pushd ../../artifacts/chaincode/javascript
    npm install
    go mod vendor
    popd
    echo Finished installing npm dependencies
}
#presetup

CHANNEL_NAME="hadithchannel"
CC_RUNTIME_LANGUAGE="golang" #golang #node
VERSION="10"
SEQUENCE=10
CC_SRC_PATH="../artifacts/chaincode/golang"
CC_NAME="HadithChain"
CC_POLICY="AND('Org1MSP.peer','Org2MSP.peer')"


packageChaincode() {
    # export PATH=$PATH:/Users/bshayralkhlyfh/go/bin
    # rm -rf ${CC_NAME}.tar.gz
    setGlobals 1
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${VERSION}
    echo "===================== Chaincode is packaged ===================== "
}
#packageChaincode

installChaincode() {
  
    setGlobals 1
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.org1 ===================== "
    # setGlobals 3
    # peer lifecycle chaincode install ${CC_NAME}.tar.gz
    # echo "===================== Chaincode is installed on peer1.org1 ===================== "
    setGlobals 2
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.org2 ===================== "

    # setGlobals 4
    # peer lifecycle chaincode install ${CC_NAME}.tar.gz
    # echo "===================== Chaincode is installed on peer1.org2 ===================== "  

}
#installChaincode

queryInstalled() {
    setGlobals 1
    peer lifecycle chaincode queryinstalled >&log.txt
    /bin/cat log.txt
    PACKAGE_ID=$(/usr/bin/sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo PackageID is ${PACKAGE_ID}
    echo "===================== Query installed successful on peer0.org1 on channel ===================== "
}

#queryInstalled
# --collections-config ./../artifacts/private-data/collections_config.json \
#         --signature-policy "OR('Org1MSP.member','Org2MSP.member')" \

approveForMyOrg1() {
    setGlobals 1
    #set -x
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls \
        --signature-policy ${CC_POLICY} \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --package-id ${PACKAGE_ID} \
        --sequence ${SEQUENCE}
    #set +x

    echo "===================== chaincode approved from org 1 ===================== "

}
 
#queryInstalled
#approveForMyOrg1

checkCommitReadyness() {
    setGlobals 1
    peer lifecycle chaincode checkcommitreadiness \
        --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --signature-policy ${CC_POLICY} \
        --sequence ${SEQUENCE} --output json
    echo "===================== checking commit readyness from org 1 ===================== "
}

#checkCommitReadyness
approveForMyOrg2() {
    setGlobals 2

    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
        --signature-policy ${CC_POLICY} \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --version ${VERSION} --package-id ${PACKAGE_ID} \
        --sequence ${SEQUENCE}

    echo "===================== chaincode approved from org 2 ===================== "
}
#queryInstalled
#approveForMyOrg2

checkCommitReadyness() {

    setGlobals 2
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        --signature-policy ${CC_POLICY} \
        --name ${CC_NAME} --version ${VERSION} --sequence ${SEQUENCE} --output json
    echo "===================== checking commit readyness from org 1 ===================== "
}

#checkCommitReadyness

commitChaincodeDefination() {
    setGlobals 1
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
        --signature-policy ${CC_POLICY} \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        --version ${VERSION} --sequence ${SEQUENCE}
}
#commitChaincodeDefination


queryCommitted() {
    setGlobals 1
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

}
#queryCommitted

chaincodeInvoke() {
    setGlobals 1
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME}  \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c '{"function": "queryApprovalsByHadithId","Args":["963dea06e450d696860e37a56edbb4a6569e9ee7f5a5df6b2196cc9fbae583a0"]}'

}
#  chaincodeInvoke
#http://localhost:5984/_utils/




chaincodeQuery() {
    setGlobals 2
    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"function": "HadithExists","Args":["a090d7d04142eba08f2c8ba930f1ed4f371ceba6ae66354da72f09bc36963a2a"]}'
}
# chaincodeQuery


packageChaincode
installChaincode
queryInstalled
approveForMyOrg1
checkCommitReadyness
approveForMyOrg2
checkCommitReadyness
commitChaincodeDefination
queryCommitted

# chaincodeInvoke
# chaincodeQuery

