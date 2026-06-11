import React from 'react';
import Section from '../../components/Section';

const ParametersSection = () => (
    <Section id="gameplay-parameters" title="Ship Parameters: Forging Your Edge">
        <p>
            Modules are not just items in slots. They are the DNA of your ship, defining its character and combat
            behavior. In "One Soul Many Ships," there is no single correct path to victory. Success lies in finding
            synergy between parameters, allowing you to create a unique combat machine perfectly suited to your
            playstyle.
        </p>
        <p>
            All parameters can be broadly categorized into three key archetypes:
        </p>
        <ul>
            <li><strong>Firepower:</strong> The ability to quickly and effectively eliminate opponents.</li>
            <li><strong>Survivability:</strong> The capacity to withstand massive attacks and stay in the fight.</li>
            <li><strong>Maneuverability:</strong> The art of avoiding damage and controlling the battlefield.</li>
        </ul>

        <h4>Key Parameters</h4>

        <h5>Engine (Maneuverability & Energy)</h5>
        <ul>
            <li><strong>Speed:</strong> Determines your ship's base movement speed, allowing you to take advantageous
                positions and evade fire.
            </li>
            <li><strong>Evasion:</strong> The key parameter for agile, "glass cannon" builds. It provides a chance
                to <strong>completely avoid</strong> damage from enemy projectiles. High evasion can make you immune to
                stray hits.
            </li>
            <li><strong>Energy:</strong> The capacity and regeneration rate of energy, which is required for firing
                weapons.
            </li>
        </ul>

        <h5>Shield & Armor (Survivability)</h5>
        <ul>
            <li><strong>Shield:</strong> Your first line of defense. It absorbs all types of damage and can regenerate
                on its own out of combat, but depletes quickly under heavy fire.
            </li>
            <li><strong>Armor:</strong> The second line of defense that takes a hit when the shield is down. Armor does
                not regenerate during combat.
            </li>
            <li><strong>Absorption:</strong> A unique property of armor. It provides a chance to <strong>significantly
                reduce</strong> incoming damage by a flat amount. This is the cornerstone of "tank" builds, allowing you
                to endure even the most powerful attacks.
            </li>
        </ul>

        <h5>Weapons (Firepower)</h5>
        <ul>
            <li><strong>Damage & Fire Rate:</strong> The foundation of your damage per second (DPS). The balance between
                high single-shot damage and frequency of fire is key to effectiveness.
            </li>
            <li><strong>Critical Damage (Chance & Modifier):</strong> The cornerstone of "damage-dealer" builds.
                **Critical Chance** determines the probability, and **Critical Modifier** dictates how much your damage
                is multiplied on a critical hit.
            </li>
        </ul>

        <h4>Synergy and the Economy</h4>
        <p>
            Each of these parameters is not just a number but a variable in the equation of your victory. Recall the
            core principle of our Arsenal: module stats are generated and enhanced randomly. The endless pursuit of
            perfection for a module with the ideal roll for "Evasion" or "Critical Chance" is a core objective and a
            primary driver of our open, player-driven economy.
        </p>
    </Section>
);

export default ParametersSection;
