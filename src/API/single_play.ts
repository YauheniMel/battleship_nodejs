import { getRandomShips } from '../utils/getRandomShips';
import { API } from '../API/index';
import { IdentifiedWebSocket } from '../types/index';
import { DB } from '../websocket/index';

export const single_play = (ws: IdentifiedWebSocket) => {
  const createdBot = DB.createUser();

  const roomId = DB.createRoom(ws.clientId);

  const gameId = API.add_user_to_room(roomId, ws, createdBot.index);

  const randomShips = getRandomShips();

  API.add_ships({ gameId, ships: randomShips, indexPlayer: createdBot.index });
};
