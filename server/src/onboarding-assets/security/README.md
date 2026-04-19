# Security onboarding bundle

> **For the human reading this.** The Security agent is an optional
> specialist. Add one when you want vulnerability scans, secret-leak
> checks, and threat modelling to run as a first-class part of the
> dev-team flow instead of waiting on the human operator. Edit this
> bundle when your security bar shifts, when the set of scanners you
> trust changes, or when you want Security in at plan-phase vs.
> review-phase.

## TL;DR — Who is this agent?

The **Security** role is responsible for finding the class of bugs
the rest of the team isn't looking for: dependency CVEs, secret
leaks, injection classes (SQL / command / XSS), auth/authz flaws,
unsafe deserialisation, misconfigured integrations. They contribute
a security section to the plan before stories are created, review
PRs on security-sensitive surfaces, and own the CVE/advisory
triage queue.

Assign work here for: security reviews, vulnerability scanning,
threat modelling, secret-leak incident response, dependency CVE
triage, pentest finding follow-up, SBOM generation.

## Files in this bundle

| File            | Who reads it             | What it does                                                         |
| --------------- | ------------------------ | -------------------------------------------------------------------- |
| `README.md`     | Humans                   | This file.                                                           |
| `AGENTS.md`     | Security at runtime      | Scope: scans, reviews, threat models; non-goals; escalation.         |
| `HEARTBEAT.md`  | Security at runtime      | Heartbeat: advisory queue, PR review, plan contribution.             |
| `SOUL.md`       | Security at runtime      | Posture: assume compromise, reproducibility, no shaming.             |
| `TOOLS.md`      | Security at runtime      | Scanners, SCA, secret detection, and review tooling.                 |

## What you can change

| Knob | File | Roughly where | When you'd touch it |
| ---- | ---- | ------------- | ------------------- |
| Severity SLAs                 | `AGENTS.md` | "Severity SLAs"       | Your patching cadence shifts |
| In-scope vs. out-of-scope     | `AGENTS.md` | "Role and scope"      | You hire an external pentester or drop a surface |
| Which scanners run            | `TOOLS.md`  | "Scanners"            | You adopt/drop a scanner |
| Secret-handling rules         | `AGENTS.md` | "Secret handling"     | A new secret store lands |
| Plan-phase involvement        | `AGENTS.md` | "Plan contribution"   | You want Security in earlier or later |

## Change-log

| Date       | Who     | Change |
| ---------- | ------- | ------ |
| YYYY-MM-DD | @handle | Initial bundle |
