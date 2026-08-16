#!/usr/bin/env python3
"""
brightspace_grade_csv_builder.py
=================================

Companion to brightspace_grade_cheatsheet.py. Where that script tells you
what to *type* into the Grades Setup Wizard, this one builds the CSV file
itself -- in the same column-header format Brightspace produces when you
export grades (e.g. "MQ1 Points Grade <Numeric MaxPoints:2 Weight:10
Category:Microquiz CategoryWeight:5>") -- so you can re-import it, or just
use it as a ready-made template.

A course's `assess` list only records each assessment TYPE's total weight
(e.g. "quiz": 20%) -- it doesn't know how many individual quizzes there
will actually be, or how many points each is worth. So for every category,
this script asks you two things:

    * number of items
    * points per item (MaxPoints)

and then splits that category's weight evenly across however many items
you said there are. A category with one assessment in the JSON (like a
single "Presentation" entry) works the same as one with several grouped
under the same 'type' -- either way, you're just telling it how many
graded items to generate and it divides the weight evenly.

The output CSV has just the header row (all the item/category columns
Brightspace expects) plus one dummy student row ("#placeholder") with
zeroed-out numerators, so you have a valid, importable skeleton.

Standard library only. Run it directly:

    python3 brightspace_grade_csv_builder.py

or from Thonny -- either way, if you don't pass a course on the command
line, it'll ask you to pick one interactively, exactly like
brightspace_grade_cheatsheet.py does.

    python3 brightspace_grade_csv_builder.py mth1220
    python3 brightspace_grade_csv_builder.py courses/mth1220.json
"""

import csv
import glob
import json
import os
import sys

# ---------------------------------------------------------------------------
# Small input helpers (same style as brightspace_grade_cheatsheet.py)
# ---------------------------------------------------------------------------

def ask_choice(prompt, options):
    while True:
        print(prompt)
        for i, opt in enumerate(options, start=1):
            print(f"  {i}. {opt}")
        raw = input("> ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return options[int(raw) - 1]
        print("Please enter a number from the list above.\n")


def ask_positive_int(prompt):
    while True:
        raw = input(prompt).strip()
        if raw.isdigit() and int(raw) > 0:
            return int(raw)
        print("Please enter a whole number greater than 0.")


def ask_positive_number(prompt):
    while True:
        raw = input(prompt).strip()
        try:
            val = float(raw)
            if val > 0:
                return val
        except ValueError:
            pass
        print("Please enter a number greater than 0.")


# ---------------------------------------------------------------------------
# Locating the course + shared JSON (identical logic to the cheatsheet script)
# ---------------------------------------------------------------------------

def find_courses_dir():
    here = os.path.abspath('.')
    for _ in range(4):
        candidate = os.path.join(here, 'courses')
        if os.path.isdir(candidate):
            return candidate
        parent = os.path.dirname(here)
        if parent == here:
            break
        here = parent
    return None


def resolve_course_path(arg, courses_dir):
    if arg and os.path.isfile(arg):
        return arg
    if arg and courses_dir:
        candidate = os.path.join(courses_dir, f"{arg}.json")
        if os.path.isfile(candidate):
            return candidate
    return None


def pick_course_interactively(courses_dir):
    skip = {'shared.json', 'manifest.json'}
    candidates = sorted(
        os.path.basename(p) for p in glob.glob(os.path.join(courses_dir, '*.json'))
        if os.path.basename(p) not in skip
    )
    if not candidates:
        print(f"No course .json files found in {courses_dir}")
        sys.exit(1)

    labels = []
    for fname in candidates:
        key = fname[:-5]
        label = key
        try:
            with open(os.path.join(courses_dir, fname)) as f:
                data = json.load(f)
            pre, num = data.get('pre', ''), data.get('num', '')
            if pre or num:
                label = f"{key}  ({pre} {num})".strip()
        except Exception:
            pass
        labels.append(label)

    chosen = ask_choice("\nWhich course?", labels)
    key = chosen.split('(')[0].strip() if '(' in chosen else chosen
    return os.path.join(courses_dir, f"{key}.json")


# ---------------------------------------------------------------------------
# Category identification
#
# NOTE: unlike brightspace_grade_cheatsheet.py, this does NOT group entries
# by their shared 'type' field. Two assessments can share a 'type' (e.g. all
# three presentations are type "presentation") while still being distinct
# graded categories in Brightspace, each with its own weight -- grouping by
# type would incorrectly merge them into one category and split their
# combined weight evenly, losing the 10/20/30 split the JSON actually
# defines. So every entry in 'assess' becomes its own category here, using
# its own 'name' as the label and its own 'percentage' as the weight. Entries
# that really are meant to represent many individual instances (e.g. one
# "Quizzes" entry standing in for ten actual quizzes) still work exactly the
# same way as before -- they just get expanded into N items below.
# ---------------------------------------------------------------------------

def build_categories(assess_list):
    categories = []
    for a in assess_list:
        label = a.get('name', '(unnamed)')
        weight = float(a.get('percentage', 0))
        categories.append({'label': label, 'weight': weight})
    return categories


# ---------------------------------------------------------------------------
# Interactive collection: number of items + points per item, per category
# ---------------------------------------------------------------------------

def collect_item_specs(categories):
    """Asks the two questions per category and returns each category
    enriched with 'num_items', 'points_per_item', and 'item_weight'
    (the category's weight split evenly across its items)."""
    print("\nFor each category, enter how many graded items it should have,")
    print("and how many points each item is worth. The category's weight")
    print("will be split evenly across that many items.\n")

    for cat in categories:
        label = cat['label']
        print(f"-- {label}  (category weight: {cat['weight']:g}%)")
        cat['num_items'] = ask_positive_int(f"   Number of items in {label}: ")
        cat['points_per_item'] = ask_positive_number(f"   Points per {label} item: ")
        cat['item_weight'] = cat['weight'] / cat['num_items']
        print()

    return categories


# ---------------------------------------------------------------------------
# CSV construction
# ---------------------------------------------------------------------------

def build_header_and_row(categories):
    header = ["Username"]
    row = ["#placeholder"]

    total_weight = 0
    for cat in categories:
        label = cat['label']
        n = cat['num_items']
        pts = cat['points_per_item']
        item_weight = cat['item_weight']
        total_weight += cat['weight']

        for i in range(1, n + 1):
            item_name = label if n == 1 else f"{label} {i}"
            col = (
                f"{item_name} Points Grade "
                f"<Numeric MaxPoints:{pts:g} Weight:{item_weight:g} "
                f"Category:{label} CategoryWeight:{cat['weight']:g}>"
            )
            header.append(col)
            row.append("")  # blank grade cell for the dummy student

        header.append(f"{label} Subtotal Numerator")
        header.append(f"{label} Subtotal Denominator")
        row.append("0")
        row.append(f"{cat['weight']:g}")

    header += [
        "Calculated Final Grade Numerator",
        "Calculated Final Grade Denominator",
        "Adjusted Final Grade Numerator",
        "Adjusted Final Grade Denominator",
        "End-of-Line Indicator",
    ]
    row += ["0", f"{total_weight:g}", "", "", "#"]

    return header, row, total_weight


def write_csv(course_path, header, row):
    key = os.path.splitext(os.path.basename(course_path))[0]
    out_path = os.path.join(os.path.dirname(course_path), f"{key}_GradesImport_template.csv")
    with open(out_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerow(row)
    return out_path


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    courses_dir = find_courses_dir()
    arg = sys.argv[1] if len(sys.argv) > 1 else None

    course_path = resolve_course_path(arg, courses_dir)
    if not course_path:
        if not courses_dir:
            print("Couldn't find a courses/ folder nearby. Run this from inside")
            print("your site's root (or courses/ itself), or pass a direct path")
            print("to a course .json file as an argument.")
            sys.exit(1)
        course_path = pick_course_interactively(courses_dir)

    with open(course_path) as f:
        course_data = json.load(f)

    assess = course_data.get('assess', [])
    if not assess:
        print(f"{course_path} has no 'assess' list -- nothing to build.")
        sys.exit(1)

    title = f"{course_data.get('pre','')} {course_data.get('num','')}".strip()
    print(f"\nBuilding grade CSV template for {title or course_path}\n")

    categories = build_categories(assess)
    categories = collect_item_specs(categories)
    header, row, total_weight = build_header_and_row(categories)

    if abs(total_weight - 100) >= 0.01:
        diff = total_weight - 100
        direction = "OVER" if diff > 0 else "UNDER"
        print(f"Note: category weights total {total_weight:g}%  -- {direction} by {abs(diff):g}%")
        print("(the CSV will still be built, but fix the percentages in the")
        print(" course JSON if that wasn't intentional)\n")

    out_path = write_csv(course_path, header, row)
    print(f"Wrote: {out_path}")


if __name__ == '__main__':
    main()
