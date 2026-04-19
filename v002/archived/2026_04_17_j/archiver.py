import os
import shutil

DO_LIVE = True
VERBOSITY = 0
POSTFIX = "2026_04_17_j"
MAIN_STORE = "archived"

def copy_all_files_to_central(
    scan_dir_name: str = ".",
    store_dir_name: str = MAIN_STORE,
    excluded_dir_names: list = ["archived", "inspiration", "shared"],
    postfix: str = POSTFIX,
    verbosity: int = VERBOSITY,
    live: bool = False,
    ):
    # Setup target directory: MAIN_STORE/POSTFIX
    path_abs_scan = os.path.abspath(scan_dir_name)
    path_abs_store = os.path.abspath(os.path.join(store_dir_name, postfix))

    if verbosity > 0:
        print(f"Scanning: {path_abs_scan}")
        print(f"Target Store: {path_abs_store}")

    # Ensure the store directory exists
    if not os.path.exists(path_abs_store):
        if verbosity > 0:
            print(f"Creating directory: {path_abs_store}")
        if live:
            os.makedirs(path_abs_store, exist_ok=True)

    successful_saves = []

    if os.path.exists(path_abs_scan):
        for root, dirs, files in os.walk(path_abs_scan):
            # Skip excluded directories
            if any(excl in root for excl in excluded_dir_names):
                continue

            for filename in files:
                source_path = os.path.join(root, filename)
                # Save with the original filename (no postfix injection)
                destination_path = os.path.join(path_abs_store, filename)

                if os.path.isfile(destination_path):
                    if verbosity > 1:
                        print(f"Skipping (Already exists): {filename}")
                else:
                    if verbosity > 0:
                        print(f"Copying: {filename}")
                    
                    if live:
                        shutil.copy2(source_path, destination_path)
                        successful_saves.append(filename)

    # Summary
    if successful_saves:
        print(f"\nSuccessfully saved {len(successful_saves)} files:")
        if verbosity > 0:
            for f in successful_saves:
                print(f" - {f}")
    else:
        print("\nNo new files were saved.")

if __name__ == '__main__':
    print("Running archiver.py...")
    copy_all_files_to_central(live=DO_LIVE)
    print("Finished.")
