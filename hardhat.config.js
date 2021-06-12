/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-web3");
require("hardhat-deploy")
//imports tasks
require("./tasks/accounts")
require("./tasks/balance")
require("./tasks/fund-link")

//PUT THIS IN THE TASK FILE AFTER CREATION
const { create } = require('ipfs-http-client') //https://www.npmjs.com/package/ipfs-http-client
const pinataSDK = require('@pinata/sdk') //https://www.npmjs.com/package/@pinata/sdk#hostNode-anchor


require('dotenv').config() //https://www.npmjs.com/package/dotenv

//connected to .env file
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "infura mainnet endpoint url"
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "infura rinkeby endpoint url"
const KOVAN_RPC_URL = process.env.KOVAN_RPC_URL || "infura kovan endpoint url"
const MNEMONIC = process.env.MNEMONIC || "your mnemonic"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Your etherscan API key"
// optional
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your private key"


module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //   url: MAINNET_RPC_URL
            // }
        },
        localhost: {
        },
        kovan: {
            url: KOVAN_RPC_URL,
            accounts: [PRIVATE_KEY],
            //accounts: { mnemonic: MNEMONIC,},
            saveDeployments: true,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            //accounts: { mnemonic: MNEMONIC, },
            saveDeployments: true,
        },
        ganache: {
            url: 'http://localhost:8545',
            accounts: { mnemonic: MNEMONIC,}
        }
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: ETHERSCAN_API_KEY
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0 // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        feeCollector: {
            default: 1
        }
    },
    solidity: {
        compilers: [
          {
              version: "0.6.6"
          },
          {
              version: "0.4.24"
          }
        ]
    },
    mocha: {
        timeout: 100000
    }
}
