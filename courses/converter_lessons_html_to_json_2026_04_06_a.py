"""
The purpose of this program is to convert lessons in HTML format
in the lessons_pre_json.html file that are optimized for readability
for myself as I write them, to condensed format HTML that can
be stored in the courses.json file.

EXAMPLE: Readable HTML
    
    <div class="beat-header">Overview</div>
    
    
    
    <p>
    In this unit, we will:
    </p>

    <ol>
        <li>Discuss what an algorithm is.</li>
        <li>Look at two ways to represent them:</li>
        <ol>
            <li>Pseudocode</li>
            <li>Flow diagrams</li>
        </ol>
        <li>Look at an important historical development in computer science regarding algorithms: The Turing Machine</li>
    </ol>


EXAMPLE: Condensed HTML

    <h2>Overview</h2><p>In this unit, we will:</p><ol><li>Discuss what an algorithm is.</li><li>Look at two ways to represent them:</li><ol><li>Pseudocode</li><li>Flow diagrams</li></ol><li>Look at an important historical development in computer science regarding algorithms: The Turing Machine</li></ol>



"""
import copy
import os

"""
def read_file(path:str="lessons_pre_json.html"):
    with open(path, "r", encoding="utf-8") as file:
        lines = file.readlines()
    return lines

lines = read_file()

for i in range(min(10, len(lines))):
    lc = copy.deepcopy(lines[i])
    lc = lc.strip()
    print(lc)
"""

class H2Hconverter():
    
    def __init__(self):
        self.path = "lessons_pre_json.html"
        pass
    
    def _clean_lines(self, lines:list=[], lines_max:int=-1):
        lines_cleaned = []
        counter = -1
        
        #lessons_all = []
        #lessons_by_course = []
        #lessons_by_unit = []
        #lessons_by_beat = []
        
        
        """
        for i in range(len(lines)):
            
            counter += 1
            if lines_max > -1:
                if counter > lines_max:
                    break
            
            line = lines[i].rstrip()
            ws_l = len(line) - len(line.lstrip(' '))
            line = line.lstrip()
            #print(line)
            
            if '<div class="course-header">' in line:
                print("Course found!")
                
            
            elif '<div class="unit-header">' in line:
                print("Unit found!")
                
            
            elif '<div class="beat-header">' in line:
                print("Beat found!")
                
                
            
        for course in lessons_all:
            print("\n\n\n")
            print("COURSE")
            for unit in course:
                print("\tUNIT")
                for beat in unit:
                    print("\t\tbeat")
            
            
            
            line_exposed = copy.deepcopy(lines[i])
            print(1, line_exposed)
            
            line_exposed = line_exposed.rstrip()
            print(2, line_exposed)
            
            whitespace_l = len(line_exposed) - len(line_exposed.lstrip(' '))
            tabs_l = len(line_exposed) - len(line_exposed.lstrip("\t"))
            print(3, line_exposed, " : whitespace_l : ", whitespace_l, " : tabs_l : ", tabs_l)
            
            #line_exposed = repr(line_exposed)
            #print(4, line_exposed)
            
            print(5,"-----------------------------")
        """
            
        return lines_cleaned
    
    def _read_file(self):
        with open(self.path, "r", encoding="utf-8") as file:
            lines = file.readlines()
        return lines
    
    def convert(self):
        lines = self._read_file()
        self._clean_lines(lines=lines, lines_max=-1)
    
    
if __name__ == "__main__":
    print('__name__ == "__main__" syntax working')
    converter = H2Hconverter()
    converter.convert()
    
