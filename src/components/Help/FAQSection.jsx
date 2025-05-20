import { useState } from 'react';
import styles from './Help.module.css';

const faqs = [
  {
    question: "Can I change my vote after submitting?",
    answer: "No, once you have confirmed and submitted your vote, it cannot be changed. Please review your selections carefully before final submission."
  },
  {
    question: "What if I'm unable to access my account?",
    answer: "If you're having trouble accessing your account, visit the IT Help Desk with your student ID card. They can assist with account recovery or password reset."
  },
  {
    question: "When will election results be announced?",
    answer: "Results are available immediately after the voting period ends. You can view them on the Results page once voting closes."
  },
  {
    question: "Can I vote from outside the campus?",
    answer: "For security reasons, voting is restricted to the campus network only. You must be connected to the campus WiFi to access the voting system."
  },
  {
    question: "How do I know my vote was recorded?",
    answer: "After submitting your vote, you'll receive a confirmation message and email. You can also check your voting history in your profile."
  },
  {
    question: "What are the voting limits for each position?",
    answer: "Voting limits vary by position and gender. For example, you can vote for one Chief Councillor, and the Block Councillor positions have specific male and female quotas."
  }
];

export function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className={styles.faq}>
      <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
      
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <button
              className={`${styles.faqQuestion} ${activeIndex === index ? styles.active : ''}`}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            >
              {faq.question}
              <span className={styles.faqIcon}>
                {activeIndex === index ? '−' : '+'}
              </span>
            </button>
            
            {activeIndex === index && (
              <div className={styles.faqAnswer}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}