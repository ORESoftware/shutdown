#!/usr/bin/env node
'use strict';

import * as async from 'async';
import {EVCb} from "./index";
import * as fs from 'fs';
import * as path from 'path';
import log from './logger';
import * as cp from 'child_process';

type Task = (cb: EVCb<any>) => void;
const q = async.queue<Task, any>((task, cb) => task(cb), 3);

const root = path.resolve(process.env.HOME);

const status = {
  doneSearching: false
};

q.drain = q.error = (err?: any) => {
  
  if(err){
    log.error(err);
  }

  if(status.doneSearching === true){
    log.info('All done.');
    process.exit(0);
  }
  
};


const makeTask = function (p: string) {
  
  return <Task>(cb => {
  
    const k = cp.spawn('bash');
    
    k.stdin.end([
      `set -e`,
      `git add .`,
      `git add -A`,
      `( git commit -am "auto-commit" || { echo "Could not commit"; } )`,
      `git push`
    ]
      .join(' && '));
  
    k.stderr.pipe(process.stderr);
    
    k.once('exit', code => {
      cb(null, {code, path: p});
    });
    
  });

};




(function searchDir(dir: string, cb: EVCb<any>){

  
  fs.readdir(dir, (err, items) => {
    
    if(err){
     log.warn(err.message);
      return cb(null);
    }
    
    const filtered = items.filter(v => {
        return !String(v).endsWith('node_modules');
    });
    
    async.eachLimit(filtered, 3, (item, cb) => {
    
      const full = path.resolve(dir + '/' + item);
    
      fs.lstat(full, (err,stats) => {
  
  
        if(err){
          log.warn(err.message);
          return cb(null);
        }
  
        
        if(stats.isDirectory()){
          return searchDir(full, cb);
        }
        
        
        if(stats.isFile()) {
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
  
  if(err){
    throw err;
  }
  
  log.info('Done searching.')
  
  
});
