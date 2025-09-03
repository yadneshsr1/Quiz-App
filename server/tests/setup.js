/**
 * Jest test setup
 */

// Increase timeout for database operations
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
