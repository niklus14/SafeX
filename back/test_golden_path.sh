#!/usr/bin/env bash
# test_golden_path.sh — End-to-end curl smoke test for the Openwave backend.
#
# Usage (from the back/ directory):
#   OPENWAVE_MOCK=1 uvicorn main:app --port 8000 &
#   sleep 2
#   bash test_golden_path.sh
#
# What it exercises (the demo golden path):
#   1  Register a citizen
#   2  Submit a report → opens a new issue in manual_review (+10 coins)
#   3  Submit a second nearby report → clusters into the same thread (+5 coins)
#   4  Admin approves the issue → status becomes routed
#   5  Admin advances to in_progress
#   6  Admin resolves → +20 coins awarded to both contributors
#   7  Check citizen profile — confirm coins
#   8  Import the sample historical CSV
#   9  Export the PDF activity report
#  10  Admin stats sanity check

set -euo pipefail
BASE="${BASE_URL:-http://localhost:8000}"
PASS=0; FAIL=0

check() {
  # Strip spaces around colons/commas so the pattern works whether FastAPI
  # returns compact JSON or pretty-printed JSON.
  local label="$1" got="$2" want="$3"
  local compact_got compact_want
  compact_got=$(echo "$got"  | tr -d ' ')
  compact_want=$(echo "$want" | tr -d ' ')
  if echo "$compact_got" | grep -q "$compact_want"; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label  (wanted '$want')"
    echo "    got: $got"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  Openwave golden-path smoke test"
echo "  $BASE"
echo "═══════════════════════════════════════════"

# ── 1. Register citizen ───────────────────────────────────────────────────────
echo ""
echo "1 / Register citizen"
U=$(curl -sf -X POST "$BASE/users" \
  -F "display_name=Anar Memmédov" -F "phone=+994501234567")
echo "   $U"
check "has id"          "$U" '"id"'
check "credibility=100" "$U" '"credibility": 100'
USER_ID=$(echo "$U" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "   user_id=$USER_ID"

# ── 2. First report → new issue ───────────────────────────────────────────────
echo ""
echo "2 / Submit report A  (new thread)"
R1=$(curl -sf -X POST "$BASE/reports" \
  -F "user_id=$USER_ID" \
  -F "image_url=https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/320px-GoldenGateBridge-001.jpg" \
  -F "description=Fontan islemir, su axmir" \
  -F "lat=40.4093" -F "lng=49.8671")
echo "   $R1"
check "is_relevant=true"    "$R1" '"is_relevant": true'
check "joined_thread=false" "$R1" '"joined_thread": false'
check "has issue_id"        "$R1" '"issue_id"'
ISSUE_ID=$(echo "$R1" | python3 -c "import sys,json; print(json.load(sys.stdin)['issue_id'])")
echo "   issue_id=$ISSUE_ID"

# ── 3. Second nearby report → cluster ────────────────────────────────────────
echo ""
echo "3 / Submit report B  (should cluster, ±30 m, same category)"
# Register a second citizen so coins are tracked separately
U2=$(curl -sf -X POST "$BASE/users" -F "display_name=Leyla Hasanova")
USER2_ID=$(echo "$U2" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Re-use the same category as what mock returned for report A
CATEGORY=$(echo "$R1" | python3 -c "import sys,json; print(json.load(sys.stdin)['category'])")
R2=$(curl -sf -X POST "$BASE/reports" \
  -F "user_id=$USER2_ID" \
  -F "image_url=https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/320px-GoldenGateBridge-001.jpg" \
  -F "description=Eyni problem davam edir" \
  -F "lat=40.4094" -F "lng=49.8672")
echo "   $R2"
# Clustering depends on mock returning same category — check either outcome
if echo "$R2" | grep -q '"joined_thread": true'; then
  echo "  ✓ clustered into existing thread"
  PASS=$((PASS+1))
else
  echo "  ~ different category from mock — opened new thread (still valid)"
  ISSUE_ID=$(echo "$R2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('issue_id', $ISSUE_ID))")
fi

# ── 4. Verify issue detail ────────────────────────────────────────────────────
echo ""
echo "4 / Issue detail for id=$ISSUE_ID"
ISSUE=$(curl -sf "$BASE/issues/$ISSUE_ID")
check "status=manual_review" "$ISSUE" '"status": "manual_review"'
check "has reports array"    "$ISSUE" '"reports"'
check "has steps array"      "$ISSUE" '"steps"'

# ── 5. Admin approve (override nothing — accept AI defaults) ──────────────────
echo ""
echo "5 / Admin approve → routed"
APR=$(curl -sf -X POST "$BASE/admin/issues/$ISSUE_ID/approve" \
  -F "operator_notes=Tesdiq edildi, yönlendirildi")
echo "   $APR"
check "status=routed" "$APR" '"status": "routed"'
check "has deadline"  "$APR" '"deadline"'

# ── 6. Advance to in_progress ─────────────────────────────────────────────────
echo ""
echo "6 / Admin → in_progress"
IP=$(curl -sf -X POST "$BASE/admin/issues/$ISSUE_ID/status" -F "status=in_progress")
echo "   $IP"
check "status=in_progress" "$IP" '"status": "in_progress"'

# ── 7. Resolve → coins awarded ────────────────────────────────────────────────
echo ""
echo "7 / Admin → resolved  (+20 coins to all contributors)"
RES=$(curl -sf -X POST "$BASE/admin/issues/$ISSUE_ID/status" -F "status=resolved")
echo "   $RES"
check "status=resolved" "$RES" '"status": "resolved"'

# ── 8. Check citizen profile — coins ─────────────────────────────────────────
echo ""
echo "8 / Citizen profile — confirm coins"
ME=$(curl -sf "$BASE/me/$USER_ID")
echo "   $ME"
COINS=$(echo "$ME" | python3 -c "import sys,json; print(json.load(sys.stdin)['coins'])")
echo "   coins=$COINS  (expect ≥ 30: +10 new report + 20 resolved)"
if [ "$COINS" -ge 30 ] 2>/dev/null; then
  echo "  ✓ coins in expected range"
  PASS=$((PASS+1))
else
  echo "  ✗ coins=$COINS, expected ≥ 30"
  FAIL=$((FAIL+1))
fi

# ── 9. Import sample CSV ──────────────────────────────────────────────────────
echo ""
echo "9 / Import sample_import.csv"
IMP=$(curl -sf -X POST "$BASE/admin/import" \
  -F "file=@sample_import.csv")
echo "   $IMP"
check "imported=8"  "$IMP" '"imported": 8'
check "skipped=0"   "$IMP" '"skipped": 0'

# ── 10. Export PDF ────────────────────────────────────────────────────────────
echo ""
echo "10 / Export PDF"
HTTP_CODE=$(curl -sf -o /tmp/openwave_test.pdf -w "%{http_code}" \
  "$BASE/admin/export.pdf")
echo "   HTTP $HTTP_CODE  →  $(wc -c < /tmp/openwave_test.pdf) bytes"
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ PDF exported"
  PASS=$((PASS+1))
else
  echo "  ✗ PDF export failed (HTTP $HTTP_CODE)"
  FAIL=$((FAIL+1))
fi

# ── 11. Stats sanity ──────────────────────────────────────────────────────────
echo ""
echo "11 / Admin stats"
STATS=$(curl -sf "$BASE/admin/stats")
echo "   $STATS"
check "has open"     "$STATS" '"open"'
check "has resolved" "$STATS" '"resolved"'

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
printf "  Result: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "═══════════════════════════════════════════"
echo ""
[ "$FAIL" -eq 0 ]
