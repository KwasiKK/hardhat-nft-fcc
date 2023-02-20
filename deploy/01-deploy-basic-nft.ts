import { network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains } from "../helper-hardhat-config"
import verify from "../utils/verify"

const deployBasicNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("--------------------------------------------------")
    const args = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        logs: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying_ _ _ _")
        await verify(basicNft.address, args)
    }
    log("-----------------------DONE---------------------------")
}

export default deployBasicNft
deployBasicNft.tags = ["all", "BasicNft"]
