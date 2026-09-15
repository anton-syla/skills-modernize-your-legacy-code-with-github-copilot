# Account Management Test Plan

This test plan describes the current behavior of the COBOL account management application. It is intended for business stakeholder review and can later be converted into unit and integration tests for the Node.js implementation.

## Scope and test notes

- The application starts with an in-memory balance of `1000.00`.
- The balance is retained only while the COBOL application is running; no transaction history or external persistence is implemented.
- Test cases should be run in sequence only where a case explicitly depends on the result of a previous case. Otherwise, reset the application to its initial state before execution.
- `Actual Result`, `Status`, and execution-related `Comments` are intentionally left for the tester or stakeholder to complete.
- The current COBOL source does not define explicit validation or error handling for non-numeric amounts, negative amounts, amounts larger than the numeric field, or unsupported operation codes. Those cases are included to identify decisions needed for the Node.js version.

|Test Case ID|Test Case Description|Pre-conditions|Test Steps|Expected Result|Actual Result|Status (Pass/Fail)|Comments|
|---|---|---|---|---|---|---|---|
|TC-001|Start the application and display the account menu|Application is available to run.|1. Start the application. 2. Observe the first screen.|The menu displays the title `Account Management System`, options 1 through 4, and a prompt for a choice.||||
|TC-002|Confirm the default student account balance|Application has just started, or the balance has been reset to its initial state.|1. Select `1. View Balance`.|The application displays `Current balance: 1000.00`.||||
|TC-003|Credit an account with a whole-number amount|Account balance is `1000.00`.|1. Select `2. Credit Account`. 2. Enter `250`. 3. Select `1. View Balance`.|The credit is accepted, the application displays a new balance of `1250.00`, and a subsequent inquiry also returns `1250.00`.||||
|TC-004|Credit an account with a decimal amount|Account balance is `1000.00`.|1. Select `2. Credit Account`. 2. Enter `125.50`. 3. Select `1. View Balance`.|The credit is accepted and the balance becomes `1125.50`.||||
|TC-005|Credit an account with zero amount|Account balance is `1000.00`.|1. Select `2. Credit Account`. 2. Enter `0`. 3. Select `1. View Balance`.|Based on the current `PIC 9(6)V99` field and lack of a positive-value check, the operation is accepted and the balance remains `1000.00`. Stakeholders should confirm whether zero credits should instead be rejected.||||
|TC-006|Debit an account with sufficient funds|Account balance is `1000.00`.|1. Select `3. Debit Account`. 2. Enter `300`. 3. Select `1. View Balance`.|The debit is accepted, the application displays a new balance of `700.00`, and a subsequent inquiry returns `700.00`.||||
|TC-007|Debit an amount equal to the current balance|Account balance is `1000.00`.|1. Select `3. Debit Account`. 2. Enter `1000.00`. 3. Select `1. View Balance`.|The debit is accepted because the rule is `current balance >= amount`. The resulting balance is `0.00`.||||
|TC-008|Reject a debit greater than the current balance|Account balance is `1000.00`.|1. Select `3. Debit Account`. 2. Enter `1000.01`. 3. Select `1. View Balance`.|The application displays `Insufficient funds for this debit.` The balance is unchanged at `1000.00`.||||
|TC-009|Debit an account with zero amount|Account balance is `1000.00`.|1. Select `3. Debit Account`. 2. Enter `0`. 3. Select `1. View Balance`.|Based on the current field definition and lack of a positive-value check, the operation is accepted and the balance remains `1000.00`. Stakeholders should confirm whether zero debits should instead be rejected.||||
|TC-010|Confirm multiple operations use the latest balance|Application has started with balance `1000.00`.|1. Credit `100.00`. 2. Debit `40.00`. 3. View the balance.|The final balance is `1060.00`, demonstrating that each operation reads the latest stored balance before changing it.||||
|TC-011|Confirm a failed debit does not write a changed balance|Account balance is `1000.00`.|1. Attempt to debit `1500.00`. 2. Credit `50.00`. 3. View the balance.|The failed debit does not reduce the account. The credit is applied to the original balance, resulting in `1050.00`.||||
|TC-012|Handle an invalid menu choice|Application is displaying the main menu.|1. Enter a menu value outside `1-4`, such as `5`. 2. Observe the response. 3. Enter `1`.|The application displays `Invalid choice, please select 1-4.` and redisplays the menu. The next valid choice is still processed.||||
|TC-013|Exit the application|Application is displaying the main menu.|1. Select `4. Exit`.|The application stops processing menu actions and displays `Exiting the program. Goodbye!`.||||
|TC-014|Preserve the balance during a balance inquiry|Account balance has been changed to a known value, such as `1250.00`.|1. Select `1. View Balance` twice. 2. Compare both results.|Both inquiries return the same balance. Viewing the balance does not change it.||||
|TC-015|Read the stored balance through the data program|`DataProgram` is callable and its storage has its initial value.|1. Call `DataProgram` with operation `READ` and a balance variable. 2. Inspect the returned variable.|The passed balance variable is set to the stored balance, initially `1000.00`.||||
|TC-016|Write and then read a new balance through the data program|`DataProgram` is callable.|1. Set a passed balance variable to `875.25`. 2. Call `DataProgram` with operation `WRITE`. 3. Call it again with operation `READ`.|The subsequent `READ` returns `875.25`, confirming that `WRITE` updates the in-memory storage balance.||||
|TC-017|Confirm unsupported data operation behavior|`DataProgram` is callable.|1. Set a passed balance variable to `650.00`. 2. Call `DataProgram` with an operation other than `READ` or `WRITE`. 3. Inspect both the passed variable and stored balance.|The current COBOL code has no error response for an unsupported operation and performs no read or write. Stakeholders should define the expected Node.js behavior, such as returning a validation error.||||
|TC-018|Enter a negative credit amount|Account balance is `1000.00`.|1. Select `2. Credit Account`. 2. Enter a negative value, such as `-25.00`.|The current COBOL data field is unsigned (`PIC 9(6)V99`), so negative input handling is not explicitly defined. Record the observed runtime behavior and obtain a business decision for the Node.js implementation.||||
|TC-019|Enter a non-numeric transaction amount|Account balance is `1000.00`.|1. Select either credit or debit. 2. Enter non-numeric input, such as `ABC`.|The current COBOL source does not define a validation or error message for non-numeric input. Record the observed runtime behavior and obtain a business decision for the Node.js implementation.||||
|TC-020|Enter an amount beyond the supported numeric field size|Account balance is `1000.00`.|1. Select either credit or debit. 2. Enter an amount greater than `999999.99`.|The `PIC 9(6)V99` field cannot represent more than six integer digits and two decimal digits. The current source does not define overflow handling. Record the observed runtime behavior and define the Node.js validation response with stakeholders.||||
|TC-021|Confirm account state is in memory only|Application has been run and the balance has been changed from `1000.00` to a known value, such as `1200.00`.|1. Exit the application. 2. Restart the application. 3. View the balance.|The restarted application returns to the initialized balance of `1000.00`; changes from the previous process are not persisted.||||

## Stakeholder decisions to capture

- Should zero-value credits and debits be accepted, or must transaction amounts be greater than zero?
- What validation and user-facing error should apply to negative, non-numeric, or oversized amounts?
- What should happen when the data layer receives an unsupported operation code?
- Should the Node.js application persist balances between restarts, and if so, where?
- Should the Node.js version preserve the current messages and two-decimal currency display format?
