import {Reporter, TestCase, TestResult} from '@playwright/test/reporter';
import winston from 'winston';
import {format} from 'winston';

const {combine, timestamp, printf, colorize} = format;

// Console transport for colorful logs
const consoleTransport = new winston.transports.Console({
    format: combine(
        colorize(),
        printf(({level, message, timestamp}) => `${timestamp} ${level}: ${message}`),
    ),
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        printf(({level, message, timestamp}) => `${timestamp} ${level}: ${message}`),
    ),
    transports: [new winston.transports.File({filename: 'logs/info.log', level: 'info'}), consoleTransport],
});

// Custom Reporter
export default class CustomReporterConfig implements Reporter {
    private failures = new Map<string, {message: string; stack: string; timeTaken: string}>();

    // Generates a random failure quote
    private getRandomFailureQuote(): string {
        const quotes = [
            '“Houston, we have a problem.” - Apollo 13',
            '“Failure is not an option.” - Apollo 13',
            '“Why so serious?” - The Dark Knight',
            '“I find your lack of passing disturbing.” - Darth Vader',
            "“It's not a bug, it's a feature!” - Every developer ever",
            'Oh, crap, it failed! But it worked on my machine!',
            "Tests won't fail if you have no tests!",
            'PLEASE LET ME MERGE BEFORE I START CRYING',
            '“You can’t handle the truth!” - A Few Good Men',
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    // Generates a random success quote
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

    // Logs each test's result
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

    // Logs a summary of failures or a success message
    onEnd(): void {
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
        logger.info(`✨ All tests completed.`);
    }
}
