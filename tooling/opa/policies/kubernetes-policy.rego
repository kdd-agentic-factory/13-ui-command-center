package kdd.kubernetes

default allow = false

privileged_operations := {
  "kubernetes.apply_manifest",
  "kubernetes.delete_resource",
  "kubernetes.modify_rbac",
  "kubernetes.modify_network_policy"
}

allow {
  not privileged_operations[input.action]
  input.namespace != "production"
}

allow {
  privileged_operations[input.action]
  input.approval_id != ""
  input.approval_status == "approved"
  input.namespace != ""
}
