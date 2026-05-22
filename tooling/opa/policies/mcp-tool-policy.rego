package kdd.mcp

default allow = false

allow {
  input.tool_id != ""
  input.caller_agent != ""
  input.workflow_id != ""
  input.risk_level == "low"
}

allow {
  input.tool_id != ""
  input.caller_agent != ""
  input.workflow_id != ""
  input.risk_level == "medium"
  input.allowed_agent == true
}

allow {
  input.risk_level == "high"
  input.allowed_agent == true
  input.approval_id != ""
  input.approval_status == "approved"
}

allow {
  input.risk_level == "critical"
  input.allowed_agent == true
  input.approval_id != ""
  input.approval_status == "approved"
}
