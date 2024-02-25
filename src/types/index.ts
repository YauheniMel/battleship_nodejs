import WebSocket from 'ws';

export interface IUser {
  name: string;
  index: number;
}

export interface IUserCredentials {
  name: string;
  password: string;
}

export interface IUserRating {
  name: string;
  wins: number;
}

export interface IError {
  error: boolean;
  errorText: string;
}

export interface IRoom {
  roomId: number;
  roomUsers: IUser[];
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  left: number;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface IPlayerTable {
  userId: number;
  ships: IShip[];
  attacks: {
    x: number;
    y: number;
  }[];
}

export interface IGame {
  idGame: number;
  players: IPlayerTable[];
  turn: number;
}

export interface IPlayerGame {
  gameId: number;
  indexPlayer: number;
}

export interface IAttack extends IPlayerGame {
  x: number;
  y: number;
}

export interface IAttackFeedback {
  position: { x: number; y: number };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
}

export enum RequestTypeEnum {
  reg = 'reg',
  create_room = 'create_room',
  add_user_to_room = 'add_user_to_room',
  add_ships = 'add_ships',
  attack = 'attack',
  randomAttack = 'randomAttack',
}

export declare class IdentifiedWebSocket extends WebSocket {
  clientId: number;
}
