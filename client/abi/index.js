import shipArtifact from './OSMSShipNFT.json';
import echoArtifact from './OSMSEchoNFT.json';
import whitelistArtifact from './OSMSWLManager.json';
import shipManagerArtifact from './OSMSShipManager.json';
import tokenMinterArtifact from './OSMSTokenMinter.json';
import osmsTokenContract from './OSMSToken.json';

export const ABIs = {
    ship: shipArtifact.abi,
    pilot: echoArtifact.abi,
    whitelistManager: whitelistArtifact.abi,
    shipManager: shipManagerArtifact.abi,
    tokenMinter: tokenMinterArtifact.abi,
    tokenContract: osmsTokenContract.abi
};