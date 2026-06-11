import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import styles from './css/SuccessModal.module.css';

const SuccessModal = ({isOpen, onClose, echo, txHash}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{scale: 0.8, y: 20, opacity: 0}}
                        animate={{scale: 1, y: 0, opacity: 1}}
                        exit={{scale: 0.8, y: 20, opacity: 0}}
                        transition={{type: "spring", damping: 25, stiffness: 300}}
                    >
                        <h2 className={styles.title}>ACTIVATION COMPLETE</h2>
                        <p className={styles.subtitle}>New Echo Assigned</p>

                        <div className={styles.imageContainer}>
                            {/* Фон для свечения (добавлен обратно, чтобы было красиво) */}
                            <div className={styles.glowBg}></div>
                            {echo && <img src={echo.image} alt={echo.name} className={styles.echoImage}/>}
                        </div>

                        <h3 className={styles.echoName}>{echo ? echo.name : 'Unknown Echo'}</h3>

                        {txHash && (
                            <a
                                href={`https://sepolia.basescan.org/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.txLink}
                            >
                                View Transaction
                            </a>
                        )}

                        {/* Группа кнопок */}
                        <div className={styles.buttonGroup}>
                            {/* Кнопка закрытия (Второстепенная) */}
                            <button onClick={onClose} className={styles.outlineButton}>
                                CLOSE
                            </button>

                            {/* Кнопка игры (Основная) */}
                            {/*<a*/}
                            {/*    href="http://localhost:3001/game"*/}
                            {/*    className={styles.playButton}*/}
                            {/*>*/}
                            <a
                                href="http://26.248.184.178:3001/game"
                                className={styles.playButton}
                            >
                                PLAY →
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SuccessModal;