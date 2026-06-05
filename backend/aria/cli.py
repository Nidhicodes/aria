"""ARIA command-line interface.

  aria serve                  → run the FastAPI server
  aria demo [scenario]        → run an incident end-to-end in the terminal
  aria scenarios              → list available scenarios

The ``demo`` command auto-approves the human-gated action after a beat so you
can watch the full arc without the dashboard — handy for sanity checks and CI.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from .config import get_settings
from .engine import IncidentEngine
from .incident import ActionMode, ActionStatus
from .tools import scenarios


async def _run_demo(scenario_key: str | None) -> None:
    settings = get_settings()
    engine = IncidentEngine(settings)
    incident = engine.inject(scenario_key)

    print(f"\n  ARIA  ·  mode={settings.aria_mode}  ·  brain={settings.reasoning_backend()}")
    print(f"  Incident: {incident.title}\n" + "  " + "─" * 56)

    async def auto_approver():
        # Approve any pending human-gated action shortly after it appears.
        while True:
            await asyncio.sleep(0.5)
            inc = engine.get(incident.id)
            if not inc:
                continue
            for a in inc.actions:
                if a.mode == ActionMode.NEEDS_APPROVAL and a.status == ActionStatus.PROPOSED:
                    await asyncio.sleep(1.0)
                    print(f"  👤 Operator approves: {a.title}")
                    engine.approve(incident.id, a.id)

    approver = asyncio.create_task(auto_approver())
    try:
        async for event in engine.run(incident.id):
            _print_event(event)
    finally:
        approver.cancel()

    print("  " + "─" * 56)
    print("  Incident resolved.\n")


def _print_event(event) -> None:
    p = event.payload
    if event.type == "phase":
        print(f"\n  ┃ PHASE → {p['phase'].upper()}")
    elif event.type == "signal":
        src = p["source"].upper()
        print(f"    [{src}] {p['name']}: {p['value']}{p['unit']}  ({p['severity']})")
    elif event.type == "reasoning":
        print(f"  {p['icon']} {p['text']}")
    elif event.type == "root_cause":
        print(f"     → ROOT CAUSE ({round(p['confidence']*100)}%): {p['summary']}")
    elif event.type == "action":
        tag = "AUTO" if p["mode"] == "auto" else "NEEDS APPROVAL"
        print(f"    • [{tag}] {p['title']}")
    elif event.type == "report":
        print("\n  📝 Report drafted (truncated):")
        for line in p["markdown"].splitlines()[:6]:
            print(f"     {line}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="aria", description="ARIA incident agent")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("serve", help="run the FastAPI server")
    demo = sub.add_parser("demo", help="run an incident end-to-end in the terminal")
    demo.add_argument("scenario", nargs="?", default=None)
    sub.add_parser("scenarios", help="list available scenarios")

    args = parser.parse_args(argv)

    if args.cmd == "serve":
        from .server import main as serve_main
        serve_main()
        return 0
    if args.cmd == "scenarios":
        for s in scenarios.list_scenarios():
            print(f"  {s['key']:<22} {s['title']}")
        return 0
    if args.cmd == "demo":
        asyncio.run(_run_demo(args.scenario))
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
