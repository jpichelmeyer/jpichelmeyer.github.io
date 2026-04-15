import os
import shutil
from pathlib import Path

"""

ARCHIVER TEST x92kd

import os
import shutil
from pathlib import Path

def copy_all_files_to_central(source_dir, destination_dir):
    # Create the destination directory if it doesn't exist
    if not os.path.exists(destination_dir):
        os.makedirs(destination_dir)

    # os.walk yields a 3-tuple (dirpath, dirnames, filenames) for each directory in the tree
    for root, dirs, files in os.walk(source_dir):
        for filename in files:
            # Construct absolute file paths
            source_path = os.path.join(root, filename)
            dest_path = os.path.join(destination_dir, filename)

            # Check for name collisions to avoid overwriting files with the same name
            if os.path.exists(dest_path):
                # Simple rename strategy: append original parent folder name
                base, ext = os.path.splitext(filename)
                parent_folder = os.path.basename(root)
                new_filename = f"{base}_{parent_folder}{ext}"
                dest_path = os.path.join(destination_dir, new_filename)

            try:
                # shutil.copy2 preserves file metadata like timestamps
                shutil.copy2(source_path, dest_path)
                print(f"Copied: {filename} -> {destination_dir}")
            except Exception as e:
                print(f"Error copying {filename}: {e}")


# Walking the current directory using a relative path
for root, dirs, files in os.walk("."):
    for name in files:
        # This creates a relative path to the file from the CWD
        relative_file_path = os.path.join(root, name)
        print(relative_file_path)


# Get the directory of the current script
script_dir = Path(__file__).resolve().parent
print(script_dir)

relative_path = "mydir/myfile.txt"
absolute_path = os.path.abspath(relative_path)
print(absolute_path)


from pathlib import Path

relative_path = Path("mydir/myfile.txt")

# Option A: Get absolute path without resolving symlinks
absolute_path = relative_path.absolute()

# Option B: Resolve symbolic links and ".." components (recommended)
resolved_path = relative_path.resolve()

print(resolved_path)




import shutil

# Absolute path to source file
source = "/absolute/path/to/source/file.txt"

# Absolute path to destination (can be a directory or a full file path)
destination = "/absolute/path/to/destination/"

# Copy file, preserving permissions
shutil.copy(source, destination)

# Copy file, preserving metadata (recommended)
shutil.copy2(source, destination)

"""

def copy_all_files_to_central(
    scan_dir_name:str="",
    store_dir_name:str="archived",
    excluded_dir_names:list=[
        "archived",
        "inspiration",
        ],
    postfix:str="2026_04_15_a",
    postfix_indent:int=0,
    verbosity:int=0,
    live:bool=False,
    ):
    
    def inject_postfix(path_abs_file:str=""):
        filename_raw = path_abs_file.split("/")[-1]
        path_abs_parent = "/".join(path_abs_file.split("/")[:-1])
        
        filename_injected, ext = filename_raw.split(".")
        for _ in range(postfix_indent):
            filename_injected += "_x"
        filename_injected += "_" + postfix
        filename_injected += "." + ext
        
        #print(f"abs_path_parent: {abs_path_parent}")
        return filename_raw, filename_injected, path_abs_parent
    
    # Get aboslute paths
    path_abs_scan = os.path.abspath(scan_dir_name)
    path_abs_store = os.path.abspath(store_dir_name)
    if verbosity > 1:
        print(f"....path_abs_scan IS {path_abs_scan}...")
        print(f"....path_abs_store IS {path_abs_store}...")
    
    # Check whether the store directory exists or not
    if not os.path.exists(path_abs_store):
        if verbosity > 1:
            print(f"....{path_abs_store} does NOT exist as a path....")
            print(f"....creating directory at {path_abs_store}....")
        os.makedirs(path_abs_store)
    else:
        if verbosity > 1:
            print(f"....good news: {path_abs_store} exists as a path....")
    
    successful_saves = []
    path_abs_files = []
    # Check whether the scan directory exists or not
    if os.path.exists(path_abs_scan):
        if verbosity > 1:
            print(f"....good news: {path_abs_scan} exists as a path....")
            print(f"....contained in {path_abs_scan} is...")
        for root, dirs, files in os.walk(path_abs_scan):
            
            # Check for exclusion
            is_excluded = False
            for excluded_dir_name in excluded_dir_names:
                if excluded_dir_name in root:
                    is_excluded = True
                    break
            if verbosity > 1:
                print(f"........................................")
                print(f"........element of os.walk(path_abs_scan)...")
                print(f"............root:.{root}...")
                print(f"............is_excluded:.{is_excluded}")
                #print(f"............SAME.AS.PATH.STORE.{root==path_abs_store}...")
                #print(f"............SAME.AS.PATH.SCAN.{root==path_abs_scan}...")
                #print(f"............CHILD.OF.STORE.{store_dir_name in root}...")
                #print(f"............dirs:.{dirs}...")
                #print(f"............files:.{files}...")
            
            if not is_excluded:
                for filename in files:
                    path_abs_file = os.path.abspath(root + "/" + filename)
                    path_abs_files.append(path_abs_file)
    if verbosity > 1:
        print(f"....showing.all.abs.paths.in..path_abs_filenames....")
    for path_abs in path_abs_files:
        filename_raw, filename_injected, path_abs_parent = inject_postfix(path_abs)
        if verbosity > 1:
            print(f"........{filename_raw}....")
            print(f"............{path_abs_parent}....")
            print(f"............{path_abs_store}....")
        
        source = path_abs_parent + "/" + filename_raw
        destination = path_abs_store + "/" + filename_injected
        
        if os.path.isfile(destination):
            if verbosity > 0:
                reverse_steps = min(len(destination), 48)
                destination_reduced = destination[-reverse_steps:]
                print(f"............ALREADY.A.FILE.WITH....")
                print(f"................{filename_injected}")
                print(f"................AT....")
                print(f"................{destination_reduced}....")
                print(f"................no.copy.was.made....")
        else:
            if verbosity > 0:
                print(f"............copying.from....")
                print(f"................{source}....")
                print(f"................to....")
                print(f"................{destination}....")
            
            if live:
                shutil.copy2(source, destination)
                successful_saves.append(filename_raw)
                if verbosity > 1:
                    print(f"............copy.successful!")
    
    if len(filename_raw) > 0:
        for filename_raw in successful_saves:
            print(f"........saved.{filename_raw}....")
    else:
        print(f"....no.files.were.saved....")
    

if __name__ == '__main__':
    print("Running archiver.py...")
    copy_all_files_to_central(verbosity=0, live=True)
    print("....finished running archiver.py.")
    
