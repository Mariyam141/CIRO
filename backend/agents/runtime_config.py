import json
import os
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = BACKEND_DIR / "config" / "agents.json"
DEFAULT_MODEL = "llama-3.3-70b-versatile"


def _safe_read_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _safe_read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8").strip()
    except Exception:
        return None


def _resolve_path(path_value: str) -> Path:
    path = Path(path_value).expanduser()
    if path.is_absolute():
        return path
    return BACKEND_DIR / path


def _load_runtime_config() -> dict[str, Any]:
    env_path = os.getenv("CIRO_AGENT_CONFIG_PATH", "").strip()
    config_path = _resolve_path(env_path) if env_path else DEFAULT_CONFIG_PATH
    if not config_path.exists():
        return {}
    return _safe_read_json(config_path)


_RUNTIME_CONFIG = _load_runtime_config()


def _agent_config(agent_key: str) -> dict[str, Any]:
    agents = _RUNTIME_CONFIG.get("agents", {})
    if not isinstance(agents, dict):
        return {}
    cfg = agents.get(agent_key, {})
    return cfg if isinstance(cfg, dict) else {}


def get_model_name(agent_key: str | None = None) -> str:
    if agent_key:
        specific_env = os.getenv(f"CIRO_{agent_key.upper()}_MODEL", "").strip()
        if specific_env:
            return specific_env

    global_env = os.getenv("GROQ_MODEL", "").strip()
    if global_env:
        return global_env

    if agent_key:
        model_from_agent_cfg = _agent_config(agent_key).get("model")
        if isinstance(model_from_agent_cfg, str) and model_from_agent_cfg.strip():
            return model_from_agent_cfg.strip()

    default_from_cfg = _RUNTIME_CONFIG.get("default_model")
    if isinstance(default_from_cfg, str) and default_from_cfg.strip():
        return default_from_cfg.strip()

    return DEFAULT_MODEL


def get_agent_system_prompt(agent_key: str, default_prompt: str) -> str:
    prompt_env = os.getenv(f"CIRO_{agent_key.upper()}_SYSTEM_PROMPT", "").strip()
    if prompt_env:
        return prompt_env

    path_env = os.getenv(f"CIRO_{agent_key.upper()}_SYSTEM_PROMPT_PATH", "").strip()
    if path_env:
        prompt_from_path = _safe_read_text(_resolve_path(path_env))
        if prompt_from_path:
            return prompt_from_path

    cfg = _agent_config(agent_key)
    prompt_from_cfg = cfg.get("system_prompt")
    if isinstance(prompt_from_cfg, str) and prompt_from_cfg.strip():
        return prompt_from_cfg.strip()

    prompt_file = cfg.get("system_prompt_file")
    if isinstance(prompt_file, str) and prompt_file.strip():
        prompt_from_file = _safe_read_text(_resolve_path(prompt_file.strip()))
        if prompt_from_file:
            return prompt_from_file

    return default_prompt
