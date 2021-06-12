let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments,
  getChainId
}) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId()

  const keyHash = networkConfig[chainId].keyHash;
  const vrfCoordinator = networkConfig[chainId].vrfCoordinator;
  const linkTokenAddress = networkConfig[chainId].linkToken;

  const SaberNFT = await deploy('SaberNFT', {
    from: deployer,
    args: [vrfCoordinator, linkTokenAddress, keyHash],
    log: true,
  });
  log('-----------------------------------------------------------------------------------');
  log('The SaberNFT contract has been deployed in the contract address:', SaberNFT.address);
  log('-----------------------------------------------------------------------------------');
  log('To fund your contract with link, copy and run this command: npx hardhat fund-link --contract', SaberNFT.address, '--network', networkConfig[chainId].name);
  log('-----------------------------------------------------------------------------------');
  log('To create and mint a hero: npx hardhat create-hero --contract', SaberNFT.address, '--name <name of hero>', '--seed <user-selected seed>', '--network', networkConfig[chainId].name);
}
