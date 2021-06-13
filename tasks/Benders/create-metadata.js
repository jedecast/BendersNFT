//creates meta data json files, sets the name, image, and attributes
//puts it into IPFS and pins it using pinanta

/*
Reference: https://github.com/PatrickAlphaC/dungeons-and-dragons-nft/blob/master/scripts/create-metadata.js
*/

const { create } = require('ipfs-http-client')
const pinataSDK = require('@pinata/sdk');

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


task('create-metadata', "Creates the meta data file on ipfs")
  .addParam('contract', 'The address of the Benders contract that you want to call')
  .setAction(async taskArgs => {
    const contractAddress = taskArgs.contract

    // connect to the default IPFS API address http://localhost:5001
    const client = create()

    // PINATA
    const PINATA_KEY = process.env.PINATA_API_KEY
    const PINATA_SECRET = process.env.PINATA_SECRET
    const pinata = pinataSDK(PINATA_KEY, PINATA_SECRET);

    const Benders = await ethers.getContractFactory('Benders')

    const accounts = await ethers.getSigners();
    const signer = accounts[0];

    const contractInstance = new ethers.Contract(contractAddress, Benders.interface, signer)

    //gets total number of heroes for index
    const total = await contractInstance.getNumberOfHeroes()
      .then((BN) => BN.toNumber())

    //loops total as an index to create metadata
    for (var index = 0; index < total; index++) {
      //gets name of hero
      const name = await contractInstance.getHeroOverView(index)
        .then((overview) => overview[0].toString())

      //gets heroId for image
      const heroId = await contractInstance.getHeroOverView(index)
        .then((overview) => overview[1].toNumber())

      //gets hero stats as an array
      const result = await contractInstance.getHeroStats(index)
      const stats = result.map((BN) => BN.toNumber())


      let heroMetadata = metadataTemple
      heroMetadata['name'] = name
      heroMetadata['image'] = heroIMG[heroId]
      heroMetadata['attributes'][0]['value'] = stats[0]
      heroMetadata['attributes'][1]['value'] = stats[1]
      heroMetadata['attributes'][2]['value'] = stats[2]
      heroMetadata['attributes'][3]['value'] = stats[3]
      heroMetadata['attributes'][4]['value'] = stats[4]
      heroMetadata['attributes'][5]['value'] = stats[5]


      const { path } = await client.add(JSON.stringify(heroMetadata))

      /* !!!!!!!!!!!!!!!!!!!NEED TO DO LATER: PIN THE NAME OF THE CID ALSO!!!!!!!!!!!! */
      console.log('Pinning CID', path, 'to pinata...')
      await pinata.pinByHash(path).then((result) => {
          //handle results here
          console.log(result);
      }).catch((err) => {
          //handle error here
          console.log(err);
      });


      const ipfsURI = 'https://ipfs.io/ipfs/' + path
      const setURI = await contractInstance.setURI(index, ipfsURI)
      await setURI.wait()
      console.log('SUCCESS SETTING URI FOR TOKEN', index, ':', ipfsURI)

    }
  })
