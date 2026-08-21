# Performance Testing Report — Layer 2: Scalable Systems

**Date:** 2026-08-21  
**Project:** War Tiket Konser (Kelompok13)  
**Tester:** DevOps Engineer  
**Load Test Tool:** Autocannon v7.x  

---

## Executive Summary

Layer 2 implementation establishes **baseline performance metrics** for the scalable microservices system. All services deployed with **3 replicas** and **Nginx load balancer** (least_conn strategy). Zero error rate achieved under 50 concurrent connections for 20 seconds.

---

## System Configuration

### Infrastructure
- **Database:** PostgreSQL 16-alpine (1 instance)
- **Services:** 4 microservices × 3 replicas each = 12 application containers
- **Load Balancer:** Nginx alpine (1 instance)
- **Total Containers:** 14

### Service Replicas
```
├── event-service (3 replicas on 3001/tcp)
├── ticket-service (3 replicas on 3002/tcp)
├── payment-service (3 replicas on 3003/tcp)
├── notification-service (3 replicas on 3004/tcp)
├── gateway (Nginx on 8080/tcp)
└── db (PostgreSQL on 5432/tcp)
```

### Load Balancing Strategy
- **Algorithm:** `least_conn` (connection-aware round-robin)
- **Gateway:** Nginx with proxy timeouts
- **DNS:** Docker Compose automatic DNS round-robin to replicas

---

## Test Methodology

### Test Parameters
- **Concurrent Connections:** 50
- **Duration:** 20 seconds
- **Pipelining Factor:** 10
- **Request Method:** POST (to simulate realistic payment/notification workflows)
- **Load Profile:** Sustained load (not ramp-up)

### Endpoints Tested
1. **Payment Service:** `POST /payments`
   - Payload: `{"orderId": "ORD-12345", "metode": "transfer"}`
   - Expected Response: 201 Created
   
2. **Notification Service:** `POST /notifications`
   - Payload: `{"event": "order_created", "payload": {"orderId": "ORD-12345"}}`
   - Expected Response: 202 Accepted

---

## Baseline Results

### Payment Service Performance

#### Latency Distribution
```
Percentile  Latency
───────────────────
Min         80 ms
p2.5        148 ms
p50         237 ms  ← Median
p95         550 ms
p97.5       (from 97.5% value)
p99         693 ms  ← 99th percentile
Max         1202 ms
Avg         262 ms
Stdev       104 ms
```

#### Throughput
```
Metric          Value
──────────────────────
Req/Sec (Avg)   1,895
Req/Sec (Min)   913
Req/Sec (Max)   2,453
Bytes/Sec (Avg) 625 kB
Total Requests  38,000
Total Bytes     12.5 MB
Error Rate      0%
```

#### Interpretation
- **Median latency 237ms:** Acceptable for payment processing through gateway
- **p99 latency 693ms:** Some requests slow, likely due to:
  - Database connection pool contention
  - Nginx buffer delays under peak load
- **Zero errors:** Load balancer stable, no timeouts or dropped requests
- **Consistent throughput:** 1,895 Req/Sec avg (some variance per second = load spikes)

---

### Notification Service Performance

#### Latency Distribution
```
Percentile  Latency
───────────────────
Min         150 ms
p2.5        188 ms
p50         333 ms  ← Median
p95         649 ms
p97.5       (from 97.5% value)
p99         720 ms  ← 99th percentile
Max         1193 ms
Avg         357 ms
Stdev       121 ms
```

#### Throughput
```
Metric          Value
──────────────────────
Req/Sec (Avg)   1,395
Req/Sec (Min)   780
Req/Sec (Max)   1,828
Bytes/Sec (Avg) 364 kB
Total Requests  28,000
Total Bytes     7.28 MB
Error Rate      0%
```

#### Interpretation
- **Median latency 333ms:** Slower than payment service by ~100ms
  - Likely cause: Stateless service not optimized for high throughput
  - No database query, but still seeing latency
- **p99 latency 720ms:** Tail latency higher than payment (693ms)
- **Throughput gap:** 1,395 Req/Sec vs 1,895 for payment (~26% slower)
- **Zero errors:** Service stable, no failures

---

## Performance Characteristics

### Observed Patterns

1. **Rebalancing Success:** 
   - All 3 replicas received traffic (verified via `docker compose logs`)
   - `least_conn` prevented hot-spotting on single replica

2. **Latency Tail:**
   - p99 ~700ms for sustained 50 concurrent connections
   - Within acceptable range for payment systems (typically <1s)

3. **Throughput Variance:**
   - Min 913 Req/Sec (payment) = 41% below average
   - Max 2,453 Req/Sec (payment) = 29% above average
   - Indicates uneven load distribution OR bursty traffic pattern

4. **Memory Efficiency:**
   - 3 stateless Node.js replicas = independent instances
   - No shared state = no race conditions
   - Horizontal scaling ready

---

## Capacity Analysis

### Single Replica Theoretical Capacity
If one service replica handles ~1,895/3 ≈ **632 Req/Sec baseline**  
(Assuming even distribution, accounting for load balancer overhead)

### Scaling Implications
- **Current:** 3 replicas × 632 Req/Sec = ~1,900 Req/Sec aggregate
- **Scale to 10 replicas:** ~6,300 Req/Sec (10× load capacity)
- **Scale to 20 replicas:** ~12,600 Req/Sec (20× load capacity)

---

## Optimization Opportunities (Layer 3)

### High-Priority
1. **Database Connection Pool Tuning**
   - Current: default pool settings
   - Action: Increase max connections, add connection recycling
   - Expected Gain: Reduce p95/p99 latency by 10-20%

2. **Nginx Upstream Configuration**
   - Current: basic least_conn
   - Action: Add keepalive, buffer tuning, upstream health checks
   - Expected Gain: Reduce latency variance, improve min throughput

3. **Node.js Process Tuning**
   - Current: default V8 memory limits
   - Action: Profile CPU/memory under load, tune GC settings
   - Expected Gain: Reduce GC pause jank (visible in p99 tail)

### Medium-Priority
4. **Request/Response Compression**
   - Current: no gzip compression in nginx
   - Action: Enable `gzip on` for payloads >1KB
   - Expected Gain: Reduce bytes/sec by 50-70%, improve p50 latency

5. **Service-to-Service Caching**
   - Current: every request hits backend
   - Action: Add Redis for hot data (user session, event cache)
   - Expected Gain: +50-100% throughput for read-heavy endpoints

### Low-Priority
6. **HTTP/2 Support**
   - Current: HTTP/1.1 via Nginx
   - Action: Enable HTTP/2 in Nginx upstream
   - Expected Gain: Marginal for small payloads, significant for multiplexing

---

## Artifacts & Files

✅ **docker-compose.yml** — Scalable configuration with replicas  
✅ **nginx.conf** — Load balancer configuration  
✅ **loadtest.sh** — Automated load test script  
✅ **loadtest-baseline-payment.txt** — Raw autocannon output  
✅ **loadtest-baseline-notification.txt** — Raw autocannon output  
✅ **Dockerfile × 4** — Optimized with npm ci  
✅ **package-lock.json × 4** — Reproducible dependency management  

---

## Recommendations for Next Iteration

1. **Document regression test:** Run loadtest.sh weekly to catch performance degradation
2. **Implement alerting:** Monitor p95 latency threshold (set to 500ms)
3. **Add profiling:** Instrument services with APM (Application Performance Monitoring)
4. **Plan Layer 3:** Load testing under failure scenarios (replica crash recovery)

---

## Approval Checklist

- [x] Baseline metrics established for payment service
- [x] Baseline metrics established for notification service
- [x] Load balancer deployed and verified
- [x] All replicas verified running and receiving traffic
- [x] Zero error rate under 50 concurrent connections
- [x] Metrics documented for comparison in future runs
- [x] AI-LOG.md updated with decisions and rejections
- [x] Deliverables committed to main branch

---

**Status:** ✅ Layer 2 Complete — Ready for Layer 3 Optimization  
**Next Review:** After implementing optimizations from High-Priority section
