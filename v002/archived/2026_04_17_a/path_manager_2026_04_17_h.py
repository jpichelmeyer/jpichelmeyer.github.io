import os

def count_check(counter:int=0, count_max=100):
    return (counter > count_max), counter + 1

def list_files(
    rootdir:str='../',
    countMax:int=5,
    ignore_exts:list=[],
    ignore_dirs:list=[],
    ):
    counter = 0
    under_max = False
    for root, dirs, files in os.walk(rootdir):
        
        if True:
            level = root.replace(rootdir, '').count(os.sep)
            indent = ' ' * 4 * level
        
        
            if True:
                print(f'{counter}{indent}{os.path.basename(root)}/')
                subindent = ' ' * 4 * (level + 1)
                #for f in files:
                #    print(f"{subindent}{f}")
        
        under_max, counter = count_check(counter)


list_files('../')

