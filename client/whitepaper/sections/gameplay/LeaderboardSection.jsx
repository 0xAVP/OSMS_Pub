import React from 'react';
import Section from '../../components/Section';
import styles from '../../WhitepaperPage.module.css';

const LeaderboardSection = () => (
    <Section
        id="gameplay-leaderboard"
        title="Seasonal Competitions"
        subtitle="Where the finest pilots forge their legacy."
    >
        <p>
            The leaderboard system is more than just a list of scores. It is the culmination of your entire gameplay
            experience: honed piloting skills, a perfect ship build, and strategic planning. Each season, we establish
            an arena where the most ambitious pilots can prove their mastery and compete for valuable, exclusive
            rewards.
        </p>

        <h4>The Scoring System: Transparency and Fairness</h4>
        <p>
            We believe the path to the top should be clear to everyone. Our scoring system rewards two key aspects of a
            pilot's skill: the ability to overcome escalating difficulty and combat efficiency.
        </p>
        <p>
            The final score for the leaderboard is calculated using a simple yet profound formula based on your <strong>best
            performance within the season</strong>:
        </p>
        <p className={styles.highlight}>
            <strong>Score = (Max Stage × 1,000,000) + Best Kills</strong>
        </p>
        <ul>
            <li>
                <strong>Max Stage:</strong> This is the primary indicator of your progress. Reaching a new, higher stage
                will always place you above any player on previous stages, regardless of their kill count. This rewards
                persistence and the ability to handle an ever-increasing threat.
            </li>
            <li>
                <strong>Best Kills:</strong> This is the secondary metric that serves as a tie-breaker among equals. If
                multiple pilots have reached the same maximum stage, the one who demonstrated greater efficiency by
                achieving more kills in their best run will rank higher.
            </li>
        </ul>
        <p>
            This system ensures that those who pushed the furthest and did so most effectively will rise to the top.
        </p>

        <p>
            Participating in seasonal competitions is your chance not only to win unique prizes but also to leave your
            permanent mark on the universe of "One Soul Many Ships."
        </p>
    </Section>
);

export default LeaderboardSection;