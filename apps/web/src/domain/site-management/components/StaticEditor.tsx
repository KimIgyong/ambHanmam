import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Quote,
  Undo2,
  Redo2,
  Code2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface StaticEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function StaticEditor({ content, onChange, placeholder, minHeight = 400 }: StaticEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(content);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'max-w-full rounded' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline hover:text-indigo-800',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setRawHtml(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setRawHtml(content);
    }
  }, [content]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      e.target.value = '';
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<{ success: boolean; data: { storedName: string; originalName: string } }>(
          '/files/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        const baseURL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
        const imageUrl = `${baseURL}/files/${res.data.data.storedName}`;
        editor.chain().focus().setImage({ src: imageUrl, alt: res.data.data.originalName }).run();
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  const toggleHtmlMode = useCallback(() => {
    if (!editor) return;
    if (htmlMode) {
      // Switching from HTML mode back to WYSIWYG — apply raw HTML to editor
      editor.commands.setContent(rawHtml);
      onChange(rawHtml);
    } else {
      // Switching to HTML mode — sync current editor content
      setRawHtml(editor.getHTML());
    }
    setHtmlMode((prev) => !prev);
  }, [editor, htmlMode, rawHtml, onChange]);

  const handleRawHtmlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setRawHtml(value);
      onChange(value);
    },
    [onChange],
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="mx-1 h-5 w-px bg-gray-200" />;

  return (
    <div className="rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert Image (URL)">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
          isActive={uploading}
        >
          <Upload className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        {/* HTML mode toggle */}
        <button
          type="button"
          onClick={toggleHtmlMode}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            htmlMode
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Toggle HTML mode"
        >
          HTML
        </button>
      </div>

      {/* Editor content / HTML textarea */}
      {htmlMode ? (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          style={{ minHeight: `${minHeight}px` }}
          className="w-full resize-y rounded-b-lg border-0 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 outline-none focus:bg-white"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {/* Editor styles */}
      <style>{`
        .ProseMirror {
          min-height: ${minHeight}px;
          padding: 1rem;
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        /* Headings */
        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 2.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 2rem;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.75rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }

        /* Paragraph */
        .ProseMirror p {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
          line-height: 1.625;
        }

        /* Bold, Italic, etc. */
        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
          text-decoration: underline;
        }

        .ProseMirror s {
          text-decoration: line-through;
        }

        /* Inline code */
        .ProseMirror code {
          background-color: #f3f4f6;
          color: #e11d48;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
        }

        /* Code block */
        .ProseMirror pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          overflow-x: auto;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .ProseMirror pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }

        /* Blockquote */
        .ProseMirror blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          color: #4b5563;
          font-style: italic;
        }

        /* Lists */
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror li {
          margin-top: 0.125rem;
          margin-bottom: 0.125rem;
        }

        .ProseMirror li p {
          margin: 0;
        }

        /* Horizontal rule */
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }

        /* Links */
        .ProseMirror a {
          color: #4f46e5;
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a:hover {
          color: #3730a3;
        }

        /* Images */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
