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

  const Benders = await deploy('Benders', {
    from: deployer,
    args: [vrfCoordinator, linkTokenAddress, keyHash],
    log: true,
  });
  log('-----------------------------------------------------------------------------------');
  log('The Benders contract has been deployed in the contract address:', Benders.address);
  log('-----------------------------------------------------------------------------------');
  log('To fund your contract with link, copy and run this command: npx hardhat fund-link --contract', Benders.address, '--network', networkConfig[chainId].name);
  log('-----------------------------------------------------------------------------------');
  log('To create and mint a hero: npx hardhat create-hero --contract', Benders.address, '--name <name of hero>', '--seed <user-selected seed>', '--network', networkConfig[chainId].name);
}
