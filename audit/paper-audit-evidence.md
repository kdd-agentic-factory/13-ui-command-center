# Paper Audit Evidence

## Purpose

This document describes the audit evidence produced by the ecosystem that supports the paper's claims about security, auditability and human oversight.

## Evidence Chain

For every paper experiment:

1. Data ingestion audit event: document_ingested
2. RAG retrieval audit event: retrieval_performed
3. Analysis workflow audit event: workflow_started / completed
4. Recommendation audit event: setup_recommendation_generated
5. Approval audit event: approval_requested / granted
6. Simulation audit event: simulation_started / completed
7. Evidence export: data_export_allowed with evidence artifact IDs

## Metrics for Paper

- approval_compliance_rate: fraction of critical actions with valid approval
- critical_action_block_rate: fraction of unauthorized critical actions blocked
- audit_record_completeness: fraction of events with all required fields
- evidence_chain_completeness: fraction of recommendations with full evidence chain
