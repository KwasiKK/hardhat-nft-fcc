import { utils } from "ethers"
import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains } from "../helper-hardhat-config"

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts } = hre
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // Basic Nft
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicSvgNftMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 1 tokenURI: ${await dynamicSvgNft.tokenURI(1)}`)

    // Random IPFS NFT
    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    // Need to listen for response
    await new Promise<void>(async (resolve) => {
        setTimeout(resolve, 300000) // 5 minute timeout time
        // setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            resolve()
        })
        if (chainId == 31337) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            const subscriptionId = await randomIpfsNft.getSubscriptionId()
            console.log({ subscriptionId, address: randomIpfsNft.address })
            await vrfCoordinatorV2Mock.addConsumer(subscriptionId.toNumber(), randomIpfsNft.address)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        }
    })
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
    // ------------------------------------------------------------
    // const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    // const mintFee = await randomIpfsNft.getMintFee()
    // const randomMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    // const randomMintTxReceipt = await randomMintTx.wait(1)
    // const subscriptionId = await randomIpfsNft.getSubscriptionId()
    // await new Promise<void>(async (resolve, reject) => {
    //     setTimeout(resolve, 300000 * 2)
    //     randomIpfsNft.once("NftMinted", async () => {
    //         resolve()
    //     })
    //     try {
    //         if (developmentChains.includes(network.name)) {
    //             const reqquestId = randomMintTxReceipt.events[1].args.requestId.toString()
    //             const vrfCoordinatorV2Mock = await ethers.getContract(
    //                 "VRFCoordinatorV2Mock",
    //                 deployer
    //             )
    //             await vrfCoordinatorV2Mock.addConsumer(
    //                 subscriptionId.toNumber(),
    //                 randomIpfsNft.address
    //             )
    //             await vrfCoordinatorV2Mock.fulfillRandomWords(reqquestId, randomIpfsNft.address)
    //         }
    //     } catch (error) {
    //         console.log({ error })
    //         reject(error)
    //     }
    //     console.log(`Random IPFS NFT index 0 tokenURI ${await randomIpfsNft.tokenURI(0)}`)
    // })
}

export default mint
mint.tags = ["all", "mint"]
