const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

const cors = require('cors');

dotenv.config();

const app = express();  
app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

app.use(cors({
    origin: allowedOrigins, // Allow requests from this origin
    methods: ['GET', 'POST'], // Allowed methods
    credentials: true, // If you need cookies or auth headers
  }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

app.get('health', (req, res) => {
  res.json({
    MSG: "BACKEND IS RUNNING !"
  })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));