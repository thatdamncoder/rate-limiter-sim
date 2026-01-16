#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "========================================"
echo " Testing TOKEN BUCKET"
echo " capacity=5, refillRate=1 token/sec"
echo "========================================"

echo
echo "Initializing TOKEN BUCKET limiter"
# Expected: success
curl -s -X POST "$BASE_URL/init" \
  -H "Content-Type: application/json" \
  -d '{
        "algorithm": "TOKEN_BUCKET",
        "bucketCapacity": 5,
        "refillRate": 1
      }'
echo
echo

echo "---- Phase 1: Initial burst ----"
echo "# Expected: ALLOWED, ALLOWED, ALLOWED, ALLOWED, ALLOWED, BLOCKED"

for i in {1..6}
do
  echo "Request $i:"
  curl -s "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 2: Immediate retry ----"
echo "# Expected: BLOCKED"

echo "Request 7:"
curl -s "$BASE_URL/hit"
echo

echo
echo "Sleeping 2 seconds (refill ~2 tokens)"
sleep 2

echo
echo "---- Phase 3: After refill ----"
echo "# Expected: ALLOWED, ALLOWED, BLOCKED"

for i in {1..3}
do
  echo "Request after refill $i:"
  curl -s "$BASE_URL/hit"
  echo
done

echo
echo "Sleeping 5 seconds (full refill)"
sleep 5

echo
echo "---- Phase 4: Full burst again ----"
echo "# Expected: ALLOWED, ALLOWED, ALLOWED, ALLOWED, ALLOWED, BLOCKED"

for i in {1..6}
do
  echo "Post-refill Request $i:"
  curl -s "$BASE_URL/hit"
  echo
done

echo
echo "========================================"
echo " Done"
echo "========================================"
