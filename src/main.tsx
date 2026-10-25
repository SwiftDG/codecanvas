import { StrictMode, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, Check, ChevronDown, CirclePlay, Code2, Copy, Download,
  FileCode2, Folder, FolderPlus, Github, Menu, MoreHorizontal, PanelLeftClose,
  Plus, RotateCcw, Search, Settings2, Share2, TerminalSquare, Trash2, Upload, X
} from 'lucide-react'
import './styles.css'

const Monaco = lazy(() => import('@monaco-editor/react'))

type FileItem = { id: string; path: string; content: string; language: string }
type Project = { id: string; name: string; files: FileItem[]; updatedAt: number }
type SaveState = 'saved' | 'saving' | 'offline' | 'failed'

const starterFiles: FileItem[] = [
  { id: 'f-main', path: 'src/main.js', language: 'javascript', content: `const canvas = {\n  name: 'CodeCanvas',\n  purpose: 'less setup, more making'\n}\n\nconsole.log(\`Welcome to \${canvas.name}.\`)\nconsole.log(canvas.purpose)\n` },
  { id: 'f-readme', path: 'README.md', language: 'markdown', content: `# First canvas\n\nA small JavaScript project that runs entirely in your browser.\n\nOpen \`src/main.js\`, change the message, then press Run.\n` },
  { id: 'f-notes', path: 'notes/ideas.txt', language: 'plaintext', content: 'Make something worth returning to.\n' },
]

const initialProject: Project = { id: 'first-canvas', name: 'First canvas', files: starterFiles, updatedAt: Date.now() }

function uid(prefix = 'id') { return `${prefix}-${Math.random().toString(36).slice(2, 9)}` }
function languageFor(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  return ({ js: 'javascript', ts: 'typescript', py: 'python', cpp: 'cpp', c: 'c', json: 'json', md: 'markdown', html: 'html', css: 'css' } as Record<string, string>)[ext || ''] || 'plaintext'
}
function loadProjects(): Project[] {
  try { const raw = localStorage.getItem('codecanvas-projects'); return raw ? JSON.parse(raw) : [initialProject] } catch { return [initialProject] }
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark"><i /><i /><i /></span><span>CodeCanvas</span></span>
}

function App() {
  const [screen, setScreen] = useState<'home' | 'dashboard' | 'ide' | 'shared'>('home')
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [activeId, setActiveId] = useState(projects[0]?.id || initialProject.id)
  const shared = useMemo(() => {
    if (!location.hash.startsWith('#share=')) return null
    try { return JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(7))))) as Project } catch { return null }
  }, [])

  useEffect(() => {
    if (shared) setScreen('shared')
  }, [shared])

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  }, [])

  const enter = () => { setScreen('dashboard'); history.replaceState(null, '', location.pathname) }
  const openProject = (id: string) => { setActiveId(id); setScreen('ide') }
  const createProject = () => {
    const p: Project = { id: uid('project'), name: `Untitled canvas ${projects.length + 1}`, updatedAt: Date.now(), files: [{ id: uid('file'), path: 'main.js', language: 'javascript', content: "console.log('A new canvas is ready.')\n" }] }
    const next = [p, ...projects]; setProjects(next); localStorage.setItem('codecanvas-projects', JSON.stringify(next)); openProject(p.id)
  }
  const persist = (project: Project) => {
    setProjects(current => {
      const next = current.some(p => p.id === project.id) ? current.map(p => p.id === project.id ? project : p) : [project, ...current]
      localStorage.setItem('codecanvas-projects', JSON.stringify(next)); return next
    })
  }

  if (screen === 'home') return <Home onEnter={enter} onCreate={createProject} />
  if (screen === 'dashboard') return <Dashboard projects={projects} onOpen={openProject} onCreate={createProject} onHome={() => setScreen('home')} />
  if (screen === 'shared' && shared) return <Workspace project={shared} readOnly onBack={enter} onPersist={() => {}} onFork={() => { const p = { ...shared, id: uid('project'), name: `${shared.name} copy`, updatedAt: Date.now(), files: shared.files.map(f => ({ ...f, id: uid('file') })) }; persist(p); openProject(p.id) }} />
  const project = projects.find(p => p.id === activeId) || projects[0] || initialProject
  return <Workspace project={project} onBack={() => setScreen('dashboard')} onPersist={persist} />
}

function Home({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  const [menu, setMenu] = useState(false)
  return <main className="marketing">
    <header className="topbar">
      <a href="#top" aria-label="CodeCanvas home"><Brand /></a>
      <nav className={menu ? 'nav-open' : ''} aria-label="Primary navigation">
        <a href="#instrument">The workspace</a><a href="#flow">How it works</a><a href="#principles">Principles</a>
        <button className="nav-login" onClick={onEnter}>Open dashboard</button>
      </nav>
      <button className="menu-button" onClick={() => setMenu(v => !v)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">A browser workspace for real code</p>
        <h1>Begin with an idea.<br /><span>Stay with the work.</span></h1>
        <p className="hero-lede">CodeCanvas gives small software projects a focused place to grow. Files, editor, output and recovery, held together in one calm instrument.</p>
        <div className="hero-actions"><button className="button-primary" onClick={onCreate}>Start a canvas <ArrowRight /></button><button className="button-text" onClick={onEnter}>Return to your projects</button></div>
      </div>
      <div className="hero-instrument" aria-label="CodeCanvas editor preview">
        <div className="instrument-rail"><Brand compact /><span>first-canvas</span><MoreHorizontal /></div>
        <div className="instrument-body">
          <div className="mini-tree"><p>EXPLORER</p><span><ChevronDown /> src</span><strong><FileCode2 /> main.js</strong><span><FileCode2 /> README.md</span></div>
          <div className="mini-editor">
            <div className="mini-tab">main.js <span>●</span></div>
            <pre><i>1</i><code><b>const</b> thought = <em>'make it tangible'</em></code>{'\n'}<i>2</i><code></code>{'\n'}<i>3</i><code><b>function</b> begin(idea) {'{'}</code>{'\n'}<i>4</i><code>  <b>return</b> idea.trim()</code>{'\n'}<i>5</i><code>{'}'}</code>{'\n'}<i>6</i><code></code>{'\n'}<i>7</i><code>console.log(begin(thought))</code></pre>
          </div>
          <div className="mini-output"><p>OUTPUT <span>JavaScript</span></p><strong>make it tangible</strong><small>Process finished in 34 ms</small></div>
        </div>
      </div>
      <div className="scroll-note">Scroll to enter the workspace <ChevronDown /></div>
    </section>

    <section className="manifesto" id="instrument">
      <p>Software rarely begins as a system.</p>
      <h2>It begins as one file,<br />one question,<br /><span>one uninterrupted hour.</span></h2>
      <div className="manifesto-aside"><p>CodeCanvas protects that beginning.</p><p>No installation ritual. No decorative dashboard between you and the editor. Open the canvas and the useful parts are already within reach.</p></div>
    </section>

    <section className="editor-story" id="flow">
      <div className="story-index"><span>Files</span><span>Edit</span><span>Run</span><span>Recover</span></div>
      <div className="story-copy"><p className="eyebrow">One continuous loop</p><h2>The interface follows the work, not the other way around.</h2><p>Create a file. Change the thought. Run it. Read what happened. Your canvas keeps its place on this device so you can close the browser and return without reconstructing the moment.</p></div>
      <div className="story-panel">
        <div className="story-file"><Folder /><span>src</span><small>3 files</small></div>
        <div className="story-file active"><FileCode2 /><span>parser.js</span><small>saved now</small></div>
        <div className="story-file"><FileCode2 /><span>fixtures.json</span><small>2 min ago</small></div>
        <div className="story-file"><FileCode2 /><span>README.md</span><small>yesterday</small></div>
      </div>
    </section>

    <section className="principles" id="principles">
      <div><p className="eyebrow">A smaller kind of IDE</p><h2>Useful before the cloud has finished waking up.</h2></div>
      <article><h3>No environment ceremony</h3><p>Open a canvas and write. Small JavaScript programs execute on your device without waiting for a remote machine.</p></article>
      <article><h3>Built for unreliable networks</h3><p>Your active work lives locally, the interface reports connectivity honestly, and the installed shell can reopen from cache.</p></article>
      <article><h3>Your project is portable</h3><p>Export a complete canvas as one readable file, keep it anywhere, then import it into another browser when you need it.</p></article>
    </section>

    <section className="closing"><p>There is always a smaller first version.</p><h2>Give it a canvas.</h2><button className="button-primary light" onClick={onCreate}>Create your first project <ArrowRight /></button></section>
    <footer><Brand /><p>Independent developer tooling, designed and engineered by David Gilbert.</p><div><a href="#instrument">Workspace</a><a href="#principles">Principles</a><a href="https://github.com/SwiftDG" target="_blank" rel="noreferrer"><Github /> GitHub</a></div><small>CodeCanvas preview. Project data is stored on this device.</small></footer>
  </main>
}

function Dashboard({ projects, onOpen, onCreate, onHome }: { projects: Project[]; onOpen: (id: string) => void; onCreate: () => void; onHome: () => void }) {
  const importRef = useRef<HTMLInputElement>(null)
  const importProject = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Project
      if (!parsed.name || !Array.isArray(parsed.files) || !parsed.files.every(f => f.path && typeof f.content === 'string')) throw new Error('Invalid canvas')
      const imported = { ...parsed, id: uid('project'), name: `${parsed.name} imported`, updatedAt: Date.now(), files: parsed.files.map(f => ({ ...f, id: uid('file'), language: languageFor(f.path) })) }
      const next = [imported, ...projects]; localStorage.setItem('codecanvas-projects', JSON.stringify(next)); location.reload()
    } catch { alert('This file is not a valid CodeCanvas project.') }
  }
  return <main className="dashboard">
    <header className="app-header"><button className="brand-button" onClick={onHome}><Brand /></button><div className="header-actions"><button className="icon-button" aria-label="Search projects"><Search /></button><button className="avatar" aria-label="Account">DG</button></div></header>
    <section className="dashboard-intro"><div><p className="eyebrow">Your canvases</p><h1>Pick up where<br />the thought left off.</h1></div><div className="dashboard-actions"><button className="button-secondary" onClick={() => importRef.current?.click()}><Upload /> Import canvas</button><button className="button-primary" onClick={onCreate}><Plus /> New project</button><input ref={importRef} hidden type="file" accept=".canvas,.json,application/json" onChange={e => importProject(e.target.files?.[0])} /></div></section>
    <section className="project-list" aria-label="Projects">
      <div className="list-head"><span>Project</span><span>Files</span><span>Last changed</span><span /></div>
      {projects.map(p => <button className="project-row" key={p.id} onClick={() => onOpen(p.id)}>
        <span className="project-name"><i><FileCode2 /></i><strong>{p.name}</strong><small>{p.files.find(f => f.path.endsWith('.js'))?.path || p.files[0]?.path}</small></span>
        <span>{p.files.length}</span><span>{relativeTime(p.updatedAt)}</span><ArrowRight />
      </button>)}
    </section>
    <aside className="dashboard-note"><span>Local workspace</span><p>Your projects currently persist in this browser. Account sync and cross-device storage require the production backend.</p></aside>
  </main>
}

function relativeTime(time: number) { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); return mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hr ago` }

function Workspace({ project: initial, onPersist, onBack, readOnly = false, onFork }: { project: Project; onPersist: (p: Project) => void; onBack: () => void; readOnly?: boolean; onFork?: () => void }) {
  const [project, setProject] = useState(initial)
  const [activeFileId, setActiveFileId] = useState(initial.files[0]?.id || '')
  const [tabs, setTabs] = useState<string[]>(initial.files[0] ? [initial.files[0].id] : [])
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [output, setOutput] = useState('Run a JavaScript file to see its output here.')
  const [running, setRunning] = useState(false)
  const [sidebar, setSidebar] = useState(true)
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [shareNotice, setShareNotice] = useState(false)
  const saveTimer = useRef<number | null>(null)
  const active = project.files.find(f => f.id === activeFileId) || project.files[0]

  useEffect(() => { setProject(initial); setActiveFileId(initial.files[0]?.id || ''); setTabs(initial.files[0] ? [initial.files[0].id] : []) }, [initial.id])
  useEffect(() => {
    const online = () => setSaveState('saved'); const offline = () => setSaveState('offline')
    addEventListener('online', online); addEventListener('offline', offline)
    return () => { removeEventListener('online', online); removeEventListener('offline', offline) }
  }, [])

  const scheduleSave = (next: Project) => {
    if (readOnly) return
    setProject(next); setSaveState(navigator.onLine ? 'saving' : 'offline')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try { onPersist({ ...next, updatedAt: Date.now() }); setSaveState(navigator.onLine ? 'saved' : 'offline') } catch { setSaveState('failed') }
    }, 450)
  }
  const updateContent = (value = '') => { if (!active || readOnly) return; scheduleSave({ ...project, files: project.files.map(f => f.id === active.id ? { ...f, content: value } : f) }) }
  const openFile = (id: string) => { setActiveFileId(id); setTabs(t => t.includes(id) ? t : [...t, id]) }
  const addFile = () => { const path = prompt('File path, for example src/utils.js'); if (!path?.trim()) return; if (project.files.some(f => f.path === path.trim())) return alert('That file already exists.'); const f = { id: uid('file'), path: path.trim(), language: languageFor(path), content: '' }; scheduleSave({ ...project, files: [...project.files, f] }); openFile(f.id) }
  const rename = (f: FileItem) => { const path = prompt('Rename file', f.path); if (!path?.trim() || path === f.path) return; scheduleSave({ ...project, files: project.files.map(x => x.id === f.id ? { ...x, path: path.trim(), language: languageFor(path) } : x) }) }
  const remove = (f: FileItem) => { if (!confirm(`Delete ${f.path}? This cannot be undone.`)) return; const files = project.files.filter(x => x.id !== f.id); scheduleSave({ ...project, files }); setTabs(t => t.filter(id => id !== f.id)); if (activeFileId === f.id) setActiveFileId(files[0]?.id || '') }
  const closeTab = (id: string) => { const next = tabs.filter(x => x !== id); setTabs(next); if (id === activeFileId) setActiveFileId(next.at(-1) || '') }
  const run = () => {
    if (!active) return
    if (active.language !== 'javascript') { setOutput(`${active.language} execution needs a configured Judge0 server. This preview never fabricates execution results.`); setConsoleOpen(true); return }
    setRunning(true); setConsoleOpen(true); setOutput('Running…')
    const workerCode = `self.onmessage=e=>{const logs=[];const console={log:(...a)=>logs.push(a.map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(' ')),error:(...a)=>logs.push(a.join(' '))};try{new Function('console',e.data)(console);self.postMessage({ok:true,text:logs.join('\\n')||'Program completed with no output.'})}catch(err){self.postMessage({ok:false,text:err.name+': '+err.message})}}`
    const worker = new Worker(URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' })))
    const timeout = window.setTimeout(() => { worker.terminate(); setOutput('Execution stopped after 3 seconds.'); setRunning(false) }, 3000)
    worker.onmessage = e => { clearTimeout(timeout); setOutput(e.data.text); setRunning(false); worker.terminate() }
    worker.postMessage(active.content)
  }
  const share = async () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(project))))
    const url = `${location.origin}${location.pathname}#share=${data}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const field = document.createElement('textarea')
      field.value = url; field.style.position = 'fixed'; field.style.opacity = '0'
      document.body.appendChild(field); field.select(); document.execCommand('copy'); field.remove()
    }
    setShareNotice(true); setTimeout(() => setShareNotice(false), 1800)
  }
  const exportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project'}.canvas`
    link.click(); URL.revokeObjectURL(link.href)
  }

  return <main className="workspace">
    <header className="workspace-header">
      <button className="brand-button" onClick={onBack}><Brand compact /></button>
      <div className="project-crumb"><span>/</span><strong>{project.name}</strong>{readOnly && <small>Read only</small>}</div>
      <div className="workspace-actions">
        <button className="mobile-files" onClick={() => setSidebar(v => !v)}><Folder /> Files</button>
        <span className={`save-state ${saveState}`}>{saveState === 'saved' && <Check />}{saveState === 'saving' && <RotateCcw />}{saveState}</span>
        {!readOnly && <button className="toolbar-button export-button" onClick={exportProject}><Download /> Export</button>}
        {readOnly ? <button className="toolbar-button" onClick={onFork}><Copy /> Fork project</button> : <button className="toolbar-button" onClick={share}>{shareNotice ? <Check /> : <Share2 />}{shareNotice ? 'Link copied' : 'Share'}</button>}
        <button className="run-button" onClick={run} disabled={running || !active}><CirclePlay />{running ? 'Running' : 'Run'}</button>
      </div>
    </header>
    <div className={`workspace-grid ${sidebar ? '' : 'sidebar-closed'} ${consoleOpen ? '' : 'console-closed'}`}>
      <aside className="activity-bar"><button className="active" aria-label="Explorer"><FileCode2 /></button><button aria-label="Search"><Search /></button><button aria-label="Settings"><Settings2 /></button><button aria-label="Toggle sidebar" onClick={() => setSidebar(v => !v)}><PanelLeftClose /></button></aside>
      <aside className="explorer">
        <div className="panel-title"><span>Project</span>{!readOnly && <div><button onClick={addFile} aria-label="New file"><Plus /></button><button onClick={() => alert('Folders are created by including them in a file path, such as src/components/Button.tsx.')} aria-label="New folder"><FolderPlus /></button></div>}</div>
        <div className="root-name"><ChevronDown />{project.name}</div>
        <div className="file-tree">{project.files.map(f => <div className={`file-item ${f.id === activeFileId ? 'active' : ''}`} key={f.id}>
          <button onClick={() => openFile(f.id)}><FileCode2 /><span>{f.path}</span></button>
          {!readOnly && <span className="file-actions"><button onClick={() => rename(f)} title="Rename"><Settings2 /></button><button onClick={() => remove(f)} title="Delete"><Trash2 /></button></span>}
        </div>)}</div>
      </aside>
      <section className="editor-shell">
        <div className="tabs">{tabs.map(id => { const f = project.files.find(x => x.id === id); return f ? <div className={`tab ${id === activeFileId ? 'active' : ''}`} key={id} onClick={() => setActiveFileId(id)}><FileCode2 /><span>{f.path.split('/').pop()}</span><button onClick={e => { e.stopPropagation(); closeTab(id) }} aria-label={`Close ${f.path}`}><X /></button></div> : null })}</div>
        <div className="editor-area">{active ? <Suspense fallback={<div className="editor-loading"><Code2 /><span>Preparing the editor</span></div>}><Monaco height="100%" language={active.language} value={active.content} onChange={updateContent} theme="codecanvas" beforeMount={monaco => {
          monaco.editor.defineTheme('codecanvas', { base: 'vs-dark', inherit: true, rules: [
            { token: 'comment', foreground: '74766b', fontStyle: 'italic' }, { token: 'keyword', foreground: 'ef8e72' }, { token: 'string', foreground: 'b7cb8b' }, { token: 'number', foreground: 'e5c07b' }, { token: 'type', foreground: '96b8b3' }
          ], colors: { 'editor.background': '#171813', 'editor.foreground': '#d9d8cf', 'editorLineNumber.foreground': '#56584f', 'editorLineNumber.activeForeground': '#aaa99f', 'editorCursor.foreground': '#f2a17f', 'editor.selectionBackground': '#3d4435', 'editor.inactiveSelectionBackground': '#30342b', 'editorIndentGuide.background1': '#292a25', 'editorIndentGuide.activeBackground1': '#4a4c43' } })
        }} options={{ readOnly, minimap: { enabled: false }, fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace", fontSize: 14, lineHeight: 23, padding: { top: 18 }, smoothScrolling: true, scrollBeyondLastLine: false, renderLineHighlight: 'gutter', bracketPairColorization: { enabled: true }, automaticLayout: true }} /></Suspense> : <div className="empty-editor"><FileCode2 /><h2>No file is open</h2><p>Create a file or choose one from the explorer.</p>{!readOnly && <button onClick={addFile}>Create a file</button>}</div>}</div>
      </section>
      <section className="console-panel">
        <div className="console-head"><div><button className="active">Output</button><button>Problems</button></div><button onClick={() => setConsoleOpen(v => !v)} aria-label="Toggle output"><ChevronDown /></button></div>
        <pre className={output.includes('Error') || output.includes('needs') ? 'output-error' : ''}>{output}</pre>
      </section>
      <footer className="statusbar"><span><TerminalSquare /> {active?.language || 'No language'}</span><span>{active ? `${active.content.split('\n').length} lines` : ''}</span><span>UTF-8</span><span>{readOnly ? 'Shared project' : 'Local persistence'}</span></footer>
    </div>
  </main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
