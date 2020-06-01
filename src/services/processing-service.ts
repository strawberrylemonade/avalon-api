import db from  './database-client';
import { Model, DataTypes } from 'sequelize';
import { syncOptions } from '../helpers/options';
import { v4 } from 'uuid';

import { createQueueService } from 'azure-storage';
import { IMedia } from './media-service';
import { MissingParameterError, DatabaseError } from '../helpers/errors';
import { notifyOfUpdate } from '../routers/session-io';
import log from '../helpers/log';
const queueService = createQueueService();

queueService.createQueueIfNotExists(process.env['TRANSCODING_QUEUE'], (err) => {
    if (err) {
      console.log('[DEV] Failed connection to transcoding queue.');
      console.error(err);
      process.exit(1);
    }
  }
)

export enum JobType {
  Mobile = 'Mobile',
  Desktop = 'Desktop'
}

export interface IJob {
  id: string
  sessionId: string
  type: JobType
  media: [IMedia]
}

export class Job extends Model {}
Job.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  media: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'job'
})

Job.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Source"');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed table sync for "Source"');
    console.error(err);
    process.exit(1);
  });



export const addJobToSession = async (sessionId: string, type: string, media: IMedia[]) => {
  if (!sessionId) throw new MissingParameterError('sessionId');
  if (!type) throw new MissingParameterError('type');
  if (!media) throw new MissingParameterError('media');

  const id = v4();

  try {
    const response = await Job.create({ sessionId, id, type, media });
    notifyOfUpdate(sessionId, 'jobCreated', { id })
    await queueJob(id);
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not create this source.');
  }
}

export const getJob = async (id: string) => {
  if (!id) throw new MissingParameterError('id');

  try {
    const response = await Job.findOne({ where: { id } })
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this job.');
  }
}

export const updateJob = async (id: string, candidate: Partial<IJob>) => {
  if (!id) throw new MissingParameterError('id');
  if (!candidate) throw new MissingParameterError('candidate');

  try {
    const response = await Job.findOne({ where: { id } });
    response.update(candidate, { fields: ['status'] });
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this job.');
  }
}

export const getJobsForSession = async (sessionId: string) => {
  if (!sessionId) throw new MissingParameterError('sessionId');

  try {
    const responses = await Job.findAll({ where: { sessionId } })
    return responses.map(r => r.toJSON());
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this job.');
  }
}

export const queueJob = async (id: string) => {
  return new Promise((resolve, reject) => {
    queueService.createMessage(process.env['TRANSCODING_QUEUE'], id, (err, results, response) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(results, response);
    })
  })
}