import { IShip } from 'types';

export const start_game = (playerTable: {
  ships: IShip[];
  currentPlayerIndex: number;
}) =>
  JSON.stringify({
    type: 'start_game',
    data: JSON.stringify(playerTable),
    id: 0,
  });
