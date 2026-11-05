from pathlib import Path

"""
MatriCare AI frontend structure organizer.

Run from the frontend directory:
    python organize_frontend.py

Non-destructive behavior:
- Preserves App.tsx, App.css, index.css, main.tsx, assets, and all other files.
- Creates the planned folders.
- Creates starter TypeScript files only if they do not already exist.
- Never deletes, moves, or overwrites existing files.
"""

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

DIRECTORIES = [
    "assets",
    "components/ui",
    "components/shared",
    "components/dashboard",
    "components/tables",
    "components/forms",
    "layouts",
    "pages/auth",
    "pages/admin",
    "pages/worker",
    "routes",
    "services",
    "hooks",
    "context",
    "types",
    "lib",
]

STARTER_FILES = {
    "layouts/AdminLayout.tsx": "export {};\n",
    "layouts/WorkerLayout.tsx": "export {};\n",
    "services/api.ts": "export {};\n",
    "services/auth.service.ts": "export {};\n",
    "services/patient.service.ts": "export {};\n",
    "services/pregnancy.service.ts": "export {};\n",
    "services/followup.service.ts": "export {};\n",
    "services/notification.service.ts": "export {};\n",
}

ESSENTIAL_FILES = ["App.tsx", "App.css", "index.css", "main.tsx"]

def main():
    if not (ROOT / "package.json").is_file():
        raise FileNotFoundError(
            "package.json not found. Place this script in the frontend directory."
        )

    if not SRC.is_dir():
        raise FileNotFoundError(
            "src directory not found. Run this script in the existing frontend project."
        )

    print(f"Preparing frontend structure: {ROOT}\n")

    for relative_path in DIRECTORIES:
        (SRC / relative_path).mkdir(parents=True, exist_ok=True)
        print(f"[DIRECTORY] src/{relative_path}")

    for relative_path, content in STARTER_FILES.items():
        file_path = SRC / relative_path
        if file_path.exists():
            print(f"[KEPT]      src/{relative_path}")
            continue
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        print(f"[CREATED]   src/{relative_path}")

    print("\nChecking existing application files:")
    for filename in ESSENTIAL_FILES:
        status = "KEPT" if (SRC / filename).exists() else "NOT FOUND"
        print(f"[{status}] src/{filename}")

    print("\nCompleted. No existing files were deleted, moved, or overwritten.")

if __name__ == "__main__":
    main()
