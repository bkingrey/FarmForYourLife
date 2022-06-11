import { GameState, Upgrade } from '../_store/models';

export class GameUtils {
  isShovelable(state, player, mousePos) {
    return (
      state !== 'merchant' &&
      state !== 'merchant-left' &&
      state !== 'merchant-right' &&
      state !== 'minable' &&
      state !== 'fishable' &&
      state !== 'untargetable' &&
      state !== 'well' &&
      state !== 'house' &&
      state !== 'untargetable' &&
      this.isMouseCloseToPlayer(player, mousePos)
    );
  }

  isMouseCloseToPlayer(player, mousePos) {
    if (player.center) {
      return (
        ((mousePos.x >= player.center.x && mousePos.x - player.center.x < 88) ||
          (player.center.x >= mousePos.x &&
            player.center.x - mousePos.x < 88)) &&
        ((mousePos.y >= player.center.y && mousePos.y - player.center.y < 88) ||
          (player.center.y >= mousePos.y && player.center.y - mousePos.y < 88))
      );
    }
    return false;
  }

  isHoldingSeed(tool) {
    return (
      tool === 'beet-seeds' ||
      tool === 'cabbage-seeds' ||
      tool === 'carrot-seeds' ||
      tool === 'cauliflower-seed' ||
      tool === 'kale-seeds' ||
      tool === 'potato-seeds' ||
      tool === 'radish-seeds' ||
      tool === 'sunflower-seeds' ||
      tool === 'wheat-seeds'
    );
  }

  getUpgradeVaules(upgrades: Array<Upgrade>) {
    return {
      dig: upgrades.filter((upg) => upg.target === 'dig')[0].value,
      plow: upgrades.filter((upg) => upg.target === 'plow')[0].value,
      water: upgrades.filter((upg) => upg.target === 'water')[0].value,
      irrigate: upgrades.filter((upg) => upg.target === 'irrigate')[0].value,
      move: upgrades.filter((upg) => upg.target === 'move')[0].value,
      energy: upgrades.filter((upg) => upg.target === 'energy')[0].value,
      bargain: upgrades.filter((upg) => upg.target === 'bargain')[0].value,
      miner: upgrades.filter((upg) => upg.target === 'miner')[0].value,
      fisher: upgrades.filter((upg) => upg.target === 'fisher')[0].value,
    };
  }

  getHitPos(player, hitbox, coordinate) {
    const RECOIL = 40;
    let pos;
    if (coordinate === 'x')
      pos = player.position.x + player.width * 2 - hitbox.position.x;
    if (coordinate === 'y')
      pos = player.position.y + player.height * 2 - hitbox.position.y;
    pos = pos > RECOIL ? RECOIL : pos;
    pos = pos < -RECOIL ? -RECOIL : pos;
    return pos;
  }
}
