"""
INJECTS
    python dictionary converted fromm courses_.html directly into
    courses.json

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


EXAMPLE: Condensed HTML (injected directly into courses.json dictionary)

    <h2>Overview</h2><p>In this unit, we will:</p><ol><li>Discuss what an algorithm is.</li><li>Look at two ways to represent them:</li><ol><li>Pseudocode</li><li>Flow diagrams</li></ol><li>Look at an important historical development in computer science regarding algorithms: The Turing Machine</li></ol>



"""
import copy
import json
import os

class H2Hconverter():
    
    def __init__(self):
        self.path_json = "courses.json"
        self.path = "courses_.html"
        self.path_temp = "courses_.txt"
        self.beat_types = ["text_only", "image", "quiz"]
        self.filter_segments = [
            '<div class="img-placeholder">',
            '<div class="quiz-placeholder">',
            '<div class="ide-placeholder">',
            '====',
            ]
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
        
        return line
    
    def _is_line_clear(self, line:str=""):
        for fs in self.filter_segments:
            if fs in line:
                #line_clear = False
                return False
        return True
    
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
            elif '<div class="quiz-placeholder">' in line:
                parsed_content = self._parse_head(line)
                return self.beat_types[2], parsed_content
            
            # Type: ide
            elif '<div class="ide-placeholder">' in line:
                
                
                #{
                #    "type": "ide",
                #    "text": "Instruction text shown in the middle panel as usual.",
                #    "language": "csharp",          // "csharp" | "python" | "javascript"
                #    "starter_code": "class Program {\n  static void Main() {\n    Console.WriteLine(\"Hello!\");\n  }\n}",
                #    "instructions": "Optional short task prompt shown above the editor."
                #}
                                
                parsed_content = self._parse_head(line)
                return self.beat_types[2], parsed_content
            
            
        return self.beat_types[0], parsed_content
    
    def _read_file(self):
        with open(self.path, "r", encoding="utf-8") as file:
            lines = file.readlines()
        return lines
    
    def _save_to_json(self, data:dict={}):
        
        new_json_dict = {}
        
        for course in data:
            
            course_lessons_list = []
            course_data = data[course]
            
            course_split = course.split(" ")
            course_key = course_split[0].lower() + course_split[1]
            
            new_json_dict[course_key] = {}
            new_json_dict[course_key]["lessons"] = copy.deepcopy(course_lessons_list)
            
            for unit in course_data:
                unit_data = course_data[unit]
                unit_dict = {}
                unit_dict["id"] = copy.deepcopy(unit).lower().replace(' ', "_")
                unit_dict["title"] = copy.deepcopy(unit)
                unit_dict["beats"] = []
                
                for beat in unit_data:
                    beat_dict = {}
                    beat_lines = unit_data[beat]
                    beat_type, parsed_content = self._parse_beat_type(beat_lines=beat_lines)
                    
                    # Common to all types
                    beat_dict["label"] = copy.deepcopy(beat)
                    beat_dict["type"] = copy.deepcopy(beat_type)
                    
                    # Handle based on type
                    
                    # ==============================================
                    # image
                    # ==============================================
                    if beat_type == self.beat_types[1]:
                        beat_dict["visual"] = parsed_content
                    
                    
                    # ==============================================
                    # quiz
                    # ==============================================
                    elif beat_type == self.beat_types[2]:
                        
                        quiz_parts = parsed_content.split(",,")
                        print("quiz_parts[0]: ", quiz_parts[0])
                        print("quiz_parts[1]: ", quiz_parts[1])
                        print("quiz_parts[2]: ", quiz_parts[2])
                        
                        for i in range(len(quiz_parts)):
                            
                            # Split and take the second part (after the ": ")
                            if ": " in quiz_parts[i]:
                                quiz_parts[i] = quiz_parts[i].split(": ", 1)[1]
                            
                            quiz_parts[i] = quiz_parts[i].strip().replace('"', '')
                            
                        beat_dict["question"] = quiz_parts[0]
                        
                        
                        quiz_parts_1 = copy.deepcopy(quiz_parts[1].replace("[", ""))
                        quiz_parts_1 = quiz_parts_1.replace("]", "")
                        #quiz_parts_1 = quiz_parts_1.replace(",", "")
                        quiz_parts_1 = quiz_parts_1.split(",")
                        beat_dict["choices"] = []
                        choices = []
                        for quiz_part_1 in quiz_parts_1:
                            choice = str(quiz_part_1)
                            choice = choice.replace("]", "")
                            choice = choice.replace("[", "")
                            choice = choice.replace(" ", "")
                            choice = choice.rstrip()
                            #print("choice : ", choice)
                            choices.append(choice)
                        #print("choices: ", choices)
                        #print("len(choices) : ", len(choices))
                        beat_dict["choices"] = copy.deepcopy(choices)
                        quiz_parts_2 = quiz_parts[2].replace('correct:', '')
                        quiz_parts_2 = quiz_parts_2.replace(',', '')
                        #print(quiz_parts_2)
                        beat_dict["correct"] = int(quiz_parts_2)
                    
                    # ==============================================
                    # ide
                    # ==============================================
                    elif 1 > 0:
                        
                        #{
                        #    "type": "ide",
                        #    "text": "Instruction text shown in the middle panel as usual.",
                        #    "language": "csharp",          // "csharp" | "python" | "javascript"
                        #    "starter_code": "class Program {\n  static void Main() {\n    Console.WriteLine(\"Hello!\");\n  }\n}",
                        #    "instructions": "Optional short task prompt shown above the editor."
                        #}
                        
                        
                                
                                
                        pass
                    
                    # Common to all types
                    beat_dict["text"] = ""
                    beat_dict["text"] += '<h2>' + beat_dict["label"] + '</h2>'
                    for line in beat_lines:
                        if '<div class="beat-header">' in line:
                            beat_dict["text"] += '<h2>' + self._parse_head(line) + '</h2>'
                        if self._is_line_clear(line=line):
                            beat_dict["text"] += copy.deepcopy(self._correct_mathjax(line.replace('"', "'")))
                    
                    unit_dict["beats"].append(copy.deepcopy(beat_dict))
                    
                course_lessons_list.append(copy.deepcopy(unit_dict))
                
            
            new_json_dict[course_key]["lessons"] = copy.deepcopy(course_lessons_list)
            
            #print(course_lessons_list)
            
        with open(self.path_json, 'r') as file:
            data_json = json.load(file)
        
        for course_key in new_json_dict:
            
            if course_key not in data_json:
                data_json[course_key] = {}
                data_json[course_key]["lessons"] = []
            data_json[course_key]["lessons"] = copy.deepcopy(new_json_dict[course_key]["lessons"])

        with open(self.path_json, 'w') as file:
            json.dump(data_json, file, indent=4)
        
        return
    
    def convert(self):
        lines = self._read_file()
        lines = self._clean_lines(lines=lines, lines_max=-1)
        data = self._parse_lines(lines=lines)
        self._save_to_json(data=data)
        
    
if __name__ == "__main__":
    #print('__name__ == "__main__" syntax working')
    converter = H2Hconverter()
    converter.convert()
    

