class EntityManager {
    constructor() {
        this.nextEntityId = 0;
        this.entityComponentSignatures = new Map();
    }

    createEntity() {
        const entityId = this.nextEntityId++;
        this.entityComponentSignatures.set(entityId, 0);
        return entityId;
    }

    destroyEntity(entityId) {

        if (this.entityComponentSignatures.has(entityId)) {
            this.entityComponentSignatures.delete(entityId);
        }
    }
}

module.exports = EntityManager;