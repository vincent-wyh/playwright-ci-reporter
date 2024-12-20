import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import fs from 'fs';
import chalk from 'chalk';

const FAILURE_QUOTES = [
    '“Houston, we have a problem.” - Apollo 13',
    '“Failure is not an option.” - Apollo 13',
    '“Why so serious?” - The Dark Knight',
    '“I find your lack of passing disturbing.” - Darth Vader',
    "“It's not a bug, it's a feature!” - Every developer ever",
    'Oh, crap, it failed! But it worked on my machine!',
    "Tests won't fail if you have no tests!",
    'PLEASE LET ME MERGE BEFORE I START CRYING!',
    '“You can’t handle the truth!” - A Few Good Men',
];

const SUCCESS_QUOTES = [
    '“Hasta la vista, baby.” - The Terminator',
    '“All systems go!” - NASA',
    '“That’s one small step for man, one giant leap for… tests!” - Apollo 11',
    '“Victory is ours!” - Braveheart',
    "“I'm king of the world!” - Titanic",
    '“You’re a wizard, Harry!” - Harry Potter',
    '“Live long and prosper.” - Star Trek',
];

interface AttemptInfo {
    status: TestResult['status'];
    duration: number;
    errors: {message: string; stack?: string}[];
}

interface TestRecord {
    test: TestCase;
    attempts: AttemptInfo[];
}

/**
 * Custom reporter for Playwright tests.
 */
export default class CustomReporterConfig implements Reporter {
    private testRecords = new Map<string, TestRecord>();
    private setupFailures: {message: string; stack?: string}[] = [];
    private startTime: number = 0;
    private environmentUrl: string | undefined = process.env.TEST_URL || '';

    /**
     * Get a random quote from the provided list.
     * @param {string[]} quotes - List of quotes.
     * @returns {string} - Random quote.
     */
    private getRandomQuote(quotes: string[]): string {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    /**
     * Called when the test run begins.
     */
    onBegin(): void {
        console.log(chalk.cyanBright(`🚀 Test run started!`));
        if (this.environmentUrl) {
            console.log(chalk.blueBright(`[INFO] Running tests against: ${this.environmentUrl}`));
        }
        this.startTime = Date.now();
    }

    /**
     * Called when an error occurs during setup or runtime.
     * @param {Error} error - The error that occurred.
     */
    onError(error: Error): void {
        this.setupFailures.push({
            message: error.message,
            stack: error.stack,
        });
        console.error(chalk.red(`❌ Setup or runtime error: ${error.message}`));
        if (error.stack) {
            console.error(chalk.red(error.stack));
        }
    }

    /**
     * Called when a test ends.
     * @param {TestCase} test - The test case that ended.
     * @param {TestResult} result - The result of the test case.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        const title = test.title;
        const timeTaken = (result.duration / 1000).toFixed(2);

        if (!this.testRecords.has(title)) {
            this.testRecords.set(title, {
                test,
                attempts: [],
            });
        }

        const record = this.testRecords.get(title)!;
        record.attempts.push({
            status: result.status,
            duration: result.duration / 1000,
            errors: result.errors.map((e) => ({message: e.message || 'No error message', stack: e.stack})),
        });

        // Logging attempts
        if (result.status === 'passed') {
            if (result.retry > 0) {
                console.log(chalk.green(`✅ Retried and passed: ${test.title} in ${timeTaken}s`));
            } else {
                console.log(chalk.green(`✅ ${test.title} in ${timeTaken}s`));
            }
        } else if (result.status === 'failed' || result.status === 'timedOut') {
            if (result.retry > 0) {
                console.log(chalk.yellow(`🔄 Retry attempt for "${test.title}" (${result.status}) in ${timeTaken}s`));
            } else {
                console.log(chalk.red(`❌ ${test.title} failed in ${timeTaken}s`));
            }
        } else if (result.status === 'skipped') {
            console.log(chalk.yellow(`⚠️ ${test.title} was skipped.`));
        }
    }

    /**
     * Called when the test run ends.
     */
    onEnd(): void {
        const endTime = Date.now();
        const totalTime = (endTime - this.startTime) / 1000;

        let passedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let testCount = 0;
        let totalRetries = 0;
        const failures: {
            title: string;
            message: string;
            stack: string;
            timeTaken: number;
            isTimeout: boolean;
        }[] = [];
        const passedDurations: number[] = [];

        for (const {test, attempts} of this.testRecords.values()) {
            testCount++;
            const finalOutcome = test.outcome();
            const finalAttempt = attempts[attempts.length - 1];

            // Count retries if multiple attempts were made, regardless of final outcome
            const testRetries = attempts.length > 1 ? attempts.length - 1 : 0;
            totalRetries += testRetries;

            if (finalOutcome === 'expected' || finalOutcome === 'flaky') {
                passedCount++;
                passedDurations.push(...attempts.filter((a) => a.status === 'passed').map((a) => a.duration));
            } else if (finalOutcome === 'unexpected') {
                failedCount++;
                const timeTaken = finalAttempt.duration;
                const isTimeout = finalAttempt.errors.some((e) => e.message.includes('timeout'));
                const combinedMessage = finalAttempt.errors.map((e) => e.message).join('\n');
                const combinedStack = finalAttempt.errors.map((e) => e.stack || '').join('\n');

                failures.push({
                    title: test.title,
                    message: combinedMessage,
                    stack: combinedStack,
                    timeTaken,
                    isTimeout,
                });
            } else if (finalOutcome === 'skipped') {
                skippedCount++;
            }
        }

        const averageTime =
            passedDurations.length > 0 ? passedDurations.reduce((a, b) => a + b, 0) / passedDurations.length : 0;
        const slowestTest = passedDurations.length > 0 ? Math.max(...passedDurations) : 0;

        console.log(`\n`);
        if (failures.length > 0) {
            console.log(
                chalk.red(
                    `❌ ${failures.length} of ${testCount} tests failed | ${passedCount} passed | ⏱ Total: ${totalTime.toFixed(
                        2,
                    )}s`,
                ),
            );
            console.log(chalk.magenta(`\nAdditional Metrics:`));
            console.log(chalk.magenta(`- Average passed test time: ${averageTime.toFixed(2)}s`));
            if (slowestTest > 0) {
                console.log(chalk.magenta(`- Slowest test took: ${slowestTest.toFixed(2)}s`));
            }
            console.log(chalk.magenta(`- Total retries: ${totalRetries}`));

            console.log(chalk.red(`\nFailures:`));
            failures.forEach((failure, index) => {
                console.group(chalk.redBright(`--- Failure #${index + 1} ---`));
                console.log(chalk.redBright(`  Test: ${failure.title}`));
                console.log(chalk.red(`  Error(s):\n${failure.message}`));
                if (failure.stack) {
                    console.log(chalk.gray(`  Stack Trace:\n${failure.stack}`));
                }
                console.log(chalk.red(`  Time Taken: ${failure.timeTaken.toFixed(2)}s`));
                if (failure.isTimeout) {
                    console.log(chalk.yellow(`  (This failure involved a timeout.)`));
                }
                console.groupEnd();
            });

            console.log(chalk.red(`\n❌ Tests failed with exit code 1`));
            console.log(chalk.red(`"${this.getRandomQuote(FAILURE_QUOTES)}"`));

            this.writeJsonSummary(
                endTime,
                totalTime,
                averageTime,
                slowestTest,
                testCount,
                passedCount,
                failedCount,
                skippedCount,
                totalRetries,
                failures,
            );
            process.exit(1);
        } else {
            console.log(chalk.green(`✅ All ${testCount} tests passed | ⏱ Total: ${totalTime.toFixed(2)}s`));
            console.log(chalk.magenta(`- Average passed test time: ${averageTime.toFixed(2)}s`));
            if (slowestTest > 0) {
                console.log(chalk.magenta(`- Slowest test took: ${slowestTest.toFixed(2)}s`));
            }
            console.log(chalk.magenta(`- Total retries: ${totalRetries}`));
            console.log(chalk.green(`"${this.getRandomQuote(SUCCESS_QUOTES)}"`));

            this.writeJsonSummary(
                endTime,
                totalTime,
                averageTime,
                slowestTest,
                testCount,
                passedCount,
                failedCount,
                skippedCount,
                totalRetries,
                [],
            );
            process.exit(0);
        }
    }

    /**
     * Write the test summary to a JSON file.
     * @param {number} endTime - The end time of the test run.
     * @param {number} totalTime - The total time taken for the test run.
     * @param {number} averageTime - The average time taken for passed tests.
     * @param {number} slowestTest - The duration of the slowest test.
     * @param {number} totalTests - The total number of tests.
     * @param {number} passed - The number of passed tests.
     * @param {number} failed - The number of failed tests.
     * @param {number} skipped - The number of skipped tests.
     * @param {number} totalRetries - The total number of retries.
     * @param {any[]} failures - The list of failures.
     */
    private writeJsonSummary(
        endTime: number,
        totalTime: number,
        averageTime: number,
        slowestTest: number,
        totalTests: number,
        passed: number,
        failed: number,
        skipped: number,
        totalRetries: number,
        failures: any[],
    ) {
        const summary = {
            startTime: this.startTime,
            endTime: endTime,
            totalTimeSeconds: totalTime,
            totalTests,
            passed,
            failed,
            skipped,
            failures,
            averageTestDurationSeconds: averageTime,
            slowestTestDurationSeconds: slowestTest,
            totalRetries,
            environmentUrl: this.environmentUrl,
        };

        fs.writeFileSync('test-results.json', JSON.stringify(summary, null, 2));
    }
}
