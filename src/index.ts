import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';

// Constants for Quotes
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

    /**
     * Returns a random quote from the provided list.
     */
    private getRandomQuote(quotes: string[]): string {
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    /**
     * Invoked when the test run begins.
     */
    onBegin(): void {
        console.log(`🚀 Test run started!`);
        this.startTime = Date.now();
    }

    /**
     * Invoked when a setup or global error occurs.
     */
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

    /**
     * Invoked at the end of each test.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        const timeTaken = (result.duration / 1000).toFixed(2);
        if (result.status === 'passed') {
            this.passedCount++;
            console.log(`✅ ${test.title} in ${timeTaken}s`);
        } else if (result.status === 'failed') {
            this.failedCount++;
            const failure = result.errors[0];
            if (failure) {
                const message = failure.message || '';
                const stack = failure.stack || '';
                this.failures.push({
                    title: test.title,
                    message,
                    stack,
                    timeTaken,
                });
            }
            console.error(`❌ ${test.title} in ${timeTaken}s`);
        }
    }

    /**
     * Invoked when all tests have finished.
     */
    onEnd(): void {
        const endTime = Date.now();
        const totalTime = ((endTime - this.startTime) / 1000).toFixed(2);
        const totalTests = this.passedCount + this.failedCount;

        console.log(`\n`);
        if (this.setupFailures.length > 0) {
            console.error(`❌ Setup or runtime errors occurred:`);
            this.setupFailures.forEach((failure, index) => {
                console.error(`
Setup Failure #${index + 1}
   Message: ${failure.message}
   ${failure.stack ? `Stack Trace:\n${failure.stack}` : ''}
`);
            });
            console.error(`❌ Test run aborted due to setup failures.`);
            console.error(`"${this.getRandomQuote(FAILURE_QUOTES)}"`);
            return;
        }

        if (this.failedCount > 0) {
            console.log(
                `❌ ${this.failedCount} of ${totalTests} tests failed | ${this.passedCount} passed | ⏱ Total Execution Time: ${totalTime}s`,
            );
            console.log(`\nFailures:`);
            this.failures.forEach((failure, index) => {
                console.log(`
  ${index + 1}. ${failure.title}
     Error: ${failure.message}
     ${failure.stack ? `Stack Trace:\n${failure.stack}` : ''}
     Time Taken: ${failure.timeTaken}s
`);
            });
            console.log(`\n❌ Tests failed with exit code 1`);
            console.log(`"${this.getRandomQuote(FAILURE_QUOTES)}"`);
        } else {
            console.log(`✅ All ${totalTests} tests passed | ⏱ Total Execution Time: ${totalTime}s`);
            console.log(`"${this.getRandomQuote(SUCCESS_QUOTES)}"`);
        }
    }
}
