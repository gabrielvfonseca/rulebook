# Python ML Pipeline

A Python 3.11+ ML project: modular pipeline (collect → features → models → decisions), scikit-learn/PyTorch, SQLite storage, and a typed CLI entry point.

## Commands

- `pip install -r requirements.txt` — install dependencies
- `pip install torch` — optional: install PyTorch for deep-learning models
- `python -m pytest` — run the test suite
- `python -m pytest --cov=<package>` — run tests with coverage
- `python -m ruff check .` — lint
- `python -m ruff format .` — format
- `python -m mypy <package>` — type-check
- `python -m <package>.cli --status` — print pipeline status snapshot
- `python -m <package>.cli --train` — force model retraining

## Architecture

- `<package>/cli.py` — single entry point for the CLI and any daemon mode
- `<package>/core/collector.py` — data sampling and persistence (e.g. psutil → SQLite)
- `<package>/core/features.py` — feature engineering: raw samples → model inputs
- `<package>/core/models/` — one module per model family (sklearn, torch); keep training and inference in the same module
- `<package>/core/decisions.py` — map model predictions to semantic outcomes
- `<package>/core/actions.py` — side-effecting operations; every destructive action lives here and nowhere else
- `config.yaml` — all tunable parameters; hot-reload when practical
- `logs/` — rotating application logs

## Rules

- Use Python 3.11+ features (match statements, `Self`, modern typing); annotate all function parameters and return types.
- Store time-series metrics in SQLite; never invent a database dependency for small local data.
- Keep the pipeline stages (collect → features → models → decisions → actions) strictly separated; never call across stages except through their public functions.
- Gate destructive actions behind an explicit autonomy model (`auto` / `ask` / `never`) read from `config.yaml`; "ask" must block on user confirmation.
- Never hardcode thresholds, paths, or cooldowns — put them in `config.yaml`.
- Validate config keys against a schema at load time; fail loudly on unknown keys.
- Run `python -m pytest`, `ruff check`, and `mypy` before opening a PR.
- Write tests next to source under `tests/`, named `test_<module>.py`.
- Use structured logging (module-level `logging`), not `print`, in library code.
- Prefer scikit-learn for tabular/regression baselines; reach for PyTorch only when a measured need exists.
- Never commit data files, model artifacts, or logs; add them to `.gitignore`.
- Pin exact dependency versions in `requirements.txt` (use `pip-compile` or a lockfile).
