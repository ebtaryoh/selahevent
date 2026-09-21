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
  Hr,
  Column,
  Row
} from "@react-email/components";
import * as React from "react";

interface TicketEmailProps {
  attendeeName: string;
  eventName: string;
  ticketName: string;
  ticketCode: string;
  startsAt: string;
  venueName: string;
}

export const TicketEmail = ({
  attendeeName,
  eventName,
  ticketName,
  ticketCode,
  startsAt,
  venueName,
}: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>Your ticket for {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're in!</Heading>
        <Text style={text}>
          Hi {attendeeName}, your registration for <strong>{eventName}</strong> is confirmed.
        </Text>
        
        <Section style={ticketContainer}>
          <Text style={ticketHeader}>{eventName}</Text>
          <Hr style={hr} />
          <Row>
            <Column>
              <Text style={label}>TICKET TYPE</Text>
              <Text style={value}>{ticketName}</Text>
            </Column>
            <Column>
              <Text style={label}>TICKET CODE</Text>
              <Text style={valueCode}>{ticketCode}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={label}>DATE & TIME</Text>
              <Text style={value}>{startsAt}</Text>
            </Column>
            <Column>
              <Text style={label}>LOCATION</Text>
              <Text style={value}>{venueName}</Text>
            </Column>
          </Row>
        </Section>
        
        <Text style={text}>
          Please have your ticket code ready at check-in. We look forward to seeing you there!
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TicketEmail;

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

const ticketContainer = {
  border: "1px solid rgba(192, 138, 46, 0.4)",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
  backgroundColor: "rgba(192, 138, 46, 0.04)",
};

const ticketHeader = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#161311",
  margin: "0 0 16px",
};

const hr = {
  borderColor: "rgba(192, 138, 46, 0.2)",
  margin: "16px 0",
};

const label = {
  fontSize: "11px",
  color: "#77716a",
  letterSpacing: "1px",
  fontWeight: "600",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const value = {
  fontSize: "14px",
  color: "#161311",
  fontWeight: "500",
  margin: "0 0 16px",
};

const valueCode = {
  fontSize: "16px",
  color: "#161311",
  fontWeight: "700",
  letterSpacing: "1px",
  margin: "0 0 16px",
  fontFamily: "monospace",
};
