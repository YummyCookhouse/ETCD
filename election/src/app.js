import ETCD from 'node-etcd';
import express from 'express';

const MASTER_KEY='/cluster/master';
const ttl = 6;
const myName = process.env.MY_NAME;
const etcdServer = process.env.ETCD_HOST || 'http://127.0.0.1:2379';
const etcdClient = new ETCD(etcdServer);
const watcher = etcdClient.watcher(MASTER_KEY);

const app = new express();
const PORT = process.env.PORT || 5000;

let masterHost = null;

const getMasterName = () => new Promise(resolve => {
  etcdClient.get(MASTER_KEY, (err, reply) => {
    resolve(reply.node.value || null);
  });
});

const tryVoteSelf = () => new Promise((resolve ) => {
  etcdClient.set(MASTER_KEY, myName, { prevExist: false, ttl }, err => {
    resolve(!err);
  });
});

const sendHeartBeat = (interval = 3000) => {
  setInterval(() => etcdClient.set(MASTER_KEY, myName, { prevValue: myName, ttl }), interval);
};

const watchForDimission = () => {
  watcher.on("change", reply => {
    if (reply.node.value != masterHost) {
      console.log('Going to re-electing master node');
      setMasterHost();
    }
  });
};

const beMaster = () => {
  console.log('Became master node myself');
  masterHost = myName;
  watcher.stop();
  sendHeartBeat();
};

const setMasterHost = () => {
  tryVoteSelf().then(succeed => {
    if (succeed) {
      beMaster();
    } else {
      getMasterName().then(name => {
        masterHost = name;
        console.log(`Found existing master node:${masterHost}`);
        watchForDimission();
      });
    }
  });
};

setMasterHost();

app.get('/info', function (req, res) {
  res.json({
    'master': masterHost,
    'myName': myName
  });
});

app.listen(PORT, () => {
  console.log('Service start at port: ' + PORT);
});



