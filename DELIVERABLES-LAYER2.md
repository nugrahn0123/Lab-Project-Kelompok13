# Layer 2 Deliverables Checklist ✅

**Project:** War Tiket Konser (Kelompok13)  
**Layer:** 2 — Scalable Systems  
**Completion Date:** 2026-08-21  
**Status:** ✅ COMPLETE  

---

## Artefak yang Diserahkan

### 1. ✅ Docker Compose Configuration
- **File:** `docker-compose.yml`
- **Status:** Complete & Tested
- **Features:**
  - PostgreSQL 16-alpine dengan healthcheck
  - 4 microservices × 3 replicas each
  - Nginx gateway pada port 8080
  - Proper dependency management (service_healthy)
  - Exposed internal ports (no direct service access)

### 2. ✅ Nginx Load Balancer Configuration
- **File:** `nginx.conf`
- **Status:** Complete & Tested
- **Features:**
  - 4 upstream clusters (event, ticket, payment, notification)
  - `least_conn` load balancing algorithm
  - Request tracing with X-Request-Id header
  - Proper timeout configuration (connect, send, read)
  - Health endpoint `/health`

### 3. ✅ Optimized Dockerfiles
- **Files:** `services/*/Dockerfile` (4 services)
- **Status:** Complete & Tested
- **Improvements:**
  - Changed `npm install` → `npm ci --omit=dev`
  - package*.json copied BEFORE source code (cache optimization)
  - Reproducible builds with lock files
  - Build time: ~2.2 seconds (vs ~13 seconds before optimization)

### 4. ✅ Package Lock Files
- **Files:** `services/*/package-lock.json` (4 services)
- **Status:** Generated & Committed
- **Purpose:** Reproducible dependency management across environments

### 5. ✅ Load Testing Infrastructure
- **File:** `loadtest.sh`
- **Status:** Complete & Tested
- **Capabilities:**
  - Automated load testing with autocannon
  - Tests both payment and notification services
  - 50 concurrent connections, 20 second duration
  - Generates baseline metrics for future comparison

### 6. ✅ Baseline Performance Metrics
- **Files:** 
  - `loadtest-baseline-payment.txt`
  - `loadtest-baseline-notification.txt`
- **Status:** Complete
- **Metrics Captured:**
  - Latency: p50, p95, p99, avg, max
  - Throughput: Req/Sec (min, avg, max)
  - Error rate
  - Total requests & bytes

### 7. ✅ Performance Analysis Report
- **File:** `PERFORMANCE-REPORT.md`
- **Status:** Complete & Detailed
- **Contents:**
  - Executive summary
  - System configuration diagram
  - Test methodology
  - Detailed latency & throughput analysis
  - Capacity planning calculations
  - Optimization opportunities (Layer 3 roadmap)
  - Approval checklist

### 8. ✅ Setup & Testing Guide
- **File:** `LAYER2-GUIDE.md`
- **Status:** Complete & Tested
- **Contents:**
  - Quick start instructions
  - Load testing procedures
  - Architecture explanation
  - Debugging guide
  - Performance optimization checklist
  - Common issues & fixes

### 9. ✅ AI-LOG.md Documentation
- **File:** `AI-LOG.md` (Layer 2 section added)
- **Status:** Complete & Detailed
- **Documents:**
  - Copilot usage: Dockerfile optimization prompt
  - Nginx load balancer configuration process
  - Multi-replica docker-compose setup
  - Load testing methodology
  - **Decisions made:** least_conn, 3 replicas, npm ci optimization
  - **Rejections documented:** `image: latest` (reproducibility), password in source (security)
  - Baseline metrics table with analysis

---

## Baseline Performance Metrics Summary

### Payment Service
```
Latency:
  p50: 237 ms (median)
  p95: 550 ms
  p99: 693 ms
  Avg: 262 ms
  
Throughput:
  Avg: 1,895 Req/Sec
  Total: 38,000 requests in 20 seconds
  Error Rate: 0%
```

### Notification Service
```
Latency:
  p50: 333 ms (median)
  p95: 649 ms
  p99: 720 ms
  Avg: 357 ms
  
Throughput:
  Avg: 1,395 Req/Sec
  Total: 28,000 requests in 20 seconds
  Error Rate: 0%
```

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│         Load Test Client (Autocannon)           │
│         50 concurrent connections               │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │   Nginx Gateway        │
        │   Port: 8080           │
        │   Strategy: least_conn │
        └────────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
    ┌─────┐    ┌─────┐    ┌─────┐
    │ Rep │    │ Rep │    │ Rep │    Payment Service
    │  1  │    │  2  │    │  3  │    (port 3003)
    └─────┘    └─────┘    └─────┘
    
    Similar setup for:
    - Event Service (3001)
    - Ticket Service (3002)
    - Notification Service (3004)
    
    All backed by:
    └──────────────────┬──────────────────┐
    ┌─────────────────────────────────────┐
    │   PostgreSQL 16-alpine              │
    │   Port: 5432                        │
    │   Health check: pg_isready          │
    └─────────────────────────────────────┘
```

---

## Key Performance Insights

### Strengths ✅
1. **Zero error rate** under 50 concurrent connections
2. **Median latency ~240ms** for payment (acceptable for payment gateway)
3. **Consistent throughput** (1,895 Req/Sec payment, 1,395 Req/Sec notification)
4. **Proper load distribution** across 3 replicas
5. **Database health checks** ensure service readiness

### Areas for Optimization (Layer 3) 📈
1. **Database connection pool** — current settings may be limiting throughput
2. **Notification service latency** — 333ms median vs 237ms payment (40% slower)
3. **p99 tail latency** — 693ms payment, 720ms notification (some requests slow)
4. **Throughput variance** — Min 913 Req/Sec vs Max 2,453 (uneven distribution)

---

## Testing & Validation

### ✅ Verification Checklist
- [x] All 14 containers running (12 service replicas + 1 db + 1 gateway)
- [x] Database health checks passing
- [x] Gateway responding on port 8080
- [x] All service endpoints accessible through gateway
- [x] Load test completed without errors
- [x] Baseline metrics captured
- [x] 0% error rate under sustained load
- [x] Replicas verified load balancing traffic
- [x] All configuration files validated
- [x] Documentation complete

### Testing Procedures Available
```bash
# Verify system status
docker compose ps

# Test gateway health
curl http://localhost:8080/health

# Test services through gateway
curl -X POST http://localhost:8080/payments \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-123","metode":"transfer"}'

# Run baseline load test
bash loadtest.sh

# Monitor logs during tests
docker compose logs -f payment-service
```

---

## Design Decisions & Rationale

### 1. Nginx `least_conn` vs Round-Robin
**Decision:** Use `least_conn` (connection-aware round-robin)  
**Rationale:** Better fairness when request processing time varies  
**Impact:** Prevents hot-spotting on single replica  

### 2. Three Replicas per Service
**Decision:** 3 replicas for all 4 microservices  
**Rationale:** Balance between redundancy (fault tolerance) and resource usage  
**Impact:** Can lose 1 replica without degradation; increases capacity by 3×  

### 3. `npm ci` Instead of `npm install`
**Decision:** Use `npm ci --omit=dev` in all Dockerfiles  
**Rationale:** Reproducible builds, lock file guarantee, faster due to better layer caching  
**Impact:** Build time reduced from ~13s to ~2.2s; same dependencies across environments  

### 4. Stateless Service Design
**Decision:** No in-process session storage; all state in database  
**Rationale:** Enables horizontal scaling; any replica can handle any request  
**Impact:** Scale from 3 to 300 replicas without code changes  

---

## Artifacts Rejection Log

### Rejected: `image: latest` for Autocannon
**Proposal:** Use `image: latest` for flexibility  
**Rejection Reason:** Not reproducible; different versions behave differently  
**Decision:** Document exact version or use specific tag (e.g., `node:22-alpine`)  
**Impact:** Ensures load test results are comparable across runs  

### Rejected: Password in `docker-compose.yml`
**Proposal:** Put `POSTGRES_PASSWORD: wartiket` directly in compose file  
**Rejection Reason:** Credentials in source control = security risk; should use env files or secrets  
**Workaround:** Currently acceptable for development (not production)  
**Action for Production:** Migrate to `.env` file or Docker secrets  

---

## Files Structure Summary

```
/workspaces/Lab-Project-Kelompok13/
├── docker-compose.yml          ✅ Scalable configuration
├── nginx.conf                  ✅ Load balancer config
├── loadtest.sh                 ✅ Automated load testing
├── loadtest-baseline-payment.txt
├── loadtest-baseline-notification.txt
├── PERFORMANCE-REPORT.md       ✅ Detailed analysis
├── LAYER2-GUIDE.md             ✅ Setup guide
├── AI-LOG.md                   ✅ Updated with Layer 2
├── services/
│   ├── event-service/
│   │   ├── Dockerfile          ✅ npm ci optimized
│   │   ├── package.json
│   │   ├── package-lock.json   ✅ Reproducible
│   │   └── index.js
│   ├── ticket-service/
│   │   ├── Dockerfile          ✅ npm ci optimized
│   │   ├── package-lock.json   ✅ Reproducible
│   │   └── ...
│   ├── payment-service/        ✅ npm ci optimized
│   └── notification-service/   ✅ npm ci optimized
└── docs/adr/                   (Existing from Layer 1)
```

---

## Next Steps: Layer 3 Preparation

### Ready for Optimization
1. **Baseline established:** Can now measure improvements
2. **Profiling targets identified:** Database pool, notification latency
3. **Roadmap clear:** High/medium/low priority optimizations documented

### Recommended Sequence
1. Database connection pool tuning (+15% throughput expected)
2. Nginx buffer optimization (+10% latency reduction)
3. Request compression (gzip) (+20% bandwidth reduction)
4. Caching strategy (Redis) (+50% throughput for read-heavy)

---

## Approval & Signoff

✅ **Deliverables Complete**  
✅ **Baseline Metrics Established**  
✅ **System Tested & Validated**  
✅ **Documentation Comprehensive**  
✅ **Ready for Layer 3 Optimization**  

---

**Prepared by:** DevOps Engineer (Kelompok13)  
**Date:** 2026-08-21  
**Status:** ✅ Layer 2 COMPLETE
