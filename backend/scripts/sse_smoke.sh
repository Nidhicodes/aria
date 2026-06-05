#!/bin/bash
# End-to-end SSE smoke test against a running ARIA backend.
set -e
BASE=${1:-http://127.0.0.1:8000}
ID=$(curl -s -X POST $BASE/api/incidents/inject -H 'Content-Type: application/json' -d '{"scenario":"memory_hallucination"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["incident_id"])')
echo "incident: $ID"

# Background approver: approve any pending needs_approval action.
(
  for i in $(seq 1 40); do
    sleep 0.5
    curl -s $BASE/api/incidents/$ID | python3 -c '
import sys,json,urllib.request
inc=json.load(sys.stdin)
for a in inc.get("actions",[]):
    if a["mode"]=="needs_approval" and a["status"]=="proposed":
        url="'$BASE'/api/incidents/'$ID'/actions/%s/approve"%a["id"]
        urllib.request.urlopen(urllib.request.Request(url,method="POST"))
        print("APPROVED",a["title"],file=sys.stderr)
'
  done
) &
APPROVER=$!

echo "--- event counts over the stream ---"
curl -s --max-time 30 -N $BASE/api/incidents/$ID/stream | grep -E '^event:' | sort | uniq -c
kill $APPROVER 2>/dev/null || true

echo "--- final snapshot ---"
curl -s $BASE/api/incidents/$ID | python3 -c 'import sys,json;i=json.load(sys.stdin);print("phase:",i["phase"]);print("confidence:",i["root_cause"]["confidence"]);print("crosses_boundary:",i["root_cause"]["crosses_boundary"]);print("actions:",[(a["title"],a["status"]) for a in i["actions"]])'
