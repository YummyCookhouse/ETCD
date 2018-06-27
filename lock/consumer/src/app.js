import ETCD from 'node-etcd';
import fetch from 'node-fetch';

const etcdServer = process.env.ETCD_HOST || 'http://127.0.0.1:2379';
const etcdClient = new ETCD(etcdServer);
const LOCK_KEY = '/item-lock';
const LOCK_LOCKED = 'locked';
const LOCK_RELEASED = 'released';
const watcher = etcdClient.watcher(LOCK_KEY);

let isWaitingForLock = false;
let isLockObtained = false;

watcher.on("change", () => {
  isWaitingForLock = false;
});

const lock = () => new Promise((resolve) => {
  console.log('Trying to obtain lock');
  etcdClient.compareAndSwap(LOCK_KEY, LOCK_LOCKED, LOCK_RELEASED, err => {
    if (!err) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
});

const unlock = () => {
  isWaitingForLock = false;
  isLockObtained = false;
  console.log('Release lock');
  etcdClient.compareAndSwap(LOCK_KEY, LOCK_RELEASED, LOCK_LOCKED);
};

const withCurrencyLock = callback => {
    if (!isWaitingForLock && !isLockObtained) {
      lock().then(state => {
        isLockObtained = state;
        if (isLockObtained) {
          console.log('Obtained lock and processing');
          callback().then(unlock).catch(unlock);
        } else {
          isWaitingForLock = true;
          console.log('Waiting for lock')
        }
      }).catch(() => {});
    };
  };

const proceedOrder = () => new Promise(resolve => {
    fetch('http://provider:5000/items/1').then(response => response.json()).then(json => {
      console.log(`item stocks: ${json.count}`);
      if (json.count > 0) {
        fetch('http://provider:5000/orders', {
          method:'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({"item": 1, "count": 1}),
        }).then(response => response.json())
          .then(json => resolve());
      } else {
        resolve();
      }
    });
  });

setInterval(() => {
  withCurrencyLock(proceedOrder);
}, 20);