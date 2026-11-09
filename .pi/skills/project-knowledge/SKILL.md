# Project Knowledge Skill

Use the repository's local LLM Wiki when answering questions about project history, architecture, design decisions, incidents, or verified facts about `adamjones-lab`.

## Where knowledge lives

```
knowledge/
├── INDEX.md              # Always read this first for history/architecture questions
├── raw/                  # Original evidence, excerpts, logs, quotes
├── wiki/                 # Curated encyclopedic pages
├── decisions/            # Architectural and design decisions (ADRs)
└── incidents/            # Problems, investigations, resolutions
```

## Rules

1. **Read the index first.** Before answering a project-history or architecture question, read `knowledge/INDEX.md` to see what pages exist and their status.
2. **Search, then answer.** Use `rg` or `find` inside `knowledge/` to locate relevant pages. Do not rely on embeddings or databases.
3. **Link claims.** When recording new facts, link to source files, git commits, logs, or captured evidence.
4. **Distinguish certainty.** Mark statements as `confirmed`, `likely`, or `hypothesis`. Do not present guesses as verified facts.
5. **Preserve evidence.** Put raw excerpts, quotes, and command output in `knowledge/raw/`. Summarize and link from wiki/decisions/incidents.
6. **No secrets.** Never record credentials, API tokens, private hostnames, DNS details, or unpublished preview URLs.
7. **No duplicates.** Check the index before creating a new page. Update existing pages instead when the topic already exists.
8. **Update after work.** When a meaningful task finishes (feature, bugfix, incident), update the affected wiki pages or add a decision/incident entry.
9. **Stay project-local.** This skill is for `adamjones-lab` only. The factory records in `~/.local/share/adamjones-site-factory` are a separate system; link to them but do not duplicate them.

## When to write

- New architectural or design decision → `knowledge/decisions/adr-NNN-slug.md`
- Bug, outage, flaky test, or investigation → `knowledge/incidents/incident-NNN-slug.md`
- Reusable lesson or curated explanation → `knowledge/wiki/slug.md`
- Original evidence or quote → `knowledge/raw/YYYY-MM-DD-slug.md`
- Then update `knowledge/INDEX.md`.

## Suggested workflow for a new entry

1. Read `knowledge/INDEX.md`.
2. Search existing pages for the topic.
3. If it exists, append or edit. If not, pick the next available numeric ID.
4. Write Markdown only; no database or embedding layers.
5. Link every significant claim to a file, commit, or log.
6. Update `knowledge/INDEX.md` with the new page, status, and tags.
