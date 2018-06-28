import ETCD from 'node-etcd';
import express from 'express';

const MASTER_KEY='/cluster/master';
const CLUSTER_SLAVE_KEY='/cluster/slaves';
const ttl = 6;
const myName = process.env.MY_NAME;
const etcdServer = process.env.ETCD_HOST || 'http://127.0.0.1:2379';
const etcdClient = new ETCD(etcdServer);
const masterStateWatcher = etcdClient.watcher(MASTER_KEY);
const clusterStateWatcher = etcdClient.watcher(CLUSTER_SLAVE_KEY, null, {recursive: true});
const clusterSlaves = {};

const app = new express();
const PORT = process.env.PORT || 5000;

let masterHost = null;

const getMasterName = () => new Promise(resolve =>
  etcdClient.get(MASTER_KEY, (err, reply) => {
    resolve(reply.node.value || null);
  }));

const tryVoteSelf = () => new Promise(resolve =>
  etcdClient.set(MASTER_KEY, myName, { prevExist: false, ttl }, err => {
    resolve(!err);
  }));

const sendHeartBeat = (key, prevValue ,interval = 3000) =>
  setInterval(() => etcdClient.set(key, myName, { prevValue, ttl }), interval);

const watchForClusterChange = () => {
  clusterStateWatcher.on("change", reply => {
    if (reply.action === 'expire') {
      delete clusterSlaves[reply.node.key];
    } else if (reply.action === 'set') {
      clusterSlaves[reply.node.key] = reply.node.value;
    }
  });
};

const watchForMasterChange = () =>
  masterStateWatcher.on("expire", () => {
    console.log('Going to re-electing master node');
    setMasterHost();
  });

const beMaster = () => {
  console.log('Became master node myself');
  masterHost = myName;
  masterStateWatcher.stop();
  watchForClusterChange();
  sendHeartBeat(MASTER_KEY, myName);
};

const beSlave = () => {
  getMasterName().then(name => {
    masterHost = name;
    console.log(`Found existing master node:${masterHost}`);
    clusterStateWatcher.stop();
    watchForMasterChange();
    sendHeartBeat(`${CLUSTER_SLAVE_KEY}/${myName}`);
  });
};

const setMasterHost = () => tryVoteSelf().then(succeed => succeed ? beMaster() : beSlave());

app.get('/info', function (req, res) {
  if (masterHost === myName) {
    res.json({
      'slaves': Object.values(clusterSlaves)
    });
  } else {
    res.json({
      'master': masterHost
    });
  }
});

app.listen(PORT, setMasterHost);



