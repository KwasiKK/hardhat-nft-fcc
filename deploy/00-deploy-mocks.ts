import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium, it costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // Link per gas, calculated val
const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    // If we are on a local development network, we need to deploy mocks!
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })

        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks Deployed!")
        log("----------------------------------")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log("Please run `yarn hardhat console` to interact with the deployed smart contracts!")
        log("----------------------------------")
    }
}
export default deployMocks
deployMocks.tags = ["all", "mocks"]
