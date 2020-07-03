import { io } from '../';
import log from '../helpers/log';

io.on('connection', (socket) => {

  // Handling incoming, client-sent events
  // This, unless an edge case occurs, should only be the initial "subscribe" event.
  // All other actions should be completed through the standard APIs

  socket.on('subscribeToUpdates', (data) => {

    socket.join(data.sessionId, (err) => {
      if (err) {
        log(err);
        socket.disconnect();
        return;
      }
    })
  })
})

export enum ActionType {
  SOURCE_ADD = "SOURCE_ADD",
  SOURCE_REMOVE = "SOURCE_REMOVE",
  PEER_CONNECTED = "PEER_CONNECTED",
  PEER_DISCONNECTED = "PEER_DISCONNECTED",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  CHANGE_LAYOUT = "CHANGE_LAYOUT",
  PROCESSING_STARTED = "PROCESSING_STARTED",
  PROCESSING_FINISHED = "PROCESSING_FINISHED"
}

export const syncUpdate = (id: string, action: ActionType, data: {[key: string]: any} = {}) => {
  
  // Notify of session update

  io.in(/* roomId */ id).emit('update', { action, data });
}