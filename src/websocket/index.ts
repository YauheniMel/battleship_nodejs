import {
  IAttack,
  IPlayerGame,
  IShip,
  IUserCredentials,
  IdentifiedWebSocket,
  RequestTypeEnum,
} from '../types/index';
import { DataBase } from '../database/index';
import { WebSocketServer } from 'ws';
import { GamesController } from '../controller/Games.controller';
import { API } from '../API/index';

export const DB = new DataBase();
export const Controller = new GamesController();

export const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws: IdentifiedWebSocket) => {
  ws.on('message', (request: string) => {
    const parsedRequest = JSON.parse(request);

    try {
      if (parsedRequest.type === RequestTypeEnum.reg) {
        const parsedData = JSON.parse(parsedRequest.data) as IUserCredentials;

        API.reg(parsedData, ws);
      } else if (parsedRequest.type === RequestTypeEnum.create_room) {
        API.create_room(ws);
      } else if (parsedRequest.type === RequestTypeEnum.add_user_to_room) {
        const { indexRoom } = JSON.parse(parsedRequest.data) as {
          indexRoom: number;
        };

        API.add_user_to_room(indexRoom, ws);
      } else if (parsedRequest.type === RequestTypeEnum.add_ships) {
        const parsedData = JSON.parse(parsedRequest.data) as {
          gameId: number;
          ships: IShip[];
          indexPlayer: number;
        };

        API.add_ships(parsedData);
      } else if (parsedRequest.type === RequestTypeEnum.attack) {
        const parsedData = JSON.parse(parsedRequest.data) as IAttack;

        API.attack(parsedData);
      } else if (parsedRequest.type === RequestTypeEnum.randomAttack) {
        const parsedData = JSON.parse(parsedRequest.data) as IPlayerGame;

        API.randomAttack(parsedData);
      } else if (parsedRequest.type === RequestTypeEnum.single_play) {
        API.single_play(ws);
      }
    } catch (err: unknown) {
      if (err instanceof Error) console.error(err);
    }
  });
});
