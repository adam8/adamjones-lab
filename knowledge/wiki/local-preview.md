# Local Preview

Status: **confirmed**

## TL;DR

The knowledge wiki files live on the Raspberry Pi. To read them comfortably on an iPad, start the small read-only `pi-wiki-serve` helper and browse the rendered Markdown in Safari.

## Why a server instead of Obsidian

Obsidian on iPad cannot open a remote HTTP folder as a vault. It needs files stored locally on the iPad. Rather than syncing the wiki to the iPad, the files stay on the Pi and are previewed via a lightweight LAN server.

## Starting the server

From any shell on the Pi:

```bash
pi-wiki-serve 8088
```

Then open in iPad Safari:

```text
http://10.0.0.177:8088/knowledge/INDEX.md
```

(Replace `10.0.0.177` with the Pi's current LAN IP.)

## Stopping the server

```bash
pkill -f pi-wiki-serve
```

## Implementation

- **Script:** `/home/adam/.local/bin/pi-wiki-serve`
- **Python venv:** `/home/adam/.local/share/pi-wiki-venv`
- **Markdown rendering:** Python `markdown` package converts `.md` files to HTML on the fly.
- **Scope:** Serves only the `adamjones-lab` directory, read-only, LAN only.

## Notes

- Accessing the server by IP address in Safari does **not** trigger the iPadOS local-network permission prompt (that prompt only appears when an app scans/discovers devices).
- The server binds to `0.0.0.0` but is intended for LAN use only.

## Evidence

- `/home/adam/.local/bin/pi-wiki-serve`
- `~/.profile` or shell setup confirming `/home/adam/.local/bin` is in `PATH`.
