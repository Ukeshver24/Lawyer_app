import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, 
  List, ListOrdered, Link as LinkIcon, Unlink, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Undo, Redo
} from 'lucide-react'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Mark, mergeAttributes } from '@tiptap/core'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const InlineHeading = Mark.create({
  name: 'inlineHeading',

  addAttributes() {
    return {
      level: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-level'), 10) || 1,
        renderHTML: attributes => {
          if (attributes.level === 1) {
            return { 'data-level': 1, class: 'text-2xl font-bold text-slate-900 leading-snug inline-block' }
          }
          if (attributes.level === 2) {
            return { 'data-level': 2, class: 'text-xl font-bold text-slate-900 leading-snug inline-block' }
          }
          return { 'data-level': 3, class: 'text-lg font-bold text-slate-900 leading-snug inline-block' }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-level]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleInlineHeading: attributes => ({ commands }) => {
        return commands.toggleMark('inlineHeading', attributes)
      },
    }
  },
})

const CustomLink = Link.extend({
  inclusive: false,
})

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const Button = ({ onClick, isActive, disabled, children, title }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center min-w-[28px] h-7 text-xs font-bold",
        isActive 
          ? "bg-slate-200/90 text-slate-900 shadow-2xs font-extrabold" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
      )}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-[1px] h-4 bg-slate-300/80 mx-1 self-center" />

  const linkMarkType = editor.schema.marks.link
  const { from, to } = editor.state.selection
  const isLinkActive = editor.isActive('link') || (
    Boolean(linkMarkType) && (
      from === to 
        ? editor.isActive('link') 
        : editor.state.doc.rangeHasMark(from, to, linkMarkType)
    )
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-200/90 bg-[#F8FAFC]">
      {/* 1. Basic Inline Formatting (B, I, U) */}
      <Button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={15} strokeWidth={2.5} />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={15} strokeWidth={2.5} />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon size={15} strokeWidth={2.5} />
      </Button>

      <Divider />

      {/* 2. Hyperlink & Unlink Controls */}
      <Button
        onClick={() => {
          if (isLinkActive) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }
          const previousUrl = editor.getAttributes('link').href || ''
          const url = window.prompt('Enter Web URL:', previousUrl || 'https://')
          
          if (url === null) return
          if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }

          const formattedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
          if (from === to) {
            editor.chain().focus().insertContent(`<a href="${formattedUrl}">${formattedUrl}</a>`).run()
          } else {
            editor.chain().focus().setLink({ href: formattedUrl }).run()
          }
        }}
        isActive={isLinkActive}
        title="Insert Hyperlink"
      >
        <LinkIcon size={15} strokeWidth={2} />
      </Button>

      <Button
        onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
        disabled={!isLinkActive}
        title="Remove Hyperlink"
      >
        <Unlink size={15} strokeWidth={2} />
      </Button>

      <Divider />

      {/* 3. Headings (H1, H2, H3) */}
      <Button 
        onClick={() => editor.chain().focus().toggleInlineHeading({ level: 1 }).run()} 
        isActive={editor.isActive('inlineHeading', { level: 1 })}
        title="Heading 1"
      >
        <span className="font-bold text-xs">H1</span>
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleInlineHeading({ level: 2 }).run()} 
        isActive={editor.isActive('inlineHeading', { level: 2 })}
        title="Heading 2"
      >
        <span className="font-bold text-xs">H2</span>
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleInlineHeading({ level: 3 }).run()} 
        isActive={editor.isActive('inlineHeading', { level: 3 })}
        title="Heading 3"
      >
        <span className="font-bold text-xs">H3</span>
      </Button>

      <Divider />

      {/* 4. Lists (Bullet & Numbered) */}
      <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
        <List size={15} strokeWidth={2} />
      </Button>
      <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
        <ListOrdered size={15} strokeWidth={2} />
      </Button>

      <Divider />

      {/* 5. Text Alignments (Left, Center, Right, Justify) */}
      <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <AlignLeft size={15} strokeWidth={2} />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <AlignCenter size={15} strokeWidth={2} />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <AlignRight size={15} strokeWidth={2} />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify Text">
        <AlignJustify size={15} strokeWidth={2} />
      </Button>

      <Divider />

      {/* 6. History Undo / Redo */}
      <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <Undo size={15} strokeWidth={2} />
      </Button>
      <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} title="Redo (Ctrl+Y)">
        <Redo size={15} strokeWidth={2} />
      </Button>
    </div>
  )
}

export default function TiptapEditor({ content, onChange, placeholder, minHeight = '160px' }) {
  const [, setForceUpdate] = React.useState(0);
  const [useRawTextarea, setUseRawTextarea] = React.useState(false);
  const initialLoadedRef = React.useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      InlineHeading,
      Underline,
      CustomLink.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'dlr-extracted-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '',
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onTransaction: () => {
      setForceUpdate(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none p-4 text-slate-900 leading-relaxed font-sans min-h-[140px] select-text',
        ),
      },
      transformPastedHTML(html) {
        if (!html) return '';
        // Strip inline white/transparent text colors copied from Word/PDF/websites
        return html
          .replace(/color\s*:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\)|transparent)/gi, 'color: #0f172a')
          .replace(/background(-color)?\s*:\s*[^;"]+/gi, '');
      },
      transformPastedText(text) {
        return text || '';
      }
    },
  });

  // Load external content safely ONLY when initially mounting or when user is NOT focused
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      if (!initialLoadedRef.current || (!editor.isFocused && (content || '') !== editor.getHTML())) {
        try {
          editor.commands.setContent(content || '', false);
          initialLoadedRef.current = true;
        } catch (e) {
          console.warn('Tiptap setContent sync caught:', e);
        }
      }
    }
  }, [content, editor]);

  return (
    <div 
      className="flex flex-col border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all relative group select-text"
      style={{ minHeight }}
    >
      <div className="border-b border-slate-200/90 bg-[#F8FAFC]">
        <MenuBar editor={editor} />
      </div>

      <div 
        className="flex-1 overflow-y-auto bg-white cursor-text p-1 select-text"
        onClick={(e) => {
          if (editor && !editor.isFocused && e.button === 0) {
            editor.commands.focus();
          }
        }}
      >
        <EditorContent editor={editor} className="select-text" />
      </div>

      {/* Resize Grip Icon */}
      <div className="absolute bottom-1 right-1 pointer-events-none text-slate-300 opacity-60">
        <svg width="10" h="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M8 2L2 8M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
