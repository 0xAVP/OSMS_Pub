import React from 'react';
import Section from '../components/Section';
import styles from '../WhitepaperPage.module.css';

const LivingDocumentSection = () => (
    <Section id="living-document" title="A Living Document">
        <p className={styles.highlight}>
            <strong>Please note:</strong> This document is not final and will be updated and expanded as the project
            develops. We are committed to transparency and will keep the community informed of all key updates.
        </p>
    </Section>
);

export default LivingDocumentSection;