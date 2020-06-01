import { Router } from 'express';
import { getJob, updateJob } from '../services/processing-service';
import log from '../helpers/log';

const router = Router()

router.get('/:id', async (req, res, next) => {
  const id = req.params.id;
  
  try {
    const session = await getJob(id)
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

router.put('/:id', async (req, res, next) => {
  const id = req.params.id;
  const job = req.body;
  
  try {
    const session = await updateJob(id, job);
    res.status(200);
    res.json(session)
  } catch (e) {
    log(e);
    res.status(e.code);
    res.json(e.toJSON());
  }
})

export default router;