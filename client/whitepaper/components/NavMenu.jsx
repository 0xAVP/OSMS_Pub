import React from 'react';
import styles from '../WhitepaperPage.module.css';

const NavMenu = ({sections}) => (
    <nav className={styles.navMenu}>
        <h4>TABLE OF CONTENTS</h4>
        <ul>
            {sections.map(section => (
                <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title}</a>
                    {/* Если у секции есть дочерние элементы, рендерим вложенный список */}
                    {section.children && (
                        <ul className={styles.nestedNav}>
                            {section.children.map(child => (
                                <li key={child.id}>
                                    <a href={`#${child.id}`}>{child.title}</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    </nav>
);

export default NavMenu;