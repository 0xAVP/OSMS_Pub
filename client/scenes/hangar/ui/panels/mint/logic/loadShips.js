import {getShipMintStatus} from './mintingLogic.js';

const SHIP_TYPE_NAMES = {
    0: 'Nebular',
    1: 'Horizon',
    2: 'Guardian',
    3: 'Hypercon',
    4: 'Cerberus',
    5: 'Scopus',
    6: 'Leviathan',
    7: 'Celestial'
};

export async function loadAvailableShipsForMint() {
    console.log('Starting loadAvailableShipsForMint...');
    try {
        const shipTypeCount = Number(await this.shipNFTContract.shipTypeCount());
        console.log('Total ship types in contract:', shipTypeCount);

        const shipPromises = [];

        for (let id = 0; id < shipTypeCount; id++) {
            const promise = async () => {
                const shipTypeData = await this.shipNFTContract.shipTypes(id);

                if (!shipTypeData.isActive) {
                    return null;
                }

                const shipInfo = {
                    id: id,
                    name: SHIP_TYPE_NAMES[id] || `Ship #${id}`,
                    mintPrice: shipTypeData.mintPrice,
                    craftPrice: shipTypeData.craftPrice,
                    isActive: shipTypeData.isActive,
                    craftableOnly: shipTypeData.craftableOnly,
                };

                shipInfo.mintStatus = await getShipMintStatus(this, shipInfo);

                return shipInfo;
            };
            shipPromises.push(promise());
        }

        const results = await Promise.all(shipPromises);
        this.availableShips = results.filter(ship => ship !== null);

        console.log('Available ships (including craft-only) with mint status:', this.availableShips);

    } catch (error) {
        console.error('Error while loading available ships:', error);
        this.availableShips = [];
    }
}