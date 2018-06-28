## 原理
选举利用了ETCD的`ttl`, `prevExist`特性，当集群启动的时候都尝试检测`prevExist`和set key value, 当
任意candidate成功设置了之后，则成为master节点。master节点通过set(设置ttl)发送心跳检测到ETCD, 其他candidate
监听ttl的过期事件，当master挂掉之后心跳检测停止，之前ETCD的key会在ttl之后生效，然后其他的candidate会重新竞选master.

## 运行
1. 先启动ETCD集群
docker-compose -f docker-compose.yml up
2. 启动cluster
docker-compose -f election/docker-compose.yml up --build
3. rm竞选成为master的container
docker rm -f master容器名称


