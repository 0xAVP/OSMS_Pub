export function toggleFullscreen() {
    if (!this.game.canvas || !document.body.contains(this.game.canvas)) {
        console.error('Canvas unavailable or not in DOM, cannot toggle fullscreen');
        return;
    }

    if (this.scale.isFullscreen) {
        console.log('Attempting to exit fullscreen, current state:', this.scale.isFullscreen);
        this.scale.stopFullscreen();
        console.log('Requested exit from API fullscreen');
    } else {
        try {
            this.scale.startFullscreen();
            console.log('Requested enter API fullscreen');
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    }
}