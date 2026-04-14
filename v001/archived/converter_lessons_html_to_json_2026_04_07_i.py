"""
The purpose of this program is to convert Pseudocode of a particular form
into a logic flow diagram (SVG).
"""
import copy
import os




class PseudoFlow():
    
    def __init__(self, cell_width:int=200, cell_height:int=120):
        
        # Canvas properties
        self.cell_width = cell_width
        self.cell_height = cell_height
        
        # Component properties
        self.cell_box = '<rect class="grid-box" x="10" y="10" width="180" height="100" rx="5" ry="5" fill="none" stroke-width="2" stroke-dasharray="10" transform="translate(0,0)"/>'
        
    
    def _add_background(self, svg_string:str=""):
        svg_string_local = copy.deepcopy(svg_string)
        
        
        return svg_string_local
    
    def _add_cell_guides(self, svg_string:str="", i_max:int=6, j_max:int=3):
        svg_string_local = ""
        
        for i in range(i_max):
            for j in range(j_max):
                svg_string_local += copy.deepcopy(self.cell_box).replace('transform="translate(0,0)"', 'transform="translate(' + str(200*i) + "," + str(120*j) + '0)"')
                svg_string_local += '\n'
                
                #print()
                #print("Print checkin on nested loop")
                #print(svg_string_local)
        
        return svg_string_local
    
    def _add_head_and_foot(self, svg_string:str=""):
        svg_string_local = copy.deepcopy(svg_string)
        svg_string_local = '<svg width="600" height="800" viewBox="0 0 600 800">\n' + svg_string + '</svg>'
        return svg_string_local
    
    def _get_abs_path_to_this_script_dir(self, path:str=""):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        absolute_path = os.path.join(script_dir, path)
        return absolute_path
    
    def _save_local(self, svg_string:str="", path:str="logic_flow_diagram.svg"):
        absolute_path = self._get_abs_path_to_this_script_dir(path=path)
        with open(absolute_path, "w", encoding="utf-8") as f:
            f.writelines(svg_string)
        return
    
    def generate(self, pseudocode:str="", save:"bool"=False):
        
        if len(pseudocode) <= 0:
            return None
        
        print("===============================================")
        print("String contents of a relatively siple pseudocode...")
        print(pseudocode)
        print()
        
        print("===============================================")
        print("	processing...")
        
        # Initialize svg string
        svg_string = ""
        
        # Add the background color
        svg_string = self._add_background(svg_string=svg_string)
        
        # Add the guide boxes
        svg_string = self._add_cell_guides(i_max=4, j_max=2)
        
        # Add the head and foot <svg ... > </svg>
        svg_string = self._add_head_and_foot(svg_string=svg_string)
        
        print("===============================================")
        print("	svg_string : ")
        print(svg_string)
        
        if save:
            self._save_local(svg_string=svg_string)
    
        return svg_string
        
        
            
    
    
if __name__ == "__main__":
    pseudoflow = PseudoFlow()
    pseudocode = "Input: a collection A of numbers a1, a2, a3, ..., an\nOutpt: a number ai from the collection such that aj is less than or equal to ai for all j=1,2,...,n\n\nFIND-MAXIMUM(A)\n1  max <-- A[1]\n2  FOR i from 2 to A.length\n3      IF A[i] > max THEN\n4          max <-- A[i]\n5      END IF\n6  END FOR\n7  RETURN  max"
    svg_string = pseudoflow.generate(pseudocode=pseudocode, save=True)
    
