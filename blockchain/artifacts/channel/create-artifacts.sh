

CHANNEL_NAME="hadithchannel"

echo $CHANNEL_NAME
export PATH=/Users/bshayralkhlyfh/Desktop/t/H/bin

# Generate Channel Genesis block
configtxgen -profile ThreeOrgsApplicationGenesis -configPath . -channelID $CHANNEL_NAME  -outputBlock ../../channel-artifacts/$CHANNEL_NAME.block

