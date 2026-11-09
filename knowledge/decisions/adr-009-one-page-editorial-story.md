# ADR-9: One-Page Native-Scroll Editorial Story

Status: **confirmed**

## Context

The portfolio needs to feel like a curated story rather than a grid of projects.

## Decision

Structure the site as a **single-page editorial story** with named chapters (Introduction, Work, Outside, About, Elsewhere), navigated by real anchors and read through native scrolling.

## Consequences

- Each chapter is a distinct section with a stable fragment (`#introduction`, `#work`, etc.).
- The chapter index and progress meters reinforce the story structure.
- Project passages are part of the Work chapter, not separate pages.

## Related

- [Chapter Progress](../wiki/chapter-progress.md)
- [Native Scroll Only](adr-002-native-scroll-only.md)

## Evidence

- [index.html — chapter structure](../../index.html)
- [README.md — Native-scroll editorial story](../../README.md)
