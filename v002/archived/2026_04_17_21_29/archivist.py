#####################################################
# v002/helpers/archivalist.py 
#####################################################
import sys
import os
import shutil
import re
from datetime import datetime
from pathlib import Path

class Archivist():
    
    def __init__(self, project_dir=Path.cwd(), chatty:bool=True):
        self.abs_path_project = os.path.abspath("../")
        
        print(f"self.abs_path_projecte: {self.abs_path_project}")
        
        self.chatty = chatty
        self.DO_LIVE = True
        self.VERBOSITY = 0
        self.MAIN_STORE = "archived"
        self.excluded_dir_names = ["archived", "inspiration", "shared"]
        self.include_only_exts = ["py", "css", "html", "js"]        
        self.project_files = []
        # LLM says below is good....
        #-----------------------------------
        # except Exception as e:
        # print(f"An error occurred: {e}")
        #-----------------------------------
        try:
            self.project_files = self.get_project_files()
        except Exception as e:
            print(f'{self.__class__.__name__} has Exception: {e}')
    
    def archive(self):
        pfs = self.get_project_files()
        if len(pfs) > 0:
            print("test")
            for source_path in pfs:
                filename = source_path.split('/')[-1]
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
        
    def get_project_files(self):
        
        project_files = []
        
        if os.path.exists(self.abs_path_project):
            for root, dirs, files in os.walk(self.abs_path_project):
                
                # Skip excluded directories
                if any(excl in root for excl in self.excluded_dir_names):
                    continue
                

                for filename in files:
                    source_path = os.path.join(root, filename)
                    ext = filename.split('.')[-1]
                    # Save with the original filename (no postfix injection)
                    #destination_path = os.path.join(path_abs_store, filename)
                    print(f"...........................................")
                    print(f"....project file detected ...................")
                    print(f"........ext..:..{ext}......................")
                    print(f"........SOURCE:.{source_path}..............")
                    
                    if ext in self.include_only_exts:
                        project_files.append(source_path)

        # Summary

        
        return project_files
 
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
            
        # Basic regex to find relative path patterns (e.g., ../folder/file.js)
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
        
        try:
            basename, ext = path.isfile(abs_file_path).split("/")[-1].split('.')
            print(f"....decomposition.........")
            print(f"........{basename}........")
            print(f"........{ext}.............")
        except Exception as e:
            print(f"EXCEPTION: {e}")
            
        return basename, ext, '.'.join([basename, ext])
    
    def scan_content_for_fc(self, content:str=""):
        
        translation = {
        "comment sigs": {
            "py": {
                    '#'  : r'\n[a-zA-Z]',
                    "'''": "'''",
                    '"""': '"""',
                 },
            "html":  {
                '<!--':'-->',
                },   
            "css*":  {
                '/*'  : '*/',
                }, 
            "js":    {
                '/*'  : '*/',
                },
            }
        }
        
        comment_sigs_lang = translation["comment sigs"][ext]
        logic_idx_open = -1
        open_char = ''
        logic_idx_close = -1
        
        first_comment_info = {}
        with open('example.txt', 'r') as file:
            content = file.read()      
        comment_sig_open 	  = ''
        comment_sig_open_log = [],
        comment_sig_close = ''
        state_change_sigs = list(comment_sigs_lang.keys())
        state_change_ends_alg = False;
        for i in range(len(content)):
            
            for comment_sig in state_change_sigs:
                i_end = i + len(comment_sig)
                if (comment_sig in [line[i:i_end]]):
                    # Match! State change! omment_sig in [content[i,i_end]]:
                    
                    if state_change_ends_alg:
                        
                        # Fill in remaining info 
                        first_comment_info["comment-closing-tag"] = copy.deepcopy(comment_sig)
                        first_comment_info["comment-closing-idx"] = copy.deepcopy(i)
                        first_comment_info["comment-content"] = line.slice(logic_idx_open, logi_idx_close)
                        
                        return first_comment_info
                    
                    else:
                        
                        # Start fill
                        first_comment_info["comment-opening-tag"] = copy.deepcop(comment_sig)
                        first_comment_info["comment-opening-idx"] = copy.deepcopy(i_end)
                        
                        temp = copy.deepcopy(state_change_ends_alg)
                        state_change_ends_alg = not temp
                        
            
            '''
            for comment_sig in list(comment_sigs_lang:.keys()) + comment_sigs
                i_end = + len(comment_sig)
                if comment_sig in [content[i,i_end]]:
                    if logic_idx_open >=0:
                        logic_idx_close = i_end

                        first_comment_info["comment-closing-tag"] = comment_sig_close
                        first_comment_info["comment-closing-idx"] = i_end
                        first_comment_info["comment-content"] = line.slice(logic_idx_open, logi_idx_close)
                                            
                        return first_comment_info
                    else:
                        first_comment_info["comment-opening-tag"] = comment_sig_close
                        first_comment_info["comment-opening-idx"] = i_end
            '''
            
        return first_comment_info
    
    '''
    def rebandanna_files(self):
        
        # Decompose into bits of info
        for source_path in self.project_files:
            dir_seq_back = source_path.split("/")
            container = dir_seq_back[-2]
            base, ext = dir_seq_back[-1].split(".")[-1].split(".")
            with open(source_path, 'r') as f:
                content = file.read()
            first_non_log_comment = scan_content_for_fc(content=content)["comment-content"]
            
            dir_seq_back.reverse()
            print(f"..................................")
            print(f"....{base} . {ext}................")
            print(f"........{first_non_log_comment}...")
        
        
        
        return
    '''
    
    def rebandanna_files(self):
        
        for source_path in self.project_files:
            # 1. Robust Path Splitting
            parts = source_path.split(os.sep)
            base_ext = parts[-1] 
            base, ext = os.path.splitext(base_ext)
            # Safely get the parent directory (container)
            container = parts[-2] if len(parts) > 1 else "root"

            try:
                with open(source_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # 2. Extract comment using your existing method
                # We pass the extension so scan_content_for_fc knows what to look for
                comment = self.scan_content_for_fc(content, ext)

                # 3. Clean Output
                print(f"SOURCE: {source_path}")
                print(f"Project file detected: ext {ext} | base {base} | container {container}")
                print(f"Header Comment: {comment}\n" + "-"*20)

            except Exception as e:
                print(f"Skipping {source_path} due to error: {e}")

        
if __name__=='__main__':
    R = Archivist()
    R.archive()
    #R.rebandanna_files()



