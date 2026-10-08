fetch("http://localhost:3000/api/registrations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    eventSlug: "mfm-youth-soar-conference-2026-9558",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "1234567890",
    city: "Lagos",
    country: "NG",
    attendeeType: "Student",
    ticketTypeId: "" 
  })
}).then(res => res.json()).then(console.log).catch(console.error);
