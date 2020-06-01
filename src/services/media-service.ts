import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { v4 } from 'uuid';

import { MissingParameterError, DatabaseError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { RecordingMode, ISession } from './session-service';
import { addJobToSession, JobType } from './processing-service';
import { ISource } from './sources-service';

export interface IMedia {
  id: string
  uploadedUrl: string
  source: ISource
  startTime: number
  endTime: number
  duration: number
  mode: RecordingMode
}

interface ICompletedSession extends ISession {
  media: IMedia[]
}

export class Media extends Model {}
Media.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startTime: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  endTime: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'media'
})

Media.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Media"');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed table sync for "Media"');
    console.error(err);
    process.exit(1);
  });

export const addAllMediaToSession = async (sessionId: string, media: IMedia[]) => {
  if (!sessionId) throw new MissingParameterError('sessionId');

  await Promise.all(media.map(async (media) => {
    await addMediaToSession(sessionId, media);
  }))
  await addJobToSession(sessionId, JobType.Mobile, media);
}

export const addMediaToSession = async (sessionId: string, media: IMedia) => {
  if (!sessionId) throw new MissingParameterError('sessionId');

  const id = media?.id;
  const uploadedUrl = media?.uploadedUrl;
  const startTime = media?.startTime;
  const endTime = media?.endTime;
  const duration = media?.duration;
  const mode = media?.mode;

  if (!id) throw new MissingParameterError('id');
  if (!uploadedUrl) throw new MissingParameterError('uploadedUrl');
  if (!startTime) throw new MissingParameterError('startTime');
  if (!endTime) throw new MissingParameterError('endTime');
  if (!duration) throw new MissingParameterError('duration');
  if (!mode) throw new MissingParameterError('mode');

  try {
    const response = await Media.create({ id, sessionId, uploadedUrl, startTime, endTime, duration, mode });
    const media = response.toJSON();
    return media;
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not create this source.');
  }
}