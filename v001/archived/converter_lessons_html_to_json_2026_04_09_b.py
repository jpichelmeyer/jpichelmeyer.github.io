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
        self.path = "courses_.html"
        self.path_temp = "courses__.txt"
        self.beat_types = ["text_only", "image", "quiz"]
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
    
    def _make_strings(self, data:dict={}):
        course_strings = {}
        
        for course in data:
            course_string = '\t'*2 + '"lessons" : [\n' 
            course_dict = data[course]
            unit_keys = list(course_dict.keys())
            for j in range(len(unit_keys)):
                unit_name = unit_keys[j]
                unit_string = '\t'*3 + '{\n'
                unit_string += '\t'*4 + '"id" : ' + '"' + copy.deepcopy(unit_name.lower().replace(' ', "_")) + '"' + ',\n'
                unit_string += '\t'*4 + '"title" : ' + '"' + copy.deepcopy(unit_name) + '"' + ',\n'
                unit_string += '\t'*4 + '"beats" : [\n'
                unit_dict = course_dict[unit_name]
                beat_keys = list(unit_dict.keys())
                for i in range(len(beat_keys)):
                    beat_name = beat_keys[i]
                    beat_lines = unit_dict[beat_name]
                    beat_string = '\t'*5 + '{\n'
                    label = copy.deepcopy(beat_name).split(' ')[0]
                    beat_string += '\t'*6 + '"label" : ' + '"' + label + '"' + ',\n'
                    
                    
                    #################################################
                    #
                    #	Set type
                    #
                    #################################################
                    #beat_type = ""
                    
                    #for line in beat_lines:
                        
                        
                        
                        # Parse out image type
                        #if '<div class="img-placeholder">' in line:
                            #beat_string += '\t'*6 + '"visual" : "' + self._parse_head(line) + '",\n' 
                            #beat_string += '\t'*6 + '"type" : "image",\n'
                    
                    
                    #beat_string += self._parse_type(beat_lines=beat_lines)
                        
                    beat_type, parsed_content = self._parse_beat_type(beat_lines=beat_lines)
                    if beat_type == self.beat_types[1]:
                        beat_string += '\t'*6 + '"type" : "image",\n'
                        beat_string += '\t'*6 + '"visual" : "' + parsed_content + '",\n' 
                    elif beat_type == self.beat_types[2]:
                        beat_string += '\t'*6 + '"type" : "quiz",\n'
                        parsed_content = parsed_content.split(",,")
                        for pc in parsed_content:
                            beat_string += '\t'*6 + pc.lstrip() + ',\n'
                        #beat_string += copy.deepcopy(parsed_content)
    
                    
                    ################################################
                    
                    
                    beat_string += '\t'*6 + '"text"' + ' : '
                    beat_line = '"' + '<h2>' + beat_name + '</h2>'
                    for line in beat_lines:
                        """
                        Filter out
                            <div class="img-placeholder"
                            ========
                            
                        """
                        filter_segments = [
                            '<div class="img-placeholder">',
                            '<div class="quiz-placeholder">',
                            '====',
                            ]
                        line_clear = True
                        for fs in filter_segments:
                            if fs in line:
                                line_clear = False
                                break
                        
                        # Replace \n (chars?) with '\n' or something
                        line = line.replace('\n', repr('\n'))
                        
                        if line_clear:
                            beat_line += copy.deepcopy(line)
                        
                    beat_line += '"\n'
                    beat_string += copy.deepcopy(beat_line)
                    beat_string += '\t'*5 + '}'
                    if i < len(beat_keys) -1:
                        beat_string += ','
                    beat_string += '\n'
                    unit_string += copy.deepcopy(beat_string)
                unit_string += '\t'*4 + ']\n'
                unit_string += '\t'*3 + '}'
                if j < len(unit_keys) -1:
                    unit_string += ','
                unit_string += '\n'
                
                course_string += copy.deepcopy(unit_string)
            course_string += '\t'*2 + ']\n'
            
            course_strings[course] = copy.deepcopy(course_string)
        
        for course in course_strings:
            print()
            print(course)
            print(course_strings[course])
                
        
        return course_strings
    
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
            
            # 3.5. Filter out / process <div class="image-placeholder">
            #elif '<div class="image-placeholder">' in clean_line:
            #    data[course_name][current_unit][current_beat]
            
            # 4. Append Content to the Beat
            else:
                # Filters out comments and empty lines
                if current_unit and current_beat:
                    if clean_line and not clean_line.startswith("<!--"):
                        data[course_name][current_unit][current_beat].append(raw_line)
        
        if False:
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
    
    """
    def _parse_type(self, beat_lines:list=[]):
        type_line = ""
        
        beat_types = ["text_only", "image", "quiz"]
        beat_type = ""
        parsed_text = ""
        
        for line in beat_lines:
            
            # Type: image
            # 
            if '<div class="img-placeholder">' in line:
                beat_type = beat_types[1]
                parsed_text = self._parse_head(line)
                
                #type_line += '\t'*6 + '"visual" : "' + self._parse_head(line) + '",\n' 
                #type_line += '\t'*6 + '"type" : "image",\n'
            
            # Type: quiz
            if '<div class="quiz-placeholder">' in line:
                beat_type = beat_types[2]
                parsed_text_lines = self._parse_head(line).split(",,")
                print(parsed_text_lines)
                for subline in parsed_text_lines:
                    parsed_text += '\t'*6 + copy.deepcopy(subline) + ',\n"'
        
        if beat_type == beat_types[1]:
            type_line += '\t'*6 + '"type" : "image",\n'
            type_line += '\t'*6 + '"visual" : "' + parsed_text + '",\n' 
        elif beat_type == beat_types[2]:
            type_line += '\t'*6 + '"type" : "quiz",\n'
            type_line += copy.deepcopy(parsed_text)
            #type_line += '\t'*6 + parsed_text
        else:
            type_line += '\t'*6 + '"type" : "text_only",\n'
        
        return type_line 
    """
    
    def _parse_beat_type(self, beat_lines:list=[]):
        parsed_content = ""
        for line in beat_lines:
            # Type: image
            if '<div class="img-placeholder">' in line:
                parsed_content = self._parse_head(line)
                return self.beat_types[1], parsed_content
            # Type: quiz
            if '<div class="quiz-placeholder">' in line:
                parsed_content = self._parse_head(line)
                return self.beat_types[2], parsed_content
        return self.beat_types[0], parsed_content
        
        
    
    def _read_file(self):
        with open(self.path, "r", encoding="utf-8") as file:
            lines = file.readlines()
        return lines
    
    def _save_strings(self, single_strings:dict={}):
        with open(self.path_temp, "w", encoding="utf-8") as file:
            for course in single_strings:
                file.writelines('"' + course.lower().replace(' ', "_") + '_lessons : "\n')
                file.writelines(single_strings[course])
    
    def convert(self):
        lines = self._read_file()
        lines = self._clean_lines(lines=lines, lines_max=-1)
        data = self._parse_lines(lines=lines)
        single_strings = self._make_strings(data=data)
        self._save_strings(single_strings=single_strings)
    
    
if __name__ == "__main__":
    print('__name__ == "__main__" syntax working')
    converter = H2Hconverter()
    converter.convert()
    

