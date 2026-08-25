#!/usr/bin/env python3
"""
brightspace_banner_generator.py
==================================

Takes a course's existing icon SVG (the same one used in the .cxc
thumbnail on the website) and its courseColor, and produces a
full-size banner SVG: courseColor background, the icon's own artwork
(already black, same as it renders on the site) centered and scaled
up. Not Brightspace-specific in how it builds the SVG -- it's just an
SVG compositing script -- but sized to Brightspace's current
recommended banner dimensions by default (2400x960; that number has
moved around between Brightspace versions/institutions, so check
yours and pass --width/--height if it's different).

Output is SVG. If your Brightspace instance wants a raster image
(some don't accept PNG for banners, per their own docs, so check),
open the SVG in a browser or Inkscape and export/screenshot it, or
convert with a tool like `rsvg-convert` / `cairosvg` -- not done here
to keep this dependency-free.

Standard library only. Run it directly or from Thonny; same course
picker as brightspace_grade_cheatsheet.py if no course is given.

    python3 brightspace_banner_generator.py mth1220
    python3 brightspace_banner_generator.py mth1220 --width 1200 --height 200
"""

import argparse
import glob
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)

# Element types worth keeping when we lift artwork out of a source SVG --
# everything else (defs, sodipodi/inkscape metadata, namedview, title...)
# is editor cruft with nothing visible in it.
DRAWABLE_TAGS = {'g', 'path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'use'}


def local_tag(elem):
    return elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag


def parse_length(value, fallback):
    if not value:
        return fallback
    m = re.match(r'[\d.]+', value.strip())
    return float(m.group()) if m else fallback


def load_icon(svg_path):
    """Returns (inner_markup, icon_width, icon_height) for the source icon."""
    tree = ET.parse(svg_path)
    root = tree.getroot()

    view_box = root.get('viewBox')
    if view_box:
        parts = [float(p) for p in view_box.replace(',', ' ').split()]
        icon_w, icon_h = parts[2], parts[3]
    else:
        icon_w = parse_length(root.get('width'), 100)
        icon_h = parse_length(root.get('height'), 100)

    kept = [child for child in root if local_tag(child) in DRAWABLE_TAGS]
    inner_markup = ''.join(ET.tostring(child, encoding='unicode') for child in kept)
    return inner_markup, icon_w, icon_h


def build_banner(icon_markup, icon_w, icon_h, bg_color, banner_w, banner_h, fill_fraction=0.6):
    """Centers the icon artwork on a courseColor background, scaled so its
    larger dimension takes up `fill_fraction` of the banner's height."""
    scale = (banner_h * fill_fraction) / max(icon_w, icon_h)
    #tx = banner_w / 2 - (icon_w * scale) / 2
    tx = (0.75 * banner_w) - (0.5 * icon_w * scale)
    ty = banner_h / 2 - (icon_h * scale) / 2

    return f'''<svg xmlns="{SVG_NS}" width="{banner_w}" height="{banner_h}" viewBox="0 0 {banner_w} {banner_h}">
    <rect x="0" y="0" width="{banner_w}" height="{banner_h}" fill="{bg_color}" />
    <g transform="translate({tx:.2f},{ty:.2f}) scale({scale:.4f})">
{icon_markup}
    </g>
</svg>
'''


# ---------------------------------------------------------------------------
# Course lookup -- same pattern as brightspace_grade_cheatsheet.py
# ---------------------------------------------------------------------------

def find_courses_dir():
    here = os.path.abspath('../courses/')
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


def ask_choice(prompt, options):
    while True:
        print(prompt)
        for i, opt in enumerate(options, start=1):
            print(f"  {i}. {opt}")
        raw = input("> ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return options[int(raw) - 1]
        print("Please enter a number from the list above.\n")


def pick_course_interactively(courses_dir):
    skip = {'shared.json', 'manifest.json'}
    candidates = sorted(
        os.path.basename(p) for p in glob.glob(os.path.join(courses_dir, '*.json'))
        if os.path.basename(p) not in skip
    )
    if not candidates:
        print(f"No course .json files found in {courses_dir}")
        sys.exit(1)
    labels = [f[:-5] for f in candidates]
    key = ask_choice("\nWhich course?", labels)
    return os.path.join(courses_dir, f"{key}.json")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate a Brightspace banner SVG from a course's icon.")
    parser.add_argument('course', nargs='?', help="course key (e.g. mth1220) or path to a course .json")
    parser.add_argument('--width', type=int, default=2400)
    parser.add_argument('--height', type=int, default=960)
    parser.add_argument('--fill-fraction', type=float, default=0.6,
                         help="how much of the banner height the icon should fill (0-1)")
    args = parser.parse_args()

    courses_dir = find_courses_dir()
    course_path = resolve_course_path(args.course, courses_dir)
    if not course_path:
        if not courses_dir:
            print("Couldn't find a courses/ folder nearby. Run this from your site's")
            print("root, or pass a direct path to a course .json file.")
            sys.exit(1)
        course_path = pick_course_interactively(courses_dir)

    with open(course_path) as f:
        course_data = json.load(f)

    svg_name = course_data.get('svg')
    if not svg_name:
        print(f"{course_path} has no 'svg' key -- nothing to work from.")
        sys.exit(1)

    svgs_dir = os.path.join(os.path.dirname(courses_dir or os.path.dirname(course_path)), 'svgs')
    icon_path = os.path.join(svgs_dir, svg_name)
    if not os.path.isfile(icon_path):
        print(f"Couldn't find the icon at {icon_path}")
        sys.exit(1)

    color = course_data.get('courseColor', '#aaaaaa')
    icon_markup, icon_w, icon_h = load_icon(icon_path)
    banner_svg = build_banner(icon_markup, icon_w, icon_h, color, args.width, args.height, args.fill_fraction)

    key = os.path.splitext(os.path.basename(course_path))[0]
    #out_path = os.path.join(os.path.dirname(course_path), f"banner_{key}.svg")
    #os.path.abspath('../courses/')
    out_path = os.path.join(os.path.abspath('../imgs/'), f"banner_{key}.svg")
    with open(out_path, 'w') as f:
        f.write(banner_svg)

    print(f"Banner saved: {out_path}  ({args.width}x{args.height}, background {color})")


if __name__ == '__main__':
    main()
