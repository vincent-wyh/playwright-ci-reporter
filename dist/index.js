"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const { combine, timestamp, printf, colorize } = winston_2.format;
const consoleTransport = new winston_1.default.transports.Console({
    format: combine(colorize(), printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })),
});
const logger = winston_1.default.createLogger({
    level: 'info',
    format: combine(timestamp(), printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })),
    transports: [new winston_1.default.transports.File({ filename: 'logs/info.log', level: 'info' }), consoleTransport],
});
class CustomReporterConfig {
    constructor() {
        this.failures = new Map();
    }
    getRandomFailureQuote() {
        const quotes = [
            '“Houston, we have a problem.” - Apollo 13',
            '“Failure is not an option.” - Apollo 13',
            '“Why so serious?�� - The Dark Knight',
            '“I find your lack of passing disturbing.” - Darth Vader',
            "“It's not a bug, it's a feature!” - Every developer ever",
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    getRandomSuccessQuote() {
        const quotes = [
            '“Hasta la vista, baby.” - The Terminator',
            '“All systems go!” - NASA',
            '“That’s one small step for man, one giant leap for… tests?” - Apollo 11',
            '“Victory is ours!” - Braveheart',
            "“I'm king of the world!” - Titanic",
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    onTestEnd(test, result) {
        const statusIcon = result.status === 'passed' ? '✅' : '❌';
        const timeTaken = (result.duration / 1000).toFixed(2);
        logger.info(`${statusIcon} Test Completed: ${test.title} - Status: ${result.status} - Time taken: ${timeTaken}s`);
        if (result.status === 'failed') {
            const failure = result.errors[0];
            if (failure) {
                const message = failure.message || '';
                const stack = failure.stack || '';
                const stackWithoutMessage = stack.replace(message, '').trim();
                this.failures.set(test.title, {
                    message: message,
                    stack: stackWithoutMessage,
                    timeTaken: timeTaken,
                });
            }
        }
    }
    onEnd() {
        if (this.failures.size > 0) {
            console.log(`\n\x1b[1m❌ Summary of Failures:\x1b[0m\n`);
            let index = 1;
            for (const [title, failure] of this.failures) {
                console.log(`
Failure #${index++}
🚨 Test: ${title}
⏱ Time Taken: ${failure.timeTaken}s
📜 Error Message: ${failure.message}
📜 Stack Trace:\n${failure.stack}
                `);
            }
            console.log(`\n${this.getRandomFailureQuote()}`);
        }
        else {
            console.log(`\n\x1b[1m✅ All Tests Passed:\x1b[0m\n`);
            console.log(`${this.getRandomSuccessQuote()}`);
        }
        logger.info(`✨ All tests completed.`);
    }
}
exports.default = CustomReporterConfig;
