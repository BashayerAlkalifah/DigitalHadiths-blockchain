

# All steps for running network
# 1)Create Certificate authority for all organization
docker-compose -f ../artifacts/channel/create-certificate-with-ca/docker-compose.yaml   up -d

# created all participants certioficates
cd ../artifacts/channel/create-certificate-with-ca/ && ./create-certificate-with-ca.sh
# 2) Create Artifacts
cd ../ && ./create-artifacts.sh

cd ..
#  3) Run all services(peer, orderer, couchdb)
docker compose -f ../artifacts/docker-compose.yaml   up 


cd ../scripts
# 4) Craete Channel
./createChannel.sh

# 5) Deploy chaincode
./deployChaincode.sh

# 6) Run API
cd ../../app/ && nodemon app
