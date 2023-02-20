import { BasicNft } from "./../../typechain-types/BasicNft"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { Address } from "hardhat-deploy/dist/types"
import { assert, expect } from "chai"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Test", async () => {
          let basicNft: BasicNft
          let deployer

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", async () => {
              it("initializes the basic nft correctly", async () => {
                  const tokenCounter = await basicNft.getTokenCounter()
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  assert.equal(name, "Doggy")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("mintNft", async () => {
              beforeEach(async () => {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)
              })
              it("it increments the token counter", async () => {
                  const originalTokenCounter = await basicNft.getTokenCounter()
                  assert.equal(originalTokenCounter.toNumber().toString(), "1")
              })
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tokenURI = await basicNft.tokenURI(0)
                  const tokenCounter = await basicNft.getTokenCounter()

                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
              it("Show the correct balance and owner of an NFT", async function () {
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)
                  const owner = await basicNft.ownerOf("0")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployerAddress)
              })
          })
      })
