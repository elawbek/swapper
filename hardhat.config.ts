import dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url:
          process.env.ETHEREUM_MAINNET_URL !== undefined
            ? process.env.ETHEREUM_MAINNET_URL
            : "",
        blockNumber: 15568620,
      },
    },
    ethereum: {
      url:
        process.env.ETHEREUM_MAINNET_URL !== undefined
          ? process.env.ETHEREUM_MAINNET_URL
          : "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    goerli_testnet: {
      url:
        process.env.GOERLI_TESTNET_URL !== undefined
          ? process.env.GOERLI_TESTNET_URL
          : "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },

  gasReporter: {
    enabled: false,
    currency: "",
  },

  etherscan: {
    apiKey: process.env.SCAN_API_KEY,
  },
};

export default config;
