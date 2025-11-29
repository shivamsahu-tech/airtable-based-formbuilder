import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import authRoutes from './routes/authRoutes.js';
import formRoutes from './routes/forms.js';
import webhookRoutes from './routes/webhooks.js';
import { setRedisClient } from './controllers/authController.js';

import { RedisStore } from "connect-redis";
import { createClient } from "redis";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGINS, 
    credentials: true,
  })
);

const redisClient = createClient({
  url: process.env.REDIS_URL
});

app.use(cookieParser());
app.use(express.json());


//using redis client for persistent session storage
async function startApp() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('invalid mongo uri');
    await mongoose.connect(uri);
    console.log('Mongo connected');

    await redisClient.connect();
    console.log('Redis connected');

    const store = new RedisStore({
      client: redisClient,
      prefix: "sess:", 
    });

    setRedisClient(redisClient);

    app.use(
      session({
        store,
        secret: process.env.SESSION_SECRET || "something-secret-here-you-can't-see",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: true,     
          httpOnly: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      })
    );


    app.use('/auth', authRoutes);
    // all bases and form related routes started with /api
    app.use('/api', formRoutes);

    app.use('/api/webhooks', webhookRoutes);


    app.use((err, _req, res, _next) => {
      const status = err.status || 500;
      res.status(status).json({ message: err.message || 'Server error' });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startApp();
