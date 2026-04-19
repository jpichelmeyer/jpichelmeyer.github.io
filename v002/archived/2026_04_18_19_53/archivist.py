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
    @functools.wraps(func)  # Keeps the original function's name and docstring
    def wrapper(*args, **kwargs):
        # Define a custom print function
        def custom_print(*p_args, **p_kwargs):
            # Prepend the function name to the output
            return builtins.print(f"[{func.__name__}]", *p_args, **p_kwargs)
        
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
        self.abs_path_project = os.path.abspath("../")
        
        print(f"self.abs_path_project: {self.abs_path_project}")
        
        self.chatty = chatty
        self.DO_LIVE = True
        self.VERBOSITY = 0
        self.MAIN_STORE = "archived"
        self.excluded_dir_names = ["archived", "inspiration", "shared"]
        self.include_only_exts = ["py", "css", "html", "js"]        
        self.project_files = []
        try:
            self.project_files = self.get_project_files()
        except Exception as e:
            print(f'{self.__class__.__name__} has Exception: {e}')
    
    def archive(self):
        pfs = self.get_project_files()
        if len(pfs) > 0:
            print("test")
            for source_path, filename, ext in pfs:
                #filename = source_path.split('/')[-1]
                destination_path = os.path.join(self.abs_path_project, "archived")
                destination_path = os.path.join(destination_path, self.get_date_time())
                if os.path.isdir(destination_path) == False:
                    os.makedirs(destination_path)
                destination_path = os.path.join(destination_path, filename)
                print(f"....saved:.{filename}..................")             
                print(f"........SOURCE:...{source_path}..............")
                print(f"........DESTINATION: {destination_path}.......") 
                shutil.copy2(source_path, destination_path)
                print(f"........SAVED!!.......") 
        else:
            print(f"....... MISSED!........")
        
        print(f"....{len(pfs)} files archived!")
    
    @prepend_name
    def get_project_files(self, verbose=False):
        
        project_files = []
        
        if os.path.exists(self.abs_path_project):
            for root, dirs, files in os.walk(self.abs_path_project):
                
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
 
    def get_date_time(self):
        return datetime.now().strftime("%Y_%m_%d_%H_%M")
    
    
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
        path_regex = r'(\.?\.\/)+[\w\/\.-]+\.\w+'

        for root, _, files in os.walk(self.abs_path_project):
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
    
    
    def decompose_path(self, abs_file_path:str=""):
        parts = abs_file_path.split('/')
        parts.reverse() 
        ext = 'ext'
        base = 'base'
        filename = 'filename.EXT'
        container = 'parentdir/'
        if isinstance(parts, type(None)):
            print(f"SAYS NO PARTS FOR {abs_file_path}")
        else:
            filename = parts[-1]
            container = parts[-2]
        try:
            subparts = filename.split('.')
            ext = subparts[-1]
            baase = subparts[-2]
            print(f"....decomposition.........")
            print(f"........{container}.......")
            print(f"........{filename}........")
            print(f"............{base}........")
            print(f"............{ext}..........")
        except Exception as e:
            print(f"EXCEPTION: {e}")
            
        return  container, filename, base, ext
    
    @prepend_name
    def scan_for_fc(self, file_path, ext):
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
    def sep_file(self, file_path, ext):
        """
        Separates a (project) file into
        
            [header]
            [body]
        
        returning both
        
        """
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
    def scan_content_for_fc(self, content_string:str="", ext:str=''):
        
           # Use the global TRANSLATION variable (note the ALL CAPS)
        sigs = TRANSLATION.get("comment sigs", {})
    
        if ext not in sigs:
            if self.chatty:
                print(f"!!! Error: Extension '{ext}' not found in translation table.")
            return {} 

        comment_sigs_lang = sigs[ext]
        
        #comment_sigs_lang = TRANSLATION["comment sigs"][ext]
        logic_idx_open = -1
        open_char = ''
        logic_idx_close = -1
        
        first_comment_info = {}      
        comment_sig_open  = ''
        comment_sig_close = ''
        state_change_sigs = list(comment_sigs_lang.keys())
        state_change_ends_alg = False;
        
        for i in range(len(content_string)):
            
            for comment_sig in state_change_sigs:
                i_end = i + len(comment_sig)
                if content_string[i:i_end] == comment_sig:
                    if state_change_ends_alg:
                        # Close the tag
                        first_comment_info["comment-closing-tag"] = comment_sig
                        first_comment_info["comment-closing-idx"] = i
                        # Use COLON here
                        first_comment_info["comment-content"] = content_string[logic_idx_open : i]
                        print(f'first_comment_info: {first_comment_info}')
                        return first_comment_info
                    else:
                        # Open the tag
                        first_comment_info["comment-opening-tag"] = comment_sig
                        first_comment_info["comment-opening-idx"] = i_end
                        logic_idx_open = i_end # CRITICAL: Update this for the slice!
                        state_change_ends_alg = True

                        
            
        return first_comment_info
    
    def msg_filter(self, text:str="", maxL=40):
        new_msg = text[0:min(maxL, len(text))]
        return new_msg
    
    
    def show_project_files(self):
        for thing in self.project_files:
            print()
            print(thing)
    
    @prepend_name
    def check_file_heads(self):
        success_ct, failure_ct = 0, 0
        for source_path, filename, ext in self.project_files:
            try:
                content = self.scan_for_fc(file_path=source_path, ext=ext)
                content = content.strip('#\n')
                rel_path = source_path.split('jpichelmeyer.github.io/')[1]
                filename = source_path.split(os.sep)[-1]
                print(f'{rel_path}')
                print(f'({filename}) content:{content}')
                success_ct += 1
            except Exception as e:
                print(f'Exception: {e}')
                failure_ct += 1
        print(f"success:{success_ct}.....failure:{failure_ct}.........")
        return
    
    @prepend_name
    def update_header_with_path(self, file_path, ext):
        # 1. Get the current front content block
        old_fc = self.scan_for_fc(file_path, ext)
        
        # 2. Calculate the path
        rel_path = os.path.relpath(file_path, self.abs_path_project)
        
        templates = {
            "js": f"// {rel_path}",
            "css": f"/* {rel_path} */",
            "html": f"<!-- {rel_path} -->"
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
    def update_headers(self):
        for source_path, filename, ext in self.project_files:
            try:
                pass
                self.update_header_with_path(file_path=source_path, ext=ext)
                header = self.scan_for_fc(file_path=source_path, ext=ext)
                print(f'{filename} header updated to: {header}')
            except Exception as e:
                print(f'Exception: {e}')
        return
    
    @prepend_name
    def restore_web_assets(self, label: str):
        archive_dir = os.path.join(self.archive_base, label)
        live_site_root = os.path.join(self.v002_root, "pos")
        
        # Only restore these specific types
        web_exts = ['html', 'css', 'js']

        if not os.path.exists(archive_dir):
            print(f"Error: Archive {label} not found.")
            return

        for filename in os.listdir(archive_dir):
            ext = filename.split('.')[-1].lower()
            
            # Filter for web assets only
            if ext not in web_exts:
                continue

            file_path = os.path.join(archive_dir, filename)
            
            # Read the first line to find the destination path
            with open(file_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()

            # Extract the path from the comment (e.g., "# gui/window.js" -> "gui/window.js")
            match = re.search(r'([\w\/\.-]+\.\w+)', first_line)
            
            if match:
                rel_path = match.group(1)
                final_dest = os.path.join(live_site_root, rel_path)
                
                # Rebuild the subfolders (gui/, app/, etc.) inside /pos/
                os.makedirs(os.path.dirname(final_dest), exist_ok=True)
                shutil.copy2(file_path, final_dest)
                print(f"Restored {ext.upper()}: {rel_path}")
            else:
                print(f"Skipped {filename}: No valid path header found.")

        print(f"Web asset restoration from '{label}' complete.")
        

if __name__=='__main__':
    
    
    R = Archivist()
    #R.show_project_files()
    #R.update_headers()
    R.archive()
    



