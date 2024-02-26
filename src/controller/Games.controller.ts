import {
  IAttack,
  IAttackFeedback,
  IShip,
  IGame,
  IPlayerGame,
  IPlayerTable,
  IAttackHistoryUnit,
} from 'types';
import { DB } from '../websocket/index';
import { API } from '../API/index';

export class GamesController {
  private _games: IGame[] = [];

  getGameById(gameId: number): IGame {
    return this._games.find((game) => game.idGame === gameId) as IGame;
  }

  createGame(userIds: number[]): number {
    const newGame: IGame = {
      idGame: this._games.length,
      players: userIds.map((userId) => ({ userId, ships: [], attacks: [] })),
      turn: userIds[0] as number,
    };

    this._games.push(newGame);

    return newGame.idGame;
  }

  updateGame(updatedGame: IGame) {
    this._games = this._games.map((game) =>
      game.idGame === updatedGame.idGame ? updatedGame : game,
    );
  }

  setShips(data: IPlayerGame & { ships: IShip[] }, userId: number) {
    const targetGame = this.getGameById(data.gameId);

    const updatedGame = {
      ...targetGame,
      players: targetGame.players.map((player) =>
        player.userId === userId
          ? {
              ...player,
              ships: data.ships.map((ship) => ({
                ...ship,
                left: ship.length,
              })),
            }
          : player,
      ),
      turn: data.indexPlayer,
    };

    this.updateGame(updatedGame);
  }

  getRoomReadyToPlay() {
    return this._games.find(
      (game) => game.players[0]?.ships.length && game.players[1]?.ships.length,
    );
  }

  setTurn(status: 'miss' | 'killed' | 'shot', gameId: number) {
    const game = this.getGameById(gameId);

    const enemy = game.players.find((player) => player.userId !== game.turn);

    if (status === 'miss' && enemy) {
      game.turn = enemy.userId;
    }

    this.updateGame(game);
  }

  checkAttackIsValid(data: IAttack, playerTable: IPlayerTable) {
    const isAttackRepeated = playerTable.attacks.some(
      (attack) => attack.x === data.x && attack.y === data.y,
    );

    const isAttackInvalid =
      data.x < 0 || data.y < 0 || data.x > 9 || data.y > 9;

    if (isAttackInvalid || isAttackRepeated) return false;

    return true;
  }

  attack(data: IAttack) {
    const game = this.getGameById(data.gameId);

    const playerTable = game.players.find(
      (player) => player.userId === data.indexPlayer,
    ) as IPlayerTable;
    const enemyTable = game.players.find(
      (player) => player.userId !== data.indexPlayer,
    ) as IPlayerTable;

    if (!this.checkAttackIsValid(data, playerTable))
      throw new Error('Invalid attack');
    if (data.indexPlayer !== game.turn) throw new Error('It is not your turn');

    const { updatedEnemyShips, attackFeedbacks } = this.updateEnemyShips(
      data,
      enemyTable.ships,
    );

    const isEnemyLose = updatedEnemyShips.every((ship) => !ship.left);

    if (isEnemyLose) {
      return {
        winPlayer: data.indexPlayer,
        attackFeedbacks,
        enemyId: enemyTable.userId,
      };
    }

    if (attackFeedbacks[0]) {
      this.setTurn(attackFeedbacks[0].status, data.gameId);
    }

    const enemy = DB.getUserById(enemyTable.userId);
    const player = DB.getUserById(playerTable.userId);

    const turn = this.getGameById(data.gameId).turn;

    if (enemy.name.startsWith('Bot_') && turn === enemy.index) {
      this.botAttack(enemyTable, enemy.index, game.idGame);
    } else if (player.name.startsWith('Bot_') && turn === player.index) {
      this.botAttack(playerTable, player.index, game.idGame);
    }

    attackFeedbacks.forEach((attackFeedback) => {
      this.setAttackHistory(
        {
          x: attackFeedback.position.x,
          y: attackFeedback.position.y,
          status: attackFeedback.status,
          direction: attackFeedback.ship?.direction,
          left: attackFeedback.ship?.left,
          length: attackFeedback.ship?.length,
        },
        { gameId: data.gameId, indexPlayer: data.indexPlayer },
      );
    });

    return {
      attackFeedbacks,
      enemyId: enemyTable.userId,
    };
  }

  updateEnemyShips(data: IAttack, enemyShips: IShip[]) {
    let attackFeedbacks: Array<IAttackFeedback & { ship?: IShip }> = [
      {
        position: { x: data.x, y: data.y },
        currentPlayer: data.indexPlayer,
        status: 'miss',
      },
    ];

    const updatedEnemyShips = enemyShips.map((ship) => {
      if (!this.checkIsShipHit(data, ship)) return ship;

      ship.left -= 1;

      attackFeedbacks = [
        {
          ...attackFeedbacks[0]!,
          status: 'shot',
          ship,
        },
      ];

      if (!ship.left) {
        attackFeedbacks = [];

        for (let i = 0; i < ship.length; i += 1) {
          attackFeedbacks.push({
            position: ship.direction
              ? { x: ship.position.x, y: ship.position.y + i }
              : { y: ship.position.y, x: ship.position.x + i },
            currentPlayer: data.indexPlayer,
            status: 'killed',
            ship,
          });
        }

        const positions = this.getPositionsAroundKilledShip(ship);

        positions.forEach((position) => {
          attackFeedbacks.push({
            position,
            currentPlayer: data.indexPlayer,
            status: 'miss',
            ship,
          });
        });
      }

      return ship;
    });

    return { updatedEnemyShips, attackFeedbacks };
  }

  getPositionsAroundKilledShip(ship: IShip) {
    const positions: { x: number; y: number }[] = [];

    if (ship.direction) {
      positions.push({
        y: ship.position.y - 1,
        x: ship.position.x - 1,
      });
      positions.push({
        y: ship.position.y - 1,
        x: ship.position.x,
      });
      positions.push({
        y: ship.position.y - 1,
        x: ship.position.x + 1,
      });
      positions.push({
        y: ship.position.y + ship.length,
        x: ship.position.x - 1,
      });
      positions.push({
        y: ship.position.y + ship.length,
        x: ship.position.x,
      });
      positions.push({
        y: ship.position.y + ship.length,
        x: ship.position.x + 1,
      });
    } else {
      positions.push({
        x: ship.position.x - 1,
        y: ship.position.y - 1,
      });
      positions.push({
        x: ship.position.x - 1,
        y: ship.position.y,
      });
      positions.push({
        x: ship.position.x - 1,
        y: ship.position.y + 1,
      });
      positions.push({
        x: ship.position.x + ship.length,
        y: ship.position.y - 1,
      });
      positions.push({
        x: ship.position.x + ship.length,
        y: ship.position.y,
      });
      positions.push({
        x: ship.position.x + ship.length,
        y: ship.position.y + 1,
      });
    }

    for (let i = 0; i < ship.length; i++) {
      if (ship.direction) {
        positions.push({
          y: ship.position.y + i,
          x: ship.position.x - 1,
        });
        positions.push({
          y: ship.position.y + i,
          x: ship.position.x + 1,
        });
      } else {
        positions.push({
          x: ship.position.x + i,
          y: ship.position.y - 1,
        });
        positions.push({
          x: ship.position.x + i,
          y: ship.position.y + 1,
        });
      }
    }

    return positions.filter(
      (position) =>
        position.x >= 0 &&
        position.y >= 0 &&
        position.x <= 9 &&
        position.y <= 9,
    );
  }

  setAttackHistory(attack: IAttackHistoryUnit, data: IPlayerGame) {
    const game = this.getGameById(data.gameId);

    const playerTable = game.players.find(
      (player) => player.userId === data.indexPlayer,
    ) as IPlayerTable;

    playerTable.attacks.push(attack);

    const updatedGame = {
      ...game,
      players: game.players.map((player) => {
        if (player.userId === data.indexPlayer) {
          return playerTable;
        }

        return player;
      }),
    };

    this.updateGame(updatedGame);
  }

  checkIsShipHit(data: IAttack, ship: IShip) {
    if (
      ship.direction &&
      ship.position.x === data.x &&
      ship.position.y + ship.length > data.y &&
      data.y >= ship.position.y
    ) {
      return true;
    }

    if (
      !ship.direction &&
      ship.position.y === data.y &&
      data.x < ship.position.x + ship.length &&
      data.x >= ship.position.x
    ) {
      return true;
    }

    return false;
  }

  getRandomAttack(gameId: number, userId: number): IAttack {
    const game = this.getGameById(gameId);

    const playerTable = game.players.find((player) => player.userId === userId);
    const attacks = playerTable?.attacks;

    let x = Math.floor(Math.random() * 10);
    let y = Math.floor(Math.random() * 10);

    while (attacks?.find((attack) => attack.x === x && attack.y === y)) {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);
    }

    const attackData = { gameId, x, y, indexPlayer: userId };

    if (playerTable && !this.checkAttackIsValid(attackData, playerTable)) {
      return this.getRandomAttack(gameId, userId);
    }

    return attackData;
  }

  botAttack(botTable: IPlayerTable, userId: number, gameId: number) {
    const shotAttack = botTable.attacks.find(
      (attack) => attack.status === 'shot',
    );

    if (
      shotAttack &&
      shotAttack.left &&
      shotAttack.length &&
      shotAttack.length - shotAttack.left > 1
    ) {
      this.getPositionForShotShip('top', userId, gameId, shotAttack, botTable);
    } else if (
      shotAttack &&
      shotAttack.left &&
      shotAttack.length &&
      shotAttack.length - shotAttack.left === 1
    ) {
      if (shotAttack.direction) {
        const attack = this.getPositionForShotShip(
          'top',
          userId,
          gameId,
          shotAttack,
          botTable,
        );

        API.attack(attack);
      } else {
        const attack = this.getPositionForShotShip(
          'left',
          userId,
          gameId,
          shotAttack,
          botTable,
        );

        API.attack(attack);
      }
    } else {
      const attack = this.getRandomAttack(gameId, userId);

      API.attack(attack);
    }
  }

  getPositionForShotShip(
    initPosition: string,
    userId: number,
    gameId: number,
    shotAttack: IAttackHistoryUnit,
    playerTable: IPlayerTable,
  ): IAttack {
    let nextPosition = '';
    if (initPosition === 'top') {
      nextPosition = 'bottom';
    } else if (initPosition === 'bottom') {
      nextPosition = 'left';
    } else if (initPosition === 'left') {
      nextPosition = 'right';
    } else if (initPosition === 'right') {
      nextPosition = 'top1';
    } else if (initPosition === 'top1') {
      nextPosition = 'bottom1';
    } else if (initPosition === 'bottom1') {
      nextPosition = 'left1';
    } else if (initPosition === 'left1') {
      nextPosition = 'right1';
    } else if (initPosition === 'right1') {
      nextPosition = 'top2';
    } else if (initPosition === 'top2') {
      nextPosition = 'bottom2';
    } else if (initPosition === 'bottom2') {
      nextPosition = 'left2';
    } else if (initPosition === 'left2') {
      nextPosition = 'right2';
    } else if (initPosition === 'right2') {
      nextPosition = 'top';
    }

    let attack: IAttack = {
      x: 0,
      y: 0,
      indexPlayer: userId,
      gameId: gameId,
    };

    if (initPosition === 'top') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y - 1 };
    } else if (initPosition === 'top1') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y - 2 };
    } else if (initPosition === 'top2') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y - 3 };
    } else if (initPosition === 'left') {
      attack = { ...attack, x: shotAttack.x - 1, y: shotAttack.y };
    } else if (initPosition === 'left1') {
      attack = { ...attack, x: shotAttack.x - 2, y: shotAttack.y };
    } else if (initPosition === 'left2') {
      attack = { ...attack, x: shotAttack.x - 3, y: shotAttack.y };
    } else if (initPosition === 'bottom') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y + 1 };
    } else if (initPosition === 'bottom1') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y + 2 };
    } else if (initPosition === 'bottom2') {
      attack = { ...attack, x: shotAttack.x, y: shotAttack.y + 3 };
    } else if (initPosition === 'right') {
      attack = { ...attack, x: shotAttack.x + 1, y: shotAttack.y };
    } else if (initPosition === 'right1') {
      attack = { ...attack, x: shotAttack.x + 2, y: shotAttack.y };
    } else if (initPosition === 'right2') {
      attack = { ...attack, x: shotAttack.x + 3, y: shotAttack.y };
    }

    if (!this.checkAttackIsValid(attack, playerTable)) {
      return this.getPositionForShotShip(
        nextPosition,
        userId,
        gameId,
        shotAttack,
        playerTable,
      );
    }

    return attack;
  }
}
