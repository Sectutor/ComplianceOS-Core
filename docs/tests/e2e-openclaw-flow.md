# E2E Test Skeleton — WebChat → Tool → Advisor → Slot

## Scenario 1: Implementation Plan
- Command: “Create implementation plan for CIS control 5”
- Expect: JSON object result with citations stored
- Verify: Advisor API response shape, audit record, slot render

## Scenario 2: Policy Draft
- Command: “Draft Access Control section”
- Expect: JSON object with content added via Premium slot
- Verify: Slot insertion, audit record

## Scenario 3: Pentest Parser
- Command: “Parse Q1 pentest report”
- Expect: findings[], tasks[], citations[] JSON object
- Verify: Task creation, evidence storage, reindex content

## Scenario 4: RAG Reindex
- Command: “Reindex our policy KB”
- Expect: success stats
- Verify: Embedding counts and citations on follow‑up answers

