## 分布式锁
很多语言都提供了线程同步机制去处理关键资源的并发问题，但是仅限于单体应用，因为那些锁机制是无法处理不同进程甚至不同机器的并发问题。
所以在分布式系统中需要`分布式锁`来同步关键资源的访问。

## ETCD分布式锁的原理
用ETCD实现分布式锁基于ETCD的几个基本特性
- `compare and swap`
- `watch`

`compare and swap`特性允许你在给`ETCD`设置key-value对的时候检查当前value是否和你制定的preValue相同，如果不同则会异常。
可以通过这个特性来实现锁的获取。以nodejs为例:
```js
//假设ETCD中存储一个key叫lock,且初始值为`released`

//用compareAndSwap方法尝试将key=lock的value设置成'locked', 并且在设置之前检查preValue是否为'released'
etcdClient.compareAndSwap('/lock', 'locked', 'released', err => {
    if (!err) {
        //锁获取成功
    } else {
        //锁已经被占用
    }
});

```
同一时间只可能有一个进程将`/lock`的value从`released`改变成`locked`,而这个进程就视为获得了锁。

`watch`特性允许你去监听key的变化(如: delete, change, set等)，当一个进程获取锁失败之后可以利用`watch`特性去监听`change`事件以保证当锁释放之后
(从`locked`变为`released`)，进程可以第一时间去进行新一轮的锁竞争.

## 运行示例
本示例由2个app, 4个container组成，consumer和provider.
- provider x1: 提供item的查询以及消费api,当item消耗光了之后，每3秒会自动补充item的数量
- consumer x3: 先调用provider api获取item的信息，当item的库存大于0时，调用消费api(每次item数量-1). 每20ms执行一次

1. 先启动ETCD集群
docker-compose -f docker-compose.yml up
2. 启动provider
docker-compose -f lock/provider/docker-compose.yml up --build
3. 启动consumer集群
docker-compose -f lock/consumer/docker-compose.yml up --build


