import { IdentifiedWebSocket } from 'types';
import { wss } from '../websocket/index';

export const socketResponse = <T>(
  helper: (data: T) => string,
  data: T,
  userIds?: number[],
) => {
  (wss.clients as Set<IdentifiedWebSocket>).forEach((socket) => {
    if (userIds && userIds.includes(socket.clientId)) {
      socket.send(helper(data));
    } else {
      socket.send(helper(data));
    }
  });
};
