#!/usr/bin/env python3
"""
brightspace_grade_cheatsheet.py
=================================

Turns a course's `assess` list (from courses/[key].json, the same data
that drives the Assessments tab and percentage grid on the website)
into the exact sequence of Categories and Items -- with weights
already computed -- that you'd type into Brightspace's Grades Setup
Wizard. It doesn't touch Brightspace at all (there's no supported way
for an instructor to import a grade scheme programmatically -- see
note at the bottom); this just does the arithmetic and formatting so
the wizard becomes copy-typing instead of cross-referencing JSON by
hand.

Standard library only. Run it directly:

    python3 brightspace_grade_cheatsheet.py

or from Thonny (green Run button) -- either way, if you don't pass a
course on the command line, it'll ask you to pick one interactively.
You can also run it non-interactively:

    python3 brightspace_grade_cheatsheet.py mth1220
    python3 brightspace_grade_cheatsheet.py courses/mth1220.json

How the mapping works
----------------------
Each assessment in a course's JSON already carries a final-grade
percentage directly (e.g. "Exam 1" is 25% of the final grade), not a
percentage-within-its-category -- but Brightspace's weighted gradebook
wants a two-level structure: Categories (weighted against the final
grade) containing Items (weighted against each other, within 100% of
that category). So:

    category weight   = sum of the percentages of every assessment
                         sharing that 'type'
    item weight        = that assessment's percentage, rescaled so all
                         items in its category sum to 100%

A type with only one assessment just becomes a category with one item
worth 100% of it -- which is exactly what you'd want anyway.
"""

import glob
import json
import os
import sys

# ---------------------------------------------------------------------------
# Small input helpers (same style as the site's cellular_automata.py, for
# anyone who's seen that one -- numbered menu, validated free-text prompt).
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


# ---------------------------------------------------------------------------
# Locating the course + shared JSON
# ---------------------------------------------------------------------------

def find_courses_dir():
    """Look for a courses/ folder starting from the current directory and
    walking up a few levels, so this works whether you run it from the
    site root, from inside courses/, or from wherever Thonny happens to
    default to."""
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
    # A direct path to a .json file (relative or absolute).
    if arg and os.path.isfile(arg):
        return arg
    # A bare course key, e.g. "mth1220" -> courses/mth1220.json
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
# Terminal color swatches (best-effort only -- shared.json is optional here,
# and if it's missing/malformed we just skip the swatches, since none of the
# actual weight math depends on it).
# ---------------------------------------------------------------------------

def load_shared_colors(courses_dir):
    if not courses_dir:
        return {}
    path = os.path.join(courses_dir, 'shared.json')
    try:
        with open(path) as f:
            shared = json.load(f)
        return shared.get('assessments', {}).get('colors', {})
    except Exception as e:
        print(f"(note: couldn't read shared.json for color swatches -- {e})")
        return {}


def swatch(hexcolor):
    """A small ANSI true-color block, or '' if this terminal probably
    can't render one (Thonny's console typically can't, so this quietly
    no-ops there instead of printing garbage escape codes)."""
    if not hexcolor or not sys.stdout.isatty():
        return ''
    try:
        h = hexcolor.lstrip('#')
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return f"\x1b[48;2;{r};{g};{b}m  \x1b[0m "
    except Exception:
        return ''


# ---------------------------------------------------------------------------
# The actual category/item weight computation
# ---------------------------------------------------------------------------

def build_categories(assess_list):
    """Groups assessments by 'type' (in first-seen order), computes each
    category's weight (sum of its items' percentages) and each item's
    weight rescaled to sum to 100% within its category."""
    order = []
    by_type = {}
    for a in assess_list:
        t = a.get('type') or 'uncategorized'
        if t not in by_type:
            by_type[t] = []
            order.append(t)
        by_type[t].append(a)

    categories = []
    for t in order:
        items = by_type[t]
        cat_weight = sum(float(a.get('percentage', 0)) for a in items)
        item_rows = []
        for a in items:
            pct = float(a.get('percentage', 0))
            within = (pct / cat_weight * 100) if cat_weight else 0
            item_rows.append({
                'name': a.get('name', '(unnamed)'),
                'final_pct': pct,
                'within_category_weight': within,
                'description': a.get('description', ''),
            })
        categories.append({
            'type': t,
            'weight': cat_weight,
            'items': item_rows,
        })
    return categories


def category_label(t):
    return t.replace('_', ' ').replace('-', ' ').title()


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def print_report(course_data, categories, colors):
    title = f"{course_data.get('pre','')} {course_data.get('num','')}".strip()
    full = course_data.get('full', '')
    print("=" * 64)
    print(f"  Brightspace grade setup cheat sheet")
    if title or full:
        print(f"  {title}{' - ' if title and full else ''}{full}")
    print("=" * 64)
    print("\nGrading System: Weighted\n")

    total = 0
    for cat in categories:
        color = colors.get(cat['type'], {}).get('colorbg')
        total += cat['weight']
        print(f"{swatch(color)}CATEGORY: {category_label(cat['type'])}")
        print(f"    Weight: {cat['weight']:g}%")
        for item in cat['items']:
            print(f"    -> Item: {item['name']}")
            print(f"         Weight in category: {item['within_category_weight']:.2f}%")
            if item['description']:
                print(f"         ({item['description']})")
        print()

    print("-" * 64)
    if abs(total - 100) < 0.01:
        print(f"Category weights total: {total:g}%  -- OK, sums to 100%")
    else:
        diff = total - 100
        direction = "OVER" if diff > 0 else "UNDER"
        print(f"Category weights total: {total:g}%  -- {direction} by {abs(diff):g}%")
        print("(fix the percentages in the course JSON before setting this up --")
        print(" Brightspace's weighted system expects categories to sum to 100%)")
    print("-" * 64)
    print("\nWizard order: Manage Grades -> New -> Category (repeat per category")
    print("above, entering its Weight), then within each category, New -> Item")
    print("(repeat per item, entering its 'Weight in category' value).\n")


def write_text_file(course_path, course_data, categories, colors):
    key = os.path.splitext(os.path.basename(course_path))[0]
    out_path = os.path.join(os.path.dirname(course_path), f"{key}_grade_cheatsheet.txt")
    lines = []
    title = f"{course_data.get('pre','')} {course_data.get('num','')}".strip()
    full = course_data.get('full', '')
    lines.append(f"Brightspace grade setup cheat sheet -- {title} {full}".strip())
    lines.append("Grading System: Weighted")
    lines.append("")
    total = 0
    for cat in categories:
        total += cat['weight']
        lines.append(f"CATEGORY: {category_label(cat['type'])}   (Weight: {cat['weight']:g}%)")
        for item in cat['items']:
            lines.append(f"    - Item: {item['name']}   (Weight in category: {item['within_category_weight']:.2f}%)")
        lines.append("")
    lines.append(f"Total: {total:g}%" + ("" if abs(total - 100) < 0.01 else "  <-- does not sum to 100%!"))

    with open(out_path, 'w') as f:
        f.write('\n'.join(lines) + '\n')
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

    colors = load_shared_colors(courses_dir or os.path.dirname(course_path))
    categories = build_categories(assess)

    print_report(course_data, categories, colors)

    out_path = write_text_file(course_path, course_data, categories, colors)
    print(f"Also saved to: {out_path}")


if __name__ == '__main__':
    main()
