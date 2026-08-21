#!/bin/bash

# Load Testing Script for War Tiket Konser Microservices
# Measures baseline and optimized performance

set -e

GATEWAY="http://localhost:8080"
CONCURRENT=50
DURATION=20
PIPELINING=10

echo "=========================================="
echo "War Tiket Konser - Load Testing Layer 2"
echo "=========================================="
echo ""

# Test 1: Payment Service (POST /payments)
echo "Test 1: Payment Service - Baseline (3 replicas)"
echo "Endpoint: $GATEWAY/payments"
echo "Concurrent connections: $CONCURRENT"
echo "Duration: $DURATION seconds"
echo ""

# Create a temporary autocannon input file for POST requests
cat > /tmp/autocannon-payload.js << 'EOF'
module.exports = {
  duration: 20,
  connections: 50,
  pipelining: 10,
  requests: [
    {
      path: '/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: 'ORD-' + Math.random().toString(36).substr(2, 9),
        metode: ['transfer', 'kartu', 'dompet'][Math.floor(Math.random() * 3)]
      })
    }
  ]
};
EOF

autocannon -c 50 -d 20 -p 10 \
  --method POST \
  --header "Content-Type: application/json" \
  --body '{"orderId":"ORD-12345","metode":"transfer"}' \
  http://localhost:8080/payments 2>&1 | tee loadtest-baseline-payment.txt

echo ""
echo "=========================================="
echo "Test 2: Notification Service - Baseline"
echo "=========================================="
echo "Endpoint: $GATEWAY/notifications"
echo ""

autocannon -c 50 -d 20 -p 10 \
  --method POST \
  --header "Content-Type: application/json" \
  --body '{"event":"order_created","payload":{"orderId":"ORD-12345"}}' \
  http://localhost:8080/notifications 2>&1 | tee loadtest-baseline-notification.txt

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Baseline metrics saved to:"
echo "  - loadtest-baseline-payment.txt"
echo "  - loadtest-baseline-notification.txt"
echo ""
echo "Key metrics to compare:"
echo "  - p50 latency (median)"
echo "  - p95 latency (95th percentile)"
echo "  - p99 latency (99th percentile)"
echo "  - Throughput (Req/Sec)"
echo "  - Error rate"
echo ""
