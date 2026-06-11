import React from 'react';
import {motion} from 'framer-motion';
import styles from './css/Loader.module.css';

const Loader = () => {
    return (
        <motion.div
            className={styles.loaderContainer}
            initial={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.8, ease: "easeInOut"}}
        >
            <div className={styles.loaderSpinner}></div>
            <div className={styles.loaderText}>System Initialization...</div>
        </motion.div>
    );
};

export default Loader;