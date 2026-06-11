import React, {useEffect} from 'react';
import styles from './css/TermsModal.module.css';

const PrivacyModal = ({isOpen, onClose}) => {
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
                    <h2 className={styles.title}>PRIVACY POLICY</h2>
                    <button className={styles.closeButton} onClick={onClose}>CLOSE [X]</button>
                </div>

                <div className={styles.content}>
                    <p><strong>Effective Date:</strong> November 25, 2025</p>

                    <h2>1. Introduction</h2>
                    <p>This Privacy Policy explains how the <strong>One Soul. Many Ships.</strong> project ("OSMS",
                        "we", "us") collects, uses, and protects your information when you use our game and website. We
                        are committed to the principles of <strong>Data Minimization</strong> and respect your right to
                        privacy.</p>

                    <h2>2. Data We Collect</h2>
                    <p>We deliberately avoid collecting personally identifiable information (PII) such as your real
                        name, email address, phone number, or physical address. We process only the minimum data
                        necessary to operate the Game:</p>

                    <h3>A. Data Provided by You</h3>
                    <ul>
                        <li><strong>Wallet Address:</strong> We collect and store your public blockchain wallet address
                            (e.g., 0x123...) to identify your account, save your in-game progress (inventory, stats),
                            and facilitate asset ownership.
                        </li>
                    </ul>

                    <h3>B. Automatically Collected Data</h3>
                    <ul>
                        <li><strong>Technical Logs:</strong> Like most web services, our servers automatically record
                            information sent by your browser or device, including your IP address, browser type, and
                            basic device information. This data is used solely for security purposes (e.g., DDoS
                            protection, anti-cheat) and server diagnostics.
                        </li>
                        <li><strong>Cookies & Local Storage:</strong> We use local storage on your device to save your
                            game settings (e.g., volume, graphics quality). We do not use tracking cookies for
                            advertising.
                        </li>
                    </ul>

                    <h3>C. Public Blockchain Data</h3>
                    <ul>
                        <li>Your transactions (Minting, Crafting, Transfers) are recorded on the public blockchain
                            (Base). This data includes your wallet address and transaction details. <strong>This
                                information is public by nature and is not controlled by us.</strong></li>
                    </ul>

                    <h2>3. How We Use Your Data</h2>
                    <p>We use the limited data we collect for the following purposes:</p>
                    <ul>
                        <li>To provide the Game service and maintain your progress.</li>
                        <li>To verify your ownership of NFTs (Echoes, Ships) via the blockchain.</li>
                        <li>To detect and prevent fraud, cheating, botting, and security breaches.</li>
                        <li>To analyze aggregate (anonymized) gameplay statistics to improve game balance.</li>
                    </ul>

                    <h2>4. Data Sharing</h2>
                    <p>We do not sell, rent, or trade your personal data.</p>
                    <ul>
                        <li><strong>Service Providers:</strong> We may share technical data (IPs) with infrastructure
                            providers (e.g., hosting services, DDoS protection) solely to maintain the Service.
                        </li>
                        <li><strong>Legal Compliance:</strong> We may disclose data if required by law, regulation, or
                            valid legal process (e.g., a subpoena).
                        </li>
                    </ul>

                    <h2>5. Blockchain & Immutability</h2>
                    <p>Please be aware that data written to the blockchain is <strong>immutable</strong> (cannot be
                        changed or deleted) and <strong>publicly visible</strong>. We cannot delete, modify, or hide
                        your transaction history or wallet associations on the blockchain, as this technology is
                        decentralized and outside our control. By using the Service, you acknowledge the inherent public
                        nature of blockchain transactions.</p>

                    <h2>6. International Transfers</h2>
                    <p>The Service is global. Your data (Wallet Address, Game Progress) may be transferred to and
                        processed in countries other than your country of residence. By using the Service, you consent
                        to such transfers. We ensure that our servers are located in secure jurisdictions.</p>

                    <h2>7. Your Rights (GDPR/CCPA)</h2>
                    <p>Depending on your location, you may have certain rights regarding your data:</p>
                    <ul>
                        <li><strong>Right to Access:</strong> You can view your game progress associated with your
                            Wallet Address directly in the game interface.
                        </li>
                        <li><strong>Right to Deletion (Right to be Forgotten):</strong> You may request the deletion of
                            your off-chain game progress (inventory, level) stored on our servers. However, we <strong>cannot
                                delete</strong> your wallet address from the blockchain history.
                        </li>
                    </ul>
                    <p>To exercise these rights, please contact us via our official social media channels.</p>

                    <h2>8. Children's Privacy</h2>
                    <p>The Game is not intended for children under the age of 18. We do not knowingly collect data from
                        individuals under 18. If we become aware that we have collected such data, we will take steps to
                        delete it.</p>

                    <h2>9. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                        the new Policy in the game client. Your continued use of the Service defines your acceptance of
                        these changes.</p>

                    <h2>10. Contact Us</h2>
                    <p>If you have questions about this Privacy Policy, please contact us via X
                        (Twitter): <strong>@SoulShipsGame</strong>.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;
