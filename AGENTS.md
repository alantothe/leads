# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the FastAPI application; `app/main.py` is the entrypoint.
- `features/` contains feature modules; `features/feed/` is split into `api/` (routes), `service/` (parsing logic), and `schema/` (Pydantic models).
- `utils/` and `lib/` hold shared helpers such as URL validation and date normalization.
- `docs/` contains API documentation like `docs/api.md`.
- Generated artifacts live in `__pycache__/`, `node_modules/`, and `.turbo/` and should not be edited.

## Build, Test, and Development Commands
- `python3 -m venv .venv && source .venv/bin/activate` sets up a local Python environment.
- `pip install -r requirements.txt` installs FastAPI and feedparser dependencies.
- `bun install` installs Turbo tasks for workspace scripts.
- `bun run dev` runs `turbo run dev`, which starts the API via `uvicorn`.
- `python3 -m uvicorn app.main:app --reload` is the direct local server command (default `http://127.0.0.1:8000`).
- `bun run build` and `bun run lint` orchestrate Turbo tasks when per-package scripts are added.

## Coding Style & Naming Conventions
- Use 4-space indentation for Python, and keep files UTF-8/ASCII where possible.
- Follow Python naming: `snake_case` for functions/vars, `PascalCase` for classes.
- Keep API schema definitions in Pydantic models under `features/**/schema/`.
- Validate external inputs in `utils/` before calling services.

## Testing Guidelines
- There are no test suites configured yet.
- If adding tests, introduce a `tests/` directory and use `pytest` conventions (`test_*.py`).
- Document how to run new tests (e.g., `pytest`) in this file when added.

## Commit & Pull Request Guidelines
- No commit message convention is documented in this repository; use clear, imperative summaries (e.g., “Add feed validation”) or your team standard.
- PRs should include: purpose, test plan (`bun run dev`/manual API calls), and any API doc updates (e.g., `docs/api.md`).
