import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, vi } from 'vitest';

const nativeFetch = globalThis.fetch;

vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const inputUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
    const pathname = new URL(inputUrl, 'http://localhost').pathname;

    if (pathname.startsWith('/locales/')) {
        try {
            const body = await readFile(resolve(process.cwd(), `public${pathname}`), 'utf8');
            return new Response(body, { headers: { 'Content-Type': 'application/json' }, status: 200 });
        } catch {
            return new Response('', { status: 404 });
        }
    }

    return nativeFetch(input, init);
});

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverMock,
});

afterEach(cleanup);
