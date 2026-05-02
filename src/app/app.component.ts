import {
  AddBadgeToLobbyPlayer,
  AddPlayerToLobby,
  ChangeCanEnterHouse,
  ChangeCanFillWater,
  ChangeCanHarvest,
  ChangeCanOpenShop,
  ChangeEnergy,
  ChangeIsSleeping,
  ChangeKeyEvent,
  ChangeMoney,
  ChangePlayerState,
  ChangeScene,
  ChangeTool,
  ChangeVelocity,
  ChangeWaterMeter,
  getGameData,
  GetUpgrade,
  Me,
  OpenShop,
  OpenUpgrades,
  PurchaseItem,
  ReduceSeedCount,
  ShowWinScreen,
  ToggleSeedInstantPlant,
  UpdatePlayer,
} from './_store/actions';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { AppFacade } from './app.facade';
import type { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';
import { KeyWASD, Upgrade } from './_store/models';
import { GameComponent } from './game/game.component';
import { ControlsCardComponent } from './controls-card/controls-card.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Hops Farm Game';
  socket: Socket;
  showControlsCard = ControlsCardComponent.shouldShow();
  @ViewChild('gameComp') gameComponent: GameComponent | null = null;
  private destroyRef = inject(DestroyRef);
  constructor(
    public facade: AppFacade,
    private socketService: SocketService,
  ) {
    this.socket = this.socketService.socket;
  }

  ngOnInit() {
    this.facade.dispatch(getGameData());
    let lastScale: number | null = null;
    this.facade.gameData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((g) => {
        if (
          g &&
          typeof g.displayScale === 'number' &&
          g.displayScale !== lastScale
        ) {
          lastScale = g.displayScale;
          document.body.style.setProperty(
            '--game-scale',
            String(g.displayScale),
          );
        }
      });
  }

  ngAfterViewInit(): void {
    this.socket.on('changeBadgeCount', (data) => {
      this.facade.gameData$.pipe(take(1)).subscribe((gameData) => {
        this.facade.dispatch(AddBadgeToLobbyPlayer({ payload: data }));
        gameData.lobbyPlayers.forEach((player) => {
          if (player.name === data && player.badgeCount >= 9) {
            this.facade.dispatch(ShowWinScreen());
          }
        });
      });
    });
    this.socket.on('removePickupable', (data) => {
      if (this.gameComponent) {
        this.gameComponent.removePickupableFromArray(data);
      }
    });
    this.socket.on('goInHouse', (data) => {
      if (this.gameComponent) {
        this.gameComponent.goIntoHouse(data);
      }
    });
    this.socket.on('playerCultivate', (cultivator) => {
      if (this.gameComponent) {
        this.gameComponent.lobbyPlayers.filter(
          (player) => player.name === cultivator,
        )[0].isCultivating = true;
        if (
          this.gameComponent.lobbyPlayers.filter(
            (player) => player.name === cultivator,
          )[0].isCultivating === true
        ) {
        }
      }
    });
    // this.socket.on('playerIsWatering', (waterer) => {
    //   if (this.gameComponent) {
    //     this.gameComponent.updateOtherPlayerIsWatering(waterer);
    //   }
    // });
    this.socket.on('dropPickupable', (data) => {
      this.facade.gameData$.pipe(take(1)).subscribe((gameData) => {
        const position = this.gameComponent?.farmableArea.filter(
          (area) => area.id === data.positionId,
        )[0]?.position;
        this.gameComponent?.createPickupablePlantAtArea(
          data.plant,
          position,
          data.id,
          data.playerName,
          true,
        );
      });
    });
    this.socket.on('playerFromMiddle', (playerFromMiddle) => {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        if (this.gameComponent && playerFromMiddle.name !== data.me) {
          this.gameComponent?.fixOtherPlayerPosition(playerFromMiddle);
        }
      });
    });
    this.socket.on('lobbyPlayers', (lobbyPlayers) => {
      this.facade.dispatch(AddPlayerToLobby({ payload: lobbyPlayers }));
    });
    this.socket.on('move', (moveObj) => {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        if (this.gameComponent && moveObj.player.name !== data.me) {
          this.gameComponent?.moveOtherPlayer(moveObj);
        }
      });
    });
    this.socket.on('updatePlayer', (updatedPlayer) => {
      this.facade.dispatch(UpdatePlayer({ payload: updatedPlayer }));
      const player = this.gameComponent?.lobbyPlayers.filter(
        (p) => p.name === updatedPlayer.name,
      )[0];
      if (player?.loadedIn) {
        this.facade.gameData$.pipe(take(1)).subscribe((data) => {
          if (!player.isBeingHit && updatedPlayer.isBeingHit) {
            if (data.me === player.name && this.gameComponent) {
              this.changeEnergy(-10);
              this.gameComponent.dropCarriedItem();
            }
          }
          player.isBeingHit = updatedPlayer.isBeingHit;
          player.hitdirection = updatedPlayer.hitdirection;
          player.isCarrying = updatedPlayer.isCarrying;
        });
      }
    });
    this.socket.on('changePlayerState', (player) => {
      // this.facade.dispatch(ChangePlayerState({ payload: player}))
      this.gameComponent?.changePlayerUpdate(player);
    });
    this.socket.on('changePlayerTool', (data) => {
      const player = this.gameComponent?.lobbyPlayers.filter(
        (player) => player.name === data.player,
      )[0];
      if (player) {
        player.equippedTool = data.tool;
        player.isCarrying = data.isCarrying;
      }
    });
    this.socket.on('changeHoveredFarm', (farm) => {
      this.gameComponent?.changeStateOfHoveredFarmable(farm);
    });
    this.socket.on('cultivateOther', (player) => {
      if (this.gameComponent && player) {
        this.gameComponent.lobbyPlayers.filter(
          (p) => p.name === player,
        )[0].isCultivating = true;
      }
    });

    this.socket.on('hitPlayer', (player) => {
      if (this.gameComponent) {
        this.gameComponent.lobbyPlayers.filter(
          (p) => p.name === player.name,
        )[0].isBeingHit = true;
      }
    });

    this.socket.on('stopHittingPlayer', (player) => {
      if (this.gameComponent) {
        this.gameComponent.lobbyPlayers.filter(
          (p) => p.name === player.name,
        )[0].isBeingHit = false;
      }
    });
  }

  keyChange(event: KeyWASD, me, lobbyPlayers) {
    const moveChangeObject = {
      player: lobbyPlayers.filter((player) => player.name === me)[0],
      moveup: event.w && event.w.pressed,
      movedown: event.s && event.s.pressed,
      moveleft: event.a && event.a.pressed,
      moveright: event.d && event.d.pressed,
    };
    this.socket.emit('keychange', moveChangeObject);
  }

  changeTool(event) {
    this.facade.dispatch(ChangeTool({ payload: event }));
    this.facade.gameData$.pipe(take(1)).subscribe((data) => {
      const sendData = {
        player: data.me,
        tool: event,
        isCarrying: data.isCarrying,
      };
      this.socket.emit('ChangePlayerTool', sendData);
    });
  }

  toggleSeedMode() {
    this.facade.dispatch(ToggleSeedInstantPlant());
  }

  reduceSeedCount(event) {
    this.facade.dispatch(ReduceSeedCount({ payload: event }));
  }

  changeEnergy(event) {
    this.facade.dispatch(ChangeEnergy({ payload: event }));
  }

  changeVelocity(event) {
    this.facade.dispatch(ChangeVelocity({ payload: event }));
  }

  changeWaterMeter(event) {
    this.facade.dispatch(ChangeWaterMeter({ payload: event }));
  }

  changeCanHarvest(event) {
    this.facade.dispatch(ChangeCanHarvest({ payload: event }));
  }
  changeCanFillWater(event) {
    this.facade.dispatch(ChangeCanFillWater({ payload: event }));
  }
  changeMoney(event) {
    this.facade.dispatch(ChangeMoney({ payload: event }));
  }
  changeCanOpenShop(event) {
    this.facade.dispatch(ChangeCanOpenShop({ payload: event }));
  }
  changeCanEnterHouse(event) {
    this.facade.dispatch(ChangeCanEnterHouse({ payload: event }));
  }
  changeIsSleeping(event) {
    this.facade.dispatch(ChangeIsSleeping({ payload: event }));
  }

  purchaseItem(event) {
    this.facade.dispatch(PurchaseItem({ payload: event }));
    if (event.name === 'Progress Badge') {
      this.facade.gameData$.pipe(take(1)).subscribe((gameData) => {
        this.socket.emit('ChangeBadgeCount', gameData.me);
      });
    }
  }
  changeScene(event) {
    if (event === 'solo') {
      this.startSoloOffline();
      return;
    }
    if (event === 'game') {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        let player = data.lobbyPlayers.filter(
          (player) => player.name === data.me,
        )[0];
        this.socket.emit('StartGame', player);
      });
    }
    this.facade.dispatch(ChangeScene({ payload: event }));
  }

  /** Build a local single-player lobby and skip multiplayer. */
  private startSoloOffline() {
    this.facade.gameData$.pipe(take(1)).subscribe((data) => {
      const me: any = {
        name: data.me || 'Player',
        id: data.me || 'Player',
        loadedIn: true,
        state: 'idle',
        roomId: 0,
        moveup: false,
        movedown: false,
        moveleft: false,
        moveright: false,
        useRightAnims: true,
        canMoveHorizontal: true,
        canMoveVertical: true,
        moving: false,
        equippedTool: 'shovel',
        isCarrying: false,
        isCultivating: false,
        isWatering: false,
        isBeingHit: false,
        canCarry: true,
        badgeCount: 0,
        width: 0,
        height: 0,
        position: { x: 200, y: 200 },
        hitdirection: { x: 0, y: 0 },
      };
      this.facade.dispatch(AddPlayerToLobby({ payload: [me] }));
      this.facade.dispatch(UpdatePlayer({ payload: me }));
      this.facade.dispatch(ChangeScene({ payload: 'game' }));
    });
  }
  addPlayer(event) {
    this.facade.dispatch(Me({ payload: event }));
    this.socket.emit('AddPlayerToLobby', event);
  }
  changePlayerState(event) {
    this.socket.emit('ChangePlayerState', event);
  }
  changeHoveredFarm(event) {
    this.socket.emit('ChangeHoveredFarm', event);
    // Always process the state change for the originating client. The relay
    // server only broadcasts to OTHER clients, so the sender must apply its
    // own dig/water/plant state changes locally.
    this.gameComponent?.changeStateOfHoveredFarmable(event);
  }
  cultivateOthers(event) {
    this.socket.emit('CultivateOthers', event);
  }
  updatePlayer(event) {
    this.socket.emit('UpdatePlayer', event);
  }
  openShop(event) {
    this.facade.dispatch(OpenShop({ payload: event }));
  }
  upgradePopUp(event: boolean) {
    this.facade.dispatch(OpenUpgrades({ payload: event }));
  }
  getUpgrade(event: Upgrade) {
    this.facade.dispatch(GetUpgrade({ payload: event }));
    this.facade.gameData$.pipe(take(1)).subscribe((data) => {
      if (this.gameComponent) {
        this.gameComponent.upg = this.gameComponent.getUpgradeVaules(
          data.learnedUpgrades,
        );
      }
    });
    this.facade.dispatch(OpenUpgrades({ payload: false }));
  }

  playerFromMiddle(event) {
    this.socket.emit('PlayerFromMiddle', event);
  }
  dropPickupable(event) {
    this.socket.emit('DropPickupable', event);
    this.facade.gameData$.pipe(take(1)).subscribe(() => {
      const position = this.gameComponent?.farmableArea.filter(
        (area) => area.id === event.positionId,
      )[0]?.position;
      this.gameComponent?.createPickupablePlantAtArea(
        event.plant,
        position,
        event.id,
        event.playerName,
        true,
      );
    });
  }
  removePickupable(event) {
    this.socket.emit('RemovePickupable', event);
    this.gameComponent?.removePickupableFromArray(event);
  }
  playerCultivate(event) {
    this.socket.emit('PlayerCultivate', event);
  }
  playerIsWatering(event) {
    this.socket.emit('PlayerIsWatering', event);
  }
  goInHouse(event) {
    this.socket.emit('GoInHouse', event);
    this.gameComponent?.goIntoHouse(event);
  }
}
