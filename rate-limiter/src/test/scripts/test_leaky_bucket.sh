#!/bin/bash

BASE_URL="http://localhost:8080/api"
CLIENT_HEADER="X-Client-Id: leaky-user"

echo "========================================"
echo " Testing LEAKY BUCKET (EDGE CASES)"
echo "========================================"

echo
echo "Initializing LEAKY BUCKET limiter"
# capacity = 5
# leakRate = 1 request / second
curl -s -X POST "$BASE_URL/init" \
  -H "Content-Type: application/json" \
  -d '{
        "algorithm": "LEAKY_BUCKET",
        "bucketCapacity": 5,
        "leakRate": 1
      }'
echo
echo

echo "---- Phase 1: Burst exceeding capacity (t = 0s) ----"
echo "# Expected: ALLOWED x5, BLOCKED x2"

for i in {1..7}
do
  echo "Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 2: Partial leak (t ≈ 3s) ----"
echo "# Expected: ALLOWED x3 (bucket leaked ~3 tokens)"

sleep 3

for i in {1..3}
do
  echo "Post-leak Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 3: Immediate extra request ----"
echo "# Expected: BLOCKED (bucket full again)"

curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
echo

echo
echo "========================================"
echo " Done"
echo "========================================"
