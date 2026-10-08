import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'node:util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true, value() { this.setAttribute('open', ''); },
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true, value() { this.removeAttribute('open'); },
});
Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') });
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
afterEach(() => { sessionStorage.clear(); localStorage.clear(); jest.useRealTimers(); });
