package kdd.approval

default allow = false

critical_actions := {
  "kubernetes.apply_manifest",
  "kubernetes.delete_resource",
  "skills.promote_autoskill",
  "race.apply_setup_change",
  "release.publish_production",
  "data.export_sensitive_dataset",
  "evidence.delete_record",
  "security.update_policy",
  "infra.modify_rbac",
  "mcp.register_new_tool"
}

allow {
  not critical_actions[input.action]
}

allow {
  critical_actions[input.action]
  input.approval_id != ""
  input.approval_status == "approved"
}
