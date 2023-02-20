import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
// import verify from "../utils/verify"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"
import verify from "../utils/verify"
import { storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata"

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("3")
const imagesLocation = "./images"
let tokenUris = [
    "ipfs://Qmdo4vEHQevMJ8C2emkDzabYh8tSqTmTePR4zMELaTGPQi",
    "ipfs://QmccgQ9U7s2Ppw5kQQqEnsuUbprMNCWJPy2XAfTD82PJZp",
    "ipfs://QmU18P4PhZHgNbU9RQgqhT3KNyQoFGVC18FqkP2uGNKYga",
]
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [{ trait_type: "Cuteness", value: 100 }],
}

const deployRandomIpfsNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId: number = network.config.chainId!
    let vrfCoordinatorV2Address, subscriptionId
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const mintFee = networkConfig[chainId]["mintFee"] || ethers.utils.parseEther("0.01")

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }
    // const dogTokenUris = [
    //     "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
    //     "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    //     "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
    // ]

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        console.log({ vrfCoordinatorV2Address })
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    log("----------------------------------------------------")
    log("Deploying RandomIpfsNft and waiting for confirmations...")
    //

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane,
        callbackGasLimit,
        tokenUris,
        mintFee,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    })
    log(`RandomIpfsNft deployed at ${randomIpfsNft.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    }
    log("--------------------------DONE--------------------------")
}

const handleTokenUris = async () => {
    tokenUris = []
    // store image in IPFS
    // store metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)

    console.log("Starting for loop to upload metadata", { imageUploadResponses })
    for (const imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `A cute ${tokenUriMetadata.name} puppy`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading tokenUriMetadata ${tokenUriMetadata.name}`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs uploaded :)", { tokenUris })
    return tokenUris
}

export default deployRandomIpfsNft
deployRandomIpfsNft.tags = ["all", "randomIpfsNft", "main"]
