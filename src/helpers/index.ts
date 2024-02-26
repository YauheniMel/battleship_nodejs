import { attack } from './attack';
import { create_game } from './create_game';
import { finish } from './finish';
import { reg } from './reg';
import { start_game } from './start_game';
import { turn } from './turn';
import { update_room } from './update_room';
import { update_winners } from './update_winners';

export const helpers = {
  reg,
  update_winners,
  create_game,
  update_room,
  start_game,
  attack,
  turn,
  finish,
};
