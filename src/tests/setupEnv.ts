// Mock implementations for TextDecoder and TextEncoder
class MockTextDecoder {
  decode(input?: BufferSource): string {
    if (!input) return '';
    if (input instanceof Uint8Array) {
      return Buffer.from(input).toString('utf-8');
    }
    return String(input);
  }
}

class MockTextEncoder {
  encode(input?: string): Uint8Array {
    if (!input) return new Uint8Array();
    return Buffer.from(input, 'utf-8');
  }
}

// Set up the global mocks
global.TextDecoder = MockTextDecoder as any;
global.TextEncoder = MockTextEncoder as any; 