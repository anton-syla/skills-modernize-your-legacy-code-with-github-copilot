'use strict';

const { Readable, Writable } = require('node:stream');
const {
  AccountDataStore,
  parseAmount,
  processOperation,
  runApplication,
} = require('./index');

async function runCli(input) {
  let output = '';
  const outputStream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  await runApplication(Readable.from(input), outputStream);
  return output;
}

describe('student account application business logic', () => {
  test('TC-001 displays the account menu when the application starts', async () => {
    const output = await runCli(['4\n']);

    expect(output).toContain('Account Management System');
    expect(output).toContain('1. View Balance');
    expect(output).toContain('2. Credit Account');
    expect(output).toContain('3. Debit Account');
    expect(output).toContain('4. Exit');
  });

  test('TC-002 starts with a balance of 1000.00', () => {
    const store = new AccountDataStore();

    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1000.00');
  });

  test('TC-003 credits a whole-number amount and persists the result', () => {
    const store = new AccountDataStore();

    expect(processOperation('CREDIT', '250', store)).toBe('Amount credited. New balance: 1250.00');
    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1250.00');
  });

  test('TC-004 credits a decimal amount', () => {
    const store = new AccountDataStore();

    expect(processOperation('CREDIT', '125.50', store)).toBe('Amount credited. New balance: 1125.50');
  });

  test('TC-005 accepts a zero credit and leaves the balance unchanged', () => {
    const store = new AccountDataStore();

    expect(processOperation('CREDIT', '0', store)).toBe('Amount credited. New balance: 1000.00');
    expect(store.read()).toBe(100000);
  });

  test('TC-006 debits an amount when sufficient funds are available', () => {
    const store = new AccountDataStore();

    expect(processOperation('DEBIT', '300', store)).toBe('Amount debited. New balance: 700.00');
    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 700.00');
  });

  test('TC-007 allows a debit equal to the current balance', () => {
    const store = new AccountDataStore();

    expect(processOperation('DEBIT', '1000.00', store)).toBe('Amount debited. New balance: 0.00');
    expect(store.read()).toBe(0);
  });

  test('TC-008 rejects a debit greater than the current balance', () => {
    const store = new AccountDataStore();

    expect(processOperation('DEBIT', '1000.01', store)).toBe('Insufficient funds for this debit.');
    expect(store.read()).toBe(100000);
  });

  test('TC-009 accepts a zero debit and leaves the balance unchanged', () => {
    const store = new AccountDataStore();

    expect(processOperation('DEBIT', '0', store)).toBe('Amount debited. New balance: 1000.00');
    expect(store.read()).toBe(100000);
  });

  test('TC-010 applies multiple operations to the latest balance', () => {
    const store = new AccountDataStore();

    processOperation('CREDIT', '100.00', store);
    processOperation('DEBIT', '40.00', store);

    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1060.00');
  });

  test('TC-011 does not change the balance after a failed debit', () => {
    const store = new AccountDataStore();

    expect(processOperation('DEBIT', '1500.00', store)).toBe('Insufficient funds for this debit.');
    processOperation('CREDIT', '50.00', store);

    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1050.00');
  });

  test('TC-012 reports an invalid menu choice and continues to the next choice', async () => {
    const output = await runCli(['5\n', '1\n', '4\n']);

    expect(output).toContain('Invalid choice, please select 1-4.');
    expect(output).toContain('Current balance: 1000.00');
  });

  test('TC-013 exits with the COBOL goodbye message', async () => {
    const output = await runCli(['4\n']);

    expect(output).toContain('Exiting the program. Goodbye!');
  });

  test('TC-014 does not change the balance during repeated inquiries', () => {
    const store = new AccountDataStore(125000);

    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1250.00');
    expect(processOperation('TOTAL', null, store)).toBe('Current balance: 1250.00');
    expect(store.read()).toBe(125000);
  });

  test('TC-015 reads the stored balance through the data layer', () => {
    const store = new AccountDataStore();

    expect(store.read()).toBe(100000);
  });

  test('TC-016 writes and then reads a new balance through the data layer', () => {
    const store = new AccountDataStore();

    store.write(87525);

    expect(store.read()).toBe(87525);
  });

  test('TC-017 ignores unsupported data operations without changing storage', () => {
    const store = new AccountDataStore();

    expect(processOperation('TRANSFER', null, store)).toBeNull();
    expect(store.read()).toBe(100000);
  });

  test('TC-018 rejects a negative credit amount', () => {
    expect(() => parseAmount('-25.00')).toThrow('Please enter a valid amount');
  });

  test('TC-019 rejects a non-numeric transaction amount', () => {
    expect(() => parseAmount('ABC')).toThrow('Please enter a valid amount');
  });

  test('TC-020 rejects an amount beyond the COBOL numeric field size', () => {
    expect(() => parseAmount('1000000.00')).toThrow('Amount must be between 0.00 and 999999.99.');
  });

  test('TC-021 starts a new application with the initialized in-memory balance', () => {
    const previousRun = new AccountDataStore();
    previousRun.write(120000);

    const restartedRun = new AccountDataStore();

    expect(restartedRun.read()).toBe(100000);
  });
});