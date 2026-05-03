import { GameState, Upgrade } from '../_store/models';

export class GameUtils {
  protected get interactionRangePx(): number {
    return 88;
  }

  isShovelable(state, player, target) {
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
      this.isTargetCloseToPlayer(player, target)
    );
  }

  isTargetCloseToPlayer(player, target) {
    if (target?.position && typeof target?.width === 'number') {
      return this.isAreaCloseToPlayer(player, target);
    }
    return this.isMouseCloseToPlayer(player, target);
  }

  isAreaCloseToPlayer(player, area) {
    if (!player?.center || !area?.position) return false;

    const range = this.interactionRangePx;
    const minReachX = player.center.x - range;
    const maxReachX = player.center.x + range;
    const minReachY = player.center.y - range;
    const maxReachY = player.center.y + range;

    return (
      area.position.x < maxReachX &&
      area.position.x + area.width > minReachX &&
      area.position.y < maxReachY &&
      area.position.y + area.height > minReachY
    );
  }

  isMouseCloseToPlayer(player, mousePos) {
    if (player?.center && mousePos) {
      const range = this.interactionRangePx;
      return (
        ((mousePos.x >= player.center.x &&
          mousePos.x - player.center.x < range) ||
          (player.center.x >= mousePos.x &&
            player.center.x - mousePos.x < range)) &&
        ((mousePos.y >= player.center.y &&
          mousePos.y - player.center.y < range) ||
          (player.center.y >= mousePos.y &&
            player.center.y - mousePos.y < range))
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
      plow: upgrades.filter((upg) => upg.target === 'plow')[0].value,
      sow: upgrades.filter((upg) => upg.target === 'sow')[0].value,
      range: upgrades.filter((upg) => upg.target === 'range')[0].value,
      water: upgrades.filter((upg) => upg.target === 'water')[0].value,
      irrigate: upgrades.filter((upg) => upg.target === 'irrigate')[0].value,
      move: upgrades.filter((upg) => upg.target === 'move')[0].value,
      energy: upgrades.filter((upg) => upg.target === 'energy')[0].value,
      resting: upgrades.filter((upg) => upg.target === 'resting')[0].value,
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
