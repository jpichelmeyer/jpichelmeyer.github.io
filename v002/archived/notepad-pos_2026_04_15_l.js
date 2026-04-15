/*
=====================================================================
    v002/pos/app/virtual-file-system/notepad-pos.js
=====================================================================
    Notepad-POS — Virtual File System Text Editor
    
    A tabbed text editor app for the POS window manager.
    Files are stored in window.VFS (Virtual File System),
    a globally accessible store that other apps (e.g. P.SHELL terminal)
    can read from and write to.

    Public API (window.VFS):
        VFS.read(filename)           → string | null
        VFS.write(filename, content) → void
        VFS.list()                   → string[]
        VFS.delete(filename)         → void
        VFS.exists(filename)         → boolean

    Terminal integration:
        The terminal can call:
            VFS.read('script.py')   → pass to Python interpreter
            VFS.read('prog.cs')     → pass to C# interpreter
=====================================================================
*/

'use strict';

/* ============================================================
   VIRTUAL FILE SYSTEM — Global Singleton
   Shared between all apps on the page.
   ============================================================ */
if (!window.VFS) {
    window.VFS = (() => {
        const _files = {};   // filename → { content, lang, created, modified }

        // Seed a welcome file
        _files['welcome.py'] = {
            content: `# Welcome to Notepad-POS!\n# Write Python or C# scripts here.\n# From P.SHELL, run them with:\n#   run welcome.py\n\nprint("Hello from the Virtual File System!")`,
            lang: 'python',
            created: Date.now(),
            modified: Date.now(),
        };

        return {
            read(name) {
                return _files[name]?.content ?? null;
            },
            write(name, content) {
                const now = Date.now();
                if (_files[name]) {
                    _files[name].content  = content;
                    _files[name].modified = now;
                } else {
                    _files[name] = {
                        content,
                        lang:     detectLang(name),
                        created:  now,
                        modified: now,
                    };
                }
                window.dispatchEvent(new CustomEvent('vfs-change', { detail: { name } }));
            },
            delete(name) {
                delete _files[name];
                window.dispatchEvent(new CustomEvent('vfs-change', { detail: { name, deleted: true } }));
            },
            rename(oldName, newName) {
                if (!_files[oldName]) return false;
                _files[newName] = { ..._files[oldName], lang: detectLang(newName), modified: Date.now() };
                delete _files[oldName];
                window.dispatchEvent(new CustomEvent('vfs-change', { detail: { name: newName, renamed: oldName } }));
                return true;
            },
            list() {
                return Object.keys(_files).sort();
            },
            exists(name) {
                return Object.prototype.hasOwnProperty.call(_files, name);
            },
            meta(name) {
                return _files[name] ? { ...(_files[name]), content: undefined } : null;
            },
        };
    })();
}

/* ============================================================
   HELPERS
   ============================================================ */
function detectLang(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return { py: 'python', cs: 'csharp', js: 'javascript', txt: 'text', md: 'markdown' }[ext] ?? 'text';
}

function getLangLabel(filename) {
    return { python: 'PY', csharp: 'C#', javascript: 'JS', text: 'TXT', markdown: 'MD' }[detectLang(filename)] ?? '??';
}

function getLangColor(filename) {
    return {
        python:     '#4ec9b0',
        csharp:     '#9b59b6',
        javascript: '#f0db4f',
        text:       '#888',
        markdown:   '#6ab0f5',
    }[detectLang(filename)] ?? '#888';
}

function formatTimestamp(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateUntitledName() {
    const existing = VFS.list();
    let i = 1;
    while (existing.includes(`untitled${i}.txt`)) i++;
    return `untitled${i}.txt`;
}

/* ============================================================
   NOTEPAD-POS LAUNCHER
   Called by pos.js when user opens the app.
   `body` is the .pos-window-body div provided by the window manager.
   ============================================================ */
export function launchNotepadPOS(body) {
    const app = new NotepadApp(body);
    app.init();
}

/* ============================================================
   NOTEPAD APP CLASS
   ============================================================ */
class NotepadApp {
    constructor(body) {
        this.body       = body;
        this.tabs       = [];          // [{ id, filename, dirty }]
        this.activeId   = null;
        this.nextTabId  = 1;
        this._saveTimer = null;
    }

    /* ── Bootstrap ─────────────────────────────────────── */
    init() {
        this.body.style.cssText = 'padding:0;height:100%;display:flex;flex-direction:column;overflow:hidden;';
        this.body.innerHTML     = this._buildShell();

        this._refs = {
            tabBar:     this.body.querySelector('#npos-tab-bar'),
            newBtn:     this.body.querySelector('#npos-new-btn'),
            editor:     this.body.querySelector('#npos-editor'),
            statusFile: this.body.querySelector('#npos-status-file'),
            statusLang: this.body.querySelector('#npos-status-lang'),
            statusTime: this.body.querySelector('#npos-status-time'),
            statusSave: this.body.querySelector('#npos-status-save'),
            toolbar:    this.body.querySelector('#npos-toolbar'),
        };

        this._attachEvents();
        this._openFile(VFS.list()[0] ?? this._createFile(generateUntitledName()));

        // React to external VFS changes (e.g. terminal writes a file)
        window.addEventListener('vfs-change', this._onVFSChange.bind(this));
    }

    /* ── HTML Shell ────────────────────────────────────── */
    _buildShell() {
        return `
<div id="npos-root" style="display:flex;flex-direction:column;height:100%;background:#1e1e2e;font-family:'Share Tech Mono',monospace;">

    <!-- TOP CHROME -->
    <div id="npos-chrome" style="
        display:flex;align-items:stretch;background:#13131f;
        border-bottom:1px solid #2a2a40;min-height:34px;overflow:hidden;
    ">
        <!-- Tab bar (scrollable) -->
        <div id="npos-tab-bar" style="
            display:flex;align-items:flex-end;overflow-x:auto;flex:1;
            scrollbar-width:none;gap:2px;padding:0 4px;
        "></div>
        <!-- New-file button -->
        <button id="npos-new-btn" title="New file (Ctrl+N)" style="
            background:transparent;border:none;color:#555;
            cursor:pointer;padding:0 14px;font-size:18px;
            border-left:1px solid #2a2a40;flex-shrink:0;
            transition:color .15s,background .15s;
        " onmouseover="this.style.color='#cdd6f4';this.style.background='#1e1e2e'"
           onmouseout="this.style.color='#555';this.style.background='transparent'">+</button>
    </div>

    <!-- TOOLBAR -->
    <div id="npos-toolbar" style="
        display:flex;align-items:center;gap:6px;
        padding:4px 10px;background:#181825;
        border-bottom:1px solid #2a2a40;font-size:11px;
    ">
        <button class="npos-tbtn" id="npos-save-btn"   title="Save (Ctrl+S)">💾 Save</button>
        <button class="npos-tbtn" id="npos-rename-btn" title="Rename file">✏️ Rename</button>
        <button class="npos-tbtn" id="npos-delete-btn" title="Delete file">🗑 Delete</button>
        <div style="flex:1"></div>
        <span id="npos-vfs-count" style="color:#45475a;font-size:10px"></span>
        <button class="npos-tbtn" id="npos-files-btn"  title="Show all VFS files">📂 Files</button>
    </div>

    <!-- EDITOR AREA -->
    <textarea id="npos-editor" spellcheck="false" style="
        flex:1;width:100%;box-sizing:border-box;resize:none;border:none;outline:none;
        background:#1e1e2e;color:#cdd6f4;
        font-family:'Share Tech Mono',monospace;font-size:13px;
        line-height:1.6;padding:14px 16px;
        tab-size:4;
    "></textarea>

    <!-- STATUS BAR -->
    <div style="
        display:flex;align-items:center;gap:12px;
        padding:3px 12px;background:#11111b;
        border-top:1px solid #2a2a40;font-size:10px;color:#45475a;
        font-family:'Share Tech Mono',monospace;
    ">
        <span id="npos-status-file" style="color:#7f849c"></span>
        <span id="npos-status-lang" style="padding:1px 6px;border-radius:3px;font-size:9px;font-weight:bold"></span>
        <div style="flex:1"></div>
        <span id="npos-status-save" style="color:#a6e3a1"></span>
        <span id="npos-status-time"></span>
    </div>

</div>

<!-- toolbar button styles injected once -->
<style>
.npos-tbtn {
    background: transparent;
    border: 1px solid #313244;
    color: #7f849c;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: color .15s, border-color .15s, background .15s;
}
.npos-tbtn:hover {
    color: #cdd6f4;
    border-color: #585b70;
    background: #2a2a40;
}
.npos-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px 5px 12px;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    font-size: 11px;
    white-space: nowrap;
    border: 1px solid transparent;
    border-bottom: none;
    color: #585b70;
    background: transparent;
    transition: color .15s, background .15s;
    user-select: none;
    max-width: 160px;
    min-width: 60px;
}
.npos-tab:hover { color: #a6adc8; background: #1e1e2e; }
.npos-tab.active {
    color: #cdd6f4;
    background: #1e1e2e;
    border-color: #2a2a40;
}
.npos-tab .npos-tab-close {
    opacity: 0;
    font-size: 12px;
    line-height: 1;
    transition: opacity .1s;
    color: #f38ba8;
    border: none; background: transparent; cursor: pointer; padding: 0 2px;
}
.npos-tab:hover .npos-tab-close,
.npos-tab.active .npos-tab-close { opacity: 0.7; }
.npos-tab .npos-tab-close:hover { opacity: 1 !important; }
.npos-tab .npos-tab-dirty { color: #f9e2af; font-size: 8px; }
</style>
        `;
    }

    /* ── Event Wiring ──────────────────────────────────── */
    _attachEvents() {
        const { editor, newBtn } = this._refs;

        // Editor input → dirty flag + autosave
        editor.addEventListener('input', () => {
            this._markDirty();
            this._scheduleAutosave();
        });

        // Tab key → insert spaces
        editor.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const s = editor.selectionStart, en = editor.selectionEnd;
                editor.value = editor.value.substring(0, s) + '    ' + editor.value.substring(en);
                editor.selectionStart = editor.selectionEnd = s + 4;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this._save(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); this._newFile(); }
        });

        newBtn.addEventListener('click', () => this._newFile());

        this.body.querySelector('#npos-save-btn')  .addEventListener('click', () => this._save());
        this.body.querySelector('#npos-rename-btn').addEventListener('click', () => this._rename());
        this.body.querySelector('#npos-delete-btn').addEventListener('click', () => this._deleteActive());
        this.body.querySelector('#npos-files-btn') .addEventListener('click', () => this._showFileList());
    }

    /* ── Tab Management ────────────────────────────────── */
    _addTab(filename) {
        const id = this.nextTabId++;
        this.tabs.push({ id, filename, dirty: false });
        this._renderTabs();
        return id;
    }

    _renderTabs() {
        const bar = this._refs.tabBar;
        bar.innerHTML = '';
        for (const tab of this.tabs) {
            const el = document.createElement('div');
            el.className  = 'npos-tab' + (tab.id === this.activeId ? ' active' : '');
            el.dataset.id = tab.id;
            el.innerHTML  = `
                <span class="npos-tab-lang" style="
                    font-size:8px;font-weight:bold;padding:1px 4px;border-radius:2px;
                    background:${getLangColor(tab.filename)}22;
                    color:${getLangColor(tab.filename)};
                    border:1px solid ${getLangColor(tab.filename)}44;
                ">${getLangLabel(tab.filename)}</span>
                <span class="npos-tab-name" style="overflow:hidden;text-overflow:ellipsis">${tab.filename}</span>
                ${tab.dirty ? '<span class="npos-tab-dirty">●</span>' : ''}
                <button class="npos-tab-close" title="Close tab">×</button>
            `;
            el.addEventListener('click', e => {
                if (e.target.classList.contains('npos-tab-close')) {
                    this._closeTab(tab.id);
                } else {
                    this._switchTo(tab.id);
                }
            });
            bar.appendChild(el);
        }
        this._updateVFSCount();
    }

    _switchTo(tabId) {
        // Save current content first
        this._flushActive();
        this.activeId = tabId;
        const tab = this._getTab(tabId);
        if (!tab) return;
        this._refs.editor.value = VFS.read(tab.filename) ?? '';
        this._refs.editor.focus();
        this._renderTabs();
        this._updateStatus(tab.filename);
    }

    _closeTab(tabId) {
        const tab = this._getTab(tabId);
        if (!tab) return;
        if (tab.dirty) {
            if (!confirm(`"${tab.filename}" has unsaved changes. Close anyway?`)) return;
        }
        const idx = this.tabs.findIndex(t => t.id === tabId);
        this.tabs.splice(idx, 1);
        if (this.activeId === tabId) {
            const next = this.tabs[idx] ?? this.tabs[idx - 1];
            this.activeId = next?.id ?? null;
            if (next) {
                this._refs.editor.value = VFS.read(next.filename) ?? '';
                this._updateStatus(next.filename);
            } else {
                this._refs.editor.value = '';
                this._clearStatus();
            }
        }
        this._renderTabs();
    }

    _getTab(id) { return this.tabs.find(t => t.id === id); }
    _getActiveTab() { return this._getTab(this.activeId); }

    /* ── File Operations ───────────────────────────────── */
    _openFile(filename) {
        // Check if already open
        const existing = this.tabs.find(t => t.filename === filename);
        if (existing) { this._switchTo(existing.id); return; }

        if (!VFS.exists(filename)) VFS.write(filename, '');
        const id = this._addTab(filename);
        this._switchTo(id);
    }

    _createFile(filename) {
        VFS.write(filename, '');
        return filename;
    }

    _newFile() {
        const name = prompt('New file name:', generateUntitledName());
        if (!name) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        this._createFile(trimmed);
        this._openFile(trimmed);
    }

    _save() {
        const tab = this._getActiveTab();
        if (!tab) return;
        VFS.write(tab.filename, this._refs.editor.value);
        tab.dirty = false;
        this._renderTabs();
        this._refs.statusSave.textContent = `saved ${formatTimestamp(Date.now())}`;
        setTimeout(() => { this._refs.statusSave.textContent = ''; }, 3000);
    }

    _rename() {
        const tab = this._getActiveTab();
        if (!tab) return;
        const newName = prompt('Rename file to:', tab.filename);
        if (!newName || newName.trim() === tab.filename) return;
        const trimmed = newName.trim();
        if (VFS.exists(trimmed)) { alert(`"${trimmed}" already exists.`); return; }
        VFS.rename(tab.filename, trimmed);
        tab.filename = trimmed;
        tab.dirty    = false;
        this._renderTabs();
        this._updateStatus(trimmed);
    }

    _deleteActive() {
        const tab = this._getActiveTab();
        if (!tab) return;
        if (!confirm(`Delete "${tab.filename}" from the VFS?`)) return;
        VFS.delete(tab.filename);
        this._closeTab(tab.id);
    }

    _flushActive() {
        const tab = this._getActiveTab();
        if (tab) VFS.write(tab.filename, this._refs.editor.value);
    }

    _markDirty() {
        const tab = this._getActiveTab();
        if (!tab || tab.dirty) return;
        tab.dirty = true;
        this._renderTabs();
    }

    _scheduleAutosave() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._save(), 1500);
    }

    /* ── VFS File List Overlay ─────────────────────────── */
    _showFileList() {
        // Remove existing overlay if open
        const old = this.body.querySelector('#npos-file-overlay');
        if (old) { old.remove(); return; }

        const files   = VFS.list();
        const overlay = document.createElement('div');
        overlay.id    = 'npos-file-overlay';
        overlay.style.cssText = `
            position:absolute;top:68px;right:8px;
            background:#181825;border:1px solid #313244;
            border-radius:6px;z-index:9999;min-width:220px;max-height:300px;
            overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.5);
            font-family:'Share Tech Mono',monospace;font-size:12px;
        `;
        overlay.innerHTML = `
            <div style="padding:8px 12px;border-bottom:1px solid #313244;color:#585b70;font-size:10px;letter-spacing:.08em;">
                VFS — ${files.length} file${files.length !== 1 ? 's' : ''}
            </div>
            ${files.length === 0 ? `<div style="padding:12px;color:#45475a">No files yet.</div>` :
              files.map(f => `
                <div class="npos-fl-row" data-file="${f}" style="
                    display:flex;align-items:center;gap:8px;
                    padding:7px 12px;cursor:pointer;color:#a6adc8;
                    border-bottom:1px solid #1e1e2e;
                    transition:background .1s;
                " onmouseover="this.style.background='#1e1e2e'"
                   onmouseout="this.style.background='transparent'">
                    <span style="
                        font-size:8px;font-weight:bold;padding:1px 4px;border-radius:2px;
                        background:${getLangColor(f)}22;color:${getLangColor(f)};
                        border:1px solid ${getLangColor(f)}44;min-width:20px;text-align:center;
                    ">${getLangLabel(f)}</span>
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f}</span>
                </div>
              `).join('')
            }
        `;

        overlay.querySelectorAll('.npos-fl-row').forEach(row => {
            row.addEventListener('click', () => {
                this._openFile(row.dataset.file);
                overlay.remove();
            });
        });

        // Position relative to app body
        this.body.style.position = 'relative';
        this.body.appendChild(overlay);

        // Close on outside click
        setTimeout(() => {
            const close = (e) => {
                if (!overlay.contains(e.target)) { overlay.remove(); document.removeEventListener('click', close); }
            };
            document.addEventListener('click', close);
        }, 0);
    }

    /* ── Status Bar ────────────────────────────────────── */
    _updateStatus(filename) {
        const { statusFile, statusLang } = this._refs;
        statusFile.textContent      = filename;
        statusLang.textContent      = getLangLabel(filename);
        statusLang.style.background = getLangColor(filename) + '22';
        statusLang.style.color      = getLangColor(filename);
        statusLang.style.border     = `1px solid ${getLangColor(filename)}44`;
    }

    _clearStatus() {
        this._refs.statusFile.textContent = '';
        this._refs.statusLang.textContent = '';
    }

    _updateVFSCount() {
        const el = this.body.querySelector('#npos-vfs-count');
        if (el) el.textContent = `${VFS.list().length} in VFS`;
    }

    /* ── External VFS Changes ──────────────────────────── */
    _onVFSChange(e) {
        const { name, deleted, renamed } = e.detail;
        if (deleted || renamed) {
            // If a tab had this file, mark it stale
            const staleTab = this.tabs.find(t => t.filename === (renamed ?? name));
            if (staleTab) {
                if (deleted) {
                    // Don't auto-close, just mark so user knows
                    staleTab.filename = `[deleted] ${staleTab.filename}`;
                }
            }
        }
        // Refresh count
        this._updateVFSCount();
        this._renderTabs();
    }
}
