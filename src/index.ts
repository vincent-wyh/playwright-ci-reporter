import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';

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

export default class CustomReporterConfig implements Reporter {
    private failures: {title: string; message: string; stack?: string; timeTaken: string}[] = [];
    private setupFailures: {message: string; stack?: string}[] = [];
    private startTime: number = 0;
    private passedCount: number = 0;
    private failedCount: number = 0;

    private getRandomQuote(quotes: string[]): string {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    onBegin(): void {
        console.log(`🚀 Test run started!`);
        this.startTime = Date.now();
    }

    onError(error: Error): void {
        this.setupFailures.push({
            message: error.message,
            stack: error.stack,
        });
        console.error(`❌ Setup or runtime error: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        const timeTaken = (result.duration / 1000).toFixed(2);

        // Determine if this is the final attempt:
        // The last attempt is when the current attempt index matches `test.results.length - 1`.
        // The 'retry' property is actually the attempt index (0-based).
        const isLastAttempt = result.retry === test.results.length - 1;

        if (!isLastAttempt) {
            // Not the final attempt. Just log info if desired and return.
            // If the test eventually passes on a retry, we don't record this as failed.
            if (result.status === 'passed') {
                // If it passed on a retry attempt (somewhat unusual), we can log it here:
                console.log(`✅ Retried and passed: ${test.title} in ${timeTaken}s`);
            } else if (result.status === 'failed' || result.status === 'timedOut') {
                console.log(`🔄 Retry attempt for ${test.title} (${result.status})`);
            }
            return;
        }

        // This is the final attempt. Check the final outcome.
        const finalOutcome = test.outcome();
        // finalOutcome can be 'expected', 'unexpected', 'skipped', or 'flaky'.

        if (finalOutcome === 'expected' || finalOutcome === 'flaky') {
            // The test ended in a passing state.
            this.passedCount++;
            // If first try success and no retries were needed:
            if (result.retry === 0 && !test.results.some((r) => r.retry > 0)) {
                console.log(`✅ ${test.title} in ${timeTaken}s`);
            }
            // If it was flaky (passed after a retry), we already logged the retried and passed message above.
        } else if (finalOutcome === 'unexpected') {
            // The test ended in a failing state.
            this.failedCount++;
            console.error(`❌ ${test.title} failed in ${timeTaken}s`);
            this.failures.push({
                title: test.title,
                message: result.errors.map((e) => e.message || 'No error message available.').join('\n'),
                stack: result.errors.map((e) => e.stack || 'No stack trace available.').join('\n'),
                timeTaken,
            });
        } else if (finalOutcome === 'skipped') {
            console.warn(`⚠️ ${test.title} was skipped.`);
        }
    }

    onEnd(): void {
        const endTime = Date.now();
        const totalTime = ((endTime - this.startTime) / 1000).toFixed(2);
        const totalTests = this.passedCount + this.failedCount;

        console.log(`\n`);
        if (this.failures.length > 0) {
            console.log(
                `❌ ${this.failures.length} of ${totalTests} tests failed | ${this.passedCount} passed | ⏱ Total Execution Time: ${totalTime}s`,
            );
            console.log(`\nFailures:`);
            this.failures.forEach((failure, index) => {
                console.log(`
        --- Failure #${index + 1} ---
        Test: ${failure.title}
        Error(s):
        ${failure.stack ? `Stack Trace:\n${failure.stack}` : ''}
        Time Taken: ${failure.timeTaken}s
        `);
            });
            console.log(`\n❌ Tests failed with exit code 1`);
            console.log(`"${this.getRandomQuote(FAILURE_QUOTES)}"`);
            process.exit(1);
        } else {
            console.log(`✅ All ${totalTests} tests passed | ⏱ Total Execution Time: ${totalTime}s`);
            console.log(`"${this.getRandomQuote(SUCCESS_QUOTES)}"`);
            process.exit(0);
        }
    }
}
