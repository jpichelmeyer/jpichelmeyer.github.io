#  v002/helpers/editor.py
from archivalist import Archivalist


import sys
import os
import shutil
import re
from datetime import datetime


class Editor():
    
    def __init__(self):
        pass
    
    
    
    
    def quick_edit_all(self):

        with open('your_file.css', 'r') as f:
            lines = f.read().splitlines()
