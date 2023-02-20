import fs from "fs"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import verify from "../utils/verify"

const deployDynamicSvgNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId: number = network.config.chainId!
    log("--------------------------------------------------")

    let ethUsdPriceFeedAdress

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAdress = EthUsdAggregator.address
    } else {
        ethUsdPriceFeedAdress = networkConfig[chainId].ethUsdPriceFeed
    }

    const lowSvg = await fs.readFileSync("./images/dynamicNft/angry.svg", { encoding: "utf8" })
    const highSvg = await fs.readFileSync("./images/dynamicNft/smile.svg", { encoding: "utf8" })
    const args = [ethUsdPriceFeedAdress, lowSvg, highSvg]
    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        logs: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`DynamicSvgNft deployed at ${dynamicSvgNft.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, args)
    }
    log("--------------------------DONE--------------------------")
}

export default deployDynamicSvgNft
deployDynamicSvgNft.tags = ["all", "dynamicSvgNft", "main"]
