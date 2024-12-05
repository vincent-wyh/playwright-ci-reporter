import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
export default class CustomReporterConfig implements Reporter {
    private failures;
    private getRandomFailureQuote;
    private getRandomSuccessQuote;
    onTestEnd(test: TestCase, result: TestResult): void;
    onEnd(): void;
}
