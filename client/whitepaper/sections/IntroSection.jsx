import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const IntroSection = () => (
    <Section id="intro"
             title='"One Soul Many Ships" is a multiplayer 2D space shooter with an open, player-driven economy built on Web3 technology.'>
        <p>
            You are a pilot, stationed at your starbase. From here, you remotely connect to your <strong>Echo</strong>—a
            combat avatar that becomes the soul of your ship in the heat of battle.
        </p>
        <p>
            You choose your own path: become a legendary fighter, a brilliant industrialist, or an influential trader.
            Our core gameplay loop is simple yet engaging:
        </p>
        <p className={styles.highlight}>
            <strong>Fight. Collect. Craft. Upgrade. Exchange.</strong>
        </p>
        <p>
            We are building a universe for strategists, combatants, industrialists and economists, where skill and
            thoughtful decisions are rewarded with <strong>true asset ownership</strong>.
        </p>
    </Section>
);

export default IntroSection;
