import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { v4 } from 'uuid';


import { MissingParameterError, DatabaseError, ConflictError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { syncUpdate, ActionType } from '../routers/session-io';


export enum SourceType {
  Camera = 'Camera',
  Microphone = 'Microphone',
  Screen = 'Screen'
}

export interface ISource {
  id: string
  type: SourceType
  name: string
}

export class Source extends Model {}
Source.init({
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'source'
})

Source.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Source"');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed table sync for "Source"');
    console.error(err);
    process.exit(1);
  });

export const addSourceToSession = async (sessionId: string, source: ISource) => {
  if (!sessionId) throw new MissingParameterError('sessionId');

  const id = source?.id;
  const type = source?.type;
  const name = source?.name;

  if (!id) throw new MissingParameterError('id');
  if (!type) throw new MissingParameterError('type');
  if (!name) throw new MissingParameterError('name');

  try {
    const existingSources = await getSourcesForSession(sessionId);
    if (existingSources[type]) throw new ConflictError('There is an existing source in the session for this type.');
    const response = await Source.create({ sessionId, id, type, name });
    syncUpdate(sessionId, ActionType.SOURCE_ADD, source)
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not create this source.');
  }
}

export const getSourcesForSession = async (sessionId: string): Promise<{[key: string]: ISource}> => {
  try {
    const response = await Source.findAll({ where: { sessionId }});
    const sources = response.map(res => res.toJSON()) as ISource[];
    const [Microphone] = sources.filter(s => s.type === SourceType.Microphone);
    const [Camera] = sources.filter(s => s.type === SourceType.Camera);
    const [Screen] = sources.filter(s => s.type === SourceType.Screen);
    return { Microphone, Camera, Screen }
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this session.');
  }
}
