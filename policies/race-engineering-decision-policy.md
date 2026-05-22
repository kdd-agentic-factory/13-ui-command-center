# Race Engineering Decision Policy

## Purpose

This policy defines the boundary between AI-assisted analysis and human operational decisions in race engineering.

## AI May

- analyze telemetry data
- detect anomalies and degradation patterns
- compare sessions and lap segments
- propose what-if simulations
- summarize evidence for crew chief reports
- generate risk classifications
- flag conditions requiring attention

## AI Must Not

- approve setup changes
- apply race settings directly
- override crew chief decisions
- present simulation results as real-world validation
- hide uncertainty or contradictory evidence
- suppress dissenting data points

## Required Approval

Any recommendation affecting the following must be approved by a qualified human:

- engine mapping
- traction control settings
- suspension configuration
- tire pressure
- braking setup
- aerodynamic package
- race strategy

## Approver Roles

| Area | Approver Role |
|---|---|
| Setup changes | crew_chief |
| Race strategy | race_engineer |
| Platform decisions | platform_owner |
| Experiment approval | researcher |
