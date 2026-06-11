import React from 'react';
import Section from '../../components/Section';

const ForgeSection = () => (
    <Section id="gameplay-forge" title="The Forge: Industry & Strategy">
        <p>
            In "One Soul Many Ships," crafting is a strategic commitment of your <strong>Factory Lines</strong>.
        </p>
        <p>
            To create valuable assets, you must manage your time and resources wisely:
        </p>
        <ol>
            <li>
                <strong>Raw Materials:</strong> Retrieved from PvE battles. Better modules require rarer blueprints
                found in deeper stages.
            </li>
            <li>
                <strong>The Cost of Production:</strong> While your factory is configured to craft a Module or
                Component, <strong>it cannot generate Fuel</strong>. You are exchanging potential energy generation for
                physical goods.
            </li>
            <li>
                <strong>Advanced Minting:</strong> To create the universal <strong>OSMS Coin</strong>, you will need to
                combine specific rare resources with a direct infusion of <strong>FUEL</strong>.
            </li>
        </ol>
        <p>
            This system ensures that dedicated Crafters and dedicated Pilots rely on each other to progress.
        </p>
    </Section>
);

export default ForgeSection;
