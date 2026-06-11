import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const CommunitySection = () => (
    <Section id="community" title="Join the Fleet!">
        <p>
            "One Soul Many Ships" is more than a game. It is an evolving universe with an economy in your hands. Follow
            our announcements, prepare for the mint, and be among the first pilots!
        </p>
        <div className={styles.footerSocials}>
            <a href="https://x.com/SoulShipsGame" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/ic_twitter.png" alt="Twitter"/>
            </a>
            {/* <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
                <img src="/assets/images/ic_discord.png" alt="Discord"/>
            </a> */}
        </div>
    </Section>
);

export default CommunitySection;