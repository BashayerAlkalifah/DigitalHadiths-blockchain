
## Prerequisites

### Software Requirements
Ensure the following tools and their respective versions are installed:

- **cURL**: Latest version  
- **Git**  
- **Docker Engine**: Version 17.06.2-ce or higher  
- **Docker Compose**: Version 1.14 or higher  
- **Go**: Version 1.22
- **Node.js**: Version 10.21 or higher 
- **npm**: Version 6.14.4  
- **Python**: Version 2.7.x  

### Installation Commands
Run the following commands to install the required tools:

#### Install cURL, Node.js, npm, and Python
```bash
sudo apt-get install curl
sudo apt-get install npm
sudo apt-get install python
```

#### Install Node.js using NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install v16.19.0
nvm use v16.19.0
```

#### Install and Configure Docker and Docker Compose
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Resolve permission issues
sudo groupadd docker
sudo usermod -aG docker ${USER}
```

#### Install Go
```bash
sudo apt-get install -y golang-go
```

#### Install Hyperledger Fabric Binaries and Docker Images
```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh
./install-fabric.sh --fabric-version 2.5.5 -c 1.5.7

# Add Fabric binaries to PATH
export PATH=$PATH:/home/ubuntu/fabric-samples/bin
```

---

## Network Architecture

- **Organizations**: 2 (each with one peer)
- **Channel**: Single channel connecting all components
- **Consensus Mechanism**: Raft with three ordering nodes
- **State Database**: CouchDB

---

**Start the Network:**

 **Clone the Repository**  
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

Run the following command to start the Hyperledger Fabric network and API server:
```bash
cd blockchain/scripts
./start.sh
```

**Stop the Network:**

Run the following command to stop the network and clean up resources:
```bash
cd blockchain/scripts
./stop.sh
```

