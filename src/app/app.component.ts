import {
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
  Me,
  OpenShop,
  OpenUpgrades,
  PurchaseItem,
  ReduceSeedCount,
  UpdatePlayer,
} from './_store/actions';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AppFacade } from './app.facade';
import io, { Socket } from 'socket.io-client';
import { KeyWASD } from './_store/models';
import { GameComponent } from './game/game.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'FarmForYourLife';
  socket: Socket = io('http://localhost:3000');
  @ViewChild('gameComp') gameComponent: GameComponent | null = null;
  constructor(public facade: AppFacade) {}

  ngOnInit() {
    this.facade.dispatch(getGameData());
  }

  ngAfterViewInit(): void {
    this.socket.on('lobbyPlayers', (lobbyPlayers) => {
      this.facade.dispatch(AddPlayerToLobby({ payload: lobbyPlayers }));
    });
    this.socket.on('move', (moveObj) => {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        // if (this.gameComponent && moveObj.player.name !== data.me) {
          this.gameComponent?.moveOtherPlayer(moveObj);
        // }
      });
    });
    this.socket.on('updatePlayer', (updatedPlayer) => {
      this.facade.dispatch(UpdatePlayer({ payload: updatedPlayer }));
    });
    this.socket.on('changePlayerState', (player) => {
     // this.facade.dispatch(ChangePlayerState({ payload: player}))
      this.gameComponent?.changePlayerUpdate(player)
    })
    this.socket.on('changePlayerTool', data => {
      const player = this.gameComponent?.lobbyPlayers.filter(player => player.name === data.player)[0]
      if (player) {
        player.equippedTool = data.tool
        player.isCarrying = data.isCarrying
      }
    })
    this.socket.on('changeHoveredFarm', farm => {
      this.gameComponent?.changeStateOfHoveredFarmable(farm)
    })
    this.socket.on('cultivateOther', player => {
      if (this.gameComponent) {
        this.gameComponent.lobbyPlayers.filter(p => p.name === player)[0].isCultivating = true
      }
    })
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
    this.facade.dispatch(ChangeKeyEvent({ payload: event }));
  }

  changeTool(event) {
    this.facade.dispatch(ChangeTool({ payload: event }));
    this.facade.gameData$.pipe(take(1)).subscribe(data => {
      const sendData = {
        player: data.me,
        tool: event,
        isCarrying: data.isCarrying
      }
      this.socket.emit('ChangePlayerTool', sendData)
    })

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
  }
  changeScene(event) {
    if (event === 'game') {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        let player = data.lobbyPlayers.filter(
          (player) => player.name === data.me
        )[0];
        this.socket.emit('StartGame', player);
      });
    }
    this.facade.dispatch(ChangeScene({ payload: event }));
  }
  addPlayer(event) {
    this.facade.dispatch(Me({ payload: event }));
    this.socket.emit('AddPlayerToLobby', event);
  }
  changePlayerState(event) {
    this.socket.emit('ChangePlayerState', event)
  }
  changeHoveredFarm(event) {
    this.socket.emit('ChangeHoveredFarm', event)
  }
  cultivateOthers(event) {
    this.socket.emit('CultivateOthers', event);
  }
  openShop(event) {
    this.facade.dispatch(OpenShop({ payload: event }));
  }
  upgradePopUp(event: boolean) {
    this.facade.dispatch(OpenUpgrades({ payload: event }))
  }
}
