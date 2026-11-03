
import ast
import json
from pathlib import Path
from datetime import datetime
from collections import Counter


ROOT = Path(__file__).resolve().parent
OUTPUT_FILE = ROOT / "matricare_project_report.md"

EXCLUDED_DIRS = {
    ".git",
    ".idea",
    ".vscode",
    "__pycache__",
    "venv",
    ".venv",
    "env",
    "node_modules",
    "dist",
    "build",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".next",
    "coverage",
}

EXCLUDED_FILES = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
}

SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".json", ".yaml", ".yml", ".toml",
    ".sql", ".md", ".txt",
}

MAX_TREE_FILES = 2500


def heading(title, level=2):
    return f"\n{'#' * level} {title}\n"


def relative(path):
    try:
        return str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path)


def safe_read(path):
    if path.name.lower() in EXCLUDED_FILES:
        return ""

    try:
        return path.read_text(
            encoding="utf-8",
            errors="replace",
        )
    except Exception:
        return ""


def discover_files():
    files = []

    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue

        if any(part in EXCLUDED_DIRS for part in path.parts):
            continue

        if path.name.lower() in EXCLUDED_FILES:
            continue

        if path.suffix.lower() in SOURCE_EXTENSIONS:
            files.append(path)

    return sorted(files)


def project_tree(files):
    lines = []

    for path in files[:MAX_TREE_FILES]:
        lines.append(f"- `{relative(path)}`")

    if len(files) > MAX_TREE_FILES:
        lines.append(
            f"- ... {len(files) - MAX_TREE_FILES} additional files omitted"
        )

    return "\n".join(lines)


def parse_python(path):
    source = safe_read(path)

    try:
        return ast.parse(source), source
    except SyntaxError as exc:
        return None, f"SYNTAX ERROR: {exc}"


def get_name(node):
    if isinstance(node, ast.Name):
        return node.id

    if isinstance(node, ast.Attribute):
        return get_name(node.value) + "." + node.attr

    if isinstance(node, ast.Call):
        return get_name(node.func)

    return ""


def get_value(node):
    try:
        return ast.literal_eval(node)
    except Exception:
        return None


def decorators_for(node):
    result = []

    for decorator in getattr(node, "decorator_list", []):
        if isinstance(decorator, ast.Call):
            name = get_name(decorator.func)
            args = [
                get_value(arg)
                for arg in decorator.args
            ]

            result.append((name, args))

        else:
            result.append((get_name(decorator), []))

    return result


def inspect_python_files(files):
    modules = []
    models = []
    schemas = []
    endpoints = []
    functions = []
    imports = []
    syntax_errors = []

    for path in files:
        if path.suffix != ".py":
            continue

        tree, source = parse_python(path)
        file_name = relative(path)

        if tree is None:
            syntax_errors.append(
                f"- `{file_name}`: {source}"
            )
            continue

        module_imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_imports.append(alias.name)

            elif isinstance(node, ast.ImportFrom):
                module_imports.append(
                    "." * node.level + (node.module or "")
                )

        imports.append(
            f"### `{file_name}`\n"
            + (
                ", ".join(sorted(set(module_imports)))
                if module_imports
                else "No imports detected."
            )
        )

        module_symbols = []

        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                module_symbols.append(node.name)

                bases = [
                    get_name(base)
                    for base in node.bases
                ]

                attributes = {}

                for item in node.body:
                    if isinstance(item, (ast.Assign, ast.AnnAssign)):
                        targets = (
                            item.targets
                            if isinstance(item, ast.Assign)
                            else [item.target]
                        )

                        value_node = (
                            item.value
                            if isinstance(item, (ast.Assign, ast.AnnAssign))
                            else None
                        )

                        for target in targets:
                            if isinstance(target, ast.Name):
                                attributes[target.id] = get_value(value_node)

                table_name = attributes.get("__tablename__")

                model_info = (
                    f"- `{file_name}`: `{node.name}` "
                    f"(bases: {', '.join(bases) or 'none'})"
                )

                if table_name:
                    model_info += f", table: `{table_name}`"

                if "Base" in bases or table_name:
                    models.append(model_info)

                if any(
                    "BaseModel" in base
                    or "BaseSettings" in base
                    for base in bases
                ):
                    schemas.append(
                        f"- `{file_name}`: `{node.name}` "
                        f"(bases: {', '.join(bases)})"
                    )

            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                module_symbols.append(node.name)

                functions.append(
                    f"- `{file_name}`: `{node.name}()`"
                )

                for decorator, args in decorators_for(node):
                    if decorator.rsplit(".", 1)[-1] in {
                        "get", "post", "put",
                        "patch", "delete", "options",
                        "head", "api_route",
                    }:
                        route = args[0] if args else "unknown"

                        endpoints.append(
                            f"| `{decorator}` | `{route}` | "
                            f"`{file_name}` | `{node.name}` |"
                        )

        modules.append(
            f"- `{file_name}`: "
            + (", ".join(module_symbols) if module_symbols else "No top-level classes/functions")
        )

    return {
        "modules": modules,
        "models": models,
        "schemas": schemas,
        "endpoints": endpoints,
        "functions": functions,
        "imports": imports,
        "syntax_errors": syntax_errors,
    }


def find_router_registrations(files):
    results = []

    for path in files:
        if path.suffix != ".py":
            continue

        tree, _ = parse_python(path)

        if tree is None:
            continue

        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue

            if get_name(node.func).endswith("include_router"):
                results.append(
                    f"- `{relative(path)}`: "
                    f"`{get_name(node.func)}(...)`"
                )

    return results


def find_markers(files):
    markers = Counter()
    matches = []

    marker_words = (
        "TODO",
        "FIXME",
        "XXX",
        "NotImplementedError",
        "pass",
    )

    for path in files:
        if path.suffix not in {".py", ".js", ".jsx", ".ts", ".tsx"}:
            continue

        source = safe_read(path)

        for line_number, line in enumerate(
            source.splitlines(),
            start=1,
        ):
            stripped = line.strip()

            if not stripped:
                continue

            for marker in marker_words:
                if marker in stripped:
                    markers[marker] += 1

                    if len(matches) < 250:
                        matches.append(
                            f"- `{relative(path)}:{line_number}` "
                            f"({marker}): `{stripped[:180]}`"
                        )

    return markers, matches


def inspect_dependencies(files):
    dependency_files = [
        path for path in files
        if path.name.lower() in {
            "requirements.txt",
            "pyproject.toml",
            "pipfile",
            "package.json",
            "package-lock.json",
        }
    ]

    sections = []

    for path in dependency_files:
        if path.name.lower() == "package-lock.json":
            sections.append(
                f"- `{relative(path)}`: present "
                "(lockfile contents omitted)"
            )
            continue

        content = safe_read(path)

        sections.append(
            f"### `{relative(path)}`\n```text\n"
            f"{content[:12000]}\n```"
        )

    return sections


def inspect_migrations(files):
    migrations = []

    for path in files:
        normalized = relative(path).lower()

        if (
            "alembic/versions/" in normalized
            or "migrations/versions/" in normalized
        ):
            migrations.append(
                f"- `{relative(path)}`"
            )

    return migrations


def inspect_frontend(files):
    frontend_files = [
        path for path in files
        if path.suffix.lower() in {
            ".js", ".jsx", ".ts", ".tsx"
        }
    ]

    package_files = [
        path for path in files
        if path.name.lower() == "package.json"
    ]

    result = []

    result.append(
        f"- Frontend source files detected: **{len(frontend_files)}**"
    )

    for path in package_files:
        try:
            data = json.loads(safe_read(path))

            result.append(
                f"\n### `{relative(path)}`"
            )

            result.append(
                f"- Package name: `{data.get('name', 'unknown')}`"
            )

            result.append(
                f"- Scripts: `{json.dumps(data.get('scripts', {}))}`"
            )

            result.append(
                f"- Dependencies: "
                f"`{', '.join(data.get('dependencies', {}).keys())}`"
            )

        except Exception:
            result.append(
                f"- Could not parse `{relative(path)}`"
            )

    return result


def inspect_project():
    files = discover_files()

    python_files = [
        path for path in files
        if path.suffix.lower() == ".py"
    ]

    report = inspect_python_files(python_files)

    markers, marker_matches = find_markers(files)

    routers = find_router_registrations(python_files)

    migrations = inspect_migrations(files)

    dependencies = inspect_dependencies(files)

    frontend = inspect_frontend(files)

    lines = []

    lines.append("# MatriCare AI - Project Inspection Report")

    lines.append(
        f"\nGenerated: `{datetime.now().isoformat(timespec='seconds')}`"
    )

    lines.append(
        f"\nProject root: `{ROOT}`"
    )

    lines.append(
        "\n> Automatically generated structural report. "
        "No application code was executed and no database "
        "connection was opened."
    )

    lines.append(heading("1. Project Statistics"))

    lines.append(f"- Total detected files: **{len(files)}**")
    lines.append(f"- Python files: **{len(python_files)}**")
    lines.append(
        f"- JavaScript/TypeScript files: "
        f"**{sum(1 for p in files if p.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx'})}**"
    )
    lines.append(f"- Model candidates: **{len(report['models'])}**")
    lines.append(f"- Pydantic schema candidates: **{len(report['schemas'])}**")
    lines.append(f"- Detected API route decorators: **{len(report['endpoints'])}**")
    lines.append(f"- Router registrations: **{len(routers)}**")
    lines.append(f"- Migration files: **{len(migrations)}**")

    lines.append(heading("2. Complete Project File Structure"))
    lines.append(project_tree(files))

    lines.append(heading("3. SQLAlchemy Model Candidates"))
    lines.extend(report["models"] or ["No model candidates detected."])

    lines.append(heading("4. Pydantic Schema Candidates"))
    lines.extend(report["schemas"] or ["No schema candidates detected."])

    lines.append(heading("5. FastAPI Endpoint Candidates"))
    lines.append(
        "| Decorator | Route | File | Function |\n"
        "|---|---|---|---|"
    )
    lines.extend(
        report["endpoints"]
        or ["| None detected | - | - | - |"]
    )

    lines.append(heading("6. Router Registrations"))
    lines.extend(
        routers or ["No include_router registrations detected."]
    )

    lines.append(heading("7. Python Module Symbols"))
    lines.extend(report["modules"])

    lines.append(heading("8. Database Migrations"))
    lines.extend(
        migrations or ["No migration files detected."]
    )

    lines.append(heading("9. Frontend Inspection"))
    lines.extend(frontend)

    lines.append(heading("10. Dependency Files"))
    lines.extend(
        dependencies or ["No recognized dependency files detected."]
    )

    lines.append(heading("11. Potential TODO / FIXME Markers"))

    for marker, count in markers.items():
        lines.append(f"- {marker}: **{count}**")

    lines.extend(
        marker_matches or ["No markers detected."]
    )

    lines.append(heading("12. Python Syntax Errors"))

    lines.extend(
        report["syntax_errors"]
        or ["No Python syntax errors detected by AST parsing."]
    )

    lines.append(heading("13. Python Imports"))
    lines.extend(report["imports"])

    lines.append(heading("14. Top-level Python Functions"))
    lines.extend(report["functions"])

    lines.append(heading("15. Inspection Limitations"))
    lines.append(
        "- This script inspects source structure, not runtime behavior."
    )
    lines.append(
        "- Route decorators are detected statically; dynamically "
        "generated routes may not appear."
    )
    lines.append(
        "- Model and schema candidates are based on class inheritance "
        "and naming-independent AST inspection."
    )
    lines.append(
        "- Migration filenames are listed, but the live database "
        "migration state is not queried."
    )
    lines.append(
        "- TODO markers are indicators, not proof that a feature is incomplete."
    )
    lines.append(
        "- Environment files, virtual environments, Git metadata, "
        "and dependency build folders are excluded."
    )

    OUTPUT_FILE.write_text(
        "\n".join(lines),
        encoding="utf-8",
    )

    print("\n" + "=" * 65)
    print("       MATRICARE AI - PROJECT INSPECTOR")
    print("=" * 65)

    print(f"\nProject: {ROOT}")
    print(f"Files inspected: {len(files)}")
    print(f"Python files: {len(python_files)}")
    print(f"Models detected: {len(report['models'])}")
    print(f"Schemas detected: {len(report['schemas'])}")
    print(f"API routes detected: {len(report['endpoints'])}")
    print(f"Router registrations: {len(routers)}")
    print(f"Migrations detected: {len(migrations)}")
    print(f"Potential markers: {sum(markers.values())}")
    print(f"Syntax errors: {len(report['syntax_errors'])}")

    print("\n" + "-" * 65)
    print("REPORT GENERATED SUCCESSFULLY")
    print("-" * 65)

    print(f"\nOutput file:\n{OUTPUT_FILE}")

    print("\nShare this Markdown report for the next project review.")
    print("=" * 65)


if __name__ == "__main__":
    inspect_project()
