const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const eventRoutes = require('./routes/events');
const uploadRoutes = require('./routes/uploads');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const galleryRoutes = require('./routes/gallery');
const sdgRoutes = require('./routes/sdg');
const authRoutes = require('./routes/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded photos statically so the frontend gallery can render them
app.use('/uploads/photos', express.static(path.join(__dirname, '..', 'uploads', 'photos')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/sdg', sdgRoutes); // reference data - no auth needed

app.use('/api/events', requireAuth, eventRoutes);
app.use('/api/uploads', requireAuth, uploadRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/gallery', requireAuth, galleryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
