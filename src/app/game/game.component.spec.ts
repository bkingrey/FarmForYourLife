import { NgZone } from '@angular/core';
import { EMPTY } from 'rxjs';
import { GameComponent } from './game.component';
import { PhaserGameService } from './phaser/phaser-game.service';
import { AppFacade } from '../app.facade';

describe('GameComponent', () => {
  let component: GameComponent;
  let phaserService: PhaserGameService;

  beforeEach(() => {
    phaserService = {
      judgements: EMPTY,
      nextBeatWallMs: jasmine.createSpy('nextBeatWallMs').and.returnValue(null),
      judge: jasmine.createSpy('judge'),
    } as unknown as PhaserGameService;
    component = new GameComponent(
      phaserService,
      {} as AppFacade,
      new NgZone({ enableLongStackTrace: false }),
    );
    component.gameData = {
      ...component.gameData,
      rhythm: {
        ...component.gameData.rhythm,
        enabled: false,
      },
    };
    component.player = {
      ...component.player,
      center: { x: 160, y: 160 },
      position: { x: 128, y: 128 },
      width: 32,
      height: 32,
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses irrigation targets for multi-tile watering', () => {
    const center = {
      id: 'a',
      state: 'soil-3',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
    };
    const right = {
      id: 'b',
      state: 'soil-3',
      position: { x: 192, y: 128 },
      width: 64,
      height: 64,
    };
    const left = {
      id: 'c',
      state: 'soil-3',
      position: { x: 64, y: 128 },
      width: 64,
      height: 64,
    };

    component.hoveredFarmableArea = component.defaultFarmState;
    component.waterableArea = [left, center, right];
    spyOn(component, 'waterArea').and.callThrough();

    component.doRightClickOnMouse({
      preventDefault() {},
      offsetX: 0,
      offsetY: 0,
    });

    expect(component.waterArea).toHaveBeenCalledTimes(3);
    expect(component.clickedFarmableArea).toEqual([left, center, right]);
  });

  it('clears irrigation targets when the mouse leaves', () => {
    component.otherFarmableArea = [{ id: 'farm' }];
    component.waterableArea = [{ id: 'water' }];
    component.sowableArea = [{ id: 'sow' }];
    component.clickedFarmableArea = [{ id: 'clicked' }];

    component.removeMouseProperties();

    expect(component.otherFarmableArea).toEqual([]);
    expect(component.waterableArea).toEqual([]);
    expect(component.sowableArea).toEqual([]);
    expect(component.clickedFarmableArea).toEqual([]);
  });

  it('shows dig, water, and plant indicators on plantable diggable hover', () => {
    component.ctx = {} as CanvasRenderingContext2D;
    component.upg = {
      plow: '1x1',
      sow: '1x1',
      irrigate: '1x1',
    };
    component.gameData = {
      ...component.gameData,
      equippedTool: 'shovel',
    };
    component.mousePos = { x: 144, y: 144 };
    const area = {
      id: 'soil',
      state: 'soil-3',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
    };
    spyOn(component, 'drawBrokenSquare');
    spyOn(component, 'drawWaterSquare');
    spyOn(component, 'drawPlantCircle');

    component.targetNearestSquare(area);

    expect(component.drawBrokenSquare).toHaveBeenCalledWith(area);
    expect(component.drawWaterSquare).toHaveBeenCalledWith(area, 10);
    expect(component.drawPlantCircle).toHaveBeenCalledWith(area);
  });

  it('allows stacking more than four matching pickupables', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      isCarrying: true,
      equippedTool: 'potato',
    };
    component.lobbyPlayers = [
      {
        name: 'player-1',
        canCarry: true,
        position: { x: 128, y: 128 },
      } as any,
    ];
    component.carryCount = 4;

    const pickedUp = component.playerIsPickingUpItem({
      id: 1,
      plant: 'potato',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
      dropped: false,
    } as any);

    expect(pickedUp).toBeTrue();
    expect(component.carryCount).toBe(5);
  });

  it('picks up a harvestable that spawns under the player', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      isCarrying: false,
      equippedTool: 'shovel',
    };
    component.lobbyPlayers = [
      {
        name: 'player-1',
        canCarry: true,
        position: { x: 128, y: 128 },
      } as any,
    ];
    component.traders = [{ position: { x: 0, y: 0 } } as any];

    component.createPickupablePlantAtArea(
      'potato',
      { x: 128, y: 128 },
      2,
      'player-1',
      false,
    );

    expect(
      component.playerIsPickingUpItem(component.pickupables[0]),
    ).toBeTrue();
    expect(component.carryCount).toBe(1);
  });

  it('cancels watering when a harvestable is picked up', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      isCarrying: false,
      equippedTool: 'shovel',
    };
    component.lobbyPlayers = [
      {
        name: 'player-1',
        canCarry: true,
        position: { x: 128, y: 128 },
      } as any,
    ];
    const wateringTarget = {
      id: 'soil',
      state: 'potato-1',
      queuedCultivate: true,
    };
    component.isWatering = true;
    component.clickedFarmableArea = [wateringTarget];
    component.actionFrameIndex[0] = 3;
    component.framesDrawn[0] = 3;

    const pickedUp = component.playerIsPickingUpItem({
      id: 3,
      plant: 'potato',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
      dropped: false,
    } as any);

    expect(pickedUp).toBeTrue();
    expect(component.isWatering).toBeFalse();
    expect(component.clickedFarmableArea).toEqual([]);
    expect(wateringTarget.queuedCultivate).toBeFalse();
    expect(component.actionFrameIndex[0]).toBe(0);
    expect(component.framesDrawn[0]).toBe(0);
  });

  it('does not start watering while carrying', () => {
    component.gameData = {
      ...component.gameData,
      isCarrying: true,
      water: {
        ...component.gameData.water,
        current: 100,
      },
      energy: {
        ...component.gameData.energy,
        current: 100,
      },
    };
    const target = {
      id: 'water-target',
      state: 'potato-1',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
    };
    component.hoveredFarmableArea = target as any;
    component.waterableArea = [target];
    spyOn(component, 'waterArea').and.callThrough();

    component.doRightClickOnMouse({
      preventDefault() {},
      offsetX: 128,
      offsetY: 128,
    });

    expect(component.waterArea).not.toHaveBeenCalled();
    expect(component.isWatering).toBeFalse();
    expect(component.clickedFarmableArea).toEqual([]);
  });

  it('cancels active watering when carrying starts', () => {
    const target = {
      id: 'water-target',
      state: 'potato-1',
      queuedCultivate: true,
    };
    component.isWatering = true;
    component.clickedFarmableArea = [target];
    component.actionFrameIndex[0] = 4;
    component.framesDrawn[0] = 4;

    (component as any).cancelActiveWatering();

    expect(component.isWatering).toBeFalse();
    expect(component.clickedFarmableArea).toEqual([]);
    expect(target.queuedCultivate).toBeFalse();
    expect(component.actionFrameIndex[0]).toBe(0);
    expect(component.framesDrawn[0]).toBe(0);
  });

  it('does not play planting animation on already planted crops', () => {
    component.gameData = {
      ...component.gameData,
      equippedTool: 'potato-seeds',
      seedsOwned: {
        ...component.gameData.seedsOwned,
        potato: {
          ...component.gameData.seedsOwned.potato,
          count: 3,
        },
      },
    };
    const plantedCrop = {
      id: 'crop',
      state: 'potato-0',
      queuedCultivate: true,
    };

    expect(component.cultivatable(plantedCrop, 0)).toBeFalse();
    expect(plantedCrop.queuedCultivate).toBeFalse();
  });

  it('allows planting animation only on plantable soil', () => {
    component.gameData = {
      ...component.gameData,
      equippedTool: 'potato-seeds',
      seedsOwned: {
        ...component.gameData.seedsOwned,
        potato: {
          ...component.gameData.seedsOwned.potato,
          count: 3,
        },
      },
    };

    expect(
      component.cultivatable(
        {
          id: 'soil',
          state: 'soil-3',
          queuedCultivate: true,
        },
        0,
      ),
    ).toBeTrue();
  });

  it('returns to shovel and clears planting animation after placing a seed', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      equippedTool: 'potato-seeds',
      seedsOwned: {
        ...component.gameData.seedsOwned,
        potato: {
          ...component.gameData.seedsOwned.potato,
          count: 3,
        },
      },
    };
    const soil = {
      id: 'soil',
      state: 'soil-3',
      queuedCultivate: true,
    };
    (component as any).areaById.set('soil', soil as any);
    component.clickedFarmableArea = [soil];
    component.actionFrameIndex[0] = 3;
    component.framesDrawn[0] = 3;
    spyOn(component.changeTool, 'emit');
    spyOn(component.reduceSeedCount, 'emit');

    component.plantSeed({
      clickedFarmableArea: soil,
      equippedTool: 'potato-seeds',
      me: 'player-1',
    });

    expect(soil.state).toBe('potato-0');
    expect(soil.queuedCultivate).toBeFalse();
    expect(component.clickedFarmableArea).toEqual([]);
    expect(component.actionFrameIndex[0]).toBe(0);
    expect(component.framesDrawn[0]).toBe(0);
    expect(component.changeTool.emit).toHaveBeenCalledWith('shovel');
  });

  it('does not dig through the seed fallback when seed planting is disallowed', () => {
    const crop = {
      id: 'crop',
      state: 'potato-0',
    };
    (component as any).areaById.set('crop', crop as any);

    component.changeStateOfHoveredFarmable({
      clickedFarmableArea: crop,
      equippedTool: 'potato-seeds',
      allowSeedPlanting: false,
      isWatering: false,
      me: 'player-1',
      upg: component.upg,
    });

    expect(crop.state).toBe('potato-0');
  });

  it('shows the startup countdown on beat-aligned steps and unlocks on GO', () => {
    component.gameData = {
      ...component.gameData,
      rhythm: {
        ...component.gameData.rhythm,
        bpm: 120,
      },
    };
    (phaserService.nextBeatWallMs as jasmine.Spy).and.returnValue(1000);

    (component as any).beginStartupCountdown();

    expect((component as any).updateStartupCountdown(900)).toBe('5');
    expect((component as any).updateStartupCountdown(1000)).toBe('5');
    expect((component as any).updateStartupCountdown(2000)).toBe('4');
    expect((component as any).updateStartupCountdown(3000)).toBe('3');
    expect((component as any).updateStartupCountdown(4000)).toBe('2');
    expect((component as any).updateStartupCountdown(5000)).toBe('1');
    expect((component as any).updateStartupCountdown(6000)).toBe('GO');
    expect((component as any).isStartupCountdownLocked).toBeFalse();
  });

  it('blocks movement during the startup countdown', () => {
    component.memoryKeys.w.pressed = true;
    component.movables = [{ position: { x: 0, y: 0 } } as any];

    (component as any).beginStartupCountdown();
    component.movement(4);

    expect(component.movables[0].position).toEqual({ x: 0, y: 0 });
  });

  it('does not buffer a dig click outside interaction range', () => {
    component.gameData = {
      ...component.gameData,
      canHarvest: true,
      energy: {
        ...component.gameData.energy,
        current: 100,
      },
    };
    component.mayFarm = false;
    component.hoveredFarmableArea = {
      id: 'far-soil',
      state: 'soil-3',
      position: { x: 600, y: 600 },
      width: 64,
      height: 64,
    } as any;

    component.doLeftClickOnMouse({ offsetX: 600, offsetY: 600 });

    expect((component as any).pendingDigUntilMs).toBe(0);
  });

  it('does not right-click interact with merchant outside interaction range', () => {
    component.gameData = {
      ...component.gameData,
      canOpenShop: true,
      openShop: false,
      isCarrying: false,
      water: {
        ...component.gameData.water,
        current: 100,
      },
      energy: {
        ...component.gameData.energy,
        current: 100,
      },
    };
    component.hoveredFarmableArea = {
      id: 'far-merchant',
      state: 'merchant',
      position: { x: 600, y: 600 },
      width: 64,
      height: 64,
    } as any;
    spyOn(component.openShop, 'emit');

    component.doRightClickOnMouse({
      preventDefault() {},
      offsetX: 600,
      offsetY: 600,
    });

    expect(component.openShop.emit).not.toHaveBeenCalled();
  });

  it('awards a nugget when the mining roll succeeds', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      isCarrying: false,
      minerValue: 0.3,
    };
    spyOn(Math, 'random').and.returnValue(0.2);
    spyOn(component.changeTool, 'emit');

    component.changeStateOfHoveredFarmable({
      clickedFarmableArea: { id: 'mine', state: 'minable' },
      equippedTool: 'pickaxe',
      isWatering: false,
      me: 'player-1',
      upg: component.upg,
    });

    expect(component.changeTool.emit).toHaveBeenCalledWith('nugget');
  });

  it('guarantees a mining nugget after too many misses', () => {
    component.gameData = {
      ...component.gameData,
      me: 'player-1',
      isCarrying: false,
      minerValue: 0.3,
    };
    spyOn(Math, 'random').and.returnValue(0.99);
    spyOn(component.changeTool, 'emit');
    const mineEvent = {
      clickedFarmableArea: { id: 'mine', state: 'minable' },
      equippedTool: 'pickaxe',
      isWatering: false,
      me: 'player-1',
      upg: component.upg,
    };

    component.changeStateOfHoveredFarmable(mineEvent);
    component.changeStateOfHoveredFarmable(mineEvent);
    component.changeStateOfHoveredFarmable(mineEvent);
    component.changeStateOfHoveredFarmable(mineEvent);

    expect(component.changeTool.emit).toHaveBeenCalledTimes(1);
    expect(component.changeTool.emit).toHaveBeenCalledWith('nugget');
  });

  it('allows restarting an active mining action', () => {
    component.gameData = {
      ...component.gameData,
      canHarvest: true,
      equippedTool: 'pickaxe',
      energy: {
        ...component.gameData.energy,
        current: 100,
      },
    };
    component.clickedFarmableArea = [
      {
        id: 'mine',
        state: 'minable',
        queuedCultivate: true,
      },
    ];
    component.hoveredFarmableArea = {
      id: 'mine',
      state: 'minable',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
    } as any;
    component.mayFarm = true;
    component.ctx = {} as CanvasRenderingContext2D;
    spyOn(component.changeEnergy, 'emit');

    component.doLeftClickOnMouse({ offsetX: 128, offsetY: 128 });

    expect(component.clickedFarmableArea[0].queuedCultivate).toBeTrue();
    expect(component.actionFrameIndex[0]).toBe(0);
    expect(component.framesDrawn[0]).toBe(0);
    expect(component.changeEnergy.emit).toHaveBeenCalledWith(-3);
  });

  it('allows restarting an active dig action', () => {
    component.gameData = {
      ...component.gameData,
      canHarvest: true,
      equippedTool: 'shovel',
      energy: {
        ...component.gameData.energy,
        current: 100,
      },
    };
    component.clickedFarmableArea = [
      {
        id: 'soil',
        state: 'soil-3',
        queuedCultivate: true,
      },
    ];
    component.hoveredFarmableArea = {
      id: 'soil',
      state: 'soil-3',
      position: { x: 128, y: 128 },
      width: 64,
      height: 64,
    } as any;
    component.actionFrameIndex[0] = 4;
    component.framesDrawn[0] = 4;
    component.mayFarm = true;
    component.ctx = {} as CanvasRenderingContext2D;
    spyOn(component.changeEnergy, 'emit');

    component.doLeftClickOnMouse({ offsetX: 128, offsetY: 128 });

    expect(component.clickedFarmableArea[0].queuedCultivate).toBeTrue();
    expect(component.actionFrameIndex[0]).toBe(0);
    expect(component.framesDrawn[0]).toBe(0);
    expect(component.changeEnergy.emit).toHaveBeenCalledWith(-3);
  });
});
