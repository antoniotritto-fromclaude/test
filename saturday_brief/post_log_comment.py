"""
Posts run.log content as a commit comment on GitHub.
Used by the CI workflow to expose logs via API without artifact download.
"""
import json
import os
import urllib.request
import sys

token = os.environ.get("GH_TOKEN", "")
sha   = os.environ.get("GITHUB_SHA", "")
repo  = os.environ.get("GITHUB_REPOSITORY", "")

if not all([token, sha, repo]):
    print("Missing GH_TOKEN / GITHUB_SHA / GITHUB_REPOSITORY", file=sys.stderr)
    sys.exit(1)

log_path = os.path.join(os.path.dirname(__file__), "..", "run.log")
try:
    with open(log_path, encoding="utf-8", errors="replace") as f:
        log = f.read()
except FileNotFoundError:
    log = "run.log non trovato"

body = "```\n" + log[:65000] + "\n```"
data = json.dumps({"body": body}).encode()

req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/commits/{sha}/comments",
    data=data,
    method="POST",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    },
)
with urllib.request.urlopen(req) as r:
    print(f"Comment posted: HTTP {r.status}")
