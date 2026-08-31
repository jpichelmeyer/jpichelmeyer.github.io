#!/usr/bin/env python3
"""
brightspace_overview_generator.py
==================================

Builds the full course-overview document (Course Information, Instructor
Information, Course Description, Student Learning Outcomes, Instructional
Methods, Course Materials, Assessment/Grading, Course Policies, Student
Support Resources, Workload Expectation, and the Calendar of Course
Activities) from a course's JSON + shared.json, in the layout you sketched
out. Same course picker as the other brightspace_* scripts.

    python3 brightspace_overview_generator.py
    python3 brightspace_overview_generator.py mth1220

Output
------
Always writes an HTML file next to the course JSON:

    {key}_overview.html

That HTML is print-ready on its own (Ctrl/Cmd+P -> Save as PDF gives you
a clean result in any browser). If the `xhtml2pdf` package is installed
(`pip install xhtml2pdf --break-system-packages` or just
`pip install xhtml2pdf`), it also writes:

    {key}_overview.pdf

directly -- no browser step needed. If xhtml2pdf isn't installed, the
script tells you that and skips straight to the HTML, which still works
fine on its own.

Missing data
------------
A lot of the sections you want (Instructional Methods, Course Materials,
Grading Policy, Attendance Policy, Classroom Behavior, and per-course
Credits) aren't in shared.json or the course JSONs yet. Rather than
silently leaving those sections blank, this script:

  1. Fills in an obvious placeholder so the document still generates and
     you can see the shape of it end-to-end.
  2. Prints a report at the end telling you exactly which keys to add,
     where, and in what shape.

Add them once things look right and re-run -- no code changes needed.
"""

import glob
import html
import json
import os
import sys

# ---------------------------------------------------------------------------
# Course/shared lookup -- same pattern as the other brightspace_* scripts
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
# Helpers for pulling optional / not-yet-authored content, while tracking
# what's missing so we can report it at the end.
# ---------------------------------------------------------------------------

MISSING = []  # collected (location, key, shape) tuples, printed in main()


def note_missing(location, key, shape):
    entry = (location, key, shape)
    if entry not in MISSING:
        MISSING.append(entry)


def as_html_blocks(value):
    """Accepts a string, a list of html-paragraph strings, or None, and
    always returns a joined HTML string. Matches how shared.json already
    stores policy 'description' lists."""
    if not value:
        return ''
    if isinstance(value, list):
        return ''.join(value)
    return str(value)


def get_course_or_shared(course, shared, key, placeholder_html, location_label):
    """Course-level override wins; falls back to shared.json's default;
    falls back to a placeholder + missing-field note."""
    if key in course:
        return as_html_blocks(course[key])
    if key in shared:
        return as_html_blocks(shared[key])
    note_missing(location_label, key, "string, or list of '<p>...</p>' strings")
    return placeholder_html


def find_policy(shared, *names):
    """Looks up a shared.json policies[] entry by name (case-insensitive,
    tries each name in order) and returns its joined HTML description,
    or None if not found under any of the given names."""
    policies = shared.get('policies', [])
    lookup = {p.get('name', '').strip().lower(): p for p in policies}
    for name in names:
        p = lookup.get(name.strip().lower())
        if p:
            return as_html_blocks(p.get('description', []))
    return None


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def build_course_info(course, shared):
    title = f"{course.get('pre','')} {course.get('num','')}".strip()
    full = course.get('full', '')
    credits = course.get('credits')
    if credits is None:
        note_missing(f"courses/{course.get('id','<key>')}.json", 'credits',
                     'a number, e.g. 4')
        credits_display = '(credits not set)'
    else:
        credits_display = str(credits)

    rows = [
        ('Course', f"{title}{' -- ' if title and full else ''}{full}"),
        ('Semester', shared.get('sem', '')),
        ('Credits', credits_display),
        ('Days / Time', f"{course.get('days','')} {course.get('time','')}".strip()),
        ('Location', course.get('place', '')),
        ('Prerequisites', course.get('prereq', '') or 'None'),
    ]
    return ''.join(
        f"<tr><td class='label'>{html.escape(k)}</td><td>{html.escape(str(v))}</td></tr>"
        for k, v in rows if v
    )


def build_instructor_info(shared):
    rows = [
        ('Instructor', shared.get('name', '')),
        ('Email', shared.get('email', '').replace('\n', '').strip()),
        ('Office', shared.get('office', '')),
        ('Office Hours', shared.get('oh', '')),
    ]
    return ''.join(
        f"<tr><td class='label'>{html.escape(k)}</td><td>{html.escape(str(v))}</td></tr>"
        for k, v in rows if v
    )


def build_learning_outcomes(course):
    goals = course.get('goals', [])
    if not goals:
        return '<p><i>No learning outcomes listed for this course yet.</i></p>'
    items = ''.join(
        f"<li>{html.escape(g.get('action',''))} {html.escape(g.get('detail',''))}</li>"
        for g in goals
    )
    return f"<ol>{items}</ol>"


def build_materials(course, shared):
    key = course.get('id', '<key>')
    if 'materials' in course:
        return as_html_blocks(course['materials'])
    if 'materials' in shared:
        return as_html_blocks(shared['materials'])
    note_missing(f"courses/{key}.json", 'materials',
                 "a list of '<p>...</p>' strings, e.g. required textbook, "
                 "software, or supplies")
    return '<p><i>[No materials listed yet -- add a "materials" list to this course\'s JSON.]</i></p>'


def build_assessment_table(course):
    rows = ''.join(
        f"<tr><td>{html.escape(a.get('name',''))}</td>"
        f"<td>{html.escape(str(a.get('percentage','')))}%</td>"
        f"<td>{html.escape(a.get('description',''))}</td></tr>"
        for a in course.get('assess', [])
    )
    total = sum(float(a.get('percentage', 0)) for a in course.get('assess', []))
    total_row = f"<tr class='total'><td><b>Total</b></td><td><b>{total:g}%</b></td><td>&nbsp;</td></tr>"
    return (
        "<table class='overview-table assessment-table'>"
        "<colgroup><col width='28%'><col width='12%'><col width='60%'></colgroup>"
        "<tr><th>Assessment</th><th>Weight</th><th>Description</th></tr>"
        f"{rows}{total_row}</table>"
    )


def build_grading_scale_table(course, shared):
    scale = course.get('grading_scale') or shared.get('grading_scale', {
        "A": "93% - 100%", "A-": "90% - 92%",
        "B+": "87% - 89%", "B": "83% - 86%", "B-": "80% - 82%",
        "C+": "77% - 79%", "C": "73% - 76%", "C-": "70% - 72%",
        "D+": "67% - 69%", "D": "63% - 66%", "D-": "60% - 62%",
        "F": "Below 60%"
    })
    rows = ''.join(
        f"<tr><td><b>{html.escape(str(k))}</b></td><td>{html.escape(str(v))}</td></tr>"
        for k, v in scale.items()
    )
    return (
        "<table class='overview-table grading-scale-table'>"
        "<colgroup><col width='30%'><col width='70%'></colgroup>"
        "<tr><th>Letter Grade</th><th>Percentage Range</th></tr>"
        f"{rows}</table>"
    )


def build_calendar(course):
    """Renders the existing 'schedule' (theme -> ordered list of week/topic
    dicts) as a simple calendar table -- no new JSON needed, this data is
    already authored for the website's own schedule view."""
    schedule = course.get('schedule', [])
    if not schedule:
        return '<p><i>No schedule found for this course yet.</i></p>'

    out = []
    week_num = 1
    for theme in schedule:
        out.append(f"<tr class='theme-row'><td colspan='2'><b>{html.escape(theme.get('theme',''))}</b></td></tr>")
        for tr in theme.get('trs', []):
            topics = ', '.join(html.escape(t) for t in tr.keys())
            out.append(f"<tr><td>Week {week_num}</td><td>{topics}</td></tr>")
            week_num += 1
    return (
        "<table class='overview-table calendar-table'>"
        "<colgroup><col width='20%'><col width='80%'></colgroup>"
        "<tr><th>Week</th><th>Topic</th></tr>"
        f"{''.join(out)}</table>"
    )


def build_workload_note(course):
    credits = course.get('credits')
   
    if credits is None:
        credits = 4
    
    credits = int(credits)
    min_hrs = 2
    max_hrs = 3
    
    hours_min = int(min_hrs * credits)
    hours_max = int(max_hrs * credits)
   
    return (
        "<p>For every credit this course is worth, it is expected that you will "
        f"spend {min_hrs}-{max_hrs} hours <i>outside of our in-class time</i> on work "
        "related to the course, which includes (but is not limited to) studying "
        "lessons, working on projects, and seeking assistance from and working "
        "with the instructor during office hours. This course is worth "
        f"<b>{credits} credit(s)</b>, so plan on roughly "
        f"<b>{hours_min} to {hours_max} hour(s)</b> of outside effort per week. This number may be much higher or lower, depending on the knowledge and experience you bring into the course.</p>"
    )


# Default, editable-in-code fallback text for the Student Support Resources
# section, used only if shared.json doesn't yet have a 'support_resources'
# list. This is the text you pasted -- it's here so the generator produces
# a complete document right away; once you add 'support_resources' to
# shared.json (see the end-of-run report), that becomes the source of
# truth instead and this fallback is ignored.
DEFAULT_SUPPORT_RESOURCES = [
    {
        "name": "Student-Athletes",
        "description": [
            "<p>If you are a student athlete, you should inform me of this status "
            "at the start of the semester by providing me with the Coach's Letter "
            "that you received (this letter should name your head coach and the "
            "competition dates, and should have been provided to you at the first "
            "meeting). In addition to sharing this information at the start of the "
            "semester, you need to notify me of any class days to be missed due to "
            "a Carthage Athletics-sponsored event in which you are participating. "
            "You should notify me in advance of each upcoming contest. (For "
            "example, if you know you are traveling with the team on Friday, "
            "please let me know several days in advance). You will need to make up "
            "any missed lectures, assignments, and/or exams. Some work that can "
            "happen only during class time, such as discussion points, is not "
            "possible to make up. Students are encouraged to be in communication "
            "often; excessive absences will necessitate conversations with the "
            "instructor and the associate athletic director, and may impact your "
            "grade. Please note: student-athletes cannot miss class to attend a "
            "practice session or athletic training appointment.</p>"
        ],
    },
    {
        "name": "Learning Accessibility Service Information",
        "description": [
            "<p>Carthage College strives to make all learning experiences as "
            "accessible as possible. If you anticipate or experience academic "
            "barriers due to your particular circumstances (including mental "
            "health, learning disorders, and chronic medical conditions), please "
            "let me know immediately so we can discuss options privately. To "
            "establish reasonable accommodations, you must register with Warren "
            "Wolchuk in Learning Accessibility Services "
            "(<a href='mailto:wwolchuk@carthage.edu'>wwolchuk@carthage.edu</a>).</p>"
        ],
    },
    {
        "name": "The Health and Counseling Center",
        "description": [
            "<p>The Health and Counseling Center (HCC) addresses student physical, "
            "mental, and emotional well-being. All services, provided by "
            "experienced professionals, are free and confidential to currently "
            "enrolled, full-time undergraduate students. Students must call or "
            "visit the HCC to schedule an appointment. Health services are "
            "available by walk-in or appointment from 8:30am to 1pm and 2pm to "
            "4:00pm. Counseling walk-in sessions are available Monday through "
            "Friday from 11:30am to 1:00pm. Last walk-in appointment begins 30 "
            "minutes before the end of walk-in hours. TWC, first floor (behind "
            "mailboxes), 262-551-5710. Students can visit Uwill to access "
            "teletherapy services.</p>"
        ],
    },
    {
        "name": "Writing Center",
        "description": [
            "<p>The Brainard Writing Center is a free resource for student "
            "writers. The center is staffed by undergraduate Writing Fellows who "
            "have been recommended by Carthage faculty and trained to work with "
            "other students on their writing. They can work with you at all "
            "stages of the writing process, including understanding the "
            "assignment, brainstorming ideas, drafting, revising, and "
            "proofreading. Appointments are available in-person, via Zoom, or as "
            "written feedback, and can be scheduled on WCOnline. For more "
            "information, visit "
            "<a href='https://www.carthage.edu/writing-center/'>carthage.edu/writing-center</a>.</p>"
        ],
    },
    {
        "name": "Peer Tutoring",
        "description": [
            "<p>Peer Tutoring is available to assist you with any aspect of the "
            "class, including understanding readings, preparing for quizzes, and "
            "studying for exams. This free campus resource is here to help "
            "everyone maximize their academic potential. Please take advantage of "
            "it. You can schedule an appointment up to seven days in advance and "
            "see the schedule on WCOnline. For more information, visit "
            "<a href='https://www.carthage.edu/tutoring/'>carthage.edu/tutoring</a>.</p>"
        ],
    },
]


def build_support_resources(shared):
    key = 'support_resources'
    resources = shared.get(key)
    if not resources:
        note_missing('courses/shared.json', key,
                     "a list of {\"name\": ..., \"description\": [\"<p>...</p>\"]} "
                     "objects, same shape as the existing 'policies' list "
                     "(a starter version with your pasted text is being used "
                     "for this run)")
        resources = DEFAULT_SUPPORT_RESOURCES
    return ''.join(
        f"<div class='keep-together'><h3>{html.escape(r.get('name',''))}</h3>"
        f"{as_html_blocks(r.get('description', []))}</div>"
        for r in resources
    )


def build_course_policies(course, shared):
    key = course.get('id', '<key>')

    attendance = find_policy(shared, 'Attendance Policy', 'Attendance')
    if attendance is None:
        note_missing('courses/shared.json (policies list)', 'Attendance Policy',
                     "a {\"name\": \"Attendance Policy\", \"description\": [...]} entry")
        attendance = '<p><i>[Add an "Attendance Policy" entry to shared.json\'s policies list.]</i></p>'

    behavior = find_policy(shared, 'Expectations for Classroom Behavior',
                            'Classroom Behavior', 'Be a Good Human')
    if behavior is None:
        note_missing('courses/shared.json (policies list)',
                     'Expectations for Classroom Behavior',
                     "a {\"name\": \"Expectations for Classroom Behavior\", "
                     "\"description\": [...]} entry (or rename your existing "
                     "'Be a Good Human' entry to this)")
        behavior = '<p><i>[Add an "Expectations for Classroom Behavior" entry to shared.json\'s policies list.]</i></p>'

    late_work = find_policy(shared, 'Late Work/Make-up Policy', 'Late Work')
    if late_work is None:
        note_missing('courses/shared.json (policies list)', 'Late Work/Make-up Policy',
                     "a {\"name\": \"Late Work/Make-up Policy\", \"description\": [...]} entry")
        late_work = '<p><i>[Add a "Late Work/Make-up Policy" entry to shared.json\'s policies list.]</i></p>'

    academic_integrity = find_policy(shared, 'Academic Integrity Statement', 'Academic Honesty')
    if academic_integrity is None:
        note_missing('courses/shared.json (policies list)', 'Academic Integrity Statement',
                     "a {\"name\": \"Academic Integrity Statement\", \"description\": [...]} entry")
        academic_integrity = (
            "<p>See Carthage's "
            "<a href='https://www.carthage.edu/academics/carthage-curriculum/academic-policies/'>"
            "Academic Honesty Policy</a>.</p>"
        )

    ai_policy = find_policy(shared, 'Artificial Intelligence Use Policy', 'AI Usage', 'AI Use')
    if ai_policy is None:
        note_missing('courses/shared.json (policies list)', 'Artificial Intelligence Use Policy',
                     "a {\"name\": \"Artificial Intelligence Use Policy\", \"description\": [...]} entry")
        ai_policy = '<p><i>[Add an "Artificial Intelligence Use Policy" entry to shared.json\'s policies list.]</i></p>'

    return f"""
    <div class='keep-together'><h3>Attendance Policy</h3>{attendance}</div>
    <div class='keep-together'><h3>Expectations for Classroom Behavior</h3>{behavior}</div>
    <div class='keep-together'><h3>Late Work/Make-up Policy</h3>{late_work}</div>
    <div class='keep-together'><h3>Academic Integrity Statement</h3>{academic_integrity}</div>
    <div class='keep-together'><h3>Artificial Intelligence Use Policy</h3>{ai_policy}</div>
    """


# ---------------------------------------------------------------------------
# Full document assembly
# ---------------------------------------------------------------------------

CSS = """
body { font-family: Helvetica, Arial, sans-serif; color: #1f1f1f; line-height: 1.45; margin: 2em; }
h1 { font-size: 1.6em; border-bottom: 3px solid #333; padding-bottom: 0.2em; }
h2 { font-size: 1.25em; margin-top: 1.6em; background: #333333; color: #f1f1f1; padding: 0.3em 0.5em; }
h3 { font-size: 1.05em; margin-top: 1.1em; margin-bottom: 0.2em; }
table.meta-table, table.overview-table { border-collapse: collapse; width: 100%; margin: 0.6em 0 1em 0; table-layout: fixed; }
table.meta-table td, table.overview-table td, table.overview-table th {
    border: 1px solid #999; padding: 6px 8px; vertical-align: top; text-align: left;
    word-wrap: break-word;
}
table.overview-table th { background: #f2f2f2; }
table.meta-table td.label { font-weight: bold; width: 160px; background: #f7f7f7; }
tr.theme-row td { background: #f7f7f7; }
tr.total td { border-top: 2px solid #333; }
a { color: #204a87; }
/* Note: page-break-inside: avoid is intentionally NOT applied to the big
   .section wrappers -- those run longer than a single printed page, and
   telling the renderer to keep an over-long block together just makes it
   shove the whole thing onto the next page, leaving a large blank gap
   and throwing off everything after it. Instead, keep only genuinely
   small, single-page-attempt units together: a table row, or one policy
   /resource block (heading + its own paragraphs). */
h2, h3, h4 { page-break-after: avoid; }
table.overview-table tr { page-break-inside: avoid; }
.keep-together { page-break-inside: avoid; }
"""


def build_document(course, shared):
    title = f"{course.get('pre','')} {course.get('num','')}".strip()
    full = course.get('full', '')

    grading_policy = get_course_or_shared(
        course, shared, 'grading_policy',
        '<p><i>[No grading policy text yet -- add a "grading_policy" key to '
        'shared.json (or this course\'s JSON to override it).]</i></p>',
        'courses/shared.json',
    )
    instructional_methods = get_course_or_shared(
        course, shared, 'instructional_methods',
        '<p><i>[No instructional methods text yet -- add an '
        '"instructional_methods" key to shared.json (or this course\'s JSON '
        'to override it).]</i></p>',
        'courses/shared.json',
    )

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{html.escape(title)} Course Overview</title>
<style>{CSS}</style>
</head>
<body>

<h1>{html.escape(title)}{' &mdash; ' if title and full else ''}{html.escape(full)}</h1>

<div class="section">
<h2>Overview</h2>

<h3>Course Information</h3>
<table class="meta-table">{build_course_info(course, shared)}</table>

<h3>Instructor Information</h3>
<table class="meta-table">{build_instructor_info(shared)}</table>

<h3>Course Description</h3>
<p>{html.escape(course.get('catalog', ''))}</p>

<h3>Student Learning Outcomes</h3>
{build_learning_outcomes(course)}

<h3>Instructional Methods</h3>
{instructional_methods}

<h3>Course Materials</h3>
{build_materials(course, shared)}
</div>

<div class="section">
<h3>Course Assignment, Assessments, and Grading Policy</h3>
<h4>Grading Policy</h4>
{grading_policy}
<h4>Assessments</h4>
{build_assessment_table(course)}
<h4>Grading Scale</h4>
{build_grading_scale_table(course, shared)}
</div>

<div class="section">
<h3>Course Policies and Procedures</h3>
{build_course_policies(course, shared)}
</div>

<div class="section">
<h2>Student Support Resources</h2>
{build_support_resources(shared)}
</div>

<div class="section">
<h2>Course Specifics</h2>

<h3>Workload Expectation</h3>
{build_workload_note(course)}

<h3>Calendar of Course Activities</h3>
{build_calendar(course)}
</div>

</body>
</html>
"""


# ---------------------------------------------------------------------------
# PDF export (optional -- only if xhtml2pdf is installed)
# ---------------------------------------------------------------------------

def try_write_pdf(html_text, pdf_path):
    try:
        from xhtml2pdf import pisa
    except ImportError:
        print("(xhtml2pdf not installed -- skipping PDF, HTML file is still complete.")
        print(" To also get a PDF directly next time: pip install xhtml2pdf)")
        return False

    with open(pdf_path, 'wb') as f:
        result = pisa.CreatePDF(html_text, dest=f)
    if result.err:
        print(f"(xhtml2pdf reported {result.err} error(s) -- check {pdf_path}, "
              "or just print the HTML file to PDF from your browser instead.)")
        return False
    return True


# ---------------------------------------------------------------------------
# Missing-field report
# ---------------------------------------------------------------------------

def print_missing_report():
    if not MISSING:
        return
    print("\n" + "=" * 72)
    print("This document generated fine, but some sections used placeholder")
    print("text because the JSON doesn't have this content yet. Add these and")
    print("re-run to fill them in:")
    print("=" * 72)
    for location, key, shape in MISSING:
        print(f"\n  * In {location}:")
        print(f"      \"{key}\": {shape}")
    print("\n" + "-" * 72)
    print("Tip: 'instructional_methods' and 'grading_policy' can live in")
    print("shared.json as course-wide defaults, and be overridden per-course")
    print("by adding the same key directly to that course's own JSON.")
    print("-" * 72 + "\n")


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
        print(f"(note: couldn't read shared.json -- {e} -- lots of this document will be blank)")
        shared = {}

    doc_html = build_document(course, shared)

    key = os.path.splitext(os.path.basename(course_path))[0]
    out_dir = os.path.dirname(course_path)
    html_path = os.path.join("../courses/", f"{key}_syllabus.html")
    pdf_path = os.path.join("../pdfs/", f"{key}_syllabus.pdf")
    
    with open(html_path, 'w') as f:
        f.write(doc_html)
    print(f"HTML saved: {html_path}")

    if try_write_pdf(doc_html, pdf_path):
        print(f"PDF saved:  {pdf_path}")

    print_missing_report()


if __name__ == '__main__':
    main()
