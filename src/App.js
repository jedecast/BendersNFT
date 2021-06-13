import React from 'react'
import './App.css';
import { ethers } from 'ethers'
import Benders from "./Benders.json";


function App() {
  const [ loaded, setLoaded ] = React.useState(false)
  const [ web3, setWeb3 ] = React.useState(undefined)
  const [ accounts, setAccounts ] = React.useState([])
  const [ contract, setContract ] = React.useState([])
  const [ contractAddress, setContractAddress] = React.useState('')
  const [ signer, setSigner ] = React.useState({})
  const [ name, setName ] = React.useState('')
  const [ seed, setSeed ] = React.useState('')
  const [ transactionFinished, setTransactionFinished ] = React.useState(true);
  const [ loadingMessage, setLoadingMessage ] = React.useState('Transaction Processing...')
  const [ index, setIndex ] = React.useState(0)

  React.useEffect(() => {
    const initEthers = async() => {
      try {
        // Get network provider and web3 instance.
          // CONNECT TO INFURA -> const provider = new ethers.providers.InfuraProvider("ropsten");
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const accountsArray = [await signer.getAddress()]

        const network = await provider.getNetwork()
        const contractAddress = Benders.contracts.Benders.address

        const instance = new ethers.Contract(contractAddress, Benders.contracts.Benders.abi, provider);
        //console.log(instance)

        const numberOfHeroes = await instance.getNumberOfHeroes()
        const _index = numberOfHeroes - 1

        setLoaded(true)
        setWeb3(provider)
        setAccounts(accountsArray)
        setContract(instance)
        setSigner(signer)
        setContractAddress(contractAddress)
        setIndex(_index)


        //I had to put the listener here because if I put it in a different function, the instance wouldn't have been initialized yet
        instance.on('Minted', async(from, to, amount, event) => {
          console.log('------------------------------------------')
          console.log('from', from)
          console.log('------------------------------------------')
          console.log('to', to)
          console.log('------------------------------------------')
          console.log('amount', amount)
          console.log('------------------------------------------')
          console.log('event', event)
          console.log('------------------------------------------')
          console.log('return', amount.args[1])
          const BN = amount.args[1]
          const tokenId = await BN.toNumber()
          const name =  await instance.getHeroOverView(tokenId)
          console.log(tokenId, name)
          setIndex(tokenId)
          setTransactionFinished(true)
          alert(name, 'HAS BEEN MINTED!')
        })


      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    }
    initEthers()
  }, [])

  const requestNewRandomHero = async() => {
    setLoadingMessage('Transaction Processing...')
    setTransactionFinished(false)
    const summonerSigner = contract.connect(signer)
    const requestResult = await summonerSigner.requestNewRandomHero(name, seed)
    setName('')
    setSeed('')
    console.log(requestResult)
    const finished = await requestResult.wait()
        .then((result) => console.log(result))
        .then(() => setLoadingMessage('Transaction completed. Finalizing and retrieving from blockchain....'))
  }

  const getHeroInfo = async() => {
    const result = await contract.getHeroOverView(index)
    const name = result[0]
    const characterID = await result[1].toNumber()
    console.log(name, characterID);
  }


  console.log(accounts)
  return (
    <div className="App">
      <h3>Current Account</h3>
      {accounts[0]}
      <h3>Bender's Contract Address</h3>
      {contractAddress}
      <h3>Request New Hero</h3>
      { transactionFinished
        ? <div>
            <input placeholder='gilgamesh' value={name} onChange={(e) => setName(e.target.value)}/>
            <input placeholder='42069' value={seed} onChange={(e) => setSeed(e.target.value)}/>
            <button onClick={() => requestNewRandomHero()}>Create New Hero</button>
          </div>
        : <div>
            {loadingMessage}
          </div>
      }

      <h3>Request New Hero</h3>
      <button onClick={() => getHeroInfo()}>Get Hero Info</button>
    </div>
  );
}

export default App;
