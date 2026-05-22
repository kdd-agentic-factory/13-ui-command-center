# Approval Workflows

## Standard Approval Flow

1. Agent/Service requests action
2. MCP Gateway checks critical-actions.yaml
3. Action in critical list? No → execute with audit. Yes → approval flow.
4. Generate approval_request with evidence
5. Notify human approver
6. Approver decides → Rejected: block and record. Approved: issue approval_id.
7. Action executes with approval_id
8. Audit event emitted

## No Self-Approval

AI agents cannot approve their own requests. Approvals require a human actor with the correct role.
