import { config } from 'dotenv';
config();

import { setup } from 'applicationinsights';
if (process.env['NODE_ENV'] === 'production') setup().start();

import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';

import Server from 'socket.io';

import { createServer } from 'http';

const app = express();
const http = createServer(app);

export const io = Server(http);

app.use(json());
app.use(cors());

import sessionRouter from './routers/session-router';
app.use('/api/session', sessionRouter);

import jobRouter from './routers/job-router';
app.use('/api/jobs', jobRouter);

 
console.log('[DEV] Express server starting...')
http.listen(process.env.PORT, () => {
  console.log(`[DEV] Express server started on port ${process.env.PORT}`)
})