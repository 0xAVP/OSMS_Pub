import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import styles from './css/MintEcho.module.css';
import {useMintEcho} from './hooks/useMintEcho';
import Loader from './Loader';
import SuccessModal from './SuccessModal';

const rarityColors = {
    common: '#758BA0',
    uncommon: '#42DA9D',
    rare: '#41C6FF',
    epic: '#C029E5',
    legendary: '#FEBA00',
    unique: '#d2003c',
};

const echoAssets = Array.from({length: 10}, (_, i) => `/assets/nfts/echoes/pilot-${i}.png`);

const MintEchoPage = () => {
    const {
        loading,
        minting,
        echos,
        selectedEcho,
        mintEcho,
        handleEchoSelect,
        isConnected,
        isWrongNetwork,
        currentNetworkName,
        targetNetworkName,
        openAppKit,
        switchNetwork
    } = useMintEcho();

    const [activeTab, setActiveTab] = useState('attributes');
    const [imagesLoaded, setImagesLoaded] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [mintedEcho, setMintedEcho] = useState(null);
    const [lastTxHash, setLastTxHash] = useState(null);

    useEffect(() => {
        const preloadImages = async () => {
            const promises = echoAssets.map((src) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            await Promise.all(promises);

            setTimeout(() => {
                setImagesLoaded(true);
            }, 500);
        };

        preloadImages();
    }, []);

    const handleSelectAndSwitchTab = (echo) => {
        handleEchoSelect(echo);
        setActiveTab('attributes');
    };

    const handleMintClick = async () => {
        if (!selectedEcho) return;

        const txResult = await mintEcho();

        if (txResult) {
            setMintedEcho(selectedEcho);

            setLastTxHash(txResult.hash || txResult);
            setShowSuccessModal(true);
        }
    };

    const isPageLoading = loading || !imagesLoaded;

    const isSoldOut = selectedEcho && selectedEcho.minted >= selectedEcho.maxMints;
    const isAccessRestricted = selectedEcho && selectedEcho.isWhitelistOnly && !selectedEcho.userIsWhitelisted;
    const canMint = selectedEcho && !isSoldOut && !isAccessRestricted;

    const getButtonText = () => {
        if (minting) return 'ACTIVATING...';
        if (isSoldOut) return 'ACTIVATION CLOSED';
        if (isAccessRestricted) return 'ACCESS DENIED';
        return 'ACTIVATE ECHO';
    };

    return (
        <>
            {/* 1. ЭКРАН ЗАГРУЗКИ */}
            <AnimatePresence>
                {isPageLoading && <Loader key="loader"/>}
            </AnimatePresence>

            {/* 2. МОДАЛКА УСПЕХА */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                echo={mintedEcho}
                txHash={lastTxHash}
            />

            {/* 3. ОСНОВНОЙ КОНТЕНТ (Показываем только когда всё загружено) */}
            {!isPageLoading && (
                <motion.div
                    className={styles.root}
                    key="content"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.8}}
                >
                    {/* ВНУТРИ motion.div ДЕЛАЕМ ПРОВЕРКИ СОСТОЯНИЯ КОШЕЛЬКА */}

                    {/* СЦЕНАРИЙ А: НЕ ПОДКЛЮЧЕН */}
                    {!isConnected ? (
                        <div className={styles.loadingContainer} style={{flexDirection: 'column', gap: '20px'}}>
                            <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>ACCESS RESTRICTED</p>
                            <p style={{color: '#aaa'}}>Connect your wallet to access the Activation Protocol.</p>
                            <button
                                className={styles.mintButton}
                                onClick={() => openAppKit()}
                                style={{maxWidth: '300px'}}
                            >
                                CONNECT WALLET
                            </button>
                        </div>

                    ) : isWrongNetwork ? (
                        <div className={styles.loadingContainer}
                             style={{flexDirection: 'column', gap: '30px', textAlign: 'center'}}>
                            <p style={{
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                marginBottom: '1.8rem',
                                letterSpacing: '2px'
                            }}>
                                WRONG NETWORK
                            </p>

                            <div style={{
                                background: 'rgba(15, 15, 20, 0.9)',
                                padding: '35px',
                                borderRadius: '12px',
                                border: '1px solid #444',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '25px',
                                minWidth: '340px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <span style={{
                                        color: '#888',
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.5px'
                                    }}>
                                        Connected To
                                    </span>
                                    <span style={{
                                        color: '#FEBA00',
                                        fontWeight: 'bold',
                                        fontSize: '1.3rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {currentNetworkName}
                                    </span>
                                </div>

                                <div style={{width: '100%', height: '1px', background: 'rgba(255,255,255,0.15)'}}></div>

                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <span style={{
                                        color: '#888',
                                        fontSize: '0.85rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.5px'
                                    }}>
                                        Required Network
                                    </span>
                                    <span style={{
                                        color: '#42DA9D',
                                        fontWeight: 'bold',
                                        fontSize: '1.3rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {targetNetworkName}
                                    </span>
                                </div>
                            </div>

                            <button
                                className={styles.mintButton}
                                onClick={switchNetwork}
                                style={{maxWidth: '300px', marginTop: '2.2rem', padding: '15px 0', fontSize: '1rem'}}
                            >
                                SWITCH NETWORK
                            </button>
                        </div>

                    ) : (
                        <div className={styles.gridContainer}>
                            {/* --- Левая колонка (Список) --- */}
                            <aside className={styles.echoList}>
                                <header className={styles.listHeader}>ECHO ROSTER</header>
                                <div className={styles.listContent}>
                                    {(echos || []).map((echo) => (
                                        <div
                                            key={echo.id}
                                            className={`${styles.echoListItem} ${selectedEcho?.id === echo.id ? styles.active : ''}`}
                                            onClick={() => handleSelectAndSwitchTab(echo)}
                                        >
                                            <div className={styles.selectionIndicator}></div>
                                            <img src={echo.image} alt={echo.name} className={styles.echoAvatar}/>
                                            <div className={styles.echoInfo}>
                                                <span className={styles.echoListName}>{echo.name}</span>
                                                <div className={styles.echoMeta}>
                                                    <span
                                                        className={styles.echoListSupply}>{echo.minted}/{echo.maxMints}</span>
                                                    <div className={styles.echoListPrice}>
                                                        {echo.userIsWhitelisted ? (
                                                            <>
                                                                <span
                                                                    className={styles.strikethrough}>{`${echo.priceETH} ETH`}</span>
                                                                <span className={styles.freeLabel}>FREE</span>
                                                            </>
                                                        ) : (
                                                            `${echo.priceETH} ETH`
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </aside>

                            {/* --- Центральная колонка (Досье) --- */}
                            <main className={styles.dossier}>
                                {selectedEcho ? (
                                    <>
                                        <header className={styles.dossierCard}>
                                            <div className={styles.dossierImageContainer}>
                                                <img src={selectedEcho.image} alt={selectedEcho.name}
                                                     className={styles.dossierImage}/>
                                                <div className={styles.holographicShine}></div>
                                            </div>
                                            <div className={styles.headerText}>
                                                <h1 className={styles.dossierName}>{selectedEcho.name}</h1>
                                                <p className={styles.dossierSubtitle}>ECHO IDENTIFIER</p>
                                            </div>
                                        </header>

                                        <nav className={styles.dossierNav}>
                                            <button onClick={() => setActiveTab('attributes')}
                                                    className={activeTab === 'attributes' ? styles.activeTab : ''}>ATTRIBUTES
                                            </button>
                                            <button onClick={() => setActiveTab('bio')}
                                                    className={activeTab === 'bio' ? styles.activeTab : ''}>BIO
                                            </button>
                                        </nav>

                                        <div className={styles.dossierContent}>
                                            {activeTab === 'attributes' && (
                                                <div className={styles.attributesGrid}>
                                                    {selectedEcho.attributes.map((attr, index) => {
                                                        const isRarity = attr.trait_type === 'Rarity';
                                                        const color = isRarity ? rarityColors[attr.value.toLowerCase()] : 'inherit';
                                                        return (
                                                            <div key={index} className={styles.attributeItem}>
                                                                <span
                                                                    className={styles.attributeType}>{attr.trait_type}</span>
                                                                <span className={styles.attributeValue}
                                                                      style={{color: color}}>{attr.value}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {activeTab === 'bio' && (
                                                <div className={styles.dossierBio}>
                                                    <p>{selectedEcho.description || "Biodata not available."}</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.noSelection}>
                                        <p>AWAITING SELECTION</p>
                                    </div>
                                )}
                            </main>

                            {/* --- Правая колонка (Минт) --- */}
                            <aside className={styles.mintControl}>
                                <header className={styles.mintHeader}>ACTIVATING PROTOCOL</header>
                                {selectedEcho ? (
                                    <div className={styles.mintBox}>
                                        <div className={styles.mintInfo}>
                                            <div className={styles.statusLine}>
                                                <span className={styles.statusLabel}>Price</span>
                                                <div className={styles.statusValue}>
                                                    {selectedEcho.userIsWhitelisted ? (
                                                        <>
                                                            <span
                                                                className={styles.strikethrough}>{`${selectedEcho.priceETH} ETH`}</span>
                                                            <span className={styles.freeLabel}>FREE (WL)</span>
                                                        </>
                                                    ) : (
                                                        `${selectedEcho.priceETH} ETH`
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.statusLine}>
                                                <span className={styles.statusLabel}>Activated</span>
                                                <span
                                                    className={styles.statusValue}>{selectedEcho.minted} / {selectedEcho.maxMints}</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progress}
                                                     style={{width: `${(selectedEcho.minted / selectedEcho.maxMints) * 100}%`}}></div>
                                            </div>
                                        </div>

                                        <div className={styles.mintActions}>
                                            {isAccessRestricted && (
                                                <p style={{
                                                    color: '#d2003c',
                                                    fontSize: '0.85rem',
                                                    marginBottom: '10px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    textAlign: 'center'
                                                }}>
                                                    ⚠ RESTRICTED: WHITELIST ONLY
                                                </p>
                                            )}

                                            {selectedEcho.userIsWhitelisted && (
                                                <p style={{
                                                    color: '#42DA9D',
                                                    fontSize: '0.85rem',
                                                    marginBottom: '10px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    textAlign: 'center'
                                                }}>
                                                    ✓ WHITELIST CONFIRMED
                                                </p>
                                            )}

                                            <button
                                                className={`${styles.mintButton} ${!canMint ? styles.disabled : ''}`}
                                                onClick={handleMintClick}
                                                disabled={minting || !canMint}
                                                style={(!canMint && !minting) ? {
                                                    opacity: 0.5,
                                                    cursor: 'not-allowed',
                                                    background: '#2a2a2a',
                                                    borderColor: '#444'
                                                } : {}}
                                            >
                                                {getButtonText()}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.noMintSelection}>
                                        <p>AWAITING CANDIDATE</p>
                                    </div>
                                )}
                            </aside>
                        </div>
                    )}
                </motion.div>
            )}
        </>
    );
};

export default MintEchoPage;