fetch("http://localhost:3000/api/registrations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    eventSlug: "test",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "+1234567890",
    city: "City",
    country: "US"
  })
})
.then(async res => {
  console.log("Status:", res.status);
  console.log("Text:", await res.text());
})
.catch(err => {
  console.error("Fetch Error:", err);
});
