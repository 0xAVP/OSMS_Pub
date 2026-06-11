export function updateUI(width, height) {

    this.adjustedWidth = width;
    this.adjustedHeight = height;

    this.uiElements.forEach(element => {
        if (element.type === 'Image' && element.texture.key === 'hangar-bg') {
            element.displayWidth = this.adjustedWidth;
            element.displayHeight = this.adjustedHeight;
        }
    });

    const containers = [
        {container: this.navContainer, update: this.updateNavContainer},
        {container: this.deskContainer, update: this.updateDeskContainer},
        {container: this.shipContainer, update: this.updateShipContainer},
        {container: this.sysMessageContainer, update: this.updateSysMessageContainer}
    ];

    containers.forEach(({container, update}) => {
        if (container && update) {
            update.call(this, this.adjustedWidth, this.adjustedHeight);
        } else {
            console.warn(`Skipping update for container: ${container ? 'update function missing' : 'container missing'}`);
        }
    });

    if (this.deskContainer) {
        console.log('Hangar updateUI() - deskContainer FINAL state:', {
            x: this.deskContainer.x,
            y: this.deskContainer.y,
            scale: this.deskContainer.scale,
            visible: this.deskContainer.visible,
            alpha: this.deskContainer.alpha
        });
    }

}