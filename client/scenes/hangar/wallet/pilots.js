export async function loadPilots() {

    const pilotsMetadata = this.cache.json.get('pilotsMetadata');

    if (!pilotsMetadata) {
        console.error("Ошибка: pilots.json не найден в кэше. Убедитесь, что он предзагружен.");
        this.pilots = [];
        this.hasPilot = false;
        return;
    }

    const hasPilots = await retryRpcCall(() => this.pilotContract.hasAnyToken(this.walletAddress));
    console.log('Has any pilots:', hasPilots);
    const pilotList = [];
    if (hasPilots) {
        const pilotCount = Number(await retryRpcCall(() => this.pilotContract.echoCount()));
        console.log('Total pilot types in contract:', pilotCount);
        for (let id = 0; id < pilotCount; id++) {
            const balance = await retryRpcCall(() => this.pilotContract.balanceOf(this.walletAddress, id));
            if (balance > 0) {

                const metadata = pilotsMetadata[id.toString()];
                const imageKey = `pilot-${id}`;

                if (metadata) {

                    const imageKey = `pilot-${id}`;
                    pilotList.push({
                        id: id,
                        key: imageKey,
                        category: 'pilots',
                        name: metadata.name,
                        description: metadata.description || `Pilot ${id}`,
                        image: imageKey,
                        attributes: metadata.attributes || [],
                        amount: Number(balance)
                    });
                } else {
                    console.warn(`Метаданные для pilot ID ${id} не найдены в локальном файле.`);

                    pilotList.push({
                        id: id,
                        key: imageKey,
                        category: 'pilots',
                        name: `Pilot ${id}`,
                        description: `Pilot ${id}`,
                        image: `pilot-${id}`,
                        attributes: [],
                        amount: Number(balance)
                    });
                }

            }
        }
    }

    this.pilots = pilotList;
    if (pilotList.length > 0) {
        const lastUsedPilot = pilotList.find(p => p.id === this.lastUsedPilotId);
        this.selectedPilot = lastUsedPilot || pilotList[0];
        console.log('Selected pilot:', this.selectedPilot);
    }
    this.hasPilot = pilotList.length > 0;
    console.log('Final pilot list:', this.pilots);
}

async function retryRpcCall(callFunction, maxRetries = 10, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await callFunction();
        } catch (error) {
            console.warn(`RPC call failed on attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`, error.message);
            if (attempt === maxRetries) {
                console.error('All RPC call retries failed. Throwing final error.');
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

export async function loadPilotsAndShips() {
    await loadPilots.call(this);

}