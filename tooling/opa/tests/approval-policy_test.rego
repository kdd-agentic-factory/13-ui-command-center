package kdd.approval_test

import data.kdd.approval

test_non_critical_action_allowed {
  approval.allow with input as {
    "action": "read_telemetry",
    "risk_level": "low"
  }
}

test_critical_action_blocked_without_approval {
  not approval.allow with input as {
    "action": "kubernetes.apply_manifest",
    "approval_id": "",
    "approval_status": ""
  }
}

test_critical_action_allowed_with_approval {
  approval.allow with input as {
    "action": "kubernetes.apply_manifest",
    "approval_id": "APPROVAL-001",
    "approval_status": "approved"
  }
}

test_critical_action_blocked_with_rejected_approval {
  not approval.allow with input as {
    "action": "race.apply_setup_change",
    "approval_id": "APPROVAL-002",
    "approval_status": "rejected"
  }
}
