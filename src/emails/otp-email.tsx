import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OTPEmailProps {
  code: string;
}

export const OTPEmail = ({ code }: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Selah Verification Code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>
          Please use the following 6-digit code to complete your sign-in process.
        </Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{code}</Text>
        </Section>
        <Text style={text}>
          If you didn't request this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default OTPEmail;

const main = {
  backgroundColor: "#fdf8f4", // parchment
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid rgba(22,19,17,0.1)",
  marginTop: "40px",
  marginBottom: "40px",
};

const h1 = {
  color: "#161311", // ink
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#4e4945", // warm-600
  fontSize: "14px",
  lineHeight: "24px",
};

const codeContainer = {
  background: "rgba(192, 138, 46, 0.08)", // brass light
  borderRadius: "8px",
  margin: "32px 0",
  padding: "24px",
  textAlign: "center" as const,
};

const codeStyle = {
  color: "#161311", // ink
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "8px",
  margin: "0",
};
