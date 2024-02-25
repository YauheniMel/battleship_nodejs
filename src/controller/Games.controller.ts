import {
  IAttack,
  IAttackFeedback,
  IShip,
  IGame,
  IPlayerGame,
  IPlayerTable,
} from 'types';

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

  attack(data: IAttack) {
    const game = this.getGameById(data.gameId);

    const playerTable = game.players.find(
      (player) => player.userId === data.indexPlayer,
    ) as IPlayerTable;

    const isAttackRepeated = playerTable.attacks.some(
      (attack) => attack.x === data.x && attack.y === data.y,
    );

    const isAttackInvalid =
      data.x < 0 || data.y < 0 || data.x > 9 || data.y > 9;

    if (isAttackInvalid || isAttackRepeated) throw new Error('Invalid attack');

    if (data.indexPlayer !== game.turn) throw new Error('It is not your turn');

    const enemyTable = game.players.find(
      (player) => player.userId !== data.indexPlayer,
    ) as IPlayerTable;

    const { updatedEnemyShips, attackFeedbacks } = this.updateEnemyShips(
      data,
      enemyTable.ships,
    );

    if (updatedEnemyShips.every((ship) => !ship.left)) {
      return {
        winPlayer: data.indexPlayer,
        enemyId: enemyTable.userId,
      };
    }

    if (attackFeedbacks[0]) {
      this.setTurn(attackFeedbacks[0].status, data.gameId);
    }

    return {
      attackFeedbacks,
      enemyId: enemyTable.userId,
    };
  }

  setTurn(status: 'miss' | 'killed' | 'shot', gameId: number) {
    const game = this.getGameById(gameId);

    const enemy = game.players.find((player) => player.userId !== game.turn);

    if (status === 'miss' && enemy) {
      game.turn = enemy.userId;
    }

    this.updateGame(game);
  }

  setAttackHistory(data: IAttack) {
    const game = this.getGameById(data.gameId);

    const playerTable = game.players.find(
      (player) => player.userId === data.indexPlayer,
    ) as IPlayerTable;

    playerTable.attacks.push({ x: data.x, y: data.y });

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

  updateEnemyShips(data: IAttack, enemyShips: IShip[]) {
    let attackFeedbacks: IAttackFeedback[] = [
      {
        position: { x: data.x, y: data.y },
        currentPlayer: data.indexPlayer,
        status: 'miss',
      },
    ];

    const updatedEnemyShips = enemyShips.map((ship) => {
      if (!this.checkIsShipHit(data, ship)) return ship;

      ship.left -= 1;

      attackFeedbacks = [{ ...attackFeedbacks[0]!, status: 'shot' }];

      if (!ship.left) {
        for (let i = 0; i < ship.length; i += 1) {
          attackFeedbacks.push({
            position: ship.direction
              ? { x: ship.position.x, y: ship.position.y + i }
              : { y: ship.position.y, x: ship.position.x + i },
            currentPlayer: data.indexPlayer,
            status: 'killed',
          });
        }

        this.markCellsAroundShip(data, ship).forEach((attackFeedback) => {
          attackFeedbacks.push(attackFeedback);
        });
      }

      return ship;
    });

    return { updatedEnemyShips, attackFeedbacks };
  }

  getRandomAttack(gameId: number, userId: number) {
    const game = this.getGameById(gameId);

    const playerAttacks = game.players.find(
      (player) => player.userId === userId,
    )?.attacks;

    let x = Math.floor(Math.random() * 10);
    let y = Math.floor(Math.random() * 10);

    while (playerAttacks?.find((attack) => attack.x === x && attack.y === y)) {
      x = Math.floor(Math.random() * 10);
      y = Math.floor(Math.random() * 10);
    }

    const attackData = { gameId, x, y, indexPlayer: userId };

    return attackData;
  }

  checkIsShipHit(data: IAttack, ship: IShip) {
    if (
      ship.position.x === data.x &&
      ship.position.y + ship.length > data.y &&
      data.y >= ship.position.y
    ) {
      return true;
    }

    if (
      ship.position.y === data.y &&
      data.x < ship.position.x + ship.length &&
      data.x >= ship.position.x
    ) {
      return true;
    }
  }

  markCellsAroundShip(data: IAttack, ship: IShip) {
    this.setAttackHistory(data);

    const attackFeedbacks: IAttackFeedback[] = [];

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

    positions.forEach((position) => {
      if (position.x >= 0 && position.y >= 0) {
        attackFeedbacks.push({
          position: position,
          currentPlayer: data.indexPlayer,
          status: 'miss',
        });
      }
    });

    attackFeedbacks.forEach((attackFeedback) => {
      this.setAttackHistory({
        gameId: data.gameId,
        indexPlayer: attackFeedback.currentPlayer,
        x: attackFeedback.position.x,
        y: attackFeedback.position.y,
      });
    });

    return attackFeedbacks;
  }

  // botAttack(gameId: number, userId: number) {
  //   const game = this.getGameById(gameId);

  //   const Player = game?.players.find(
  //     (player) => player.userId === userId,
  //   )?.attacks;
  // }
}
