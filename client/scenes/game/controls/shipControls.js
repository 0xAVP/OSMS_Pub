function updateShipAngle(sprite, direction) {
    const MAX_ANGLE = 5;
    const LERP_FACTOR = 0.05;

    let targetAngle = 0;
    if (direction.up) {
        targetAngle = -MAX_ANGLE;
    } else if (direction.down) {
        targetAngle = MAX_ANGLE;
    }

    if (direction.left) {
        targetAngle *= -1;
    }

    const newAngle = Phaser.Math.Linear(sprite.angle, targetAngle, LERP_FACTOR);
    sprite.setAngle(newAngle);
}

function applyPlayerMovement(sprite, shipConfig, direction, deltaSec) {
    const shipSpeed = shipConfig.engine.speed;
    let velocityX = 0;
    let velocityY = 0;

    if (direction.left) velocityX = -shipSpeed;
    else if (direction.right) velocityX = shipSpeed;

    if (direction.up) velocityY = -shipSpeed;
    else if (direction.down) velocityY = shipSpeed;

    if (velocityX !== 0 && velocityY !== 0) {
        const magnitude = Math.sqrt(2);
        velocityX /= magnitude;
        velocityY /= magnitude;
    }

    sprite.body.setVelocity(velocityX, velocityY);
}

export const ShipControls = {

    updateShipAngle,
    applyPlayerMovement
};