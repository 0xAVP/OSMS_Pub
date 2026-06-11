import React, {useRef} from 'react';
import {motion, useInView} from 'framer-motion';
import styles from '../WhitepaperPage.module.css';

const Section = ({id, title, subtitle, children}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {once: true, amount: 0.2});

    return (
        <motion.section
            id={id}
            ref={ref}
            className={styles.section}
            initial={{opacity: 0, y: 50}}
            animate={{opacity: isInView ? 1 : 0, y: isInView ? 0 : 50}}
            transition={{duration: 0.7, ease: "easeOut"}}
        >
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
            <div className={styles.sectionContent}>
                {children}
            </div>
        </motion.section>
    );
};

export default Section;