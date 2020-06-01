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

export const notifyOfUpdate = (id: string, name: string, data: {[key: string]: any} = {}) => {
  
  // Notify of session update

  io.in(/* roomId */ id).emit(name, data);
}