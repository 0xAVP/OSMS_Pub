import React from 'react';
import Section from '../../components/Section';

const EchoesSection = () => (
    <Section id="gameplay-echoes" title="Echoes & Skills">
        <h4>Echoes: Your Combat Avatar</h4>
        <p>The Echo is your remotely controlled combat avatar, the core of your game experience. It is an ERC-1155 NFT
            representing the pilot's consciousness.</p>
        <ul>
            <li><strong>Offline Progression:</strong> Your Echo constantly learns and accumulates experience, even while
                you're offline.
            </li>
            <li><strong>Rarity and Bonuses:</strong> Echoes come in various rarities and provide unique bonuses. Some
                exclusive Echoes can only be obtained by participating in special events.
            </li>
            <li><strong>The Key to the Game:</strong> You need at least one Echo to play.</li>
        </ul>

        <h4>Echo Development: The Skill System (Soon)</h4>
        <p>The experience your Echo accumulates will be the foundation for a deep skill system. You will be able to
            specialize your pilot, unlocking new tactical possibilities and increasing your efficiency in both combat
            and production. Stay tuned for announcements!</p>
    </Section>
);

export default EchoesSection;