import React from 'react';
import Section from '../components/Section';

const TechSection = () => (
    <Section id="tech" title="Technology Stack">
        <ul>
            <li><strong>Blockchain:</strong> <strong>Base</strong> for the main network. Smart contracts are written in
                Solidity (ERC-721 standard for Ships and ERC-1155 for Echoes).
            </li>
            <li><strong>Client:</strong> <strong>React</strong> for the hangar interface and <strong>Phaser
                3</strong> for the dynamic gameplay.
            </li>
            <li><strong>Backend:</strong> Our backend is designed for high performance and scalability. It manages
                real-time game sessions, ensures the persistence of player data, validates all player actions to protect
                against cheating, and securely interacts with the blockchain to verify NFT assets.
            </li>
        </ul>
    </Section>
);

export default TechSection;