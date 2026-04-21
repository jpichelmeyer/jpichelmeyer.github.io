# v003/helpers/analyzer.py
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


###############################################################
# THESE ARE UTILITY FUNCTIONS

def sort_dict(d:dict) -> dict:
    d_keys = list(d.keys())
    d_keys.sort()
    new_dict = {}
    for k in d_keys:
        new_dict[k] = d[k]
    return new_dict



###############################################################




class Analyzer():
    
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
    def generate_bug_report(self):
        data = self.get_analysis_data()
        
        print("\n=== P-SHELL BUG HUNT REPORT ===")
        
        # 1. Check for Broken JS Links (CRITICAL BUGS)
        print("\n[!] Checking JS-to-HTML Connections...")
        for target in data["js_targets"]:
            if target not in data["html_ids"]:
                print(f"    MISSING ID: JS looks for '#{target}', but it's not in HTML!")

        # 2. Check for Dead CSS (BLOAT)
        print("\n[?] Checking for Dead CSS...")
        for selector in data["css_selectors"]:
            if selector not in data["html_classes"] and selector not in data["html_ids"]:
                # Ignore standard tags like 'body' or 'html'
                if selector not in ['root', 'body', 'html']:
                    print(f"    UNUSED CSS: '.{selector}' is defined but never used.")
    
    @prepend_name
    def scan_project_logic(self):
        """Line-by-line scan for connections and potential bugs."""
        report = {}

        for path, name, ext in self.project_files:
            file_data = {
                "classes": set(),
                "ids": set(),
                "injections": [],  # style="..." or onclick="..."
                "links": []        # href or src paths
            }

            with open(path, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f, 1):
                    # Find IDs and Classes
                    file_data["ids"].update(re.findall(r'id=["\'](.*?)["\']', line))
                    file_data["classes"].update(re.findall(r'class=["\'](.*?)["\']', line))
                    
                    # Detect Injections (Potential Bugs/Smells)
                    if 'style=' in line:
                        file_data["injections"].append(f"L{i}: Inline Style")
                    if 'on' in line and re.search(r'on\w+=', line):
                        file_data["injections"].append(f"L{i}: Inline JS Event")

                    # Detect Links (Assets)
                    links = re.findall(r'(?:href|src)=["\'](.*?)["\']', line)
                    file_data["links"].extend(links)

            report[name] = file_data
        return report
    
    @prepend_name
    def get_analysis_data(self):
        analysis = {
            "html_classes": set(),
            "html_ids": set(),
            "css_selectors": set(),
            "js_targets": set(),
            "broken_links": []
        }

        for path, name, ext in self.project_files:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                if ext == 'html':
                    soup = BeautifulSoup(content, 'html.parser')
                    # Find every class and ID used in the HTML
                    for el in soup.find_all(True):
                        if el.get('class'):
                            analysis["html_classes"].update(el.get('class'))
                        if el.get('id'):
                            analysis["html_ids"].add(el.get('id'))

                elif ext == 'css':
                    # Find every .class and #id defined in CSS
                    classes = re.findall(r'\.([a-zA-Z0-9_-]+)', content)
                    ids = re.findall(r'#([a-zA-Z0-9_-]+)', content)
                    analysis["css_selectors"].update(classes)
                    analysis["css_selectors"].update(ids)

                elif ext == 'js':
                    # Find what IDs the JS is looking for
                    js_ids = re.findall(r'getElementById\(["\'](.*?)["\']\)', content)
                    analysis["js_targets"].update(js_ids)

        return analysis
    
    
    @prepend_name
    def generate_tree_report(self):
        '''
        Generates an HTML file with a visual tree of the
        LIVE project structure.
        
                      
            ┌── Directory Structure ────┐      
            │                           │      
            │  v003/                    │      
            │  |-- index.html           │      
            │  |-- style.css            │      
            │  |-- scriptjs             │      
            │  |-- svgs                 │      
            │  |   |-- p-shell-logo.svg │      
            │                           │      
            │                           │      
            └───────────────────────────┘      
                                               
             ┌──── Intermedia Representation (IR)
             │           _               
             │          [_]              │
             │        _ /  \_ _          │
             │       [_]     [_]         │
             │                / \_ _     │
             │             _ /    [_]    │
             │            [_]            │
             │                           │
             │                           │
             └───────────────────────────┘
             
             
             

            For whoever reading this post in 2022, check out Diagon.
            There are both a command line tool diagon and a website.

            you can create multiple ASCII visualization from text such as :

                DAG
                flowchart
                sequence diagram
                mathematical expression (without Latex)

            DAG Example :

            ┌─────┐┌─────────┐┌─────┐     
            │socks││underwear││shirt│     
            └┬────┘└┬─┬──────┘└┬─┬──┘     
             │      │┌▽─────┐  │┌▽───────┐
             │      ││pants │  ││tie     │
             │      │└┬──┬──┘  │└┬───────┘
            ┌▽──────▽─▽┐┌▽─────▽┐│        
            │shoes     ││belt   ││        
            └──────────┘└┬──────┘│        
            ┌────────────▽───────▽┐       
            │jacket               │       
            └─────────────────────┘       

                         
             
             
                                   
        '''
        
        report_path = os.path.join(self.abs_path_project, "analysis_report.html")
        
        # Data storage for our analysis
        stats = {
            "html_tags": [],
            "css_selectors": [],
            "js_selectors": []
        }

        for source_path, filename, ext in self.project_files:
            with open(source_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if ext == 'html':
                    # Find all class names in HTML
                    stats["html_tags"].extend(re.findall(r'class=["\'](.*?)["\']', content))
                elif ext == 'css':
                    # Find all defined selectors
                    stats["css_selectors"].extend(re.findall(r'\.([a-zA-Z0-9_-]+)\s*\{', content))
                elif ext == 'js':
                    # Find all IDs/Classes JS is looking for
                    stats["js_selectors"].extend(re.findall(r'getElementBy.*\(["\'](.*?)["\']\)', content))

        # Create a simple visual HTML Report
        html_template = f"""
        <html>
        <head>
            <style>
                body {{ font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }}
                .tree-node {{ margin-left: 20px; border-left: 1px solid #333; padding-left: 10px; }}
                .file-header {{ color: #ffcc00; font-weight: bold; margin-top: 10px; }}
                .match {{ color: #00ff00; }}
                .orphan {{ color: #ff3333; text-decoration: underline; }}
                .stats-box {{ border: 1px solid #00ff00; padding: 10px; margin-bottom: 20px; }}
            </style>
        </head>
        <body>
            <h1>P-SHELL PROJECT ANALYZER v0.1</h1>
            <div class="stats-box">
                Detected {len(self.project_files)} files. <br>
                CSS Selectors found: {len(set(stats["css_selectors"]))}
            </div>
            
            <div class="file-header">Project Tree</div>
            {self._build_html_tree()}
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_template)
        print(f"Analysis Report Generated: {report_path}")
    
    @prepend_name
    def _build_html_tree(self):
        """Builds a nested <div> string representing the file system."""
        tree_html = ""
        # Group files by extension for the visual
        for ext in self.include_only_exts:
            tree_html += f'<div class="tree-node file-header">.{ext} files</div>'
            for path, name, fext in self.project_files:
                if fext == ext:
                    tree_html += f'<div class="tree-node">└── {name}</div>'
        return tree_html
    
    @prepend_name
    def scan_dependencies(self, file_path, content):
        """Scans raw text for links between HTML, CSS, and JS."""
        results = {
            "ids": re.findall(r'id=["\'](.*?)["\']', content),
            "classes": re.findall(r'class=["\'](.*?)["\']', content),
            "scripts": re.findall(r'<script.*?src=["\'](.*?)["\']', content),
            "styles": re.findall(r'<link.*?href=["\'](.*?)["\']', content),
            # Bug Hunting: Look for inline style/script injections
            "injections": re.findall(r'(style=["\'].*?["\']|onclick=["\'].*?["\'])', content)
        }
        return results
    
    
    @prepend_name
    def print_ascii_tree(self, root_dir, indent=""):
        """Prints a visual ASCII tree of the project directory."""
        items = os.listdir(root_dir)
        for i, item in enumerate(sorted(items)):
            if item in self.excluded_dir_names or item.startswith('.'):
                continue
            
            path = os.path.join(root_dir, item)
            is_last = (i == len(items) - 1)
            marker = "└── " if is_last else "├── "
            
            print(f"{indent}{marker}{item}")
            
            if os.path.isdir(path):
                extension = "    " if is_last else "│   "
                self.print_ascii_tree(path, indent + extension)
    
    @prepend_name
    def show_visual_analysis(self):
        report_data = self.scan_project_logic()
        print("\n" + "="*60)
        print(" P-SHELL PROJECT ARCHITECTURE & BUG MAP")
        print("="*60)

        # Draw the Tree with Data Annotations
        for filename, data in report_data.items():
            print(f"├── {filename}")
            
            # Show IDs found (The "Hooks" for JS)
            if data["ids"]:
                ids_str = ", ".join([f"#{i}" for i in data["ids"]])
                print(f"│   ├── Hooks: {ids_str}")
            
            # Show Injections (The "Bugs/Smells")
            if data["injections"]:
                inj_str = " | ".join(data["injections"])
                print(f"│   └── [!] INJECTIONS: {inj_str}")
            else:
                print(f"│   └── [ok] No inline injections.")
            
            print(f"│")
        print("="*60)
    
    @prepend_name
    def map_css_cascade(self):
        """Maps CSS classes to HTML elements and flags inline overrides."""
        css_definitions = self._get_css_rules() # Extract dictionary of classes/styles
        
        print("\n" + "="*60)
        print(" CSS CASCADE & CONFLICT MAP")
        print("="*60)

        with open(self.abs_path_live +'/' + 'index.html', 'r') as f:
            for i, line in enumerate(f, 1):
                # Find elements with classes
                match = re.search(r'<(\w+).*class=["\'](.*?)["\'].*?>', line)
                if match:
                    tag, classes = match.groups()
                    print(f"L{i}: <{tag} class='{classes}'>")
                    
                    for cls in classes.split():
                        # Check if this class exists in style.css
                        lookup_key = f".{cls}"
                        if lookup_key in css_definitions:
                            print(f"  ├── [CSS] {lookup_key}: {css_definitions[lookup_key]}")
                        else:
                            print(f"  ├── [!] MISSING: No definition for '.{lookup_key}' found in style.css")
                    
                    # Check for inline 'style=' overrides (The Conflict)
                    inline = re.search(r'style=["\'](.*?)["\']', line)
                    if inline:
                        print(f"  └── [CONFLICT] Inline Style found: {inline.group(1)}")
                        print(f"      (This will override style.css definitions!)")
        print("="*60)
    
    def _get_css_rules(self):
        """Parses style.css into a dictionary of {selector: rules}."""
        css_path = os.path.join(self.abs_path_live, 'style.css')
        rules = {}
        
        if not os.path.exists(css_path):
            print(f"Error: {css_path} not found.")
            return rules

        try:
            with open(css_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Regex to find: .selector { properties }
                # Matches class names, IDs, and standard tags
                matches = re.findall(r'([.#\w-]+)\s*\{([^}]*)\}', content)
                for selector, props in matches:
                    rules[selector.strip()] = props.strip().replace('\n', ' ')
        except Exception as e:
            print(f"Error parsing CSS: {e}")
            
        return rules
    
    @prepend_name
    def scan_project(self):
        self.scan_project_logic()
        self.show_visual_analysis()
        self.map_css_cascade()
        self.print_ascii_tree(self.abs_path_live)
    
    def _parse_style_css(self, show=False):
        abs_path_style = os.path.join(self.abs_path_live, 'style.css')
        with open(abs_path_style, 'r') as f:
            file_lines = f.readlines()
        
        report = {}
        cls_properties = {}
        cls_name = ''
        
        for line in file_lines:
            line = line.strip()
            
            if (('.' in line) or ('#' in line)):
                # Store the old thing
                if min(len(cls_name), len(list(cls_properties.keys()))) > 0:
                    report[cls_name] = copy.deepcopy(cls_properties)
                
                # Wipe the old thing
                cls_name, cls_properties = '', {}
                
                # Setup the new thing
                if ((' ' in line) or ('.' in line) or ('#' in line)):
                    cls_name = (line.split(' ')[0]).strip('.#')
                
            sub_lines = line.split(';')
            for sub_line in sub_lines:
                print(f'....sub_line: {sub_line}')
                if (':' in sub_line):
                    try:
                        property_key, property_val = sub_line.split(':')
                    except ValueError as e:
                        print(f'....{e}')
                    property_key, property_val = property_key.strip(), property_val.strip()
                    cls_properties[property_key] = property_val
        if show:
            for cls_name in report:
                print(f'css class {cls_name}')
                for prop in report[cls_name]:
                    print(f'..... {prop}:{report[cls_name][prop]}')
            
        return report
    
    @prepend_name
    def style_css_z_report(self):
        
        # Assemble the data structure
        z_lvl_membership = {}
        cp = self._parse_style_css()
        for cls_name in cp:
            z_key = 'z-index'
            if z_key in cp[cls_name]:
                z_lvl = cp[cls_name][z_key]
                if z_lvl in z_lvl_membership:
                    z_lvl_membership[z_lvl] += [cls_name]
                else:
                    z_lvl_membership[z_lvl] = [cls_name]
        
        z_lvl_membership = sort_dict(z_lvl_membership)
        
        # Give the report
        for z_lvl in z_lvl_membership:
            print(f'z_lvl: {z_lvl}')
            members = z_lvl_membership[z_lvl]
            for i in range(len(members)):
                dir_symb = '├── '
                if i==len(members)-1:
                    dir_symb = '└── '
                print(f'{dir_symb}{members[i]}')
        
        return z_lvl_membership
    

        
if __name__=='__main__':
    
    # Instantiate an Analyzer
    A = Analyzer()
    
    # Analyzers ACTIONS
    
    # ------- Safe: no modifications to files ------- 
    #A.check_abs_paths()
    #A.generate_tree_report()
    #A.get_analysis_data()
    #A. generate_bug_report()
    #A._parse_style_css(show=True)
    A.style_css_z_report()
    #A.scan_project()
    
    # ------- Wary ----------------------------------
    #
    #    live mod  : minimal
    #    file gen  : branch new folder, brand new copies
    #
    
    
    
    
    # ------- CAREFUL --------------------------------
    #
    #    live mod  : totally overwritten
    #    file gen  : ---
    #
    
    

    
    
    pass


