/**
 * Test Setup
 * 测试环境配置
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock })

// Mock IndexedDB
// 使用简单的内存存储模拟 IndexedDB
const indexedDBMock = {
  open: vi.fn().mockImplementation((name: string, version: number) => {
    const request = {
      result: {
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(false),
        },
        createObjectStore: vi.fn().mockImplementation((storeName: string, options: object) => {
          const store = {
            createIndex: vi.fn(),
          }
          return store
        }),
        transaction: vi.fn().mockImplementation((storeName: string, mode: string) => {
          const transaction = {
            objectStore: vi.fn().mockImplementation(() => ({
              put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              index: vi.fn().mockReturnValue({
                getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              }),
            })),
            oncomplete: null,
            onerror: null,
            error: null,
          }
          return transaction
        }),
      },
      onupgradeneeded: null as ((event: Event) => void) | null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    }

    // 触发升级和成功事件
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request } as unknown as Event)
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request } as unknown as Event)
      }
    }, 0)

    return request
  }),
  deleteDatabase: vi.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
  }),
}

Object.defineProperty(window, 'indexedDB', { value: indexedDBMock })

// Mock Web Crypto API for encryption tests
const cryptoMock = {
  subtle: {
    generateKey: vi.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: true,
      usages: ['encrypt', 'decrypt'],
    }),
    exportKey: vi.fn().mockResolvedValue({
      kty: 'oct',
      k: 'test-key-value',
      alg: 'A256GCM',
      ext: true,
      key_ops: ['encrypt', 'decrypt'],
    }),
    importKey: vi.fn().mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: true,
      usages: ['encrypt', 'decrypt'],
    }),
    encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
      // 返回一个假的加密数据
      return new Uint8Array([1, 2, 3, 4, 5]).buffer
    }),
    decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
      // 返回原始数据（模拟解密）
      return data
    }),
  },
  getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
    // 填充随机值
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
}

Object.defineProperty(window, 'crypto', { value: cryptoMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  CONNECTING = 0
  OPEN = 1
  CLOSING = 2
  CLOSED = 3

  send = vi.fn()
  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket