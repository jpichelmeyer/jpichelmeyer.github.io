import os
import shutil
import re

class Archivalist:
    def __init__(self, project_dir):
        self.full_path_base = os.path.abspath(project_dir)
    
    def survey_structure(self, depth_limit=3, and_report:bool=True):
        """
        1. Records a dictionary (DAG) of absolute file paths 
        within a directory up to a specific depth.
        """
        structure = {}
        start_level = self.full_path_base.count(os.sep)
        
        for root, dirs, files in os.walk(self.full_path_base):
            current_level = root.count(os.sep) - start_level
            if current_level >= depth_limit:
                del dirs[:]  # Stop recursion deeper than limit
                continue
            
            abs_root = os.path.abspath(root)

        def report_keys(D):
            for key in D:
                print(key)
                val = D[key]
                if isinstance(val, dict):
                    report_keys(val)
                else:
                    print(val)
                report_keys()
            
        return structure

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