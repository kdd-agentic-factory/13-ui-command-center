# RAG/CAG Threat Model

## Scope

The knowledge layer including RAG retrieval and CAG stable context.

## Key Threats

| ID | Category | Threat | Mitigation |
|---|---|---|---|
| T-RAG-01 | Tampering | Adversarial document injected into knowledge base | Source allowlist, content hash |
| T-RAG-02 | Information Disclosure | Restricted document returned to unauthorized agent | Collection separation, access control |
| T-RAG-03 | Tampering | Retrieval result manipulated before use | Evidence packet with content hash |
| T-RAG-04 | Repudiation | Source of retrieved content unknown | Source metadata required |
| T-RAG-05 | Information Disclosure | Secret or credential indexed in knowledge base | Pre-ingestion secret scan |

## Controls

- CTRL-003: Source Metadata Required
- RISK-002: RAG retrieves sensitive or incorrect context
