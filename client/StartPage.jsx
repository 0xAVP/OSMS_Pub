import React, {useRef, useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './css/StartPage.module.css';
import {motion, useInView, AnimatePresence} from 'framer-motion';
import {useAppKit, useAppKitAccount, useAppKitNetwork} from '@reown/appkit/react';
import {activeNetwork} from './appkitConfig';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';
import Loader from './Loader';

const assetsToPreload = [
    '/assets/images/pages/startpage/bg.jpg',
    '/assets/images/pages/startpage/bg2.jpg',
    '/assets/images/pages/startpage/bg3.jpg',
    '/assets/images/pages/startpage/bg4.jpg',
    '/assets/images/pages/startpage/bg5.jpg',
    '/assets/images/pages/startpage/footer-bg.jpg',
    '/assets/images/pages/startpage/ship1.png',
    '/assets/images/pages/startpage/ship2.png',
    '/assets/images/pages/startpage/planet1.png',
    '/assets/images/pages/startpage/girl.png',

];

const faqData = [
    {
        question: "What is 'One Soul Many Ships'?",
        answer: "It is a web3 2D space shooter with an open economy, featuring crafting, a skill system, and tradable assets. You can fight, craft, exchange, or focus on just one aspect of the game."
    },
    {
        question: "When can I start playing?",
        answer: "SOON"
    },
    {
        question: "Will my progress be saved?",
        answer: "We are not planning to conduct wipes."
    },
    {
        question: "Echo is required?",
        answer: "Yes, Echo is required for the game. The quantity is limited."
    },
    {
        question: "Spaceship is required?",
        answer: "You will receive your first spaceship for FREE if you mint an Echo. Without a spaceship, you cannot participate in battles, but you can engage in crafting and economy."
    },
    {
        question: "What does an 'open economy mean?'",
        answer: "Players can exchange any in-game items with each other."
    },
    {
        question: "Which network will the game operate?",
        answer: "At the moment, we plan to use the L2 blockchain 'Base'."
    },
    {
        question: "Not enough information...",
        answer: "We understand there's not much information yet. We're diligently working on the project and will share more details as they become available. " +
            "Thank you for your patience!"
    },
    {
        question: "I have a suggestion",
        answer: "Send a private message in X: @SoulShipsGame"
    }
];

const gridVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3
        }
    }
};

const itemVariants = {
    hidden: {y: 20, opacity: 0},
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5
        }
    }
};

const logoContainerVariants = {
    hidden: {opacity: 1},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.5,
        },
    },
};

const logoLineVariants = {
    hidden: {opacity: 1},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const letterVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {opacity: 1, y: 0},
};

const decorativeImageVariants = {
    hidden: {opacity: 0, x: 100},
    visible: (delay) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.7,
            delay: delay,
            ease: "easeOut"
        }
    })
};

const echoLeftVariants = {
    hidden: {opacity: 0, y: 20},
    visible: {
        opacity: 1,
        y: 0,
        transition: {duration: 0.5, delay: 0.3}
    }
};

const echoRightVariants = {
    hidden: {x: "100%"},
    visible: {
        x: 0,
        transition: {duration: 0.8, ease: "easeOut"}
    }
};

const StartPage = () => {

    const {open} = useAppKit();
    const {address, isConnected} = useAppKitAccount();
    const {caipNetwork, switchNetwork} = useAppKitNetwork();

    const navigate = useNavigate();

    const secondSectionRef = useRef(null);
    const isInView = useInView(secondSectionRef, {once: false, amount: 0.2});
    const fourthSectionRef = useRef(null);
    const fourthSectionInView = useInView(fourthSectionRef, {once: true, amount: 0.2});

    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const preloadImages = async () => {
            const promises = assetsToPreload.map((src) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = src;

                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            await Promise.all(promises);

            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        };

        preloadImages();
    }, []);

    const handleFaqClick = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    }

    const isCorrectNetwork = caipNetwork?.id === activeNetwork.id;

    const handleConnect = () => {
        open();
    };

    const handleNetworkSwitch = () => {
        switchNetwork(activeNetwork);
    };

    const handleWalletView = () => {
        open({view: 'Account'});
    };

    const startGame = () => {
        if (!isConnected) {
            open();
            return;
        }
        if (!isCorrectNetwork) {
            switchNetwork(activeNetwork);
            return;
        }
        navigate('/game', {state: {walletAddress: address}});
    };

    const goToMintPage = () => {
        if (!isConnected) {
            open();
            return;
        }

        navigate('/mint-echo');
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading ? (

                <Loader key="loader"/>
            ) : (

                <motion.div
                    key="content"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.8}}
                >
                    {/* --- ПЕРВЫЙ БЛОК --- */}
                    <section className={styles.firstSection}>
                        <motion.img
                            src="/assets/images/pages/startpage/ship1.png"
                            alt="Spaceship"
                            className={styles.shipImage}
                            initial={{x: '-100%', y: '-100%', opacity: 0}}
                            animate={{x: 0, y: 0, opacity: 1}}
                            transition={{duration: 1, delay: 0, ease: "easeOut"}}
                        />
                        <div className={styles.planetImage}></div>
                        <motion.div
                            className={styles.logoContainer}
                            variants={logoContainerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div className={styles.logoLineOne} variants={logoLineVariants}>
                                {'ONE SOU'.split('').map((char, index) => (
                                    <motion.span key={index} variants={letterVariants}>
                                        {char}
                                    </motion.span>
                                ))}
                                <motion.span variants={letterVariants} className={styles.lWithDot}>L</motion.span>
                            </motion.div>

                            <motion.div className={styles.logoLineTwo} variants={logoLineVariants}>
                                {'MANY SHIPS'.split('').map((char, index) => (
                                    <motion.span key={index} variants={letterVariants}>
                                        {char === ' ' ? '\u00A0' : char}
                                    </motion.span>
                                ))}
                            </motion.div>
                        </motion.div>
                        <h1 className={styles.title}>web3 space shooter<br/>with crafting, a skill system, and an open
                            economy</h1>
                        <div className={styles.buttonContainer}>
                            <img src="/assets/images/pages/startpage/play-button.png" alt="Play"
                                 className={styles.playButton}
                                 onClick={startGame}
                            />
                            <div className={styles.soonText}>SOON</div>
                        </div>
                        <div className={styles.walletContainer}>
                            {!isConnected ? (

                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <button onClick={handleConnect} className={styles.connectWallet}>
                                        CONNECT WALLET
                                    </button>
                                    <div className={styles.networkHint}>
                                        REQUIRED: <span>{activeNetwork.name}</span>
                                    </div>
                                </div>
                            ) : !isCorrectNetwork ? (

                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <button onClick={handleNetworkSwitch} className={styles.connectWallet}
                                            style={{borderColor: '#ff4d4d', color: '#ff4d4d'}}>
                                        SWITCH TO {activeNetwork.name.toUpperCase()}
                                    </button>
                                    {/* Можно добавить подсказку, где мы сейчас, если доступно имя текущей сети */}
                                    <div className={styles.networkHint}>
                                        CURRENT: <span>{caipNetwork?.name || 'UNKNOWN'}</span>
                                    </div>
                                </div>
                            ) : (

                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <button onClick={handleWalletView} className={styles.disconnectWallet}>
                                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet'}
                                    </button>
                                    {/* Добавляем класс success для зеленого цвета */}
                                    <div className={`${styles.networkHint} ${styles.success}`}>
                                        CONNECTED: <span>{activeNetwork.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.socialLinks}>
                            <a href="https://discord.gg/8Tv7PXcsnq" target="_blank" rel="noopener noreferrer"><img
                                src="/assets/images/ic_discord.png" alt="Discord" className={styles.discordIcon}/></a>
                            <a href="https://x.com/SoulShipsGame" target="_blank" rel="noopener noreferrer"><img
                                src="/assets/images/ic_twitter.png" alt="Twitter" className={styles.twitterIcon}/></a>
                            <a href="/whitepaper" target="_blank" rel="noopener noreferrer"><img
                                src="/assets/images/ic_book.png" alt="Book" className={styles.bookIcon}/></a>
                        </div>
                        <img src="/assets/images/pages/startpage/body_1sec.png" alt="Character decoration"
                             className={styles.body1secImage}/>
                    </section>

                    {/* --- ВТОРОЙ БЛОК --- */}
                    {/* --- ВТОРОЙ БЛОК (ИСПРАВЛЕНО) --- */}
                    {/* Вешаем отслеживание прокрутки на СЕКЦИЮ, а не на картинки */}
                    <motion.section
                        className={styles.secondSection}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: false, amount: 0.2}}
                    >
                        <motion.img
                            src="/assets/images/pages/startpage/echo-left.png"
                            alt="Echo decoration left"
                            className={styles.echoLeft}
                            variants={echoLeftVariants}
                        />
                        <motion.img
                            src="/assets/images/pages/startpage/echo-right.png"
                            alt="Echo decoration right"
                            className={styles.echoRight}
                            variants={echoRightVariants}
                        />

                        <div className={styles.planetTopSlice}></div>
                        <header className={styles.echoesHeader}>
                            <p className={styles.echoesSubtitle}>THE SOUL OF YOUR SHIP</p>
                            <h1 className={styles.echoesTitle}>ECHOES</h1>
                        </header>
                        <main className={styles.echoesMainContent}>
                            <div className={styles.infoColumnLeft}>
                                <p className={styles.infoText}>The earlier an Echo is minted, the sooner it begins
                                    learning
                                    and providing its owner with the <span
                                        className={styles.textColored}>experience</span> needed to improve skills.
                                </p>
                            </div>
                            <div className={styles.mintColumn}>
                                <div className={styles.cardContainer}>
                                    <img src="/assets/images/pages/startpage/echoes-cards.png" alt="Echo Pilot Card"
                                         className={styles.pilotCard}/>
                                </div>
                                <img src="/assets/images/pages/startpage/mint-button.png" alt="Mint Echo"
                                     className={styles.mintImageButton}
                                     onClick={goToMintPage}
                                />
                                <div className={styles.soonText}>SOON</div>
                            </div>
                            <div className={styles.infoColumnRight}>
                                <p className={styles.infoText}>Echoes can be obtained in various ways: minting,
                                    acquiring from other players, or receiving as a gift from the project.
                                </p>
                            </div>
                        </main>
                        <footer className={styles.echoesFooter}>
                            <p className={styles.echoesDescription}>
                                Echoes are ERC-1155 NFTs that make a ship combat-ready.
                                Each Echo has a rarity and various bonuses.
                                A minted Echo continuously learns and stays with you forever until you decide to pass it
                                on to another player.
                            </p>
                        </footer>
                    </motion.section>

                    <section className={styles.thirdSection}>
                        <header className={styles.thirdHeader}>
                            <p className={styles.preTitle}>CHOOSE YOUR</p>
                            <h1 className={styles.mainTitle}>SPACESHIP</h1>
                            <h2 className={styles.subTitle}>boost it and shape your battle style</h2>
                        </header>

                        <div className={styles.thirdSectionContent}>
                            <div className={styles.shipContainer}>
                                <div className={`${styles.shipAndShadowWrapper} ${styles.levitating}`}>
                                    <img src="/assets/images/pages/startpage/ship2.png" alt="Spaceship"
                                         className={styles.ship2Image}/>
                                    <img src="/assets/images/pages/startpage/shipshadow.png" alt="Ship Shadow"
                                         className={styles.shipShadowImage}/>
                                </div>
                            </div>
                            <div className={styles.featuresContainer}>
                                <motion.div
                                    className={styles.featuresGrid}
                                    variants={gridVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{once: true, amount: 0.3}}
                                >
                                    <motion.div className={styles.featureItem} variants={itemVariants}>
                                        <div className={styles.featureIconContainer}>
                                            <img src="/assets/images/pages/startpage/icons/icon_modules.png"
                                                 alt="Modules Icon"/>
                                        </div>
                                        <p className={styles.featureText}>Improved by modules</p>
                                    </motion.div>
                                    <motion.div className={styles.featureItem} variants={itemVariants}>
                                        <div className={styles.featureIconContainer}>
                                            <img src="/assets/images/pages/startpage/icons/icon_upgrades.png"
                                                 alt="Upgrades Icon"/>
                                        </div>
                                        <p className={styles.featureText}>Each ship type has own parameters and
                                            bonuses</p>
                                    </motion.div>
                                    <motion.div className={styles.featureItem} variants={itemVariants}>
                                        <div className={styles.featureIconContainer}>
                                            <img src="/assets/images/pages/startpage/icons/icon_nft.png"
                                                 alt="NFT Icon"/>
                                        </div>
                                        <p className={styles.featureText}>NFT, fully exchangeable</p>
                                    </motion.div>
                                    <motion.div className={styles.featureItem} variants={itemVariants}>
                                        <div className={styles.featureIconContainer}>
                                            <img src="/assets/images/pages/startpage/icons/icon_craft.png"
                                                 alt="Craft Icon"/>
                                        </div>
                                        <p className={styles.featureText}>Can be crafted by player</p>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>

                        <div className={styles.description}>
                            <p>
                                Ships are ERC-721 NFTs. Each ship can be equipped with modules, allowing you to change
                                your playing style and boost your ship's characteristics. Create an ideal build for your
                                ship and use it in battle.
                            </p>
                        </div>
                    </section>

                    {/* --- ЧЕТВЕРТЫЙ БЛОК --- */}
                    <section className={styles.fourthSection}>
                        <img src="/assets/images/pages/startpage/broken_base.png" alt="Space Station"
                             className={styles.stationImage}/>
                        <img src="/assets/images/pages/startpage/res1.png" alt="Planet"
                             className={styles.planet2Image}/>

                        {/* ИСПРАВЛЕНО: декоративные элементы теперь реагируют сами на появление */}
                        <motion.img
                            src="/assets/images/pages/startpage/res4.png"
                            alt="Module Card"
                            className={styles.moduleCardImage}
                            variants={decorativeImageVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{once: true, amount: 0.2}}
                            custom={0.3}
                        />
                        <motion.img
                            src="/assets/images/pages/startpage/res2.png"
                            alt="Crystals"
                            className={styles.crystalsImage}
                            variants={decorativeImageVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{once: true, amount: 0.2}}
                            custom={0.6}
                        />
                        <motion.img
                            src="/assets/images/pages/startpage/res3.png"
                            alt="Crystals"
                            className={styles.thrusterImage}
                            variants={decorativeImageVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{once: true, amount: 0.2}}
                            custom={0.9}
                        />

                        <div className={styles.gameLoopContainer}>
                            <header className={styles.gameLoopHeader}>
                                <p>FIGHT, CRAFT, EXCHANGE</p>
                                <h1>REPEAT</h1>
                                <h2>or concentrate on just one thing</h2>
                            </header>

                            <div className={styles.loopDiagram}>
                                <div className={`${styles.loopBox} ${styles.battleBox}`}>
                                    <h3>BATTLE</h3>
                                    <p>endless enemies<br/>and difficulty, tons of loot</p>
                                </div>
                                <div className={`${styles.loopBox} ${styles.craftBox}`}>
                                    <h3>CRAFT</h3>
                                    <p>turn resources into modules,<br/>ships, upgrades.</p>
                                </div>
                                <div className={`${styles.loopBox} ${styles.tradeBox}`}>
                                    <h3>EXCHANGE</h3>
                                    <p>everything with p2p<br/>or on the barter hub</p>
                                </div>

                                <div className={styles.loopCenter}>
                                    <h4>OWN</h4>
                                </div>

                                {/* Заглушки для стрелок */}
                                <img src="/assets/images/pages/startpage/arrow1.png" alt="Arrow"
                                     className={styles.arrowHorizontal}/>
                                <img src="/assets/images/pages/startpage/arrow3.png" alt="Arrow"
                                     className={styles.arrowDiagonal1}/>
                                <img src="/assets/images/pages/startpage/arrow2.png" alt="Arrow"
                                     className={styles.arrowDiagonal2}/>
                            </div>
                        </div>

                        <div className={styles.fourthDescription}>
                            <p>
                                Do you want to hunt enemies in the far sectors? Or build the perfect ship?
                                Gather resources, exchange, craft modules and ships with <span
                                className={styles.textColored}>various characteristics</span>, improve your skills and
                                customise your build. Each upgrade makes you stronger. Each stage of the battle is
                                slightly harder than the last.
                                You decide how to play and how far to go.
                            </p>
                        </div>
                    </section>
                    {/* --- ПЯТЫЙ БЛОК (FAQ) --- */}
                    <section className={styles.faqSection}>
                        <div className={styles.girlFaqImage}></div>
                        <p className={styles.faqSubtitle}>MORE INFO</p>
                        <h1 className={styles.faqTitle}>FAQ</h1>
                        <div className={styles.faqContainer}>
                            {faqData.map((item, index) => (
                                <div className={styles.faqItem} key={index}>
                                    <div className={styles.faqQuestion} onClick={() => handleFaqClick(index)}>
                                        <span>{item.question}</span>
                                        <span className={styles.faqIcon}>{openFaqIndex === index ? '−' : '+'}</span>
                                    </div>
                                    <div
                                        className={`${styles.faqAnswer} ${openFaqIndex === index ? styles.faqAnswerOpen : ''}`}>
                                        <p>{item.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* --- ФУТЕР --- */}
                    <footer className={styles.footerSection}>
                        <div className={styles.footerSocials}>
                            <a href="https://x.com/SoulShipsGame" target="_blank" rel="noopener noreferrer">
                                <img src="/assets/images/ic_twitter.png" alt="Twitter"/>
                            </a>
                            <a href="https://discord.gg/8Tv7PXcsnq" target="_blank" rel="noopener noreferrer">
                                <img src="/assets/images/ic_discord.png" alt="Discord"/>
                            </a>
                            <a href="/whitepaper">
                                <img src="/assets/images/ic_book.png" alt="Whitepaper"/>
                            </a>
                        </div>

                        <div className={styles.footerText}>
                            <p>Join our community<br/>onesoulmanyships.xyz 2025</p>

                            {/* Добавляем ссылку на Terms */}
                            <p
                                style={{
                                    fontSize: '10px',
                                    marginTop: '10px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                                onClick={() => setIsTermsOpen(true)}
                            >
                                Terms of Service
                            </p>
                            <p
                                style={{fontSize: '10px', cursor: 'pointer', textDecoration: 'underline'}}
                                onClick={() => setIsPrivacyOpen(true)}
                            >
                                Privacy Policy
                            </p>
                        </div>
                    </footer>

                    {/* --- РЕНДЕР МОДАЛЬНОГО ОКНА --- */}
                    <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)}/>
                    <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)}/>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StartPage;