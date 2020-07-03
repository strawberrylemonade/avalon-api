import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { v4 } from 'uuid';
import { generate } from 'randomstring';

import { MissingParameterError, DatabaseError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { syncUpdate, ActionType } from '../routers/session-io';
import { ISource, getSourcesForSession } from './sources-service';


enum SessionStatus {
  Idle = 'Idle',
  Ready = 'Ready',
  Loading = 'Loading',
  Recording = 'Recording',
  Stopped = 'Stopped'
}

enum CameraPosition {
  TopLeft = "TopLeft",
	BottomLeft = "BottomLeft",
	TopRight = "TopRight",
	BottomRight = "BottomRight"
}

export enum RecordingMode {
	PiP = "PiP",
	Facecam = "Facecam",
	Screen = "Screen"
}

interface RecordingLayout {
  pipPosition: CameraPosition
  recordingMode: RecordingMode
}

export interface ISession {
  id: string
  code: string
  status: SessionStatus
  sources: {
    video?: ISource
    audio?: ISource
    screen?: ISource
  }
  layout: RecordingLayout
}

class Session extends Model {}
Session.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  layout: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'session'
})

Session.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Session"');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed table sync for "Session"');
    console.error(err);
    process.exit(1);
  });


export const createSession = async () => {

  const id = v4();
  const code = generate({ length: 6, charset: '2346789BCDFGHJKMPQRTVWXY' })
  const status = SessionStatus.Idle;
  const layout: RecordingLayout = { pipPosition: CameraPosition.TopLeft, recordingMode: RecordingMode.PiP }

  try {
    const response = await Session.create({ id, code, layout, status });
    const session = response.toJSON() as ISession;
    session.sources = {};
    return session;
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not create this session.');
}}

export const getSession = async (id: string) => {
  if (!id) throw new MissingParameterError('id');


  try {
    const response = await Session.findOne({ where: { id }});
    const session = response.toJSON() as ISession;
    session.sources = await getSourcesForSession(id);
    return session;
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this session.');
  }
}

export const updateSession = async (id: string, candidate: Partial<ISession>) => {
  if (!id) throw new MissingParameterError('id');


  try {
    const response = await Session.findOne({ where: { id }});
    response.update(candidate, { fields: ['sources', 'layout', 'status'] })
    const session =  response.toJSON() as ISession;
    return session;
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this session.');
  }
}

export const startRecording = async (id: string) => {
  const session = await getSession(id);
  session.status = SessionStatus.Recording
  syncUpdate(id, ActionType.START_RECORDING);
  return await updateSession(id, session);
}

export const stopRecording = async (id: string) => {
  const session = await getSession(id);
  session.status = SessionStatus.Recording
  syncUpdate(id, ActionType.STOP_RECORDING);
  return await updateSession(id, session);
}

export const getSessionByCode = async (code: string) => {
  if (!code) throw new MissingParameterError('code');

  try {
    const response = await Session.findOne({ where: { code }});
    const session = response.toJSON() as ISession;
    session.sources = await getSourcesForSession(session.id);
    return session;
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this session.');
}}