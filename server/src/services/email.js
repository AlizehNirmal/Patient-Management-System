const HttpError = require('../utils/httpError');

// Sends an email through the Brevo service.
// Without BREVO_API_KEY (for example on a developer's PC) the email is printed
// in the server terminal instead, so registration can still be tested.
module.exports = async function sendEmail(to, subject, text) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[email not configured] To: ${to} | ${text}`);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'MediPass', email: process.env.MAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) {
    console.error('Email failed:', res.status, await res.text());
    throw new HttpError(502, 'Could not send the email. Please try again in a moment.');
  }
};
