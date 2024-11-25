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
