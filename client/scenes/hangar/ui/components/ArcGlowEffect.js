import Phaser from 'phaser';

const ORBIT_STYLE = {
    color: 0x41C6FF,
    thickness: 1,
    dashLength: 10,
    gapLength: 10,
    alpha: 0.2
};

export class ArcGlowEffect extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        this.graphics = scene.add.graphics();
        this.add(this.graphics);

        scene.add.existing(this);
    }

    /**
     * Рисует или перерисовывает статичные дуги.
     * @param {Phaser.Geom.Ellipse} ellipse - Геометрия эллипса.
     * @param {object} arcBoundaries - Границы дуг (start/end).
     */
    draw(ellipse, arcBoundaries) {
        this.graphics.clear();
        this.graphics.lineStyle(ORBIT_STYLE.thickness, ORBIT_STYLE.color, ORBIT_STYLE.alpha);

        const orbitPoints = ellipse.getPoints(128);
        const pointCount = orbitPoints.length;
        const {leftStart, leftEnd, rightStart, rightEnd} = arcBoundaries;

        const leftArcStartIndex = Math.floor(leftStart * pointCount);
        const leftArcEndIndex = Math.floor(leftEnd * pointCount);
        const rightArcStartIndex = Math.floor(rightStart * pointCount);
        const rightArcEndIndex = Math.floor(rightEnd * pointCount);

        const isIndexInArc = (index, start, end) => {
            return (start < end) ? (index >= start && index <= end) : (index >= start || index <= end);
        };

        const dashStep = (ORBIT_STYLE.dashLength + ORBIT_STYLE.gapLength) / 10;
        for (let i = 0; i < pointCount; i += dashStep) {
            const startIndex = Math.floor(i) % pointCount;
            const endIndex = Math.floor(i + ORBIT_STYLE.dashLength / 10) % pointCount;
            const startPoint = orbitPoints[startIndex];
            const endPoint = orbitPoints[endIndex];

            const inLeftArc = isIndexInArc(startIndex, leftArcStartIndex, leftArcEndIndex) && isIndexInArc(endIndex, leftArcStartIndex, leftArcEndIndex);
            const inRightArc = isIndexInArc(startIndex, rightArcStartIndex, rightArcEndIndex) && isIndexInArc(endIndex, rightArcStartIndex, rightArcEndIndex);

            if (startPoint && endPoint && (inLeftArc || inRightArc)) {
                this.graphics.lineBetween(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            }
        }
    }

    /**
     * Скрывает дуги.
     */
    hide() {
        this.graphics.clear();
    }
}