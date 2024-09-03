


# docker compose -f ../artifacts/channel/create-certificate-with-ca/docker-compose.yaml   down
# --------------------------------------------------------------------------------------------
docker compose -f ../artifacts/docker-compose.yaml   down 

docker compose -f ../artifacts/docker-composeTry.yaml   down 

docker compose -f ../artifacts/docker-compose-copy.yaml   down 

docker volume prune
docker system prune -a
# -----------------------------------------------------------

