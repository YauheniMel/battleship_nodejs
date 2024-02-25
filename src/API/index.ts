import { reg } from './reg';
import { add_ships } from './add_ships';
import { create_room } from './create_room';
import { add_user_to_room } from './add_user_to_room';
import { attack } from './attack';
import { randomAttack } from './randomAttack';
import { RequestTypeEnum } from 'types';

export const API: { [key in RequestTypeEnum]: any } = {
  reg,
  add_ships,
  create_room,
  add_user_to_room,
  attack,
  randomAttack,
};
