import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EMPTY } from 'rxjs';
import { AppComponent } from './app.component';
import { AppFacade } from './app.facade';
import { SocketService } from './socket.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        {
          provide: AppFacade,
          useValue: {
            gameData$: EMPTY,
            merchantItems$: EMPTY,
            upgradeChoices$: EMPTY,
            dispatch: jasmine.createSpy('dispatch'),
          },
        },
        {
          provide: SocketService,
          useValue: {
            socket: {
              on: jasmine.createSpy('on'),
              emit: jasmine.createSpy('emit'),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the game title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Hops Farm Game');
  });

  it('should render the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
