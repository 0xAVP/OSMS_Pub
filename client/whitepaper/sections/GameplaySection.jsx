import React from 'react';

import EchoesSection from './gameplay/EchoesSection';
import SpaceshipsSection from './gameplay/SpaceshipsSection';
import ArsenalSection from './gameplay/ArsenalSection';
import ForgeSection from './gameplay/ForgeSection';
import BattlefieldSection from './gameplay/BattlefieldSection';
import StagestonesSection from './gameplay/StagestonesSection';
import ParametersSection from './gameplay/ParametersSection';
import LeaderboardSection from './gameplay/LeaderboardSection';

const GameplaySection = () => (
    <>
        <section id="gameplay" style={{paddingTop: '80px', marginTop: '-80px'}}></section>

        <EchoesSection/>
        <SpaceshipsSection/>
        <ArsenalSection/>
        <ParametersSection/>
        <ForgeSection/>
        <BattlefieldSection/>
        <StagestonesSection/>
        <LeaderboardSection/>

    </>
);

export default GameplaySection;