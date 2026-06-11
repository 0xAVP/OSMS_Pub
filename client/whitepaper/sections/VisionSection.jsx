import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const VisionSection = () => (
    <Section id="vision" title="Our Vision: A New Era of Space Games">
        <p>
            We believe the future of gaming lies in open systems where players truly own their achievements. Traditional
            game economies are "walled gardens," fully controlled by developers. We are building a universe where every
            item can be freely transferred between players, and key assets are your undeniable property.
        </p>
        <p>
            By harnessing the power of the <strong>Base</strong> blockchain, we create a transparent and sustainable
            economy based not on speculation, but on actual gameplay.
        </p>
        <ul className={styles.principlesList}>
            <li><strong>True Ownership of Key Assets:</strong> Your Echoes and Ships are NFTs that you fully own.
                Meanwhile, 99% of all other in-game items, whether resources or powerful modules, are also freely
                tradable between players.
            </li>
            <li><strong>A Deep Crafting System:</strong> Create value with your own hands. Progress from mining basic
                resources to producing unique, high-level modules and ships.
            </li>
            <li><strong>Play-and-Own:</strong> Our philosophy is based on engaging gameplay. Rewards are the natural
                result of your skill, meaningful progress and active participation in an economy that is managed by the
                players themselves.
            </li>
        </ul>
        <div className={styles.highlight}>
            The value of your assets is created through skill and strategic decisions, <strong>not through speculation
            or the artificial inflation of utility tokens.</strong>
        </div>
    </Section>
);

export default VisionSection;