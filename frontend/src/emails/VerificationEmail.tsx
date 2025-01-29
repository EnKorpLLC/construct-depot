import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  userFirstName: string;
  verificationUrl: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  userFirstName,
  verificationUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Bulk Buyer Group</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={text}>Hi {userFirstName},</Text>
            <Text style={text}>
              Thanks for signing up for Bulk Buyer Group! Please verify your email address by clicking the button below:
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
            <Text style={text}>
              If you didn't sign up for Bulk Buyer Group, you can safely ignore this email.
            </Text>
            <Text style={text}>
              This verification link will expire in 24 hours.
            </Text>
            <Text style={footer}>
              Best regards,<br />
              The Bulk Buyer Group Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '0 48px',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '24px',
  marginBottom: '24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '48px',
}; 