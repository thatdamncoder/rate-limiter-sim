#!/bin/bash

BASE_URL="http://localhost:8080/api"
CLIENT_HEADER="X-Client-Id: sliding-user"

echo "=============================================="
echo " Testing SLIDING WINDOW COUNTER (EDGE CASES)"
echo "=============================================="

echo
echo "Initializing SLIDING WINDOW COUNTER limiter"
# windowSize = 10 seconds, maxRequests = 5
curl -s -X POST "$BASE_URL/init" \
  -H "Content-Type: application/json" \
  -d '{
        "algorithm": "SLIDING_WINDOW_COUNTER",
        "maxRequests": 5,
        "windowSize": 10
      }'
echo
echo

echo "---- Phase 1: Burst at window start (t = 0s) ----"
echo "# Expected: ALLOWED x5"

for i in {1..5}
do
  echo "Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 2: Extra requests immediately (t ≈ 0s) ----"
echo "# Expected: BLOCKED (estimated count exceeds limit)"

for i in {1..2}
do
  echo "Extra Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 3: Half window elapsed (t ≈ 5s) ----"
echo "# Expected: MAY still be BLOCKED (sliding weight applied)"

sleep 5

curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
echo

echo
echo "---- Phase 4: Window fully slides (t ≈ 10s) ----"
echo "# Expected: ALLOWED (previous window weight ≈ 0)"

sleep 5

for i in {1..3}
do
  echo "Post-slide Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 5: Trying after retry ----"
echo "# Expected: "
sleep 7

for i in {1..2}
do
  echo "Post-window Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "=============================================="
echo " Done"
echo "=============================================="
