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
      tool === 'beets-seeds' ||
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
}
