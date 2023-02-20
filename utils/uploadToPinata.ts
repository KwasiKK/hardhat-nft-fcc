import path from "path"
import fs from "fs"
import pinataSDK, { PinataPinResponse } from "@pinata/sdk"

const pinataApiKey = process.env.PINATA_API_Key
const pinataApiSecret = process.env.PINATA_API_Secret
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

export async function storeImages(imageFilePath) {
    const fullImagesPath = path.resolve(imageFilePath)
    const files = fs.readdirSync(fullImagesPath)
    console.log({ files })
    let responses = []
    for (let fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        console.log(`File Path: ${fullImagesPath}/${files[fileIndex]}`)
        try {
            console.log("Uploading to IPFS using Pinata")
            const response = await pinata.pinFileToIPFS(readableStreamForFile, {
                pinataMetadata: { name: files[fileIndex] },
            })
            responses.push(response)
            console.log("Done Uploading to IPFS using Pinata", response)
        } catch (error) {
            console.log({ error })
        }
    }
    return { responses, files }
}

export async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log({ error })
    }
    return null
}

export default { storeImages, storeTokenUriMetadata }
