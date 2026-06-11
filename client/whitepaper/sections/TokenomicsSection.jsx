import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const TokenomicsSection = () => (
    <Section id="tokenomics" title="OneSoulManyShips (OSMS) Token Economy">

        <h4>1. Core Pillars</h4>
        <ul>
            <li><strong>Fair Distribution:</strong> 100% of the initial supply is distributed through gameplay
                interaction. There is no pre-mine and no hidden allocation for early backers.
            </li>
            <li><strong>Time-Gated Economy:</strong> Token generation is limited not only by mathematical difficulty but
                also by physical time (Fuel production). Progress requires dedication; it cannot be instantly "rushed"
                without community interaction.
            </li>
            <li><strong>Opportunity Cost:</strong> Players constantly face a choice: produce a resource or process it.
                You cannot do everything simultaneously.
            </li>
        </ul>

        <h4>2. Token Specs</h4>
        <ul>
            <li><strong>Ticker:</strong> $OSMS</li>
            <li><strong>Network:</strong> Base (L2 Ethereum)</li>
            <li><strong>Supply Model:</strong> Elastic Utility (responding to game activity).</li>
            <li><strong>Distribution Method:</strong> 100% Player-Driven.</li>
        </ul>

        <h4>3. The Epoch System (Dynamic Difficulty)</h4>
        <p>A mechanism designed to stabilize the ecosystem and reflect the growing complexity of the universe.</p>
        <ul>
            <li><strong>Type:</strong> Progressive Difficulty.</li>
            <li><strong>Step Size:</strong> <strong>1,000,000 tokens</strong> minted.</li>
            <li><strong>Logic:</strong> As the ecosystem expands, refining raw Coin into Token becomes more
                resource-intensive.
                <ul>
                    <li><em>Epoch 1:</em> 1 OSMS Token costs 1 OSMS Coin to mint.</li>
                    <li><em>Epoch 2:</em> 1 OSMS Token costs 2 OSMS Coins to mint.</li>
                    <li>...</li>
                    <li><em>Epoch N:</em> 1 Token = N Coins (Linear difficulty growth).</li>
                </ul>
            </li>
            <li><strong>Effect:</strong> This mimics the natural scarcity of resources in an expanding universe. Early
                explorers find resources easily, while later fleets must invest more effort to achieve the same result.
            </li>
        </ul>

        <h4>4. The Bridge Logic</h4>
        <p>The gateway between the Game State (Off-chain) and the Blockchain (On-chain).</p>

        <h5>A. Minting (Extract to Chain)</h5>
        <ul>
            <li><strong>Process:</strong> Refining <code>OSMS Coins</code> -&gt; <code>$OSMS Tokens</code>.</li>
            <li><strong>Daily Cap:</strong> Maximum <strong>10,000 Tokens</strong> per wallet per day to prevent
                ecosystem overload.
            </li>
            <li><strong>Conversion Ratio:</strong> <code>Coins / Epoch Number</code>.</li>
            <li><strong>Allocation:</strong>
                <ul>
                    <li><strong>10%</strong> — <strong>Protocol Fee</strong></li>
                    <li><strong>90%</strong> — <strong>To Player Wallet</strong></li>
                </ul>
            </li>
        </ul>

        <h5>B. Injection (Bridge to Game)</h5>
        <ul>
            <li><strong>Process:</strong> Bridging <code>$OSMS Tokens</code> -&gt; Receiving <code>OSMS Coins</code>.
            </li>
            <li><strong>Conversion Ratio:</strong> <code>Tokens * Epoch Number</code>.</li>
            <li><strong>Allocation:</strong>
                <ul>
                    <li><strong>10%</strong> — <strong>Protocol Fee</strong></li>
                    <li><strong>90%</strong> — <strong>PERMANENTLY REMOVED</strong> from supply.</li>
                </ul>
            </li>
            <li><strong>Credit:</strong> The player receives in-game credits (Coins) equivalent to the removed tokens.
            </li>
        </ul>
        <div className={styles.highlight}>
            <p><strong>Important:</strong> Bridging into the game is a "One-Way Ticket". Tokens are removed from the
                blockchain supply. The received Coins are consumed for in-game services, creating a deflationary
                pressure on the external supply.</p>
        </div>

        <h4>5. Token Utility & Sinks</h4>
        <p>The token serves as a utility connector for both internal game mechanics and external ownership.</p>

        <h5>A. In-Game Utility (Via Injection)</h5>
        <p>Bridging tokens provides the player with <code>OSMS Coins</code> for three key operational goals:</p>
        <ol>
            <li><strong>Resource Exchange:</strong> Acquiring scarce resources and Fuel from other players via the P2P
                system.
            </li>
            <li><strong>Shipyard:</strong> Funding the construction of Experimental Ships.</li>
            <li><strong>Supply Depot:</strong> Acquiring auxiliary consumables.</li>
        </ol>
        <div className={styles.highlight}>
            <p><strong>Fair Play Principle:</strong> The project does not sell "victory". Injecting tokens acts as a
                time-saver, allowing players to acquire the currency portion of costs instantly. However, creating
                top-tier hardware still requires unique <strong>gameplay-only</strong> components (trophies) that cannot
                be bought, only earned.</p>
        </div>

        <h5>B. On-Chain Utility</h5>
        <p>Direct interaction with the smart contracts without entering the game client.</p>
        <ul>
            <li><strong>Acquisition of Standard Ships:</strong>
                <ul>
                    <li><strong>Mechanic:</strong> Minting a standard ship NFT using <code>$OSMS Token</code>.</li>
                    <li><strong>Allocation:</strong>
                        <ul>
                            <li><strong>50%</strong> — <strong>Removed from Supply</strong>.</li>
                            <li><strong>50%</strong> — <strong>Protocol Revenue</strong></li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>

        <h4>6. Sustainability & Team Funding</h4>
        <ul>
            <li><strong>Bootstrap Model (No VC):</strong> The project intentionally refuses venture capital or private
                presales to ensure fair distribution. There are no external obligations to investors.
            </li>

            {/* --- ИЗМЕНЕНИЯ НИЖЕ (SALES -> ISSUANCE/MINTING) --- */}
            <li><strong>Protocol Revenue:</strong> The project is sustained by <strong>consolidated Protocol Fees and
                Asset Issuance</strong>. This includes, but is not limited to:
                <ul>
                    <li>Bridge Fees (10%).</li>
                    <li>Proceeds from NFT Ship Minting Events (e.g., 50%).</li>
                    <li>Future marketplace commissions or event pass issuance.</li>
                </ul>
            </li>
            {/* ---------------------------------------------------- */}

            <li><strong>Discretionary Use:</strong> All funds collected by the Protocol are legally treated as project
                revenue. They are utilized at the <strong>team's sole discretion</strong> to cover all necessary
                expenses, including infrastructure, marketing campaigns, team sustainment (salaries/living costs), and
                further game development.
            </li>
        </ul>

        <h4>7. Security & Transparency</h4>
        <p>The economic model is enforced by immutable code:</p>
        <ul>
            <li><strong>Hardcoded Rules:</strong> All key economic parameters, including fee percentages and the epoch
                adjustment algorithm, are fixed in the smart contracts. This prevents arbitrary changes to the rules of
                physics within the universe.
            </li>
            <li><strong>On-Chain Verification:</strong> Supply removal addresses and the Team Wallet address are public
                and available for audit on the blockchain, ensuring transparency of flows.
            </li>
        </ul>
    </Section>
);

export default TokenomicsSection;
