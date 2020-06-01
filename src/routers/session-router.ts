import { Router } from 'express';
import log from '../helpers/log';
import { createSession, getSession, startRecording, stopRecording } from '../services/session-service';
import { addSourceToSession } from '../services/sources-service';
import { addAllMediaToSession } from '../services/media-service';

const router = Router()

router.post('/', async (req, res, next) => {

  try {
    const session = await createSession()
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:id/sources', async (req, res, next) => {
  const id = req.params?.id;
  const source = req.body;

  try {
    const session = await addSourceToSession(id, source)
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:id/media', async (req, res, next) => {
  const id = req.params?.id;
  const media = req.body;

  try {
    const session = await addAllMediaToSession(id, media)
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:id/start', async (req, res, next) => {
  const id = req.params?.id;

  try {
    const session = await startRecording(id)
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.post('/:id/stop', async (req, res, next) => {
  const id = req.params?.id;

  try {
    const session = await stopRecording(id)
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.get('/:id', async (req, res, next) => {
  const id = req.params?.id;
  const text = req.body?.text;

  try {
    const session = await getSession(id);
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;