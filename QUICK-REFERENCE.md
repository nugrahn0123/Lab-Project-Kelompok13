# Layer 2 Quick Reference

## 🚀 Start System
```bash
docker compose up -d --build
sleep 15
docker compose ps
```

## ✅ Verify System
```bash
bash verify-layer2.sh
```

## 📊 Run Load Tests
```bash
bash loadtest.sh
# Output: loadtest-baseline-payment.txt, loadtest-baseline-notification.txt
```

## 📈 View Results
```bash
cat PERFORMANCE-REPORT.md
```

## 📖 Learn Setup
```bash
cat LAYER2-GUIDE.md
```

## 🔍 Test Endpoints
```bash
# Payment
curl -X POST http://localhost:8080/payments \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-1","metode":"transfer"}'

# Notification  
curl -X POST http://localhost:8080/notifications \
  -H "Content-Type: application/json" \
  -d '{"event":"test","payload":{}}'

# Health
curl http://localhost:8080/health
```

## 📊 Baseline Metrics

| Metric | Payment | Notification |
|--------|---------|--------------|
| p50 Latency | 237 ms | 333 ms |
| p95 Latency | 550 ms | 649 ms |
| p99 Latency | 693 ms | 720 ms |
| Throughput | 1,895 Req/Sec | 1,395 Req/Sec |
| Error Rate | 0% | 0% |

## 🏗️ Architecture

```
50 Concurrent Connections
         ↓
    Nginx (8080)
    least_conn LB
      ↓ ↓ ↓
   Rep1 Rep2 Rep3 × 4 services
         ↓
    PostgreSQL
```

## 📋 Files

- `docker-compose.yml` — Scalable config
- `nginx.conf` — Load balancer
- `loadtest.sh` — Automated tests
- `PERFORMANCE-REPORT.md` — Detailed analysis
- `LAYER2-GUIDE.md` — Setup guide
- `DELIVERABLES-LAYER2.md` — Checklist
- `LAYER2-SUMMARY.md` — This summary

## 🔧 Key Configs

**Replicas per service:** 3 (in docker-compose.yml)  
**Load balancing:** least_conn (in nginx.conf)  
**Build optimization:** npm ci (in Dockerfiles)  
**Test concurrency:** 50 connections  

## 🎯 Next: Layer 3

- Database connection pool tuning
- Nginx keepalive configuration
- Request compression (gzip)
- Service caching (Redis)

## 💡 Quick Tips

- Monitor with: `docker compose logs -f [service]`
- Test under load: `bash loadtest.sh`
- Compare metrics: baseline files saved automatically
- Scale up: change `replicas: 3` → `replicas: 10` in docker-compose.yml

---

**Status: ✅ Layer 2 Complete — All Systems Operational**
