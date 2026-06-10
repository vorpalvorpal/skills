#!/usr/bin/env python3
"""Keep the r-science bundle complete.

Every directory containing a SKILL.md is a skill. The r-science plugin is a
superset that should list all of them, so a single install pulls in the whole
repo. The monthly upstream sync runs this after merging: any newly added skill
folders get appended to the r-science plugin's skills list.

Exits 0 always. Prints what it added (nothing, if already complete).
"""

import json
import os

MARKETPLACE = ".claude-plugin/marketplace.json"


def discover_skills(root="."):
    found = set()
    for dirpath, _dirs, files in os.walk(root):
        parts = dirpath.split(os.sep)
        if ".git" in parts or ".github" in parts:
            continue
        if "SKILL.md" in files:
            rel = os.path.relpath(dirpath, root).replace(os.sep, "/")
            found.add("./" + rel)
    return found


def main():
    with open(MARKETPLACE, encoding="utf-8") as f:
        data = json.load(f)

    found = discover_skills()
    added = []
    for plugin in data["plugins"]:
        if plugin["name"] == "r-science":
            existing = set(plugin["skills"])
            added = sorted(s for s in found if s not in existing)
            plugin["skills"].extend(added)
            break

    if added:
        with open(MARKETPLACE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print("Added to r-science bundle:", ", ".join(added) if added else "nothing")


if __name__ == "__main__":
    main()
