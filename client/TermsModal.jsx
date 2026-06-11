import React, {useEffect} from 'react';
import styles from './css/TermsModal.module.css';

const TermsModal = ({isOpen, onClose}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>TERMS OF SERVICE</h2>
                    <button className={styles.closeButton} onClick={onClose}>CLOSE [X]</button>
                </div>

                <div className={styles.content}>
                    <p><strong>Last Updated:</strong> November 25, 2025</p>

                    <h2>1. Introduction</h2>
                    <p>Welcome to <strong>One Soul. Many Ships.</strong> ("OSMS", "we", "us", or "our"). These Terms of
                        Service ("Terms") constitute a legally binding agreement between you and OSMS regarding your use
                        of our website, game client, smart contracts, and associated services (collectively, the
                        "Service").</p>
                    <p><strong>IMPORTANT:</strong> BY CONNECTING YOUR DIGITAL WALLET, CLICKING "PLAY", OR ACCESSING THE
                        SERVICE, YOU EXPRESSLY ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY
                        THESE TERMS.</p>
                    <p><strong>ENTERTAINMENT PURPOSE ONLY:</strong> You acknowledge and agree that the Service is a game
                        provided solely for entertainment and enjoyment. It is NOT designed or intended to be used as a
                        banking application, investment platform, wallet for savings, or a professional trading tool.
                        Any economic mechanics within the game are created purely for gameplay depth and immersion.</p>

                    <h2>2. Eligibility</h2>
                    <ul>
                        <li><strong>Age Requirement:</strong> You represent and warrant that you are at least 18 years
                            old (or the age of legal majority in your jurisdiction).
                        </li>
                        <li><strong>Global Sanctions:</strong> You represent that you are not located in a country
                            subject to comprehensive sanctions by the US (OFAC), EU, UN, or Georgia, and are not a
                            person on any restricted party lists.
                        </li>
                    </ul>

                    <h2>3. Alpha Testing, Availability & Seasons</h2>
                    <p><strong>WARNING: ALPHA STATE.</strong> You acknowledge that the Service is currently in an
                        "Alpha" testing phase. It is a work in progress and may contain significant bugs, crashes,
                        incomplete features, and critical errors.</p>
                    <ul>
                        <li><strong>Data Wipes & Progress Reset:</strong> We reserve the right to <strong>reset, wipe,
                            or revert</strong> any game progress, inventories, stats, or achievements at any time during
                            the Alpha phase to fix bugs or balance the economy. You agree that you will not receive
                            compensation for lost progress.
                        </li>
                        <li><strong>Service Availability:</strong> The Service is provided "as is". We do not guarantee
                            continuous, uninterrupted, or error-free operation of the game servers.
                        </li>
                        <li><strong>Passive Progression (EXP):</strong> You acknowledge that the accumulation of
                            Experience points (EXP) for holding NFTs is a server-side process. <strong>In the event of
                                server downtime, maintenance, or outage, EXP generation will cease.</strong> OSMS is not
                            liable for any "lost" potential EXP during periods of inactivity.
                        </li>
                        <li><strong>Seasonal Resets:</strong> Leaderboard rankings, seasonal points, and specific
                            seasonal assets may be reset at the end of each game season. You acknowledge that seasonal
                            progress is temporary.
                        </li>
                    </ul>

                    <h2>4. Digital Assets Classification</h2>
                    <h3>A. Blockchain Assets (NFTs) & Dynamic Metadata</h3>
                    <ul>
                        <li><strong>Definition:</strong> "Echoes" and "Spaceships" are NFTs on the supported blockchain
                            network (currently Base).
                        </li>
                        <li><strong>Ownership:</strong> You own the Token ID. You have the full right to dispose of the
                            token at your discretion
                        </li>
                        <li><strong>Dynamic Metadata:</strong> You acknowledge that the visual appearance, statistics,
                            and attributes associated with your NFT ("Metadata") are <strong>stored centrally on our
                                game servers</strong>.
                        </li>
                        <li><strong>Mutability:</strong> We reserve the right to modify the Metadata of any NFT at any
                            time for game balancing without on-chain transactions.
                        </li>
                    </ul>

                    <h3>B. Virtual Goods (Off-Chain)</h3>
                    <p>All other in-game content, including but not limited to resources (e.g., Fuel), components,
                        modules, cosmetic items, and blueprints are "Virtual Goods" stored on our servers. You carry a
                        limited license to use them. They have no cash value and cannot be redeemed for fiat
                        currency.</p>

                    <h3>C. Nature of Transactions</h3>
                    <p>You explicitly acknowledge and agree that acquiring NFTs (Minting) or paying fees
                        constitutes:</p>
                    <ul>
                        <li><strong>License Acquisition:</strong> The acquisition of a limited, non-exclusive, revocable
                            license to use the underlying art, code, and game mechanics associated with the Token ID.
                        </li>
                        <li><strong>Digital Asset Exchange:</strong> An exchange of crypto-assets (e.g., ETH for
                            NFT). <strong>It does not constitute a purchase of goods, services, or financial
                                instruments.</strong> Consequently, consumer protection laws related to the sale of
                            physical goods (including the right of withdrawal or refunds) do not apply to these
                            transactions.
                        </li>
                    </ul>

                    <h3>D. The OSMS Token (No Cash Value)</h3>
                    <p>The native token ($OSMS) is a strictly utility-based digital credential designed solely to
                        facilitate gameplay interactions.</p>
                    <ul>
                        <li><strong>No Cash Value:</strong> You acknowledge and agree that the Token has <strong>no cash
                            value</strong>, monetary value, or intrinsic value within the Service. It cannot be redeemed
                            by the Company for fiat currency or other property.
                        </li>
                        <li><strong>User-Generated Existence:</strong> The Token is minted exclusively through gameplay.
                            The Company does not "sell" the token as an investment product.
                        </li>
                        <li><strong>Strictly for Entertainment:</strong> The Token is intended for entertainment
                            purposes only. Any value assigned to the Token on third-party markets (DEX/CEX) is purely
                            speculative and subjective.
                        </li>
                    </ul>

                    <h2>5. Economy Rules & Anti-Abuse</h2>
                    <ul>
                        {/* --- ИЗМЕНЕНИЕ: Заменили Trading на Barter/Exchanging --- */}
                        <li><strong>Permitted Exchange:</strong> Exchanging (Bartering) Virtual Goods via in-game
                            mechanics (e.g., P2P Mail) is allowed.
                        </li>
                        <li><strong>RMT Ban:</strong> Selling Virtual Goods for real money/crypto outside the game is
                            strictly prohibited.
                        </li>
                        <li><strong>Transaction Irreversibility:</strong> Transfers made through any in-game mechanics
                            are instant and final. We are not responsible for assets lost due to typos in recipient
                            addresses or user errors.
                        </li>
                        <li><strong>Multi-Accounting (Sybil Attacks):</strong> Creating multiple accounts or wallets to
                            exploit starter rewards, referral bonuses, events, or to manipulate the economy is
                            prohibited. We reserve the right to ban associated wallets and burn illicitly obtained
                            assets.
                        </li>
                    </ul>

                    <h2>6. Code of Conduct & Fair Play</h2>
                    <ul>
                        <li><strong>No Cheating or Automation:</strong> The use of bots, macros, auto-clickers, packet
                            sniffers, or any software to automate gameplay or modify game data is strictly prohibited.
                        </li>
                        <li><strong>Bug Exploitation:</strong> You agree to report bugs and not to exploit them for
                            unfair advantage.
                        </li>
                        <li><strong>Social Interactions:</strong> When using any in-game communication features (e.g.,
                            Mail system, Chat), you agree not to transmit harassment, hate speech, threats, spam, or
                            engage in scams. We reserve the right to restrict social features or ban accounts violating
                            these standards.
                        </li>
                    </ul>

                    <h2>7. Gameplay Mechanics & Risks</h2>
                    <p><strong>Irreversibility:</strong> Crafting (converting resources to NFT), Dismantling (destroying
                        items for resources), and Consumption (using Fuel/Stagestones) are final and cannot be reversed.
                    </p>
                    <ul>
                        <li><strong>Asset Destruction (Burning):</strong> Specific mechanics are designed to be
                            deflationary. For example, installing a new module into an occupied slot on a Ship results
                            in the <strong>permanent destruction</strong> of the previously installed module. Installed
                            modules cannot be unequipped or returned to inventory.
                        </li>
                        <li><strong>RNG & Probability:</strong> Mechanics such as Crafting, Loot generation, and Upgrade
                            success rates are governed by a pseudo-random number generator (PRNG). You agree that these
                            outcomes are random, final, and binding.
                        </li>
                        <li><strong>Connectivity & Loss:</strong> Consumable items (including but not limited to Fuel,
                            Stagestones, or other entry keys) are deducted upon mission start. In the event of a
                            client-side disconnection, crash, or high latency during gameplay, <strong>these resources
                                will not be refunded</strong>.
                        </li>
                    </ul>

                    <h2>8. Intellectual Property Rights</h2>
                    <p>OSMS retains all rights, title, and interest in the Service, including code, art, sound, and
                        lore.</p>
                    <ul>
                        <li><strong>Your License:</strong> You are granted a limited license to use the NFT art for
                            personal, non-commercial purposes (e.g., displaying in a wallet or playing the game).
                        </li>
                        <li><strong>No Commercial Use:</strong> You may not use the artwork of OSMS ships or characters
                            for commercial merchandise or third-party products without our written permission.
                        </li>
                    </ul>

                    <h2>9. Termination of Service (Sunsetting)</h2>
                    <p><strong>We reserve the absolute right to discontinue the Service (sunsetting) at any time, for
                        any reason, including but not limited to financial viability, technical issues, or business
                        decisions.</strong></p>

                    <h3>A. Notice</h3>
                    <p>While not legally obligated, we will endeavor to provide reasonable notice (e.g., via social
                        media or game client) prior to the permanent shutdown of game servers.</p>

                    <h3>B. Impact on Assets</h3>
                    <p>Upon termination of the Service:</p>
                    <ul>
                        <li><strong>Server-Side Data:</strong> All account progress, off-chain inventories (including
                            but not limited to resources, components, modules, blueprints) and player statistics will be
                            permanently deleted.
                        </li>
                        <li><strong>NFTs:</strong> You will retain ownership of your NFTs on the blockchain.
                            However, <strong>all gameplay utility associated with these NFTs will cease
                                immediately</strong>. Furthermore, if the metadata/images are hosted on our servers, the
                            visual representation of your NFTs may cease to function.
                        </li>
                    </ul>

                    <h3>C. No Compensation</h3>
                    <p>You expressly agree that <strong>OSMS is not liable</strong> for any loss of value, utility, or
                        enjoyment resulting from the termination of the Service. No refunds, reimbursements, or
                        conversion to cryptocurrency will be provided for any Virtual Goods or NFTs.</p>

                    <h2>10. Wallet Security, Fees & Data Privacy</h2>
                    <ul>
                        <li><strong>Wallet Security:</strong> You are solely responsible for the security of your
                            digital wallet, seed phrase, and private keys. OSMS does not have access to your wallet
                            and <strong>cannot recover assets</strong> lost due to lost keys, compromised wallets, or
                            phishing attacks.
                        </li>
                        <li><strong>Data Privacy:</strong> We adhere to data minimization principles. We store only your
                            public Wallet Address to identify your game progress. We do not collect real names, emails,
                            or passwords.
                        </li>
                        <li><strong>Protocol Fees:</strong> You acknowledge and agree that certain interactions within
                            the Service (including but not limited to Bridging assets, Marketplace sales, or Crafting)
                            incur a mandatory <strong>Protocol Fee (Tax)</strong> payable to the development team.
                        </li>
                        <li><strong>Operational Use:</strong> You explicitly agree that these Fees are non-refundable
                            and constitute payment for the license to use the Service. You acknowledge that the
                            development team retains <strong>full discretion</strong> over the allocation of these funds
                            for operational expenses, including infrastructure, marketing, and team sustainment.
                        </li>
                        <li><strong>Gas Fees:</strong> All blockchain transactions require the payment of gas fees to
                            the underlying blockchain network. These fees are non-refundable and outside our control.
                        </li>
                        <li><strong>Taxes:</strong> You are solely responsible for determining and paying any applicable
                            taxes resulting from your acquisition, use, or exchange of in-game assets in your local
                            jurisdiction.
                        </li>
                    </ul>

                    <h2>11. Disclaimers</h2>
                    <ul>
                        <li><strong>NO EXPECTATION OF PROFIT:</strong> You explicitly agree that you are acquiring
                            Digital Assets ($OSMS Token, NFTs) solely for their gameplay utility and entertainment
                            value. You represent and warrant that you have <strong>no expectation of profit</strong>,
                            gain, or return on investment from these assets.
                        </li>

                        {/* --- НОВЫЙ ВАЖНЫЙ ПУНКТ: ZERO VALUE --- */}
                        <li><strong>ZERO INTRINSIC VALUE:</strong> You acknowledge and agree that the $OSMS Token
                            has <strong>no inherent cash value ($0.00)</strong> within the Service. It is a strict
                            utility tool for gameplay. Any value assigned to the Token on third-party markets is purely
                            speculative, subjective, and derived solely from community interaction, not from the
                            Company's efforts.
                        </li>
                        {/* -------------------------------------- */}

                        {/* --- НОВЫЙ ВАЖНЫЙ ПУНКТ: РЫНОК --- */}
                        <li><strong>NO MARKET RESPONSIBILITY:</strong> The Company does not guarantee the existence of a
                            secondary market (liquidity) for the Digital Assets. We are not responsible for price
                            fluctuations, volatility, "dumps", or the inability to sell your assets. You assume 100% of
                            the risk associated with trading on decentralized exchanges.
                        </li>
                        {/* --------------------------------- */}

                        <li><strong>No Financial Instrument:</strong> Digital Assets in the Game are not securities,
                            derivatives, stocks, or financial instruments under the laws of any jurisdiction. They grant
                            no rights to dividends, revenue shares, or voting rights.
                        </li>

                        <li><strong>Regulatory Uncertainty:</strong> The regulatory regime governing blockchain
                            technologies is uncertain. New regulations could adversely affect the Service or the utility
                            of the Token. You accept this risk.
                        </li>

                        <li><strong>Third-Party Risk:</strong> We are not responsible for failures or downtime of
                            third-party services, including the blockchain network, RPC providers, or wallet
                            applications.
                        </li>
                        <li><strong>Photosensitivity:</strong> The game contains flashing lights which may trigger
                            seizures in people with photosensitive epilepsy. Player discretion is advised.
                        </li>
                    </ul>

                    <h2>12. Dispute Resolution</h2>
                    <p><strong>Class Action Waiver:</strong> You agree that any dispute arising out of or related to
                        these Terms or the Service will be resolved on an individual basis. You waive your right to
                        participate in a class action lawsuit or class-wide arbitration.</p>
                    <p><strong>Arbitration & Jurisdiction:</strong> Any disputes shall be primarily resolved through
                        binding arbitration. If arbitration is not applicable, you agree to submit to the exclusive
                        jurisdiction of the courts located in <strong>Tbilisi, Georgia</strong>.</p>


                    <h2>13. Governing Law & Language</h2>
                    <ul>
                        <li><strong>Governing Law:</strong> These Terms and any action related thereto will be governed
                            by the laws of <strong>Georgia</strong>, without regard to its conflict of laws provisions.
                        </li>
                        <li><strong>Language:</strong> The controlling language of these Terms is English. If you have
                            received a translation into another language, it has been provided for your convenience
                            only. In the event of any contradiction between the English version and a translation, the
                            English version shall take precedence.
                        </li>
                    </ul>
                    <h2>14. Changes to Terms</h2>
                    <p>We reserve the right to modify these Terms at any time. Updated Terms will be posted in the game
                        client. Your continued use of the Service after any changes constitutes your acceptance of the
                        new Terms.</p>

                    <h2>15. Contact</h2>
                    <p>Support & Feedback: <strong>@SoulShipsGame</strong> (X/Twitter).</p>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
