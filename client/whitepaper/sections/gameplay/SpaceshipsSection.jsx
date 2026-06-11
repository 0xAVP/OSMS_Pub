import React from 'react';
import Section from '../../components/Section';
import styles from '../../WhitepaperPage.module.css';

const SpaceshipsSection = () => (
    <Section id="gameplay-spaceships" title="Spaceships: Instruments of Power">
        <p>
            Ships are your combat machines, each a unique ERC-721 NFT. <strong>A ship is required for combat, but it is
            not mandatory if you prefer to focus on crafting or market exchange.</strong>
        </p>

        <h4>Core Features</h4>
        <ul>
            <li><strong>A Diverse Fleet:</strong> From fast and agile fighters like the "Nebular" to heavily armored
                dreadnoughts like the "Guardian".
            </li>
            <li><strong>Deep Customization:</strong> A ship's destiny is in your hands. Equip it with modules in
                specialized slots: Weapon, Shield, Armor, Engine and extra slots for unique abilities.
            </li>
            <li><strong>Accessibility:</strong> Get your first ship <strong>for free</strong> when you mint an Echo!
                Others can be minted or purchased from other players.
            </li>
        </ul>

        <h4>Ship Classes & Acquisition</h4>
        <p>
            The fleet is divided into two distinct classes, differing in their origin and engineering potential:
        </p>

        <h5>1. Standard Series (The Backbone)</h5>
        <p>
            Reliable, mass-produced combat vessels designed to form the core of any fleet.
        </p>
        <ul>
            <li><strong>Acquisition:</strong> Minted directly via the Orbital Shipyard using <strong>$OSMS
                Tokens</strong>.
            </li>
            <li><strong>Characteristics:</strong> These ships possess balanced, fixed baseline statistics suitable for
                most combat missions.
            </li>
        </ul>

        <h5>2. Experimental Series (The Pinnacle)</h5>
        <p>
            Advanced prototypes created through complex engineering. These ships represent the cutting edge of
            technology.
        </p>
        <ul>
            <li><strong>Assembly Requirements:</strong> Constructing an Experimental ship requires <strong>OSMS
                Coins</strong> combined with a specialized <strong>Hull Assembly</strong>.
                <ul>
                    <li><em>Note:</em> A Hull is not found in one piece; it must be assembled from parts obtained
                        through <strong>high-tier PvE combat, special events, or complex crafting</strong>.
                    </li>
                </ul>
            </li>
            <li><strong>Dynamic Potential (RNG):</strong> Unlike Standard ships, Experimental vessels are not static.
                Upon completion of the minting process, the ship's core characteristics (Hull Integrity, Energy
                Capacity...) are generated randomly from an elite pool. This allows for the creation of unique
                "God-Roll" ships that significantly outperform standard models.
            </li>
        </ul>
    </Section>
);

export default SpaceshipsSection;
