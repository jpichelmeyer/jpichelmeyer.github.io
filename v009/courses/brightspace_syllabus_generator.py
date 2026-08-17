#!/usr/bin/env python3
"""
brightspace_syllabus_generator.py
====================================

Builds one Syllabus content page from a course's JSON (+ shared.json
policies) and packages it as a Common Cartridge (.imscc) -- an open
IMS Global standard, not D2L-proprietary, which is why Brightspace's
own "Import Course Content -> Common Cartridge" flow can take it
directly. That import only ever adds a Content page; it has no effect
on grades, categories, or anything already in the gradebook.

A Common Cartridge is just a zip file: one imsmanifest.xml describing
what's inside, plus the actual content files it points to. This one
has exactly one thing in it -- syllabus.html -- but the same shape
scales to more pages later if you want it to.

Standard library only. Same course picker as the other two scripts.

    python3 brightspace_syllabus_generator.py mth1220

Output: {key}_syllabus_cartridge.imscc next to the course JSON.
Import it via: Course Admin -> Import/Export/Copy Components ->
Import Components -> Start -> Upload -> select the file -> Import All
Components.
"""

import glob
import html
import json
import os
import sys
import zipfile

# ---------------------------------------------------------------------------
# Course/shared lookup -- same pattern as the other two scripts
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
    key = ask_choice("\nWhich course?", [f[:-5] for f in candidates])
    return os.path.join(courses_dir, f"{key}.json")


# ---------------------------------------------------------------------------
# HTML page assembly
# ---------------------------------------------------------------------------

def build_syllabus_html(course, shared):
    title = f"{course.get('pre','')} {course.get('num','')}".strip()
    full = course.get('full', '')
    catalog = html.escape(course.get('catalog', ''))

    meta_rows = ''.join(
        f"<tr><td><b>{html.escape(k)}</b></td><td>{html.escape(str(v))}</td></tr>"
        for k, v in [
            ('Semester', shared.get('sem', '')),
            ('Days/Time', f"{course.get('days','')} {course.get('time','')}".strip()),
            ('Location', course.get('place', '')),
            ('Instructor', shared.get('name', '')),
            ('Email', shared.get('email', '').replace('\n', '').strip()),
            ('Office', shared.get('office', '')),
            ('Office Hours', shared.get('oh', '')),
        ] if v
    )

    assess_rows = ''.join(
        f"<tr><td>{html.escape(a.get('name',''))}</td>"
        f"<td>{html.escape(str(a.get('percentage','')))}%</td>"
        f"<td>{html.escape(a.get('description',''))}</td></tr>"
        for a in course.get('assess', [])
    )

    # Policy descriptions are already-authored HTML in shared.json (same
    # way the site's own Policies tab uses them) -- embedded as-is.
    policy_blocks = ''.join(
        f"<h3>{html.escape(p.get('name',''))}</h3>" + ''.join(p.get('description', []))
        for p in shared.get('policies', [])
    )

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>{html.escape(title)} Syllabus</title></head>
<body>
<h1>{html.escape(title)}{' &mdash; ' if title and full else ''}{html.escape(full)}</h1>

<h2>Course Information</h2>
<table border="1" cellpadding="6" cellspacing="0">{meta_rows}</table>

<h2>Course Description</h2>
<p>{catalog}</p>

<h2>Assessments</h2>
<table border="1" cellpadding="6" cellspacing="0">
<tr><th>Name</th><th>Weight</th><th>Description</th></tr>
{assess_rows}
</table>

<h2>Course Policies</h2>
{policy_blocks}

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Common Cartridge packaging
# ---------------------------------------------------------------------------

def build_manifest(title):
    title = html.escape(title or 'Syllabus')
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST1"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
  xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource"
  xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd
    http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd
    http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
  </metadata>
  <organizations>
    <organization identifier="org1" structure="rooted-hierarchy">
      <item identifier="root_item">
        <item identifier="item_syllabus" identifierref="res_syllabus">
          <title>{title} Syllabus</title>
        </item>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res_syllabus" type="webcontent" href="syllabus.html">
      <file href="syllabus.html"/>
    </resource>
  </resources>
</manifest>
"""


def write_cartridge(out_path, manifest_xml, syllabus_html):
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('imsmanifest.xml', manifest_xml)
        z.writestr('syllabus.html', syllabus_html)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    courses_dir = find_courses_dir()
    arg = sys.argv[1] if len(sys.argv) > 1 else None

    course_path = resolve_course_path(arg, courses_dir)
    if not course_path:
        if not courses_dir:
            print("Couldn't find a courses/ folder nearby. Run this from your site's")
            print("root, or pass a direct path to a course .json file.")
            sys.exit(1)
        course_path = pick_course_interactively(courses_dir)

    shared_path = os.path.join(courses_dir or os.path.dirname(course_path), 'shared.json')

    with open(course_path) as f:
        course = json.load(f)
    try:
        with open(shared_path) as f:
            shared = json.load(f)
    except Exception as e:
        print(f"(note: couldn't read shared.json -- {e} -- policies/instructor info will be blank)")
        shared = {}

    title = f"{course.get('pre','')} {course.get('num','')}".strip()
    syllabus_html = build_syllabus_html(course, shared)
    manifest_xml = build_manifest(title)

    key = os.path.splitext(os.path.basename(course_path))[0]
    out_path = os.path.join(os.path.dirname(course_path), f"{key}_syllabus_cartridge.imscc")
    write_cartridge(out_path, manifest_xml, syllabus_html)

    print(f"Cartridge saved: {out_path}")
    print("Import via: Course Admin -> Import/Export/Copy Components ->")
    print("Import Components -> Start -> Upload -> Import All Components.")


if __name__ == '__main__':
    main()
