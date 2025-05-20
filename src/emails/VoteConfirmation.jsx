import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

export default function VoteConfirmationEmail({
  name,
  position,
  candidateName,
  timestamp
}) {
  return (
    <Html>
      <Head />
      <Preview>Your vote has been recorded</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Vote Confirmation</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            Your vote has been successfully recorded in the CST Student Council Elections.
          </Text>
          
          <div style={styles.voteDetails}>
            <Text style={styles.detailLabel}>Position:</Text>
            <Text style={styles.detailValue}>{position}</Text>
            
            <Text style={styles.detailLabel}>Candidate:</Text>
            <Text style={styles.detailValue}>{candidateName}</Text>
            
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{timestamp}</Text>
          </div>
          
          <Text style={styles.text}>
            Thank you for participating in the election process.
          </Text>
          
          <Text style={styles.footer}>
            This is an automated message. Please do not reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '580px',
  },
  heading: {
    fontSize: '24px',
    letterSpacing: '-0.5px',
    lineHeight: '1.3',
    fontWeight: '400',
    color: '#484848',
    padding: '17px 0 0',
  },
  text: {
    margin: '24px 0',
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#484848',
  },
  voteDetails: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '5px',
    padding: '20px',
    margin: '24px 0',
  },
  detailLabel: {
    color: '#718096',
    fontSize: '14px',
    marginBottom: '4px',
  },
  detailValue: {
    color: '#2d3748',
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '16px',
  },
  footer: {
    color: '#898989',
    fontSize: '14px',
    marginTop: '32px',
  },
};