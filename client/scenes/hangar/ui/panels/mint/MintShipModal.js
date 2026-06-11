import {BaseModal} from '../../components/BaseModal.js';
import {MintShipView} from './MintShipView.js';
import {mintShip} from './logic/mintShip.js';
import {craftShip} from "./logic/craftShip";

const BASE_DESIGN_WIDTH = 1920;
const BASE_DESIGN_HEIGHT = 1080;

export class MintShipModal extends BaseModal {
    constructor(scene, availableShips) {
        const view = new MintShipView(scene, availableShips);
        super(scene, view);

        this.view = view;

        this.tooltip = this.scene.tooltip;
        if (this.tooltip) {
            this.originalTooltipDepth = this.tooltip.depth;
            this.tooltip.setDepth(this.depth + 2);
        }

        if (this.scene.sysMessageContainer) {
            this.originalSysMessageDepth = this.scene.sysMessageContainer.depth;
            this.scene.sysMessageContainer.setDepth(this.depth + 2);
        }

        this.view.on('close-modal', () => this.hide());

        this.view.on('mint-ship', async (shipData) => {
            this.view.setMintingState(true);
            this.scene.sysMessageContainer.addMessage('Waiting for wallet...', 'DEFAULT', null);

            try {
                if (shipData.mintStatus.status === 'CRAFT_ONLY') {
                    await craftShip.call(this.scene, shipData);
                    this.scene.sysMessageContainer.addMessage('Craft successful! Your new ship will appear shortly.', 'SUCCESS');
                } else {
                    await mintShip.call(this.scene, shipData);
                    this.scene.sysMessageContainer.addMessage('Mint successful! Your new ship will appear shortly.', 'SUCCESS');
                }
            } catch (error) {
                console.error("Process failed in modal:", error);

            } finally {
                if (this.scene && this.active) {
                    this.view.setMintingState(false);
                }
            }
        });

        this.on('close', () => {
            if (this.scene && this.scene.sysMessageContainer) {
                this.scene.sysMessageContainer.setDepth(this.originalSysMessageDepth);
                if (this.tooltip) {
                    this.tooltip.setDepth(this.originalTooltipDepth);
                }
            }
        });

        this.centerContent();

        this.show();
    }

    /**
     * ПЕРЕОПРЕДЕЛЕНИЕ метода BaseModal.
     * Рассчитывает масштаб, чтобы окно 1600x800 вписывалось в любой экран.
     */
    centerContent() {

        const widthRatio = this.scene.scale.width / BASE_DESIGN_WIDTH;
        const heightRatio = this.scene.scale.height / BASE_DESIGN_HEIGHT;

        let scaleFactor = Math.min(widthRatio, heightRatio);

        if (this.content) {
            this.content.setScale(scaleFactor);
            this.content.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
        }
    }
}