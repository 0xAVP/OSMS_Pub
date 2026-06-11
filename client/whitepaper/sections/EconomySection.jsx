import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const EconomySection = () => (
    <Section id="economy" title="Game Economy: Scarcity & Interdependence">
        <p>
            Unlike models with infinite emission, the OSMS economy is built on a <strong>deficit of production
            capacity</strong> and player interdependence. Value is not printed; it is generated through time, effort,
            and strategic choices.
        </p>

        <h4>1. The Factory System & Opportunity Cost</h4>
        <p>
            The central element of the economy. Each account possesses a limited number of <strong>Production
            Lines</strong>. A line generates nothing while idle. To gain resources, you must assign a task, facing a
            constant strategic dilemma:
        </p>
        <ul>
            <li>
                <strong>Task A (Energy):</strong> The line generates <strong>FUEL</strong>. During this time, it cannot
                craft any items.
            </li>
            <li>
                <strong>Task B (Goods):</strong> The line is busy crafting (OSMS Coins, Components, Modules). It
                produces zero Fuel.
            </li>
        </ul>
        <div className={styles.highlight}>
            <p><strong>The Strategic Choice:</strong> To create value (Items/Coins), you must sacrifice energy
                production. This <strong>Opportunity Cost</strong> ensures that every item in the market is backed by
                real time and sacrificed potential.</p>
        </div>

        <h4>2. The Asset Triangle</h4>
        <p>The economy revolves around three distinct asset types, each with a specific source and purpose:</p>

        <h5>A. FUEL (Time)</h5>
        <ul>
            <li><strong>Source:</strong> Generated only by Factory Lines. Hard-capped by the number of lines and
                physical time (24h/day).
            </li>
            <li><strong>Utility:</strong>
                <ul>
                    <li><strong>Minting (Now):</strong> A required component to refine raw materials into <strong>OSMS
                        Coins</strong>.
                    </li>
                    <li><strong>Combat (Future Update):</strong> Will be required to power active Ship Skills and
                        abilities.
                    </li>
                </ul>
            </li>
            <li><strong>Market Role:</strong> The most in-demand resource. Needed by both Pilots (for battles) and
                Engineers (for production).
            </li>
        </ul>

        <h5>B. RAW MATERIALS & BLUEPRINTS (Activity)</h5>
        <ul>
            <li><strong>Source:</strong> Drops from enemies (PvE). Obtaining them requires active gameplay, risk, and a
                combat-ready ship.
            </li>
            <li><strong>Utility:</strong>
                <ul>
                    <li><strong>Upgrading:</strong> Used to enhance ship modules and improve stats.</li>
                    <li><strong>Crafting:</strong> Essential components for building new items.</li>
                    <li><strong>Minting:</strong> Specific high-value resources are required to mint OSMS Coins.</li>
                </ul>
            </li>
        </ul>

        <h5>C. OSMS COIN (Utility Resource)</h5>
        <ul>
            <li><strong>Formula:</strong> <code>Special Resource + Fuel + Factory Time = OSMS Coin</code></li>
            <li><strong>Utility:</strong> The universal currency for P2P exchange, creating Experimental Ships (NFTs),
                and acquiring specialized supplies.
            </li>
        </ul>

        <h4>3. Market Roles</h4>
        <p>
            The imbalance between resource generation and consumption creates a vibrant Peer-to-Peer market where
            different playstyles support each other:
        </p>
        <ul className={styles.principlesList}>
            <li>
                <strong>The Farmer</strong><br/>
                Focuses lines on Fuel production. Provides the market with energy, selling excess Fuel to purchase
                Resources or Coins for their own progression.
            </li>
            <li>
                <strong>The Grinder</strong><br/>
                Focuses on combat and active play. Accumulates an excess of <strong>Materials and
                Blueprints</strong> but constantly burns Fuel using skills. Sells loot, buys Fuel.
            </li>
            <li>
                <strong>The Industrialist</strong><br/>
                Keeps lines busy crafting Coins or High-End Modules (producing 0 Fuel). Forces them to buy both Fuel and
                Resources from the market to sustain their manufacturing chains.
            </li>
            <li>
                <strong>The Merchant</strong><br/>
                Facilitates the distribution of resources. By balancing supply and demand across different time zones,
                they ensure that Pilots can quickly offload loot and Engineers can find specific parts without delay.
            </li>
        </ul>
    </Section>
);

export default EconomySection;
