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
import json
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
        self.path_json = "courses.json"
        self.path = "courses_.html"
        self.path_temp = "courses_.txt"
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
    
    def _correct_mathjax(self, line:str=""):
        

        parts = line.split(' ')
        for i in range(len(parts)):
            part = parts[i]
            
            part = part.replace("\\(", r"\(")
            part = part.replace("\\)", r"\)")
            part = part.replace("\\cdots", r"\cdots")
            part = part.replace("\\cdot", r"\cdot")
            part = part.replace("\\textbf", r"\textbf")
            
            parts[i] = part
        
        line = " ".join(parts)
        
        #line = line.replace('\(', r'\\(')
        #line = line.replace('\)', r'\\)')
        #line = line.replace('\cdots', r'\\cdots')
        #line = line.replace('\cdot', r'\\cdot')
        #line = line.replace('\textbf', r'\\textbf')
        return line
    
    def _is_line_clear(self, line:str=""):
        filter_segments = [
            '<div class="img-placeholder">',
            '<div class="quiz-placeholder">',
            '====',
            ]
        #line_clear = True
        for fs in filter_segments:
            if fs in line:
                #line_clear = False
                return False
        return True
    
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
                    else:
                        beat_string += '\t'*6 + '"type" : "text_only",\n'
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
                        """
                        
                        line_clear = self._is_line_clear(line=line)
                        
                        # Replace \n (chars?) with '\n' or something
                        #line = self._correct_mathjax(line.replace('\n', repr('\n')))
                        line = line.replace('\n', r'\n')
                        
                        #if line_clear:
                        if line_clear:
                            beat_line += copy.deepcopy(line)
                        
                    beat_line += '"\n'
                    #beat_string += self._correct_mathjax(copy.deepcopy(beat_line))
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
            
            course_strings[course] = self._correct_mathjax(copy.deepcopy(course_string))
        
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
        
        data = copy.deepcopy({})
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
                current_unit = None
                current_beat = None

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
    
    #def _save_to_json(self, single_strings:dict={}):
    def _save_to_json(self, data:dict={}):
        
        new_json_dict = {}
        
        for course in data:
            
            course_lessons_list = []
            course_data = data[course]
            
            course_split = course.split(" ")
            course_key = course_split[0].lower() + course_split[1]
            
            new_json_dict[course_key] = {}
            new_json_dict[course_key]["lessons"] = copy.deepcopy(course_lessons_list)
            
            print()
            print(course)
            
            for unit in course_data:
                unit_data = course_data[unit]
                unit_dict = {}
                unit_dict["id"] = copy.deepcopy(unit).lower().replace(' ', "_")
                unit_dict["title"] = copy.deepcopy(unit)
                unit_dict["beats"] = []
                
                for beat in unit_data:
                    beat_dict = {}
                    beat_lines = unit_data[beat]
                    #print(beat_lines)
                    beat_type, parsed_content = self._parse_beat_type(beat_lines=beat_lines)
                    
                    # Common to all types
                    beat_dict["label"] = copy.deepcopy(beat)
                    beat_dict["type"] = copy.deepcopy(beat_type)
                    
                    # Handle based on type
                    if beat_type == self.beat_types[1]:
                        beat_dict["visual"] = parsed_content
                    elif beat_type == self.beat_types[2]:
                        
                        # Use split directly on the string; deepcopy is usually overkill for strings
                        quiz_parts = parsed_content.split(",,")
                        
                        for i in range(len(quiz_parts)):
                            # Split and take the second part (after the ": ")
                            if ": " in quiz_parts[i]:
                                quiz_parts[i] = quiz_parts[i].split(": ", 1)[1]
                            
                            quiz_parts[i] = quiz_parts[i].strip().replace('"', '')
                            
                            # This reduces literal backslashes. 
                            # If you see 4 in the JSON, Python has 2. This turns 2 into 1.
                            quiz_parts[i] = quiz_parts[i].replace("\\\\", "\\")
                                            
                        """
                        quiz_parts = copy.deepcopy(parsed_content).split(",,")
                        for i in range(len(quiz_parts)):
                            quiz_parts[i] = rf"{quiz_parts[i]}"
                            quiz_parts[i] = quiz_parts[i].split(": ")[1]
                            quiz_parts[i] = quiz_parts[i].strip()
                            quiz_parts[i] = quiz_parts[i].replace('\"', '')
                            
                            quiz_parts[i] = quiz_parts[i].replace("\\\\", "\\")
                            #quiz_parts[i] = quiz_parts[i].replace("\\\\", "\\")
                            
                            
                            #quiz_parts[i] = quiz_parts[i].replace(r'\(', r'(')
                            #quiz_parts[i] = quiz_parts[i].replace(r'\)', r')')
                            
                            
                            #quiz_parts[i] = quiz_parts[i].replace(r'\\\\(', r'\(')
                            #quiz_parts[i] = quiz_parts[i].replace(r'\\\(', r'\(')
                            #quiz_parts[i] = quiz_parts[i].replace(r"\(", r"(")
                            #quiz_parts[i] = quiz_parts[i].strip().replace('\"', '').replace(r"\(", r"(")
                        """
                        
                        beat_dict["question"] = quiz_parts[0]
                        beat_dict["choices"] = quiz_parts[1]
                        beat_dict["correct"] = quiz_parts[2]

                    # Common to all types
                    beat_dict["text"] = ""
                    for line in beat_lines:
                        if self._is_line_clear(line=line):
                            beat_dict["text"] += copy.deepcopy(self._correct_mathjax(line.replace('"', "'")))
                    
                    unit_dict["beats"].append(copy.deepcopy(beat_dict))
                    
                course_lessons_list.append(copy.deepcopy(unit_dict))
                
            
            new_json_dict[course_key]["lessons"] = copy.deepcopy(course_lessons_list)
            
            print(course_lessons_list)
            
        # 1. Load data from a file
        with open(self.path_json, 'r') as file:
            data_json = json.load(file)

        # 2. Modify specific values
        # Direct assignment for a top-level key
        #data['status'] = 'updated'
        
        for course_key in new_json_dict:
            
            if course_key not in data_json:
                data_json[course_key] = {}
                data_json[course_key]["lessons"] = []
            data_json[course_key]["lessons"] = copy.deepcopy(new_json_dict[course_key]["lessons"])

        # Using the update() method for multiple changes
        #data.update({"last_accessed": "2024-05-20"})

        # 3. Save the modified dictionary back to the file
        with open(self.path_json, 'w') as file:
            json.dump(data_json, file, indent=4)
        
        """
        print("JSON check")
        for key in data:
            print()
            print(key)
            
        for course in data:
            course_split = course.split(" ")
            course_key = course_split[0].lower() + course_split[1]
            print(course_key)
            print(data[course])
        
            course_lessons = []
            for unit in data[course]:
                unit_dict = {}
                unit_dict["id"] = copy.deepcopy(unit).lower().replace(' ', '_')
                unit_dict["title"] = copy.deepcopy(unit)
                beats = []
                for beat in data[course][unit]:
                    beat_dict = {}
                    beat_data = data[course][unit][beat]
                    beat_dict["data"] = copy.deepcopy(beat_data)
                    beat_dict["label"] = "..."
                    beat_dict["type"] = "..."
                    beat_dict["text"] = "..."
                    beats.append(copy.deepcopy(beat_dict))
                unit_dict["beats"] = copy.deepcopy(beats)
                course_lessons.append(copy.deepcopy(unit_dict))
            
            # 1. Load data from a file
            with open(self.path_json, 'r') as file:
                data_json = json.load(file)

            # 2. Modify specific values
            # Direct assignment for a top-level key
            #data['status'] = 'updated'

            # Accessing and modifying a nested key
            if course_key not in data_json:
                data_json[course_key] = {}
                data_json[course_key]["lessons"] = []
            data_json[course_key]["lessons"] = copy.deepcopy(course_lessons)

            # Using the update() method for multiple changes
            #data.update({"last_accessed": "2024-05-20"})

            # 3. Save the modified dictionary back to the file
            with open(self.path_json, 'w') as file:
                json.dump(data_json, file, indent=4)
        """
        
        return
        
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
        self._save_to_json(data=data)
        print("Successful injection into json?")
    
    
if __name__ == "__main__":
    print('__name__ == "__main__" syntax working')
    converter = H2Hconverter()
    converter.convert()
    

