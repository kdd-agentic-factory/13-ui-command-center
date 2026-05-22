# RAG/CAG Security Policy

## Purpose

This policy governs the security of the knowledge layer used by all agentic workflows.

## Required Controls

- Every chunk must have source metadata (source_id, file_path, content_hash).
- Every retrieved result must include evidence.
- Sensitive documents must be classified before ingestion.
- Collections must be separated by domain.
- Stable CAG context must be versioned and signed.
- Retrieval results must not be treated as truth without evidence.

## Data Leakage Controls

The knowledge layer must not:

- index secrets or private keys
- expose restricted documents to unauthorized agents
- mix sensitive and public knowledge collections
- generate unsupported claims presented as facts

## Hallucination Mitigation

For evidence-required tasks:

- use retrieved sources only
- return evidence packets with every response
- compute groundedness score where possible
- explicitly mark claims that lack retrieved support
