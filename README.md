# **Playwright CI Reporter**

A CI-friendly custom reporter for Playwright tests, providing enhanced logging, failure summaries, and a touch of humor. This reporter makes debugging and tracking test results easier while adding some personality to your test logs.

---

## **Features**

- Detailed test status logging for passed and failed tests.
- Comprehensive failure summaries with error messages, stack traces, and execution time.
- Random inspirational or humorous quotes for passed or failed test suites.
- Fully compatible with Playwright's test runner.
- Outputs logs to both the console and a file for easier debugging.

---

## **Installation**

Install the package using npm:

```bash
npm install playwright-ci-reporter
```

---

## **Usage**

Integrate the `playwright-ci-reporter` into your Playwright configuration file (`playwright.config.ts`):

```typescript
import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './tests', // Adjust to your test directory
    retries: 2, // Example of using retries
    reporter: [['playwright-ci-reporter']],
    use: {
        trace: 'on-first-retry', // Example: trace only on retries
        video: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
});
```

---

## **Example Logs**

### **When Tests Pass**

```plaintext
2024-12-05T18:09:57.036Z info: ✅ Test Completed: Customer can see and interact with the "Skip to Main Content" button - Status: passed - Time taken: 6.13s
2024-12-05T18:09:57.642Z info: ✅ Test Completed: Verify tab navigation in the Country and Language FlyIn - Status: passed - Time taken: 6.74s

✅ All Tests Passed:
“Victory is ours!” - Braveheart
```

### **When Tests Fail**

```plaintext
2024-12-05T18:10:11.796Z info: ❌ Test Completed: Audit accessibility violations on the footer - Status: failed - Time taken: 5.36s

❌ Summary of Failures:

Failure #1
🚨 Test: Audit accessibility violations on the footer
⏱ Time Taken: 5.36s
📜 Error Message: expect(received).toBe(expected) // Object.is equality
📜 Stack Trace:
Error: expect(received).toBe(expected) // Object.is equality
    at /path/to/test/file.test.ts:20:28

“I find your lack of passing disturbing.” - Darth Vader
```

---

## **Configuration**

### **Reporter Options**

This reporter logs:

1. **Test Status**: Indicates whether a test has passed or failed.
2. **Execution Time**: Logs how long each test took to execute.
3. **Failure Summary**: Provides detailed information for failed tests, including:
    - Error message
    - Stack trace
    - Execution time

### **Output**

- **Console**: Real-time logs during test execution.
- **File**: Logs saved to `logs/info.log` (default location).

---

## **Customization**

If you wish to modify the behavior of this reporter, you can fork the repository or create your own implementation based on this package.

---

## **Development**

To work on this package locally:

1. Clone the repository:

    ```bash
    git clone https://github.com/basal-john/playwright-ci-reporter.git
    cd playwright-ci-reporter
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build the package:

    ```bash
    npm run build
    ```

4. Test it locally by linking it to another project:

    ```bash
    npm link
    cd /path/to/your/playwright-project
    npm link playwright-ci-reporter
    ```

5. Run tests in the Playwright project to verify the reporter:
    ```bash
    npx playwright test
    ```

---

## **Future Enhancements**

- Add configurable output formats (e.g., JSON, HTML).
- Support custom quotes or log formats.
- Add support for other test runners (e.g., Jest, Mocha).

---

## **Contributing**

Contributions are welcome! If you’d like to report a bug, suggest a feature, or contribute to the codebase, feel free to open an issue or submit a pull request.

---

## **License**

This package is licensed under the [MIT License](LICENSE).
