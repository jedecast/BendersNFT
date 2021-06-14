import React from 'react'
import './App.css';
import { ethers } from 'ethers'
import Benders from "./Benders.json"
import { create } from 'ipfs-http-client'
import pinataSDK from '@pinata/sdk'
//this is to make importing from .env work
require('dotenv').config()

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

  // connect to the default IPFS API address http://localhost:5001 -> have to use infura to work in browser, need to investigate later on why
  // https://infura.io/docs/ipfs
  const client = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

  // PINATA -> in order for process.env to work in react, the .env variable has to start with REACT_APP_NAME
  const REACT_APP_PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY
  const REACT_APP_PINATA_SECRET = process.env.REACT_APP_PINATA_SECRET
  const pinata = pinataSDK(REACT_APP_PINATA_API_KEY, REACT_APP_PINATA_SECRET)

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
          //gets name of hero
          const name = await instance.getHeroOverView(index)
            .then((overview) => overview[0].toString())

          //gets heroId for image
          const heroId = await instance.getHeroOverView(index)
            .then((overview) => overview[1].toNumber())
          console.log(tokenId, name, heroId)
          //sets the URI for the
          const uri = await setURI(instance, signer, name, tokenId, heroId)

          setIndex(tokenId)
          setTransactionFinished(true)
          console.log(name, 'HAS BEEN MINTED! URI is:', uri)
          alert(name, 'HAS BEEN MINTED! URI is:', uri)
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

  //On click, will call the requestNewRandomHero() from the contract and mint the hero from name and
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

  //after retrieving the tokenID information from the event listener, it will run this function to create a uri]\
  const setURI = async(_contract, _signer, _name, _tokenId, _heroId) => {
    console.log('Beginning to set URI....')

    const summonerSigner = _contract.connect(_signer)
    //gets hero stats as an array
    const result = await _contract.getHeroStats(_tokenId)
    const stats = result.map((BN) => BN.toNumber())

    //copies the metadata template and plugs in the values
    let heroMetadata = metadataTemple
    heroMetadata['name'] = _name
    heroMetadata['image'] = heroIMG[_heroId]
    heroMetadata['attributes'][0]['value'] = stats[0]
    heroMetadata['attributes'][1]['value'] = stats[1]
    heroMetadata['attributes'][2]['value'] = stats[2]
    heroMetadata['attributes'][3]['value'] = stats[3]
    heroMetadata['attributes'][4]['value'] = stats[4]
    heroMetadata['attributes'][5]['value'] = stats[5]

    console.log(heroMetadata)

    //pins the metadata with the image
    const { path } = await client.add(JSON.stringify(heroMetadata))
    console.log('Pinning CID', path, 'to pinata...')

    //permanent pins the
    await pinata.pinByHash(path).then((result) => {
        //handle results here
        console.log('Pinned to Pinate', result);
    }).catch((err) => {
        //handle error here
        console.log(err);
    })

    const ipfsURI = 'https://ipfs.io/ipfs/' + path

    const setURI = await summonerSigner.setURI(_tokenId, ipfsURI)
    await setURI.wait()
    //NEED TO SETUP ANOTHER EVENT LISTENER? To trigger when ipfs uri is ready to create a get request
    return ipfsURI

  }

  //On click, will get log the hero info to the console
  const getHeroInfo = async() => {
    const result = await contract.getHeroOverView(index)
    const name = result[0]
    const characterID = await result[1].toNumber()
    console.log(name, characterID);
  }

  //On click, will log the heroURI to the console
  const getHeroURI = async() => {
    const result = await contract.getHeroOverView(index)
    const name = result[0]
    const characterID = await result[1].toNumber()
    const uri = await contract.getURI(index)
    console.log(name, characterID, uri)
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
      <button onClick={() => getHeroURI()}>Get Hero URI</button>
    </div>
  );
}


const heroIMG = [
  'https://ipfs.io/ipfs/QmTGX16vaSJarqdumpN8Kigkt7f7K3XFm3b9qusr9Bugni/saber_gilgamesh.jpg',
  'https://ipfs.io/ipfs/QmXWbYAUhfhRoQf4EXYnKoxFXKXY52SBiX7eXet8NWxnNJ/saber_archer.jpg',
  'https://ipfs.io/ipfs/QmdVDfR1RR3auQ9pxfPK43Ac1MfZUTggeb2MsNNeXMZqen/saber_lancer.jpg',
  'https://ipfs.io/ipfs/QmRUSYED2ZDm9mGup6Bkk5q6BPGFDaYFGkJ91nCeB98PCa',
  'https://ipfs.io/ipfs/QmWUTn8j4SUN3JNfvoA9fua4jPbbPFah2mXxgALU2Mc8Vm'
]

const metadataTemple = {
    "name": "",
    "description": "",
    "image": "",
    "attributes": [
        {
            "trait_type": "Strength",
            "value": 0
        },
        {
            "trait_type": "Dexterity",
            "value": 0
        },
        {
            "trait_type": "Constitution",
            "value": 0
        },
        {
            "trait_type": "Intelligence",
            "value": 0
        },
        {
            "trait_type": "Wisdom",
            "value": 0
        },
        {
            "trait_type": "Charisma",
            "value": 0
        },
        {
            "trait_type": "Experience",
            "value": 0
        }
    ]
}

export default App;
