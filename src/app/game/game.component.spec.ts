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
    component.clickedFarmableArea = [{ id: 'clicked' }];

    component.removeMouseProperties();

    expect(component.otherFarmableArea).toEqual([]);
    expect(component.waterableArea).toEqual([]);
    expect(component.clickedFarmableArea).toEqual([]);
  });
});
