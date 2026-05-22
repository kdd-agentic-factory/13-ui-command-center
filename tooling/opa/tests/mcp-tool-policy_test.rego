package kdd.mcp_test

import data.kdd.mcp

test_low_risk_tool_allowed {
  mcp.allow with input as {
    "tool_id": "read_telemetry",
    "caller_agent": "race-ai-copilot",
    "workflow_id": "WF-001",
    "risk_level": "low"
  }
}

test_high_risk_tool_blocked_without_approval {
  not mcp.allow with input as {
    "tool_id": "deploy_manifest",
    "caller_agent": "orchestrator",
    "workflow_id": "WF-002",
    "risk_level": "high",
    "allowed_agent": true,
    "approval_id": "",
    "approval_status": ""
  }
}

test_high_risk_tool_allowed_with_approval {
  mcp.allow with input as {
    "tool_id": "deploy_manifest",
    "caller_agent": "orchestrator",
    "workflow_id": "WF-002",
    "risk_level": "high",
    "allowed_agent": true,
    "approval_id": "APPROVAL-001",
    "approval_status": "approved"
  }
}
