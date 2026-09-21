import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Button
} from "@react-email/components";
import * as React from "react";

interface EventCreatedEmailProps {
  eventName: string;
  eventUrl: string;
}

export const EventCreatedEmail = ({ eventName, eventUrl }: EventCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your event '{eventName}' is live!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Event Published</Heading>
        <Text style={text}>
          Congratulations! Your event <strong>{eventName}</strong> has been successfully published.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={eventUrl}>
            View Event Dashboard
          </Button>
        </Section>
        <Text style={text}>
          From the dashboard, you can track live registrations, check readiness scores, and set up your communication plans.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EventCreatedEmail;

const main = {
  backgroundColor: "#fdf8f4", 
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
  color: "#161311", 
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#4e4945", 
  fontSize: "14px",
  lineHeight: "24px",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#161311",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
