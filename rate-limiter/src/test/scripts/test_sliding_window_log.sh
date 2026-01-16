#!/bin/bash

BASE_URL="http://localhost:8080/api"
CLIENT_HEADER="X-Client-Id: test-user"

echo "========================================"
echo " Testing SLIDING WINDOW LOG (EDGE CASES)"
echo "========================================"

echo
echo "Initializing limiter (capacity=5, window=10s)"
# Expected: success
curl -s -X POST "$BASE_URL/init" \
  -H "Content-Type: application/json" \
  -d '{
        "algorithm": "SLIDING_WINDOW_LOG",
        "maxRequests": 5,
        "windowSize": 10000
      }'
echo
echo

echo "---- Phase 1: Burst at window start (t = 0s) ----"
echo "# Expected: ALLOWED, ALLOWED"

for i in {1..2}
do
  echo "Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 2: Extra hits before window ends (t = 8s) ----"
echo "# Expected: ALLOWED, ALLOWED, BLOCKED, BLOCKED"
sleep 8

for i in {1..4}
do
  echo "Late Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 3: Hits exactly at window boundary (t ≈ 10s) ----"
echo "# Expected: ALLOWED, ALLOWED"
sleep 2

for i in {1..2}
do
  echo "Boundary Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 4: Hits just after window rolls (t ≈ 11s) ----"
echo "# Expected: ALLOWED, ALLOWED, BLOCKED"
sleep 1

for i in {1..3}
do
  echo "Post-window Request $i:"
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
echo "========================================"
echo " Done"
echo "========================================"
