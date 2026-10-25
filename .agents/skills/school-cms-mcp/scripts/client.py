#!/usr/bin/env python3
"""
School CMS MCP Client Helper Script
Connects to School CMS MCP Server (Production or Local) using Agent Key.
"""

import argparse
import json
import queue
import sys
import threading
import time
import urllib.request

DEFAULT_PROD_URL = "https://www.ppks.ac.th"
DEFAULT_LOCAL_URL = "http://localhost:8080"
DEFAULT_AGENT_KEY = "ppk_agent_495e1798e8f89459ec2fe9298a8adbf26c7920e4"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"


class SchoolCMSMCPClient:
    def __init__(self, base_url=DEFAULT_PROD_URL, agent_key=DEFAULT_AGENT_KEY):
        self.base_url = base_url.rstrip("/")
        self.agent_key = agent_key
        self.endpoint = None
        self.responses = queue.Queue()
        self.running = True
        self.msg_id = 1
        self.sse_resp = None

    def connect(self):
        req = urllib.request.Request(
            f"{self.base_url}/mcp/sse",
            headers={
                "X-Agent-Key": self.agent_key,
                "User-Agent": USER_AGENT,
            }
        )
        self.sse_resp = urllib.request.urlopen(req)

        for _ in range(25):
            line = self.sse_resp.readline().decode("utf-8").strip()
            if line.startswith("data:"):
                self.endpoint = line[5:].strip()
                break

        if not self.endpoint:
            raise RuntimeError("Failed to obtain MCP message endpoint from SSE")

        self.listener_thread = threading.Thread(target=self._listen, daemon=True)
        self.listener_thread.start()

        # MCP Handshake
        self.send({
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "school-cms-skill-client",
                    "version": "1.0.0"
                }
            }
        })

        self.post_raw({
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {}
        })
        time.sleep(0.3)

    def _next_id(self):
        nid = self.msg_id
        self.msg_id += 1
        return nid

    def _listen(self):
        while self.running:
            try:
                line = self.sse_resp.readline().decode("utf-8")
                if not line:
                    break
                line = line.strip()
                if line.startswith("data:"):
                    data_str = line[5:].strip()
                    try:
                        parsed = json.loads(data_str)
                        self.responses.put(parsed)
                    except json.JSONDecodeError:
                        pass
            except Exception:
                break

    def post_raw(self, payload):
        data = json.dumps(payload).encode("utf-8")
        target_url = f"{self.base_url}{self.endpoint}" if self.endpoint.startswith("/") else f"{self.base_url}/{self.endpoint}"
        req = urllib.request.Request(
            target_url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "X-Agent-Key": self.agent_key,
                "User-Agent": USER_AGENT,
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode("utf-8")

    def send(self, payload, timeout=35):
        self.post_raw(payload)
        expected_id = payload.get("id")
        start = time.time()
        while time.time() - start < timeout:
            try:
                msg = self.responses.get(timeout=0.5)
                if msg.get("id") == expected_id:
                    return msg
            except queue.Empty:
                continue
        raise TimeoutError(f"Timed out waiting for response to message id {expected_id}")

    def call_tool(self, name, arguments=None):
        req = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "tools/call",
            "params": {
                "name": name,
                "arguments": arguments or {}
            }
        }
        return self.send(req)


def main():
    parser = argparse.ArgumentParser(description="Call School CMS MCP Tools")
    parser.add_argument("tool", help="Name of the MCP tool to call (e.g. get_site_settings, update_site_settings, list_recent_posts)")
    parser.add_argument("args", nargs="?", default="{}", help="JSON string of arguments for the tool")
    parser.add_argument("--local", action="store_true", help="Target localhost:8080 instead of production")
    parser.add_argument("--url", default="", help="Custom base URL")
    parser.add_argument("--key", default=DEFAULT_AGENT_KEY, help="Custom agent key")
    parsed_args = parser.parse_args()

    base_url = DEFAULT_PROD_URL
    if parsed_args.local:
        base_url = DEFAULT_LOCAL_URL
    if parsed_args.url:
        base_url = parsed_args.url

    try:
        arguments = json.loads(parsed_args.args)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON arguments: {e}", file=sys.stderr)
        sys.exit(1)

    client = SchoolCMSMCPClient(base_url=base_url, agent_key=parsed_args.key)
    try:
        client.connect()
        res = client.call_tool(parsed_args.tool, arguments)
        print(json.dumps(res, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"MCP execution failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
