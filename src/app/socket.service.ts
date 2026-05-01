import { Injectable } from '@angular/core';
import type { Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

/**
 * Tiny façade over socket.io-client.
 *
 * - When `environment.enableMultiplayer === true`, dynamic-imports
 *   `socket.io-client` (so its bytes are code-split out of the main bundle)
 *   and opens a real connection.
 * - When false (default), returns a no-op stub that absorbs `.on()` /
 *   `.emit()` calls. Solo builds never load the socket.io engine.
 *
 * Callers see a synchronous `socket` getter; the real connection is opened
 * lazily on first access. Buffered listeners attached before the socket
 * resolves are forwarded once the real instance is ready.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private _socket: Socket | null = null;
  private _real: Socket | null = null;
  private pendingHandlers: Array<{ ev: string; cb: (...a: any[]) => void }> =
    [];
  private pendingEmits: Array<{ ev: string; args: any[] }> = [];

  /**
   * Returns the active socket. In solo mode this is a stub. In multiplayer
   * mode, returns a forwarding stub immediately and connects asynchronously;
   * any `on`/`emit` calls made before the real connection opens are buffered
   * and replayed on connect.
   */
  get socket(): Socket {
    if (!this._socket) {
      if (environment.enableMultiplayer) {
        const buffer = new BufferingSocket(
          this.pendingHandlers,
          this.pendingEmits,
        );
        this._socket = buffer as unknown as Socket;
        // Code-splits socket.io-client into its own chunk.
        import('socket.io-client').then((mod) => {
          const ioFn = (mod as any).default ?? (mod as any).io ?? mod;
          this._real = ioFn(environment.socketUrl);
          for (const h of this.pendingHandlers) this._real!.on(h.ev, h.cb);
          for (const e of this.pendingEmits) this._real!.emit(e.ev, ...e.args);
          this.pendingHandlers.length = 0;
          this.pendingEmits.length = 0;
          this._socket = this._real;
        });
      } else {
        this._socket = new StubSocket() as unknown as Socket;
      }
    }
    return this._socket as Socket;
  }

  get isMultiplayer(): boolean {
    return !!environment.enableMultiplayer;
  }

  disconnect() {
    if (this._real) this._real.disconnect();
    this._real = null;
    this._socket = null;
    this.pendingHandlers.length = 0;
    this.pendingEmits.length = 0;
  }
}

/** No-op socket used in solo mode. */
class StubSocket {
  on(): this {
    return this;
  }
  off(): this {
    return this;
  }
  emit(): this {
    return this;
  }
  disconnect(): this {
    return this;
  }
}

/** Forwards/buffers calls until the real socket finishes loading. */
class BufferingSocket {
  constructor(
    private handlers: Array<{ ev: string; cb: (...a: any[]) => void }>,
    private emits: Array<{ ev: string; args: any[] }>,
  ) {}
  on(ev: string, cb: (...a: any[]) => void): this {
    this.handlers.push({ ev, cb });
    return this;
  }
  off(): this {
    return this;
  }
  emit(ev: string, ...args: any[]): this {
    this.emits.push({ ev, args });
    return this;
  }
  disconnect(): this {
    return this;
  }
}
