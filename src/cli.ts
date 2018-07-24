#!/usr/bin/env node
'use strict';

import * as async from 'async';
import {EVCb} from "./index";
import * as fs from 'fs';
import * as path from 'path';
import log from './logger';
import * as cp from 'child_process';
import chalk from "chalk";
import pt from "prepend-transform";

type Task = (cb: EVCb<any>) => void;
const q = async.queue<Task, any>((task, cb) => task(cb), 3);

const root = path.resolve(process.env.HOME + '/WebstormProjects');

const status = {
  doneSearching: false
};

q.drain = q.error = (err?: any) => {

  if (err) {
    log.error(err);
  }

  if (status.doneSearching === true) {
    log.info('All done.');
    process.exit(0);
  }

  log.info('Queue drained but we are still searching.');
};

const funcs: Array<(p: string) => boolean> = [
  v => {
    return String(v).startsWith('.');
  },
  v => {
    return String(v).endsWith('node_modules');
  }
];

const matches = function (v: string) {
  return !funcs.some(fn => fn(v));
};

const makeTask = function (p: string): Task {

  return cb => {

    log.info('processing path:', p);

    const k = cp.spawn('bash');

    const cmd = [
      `set -e`,
      `cd ${p}`,
      `branch="$(git rev-parse --abbrev-ref HEAD)"`,
      `if [[ "$branch" != */feature/* && "$branch" != */bugfix/* ]]; then echo "exitting early"; exit 0; fi`,  //
      `echo "We are on the feature branch for this repo: ${p}"`,
      `git add .`,
      `git add -A`,
      `( git commit -am "auto-commit" || { echo "Could not commit"; } )`,
      `git push`
    ]
    .join(' && ');

    // log.info('Running the following command:', chalk.bold.cyan(cmd));
    k.stdin.end(cmd);

    k.stderr.pipe(pt(chalk.yellow(p + ': '))).pipe(process.stderr);

    k.once('exit', code => {
      cb(null, {code, path: p});
    });

  };

};


(function searchDir(dir: string, cb: EVCb<any>) {


  fs.readdir(dir, (err, items) => {

    if (err) {
      log.warn(err.message);
      return cb(null);
    }

    const filtered = items.filter(matches);

    async.eachLimit(filtered, 3, (item, cb) => {

      const full = path.resolve(dir + '/' + item);

      fs.lstat(full, (err, stats) => {

        if (err) {
          log.warn(err.message);
          return cb(null);
        }


        if (stats.isDirectory()) {
          return searchDir(full, cb);
        }


        if (stats.isFile()) {
          if (path.basename(full) === 'package.json') {
            q.push(makeTask(dir));
          }
        }

        cb(null);

      });

    }, cb);


  });


})(root, (err, results) => {

  status.doneSearching = true;

  if (err) {
    throw err;
  }

  if (q.idle() && q.empty()) {
    log.info('Queue is empty, shutting down.');
    process.exit(0);
  }

  log.info('Done searching foo.');

});
