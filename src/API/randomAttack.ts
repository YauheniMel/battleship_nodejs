import { IPlayerGame } from 'types';
import { Controller } from '../websocket/index';
import { API } from './index';

export const randomAttack = (data: IPlayerGame) => {
  API.attack(Controller.getRandomAttack(data.gameId, data.indexPlayer));
};
