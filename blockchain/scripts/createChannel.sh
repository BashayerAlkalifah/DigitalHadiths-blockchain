export PATH=/Users/bshayralkhlyfh/Desktop/t/H/bin

# # imports  
. envVar.sh
. utils.sh
CHANNEL_NAME='hadithchannel'

createChannel(){
    setGlobals 1
    osnadmin channel join --channelID $CHANNEL_NAME \
    --config-block ../channel-artifacts/${CHANNEL_NAME}.block -o localhost:7053 \
    --ca-file $ORDERER_CA \
    --client-cert $ORDERER_ADMIN_TLS_SIGN_CERT \
    --client-key $ORDERER_ADMIN_TLS_PRIVATE_KEY 

    setGlobals 1
    osnadmin channel join --channelID $CHANNEL_NAME \
    --config-block ../channel-artifacts/${CHANNEL_NAME}.block -o localhost:8053 \
    --ca-file $ORDERER_CA \
    --client-cert $ORDERER2_ADMIN_TLS_SIGN_CERT \
    --client-key $ORDERER2_ADMIN_TLS_PRIVATE_KEY 

    setGlobals 1
    osnadmin channel join --channelID $CHANNEL_NAME \
    --config-block ../channel-artifacts/${CHANNEL_NAME}.block -o localhost:9053 \
    --ca-file $ORDERER_CA \
    --client-cert $ORDERER3_ADMIN_TLS_SIGN_CERT \
    --client-key $ORDERER3_ADMIN_TLS_PRIVATE_KEY 

}




joinChannel(){
    FABRIC_CFG_PATH=$PWD/../artifacts/channel/config


    setGlobals 1
    peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block
    
    # setGlobals 3
    # peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block

    setGlobals 2
    peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block
    
    # setGlobals 4
    # peer channel join -b ../channel-artifacts/${CHANNEL_NAME}.block
    
}


createChannel
joinChannel


# CC_NAME="HadithChain"
# FABRIC_CFG_PATH=$PWD/../artifacts/channel/config
# # setGlobals 4
# # peer lifecycle chaincode install ${CC_NAME}.tar.gz
# # echo "===================== Chaincode is installed on peer1.org1 ===================== "
# # setGlobals 4
# #     peer lifecycle chaincode queryinstalled >&log.txt
# #     /bin/cat log.txt
# #     PACKAGE_ID=$(/usr/bin/sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
# #     echo PackageID is ${PACKAGE_ID}
# #     echo "===================== Query installed successful on peer1.org1 on channel  ===================== "

#     chaincodeInvoke() {
#     setGlobals 4
#     peer chaincode invoke -o localhost:7050 \
#         --ordererTLSHostnameOverride orderer.example.com \
#         --tls $CORE_PEER_TLS_ENABLED \
#         --cafile $ORDERER_CA \
#         -C $CHANNEL_NAME -n ${CC_NAME}  \
#         --peerAddresses localhost:1052 --tlsRootCertFiles $PEER1_ORG1_CA \
#         --peerAddresses localhost:2052 --tlsRootCertFiles $PEER1_ORG2_CA \
#         -c '{"function": "HadithExists","Args":["{\"id\":\"a090d7d04142eba08f2c8ba930f1ed4f371ceba6ae66354da72f09bc36963a2a\"}"]}'

# }
# # chaincodeInvoke

# chaincodeQuery() {
#     setGlobals 4
#     peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"function": "HadithExists","Args":["a090d7d04142eba08f2c8ba930f1ed4f371ceba6ae66354da72f09bc36963a2a"]}'
# }
# # chaincodeQuery