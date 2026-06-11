import React from 'react';
import Section from '../../components/Section';
import styles from '../../WhitepaperPage.module.css';

const ArsenalSection = () => (
    <Section id="gameplay-arsenal" title="The Arsenal: Endless Pursuit of Perfection">
        <p>Modules are the heart of your ship, defining its combat style and effectiveness. These are tradable in-game
            items.</p>
        <div className={styles.highlight}>
            <p><strong>Infinite Potential: The Core of Our Economy</strong></p>
            <ul>
                <li><strong>On Creation (Crafting):</strong> A module's initial stats are randomly generated within a
                    set range. Two identical blueprints will never produce the exact same result.
                </li>
                <li><strong>On Enhancement (Upgrading):</strong> With every upgrade, one of the module's stats is
                    randomly selected to receive a boost. The magnitude of this boost is also random.
                </li>
            </ul>
            <p>
                Crucially, there are <strong>no hard caps</strong> on module levels. Your pursuit of the perfect weapon,
                shield, or engine is truly endless. This system opens up limitless possibilities for customization and
                trade, creating a dynamic economy where even a low-level module with lucky upgrade rolls can become an
                powerful gameplay tool.
            </p>
        </div>
        <p>
            <strong>Dismantling:</strong> Unneeded modules can be disassembled to recover valuable resources in the form
            of "memory banks"—key components for crafting new, more powerful items. This creates a healthy economic
            loop.
        </p>
    </Section>
);

export default ArsenalSection;