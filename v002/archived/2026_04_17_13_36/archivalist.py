import sys
import os
import shutil
import re
from datetime import datetime

class Archivalist():
    def __init__(self, project_dir:str="../", chatty:bool=True):
        super().__init__()
        self.full_path_base = os.path.abspath(project_dir),
        print(f"Archivalist off to archival...."),
        print(f"....in.project_dir....{self.full_path_base}...."),
        self.chatty = chatty,
        #self.structure = self.survey_structure(depth_limit=4),
        self.DO_LIVE = True,
        self.VERBOSITY = 0,
        #self.POSTFIX = "2026_04_17_j"
        self.MAIN_STORE = "archived",
        self.excluded_dir_names = ["archived", "inspiration", "shared"]
    
    def archive_project(
        self,
        scan_dir_name: str = "../",
        store_dir_name: str = "archived",
        excluded_dir_names: list = ["archived", "inspiration", "shared"],
        include_only_exts: list = ["py", "css", "html", "js"],
        verbosity: int = 5,
        live: bool = True,
        ):
        
        # Post fix comes automatically from the actual time
        postfix = self.get_date_time()
        
        # Setup target directory: MAIN_STORE/POSTFIX
        path_abs_scan = os.path.abspath(scan_dir_name)
        path_abs_store = os.path.abspath(os.path.join(store_dir_name, postfix))

        if verbosity > 0:
            print(f"...scanning: {path_abs_scan}")
            #print(f"Target Store: {path_abs_store}")

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
                    ext = filename.split('.')[-1]
                    # Save with the original filename (no postfix injection)
                    destination_path = os.path.join(path_abs_store, filename)
                    print(f"...........................................")
                    print(f"....proposal:copy.from.SOURCE.to.TARGET....")
                    print(f"........ext..:..{ext}......................")
                    print(f"........SOURCE:.{source_path}..............")
                    print(f"........TARGET:.{destination_path}..............")
                    
                    is_file_okay = False
                    if live and (ext in include_only_exts):
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
    
    def get_date_time(self):
        return datetime.now().strftime("%Y_%m_%d_%H_%M")
    
    def survey_structure(
        self,
        depth_limit=3,
        include_only_ext:list=["css", "html", "js", "py"],
        exclude_if_in_dir:list=["inspiration", "archived"]
        ):
        start_level = self.full_path_base.count(os.sep)
        self.structure = {} # Reset each time
        
        
        files_to_associate = []
        for root, dirs, files in os.walk(self.full_path_base):
            is_dir_okay_to_add = True
            s_file_okay_to_add = False
            ##current_level = root.count(os.sep) - start_level
            if current_level >= depth_limit:
                del dirs[:] # Stop digging
                continue
            
            abs_root = os.path.abspath(root)
            
            
            # Screen out via exclusion directories
            for excl_dir in exclude_if_in_dir:
                if excl_dir in abs_root:
                    print(f"{excl_dir} : {abs_root}")
                    is_dir_okay_to_add = False
                    break
            
            # Screen out via inclusion extensions
            is_file_okay_to_add = False
            for ext in include_only_ext:
                if ext in abs_root:
                    print(f"{ext}: {abs_root}")
                    is_file_okay_to_add = True
                    break
            
            if is_dir_okay_to_add and is_file_okay_to_add:
                self.structure[abs_root] = files
        
        return self.structure
    
    def report_keys(self, D={}, depth:int=0):
        """Recursively prints the structure."""
        for key, val in D.items():
            short_key = key.split("/")[-1]
            print(f"{short_key}")
            if isinstance(val, list):
                for file in val:
                    print((" "*4*depth) + f"{file}")
            elif isinstance(val, dict):
                # Recurse properly using self
                self.report_keys(D=val, depth=depth+1)

    def report_structure(self):
        """Entry point for reporting."""
        if not self.structure:
            print("The archives are empty. Run 'survey_structure' first.")
            return
        # Call the helper method with the data
        self.report_keys(self.structure)

    def sync_files(self, source, target, restrict_to_existing=False):
        """
        2. Copies files from source to target.
        restrict_to_existing: If True, only copies if the file exists in both.
        """
        source_path = os.path.abspath(source)
        target_path = os.path.abspath(target)
        
        if not os.path.exists(target_path):
            os.makedirs(target_path)

        for filename in os.listdir(source_path):
            src_file = os.path.join(source_path, filename)
            tgt_file = os.path.join(target_path, filename)
            
            if os.path.isfile(src_file):
                # Logic: copy if we don't care (False) OR if it exists (True)
                if not restrict_to_existing or os.path.exists(tgt_file):
                    shutil.copy2(src_file, tgt_file)

    def fix_relative_paths(self, extensions=None, fix_logic_func=None):
        """
        3. Trawls through file types and processes path-like strings.
        extensions: List of extensions like ['.py', '.html']
        fix_logic_func: A function that takes a found path string and returns the correction.
        """
        if extensions is None:
            extensions = ['.py', '.html', '.css', '.js']
            
        # Basic regex to find relative path patterns (e.g., ../folder/file.js)
        path_regex = r'(\.?\.\/)+[\w\/\.-]+\.\w+'

        for root, _, files in os.walk(self.full_path_base):
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # If a fix function is provided, apply it to all regex matches
                    if fix_logic_func:
                        new_content = re.sub(path_regex, lambda m: fix_logic_func(m.group(0)), content)
                        
                        if new_content != content:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)


# --- Example Usage ---
arch = Archivalist()
arch.archive_project()




