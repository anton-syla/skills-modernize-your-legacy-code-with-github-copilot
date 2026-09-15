'use strict';

const readline = require('node:readline');

const INITIAL_BALANCE_CENTS = 100000;
const MAX_AMOUNT_CENTS = 99999999;

class AccountDataStore {
  constructor(initialBalanceCents = INITIAL_BALANCE_CENTS) {
    this.balanceCents = initialBalanceCents;
  }

  read() {
    return this.balanceCents;
  }

  write(balanceCents) {
    if (!Number.isSafeInteger(balanceCents) || balanceCents < 0 || balanceCents > MAX_AMOUNT_CENTS) {
      throw new RangeError('Balance must be between 0.00 and 999999.99.');
    }

    this.balanceCents = balanceCents;
  }
}

function formatBalance(balanceCents) {
  return (balanceCents / 100).toFixed(2);
}

function parseAmount(input) {
  const normalizedInput = String(input).trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedInput)) {
    throw new TypeError('Please enter a valid amount with up to two decimal places.');
  }

  const [wholePart, fractionPart = ''] = normalizedInput.split('.');
  const amountCents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));

  if (!Number.isSafeInteger(amountCents) || amountCents > MAX_AMOUNT_CENTS) {
    throw new RangeError('Amount must be between 0.00 and 999999.99.');
  }

  return amountCents;
}

function processOperation(operation, amountInput, dataStore) {
  const operationType = String(operation).trim();

  if (operationType === 'TOTAL') {
    const balanceCents = dataStore.read();
    return `Current balance: ${formatBalance(balanceCents)}`;
  }

  if (operationType !== 'CREDIT' && operationType !== 'DEBIT') {
    return null;
  }

  const amountCents = parseAmount(amountInput);
  const currentBalanceCents = dataStore.read();

  if (operationType === 'CREDIT') {
    const newBalanceCents = currentBalanceCents + amountCents;
    dataStore.write(newBalanceCents);
    return `Amount credited. New balance: ${formatBalance(newBalanceCents)}`;
  }

  if (currentBalanceCents < amountCents) {
    return 'Insufficient funds for this debit.';
  }

  const newBalanceCents = currentBalanceCents - amountCents;
  dataStore.write(newBalanceCents);
  return `Amount debited. New balance: ${formatBalance(newBalanceCents)}`;
}

function displayMenu(output) {
  output('--------------------------------');
  output('Account Management System');
  output('1. View Balance');
  output('2. Credit Account');
  output('3. Debit Account');
  output('4. Exit');
  output('--------------------------------');
}

async function runApplication(input = process.stdin, outputStream = process.stdout) {
  const interfaceInstance = readline.createInterface({ input, output: outputStream });
  const dataStore = new AccountDataStore();
  const output = (message) => outputStream.write(`${message}\n`);
  const lines = interfaceInstance[Symbol.asyncIterator]();

  const readLine = async (prompt) => {
    outputStream.write(prompt);
    const nextLine = await lines.next();
    return nextLine.done ? '' : nextLine.value;
  };

  try {
    let continueRunning = true;

    while (continueRunning) {
      displayMenu(output);
      const choice = await readLine('Enter your choice (1-4): ');

      switch (choice.trim()) {
        case '1':
          output(processOperation('TOTAL', null, dataStore));
          break;
        case '2':
          output('Enter credit amount: ');
          await processAmountInput('CREDIT', readLine, dataStore, output);
          break;
        case '3':
          output('Enter debit amount: ');
          await processAmountInput('DEBIT', readLine, dataStore, output);
          break;
        case '4':
          continueRunning = false;
          break;
        default:
          output('Invalid choice, please select 1-4.');
      }
    }

    output('Exiting the program. Goodbye!');
  } finally {
    interfaceInstance.close();
  }
}

async function processAmountInput(operation, readLine, dataStore, output) {
  const amountInput = await readLine('');

  try {
    output(processOperation(operation, amountInput, dataStore));
  } catch (error) {
    output(error.message);
  }
}

if (require.main === module) {
  runApplication().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  AccountDataStore,
  formatBalance,
  parseAmount,
  processOperation,
  runApplication,
};