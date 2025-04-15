/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */

function getStatusEmoji(status) {
  switch (status) {
    case 'passed':
      return '✅';
    case 'failed':
      return '❌';
    case 'timedOut':
      return '⏱️';
    case 'skipped':
      return '⏭️';
    default:
      return '❓';
  }
}

/**
 * @typedef {import('@playwright/test/reporter').Reporter} PwReporter
 */

/** @implements {PwReporter} */
class MyReporter {
  onBegin(config, suite) {
    console.log(
      `\n=====================================\n Starting LCT Worksheet with ${
        suite.allTests().length
      } cases\n=====================================\n`
    );
  }

  onTestBegin(test) {
    console.log(`> Case "${test.title}"`);
  }

  onTestEnd(test, result) {
    console.log(
      `> Finished Case "${test.title}" (${
        result.duration
      } ms | Status ${getStatusEmoji(result.status)} ("${result.status}"))\n\n`
    );

    if (result?.error?.message) {
      console.log(`Case error log:\n${result.error.message}\n\n\n`);
    }
  }

  onEnd(result) {
    console.log(
      `Finished Worksheet execution | Status ${getStatusEmoji(
        result.status
      )} ("${result.status}")`
    );
  }

  onStepEnd(test, result, step) {
    let title = step.title;

    if (title.includes('Screenshot on failure')) {
      title = title.replace(
        'Screenshot on failure',
        '🚨 Screenshot on failure 🚨'
      );
    }

    console.log(
      `    ${!step.error ? '✅' : '❌'} ${title} (${step.duration} ms)`
    );

    if (step.error) {
      console.log(`    ${step.error.message}`);
    }
  }
}

module.exports = MyReporter;
