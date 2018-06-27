## 什么是ETCD?
> A highly-available key value store for shared configuration and service discovery.

## ETCD的应用场景
> 本repo用nodejs写了几个ETCD典型应用场景的example
- 存储配置
- [选举](https://github.com/YummyCookhouse/ETCD/tree/master/election)
- 服务发现
- 订阅与发布
- [分布式锁](https://github.com/YummyCookhouse/ETCD/tree/master/lock)
- 分布式队列

## ETCD vs ZooKeeper
- ETCD的运行维护更简洁
- ETCD基于[Raft](http://thesecretlivesofdata.com/raft/)共识算法, ZooKeeper基于Paxos共识算法。Raft更简单易于理解
- ETCD提供Restful API接口
- ETCD支持SSL客户端认证