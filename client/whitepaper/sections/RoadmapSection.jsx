import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const RoadmapSection = () => (
    <Section id="roadmap" title="Roadmap">
        <div className={styles.roadmap}>
            <div className={styles.roadmapItem}>
                <h4>Phase 1: Foundation [February 2025] [Completed]</h4>
                <ul>
                    <li>Project architecture development.</li>
                    <li>Smart contract creation for Echoes and Ships.</li>
                    <li>Implementation of the core gameplay loop: combat, loot, craft, upgrade, mail.</li>
                    <li>Ability to craft spaceships - NFTs.</li>
                </ul>
            </div>
            <div className={styles.roadmapItem}>
                <h4>Phase 1.5: Pre-Alpha Test [December 2025] [Completed]</h4>
                <ul>
                    <li><strong>Season 0:</strong> Leaderboards with valuable prizes for early adopters.</li>
                </ul>
            </div>
            <div className={styles.roadmapItem}>
                <h4>Phase 2: Launch [Q1 2026]</h4>
                <ul>
                    <li><strong>Alpha Test Launch - BASE MAINNET</strong></li>
                    <li><strong>Gifts</strong> for the early adopters</li>
                    <li><strong>Season 1:</strong> Leaderboards with valuable prizes for alpha testers.</li>
                    <li><strong>Public mint</strong> of Echoes and Ships.</li>
                    <li><strong>The beginning</strong> of the 1st epoch of $OSMS mining.</li>
                    <li><strong>Referral</strong> system</li>
                </ul>
            </div>
            <div className={styles.roadmapItem}>
                <h4>Phase 3: Universe Expansion</h4>
                <ul>
                    <li>Introduction of the skill system for Echoes.</li>
                    <li>Launch of the in-game marketplace.</li>
                    <li>Addition of new ship types and modules.</li>
                </ul>
            </div>
            <div className={styles.roadmapItem}>
                <h4>Phase 4: Clan System</h4>
                <ul>
                    <li>Introduction of a system for players to form clans, cooperate, and compete.</li>
                </ul>
            </div>
            <div className={styles.roadmapItem}>
                <h4>Phase 5:</h4>
                <ul>
                    <li>Soon...</li>
                </ul>
            </div>
        </div>
    </Section>
);

export default RoadmapSection;