#!/usr/bin/env bash

rm -rf node_modules
npm install

curl -XPUT http://etcd0:2379/v2/keys/item-lock -d value="released"

./node_modules/nodemon/bin/nodemon.js