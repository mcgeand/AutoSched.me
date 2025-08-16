// Minimal Express app for testing session management endpoints
import express from 'express';
import cookieParser from 'cookie-parser';

import loginHandler from './auth/login';
import refreshHandler from './auth/refresh';
import logoutHandler from './auth/logout';
import sessionHandler from './auth/session';
import cleanupHandler from './auth/cleanup';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/login', loginHandler);
app.post('/api/auth/refresh', refreshHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/auth/session', sessionHandler);
app.post('/api/auth/cleanup', cleanupHandler);

export default app;
