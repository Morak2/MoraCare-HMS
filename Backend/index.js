const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const prisma = require('./lib/prisma');

// Import routes
const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patients');
const staffRoutes = require('./routes/staff');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const medicalRecordRoutes = require('./routes/medicalRecords');
const staffPatientAuthRoutes = require('./routes/Staffpatientauth'); // ← separate file, not staff again
const billingRoutes = require('./routes/billing');
const admissionRoutes = require('./routes/admissions');
const bedRoutes = require('./routes/beds');
const queueRoutes = require('./routes/queue');
const labRequestRoutes = require('./routes/labrequests');

const contactRoutes = require('./routes/contact');
const platformStatsRoutes = require('./routes/platformStats');
const subscriptionRoutes = require('./routes/Subscriptionroutes');

// Initialize Express app
const app = express();
//
// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mora-care-hms.vercel.app',
    'https://apex-frontend-sage.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'HMS Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auth', staffPatientAuthRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/lab-requests', labRequestRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', require('./routes/payments'));


app.use('/api/contact', contactRoutes);
app.use('/api/platform', platformStatsRoutes);
app.use('/api/notifications', require('./routes/notifications'));

// TEMPORARY — one-time admin seed route, protected by a secret query param.
// Remove this after use.
app.get('/api/dev/seed-admin', async (req, res) => {
  try {
    if (req.query.secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const bcrypt = require('bcryptjs');
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminUsername || !adminPassword) {
      return res.status(400).json({ error: 'ADMIN_USERNAME / ADMIN_PASSWORD not set in environment' });
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.superAdmin.upsert({
      where: { username: adminUsername },
      update: { passwordHash: hashedPassword },
      create: { username: adminUsername, passwordHash: hashedPassword },
    });
    return res.json({ message: 'Super Admin created/verified', username: admin.username });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Start server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Wake the DB BEFORE accepting any requests
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[startup] DB connection established');
  } catch (e) {
    console.error('[startup] DB connection failed:', e.message);
    console.error('Check your DATABASE_URL in .env');
  }

  app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║    🏥 HMS Backend Server Running       ║
  ║    Port: ${PORT}                         ║
  ║    Environment: ${process.env.NODE_ENV || 'development'}      ║
  ║    Database: Neon/Prisma               ║
  ╚════════════════════════════════════════╝
    `);
  });

  // Keep Neon alive — ping every 4 minutes
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[keep-alive] DB pinged');
    } catch (e) {
      console.error('[keep-alive] ping failed:', e.message);
    }
  }, 4 * 60 * 1000);
}

startServer();

module.exports = app;