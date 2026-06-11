import React from 'react';
import Section from '../../components/Section';

const StagestonesSection = () => (
    <Section id="gameplay-stagestones" title="Stagestones: Progression & Access">
        <p>
            The Stagestone system is a fundamental gameplay loop designed to reward mastery and allow flexible
            progression.
        </p>

        <h4>1. Acquisition</h4>
        <p>
            Stagestones are consumable artifacts obtained in two ways:
        </p>
        <ul>
            <li>
                <strong>In Combat:</strong> Stones drop upon defeating Bosses. The tier of the stone corresponds to the
                Stage difficulty (e.g., Stages 5-9 drop Tier 1).
                <ul>
                    <li><strong>Bonus Reward:</strong> Victories against bosses (from Stage 5+) guarantee one Stone with
                        a chance for a second bonus Stone.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Via Exchange:</strong> Stagestones are transferable. Beginners can exchange lucky drops to
                accelerate their ship development, while veterans can acquire them to skip early levels.
            </li>
        </ul>

        <h4>2. Functionality</h4>
        <ul>
            <li>
                <strong>Activation:</strong> Using a Stone in the Hangar consumes it and grants a one-time "Launch
                Access" buff.
            </li>
            <li>
                <strong>Mission Start:</strong> The next mission automatically begins at the high difficulty Stage
                corresponding to the used Stone.
            </li>
        </ul>

        <h4>3. Strategic Value</h4>
        <ul>
            <li><strong>Time Management:</strong> Jump directly to challenging content without grinding through easy
                levels.
            </li>
            <li><strong>Resource Access:</strong> Immediate access to Stages with better drop rates for rare Blueprints.
            </li>
            <li><strong>Community Interaction:</strong> Stagestones act as a bridge between new players and endgame
                veterans, facilitating resource flow.
            </li>
        </ul>
    </Section>
);

export default StagestonesSection;
