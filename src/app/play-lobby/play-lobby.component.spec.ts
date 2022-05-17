import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayLobbyComponent } from './play-lobby.component';

describe('PlayLobbyComponent', () => {
  let component: PlayLobbyComponent;
  let fixture: ComponentFixture<PlayLobbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayLobbyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayLobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
