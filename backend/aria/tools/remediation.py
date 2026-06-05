"""Remediation action execution.

In demo mode these simulate the effect (and return the metric improvement the
dashboard animates). In live mode, AUTO actions can be wired to real Dynatrace
workflow tools (e.g. ``send_event``, ``send_slack_message``, scaling webhooks).

Every executor here is non-destructive by design. Anything that would change
model behavior or have customer blast radius is marked NEEDS_APPROVAL upstream
and only runs after an explicit human click.
"""

from __future__ import annotations

import asyncio

from ..incident import ActionStatus, RemediationAction


async def execute_action(action: RemediationAction, *, live: bool = False) -> RemediationAction:
    """Execute a single approved/auto action and record the result.

    Returns the same action object, mutated with status + result.
    """
    action.status = ActionStatus.EXECUTING

    # Simulate work; in live mode this is where MCP tool calls would go.
    await asyncio.sleep(0.6)

    title = action.title.lower()
    if "scale" in title:
        action.result = "Scaled horizontally +2 replicas; memory headroom restored."
    elif "prompt" in title or "template" in title:
        action.result = "Prompt template patched to degrade gracefully on truncation."
    elif "rollback" in title or "roll back" in title:
        action.result = "Rolled back to last healthy revision; pods stabilized."
    elif "report" in title:
        action.result = "Incident report drafted and ready to send."
    elif "slack" in title or "notify" in title or "page" in title:
        action.result = "Notification sent to #ops-oncall."
    elif "throttle" in title or "evict" in title or "batch" in title:
        action.result = "Co-located batch job evicted; CPU throttling cleared."
    else:
        action.result = "Action completed."

    if live:
        action.result += " (live MCP execution)"

    action.status = ActionStatus.DONE
    return action
