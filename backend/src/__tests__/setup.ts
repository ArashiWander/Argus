// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external services during tests
jest.mock('../config/database', () => ({
  influxDB: null,
  elasticsearch: null,
  postgresql: null,
  redis: null,
  dbConfig: {
    influx: {
      url: 'http://localhost:8086',
      token: '',
      org: 'argus-test',
      bucket: 'metrics-test'
    }
  },
  initializeDatabases: jest.fn().mockResolvedValue(undefined),
  closeDatabases: jest.fn().mockResolvedValue(undefined)
}));

// Extend Jest matchers
expect.extend({
  toBeCloseTo(received: number, expected: number, precision: number = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision);
    return {
      message: () => `expected ${received} to be close to ${expected}`,
      pass
    };
  }
});