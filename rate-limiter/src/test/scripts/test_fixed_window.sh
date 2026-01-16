#!/bin/bash

BASE_URL="http://localhost:8080/api"
CLIENT_HEADER="X-Client-Id: fixed-user"

echo "========================================"
echo " Testing FIXED WINDOW (EDGE CASES)"
echo "========================================"

echo
echo "Initializing FIXED WINDOW limiter"
# Expected: success
curl -s -X POST "$BASE_URL/init" \
  -H "Content-Type: application/json" \
  -d '{
        "algorithm": "FIXED_WINDOW",
        "maxRequests": 5,
        "windowSize": 10000
      }'
echo
echo

echo "---- Phase 1: Burst at window start (t = 0s) ----"
echo "# Expected: ALLOWED, ALLOWED, ALLOWED, ALLOWED, ALLOWED"

for i in {1..5}
do
  echo "Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 2: Burst just BEFORE window ends (t ≈ 9s) ----"
echo "# Expected: BLOCKED, BLOCKED, BLOCKED, BLOCKED, BLOCKED"

sleep 9

for i in {1..5}
do
  echo "Late Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "---- Phase 3: Immediate burst AFTER window resets (t ≈ 10s) ----"
echo "# Expected: ALLOWED, ALLOWED, ALLOWED, ALLOWED, ALLOWED, BLOCKED"

sleep 1

for i in {1..6}
do
  echo "Post-reset Request $i:"
  curl -s -H "$CLIENT_HEADER" "$BASE_URL/hit"
  echo
done

echo
echo "========================================"
echo " Done"
echo "========================================"
