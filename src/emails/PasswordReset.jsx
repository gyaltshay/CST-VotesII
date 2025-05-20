import { 
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

export default function PasswordResetEmail({ 
  name, 
  resetLink, 
  tempPassword = null 
}) {
  return (
    <Html>
      <Head />
      <Preview>Reset your CST Votes password</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Password Reset Request</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            We received a request to reset your password for your CST Votes account.
          </Text>
          
          {tempPassword ? (
            <>
              <Text style={styles.text}>
                Your temporary password is:
              </Text>
              <Text style={styles.tempPassword}>
                {tempPassword}
              </Text>
              <Text style={styles.text}>
                Please use this password to log in and change it immediately.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.text}>
                Click the button below to reset your password:
              </Text>
              <Link href={resetLink} style={styles.button}>
                Reset Password
              </Link>
            </>
          )}
          
          <Text style={styles.text}>
            If you didn't request this password reset, please ignore this email or contact support.
          </Text>
          
          <Text style={styles.footer}>
            This link will expire in 1 hour for security reasons.
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
  button: {
    backgroundColor: '#1d4e89',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    width: '100%',
    padding: '12px',
  },
  tempPassword: {
    backgroundColor: '#e8f0fe',
    border: '1px solid #1d4e89',
    borderRadius: '5px',
    color: '#1d4e89',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '12px',
    textAlign: 'center',
    margin: '24px 0',
  },
  footer: {
    color: '#898989',
    fontSize: '14px',
    marginTop: '32px',
  },
};