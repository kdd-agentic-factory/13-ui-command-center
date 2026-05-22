package kdd.data

default allow = false

restricted_classifications := {"restricted", "sensitive"}

allow {
  not restricted_classifications[input.classification]
}

allow {
  restricted_classifications[input.classification]
  input.approval_id != ""
  input.approval_status == "approved"
  input.minimization_reviewed == true
  input.export_purpose != ""
}
