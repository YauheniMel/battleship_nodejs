import { helpers } from '../helpers/index';
import { IAttack } from 'types';
import { Controller, DB } from '../websocket/index';
import { socketResponse } from '../utils/socketResponse';

export const attack = (attack: IAttack) => {
  const { attackFeedbacks, winPlayer, enemyId } = Controller.attack(attack);

  attackFeedbacks.forEach((attackFeedback) => {
    socketResponse(helpers.attack, attackFeedback, [
      attackFeedback.currentPlayer,
      enemyId,
    ]);
  });

  if (winPlayer) {
    DB.addUserWinPoint(winPlayer);

    socketResponse(helpers.finish, winPlayer, [attack.indexPlayer, enemyId]);

    const usersRating = DB.getUsersRating();

    socketResponse(helpers.update_winners, usersRating);
  } else {
    const targetGame = Controller.getGameById(attack.gameId);

    socketResponse(helpers.turn, targetGame.turn, [
      attack.indexPlayer,
      enemyId as number,
    ]);
  }
};
