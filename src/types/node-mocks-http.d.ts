declare module 'node-mocks-http' {
  import { NextApiRequest, NextApiResponse } from 'next';
  import { Readable } from 'stream';

  export interface RequestOptions {
    method?: string;
    url?: string;
    query?: Record<string, string>;
    params?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
    session?: Record<string, any>;
    cookies?: Record<string, string>;
  }

  export interface ResponseOptions {
    locals?: Record<string, any>;
  }

  export interface MockResponse extends NextApiResponse {
    _getJSONData(): any;
    _getData(): string;
    _getStatusCode(): number;
    _getHeaders(): Record<string, string>;
    _isEndCalled(): boolean;
    _isJSON(): boolean;
    _isUTF8(): boolean;
  }

  export interface MockRequest extends NextApiRequest {
    _setParameter(name: string, value: string): void;
    _setMethod(method: string): void;
    _setURL(url: string): void;
    _setBody(body: any): void;
    _addBody(key: string, value: any): void;
  }

  export interface CreateMocksResult {
    req: MockRequest;
    res: MockResponse;
  }

  export function createRequest(options?: RequestOptions): MockRequest;
  export function createResponse(options?: ResponseOptions): MockResponse;
  export function createMocks(reqOptions?: RequestOptions, resOptions?: ResponseOptions): CreateMocksResult;
} 