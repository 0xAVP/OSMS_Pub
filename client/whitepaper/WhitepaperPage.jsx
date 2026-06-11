import React from 'react';
import styles from './WhitepaperPage.module.css';

import NavMenu from './components/NavMenu';
import IntroSection from './sections/IntroSection';
import VisionSection from './sections/VisionSection';
import GameplaySection from './sections/GameplaySection';
import EconomySection from './sections/EconomySection';
import TokenomicsSection from './sections/TokenomicsSection';
import TechSection from './sections/TechSection';
import RoadmapSection from './sections/RoadmapSection';
import LivingDocumentSection from './sections/LivingDocumentSection';
import CommunitySection from './sections/CommunitySection';

const WhitepaperPage = () => {

    const sections = [
        {id: 'vision', title: 'Our Vision'},
        {
            id: 'gameplay',
            title: 'Core Gameplay Mechanics',
            children: [
                {id: 'gameplay-echoes', title: 'Echoes & Skills'},
                {id: 'gameplay-spaceships', title: 'Spaceships'},
                {id: 'gameplay-arsenal', title: 'The Arsenal'},
                {id: 'gameplay-parameters', title: 'Ship Parameters'},
                {id: 'gameplay-forge', title: 'The Forge'},
                {id: 'gameplay-battlefield', title: 'The Battlefield'},
                {id: 'gameplay-stagestones', title: 'Stagestones'},
                {id: 'gameplay-leaderboard', title: 'Seasonal Competitions'}
            ]
        },
        {id: 'economy', title: 'The Open Economy'},
        {id: 'tokenomics', title: 'Tokenomics'},
        {id: 'tech', title: 'Technology Stack'},
        {id: 'roadmap', title: 'Roadmap'},
        {id: 'community', title: 'Join the Fleet'},
    ];

    return (
        <div className={styles.whitepaperLayout}>
            <NavMenu sections={sections}/>
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Whitepaper:<br/>One Soul Many Ships</h1>
                    <p className={styles.headerSubtitle}>Welcome to the Frontier</p>
                </header>

                <IntroSection/>
                <VisionSection/>
                <GameplaySection/> {/* Этот компонент теперь рендерит все 5 подсекций */}
                <EconomySection/>
                <TokenomicsSection/>
                <TechSection/>
                <RoadmapSection/>
                <LivingDocumentSection/>
                <CommunitySection/>

            </main>
        </div>
    );
};

export default WhitepaperPage;