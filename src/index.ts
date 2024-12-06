import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import winston from 'winston';
import {format} from 'winston';

const {combine, timestamp, printf, colorize} = format;

// Helper function to format timestamps
const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
        timeStyle: 'medium',
        hour12: false,
    }).format(date);
};

// Console transport for colorful logs
const consoleTransport = new winston.transports.Console({
    format: combine(
        colorize(),
        printf(({level, message, timestamp}) => `[${timestamp}] ${level}: ${message}`),
    ),
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({format: () => formatTimestamp(new Date())}),
        printf(({level, message, timestamp}) => `[${timestamp}] ${level}: ${message}`),
    ),
    transports: [new winston.transports.File({filename: 'logs/info.log', level: 'info'}), consoleTransport],
});

export default class CustomReporterConfig implements Reporter {
    private failures = new Map<string, {message: string; stack: string; timeTaken: string}>();
    private startTime: number = 0;

    /**
     * Get a random failure quote.
     * @returns {string} A random failure quote.
     */
    private getRandomFailureQuote(): string {
        const quotes = [
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
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    /**
     * Get a random success quote.
     * @returns {string} A random success quote.
     */
    private getRandomSuccessQuote(): string {
        const quotes = [
            '“Hasta la vista, baby.” - The Terminator',
            '“All systems go!” - NASA',
            '“That’s one small step for man, one giant leap for… tests!” - Apollo 11',
            '“Victory is ours!” - Braveheart',
            "“I'm king of the world!” - Titanic",
            '“You’re a wizard, Harry!” - Harry Potter',
            '“Live long and prosper.” - Star Trek',
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    /**
     * Invoked when the test run begins.
     * Tracks the start time for total execution time calculation.
     */
    onBegin(): void {
        this.startTime = Date.now();
        logger.info('🚀 Test run started!');
    }

    /**
     * Invoked at the end of each test.
     * Logs the test result and stores failure details if the test failed.
     *
     * @param {TestCase} test - The test case that finished.
     * @param {TestResult} result - The result of the test case.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        const statusIcon = result.status === 'passed' ? '✅' : '❌';
        const timeTaken = (result.duration / 1000).toFixed(2);

        logger.info(
            `${statusIcon} Test Completed: ${test.title} - Status: ${result.status} - Time taken: ${timeTaken}s`,
        );

        if (result.status === 'failed') {
            const failure = result.errors[0];
            if (failure) {
                const message = failure.message || '';
                const stack = failure.stack || '';
                const stackWithoutMessage = stack.replace(message, '').trim();

                this.failures.set(test.title, {
                    message,
                    stack: stackWithoutMessage,
                    timeTaken,
                });
            }
        }
    }

    /**
     * Invoked when all tests have finished.
     * Logs a summary of failures or a success message, along with total execution time.
     */
    onEnd(): void {
        const endTime = Date.now();
        const totalTime = ((endTime - this.startTime) / 1000).toFixed(2);

        if (this.failures.size > 0) {
            console.log(`\n\x1b[1m❌ Summary of Failures:\x1b[0m`);
            let index = 1;
            for (const [title, failure] of this.failures) {
                console.log(`
Failure #${index++}
🚨 Test: ${title}
⏱ Time Taken: ${failure.timeTaken}s
📜 Error Message: ${failure.message}
📜 Stack Trace:
${failure.stack}`);
            }
            console.log(`\n${this.getRandomFailureQuote()}`);
        } else {
            console.log(`\n\x1b[1m✅ All Tests Passed:\x1b[0m`);
            console.log(`${this.getRandomSuccessQuote()}`);
        }

        const completionMessage = `✨ All tests completed in ${totalTime}s.`;
        console.log(`\n${completionMessage}`);
    }
}
