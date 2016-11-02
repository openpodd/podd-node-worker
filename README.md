# podd-node-worker
Nodejs worker for doing many tasks outside the Django box.

## Prerequisites
1. Nodejs, I recommend (nvm)[https://github.com/creationix/nvm] to manage nodejs version.
2. [MongoDB](https://docs.mongodb.org/)
3. [Redis](http://redis.io/)

## Run the worker
1. Install `nvm`, then the latest node version by `nvm install node`.
2. Run `npm install`
3. Copy configuration file at `config.js.sample` to `config.js` and modify at your need.
4. Run `node app.js`
