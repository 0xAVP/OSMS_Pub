import {updateUI} from './updateUI.js';

export function selectPilot(direction = 1) {
    if (!this.pilots || this.pilots.length === 0) {
        console.error('No pilots available to select!');
        return;
    }

    const currentIndex = this.pilots.findIndex(p => p.id === this.selectedPilot?.id);
    const nextIndex = (currentIndex + direction + this.pilots.length) % this.pilots.length;
    this.selectedPilot = this.pilots[nextIndex];

    if (!this.selectedPilot.image) {
        console.error('Selected pilot has no image property!');
        return;
    }

    updateUI.call(this, this.adjustedWidth, this.adjustedHeight);
}

export function selectShip(direction = 1) {
    if (!this.ships || this.ships.length === 0) {
        console.error('No ships available to select!');
        return;
    }
    console.log('Current selected ship:', this.selectedShip);
    const currentIndex = this.ships.findIndex(s => s.shipId === this.selectedShip?.shipId);
    console.log('Current index:', currentIndex);
    const nextIndex = (currentIndex + direction + this.ships.length) % this.ships.length;
    console.log('Next index:', nextIndex, 'Next ship:', this.ships[nextIndex]);
    this.selectedShip = this.ships[nextIndex];

    this.events.emit('shipChanged', this.selectedShip);
    updateUI.call(this, this.adjustedWidth, this.adjustedHeight);
}