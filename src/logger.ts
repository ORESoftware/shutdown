'use strict';

import chalk from 'chalk';

export const log = {
  info: console.log.bind(console, chalk.bold.cyan.underline('ores_shutdown:')),
  error: console.error.bind(console, chalk.magenta.bold.underline('ores_shutdown/error:')),
  warn: console.error.bind(console, chalk.yellow.bold.underline('ores_shutdown/warn:'))
};

export default log;
