

# All steps for running network
# 1)Create Certificate authority for all organization
docker compose -f ../artifacts/channel/create-certificate-with-ca/docker-compose.yaml   up -d
# --------------------------------------------------------------------------------------------

# Note: We are considering , we already created all participants certioficates
cd ../artifacts/channel/create-certificate-with-ca/ && ./create-certificate-with-ca.sh
# 2) Create Artifacts
cd ../ && ./create-artifacts.sh

cd ..
#  3) Run all services(peer, orderer, couchdb)
docker compose -f ../artifacts/docker-compose.yaml   up 
# docker compose -f ../artifacts/docker-compose-peer1org1.yaml   up -d
# docker compose -f ../artifacts/docker-compose-peer1org2.yaml   up -d

docker compose -f ../artifacts/docker-compose-copy.yaml   up 
docker compose -f ../artifacts/docker-composeTry.yaml  up 

cd ../scripts
# 4) Craete Channel
./createChannel.sh

# 5) Deploy chaincode
#./deployChaincode.sh

#docker volume prune
# docker system prune -a

#cd ../../app/ && nodemon app

#sudo lsof -i :3000
#kill -9 17719