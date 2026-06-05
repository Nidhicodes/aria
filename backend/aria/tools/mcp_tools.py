"""MCP toolsets for live mode — Dynatrace + Arize Phoenix via Google ADK.

This module wires the two partner MCP servers into ADK ``McpToolset`` objects so
Gemini can call them as native tools. It is imported lazily (only in live mode
with ADK installed) so the demo never depends on google-adk being present.

References:
  • Dynatrace MCP:  npx -y @dynatrace-oss/dynatrace-mcp-server
    tools: list_problems, list_exceptions, get_kubernetes_events, execute_dql,
           find_entity_by_name, send_slack_message, send_event, ...
  • Arize Phoenix MCP: npx -y @arizeai/phoenix-mcp
    tools: list-projects, list-traces, get-trace, get-spans,
           get-span-annotations, list-experiments-for-dataset, ...
"""

from __future__ import annotations

from ..config import Settings


def build_dynatrace_toolset(settings: Settings):
    """Return an ADK McpToolset bound to the Dynatrace MCP server."""
    from google.adk.tools.mcp_tool.mcp_session_manager import (
        StdioConnectionParams,
        StdioServerParameters,
    )
    from google.adk.tools.mcp_tool.mcp_toolset import McpToolset

    env = {"DT_ENVIRONMENT": settings.dt_environment}
    if settings.dt_platform_token:
        env["DT_PLATFORM_TOKEN"] = settings.dt_platform_token
    if settings.slack_connection_id:
        env["SLACK_CONNECTION_ID"] = settings.slack_connection_id

    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="npx",
                args=["-y", "@dynatrace-oss/dynatrace-mcp-server@latest"],
                env=env,
            ),
            timeout=60,
        ),
    )


def build_phoenix_toolset(settings: Settings):
    """Return an ADK McpToolset bound to the Arize Phoenix MCP server."""
    from google.adk.tools.mcp_tool.mcp_session_manager import (
        StdioConnectionParams,
        StdioServerParameters,
    )
    from google.adk.tools.mcp_tool.mcp_toolset import McpToolset

    args = [
        "-y",
        "@arizeai/phoenix-mcp@latest",
        "--baseUrl",
        settings.phoenix_host,
        "--apiKey",
        settings.phoenix_api_key,
    ]

    return McpToolset(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="npx",
                args=args,
                env={
                    "PHOENIX_HOST": settings.phoenix_host,
                    "PHOENIX_API_KEY": settings.phoenix_api_key,
                    "PHOENIX_PROJECT": settings.phoenix_project,
                },
            ),
            timeout=60,
        ),
    )


def build_all_toolsets(settings: Settings) -> list:
    """Build whichever partner toolsets have credentials configured."""
    toolsets = []
    if settings.has_dynatrace:
        toolsets.append(build_dynatrace_toolset(settings))
    if settings.has_phoenix:
        toolsets.append(build_phoenix_toolset(settings))
    return toolsets
