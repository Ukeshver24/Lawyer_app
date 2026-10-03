import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, CheckCircle2, X, Plus, Minus, AlertTriangle, 
  Sparkles, Edit3, Eye, RefreshCw, Check, Layers, ExternalLink,
  ZoomIn, ZoomOut, Rows, Columns, Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, Printer,
  Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Table as TableIcon, ChevronDown, Trash2,
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Strikethrough as StrikeIcon, Indent as IndentIcon, Outdent as OutdentIcon
} from 'lucide-react';
import { MOCK_CASES } from '../../data/adminMockData';
import TiptapEditor from '../../components/admin/TiptapEditor';
import { API_BASE_URL } from '../../config/api';

// Smooth, glitch-free multi-page editable document component
const EditablePage = React.memo(({
  pageIndex,
  pageNum,
  totalPages,
  title,
  initialHtml,
  onUpdateHtml,
  updateToolbarState,
  onContextMenu,
  onKeyDown
}) => {
  const contentRef = useRef(null);
  const lastHtmlRef = useRef(initialHtml);

  // Synchronize initial content safely without destroying active carets
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== initialHtml && lastHtmlRef.current !== initialHtml) {
      contentRef.current.innerHTML = initialHtml || '';
      lastHtmlRef.current = initialHtml || '';
    }
  }, [initialHtml]);

  useEffect(() => {
    if (contentRef.current && !contentRef.current.innerHTML) {
      contentRef.current.innerHTML = initialHtml || '';
      lastHtmlRef.current = initialHtml || '';
    }
  }, []);

  const handleInput = (e) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtmlRef.current = newHtml;
    onUpdateHtml(newHtml);
    updateToolbarState();
  };

  return (
    <div className="bg-white text-slate-900 w-full min-h-[1050px] shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-14 font-serif relative">
      {/* Page Header Badge */}
      <div className="flex justify-between items-center pb-3 mb-6 border-b border-slate-200 text-[11px] font-mono select-none">
        <span className="font-semibold text-slate-700 truncate max-w-md">
          {title}
        </span>
        <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
          Page {pageNum} of {totalPages}
        </span>
      </div>

      <div className="space-y-4">
        <div
          ref={contentRef}
          contentEditable="true"
          suppressContentEditableWarning
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onClick={updateToolbarState}
          onInput={handleInput}
          onContextMenu={onContextMenu}
          onKeyDown={onKeyDown}
          className="court-document-content font-serif text-[15px] leading-[1.85] text-slate-900 outline-none text-justify space-y-4 focus:ring-0 select-text min-h-[850px]"
          style={{ textAlign: 'justify', textJustify: 'inter-word', textAlignLast: 'left' }}
          title="Click to edit document text or table cells"
        />
      </div>
    </div>
  );
});

export default function AdminCaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    petitioner: '',
    respondent: '',
    court: 'Supreme Court of India',
    year: '2026',
    judgmentDate: '2026-04-12',
    bench: '',

    diaryNumber: '',
    act: '',
    section: '',

    summary: '',
    issues: '',
    importantPoints: '',
    judgmentText: '',

    status: 'Published',
    uploadedFiles: []
  });

  const [formError, setFormError] = useState('');

  // In-Memory PDF Extraction State (Zero Storage)
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [extractionSuccess, setExtractionSuccess] = useState(null);
  const pdfInputRef = useRef(null);

  // A4 Legal Document Format Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docEditData, setDocEditData] = useState({
    title: '',
    petitioner: '',
    respondent: '',
    court: 'Supreme Court of India',
    caseNumber: '',
    diaryNumber: '',
    bench: '',
    judgmentDate: '2026-04-12',
    act: '',
    section: '',
    summary: '',
    judgmentHtml: ''
  });
  const judgmentDocRef = useRef(null);
  const lastActiveCellRef = useRef(null);
  const lastSavedRangeRef = useRef(null);
  const [docZoom, setDocZoom] = useState(100);
  const [selectedFontFamily, setSelectedFontFamily] = useState('Times New Roman');
  const [selectedFontSize, setSelectedFontSize] = useState(14);
  const [isInTable, setIsInTable] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [tableMenuPos, setTableMenuPos] = useState({ top: 0, left: 0 });
  const tableBtnRef = useRef(null);
  const tableMenuRef = useRef(null);
  const [tableContextMenu, setTableContextMenu] = useState({ visible: false, x: 0, y: 0, cell: null, table: null });
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: true,
    orderedList: false,
    unorderedList: false
  });

  // Query and update active ribbon button states & track active cursor/table cell
  const updateToolbarState = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        orderedList: document.queryCommandState('insertOrderedList'),
        unorderedList: document.queryCommandState('insertUnorderedList')
      });

      // Query active font name
      try {
        const fontName = document.queryCommandValue('fontName');
        if (fontName) {
          const cleanFont = fontName.replace(/['"]/g, '');
          if (cleanFont) setSelectedFontFamily(cleanFont);
        }
      } catch (e) {}

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        lastSavedRangeRef.current = sel.getRangeAt(0);
        const node = sel.anchorNode;
        if (node) {
          const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
          if (el) {
            const cell = el.closest('td, th');
            const table = el.closest('table');
            setIsInTable(Boolean(cell || table));
            if (cell) {
              lastActiveCellRef.current = cell;
            }

            // Query active font size in points
            const computed = window.getComputedStyle(el);
            if (computed && computed.fontSize) {
              const px = parseFloat(computed.fontSize);
              const pt = Math.round(px * 0.75);
              if (pt >= 8 && pt <= 72) {
                setSelectedFontSize(pt);
              }
            }
          }
        }
      }
    } catch (e) {}
  }, []);

  // Listen for selection changes inside document
  useEffect(() => {
    const handleSelectionChange = () => {
      if (showDocModal) {
        updateToolbarState();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [showDocModal, updateToolbarState]);

  // Initialize editable DOM content once when modal opens
  useEffect(() => {
    if (showDocModal && judgmentDocRef.current) {
      judgmentDocRef.current.innerHTML = docEditData.judgmentHtml || '';
      updateToolbarState();
    }
  }, [showDocModal]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (
        tableMenuRef.current && 
        !tableMenuRef.current.contains(e.target) && 
        tableBtnRef.current && 
        !tableBtnRef.current.contains(e.target)
      ) {
        setTableMenuOpen(false);
      }
      if (tableContextMenu.visible) {
        setTableContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [tableContextMenu.visible]);

  // Toggle Table floating menu aligned to button
  const toggleTableMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tableMenuOpen && tableBtnRef.current) {
      const rect = tableBtnRef.current.getBoundingClientRect();
      setTableMenuPos({
        top: rect.bottom + 6,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 260))
      });
      setTableMenuOpen(true);
    } else {
      setTableMenuOpen(false);
    }
  };

  // MS Word-style Font Size Handler (Supports both selected text & typing at caret)
  const applyFontSize = (sizeInPt) => {
    const pt = Math.max(8, Math.min(72, parseInt(sizeInPt, 10) || 14));
    
    // Restore selection if lost
    if (lastSavedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(lastSavedRangeRef.current);
        } catch (e) {}
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelectedFontSize(pt);
      return;
    }

    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      // If cursor is blinking with no text selected:
      // Insert a span with zero-width space and place cursor inside it
      const span = document.createElement('span');
      span.style.fontSize = `${pt}pt`;
      span.innerHTML = '&#8203;';
      range.insertNode(span);
      
      const newRange = document.createRange();
      newRange.setStart(span.firstChild || span, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastSavedRangeRef.current = newRange;
      notifyDomChange(span);
    } else {
      // If text is selected across paragraphs or cells:
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('fontSize', false, '7');
      
      const markers = document.querySelectorAll('font[size="7"], span[style*="xxx-large"], span[style*="48px"]');
      markers.forEach(el => {
        if (el.tagName && el.tagName.toLowerCase() === 'font') {
          const span = document.createElement('span');
          span.style.fontSize = `${pt}pt`;
          span.innerHTML = el.innerHTML;
          el.parentNode?.replaceChild(span, el);
        } else {
          el.removeAttribute('size');
          el.style.fontSize = `${pt}pt`;
        }
      });
      
      if (sel.rangeCount > 0) {
        lastSavedRangeRef.current = sel.getRangeAt(0);
      }
      notifyDomChange(range.commonAncestorContainer);
    }

    setSelectedFontSize(pt);
    updateToolbarState();
  };

  // MS Word-style Font Family Handler
  const applyFontFamily = (fontName) => {
    if (lastSavedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(lastSavedRangeRef.current);
        } catch (e) {}
      }
    }

    document.execCommand('fontName', false, fontName);
    setSelectedFontFamily(fontName);

    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      notifyDomChange(sel.anchorNode);
    }
    updateToolbarState();
  };

  // Keyboard shortcut listener for Font Size (Ctrl/Cmd + Shift + > / <)
  const handleEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '>' || e.key === '.')) {
      e.preventDefault();
      applyFontSize(selectedFontSize + 1);
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '<' || e.key === ',')) {
      e.preventDefault();
      applyFontSize(selectedFontSize - 1);
    }
  };

  // MS Word-Style Contextual Table Helper: finds active table/cell or falls back to first table
  const getActiveTableContext = (targetCell = null) => {
    const validCell = (targetCell && typeof targetCell.closest === 'function') ? targetCell : null;
    if (validCell) {
      const row = validCell.closest('tr');
      const table = validCell.closest('table');
      return { table, row, cell: validCell, colIndex: validCell.cellIndex };
    }
    if (lastActiveCellRef.current && document.body.contains(lastActiveCellRef.current)) {
      const cell = lastActiveCellRef.current;
      const row = cell.closest('tr');
      const table = cell.closest('table');
      return { table, row, cell, colIndex: cell.cellIndex };
    }
    const sel = window.getSelection();
    let currentCell = null;
    if (sel && sel.anchorNode) {
      let node = sel.anchorNode;
      while (node && node !== document.body && node !== judgmentDocRef.current) {
        if (node.tagName === 'TD' || node.tagName === 'TH') {
          currentCell = node;
          break;
        }
        node = node.parentNode;
      }
    }

    if (currentCell) {
      const row = currentCell.parentElement;
      const table = row.closest('table');
      return { table, row, cell: currentCell, colIndex: currentCell.cellIndex };
    }

    const table = judgmentDocRef.current?.querySelector('table') || document.querySelector('.dlr-extracted-table');
    if (!table) return null;
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
    const firstCell = lastRow?.querySelector('td, th') || null;
    return { table, row: lastRow, cell: firstCell, colIndex: 0 };
  };

  const notifyDomChange = (element) => {
    if (!element) return;
    const container = element.closest ? element.closest('[contenteditable="true"]') : null;
    if (container) {
      container.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleInsertRowAbove = (customCell = null) => {
    let ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) {
      handleInsertNewTable();
      return;
    }
    const colCount = ctx.table.querySelector('tr') ? ctx.table.querySelector('tr').children.length : 2;
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.setAttribute('contenteditable', 'true');
      td.style.cursor = 'text';
      td.style.userSelect = 'text';
      td.innerHTML = '&nbsp;';
      td.style.padding = '10px 14px';
      td.style.border = '1px solid #cbd5e1';
      td.style.verticalAlign = 'top';
      newRow.appendChild(td);
    }
    if (ctx.row && ctx.row.parentElement) {
      ctx.row.parentElement.insertBefore(newRow, ctx.row);
    } else {
      (ctx.table.querySelector('tbody') || ctx.table).appendChild(newRow);
    }
    notifyDomChange(ctx.table);
    // Focus into first cell of new row
    const firstTd = newRow.querySelector('td');
    if (firstTd) {
      lastActiveCellRef.current = firstTd;
      const range = document.createRange();
      range.selectNodeContents(firstTd);
      range.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    setShowTableMenu(false);
  };

  const handleInsertRowBelow = (customCell = null) => {
    let ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) {
      handleInsertNewTable();
      return;
    }
    const colCount = ctx.table.querySelector('tr') ? ctx.table.querySelector('tr').children.length : 2;
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.setAttribute('contenteditable', 'true');
      td.style.cursor = 'text';
      td.style.userSelect = 'text';
      td.innerHTML = '&nbsp;';
      td.style.padding = '10px 14px';
      td.style.border = '1px solid #cbd5e1';
      td.style.verticalAlign = 'top';
      newRow.appendChild(td);
    }
    if (ctx.row && ctx.row.nextSibling) {
      ctx.row.parentElement.insertBefore(newRow, ctx.row.nextSibling);
    } else if (ctx.row && ctx.row.parentElement) {
      ctx.row.parentElement.appendChild(newRow);
    } else {
      (ctx.table.querySelector('tbody') || ctx.table).appendChild(newRow);
    }
    notifyDomChange(ctx.table);
    // Focus into first cell of new row
    const firstTd = newRow.querySelector('td');
    if (firstTd) {
      lastActiveCellRef.current = firstTd;
      const range = document.createRange();
      range.selectNodeContents(firstTd);
      range.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    setShowTableMenu(false);
  };

  const handleInsertColLeft = (customCell = null) => {
    let ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) {
      handleInsertNewTable();
      return;
    }
    const colIdx = ctx.colIndex ?? 0;
    const rows = ctx.table.querySelectorAll('tr');
    rows.forEach((r, idx) => {
      const isHeader = r.parentElement && r.parentElement.tagName === 'THEAD';
      const cell = document.createElement(isHeader || idx === 0 ? 'th' : 'td');
      cell.setAttribute('contenteditable', 'true');
      cell.style.cursor = 'text';
      cell.style.userSelect = 'text';
      cell.innerHTML = isHeader || idx === 0 ? 'Column' : '&nbsp;';
      cell.style.padding = '10px 14px';
      cell.style.border = '1px solid #cbd5e1';
      cell.style.verticalAlign = 'top';
      if (r.children[colIdx]) {
        r.insertBefore(cell, r.children[colIdx]);
      } else {
        r.appendChild(cell);
      }
    });
    notifyDomChange(ctx.table);
    setShowTableMenu(false);
  };

  const handleInsertColRight = (customCell = null) => {
    let ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) {
      handleInsertNewTable();
      return;
    }
    const colIdx = ctx.colIndex ?? 0;
    const rows = ctx.table.querySelectorAll('tr');
    rows.forEach((r, idx) => {
      const isHeader = r.parentElement && r.parentElement.tagName === 'THEAD';
      const cell = document.createElement(isHeader || idx === 0 ? 'th' : 'td');
      cell.setAttribute('contenteditable', 'true');
      cell.style.cursor = 'text';
      cell.style.userSelect = 'text';
      cell.innerHTML = isHeader || idx === 0 ? 'Column' : '&nbsp;';
      cell.style.padding = '10px 14px';
      cell.style.border = '1px solid #cbd5e1';
      cell.style.verticalAlign = 'top';
      if (r.children[colIdx + 1]) {
        r.insertBefore(cell, r.children[colIdx + 1]);
      } else {
        r.appendChild(cell);
      }
    });
    notifyDomChange(ctx.table);
    setShowTableMenu(false);
  };

  const handleDeleteRow = (customCell = null) => {
    const ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) return;
    const table = ctx.table;
    if (ctx.row) {
      ctx.row.remove();
    } else {
      const rows = table.querySelectorAll('tr');
      if (rows.length > 1) rows[rows.length - 1].remove();
    }
    notifyDomChange(table);
    setShowTableMenu(false);
  };

  const handleDeleteCol = (customCell = null) => {
    const ctx = getActiveTableContext(customCell);
    if (!ctx || !ctx.table) return;
    const table = ctx.table;
    const colIdx = ctx.colIndex !== undefined ? ctx.colIndex : (table.querySelector('tr')?.children.length - 1 || 0);
    const rows = table.querySelectorAll('tr');
    rows.forEach(r => {
      if (r.children[colIdx]) r.children[colIdx].remove();
    });
    notifyDomChange(table);
    setShowTableMenu(false);
  };

  const handleDeleteTable = (customTable = null) => {
    const ctx = getActiveTableContext();
    const table = customTable || ctx?.table;
    if (table) {
      const container = table.closest ? table.closest('[contenteditable="true"]') : null;
      table.remove();
      if (container) {
        container.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    setShowTableMenu(false);
  };

  const handleInsertNewTable = () => {
    const table = document.createElement('table');
    table.className = 'dlr-extracted-table';
    table.setAttribute('contenteditable', 'true');
    table.style.cssText = 'width: 100%; border-collapse: collapse; margin: 18px 0; font-family: "Times New Roman", serif; font-size: 14px;';
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f8fafc;">
          <th contenteditable="true" style="border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-weight: bold; width: 50%; cursor: text; user-select: text;">Statute / Law A</th>
          <th contenteditable="true" style="border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-weight: bold; width: 50%; cursor: text; user-select: text;">Comparison / Law B</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td contenteditable="true" style="border: 1px solid #cbd5e1; padding: 10px 14px; vertical-align: top; cursor: text; user-select: text;">Section description...</td>
          <td contenteditable="true" style="border: 1px solid #cbd5e1; padding: 10px 14px; vertical-align: top; cursor: text; user-select: text;">Corresponding law description...</td>
        </tr>
      </tbody>
    `;

    const sel = window.getSelection();
    let inserted = false;
    if (lastSavedRangeRef.current) {
      try {
        const range = lastSavedRangeRef.current;
        range.deleteContents();
        range.insertNode(table);
        inserted = true;
      } catch (e) {}
    }

    if (!inserted) {
      const activeContainer = document.querySelector('.court-document-content');
      if (activeContainer) {
        activeContainer.appendChild(table);
        inserted = true;
      } else if (judgmentDocRef.current) {
        judgmentDocRef.current.appendChild(table);
        inserted = true;
      }
    }

    notifyDomChange(table);

    // Focus into first table cell
    const firstTd = table.querySelector('tbody td');
    if (firstTd) {
      lastActiveCellRef.current = firstTd;
      const range = document.createRange();
      range.selectNodeContents(firstTd);
      range.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    setShowTableMenu(false);
  };

  // Right-click Context Menu handler on tables
  const handleDocumentContextMenu = (e) => {
    const cell = e.target.closest('td, th');
    const table = e.target.closest('table');
    if (cell || table) {
      e.preventDefault();
      lastActiveCellRef.current = cell;
      setTableContextMenu({
        visible: true,
        x: Math.min(e.clientX, window.innerWidth - 240),
        y: Math.min(e.clientY, window.innerHeight - 280),
        cell: cell,
        table: table
      });
    }
  };

  const handleExecCmd = (command, val = null) => {
    if (lastSavedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(lastSavedRangeRef.current);
        } catch (e) {}
      }
    } else if (judgmentDocRef.current) {
      judgmentDocRef.current.focus();
    }
    document.execCommand(command, false, val);
    updateToolbarState();
  };

  const handleChange = (field, value) => {
    if (formError) setFormError('');
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Citation Builder State
  const [citationInput, setCitationInput] = useState({
    year: '',
    month: '',
    court: '',
    number: '',
    equivalentText: ''
  });

  const [citationsList, setCitationsList] = useState([]);
  const [citationError, setCitationError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [loadingCase, setLoadingCase] = useState(isEditing);

  // Load existing case details when editing
  useEffect(() => {
    if (!isEditing || !id) {
      setLoadingCase(false);
      return;
    }

    let isMounted = true;
    setLoadingCase(true);

    const fetchCaseDetails = async () => {
      try {
        let caseItem = null;

        // 1. Try GET /api/cases/:id
        try {
          const res = await fetch(`${API_BASE_URL}/cases/${id}`);
          const data = await res.json();
          if (data.success && data.data) {
            caseItem = data.data;
          }
        } catch (e) {}

        // 2. Fallback: Try GET /api/cases and find matching ID
        if (!caseItem) {
          try {
            const listRes = await fetch(`${API_BASE_URL}/cases`);
            const listData = await listRes.json();
            if (listData.success && Array.isArray(listData.data)) {
              caseItem = listData.data.find(c => String(c.id) === String(id));
            }
          } catch (e) {}
        }

        // 3. Fallback: Try public search API
        if (!caseItem) {
          try {
            const publicRes = await fetch(`${API_BASE_URL}/public/cases/search?q=${encodeURIComponent(id)}`);
            const publicData = await publicRes.json();
            if (publicData.success && Array.isArray(publicData.data)) {
              caseItem = publicData.data.find(c => String(c.id) === String(id)) || publicData.data[0];
            }
          } catch (e) {}
        }

        if (isMounted && caseItem) {
          const rawDate = caseItem.judgment_date || caseItem.judgmentDate || '';
          let formattedDate = '2026-04-12';
          if (typeof rawDate === 'string' && rawDate.length >= 10) {
            formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.substring(0, 10);
          }

          const rawTitle = String(caseItem.title || '');
          const titleParts = rawTitle.includes(' vs ') ? rawTitle.split(' vs ') : (rawTitle.includes(' v. ') ? rawTitle.split(' v. ') : [rawTitle, '']);
          const petName = String(caseItem.petitioner_name || caseItem.petitioner || titleParts[0] || '').trim();
          const respName = String(caseItem.respondent_name || caseItem.respondent || titleParts[1] || '').trim();
          const cleanSummary = stripHtml(String(caseItem.head_note || caseItem.headNote || caseItem.summary || ''));
          const formattedJudgment = formatJustifiedParagraphs(String(caseItem.content || caseItem.judgment_text || caseItem.judgmentText || ''));

          setFormData({
            caseNumber: String(caseItem.case_number || caseItem.caseNumber || ''),
            title: rawTitle,
            petitioner: petName,
            respondent: respName,
            court: String(caseItem.court_name || caseItem.court || 'Supreme Court of India'),
            year: caseItem.year ? String(caseItem.year) : (formattedDate ? formattedDate.substring(0, 4) : '2026'),
            judgmentDate: formattedDate,
            bench: String(caseItem.bench || (Array.isArray(caseItem.judges) ? caseItem.judges.join(', ') : (caseItem.judges || ''))),

            diaryNumber: String(caseItem.diaryNumber || ''),
            act: String(caseItem.act || ''),
            section: String(caseItem.section || ''),

            summary: cleanSummary,
            issues: String(caseItem.issues || ''),
            importantPoints: String(caseItem.importantPoints || ''),
            judgmentText: formattedJudgment,

            status: String(caseItem.status || 'Published'),
            uploadedFiles: Array.isArray(caseItem.uploadedFiles) ? caseItem.uploadedFiles : []
          });

          if (caseItem.citations && Array.isArray(caseItem.citations)) {
            setCitationsList(caseItem.citations);
          } else if (caseItem.citation) {
            setCitationsList([{ id: Date.now(), number: String(caseItem.citation), year: String(caseItem.year || '') }]);
          }

          // Populate Document Editor state & open modal directly for editing
          setDocEditData({
            title: rawTitle || (petName && respName ? `${petName} vs. ${respName}` : ''),
            petitioner: petName,
            respondent: respName,
            court: String(caseItem.court_name || caseItem.court || 'Supreme Court of India'),
            caseNumber: String(caseItem.case_number || caseItem.caseNumber || ''),
            diaryNumber: String(caseItem.diaryNumber || ''),
            bench: String(caseItem.bench || (Array.isArray(caseItem.judges) ? caseItem.judges.join(', ') : (caseItem.judges || ''))),
            judgmentDate: formattedDate,
            year: caseItem.year ? String(caseItem.year) : (formattedDate ? formattedDate.substring(0, 4) : '2026'),
            act: String(caseItem.act || ''),
            section: String(caseItem.section || ''),
            summary: cleanSummary,
            judgmentHtml: formattedJudgment,
            totalPages: 14,
            pages: []
          });
        }
      } catch (err) {
        console.error('Failed to load case details for editing:', err);
      } finally {
        if (isMounted) setLoadingCase(false);
      }
    };

    fetchCaseDetails();

    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  // Live duplicate citation check (checks Number + Year + Month + Court)
  const checkDuplicateCitation = async (num, yr, mo, crt) => {
    if (!num || !num.trim()) {
      setCitationError('');
      return false;
    }
    const rawCleanNum = num.trim().replace(/^#+/, '').replace(/[^0-9a-zA-Z]/g, '');
    const cleanNum = rawCleanNum.replace(/^0+(?=\d)/, '');
    if (!cleanNum) {
      setCitationError('');
      return false;
    }

    const cleanYr = yr ? yr.trim().replace(/\D/g, '').slice(0, 4) : (formData.year || '2026');
    const cleanMo = mo ? mo.trim().replace(/\D/g, '').slice(0, 2) : (citationInput.month || '');
    const cleanCourt = crt ? crt.trim().toUpperCase().replace(/[^a-zA-Z]/g, '') : (citationInput.court ? citationInput.court.trim().toUpperCase().replace(/[^a-zA-Z]/g, '') : 'SC');

    // Month validation: 1 to 12
    if (cleanMo) {
      const moNum = parseInt(cleanMo, 10);
      if (moNum > 12 || moNum === 0) {
        setCitationError('Please enter a valid month between 01 and 12.');
        return true;
      }
    }

    const normMo = cleanMo ? cleanMo.replace(/^0+/, '') : '';
    const displayMo = normMo ? normMo.padStart(2, '0') : '';
    const moText = displayMo ? `(${displayMo}) ` : '';

    // 1. Instant 0ms check against citations list in current form
    const existsLocally = citationsList.some(c => {
      const rawCNum = String(c.number || '').trim().replace(/^#+/, '').replace(/[^0-9a-zA-Z]/g, '');
      const cNum = rawCNum.replace(/^0+(?=\d)/, '');
      const cYr = c.year ? String(c.year).trim() : (formData.year || '2026');
      const cMo = c.month ? String(c.month).trim().replace(/^0+/, '') : '';
      const cCourt = c.court ? String(c.court).trim().toUpperCase() : 'SC';

      const numMatch = cNum.toLowerCase() === cleanNum.toLowerCase();
      const yrMatch = !cleanYr || cYr === cleanYr;
      const moMatch = !normMo || cMo === normMo;
      const courtMatch = !cleanCourt || cCourt === cleanCourt;

      return numMatch && yrMatch && moMatch && courtMatch;
    });

    if (existsLocally) {
      setCitationError(`Citation #${cleanNum} has already been added to this case for ${cleanYr} ${moText}${cleanCourt}. Duplicate citations are not permitted.`);
      return true;
    }

    // 2. Real-time DB check via backend API (< 10ms)
    try {
      const url = `${API_BASE_URL}/cases/check-citation?number=${encodeURIComponent(cleanNum)}&year=${encodeURIComponent(cleanYr)}&month=${encodeURIComponent(normMo)}&court=${encodeURIComponent(cleanCourt)}${id ? `&excludeId=${encodeURIComponent(id)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.exists) {
        const caseDetail = data.matchedCase?.title ? ` in case "${data.matchedCase.title}"` : '';
        setCitationError(`Citation #${cleanNum} is already registered in the database for ${cleanYr} ${moText}${cleanCourt}${caseDetail}. Duplicate citations are not permitted.`);
        return true;
      }
    } catch (e) {
      console.warn('Citation check error:', e);
    }

    setCitationError('');
    return false;
  };

  const handleCitationFieldChange = (field, val) => {
    let sanitizedVal = val;
    if (field === 'year') {
      sanitizedVal = val.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'month') {
      sanitizedVal = val.replace(/\D/g, '').slice(0, 2);
    } else if (field === 'court') {
      sanitizedVal = val.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 10);
    } else if (field === 'number') {
      sanitizedVal = val.replace(/^#+/, '').replace(/[^0-9a-zA-Z]/g, '');
    }

    const updated = { ...citationInput, [field]: sanitizedVal };
    setCitationInput(updated);

    if (field === 'month' && sanitizedVal) {
      const mInt = parseInt(sanitizedVal, 10);
      if (mInt > 12 || mInt === 0) {
        setCitationError('Please enter a valid month between 01 and 12.');
        return;
      }
    }

    if (field === 'number' || field === 'year' || field === 'month' || field === 'court') {
      checkDuplicateCitation(
        field === 'number' ? sanitizedVal : updated.number,
        field === 'year' ? sanitizedVal : updated.year,
        field === 'month' ? sanitizedVal : updated.month,
        field === 'court' ? sanitizedVal : updated.court
      );
    }
  };

  const handleAddCitation = async () => {
    const rawNum = citationInput.number.trim().replace(/^#+/, '');
    if (!rawNum) {
      setCitationError("Please enter a citation number (#).");
      return;
    }

    const cleanYr = citationInput.year.trim().replace(/\D/g, '').slice(0, 4) || formData.year || '2026';
    const rawMo = citationInput.month.trim().replace(/\D/g, '').slice(0, 2);

    if (rawMo) {
      const moNum = parseInt(rawMo, 10);
      if (moNum > 12 || moNum === 0) {
        setCitationError('Please enter a valid month between 01 and 12.');
        return;
      }
    }

    const cleanMo = rawMo ? rawMo.replace(/^0+/, '').padStart(2, '0') : '';
    const cleanCourt = (citationInput.court.trim().replace(/[^a-zA-Z]/g, '') || 'SC').toUpperCase();
    const cleanNum = rawNum.replace(/[^0-9a-zA-Z]/g, '');
    const normNum = cleanNum.replace(/^0+(?=\d)/, '');

    const isDup = await checkDuplicateCitation(cleanNum, cleanYr, cleanMo, cleanCourt);
    if (isDup) {
      const moText = cleanMo ? `(${cleanMo}) ` : '';
      showToast(`Duplicate Citation: Citation #${normNum} is already registered for ${cleanYr} ${moText}${cleanCourt}.`);
      return;
    }

    const newCit = {
      id: Date.now(),
      year: cleanYr,
      month: cleanMo,
      court: cleanCourt,
      number: normNum,
      equivalentText: citationInput.equivalentText.trim()
    };
    setCitationsList(prev => [...prev, newCit]);
    setCitationError('');

    // Reset citation input fields to blank
    setCitationInput({
      year: '',
      month: '',
      court: '',
      number: '',
      equivalentText: ''
    });
  };

  const handleRemoveCitation = (citId) => {
    setCitationsList(prev => prev.filter(c => c.id !== citId));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: "Judgment PDF",
      date: "Today"
    }));
    setFormData(prev => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, ...newDocs] }));
  };

  const handleRemoveFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.id !== fileId)
    }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
      navigate('/admin/cases');
    }, 1500);
  };

  const stripHtml = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  const isRichTextEmpty = (html) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped.length === 0;
  };

  // Assembles fragmented lines into continuous, fully justified court paragraphs
  const formatJustifiedParagraphs = (html) => {
    if (!html || typeof html !== 'string') return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild;
    if (!container) return html;

    // Filter out ONLY stray page number artifacts, NEVER removing authentic running footers or footnotes
    const allElements = container.querySelectorAll('p, div, table');
    allElements.forEach(el => {
      if (el.classList.contains('dlr-page-running-footer') || 
          el.classList.contains('dlr-footnote-container') || 
          el.closest('.dlr-page-running-footer') || 
          el.closest('.dlr-footnote-container')) {
        return;
      }
      const txt = (el.textContent || '').trim();
      if (/^(?:Page\s*\d+\s*(?:of\s*\d+)?|\d+\s*\|\s*Page\s*\d+|\b\d+\s*of\s*\d+\b)$/i.test(txt) ||
          /^(?:Crl\.|Civ\.|Writ|Appeal|SLP|Diary)\s*.*?\|\s*Page\s*\d+/i.test(txt)) {
        el.remove();
      }
    });

    // If it was already structured HTML (contains paragraphs, tables, or divs), preserve directly
    if (container.children.length > 0) {
      return container.innerHTML.trim();
    }

    // Fallback for fragmented plain text lines
    const childNodes = Array.from(container.childNodes);
    let outputHtml = '';
    let currentParagraphText = '';
    let currentPrefix = '';

    const flush = () => {
      if (currentParagraphText.trim()) {
        const fullContent = currentParagraphText.replace(/\s+/g, ' ').trim();
        if (currentPrefix) {
          outputHtml += `<p style="text-align: justify; text-justify: inter-word; text-align-last: left; margin-bottom: 18px; line-height: 1.85; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 15px; color: #0f172a;"><strong>${currentPrefix}</strong> ${fullContent}</p>\n`;
        } else {
          outputHtml += `<p style="text-align: justify; text-justify: inter-word; text-align-last: left; margin-bottom: 18px; line-height: 1.85; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 15px; color: #0f172a;">${fullContent}</p>\n`;
        }
      }
      currentParagraphText = '';
      currentPrefix = '';
    };

    const processTextLine = (rawText, strongPrefix = null) => {
      if (!rawText) return;
      const clean = rawText.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      // Drop any standalone running header or footer lines from the body
      if (/^(?:Page\s*\d+\s*(?:of\s*\d+)?|\d+\s*\|\s*Page\s*\d+|\b\d+\s*of\s*\d+\b)$/i.test(clean) ||
          /^(?:Crl\.|Civ\.|Writ|Appeal|SLP|Diary)\s*.*?\|\s*Page\s*\d+/i.test(clean)) {
        return;
      }

      const isDate = /^\d{1,2}\s*[\.\/\-]\s*\d{1,2}\s*[\.\/\-]\s*\d{2,4}/.test(clean);
      let detectedPrefix = null;
      let body = clean;

      if (strongPrefix) {
        detectedPrefix = strongPrefix;
        if (body.startsWith(detectedPrefix)) {
          body = body.slice(detectedPrefix.length).trim();
        }
      } else if (!isDate) {
        const m = clean.match(/^(\d{1,3}\.|\(\d{1,3}\)|\[\d{1,3}\]|\([a-z]\))\s+([A-Za-z"“‘\(\[])/);
        if (m) {
          detectedPrefix = m[1].trim();
          body = clean.slice(m[1].length).trim();
        }
      }

      if (detectedPrefix) {
        flush();
        currentPrefix = detectedPrefix;
        currentParagraphText = body;
      } else {
        if (currentParagraphText) {
          if (currentParagraphText.endsWith('-')) {
            currentParagraphText = currentParagraphText.slice(0, -1) + clean;
          } else {
            currentParagraphText += ' ' + clean;
          }
        } else {
          currentParagraphText = clean;
        }
      }
    };

    childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName;
        const isStyledLegalDiv = tag === 'DIV' && (node.getAttribute('style') || node.children.length > 0);

        if (tag === 'TABLE' || tag === 'H2' || tag === 'H3' || tag === 'H4' || isStyledLegalDiv) {
          flush();
          outputHtml += node.outerHTML + '\n';
        } else if (tag === 'P' || tag === 'DIV' || tag === 'LI') {
          const strong = node.querySelector('strong, b');
          let strongPrefix = null;
          if (strong && /^\d{1,3}\./.test(strong.textContent.trim())) {
            strongPrefix = strong.textContent.trim();
          }
          processTextLine(node.textContent, strongPrefix);
        } else {
          processTextLine(node.textContent);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const lines = node.textContent.split('\n');
        lines.forEach(l => processTextLine(l));
      }
    });

    flush();
    return outputHtml.trim() || html;
  };

  // Universal In-Memory PDF Extraction (Zero Storage Guarantee)
  const handlePdfUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Please upload a valid PDF document (.pdf)');
      return;
    }

    setExtractingPdf(true);
    setPdfError('');
    setFormError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('pdf', file);

      const res = await fetch(`${API_BASE_URL}/cases/extract-pdf`, {
        method: 'POST',
        body: uploadFormData
      });

      const result = await res.json();

      if (!res.ok || result.status === 'error') {
        throw new Error(result.message || 'Failed to extract judgment data from PDF');
      }

      const ext = result.data || {};

      // 1. Autofill main case form state
      setFormData(prev => ({
        ...prev,
        caseNumber: ext.caseNumber || prev.caseNumber,
        title: ext.title || (ext.petitioner && ext.respondent ? `${ext.petitioner} vs. ${ext.respondent}` : prev.title),
        petitioner: ext.petitioner || prev.petitioner,
        respondent: ext.respondent || prev.respondent,
        court: ext.court || prev.court,
        judgmentDate: ext.judgmentDate || prev.judgmentDate,
        year: ext.year || (ext.judgmentDate ? ext.judgmentDate.substring(0, 4) : prev.year),
        bench: ext.bench || prev.bench,
        diaryNumber: ext.diaryNumber || prev.diaryNumber,
        act: ext.act || prev.act,
        section: ext.section || prev.section,
        summary: stripHtml(ext.summary || prev.summary),
        judgmentText: formatJustifiedParagraphs(ext.judgmentText || prev.judgmentText)
      }));

      // 2. Autofill citations if extracted
      if (Array.isArray(ext.citations) && ext.citations.length > 0) {
        setCitationsList(prev => {
          const existingNums = new Set(prev.map(c => String(c.number)));
          const newCits = ext.citations
            .filter(c => c && c.number && !existingNums.has(String(c.number)))
            .map((c, i) => ({
              id: Date.now() + i,
              year: c.year || ext.year || '2026',
              month: c.month || '',
              court: c.court || 'SC',
              number: String(c.number),
              equivalentText: c.equivalentText || ''
            }));
          return [...prev, ...newCits];
        });
      }

      // 3. Prepare editable data for the A4 PDF Document Modal
      setDocEditData({
        title: ext.title || (ext.petitioner && ext.respondent ? `${ext.petitioner} vs. ${ext.respondent}` : ''),
        petitioner: ext.petitioner || '',
        respondent: ext.respondent || '',
        court: ext.court || 'Supreme Court of India',
        caseNumber: ext.caseNumber || '',
        diaryNumber: ext.diaryNumber || '',
        bench: ext.bench || '',
        judgmentDate: ext.judgmentDate || '',
        year: ext.year || (ext.judgmentDate ? ext.judgmentDate.substring(0, 4) : '2026'),
        act: ext.act || '',
        section: ext.section || '',
        summary: stripHtml(ext.summary || ''),
        judgmentHtml: formatJustifiedParagraphs(ext.judgmentText || ''),
        totalPages: ext.totalPages || (ext.pages && ext.pages.length > 0 ? ext.pages.length : 14),
        pages: Array.isArray(ext.pages) && ext.pages.length > 0
          ? ext.pages.map(p => ({ ...p, html: formatJustifiedParagraphs(p.html) }))
          : []
      });

      setExtractionSuccess({
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        tablesCount: ext.extractedTablesCount || 0
      });

      // Automatically open the MS Word / A4 Document Editor modal for instant review & editing
      setShowDocModal(true);

    } catch (err) {
      console.error('PDF extraction failed:', err);
      setPdfError(err.message || 'Error extracting data from PDF');
    } finally {
      setExtractingPdf(false);
      // Zero Storage: reset input value immediately so no file is retained in browser memory
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleOpenDocModal = () => {
    setDocEditData(prev => ({
      ...prev,
      title: formData.title || (formData.petitioner && formData.respondent ? `${formData.petitioner} vs. ${formData.respondent}` : ''),
      petitioner: formData.petitioner || '',
      respondent: formData.respondent || '',
      court: formData.court || 'Supreme Court of India',
      caseNumber: formData.caseNumber || '',
      diaryNumber: formData.diaryNumber || '',
      bench: formData.bench || '',
      judgmentDate: formData.judgmentDate || '2026-04-12',
      year: formData.year || (formData.judgmentDate ? formData.judgmentDate.substring(0, 4) : '2026'),
      act: formData.act || '',
      section: formData.section || '',
      summary: stripHtml(formData.summary || ''),
      judgmentHtml: formatJustifiedParagraphs(formData.judgmentText || ''),
      totalPages: prev.totalPages || (prev.pages && prev.pages.length > 0 ? prev.pages.length : 14),
      pages: (prev.pages || []).map(p => ({ ...p, html: formatJustifiedParagraphs(p.html) }))
    }));
    setShowDocModal(true);
  };

  const handleUpdatePageHtml = (pageIndex, newHtml) => {
    setDocEditData(prev => {
      const updatedPages = [...(prev.pages || [])];
      if (updatedPages[pageIndex]) {
        updatedPages[pageIndex] = { ...updatedPages[pageIndex], html: newHtml };
      }
      const combinedHtml = updatedPages.map(p => p.html).filter(Boolean).join('\n');
      return {
        ...prev,
        pages: updatedPages,
        judgmentHtml: combinedHtml
      };
    });
  };

  const getLatestDocumentHtml = () => {
    // If multi-page A4 canvas is active in DOM, read live HTML directly from DOM nodes
    const pageNodes = document.querySelectorAll('.court-document-content');
    if (pageNodes && pageNodes.length > 0) {
      const pageHtmls = Array.from(pageNodes).map(node => node.innerHTML);
      return pageHtmls.filter(Boolean).join('\n');
    }
    if (docEditData.pages && docEditData.pages.length > 0) {
      return docEditData.pages.map(p => p.html).filter(Boolean).join('\n');
    }
    return judgmentDocRef.current ? judgmentDocRef.current.innerHTML : docEditData.judgmentHtml;
  };

  const handleApplyDocEdits = () => {
    const updatedHtml = getLatestDocumentHtml();
    
    setFormData(prev => ({
      ...prev,
      title: docEditData.title || prev.title,
      petitioner: docEditData.petitioner || prev.petitioner,
      respondent: docEditData.respondent || prev.respondent,
      court: docEditData.court || prev.court,
      caseNumber: docEditData.caseNumber || prev.caseNumber,
      diaryNumber: docEditData.diaryNumber || prev.diaryNumber,
      bench: docEditData.bench || prev.bench,
      judgmentDate: docEditData.judgmentDate || prev.judgmentDate,
      year: docEditData.judgmentDate ? docEditData.judgmentDate.substring(0, 4) : prev.year,
      act: docEditData.act || prev.act,
      section: docEditData.section || prev.section,
      summary: stripHtml(docEditData.summary || prev.summary),
      judgmentText: updatedHtml || docEditData.judgmentHtml || prev.judgmentText
    }));

    setShowDocModal(false);
    setToastMessage('Document edits synced to case form!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleApplyAndPublish = async () => {
    const updatedHtml = getLatestDocumentHtml();
    
    const updatedFormData = {
      ...formData,
      title: docEditData.title || formData.title,
      petitioner: docEditData.petitioner || formData.petitioner,
      respondent: docEditData.respondent || formData.respondent,
      court: docEditData.court || formData.court,
      caseNumber: docEditData.caseNumber || formData.caseNumber,
      diaryNumber: docEditData.diaryNumber || formData.diaryNumber,
      bench: docEditData.bench || formData.bench,
      judgmentDate: docEditData.judgmentDate || formData.judgmentDate,
      year: docEditData.judgmentDate ? docEditData.judgmentDate.substring(0, 4) : formData.year,
      act: docEditData.act || formData.act,
      section: docEditData.section || formData.section,
      summary: stripHtml(docEditData.summary || formData.summary),
      judgmentText: updatedHtml || docEditData.judgmentHtml || formData.judgmentText,
      status: 'Published'
    };

    setFormData(updatedFormData);
    setShowDocModal(false);

    await handleSave('Published', updatedFormData);
  };

  const handleSave = async (targetStatus, overrideData = null) => {
    setFormError('');
    const activeData = overrideData || formData;
    const finalStatus = targetStatus || activeData.status || 'Published';

    const cleanCaseNo = (activeData.caseNumber || '').trim();
    const cleanTitle = (activeData.title || '').trim();
    const cleanPetitioner = (activeData.petitioner || '').trim();
    const cleanRespondent = (activeData.respondent || '').trim();
    const isHeadNoteEmpty = isRichTextEmpty(activeData.summary);
    const isJudgmentTextEmpty = isRichTextEmpty(activeData.judgmentText);

    // Rule 1: Prevent completely empty case (applies to both Draft & Published)
    if (!cleanCaseNo && !cleanTitle && !cleanPetitioner && !cleanRespondent && isHeadNoteEmpty && isJudgmentTextEmpty) {
      setFormError('Cannot save an empty case! Please enter the case details before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Rule 2: Case Number is mandatory for all records
    if (!cleanCaseNo) {
      setFormError('Case Number is required. Please provide a valid case number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Rule 3: Must have at least Petitioner or Title
    if (!cleanTitle && !cleanPetitioner) {
      setFormError('Petitioner or Case Title is required to save the case.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Rule 4: Stricter checks for Published status
    if (finalStatus === 'Published') {
      if (!activeData.judgmentDate) {
        setFormError('Judgment Date is required to publish a case.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (isHeadNoteEmpty) {
        setFormError('Head Note is required to publish a case. Please provide a brief summary.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (isJudgmentTextEmpty) {
        setFormError('Full Judgment Text is required to publish a case.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Rule 5: Ensure no duplicate citations in citationsList against database
    for (const cit of citationsList) {
      if (cit && cit.number) {
        try {
          const rawCleanNum = String(cit.number).trim().replace(/^#+/, '').replace(/[^0-9a-zA-Z]/g, '');
          const cleanNum = rawCleanNum.replace(/^0+(?=\d)/, '');
          if (cleanNum) {
            const checkUrl = `${API_BASE_URL}/cases/check-citation?number=${encodeURIComponent(cleanNum)}&year=${encodeURIComponent(cit.year || activeData.year || '2026')}&month=${encodeURIComponent(cit.month || '')}&court=${encodeURIComponent(cit.court || 'SC')}${id ? `&excludeId=${encodeURIComponent(id)}` : ''}`;
            const checkRes = await fetch(checkUrl);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData && checkData.exists) {
                setFormError(`Cannot save case: ${checkData.message || 'Duplicate citation detected!'}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Citation duplicate check warning:', e);
        }
      }
    }

    try {
      const generatedTitle = cleanTitle || (cleanPetitioner && cleanRespondent ? `${cleanPetitioner} vs. ${cleanRespondent}` : (cleanPetitioner ? `${cleanPetitioner} Case` : cleanCaseNo));

      const payload = {
        caseNumber: cleanCaseNo,
        title: generatedTitle,
        petitioner: cleanPetitioner,
        respondent: cleanRespondent,
        court: activeData.court || 'Supreme Court of India',
        judgmentDate: activeData.judgmentDate || new Date().toISOString().split('T')[0],
        year: activeData.year || (activeData.judgmentDate ? activeData.judgmentDate.substring(0, 4) : '2026'),
        bench: activeData.bench || '',
        judges: activeData.bench ? [activeData.bench] : [],
        diaryNumber: activeData.diaryNumber || '',
        act: activeData.act || '',
        section: activeData.section || '',
        headNote: activeData.summary || '',
        summary: activeData.summary || '',
        head_note: activeData.summary || '',
        judgmentText: activeData.judgmentText || '',
        content: activeData.judgmentText || '',
        judgment_text: activeData.judgmentText || '',
        status: finalStatus,
        citations: citationsList
      };

      const url = isEditing ? `${API_BASE_URL}/cases/${id}` : `${API_BASE_URL}/cases`;
      const method = isEditing ? 'PUT' : 'POST';

      const adminToken = localStorage.getItem('adminToken');
      const adminSessionId = localStorage.getItem('adminSessionId');
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
      if (adminSessionId) headers['x-admin-session-id'] = adminSessionId;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { success: res.ok, message: `Server returned status ${res.status}` };
      }

      if (res.ok && data.success !== false) {
        showToast(isEditing ? `Case record updated successfully!` : `Case precedent published successfully!`);
      } else {
        setFormError(data.message || `Error saving case record (Status: ${res.status})`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error saving case:', err);
      setFormError(err.message ? `Error saving case: ${err.message}` : 'Failed to connect to backend API. Please ensure backend server is running.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loadingCase) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-600">Loading case precedent record for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 font-jakarta text-[#0B1727]">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <button
          onClick={() => navigate('/admin/cases')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to Cases</span>
        </button>

        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          {isEditing ? `Edit Case #${id}` : 'Legal Document Record Form'}
        </span>
      </div>

      {/* Form Title & Top Right Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-[#0B1727]">
            {isEditing ? 'Edit Legal Case Record' : 'Add Case Record'}
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Enter legal precedent information into the editorial research index.
          </p>
        </div>

        {/* TOP RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/cases')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          {isEditing ? (
            <>
              {formData.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => handleSave('Published')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
                >
                  Publish Case
                </button>
              )}
              {formData.status === 'Published' && (
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
                >
                  Move to Draft
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave(formData.status)}
                className="px-5 py-2 bg-[#0B1727] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                Update Case
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave('Draft')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave('Published')}
                className="px-5 py-2 bg-[#0B1727] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                Publish Case
              </button>
            </>
          )}
        </div>
      </div>

      {/* Validation Error Alert Banner */}
      {formError && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-bold flex items-center gap-3 shadow-xs animate-in fade-in">
          <AlertTriangle size={20} className="shrink-0 text-red-600" />
          <span className="flex-1 text-sm leading-snug">{formError}</span>
          <button 
            type="button" 
            onClick={() => setFormError('')} 
            className="text-red-500 hover:text-red-800 p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP CARD: DOCUMENT EDITOR (When Editing) OR UPLOAD PDF (When Adding)      */}
      {/* ========================================================================= */}
      {isEditing ? (
        /* Edit Mode: Dedicated Document Editor Card (In place of Upload PDF) */
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
                <FileText size={16} />
              </div>
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B1727]">
                  Precedent Document Editor
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  MS Word & Google Docs Style Live Legal Document Canvas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenDocModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Open Document Editor</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50/70 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold rounded">
                  {formData.court || 'Supreme Court of India'}
                </span>
                {formData.caseNumber && (
                  <span className="px-2 py-0.5 bg-slate-200/80 text-slate-800 text-[10px] font-mono font-bold rounded">
                    {formData.caseNumber}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-900 truncate">
                  {formData.title || 'Legal Precedent'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-serif line-clamp-1">
                {formData.summary ? formData.summary.slice(0, 140) + '...' : 'Live justified court formatting, cause title, editorial headnote, and comparative tables.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Add Mode: Upload PDF Card */
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-600">
                <Upload size={16} />
              </div>
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B1727]">
                Upload PDF
              </h2>
            </div>

            {/* Hidden File Input */}
            <input
              ref={pdfInputRef}
              id="admin-pdf-upload-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />

            {!extractingPdf && !extractionSuccess && (
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1727] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload PDF</span>
              </button>
            )}
          </div>

          {/* Dropzone Status & Content */}
          {extractingPdf ? (
            <div className="p-8 border-2 border-dashed border-blue-300 bg-blue-50/40 rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-700">Extracting content and tables from PDF...</p>
            </div>
          ) : extractionSuccess ? (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{extractionSuccess.fileName}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Extracted and auto-filled successfully</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenDocModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Review & Edit Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExtractionSuccess(null);
                    pdfInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  title="Upload another PDF"
                >
                  <RefreshCw size={13} />
                  <span>Re-upload</span>
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => pdfInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-slate-200 hover:border-primary-500 bg-slate-50/40 hover:bg-blue-50/30 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-blue-50 text-slate-400 group-hover:text-primary-600 flex items-center justify-center border border-slate-200 shadow-2xs transition-colors mb-2">
                <Upload size={18} />
              </div>
              <p className="text-xs font-bold text-slate-700 group-hover:text-primary-600">
                Drop PDF here or click to browse
              </p>
            </div>
          )}

          {/* PDF Extraction Error Notice */}
          {pdfError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-600" />
                <span>{pdfError}</span>
              </div>
              <button type="button" onClick={() => setPdfError('')} className="text-red-500 hover:text-red-700 p-0.5">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(isEditing ? formData.status : 'Published'); }} className="bg-white border border-slate-200/80 rounded-xl p-8 shadow-xs space-y-10">
        
        {/* SECTION 1: CASE INFORMATION */}
        <div className="space-y-5">
          <div className="pb-2 border-b border-slate-200">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B1727]">1. Case Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Case Number *</label>
              <input
                type="text"
                required
                value={formData.caseNumber}
                onChange={(e) => handleChange('caseNumber', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Petitioner / Appellant</label>
              <input
                type="text"
                value={formData.petitioner}
                onChange={(e) => handleChange('petitioner', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Respondent</label>
              <input
                type="text"
                value={formData.respondent}
                onChange={(e) => handleChange('respondent', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Court</label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => handleChange('court', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Act</label>
              <input
                type="text"
                value={formData.act}
                onChange={(e) => handleChange('act', e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judgment Date *</label>
              <input
                type="date"
                required
                value={formData.judgmentDate || ''}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const derivedYear = newDate ? newDate.substring(0, 4) : '';
                  setFormData(prev => ({ ...prev, judgmentDate: newDate, year: derivedYear }));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LEGAL REFERENCES (WITH CITATION BUILDER) */}
        <div className="space-y-6">
          <div className="pb-2 border-b border-slate-200">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0B1727]">2. Legal References</h2>
          </div>

          {/* CITATION BUILDER CONTAINER (Matching Exact Screenshot UI) */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-800">
                Citation <span className="text-red-500">*</span>
              </label>

              {citationsList.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500">
                  {citationsList.length} Citation{citationsList.length > 1 ? 's' : ''} Added
                </span>
              )}
            </div>

            {/* List of Added Citations */}
            {citationsList.length > 0 && (
              <div className="space-y-2 mb-3">
                {citationsList.map((cit) => (
                  <div key={cit.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 shadow-2xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-primary-700 font-extrabold">{cit.year} ({cit.month}) DLR ({cit.court}) #{cit.number}</span>
                      {cit.equivalentText && (
                        <>
                          <span className="text-slate-400 font-normal">:</span>
                          <span className="text-slate-700 font-semibold">{cit.equivalentText}</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCitation(cit.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove Citation"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Structured Composite Input Box */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block">Add New Citation</span>
              
              <div className={`bg-white border rounded-xl p-3 sm:px-4 sm:py-3 flex items-center gap-2 flex-wrap sm:flex-nowrap shadow-2xs transition-colors ${citationError ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}`}>
                
                {/* Year YYYY */}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={citationInput.year}
                  onChange={(e) => handleCitationFieldChange('year', e.target.value)}
                  placeholder="YYYY"
                  className="w-14 sm:w-16 border-b border-slate-300 text-center font-mono text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none pb-0.5"
                />

                {/* ( MM ) */}
                <div className="flex items-center font-mono text-xs text-slate-500 font-semibold">
                  <span>(</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={citationInput.month}
                    onChange={(e) => handleCitationFieldChange('month', e.target.value)}
                    placeholder="MM"
                    className="w-8 border-b border-slate-300 text-center font-mono text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none pb-0.5 mx-1"
                  />
                  <span>)</span>
                </div>

                {/* DLR Constant Label */}
                <span className="font-extrabold text-xs text-slate-900 px-1 tracking-tight">DLR</span>

                {/* ( SC ) */}
                <div className="flex items-center font-mono text-xs text-slate-500 font-semibold">
                  <span>(</span>
                  <input
                    type="text"
                    maxLength={10}
                    value={citationInput.court}
                    onChange={(e) => handleCitationFieldChange('court', e.target.value)}
                    placeholder="SC"
                    className="w-10 border-b border-slate-300 text-center font-mono text-xs font-bold text-slate-800 placeholder:text-slate-300 uppercase outline-none pb-0.5 mx-1"
                  />
                  <span>)</span>
                </div>

                {/* # Page/Citation Number */}
                <input
                  type="text"
                  value={citationInput.number}
                  onChange={(e) => handleCitationFieldChange('number', e.target.value)}
                  placeholder="#"
                  className={`w-12 sm:w-14 border-b text-center font-mono text-xs font-bold outline-none pb-0.5 ${citationError ? 'border-red-500 text-red-600 font-black' : 'border-slate-300 text-slate-800 placeholder:text-slate-300'}`}
                />

                {/* Colon : */}
                <span className="font-bold text-slate-400 px-0.5">:</span>

                {/* Equivalent Text */}
                <input
                  type="text"
                  value={citationInput.equivalentText}
                  onChange={(e) => handleCitationFieldChange('equivalentText', e.target.value)}
                  placeholder=""
                  className="flex-1 min-w-[180px] border-b border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 outline-none font-medium px-1 pb-0.5"
                />

              </div>
            </div>

            {/* Citation Duplicate Error Notice */}
            {citationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle size={16} className="shrink-0 text-red-600" />
                <span>{citationError}</span>
              </div>
            )}

            {/* + Add Citation Button (Bottom Right) */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCitation}
                disabled={Boolean(citationError)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Citation</span>
              </button>
            </div>

          </div>
        </div>

        {/* CASE CONTENT RICH TEXT EDITORS */}
        <div className="space-y-6">
          {/* Head Note * */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Head Note <span className="text-red-500">*</span>
            </label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              <TiptapEditor 
                content={formData.summary} 
                onChange={(val) => handleChange('summary', val)} 
                placeholder="" 
                minHeight="150px"
              />
            </div>
          </div>

          {/* Full Judgment Text * */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Full Judgment Text <span className="text-red-500">*</span>
            </label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs min-h-[280px]">
              <TiptapEditor 
                content={formData.judgmentText} 
                onChange={(val) => handleChange('judgmentText', val)} 
                placeholder="" 
                minHeight="280px"
              />
            </div>
          </div>
        </div>

      </form>

      {/* ========================================================================= */}
      {/* AUTHENTIC A4 LEGAL DOCUMENT MODAL (PDF LAW REPORT FORMAT & LIVE EDITOR)   */}
      {/* ========================================================================= */}
      {showDocModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#F1F5F9] w-screen h-screen flex flex-col overflow-hidden select-text animate-in fade-in duration-150">
          
          {/* Top Google Docs / MS Word Application Bar */}
          <div className="bg-white border-b border-slate-200 shrink-0 select-none shadow-xs">
            {/* Row 1: Document Title & Main Actions (Google Docs Style) */}
            <div className="px-5 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  title="Back to Case Form"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100/90 shrink-0">
                  <FileText size={17} />
                </div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={docEditData.title || docEditData.caseNumber || 'Supreme Court Legal Precedent'}
                    onChange={(e) => setDocEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 outline-none transition-all w-72 sm:w-96 truncate"
                    title="Click to rename document"
                    placeholder="Document Title"
                  />
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 px-1.5 font-medium">
                    <button type="button" onClick={() => handleExecCmd('undo')} className="hover:text-slate-900 cursor-pointer">Edit</button>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
                      <Check size={11} className="text-emerald-500" /> Live Editor
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleApplyDocEdits}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Save to Form</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyAndPublish}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B1727] hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Check size={14} />
                  <span>Save & Publish</span>
                </button>
              </div>
            </div>

            {/* Row 2: MS Word / Google Docs Ribbon Toolbar */}
            <div className="px-5 py-1.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs">
              {/* Group 1: Undo / Redo */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-600 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('undo')}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('redo')}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={13} />
                </button>
              </div>

              {/* Group 2: Zoom */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-600 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDocZoom(prev => Math.max(75, prev - 10))}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-xs font-mono font-semibold px-1.5 min-w-[42px] text-center select-none text-slate-700">
                  {docZoom}%
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDocZoom(prev => Math.min(130, prev + 10))}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 shrink-0"></div>

              {/* Group 3: Font Family Dropdown (MS Word Style) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-700 shadow-2xs">
                <select
                  value={selectedFontFamily}
                  onChange={(e) => applyFontFamily(e.target.value)}
                  className="text-xs font-serif font-medium text-slate-800 bg-transparent px-2 py-1 outline-none cursor-pointer rounded hover:bg-slate-50 transition-colors w-36"
                  title="Font Family"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Garamond">Garamond</option>
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              {/* Group 4: Font Size Controls (MS Word Style: A-, Size Dropdown, A+) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-700 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFontSize(selectedFontSize - 1)}
                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
                  title="Decrease Font Size (Ctrl+Shift+<)"
                >
                  A-
                </button>
                <select
                  value={selectedFontSize}
                  onChange={(e) => applyFontSize(Number(e.target.value))}
                  className="text-xs font-mono font-bold text-slate-800 bg-transparent px-1 py-0.5 text-center outline-none cursor-pointer rounded hover:bg-slate-50 transition-colors w-12"
                  title="Font Size (pt)"
                >
                  {[9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 48].map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFontSize(selectedFontSize + 1)}
                  className="w-6 h-6 flex items-center justify-center font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
                  title="Increase Font Size (Ctrl+Shift+>)"
                >
                  A+
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 shrink-0"></div>

              {/* Group 5: Font Styles */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-700 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('bold')}
                  className={`w-7 h-6 flex items-center justify-center font-bold rounded-md transition-colors cursor-pointer ${activeFormats.bold ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'}`}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('italic')}
                  className={`w-7 h-6 flex items-center justify-center italic font-serif rounded-md transition-colors cursor-pointer ${activeFormats.italic ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'}`}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('underline')}
                  className={`w-7 h-6 flex items-center justify-center underline rounded-md transition-colors cursor-pointer ${activeFormats.underline ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'}`}
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('strikeThrough')}
                  className={`w-7 h-6 flex items-center justify-center line-through rounded-md transition-colors cursor-pointer ${activeFormats.strikeThrough ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-700'}`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              {/* Group 6: Paragraph Alignment (Court Judgment Formatting) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-600 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('justifyLeft')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.justifyLeft ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Align Left"
                >
                  <AlignLeft size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('justifyCenter')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.justifyCenter ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Align Center (Court Title / Coram)"
                >
                  <AlignCenter size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('justifyRight')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.justifyRight ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Align Right"
                >
                  <AlignRight size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('justifyFull')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.justifyFull ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Justify (Court Order Standard)"
                >
                  <AlignJustify size={13} />
                </button>
              </div>

              {/* Group 7: Lists & Indentation */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-slate-600 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('insertOrderedList')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.orderedList ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Numbered List"
                >
                  <ListOrdered size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('insertUnorderedList')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${activeFormats.unorderedList ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'}`}
                  title="Bullet List"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('outdent')}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Decrease Indent"
                >
                  <OutdentIcon size={13} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleExecCmd('indent')}
                  className="p-1.5 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Increase Indent"
                >
                  <IndentIcon size={13} />
                </button>
              </div>

              <div className="w-[1px] h-5 bg-slate-200 shrink-0"></div>

              {/* Group 8: Table Trigger (Unclipped Floating Dropdown) */}
              <button
                ref={tableBtnRef}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleTableMenu}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  tableMenuOpen 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                    : (isInTable ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-bold' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs')
                }`}
                title="Table Tools (Add Row, Column, Delete)"
              >
                <TableIcon size={13} className={tableMenuOpen ? 'text-white' : (isInTable ? 'text-blue-600' : 'text-slate-600')} />
                <span>Table</span>
                <ChevronDown size={12} className={`transition-transform duration-150 ${tableMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Paginated Multi-Page A4 Canvas (Google Docs / MS Word Desktop Canvas) */}
          <div className="flex-1 py-8 px-4 bg-[#F1F5F9] overflow-y-auto overscroll-contain scroll-smooth">
            <div 
              className="max-w-4xl mx-auto space-y-10 pb-4 transition-all duration-150"
              style={{ zoom: `${docZoom}%` }}
            >
              
              {/* Paginated Multi-Page A4 Canvas (Exact Pages as Uploaded from PDF) */}
              {docEditData.pages && docEditData.pages.length > 0 ? (
                docEditData.pages.map((page, pIdx) => (
                  <EditablePage
                    key={pIdx}
                    pageIndex={pIdx}
                    pageNum={page.pageNum || (pIdx + 1)}
                    totalPages={docEditData.totalPages || docEditData.pages.length}
                    title={docEditData.title || docEditData.caseNumber || 'Court Judgment'}
                    initialHtml={page.html}
                    onUpdateHtml={(newHtml) => handleUpdatePageHtml(pIdx, newHtml)}
                    updateToolbarState={updateToolbarState}
                    onContextMenu={handleDocumentContextMenu}
                    onKeyDown={handleEditorKeyDown}
                  />
                ))
              ) : (
                <div className="bg-white text-slate-900 w-full min-h-[1050px] shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-14 font-serif relative">
                  <div
                    ref={judgmentDocRef}
                    contentEditable="true"
                    suppressContentEditableWarning
                    onKeyUp={updateToolbarState}
                    onMouseUp={updateToolbarState}
                    onClick={updateToolbarState}
                    onInput={updateToolbarState}
                    onContextMenu={handleDocumentContextMenu}
                    onKeyDown={handleEditorKeyDown}
                    className="court-document-content font-serif text-[15px] leading-[1.85] text-slate-900 outline-none text-justify space-y-4 focus:ring-0 select-text min-h-[700px]"
                    style={{ textAlign: 'justify', textJustify: 'inter-word', textAlignLast: 'left' }}
                    title="Click to edit document text"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Floating MS Word Right-Click Context Menu for Tables */}
          {tableContextMenu.visible && (
            <div 
              style={{ left: `${tableContextMenu.x}px`, top: `${tableContextMenu.y}px` }}
              className="fixed z-[100000] w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Table Options
              </div>
              <button 
                type="button"
                onClick={() => { handleInsertRowAbove(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowUp size={13} className="text-blue-600" />
                <span>Insert Row Above</span>
              </button>
              <button 
                type="button"
                onClick={() => { handleInsertRowBelow(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowDown size={13} className="text-blue-600" />
                <span>Insert Row Below</span>
              </button>
              <button 
                type="button"
                onClick={() => { handleInsertColLeft(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowLeftIcon size={13} className="text-blue-600" />
                <span>Insert Column Left</span>
              </button>
              <button 
                type="button"
                onClick={() => { handleInsertColRight(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowRightIcon size={13} className="text-blue-600" />
                <span>Insert Column Right</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-1"></div>
              <button 
                type="button"
                onClick={() => { handleDeleteRow(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Minus size={13} className="text-red-500" />
                <span>Delete Selected Row</span>
              </button>
              <button 
                type="button"
                onClick={() => { handleDeleteCol(tableContextMenu.cell); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Minus size={13} className="text-red-500" />
                <span>Delete Selected Column</span>
              </button>
              <button 
                type="button"
                onClick={() => { handleDeleteTable(tableContextMenu.table); setTableContextMenu(prev => ({ ...prev, visible: false })); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Trash2 size={13} className="text-red-500" />
                <span>Delete Entire Table</span>
              </button>
            </div>
          )}

          {/* Floating MS Word Table Options Menu (Triggered from Toolbar Table button - Unclipped) */}
          {tableMenuOpen && (
            <div 
              ref={tableMenuRef}
              style={{ left: `${tableMenuPos.left}px`, top: `${tableMenuPos.top}px` }}
              className="fixed z-[100005] w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
                <span>Table Controls</span>
                {isInTable && <span className="text-[10px] text-emerald-600 font-bold lowercase bg-emerald-50 px-1.5 py-0.5 rounded">cell active</span>}
              </div>
              
              <button 
                type="button"
                onClick={() => { handleInsertRowBelow(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowDown size={13} className="text-blue-600" />
                <span>Insert Row Below</span>
              </button>
              
              <button 
                type="button"
                onClick={() => { handleInsertRowAbove(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowUp size={13} className="text-blue-600" />
                <span>Insert Row Above</span>
              </button>
              
              <button 
                type="button"
                onClick={() => { handleInsertColRight(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowRightIcon size={13} className="text-blue-600" />
                <span>Insert Column Right</span>
              </button>
              
              <button 
                type="button"
                onClick={() => { handleInsertColLeft(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer transition-colors"
              >
                <ArrowLeftIcon size={13} className="text-blue-600" />
                <span>Insert Column Left</span>
              </button>
              
              <div className="h-[1px] bg-slate-100 my-1"></div>
              
              <button 
                type="button"
                onClick={() => { handleInsertNewTable(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 text-slate-700 text-left cursor-pointer transition-colors"
              >
                <TableIcon size={13} className="text-slate-600" />
                <span>Insert 2x2 Comparison Table</span>
              </button>
              
              <div className="h-[1px] bg-slate-100 my-1"></div>
              
              <button 
                type="button"
                onClick={() => { handleDeleteRow(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Minus size={13} className="text-red-500" />
                <span>Delete Selected Row</span>
              </button>
              
              <button 
                type="button"
                onClick={() => { handleDeleteCol(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Minus size={13} className="text-red-500" />
                <span>Delete Selected Column</span>
              </button>
              
              <button 
                type="button"
                onClick={() => { handleDeleteTable(); setTableMenuOpen(false); }} 
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-left cursor-pointer transition-colors"
              >
                <Trash2 size={13} className="text-red-500" />
                <span>Delete Entire Table</span>
              </button>
            </div>
          )}

        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1727] text-white font-bold text-xs px-5 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
