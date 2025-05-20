'use client';
import { useState } from 'react';
import { HelpGuide } from '@/components/Help/HelpGuide';
import { FAQSection } from '@/components/Help/FAQSection';
import { ContactSupport } from '@/components/Help/ContactSupport';
import styles from './help.module.css';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('guide');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>Help Center</h1>
          <p className={styles.subtitle}>Get assistance with the CST Voting System</p>
        </div>
      </header>

      <nav className={styles.navigation}>
        <div className={styles.container}>
          <button 
            className={`${styles.navButton} ${activeSection === 'guide' ? styles.active : ''}`}
            onClick={() => setActiveSection('guide')}
          >
            How to Vote
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'faq' ? styles.active : ''}`}
            onClick={() => setActiveSection('faq')}
          >
            FAQ
          </button>
          <button 
            className={`${styles.navButton} ${activeSection === 'contact' ? styles.active : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            Contact Support
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.container}>
          {activeSection === 'guide' && <HelpGuide />}
          {activeSection === 'faq' && <FAQSection />}
          {activeSection === 'contact' && <ContactSupport />}
        </div>
      </main>
    </>
  );
}