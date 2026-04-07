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
        for i in range(len(lines)):
            counter += 1
            if lines_max > -1 and counter > lines_max:
                break
            line = lines[i].strip()
            if len(line) > 0:
                lines_cleaned.append(line)
        return lines_cleaned
    
    def _parse_head(self, line:str=""):
        start = False
        end = False
        parsed_out = ""
        for i in range(len(line)):
            c = copy.deepcopy(line[i])
            if c == ">":
                start = True
            elif c == "<" and start:
                end = True
            elif start:
                parsed_out += c
            
            if end:
                break
        
        return parsed_out
            
    
    def _parse_lines(self, lines:list=[]):
        
        data = {}
        course_name = "Untitled Course"
        current_unit = None
        current_beat = None

        def clean(text):
            return self._parse_head(text)

        for line in lines:
            raw_line = line.rstrip()
            clean_line = raw_line.strip()

            # 1. Set the Course (The main key)
            if 'class="course-header"' in clean_line:
                course_name = clean(clean_line)
                if course_name not in data:
                    data[course_name] = {}

            # 2. Add Unit to the Course
            elif 'class="unit-header"' in clean_line:
                current_unit = clean(clean_line)
                data[course_name][current_unit] = {}
                current_beat = None # Reset beat context

            # 3. Add Beat to the Unit
            elif 'class="beat-header"' in clean_line:
                current_beat = clean(clean_line)
                if current_unit:
                    data[course_name][current_unit][current_beat] = []

            # 4. Append Content to the Beat
            else:
                # Filters out comments and empty lines
                if current_unit and current_beat:
                    if clean_line and not clean_line.startswith("<!--"):
                        data[course_name][current_unit][current_beat].append(raw_line)
        
        for course in data:
            print(course)
            new_dict = data[course]
            for unit in new_dict:
                print("\t" + unit)
                beats = new_dict[unit]
                for beat in beats:
                    print("\t\t" + beat)
                    for beat_line in beats[beat]:
                        print("\t\t\t" + beat_line)
        
        return data
    
    def _read_file(self):
        with open(self.path, "r", encoding="utf-8") as file:
            lines = file.readlines()
        return lines
    
    def convert(self):
        lines = self._read_file()
        lines = self._clean_lines(lines=lines, lines_max=-1)
        data = self._parse_lines(lines=lines)
        
        #print(f"len(lines) : {len(lines)}")
    
    
if __name__ == "__main__":
    print('__name__ == "__main__" syntax working')
    converter = H2Hconverter()
    converter.convert()
    
