const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ZodError } = require('zod');
const HttpError = require('./utils/httpError');

const app = express();

// Hosting services put the app behind a proxy; this lets the rate limiter see the real visitor address
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/access', require('./routes/access'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/emergency', require('./routes/emergency'));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join('.');
    return res.status(400).json({ error: field ? `${field}: ${issue.message}` : issue.message });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File is too large. The limit is 5 MB.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

module.exports = app;