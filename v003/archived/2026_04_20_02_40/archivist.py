# helpers/archivist.py
import builtins
import functools
import copy
import sys
import os
import shutil
import re
from datetime import datetime
from pathlib import Path

TRANSLATION = {
    "comment sigs": {
        "py": {'#': r'\n[a-zA-Z]', "'''": "'''", '"""': '"""'},
        "html": {'<!--': '-->'},
        "css": {'/*': '*/'}, # Removed the asterisk
        "js": {'//':'\n', '/*': '*/'},
    }
}

###############################################################
# THIS IS A DECORATOR
def prepend_name(func):
    MAX_LEN_OUT = 70
    MAX_LEN_FUNC = 10
    
    @functools.wraps(func)  # Keeps the original function's name and docstring
    def wrapper(*args, **kwargs):
        # Define a custom print function
        def custom_print(*p_args, **p_kwargs):
            
            # 1. Join all args into a single string
            full_str = " ".join(map(str, p_args))
            
            # 2. Removal: Strip newlines and slice to MAX_LEN
            trunc_out = full_str.replace('\n', ' ')[:MAX_LEN_OUT]
            
            # 3. Truncate function name
            trunc_func = func.__name__[:MAX_LEN_FUNC]
            
            # Prepend the function name to the output
            
            
            
            return builtins.print(f"({trunc_func}) {trunc_out}", **p_kwargs)
        
        # Temporarily replace print in the function's global scope
        original_print = func.__globals__.get('print', builtins.print)
        func.__globals__['print'] = custom_print
        
        try:
            return func(*args, **kwargs)
        finally:
            # Restore the original print function after execution
            func.__globals__['print'] = original_print
            
    return wrapper
###############################################################



class Archivist():
    
    def __init__(self, project_dir=Path.cwd(), chatty:bool=True):
        
        # Determine / store paths
        self.abs_path_project = os.path.abspath("../")
        self.abs_path_live = os.path.join(self.abs_path_project, "live")
        self.abs_path_arch = os.path.join(self.abs_path_project, "archived")        
        
        #self.excluded_dir_names = ["archived", "inspiration", "shared"]
        self.excluded_dir_names = []
        self.include_only_exts = ["css", "html", "js", "svg"]        
        self.project_files = []
        
        try:
            self.project_files = self._get_project_files()
        except Exception as e:
            print(f'failed to get project files')
        
    @prepend_name
    def _get_project_files(self, verbose=True):
        
        project_files = []
        walk_path = copy.deepcopy(self.abs_path_live)
        
        if os.path.exists(walk_path):
            for root, dirs, files in os.walk(walk_path):
                
                # Skip excluded directories
                if any(excl in root for excl in self.excluded_dir_names):
                    continue

                for filename in files:
                    source_path = os.path.join(root, filename)
                    ext = filename.split('.')[-1]
                    if verbose:
                        print(f"...........................................")
                        print(f"....project.file.detected ...................")
                        print(f"........ext..:..{ext}......................")
                        print(f"........SOURCE:.{source_path}..............")
                    
                    if ext in self.include_only_exts:
                        project_files.append((source_path, filename, ext))

        # Summary
        project_files_ret = copy.deepcopy(project_files)
        print(f'{len(project_files_ret)} project files returned')
        
        return project_files_ret
 
    def _get_date_time(self):
        return datetime.now().strftime("%Y_%m_%d_%H_%M")
       
    @prepend_name
    def _scan_for_fc(self, file_path, ext):
        """Grabs the 'Front Content' (header comments) of a file."""
        content = []
        sigs = TRANSLATION["comment sigs"].get(ext, {})
        
        # We need to know if we are inside a multi-line comment (like ''' or /*)
        in_multiline = False
        multiline_end = ""

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    stripped = line.strip()
                    
                    # 1. Handle Empty Lines (Keep them if we are in a comment block)
                    if not stripped:
                        content.append(line)
                        continue

                    # 2. Handle Multiline Logic (CSS, JS, or Py Docstrings)
                    if not in_multiline:
                        # Check if line starts a multiline block
                        found_start = False
                        for start_sig, end_sig in sigs.items():
                            if start_sig != '#' and stripped.startswith(start_sig):
                                in_multiline = True
                                multiline_end = end_sig
                                found_start = True
                                break
                        
                        # 3. Handle Single Line Logic (Python #)
                        if not found_start:
                            if '#' in sigs and stripped.startswith('#'):
                                content.append(line)
                                continue
                            else:
                                # HIT ACTUAL CODE - Stop scanning
                                break
                    
                    # 4. If we are inside a multiline block, keep going until the end sig
                    content.append(line)
                    if in_multiline and multiline_end in stripped:
                        in_multiline = False
                        # Optional: break here if you only want the VERY first block
            
            return "".join(content)
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
            return ""    
 
    @prepend_name
    def _update_header_with_path(self, file_path, ext):
        # 1. Get the current front content block
        old_fc = self._scan_for_fc(file_path, ext)
        
        # 2. Calculate the path
        #rel_path = Path(os.path.relpath(file_path, self.abs_path_project))
        #rel_path = os.path.relpath(file_path, rel_path.parent)
        rel_path = file_path.split('jpichelmeyer.github.io')[-1]
        
        templates = {
            "js": f"// {rel_path}",
            "css": f"/* {rel_path} */",
            "html": f"<!-- {rel_path} -->",
            "svg": f"<!-- {rel_path} -->"
        }
        # This is the single line we are looking for
        target_header_line = templates.get(ext, f"# {rel_path}")
        
        # 3. CRITICAL CHECK: Does the file ALREADY start with this header?
        # Using .lstrip() handles cases where there's a stray newline at the top
        if old_fc.lstrip().startswith(target_header_line):
            print(f"--- [SKIP] {rel_path} already has correct header.")
            return

        # 4. Read the full file content
        with open(file_path, 'r', encoding='utf-8') as f:
            full_content = f.read()

        # 5. Build the new header with exactly one newline
        new_header_block = target_header_line + "\n"

        # 6. Replace the entire old comment block with our single new header
        if old_fc:
            # This wipes out ALL the stacked '// global.js' lines 
            # and replaces them with just one.
            updated_content = full_content.replace(old_fc, new_header_block, 1)
        else:
            updated_content = new_header_block + full_content

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
            
        print(f"+++ [FIXED] {rel_path} header cleaned and updated.")

    @prepend_name
    def archive(self, for_real=False):
        pfs = self._get_project_files()
        if len(pfs) > 0:
            for source_path, filename, ext in pfs:
                destination_path = copy.deepcopy(self.abs_path_arch)
                destination_path = os.path.join(destination_path, self._get_date_time())
                if os.path.isdir(destination_path) == False:
                    os.makedirs(destination_path)
                destination_path = os.path.join(destination_path, filename)
                print(f"....saved:.{filename}..................")             
                print(f"........SOURCE:...{source_path}..............")
                print(f"........DESTINATION: {destination_path}.......") 
                if for_real:
                    shutil.copy2(source_path, destination_path)
                    print(f"........SAVED!!.......") 
                else:
                    print(f"Not 'for_real'")
        else:
            print(f"....... MISSED!........")
        
        if for_real:
            print(f"....{len(pfs)} files archived!")

    @prepend_name
    def check_abs_paths(self):
        print(f'self.abs_path_....')
        print(f'....project: {self.abs_path_project}')
        print(f'....live   : {self.abs_path_live}')
        print(f'....arch   : {self.abs_path_arch}')

    @prepend_name
    def restore_web_assets(self, restore_dir:str, for_real:bool=False):
        
        # Only restore these specific types
        web_exts = ['html', 'css', 'js', 'svg']
        
        maybe_archive_dir = os.path.join(self.abs_path_arch, restore_dir)
        if not os.path.exists(archive_dir):
            print(f"Error: Archive {restore_dir} not found.")
            return

        for filename in os.listdir(restore_dir):
            ext = filename.split('.')[-1].lower()
            
            # Filter for web assets only
            if ext not in web_exts:
                continue

            file_path = os.path.join(restore_dir, filename)
            
            # Read the first line to find the destination path
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()

            # Extract the path from the comment (e.g., "# gui/window.js" -> "gui/window.js")
            match = re.search(r'([\w\/\.-]+\.\w+)', first_line)
            
            if match:
                rel_path = match.group(1)
                final_dest = os.path.join(self.abs_path_live, rel_path)
                
                if for_real:
                    # Rebuild the subfolders (gui/, app/, etc.) inside /pos/
                    os.makedirs(os.path.dirname(final_dest), exist_ok=True)
                    shutil.copy2(file_path, final_dest)
                    print(f"Restored {ext.upper()}: {rel_path}")
                else:
                    print(f"Not 'for_real'")
            else:
                print(f"Skipped {filename}: No valid path header found.")
        
        if for_real:
            print(f"Web asset restoration from '{label}' complete.")
        #"""
        
        return
    
    @prepend_name
    def show_project_files(self):
        for thing in self.project_files:
            print()
            print(thing)
            
    @prepend_name
    def update_headers(self):
        for source_path, filename, ext in self.project_files:
            try:
                self._update_header_with_path(file_path=source_path, ext=ext)
                header = self._scan_for_fc(file_path=source_path, ext=ext)
                print(f'{filename} header updated to: {header}')
            except Exception as e:
                print(f'Exception: {e}')
        return
        
if __name__=='__main__':
    
    # Instantiate an Archivist
    R = Archivist()
    
    # Archivist ACTIONS
    
    # ------- Safe: no modifications to files ------- 
    #R.show_project_files()
    #R.check_abs_paths()
    
    # ------- Wary ----------------------------------
    #
    #    live mod  : minimal
    #    file gen  : branch new folder, brand new copies
    #
    #R.update_headers()
    #R.archive(for_real=False)
    #R.archive(for_real=True)
    
    # ------- CAREFUL --------------------------------
    #
    #    live mod  : totally overwritten
    #    file gen  : ---
    #
    #R.restore_web_assets(label='')
    #R.restore_web_assets(label='')
    #R.restore_web_assets(label='')
    #R.restore_web_assets(label='')
    #R.restore_web_assets(label='2026_04_19_13_34')
    #R.restore_web_assets(label='2026_04_19_13_45')
    #R.restore_web_assets(label='2026_04_19_14_00')
    #R.restore_web_assets(label='2026_04_19_15_12')
    #R.restore_web_assets(label='2026_04_20_01_44')

    
    
    pass


