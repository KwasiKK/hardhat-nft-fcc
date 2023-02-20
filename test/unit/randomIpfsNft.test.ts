import { RandomIpfsNft } from "./../../typechain-types/contracts/RandomIpfsNft"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { assert, expect } from "chai"
import { VRFCoordinatorV2Mock } from "../../../hardhat-smartcontract-lottery-fcc/typechain-types"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Test", async () => {
          const chainId = network.config.chainId!
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
          let randomIpfsNft: RandomIpfsNft
          let subscriptionId: number
          let deployer
          let tokenCounter
          let mintFee
          let dogTokenUris

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              subscriptionId = await randomIpfsNft.getSubscriptionId()
              if (chainId == 31337) {
                  await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
              }
          })

          describe("constructor", async () => {
              it("initializes the random ipfs nft correctly", async () => {
                  // check dogTokenUris
                  //   dogTokenUris = await randomIpfsNft.getTokenCounter()
                  //   assert.equal(dogTokenUris.toString(), "0")

                  // check mintFee
                  mintFee = await randomIpfsNft.getMintFee()
                  assert.equal(mintFee.toString(), networkConfig[chainId]["mintFee"])

                  // check tokenCounter
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "0")

                  // check name and symbol
                  const name = await randomIpfsNft.name()
                  const symbol = await randomIpfsNft.symbol()
                  assert.equal(name, "Doggy")
                  assert.equal(symbol, "DOG")
              })
          })

          describe("requestNft", async () => {
              it("reverts the call if not enough ETH is sent", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NotEnoughFundsToMint"
                  )
              })
              it("emits and event and kicks off a random word request", async function () {
                  await expect(randomIpfsNft.requestNft({ value: mintFee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", async () => {
              //   beforeEach(async () => {
              //       const txResponse = await randomIpfsNft.fulfillRandomWords()
              //       await txResponse.wait(1)
              //   })

              it("it increments the token counter", async () => {
                  //   const originalTokenCounter = await randomIpfsNft.getTokenCounter()
                  //   assert.equal(originalTokenCounter.toNumber().toString(), "1")
              })
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  await new Promise<void>(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenCounter.toString(), "1")

                              const deployerAddress = deployer.address
                              const deployerBalance = await randomIpfsNft.balanceOf(deployerAddress)
                              const owner = await randomIpfsNft.ownerOf("0")

                              assert.equal(deployerBalance.toString(), "1")
                              assert.equal(owner, deployerAddress)

                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })

                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events![1].args!.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          //   describe("withdraw", async () => {
          //       beforeEach(async () => {
          //           const txResponse = await randomIpfsNft.mintNft()
          //           await txResponse.wait(1)
          //       })
          //       it("it increments the token counter", async () => {
          //           const originalTokenCounter = await randomIpfsNft.getTokenCounter()
          //           assert.equal(originalTokenCounter.toNumber().toString(), "1")
          //       })
          //       it("Allows users to mint an NFT, and updates appropriately", async function () {
          //           const tokenURI = await randomIpfsNft.tokenURI(0)
          //           const tokenCounter = await randomIpfsNft.getTokenCounter()

          //           assert.equal(tokenCounter.toString(), "1")
          //           assert.equal(tokenURI, await randomIpfsNft.TOKEN_URI())
          //       })
          //       it("Show the correct balance and owner of an NFT", async function () {
          //           const deployerAddress = deployer.address
          //           const deployerBalance = await randomIpfsNft.balanceOf(deployerAddress)
          //           const owner = await randomIpfsNft.ownerOf("0")

          //           assert.equal(deployerBalance.toString(), "1")
          //           assert.equal(owner, deployerAddress)
          //       })
          //   })
      })
