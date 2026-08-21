# Layer 2 — Scalable Systems: Setup & Testing Guide

## Quick Start

### 1. Start All Services
```bash
cd /workspaces/Lab-Project-Kelompok13
docker compose down -v    # Clean slate (optional)
docker compose up -d --build
sleep 15
docker compose ps         # Verify 14 containers running
```

### 2. Verify Gateway Health
```bash
curl http://localhost:8080/health
# Output: gateway ok
```

### 3. Test Individual Services Through Gateway
```bash
# Payment Service
curl -X POST http://localhost:8080/payments \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-123","metode":"transfer"}'

# Notification Service
curl -X POST http://localhost:8080/notifications \
  -H "Content-Type: application/json" \
  -d '{"event":"order_created","payload":{"orderId":"ORD-123"}}'
```

---

## Load Testing

### Run Baseline Load Test
```bash
bash loadtest.sh
```

**Output files:**
- `loadtest-baseline-payment.txt` — Payment service metrics
- `loadtest-baseline-notification.txt` — Notification service metrics

### Interpret Results

**Key Metrics to Compare:**
- **p50 Latency:** Median response time (50th percentile)
- **p95 Latency:** 95% of requests respond faster than this
- **p99 Latency:** 99% of requests respond faster than this (tail latency)
- **Avg Req/Sec:** Average throughput per second
- **Error Rate:** Should be 0%

**Example Baseline:**
```
Payment Service:
  p50: 237ms (good)
  p95: 550ms (acceptable)
  p99: 693ms (watch for growth)
  Throughput: 1,895 Req/Sec (baseline)

Notification Service:
  p50: 333ms (slower than payment)
  p95: 649ms
  p99: 720ms
  Throughput: 1,395 Req/Sec (26% slower)
```

---

## Architecture

### Load Balancing Strategy

```
Client (curl, load test)
    ↓
    ↓ (50 concurrent connections)
    ↓
Nginx Gateway (8080)
    ├─ /payments → payment-service:3003 (least_conn)
    ├─ /notifications → notification-service:3004
    ├─ /events → event-service:3001
    └─ /tickets → ticket-service:3002
    
    Each upstream has 3 replicas:
    - payment-service-1,2,3
    - notification-service-1,2,3
    - event-service-1,2,3
    - ticket-service-1,2,3

PostgreSQL (5432)
    ← Used by event-service & ticket-service
```

### How Services Scale

1. **Nginx `least_conn`:** Routes to replica with fewest active connections
   - Example: If replica-1 has 10 connections, replica-2 has 5, replica-3 has 8
   - Next request goes to replica-2 (least connected)

2. **Docker Compose DNS:** Automatically resolves `event-service` to all 3 instances
   - Nginx queries `event-service` → gets all 3 IPs
   - Load balancer chooses best replica via `least_conn`

3. **Stateless Services:** Each replica is independent
   - No shared memory, no session affinity needed
   - Any replica can handle any request
   - Easy to scale: just increase `replicas: X` in docker-compose

---

## Monitoring & Debugging

### View Logs for Specific Service
```bash
# Payment service logs
docker compose logs payment-service -f

# See which replica is handling requests
docker compose logs event-service-1
docker compose logs event-service-2
docker compose logs event-service-3
```

### Simulate Replica Failure
```bash
# Kill one replica
docker compose kill payment-service-2

# Verify load still balanced across payment-service-1,3
docker compose logs payment-service -f

# Watch throughput doesn't drop (Docker automatically restarts)
```

### Check Container Resource Usage
```bash
docker stats --no-stream
```

---

## Performance Optimization Checklist

After establishing baseline, optimize in this order:

### Layer 3 (Performance Tuning)
- [ ] Database connection pool tuning
- [ ] Nginx buffer optimization
- [ ] Node.js GC settings
- [ ] Request compression (gzip)
- [ ] Service-to-service caching (Redis)

**Expected Improvements:**
- p50 latency: 237ms → 150ms (reduce by 30%)
- p99 latency: 693ms → 400ms (reduce tail jank)
- Throughput: 1,895 → 2,500 Req/Sec (+30%)

---

## Files Delivered

### Configuration
- ✅ `docker-compose.yml` — Scalable 3-replica setup
- ✅ `nginx.conf` — Load balancer with least_conn
- ✅ `Dockerfile` × 4 — Optimized with npm ci

### Testing
- ✅ `loadtest.sh` — Automated load test script
- ✅ `loadtest-baseline-payment.txt` — Payment baseline
- ✅ `loadtest-baseline-notification.txt` — Notification baseline
- ✅ `PERFORMANCE-REPORT.md` — Detailed metrics analysis

### Dependencies
- ✅ `package-lock.json` × 4 — Reproducible builds

### Documentation
- ✅ `AI-LOG.md` — Full audit trail with decisions/rejections
- ✅ `README.md` — This guide

---

## Common Issues & Fixes

### Gateway returns 502 Bad Gateway
```
Cause: Upstream service crashed or not healthy
Fix: docker compose restart payment-service (or whichever failed)
     docker compose logs payment-service (check error)
```

### High latency (p99 > 1000ms)
```
Cause: Database connection pool exhausted or service bottleneck
Fix: 
  1. Check replica count: docker compose ps | grep payment
  2. Increase replicas: replicas: 5 in docker-compose.yml
  3. Restart: docker compose up -d
  4. Re-test: bash loadtest.sh
```

### Load test fails with "Connection refused"
```
Cause: Services not ready, gateway not started
Fix: 
  1. Wait 15 seconds after docker compose up
  2. Verify: curl http://localhost:8080/health
  3. Check logs: docker compose logs gateway
```

---

## Next Steps

1. **Commit this setup to git:**
   ```bash
   git add -A
   git commit -m "Layer 2: Scalable systems with 3-replica load balancing"
   git push
   ```

2. **Document in presentation:**
   - Show docker compose ps (12 replicas + 1 db + 1 gateway)
   - Show nginx.conf least_conn strategy
   - Show baseline metrics from PERFORMANCE-REPORT.md
   - Mention Layer 3 optimization plan

3. **Prepare for Layer 3:**
   - Identify slowest path (notification 357ms avg)
   - Profile database queries
   - Plan caching strategy
