import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Undo, Redo,
  ImageIcon, LinkIcon, Upload, Loader2, Code, Paperclip, HardDrive,
  List, ListOrdered, ListChecks,
} from 'lucide-react';
import { useEffect, useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { driveApiService } from '@/domain/drive/service/drive.service';
import { useDriveStatus, useRegisteredFolders } from '@/domain/drive/hooks/useDrive';
import DriveFilePickerModal from '@/components/common/DriveFilePickerModal';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import MentionPortalDropdown from '@/components/common/MentionPortalDropdown';
import WikiLink from './extensions/WikiLinkExtension';
import { meetingNoteService } from '../service/meeting-note.service';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  enableMention?: boolean;
}

export default function RichTextEditor({ content, onChange, placeholder, minHeight = '150px', maxHeight, enableMention = false }: RichTextEditorProps) {
  const { data: driveStatus } = useDriveStatus();
  const { data: registeredFolders = [] } = useRegisteredFolders();
  const driveConfigured = driveStatus?.configured && registeredFolders.length > 0;
  const uploadFolderId = registeredFolders.length > 0 ? registeredFolders[0].folderId : '';

  // Mention autocomplete state
  const { data: members } = useMemberList();
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const filteredMentionMembers = enableMention && members
    ? members.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 10)
    : [];

  // WikiLink autocomplete state
  const [showWikiLinkDropdown, setShowWikiLinkDropdown] = useState(false);
  const [wikiLinkQuery, setWikiLinkQuery] = useState('');
  const [wikiLinkResults, setWikiLinkResults] = useState<Array<{ id: string; type: string; title: string }>>([]);
  const [wikiLinkSelectedIndex, setWikiLinkSelectedIndex] = useState(0);
  const wikiLinkDropdownRef = useRef<HTMLDivElement>(null);
  const wikiLinkTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [wikiLinkPos, setWikiLinkPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: { class: 'max-w-full rounded' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-indigo-600 underline hover:text-indigo-800', target: '_blank', rel: 'noopener noreferrer' },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Write something...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      WikiLink,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());

      // WikiLink [[ detection
      {
        const { state } = editor;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(
          Math.max(0, from - 100),
          from,
          '\n',
        );
        const wikiMatch = textBefore.match(/\[\[([^\]\[]*)$/);
        if (wikiMatch) {
          setWikiLinkQuery(wikiMatch[1]);
          setShowWikiLinkDropdown(true);
          setWikiLinkSelectedIndex(0);
          // Calculate cursor position for dropdown
          try {
            const coords = editor.view.coordsAtPos(from);
            const editorRect = editor.view.dom.closest('.relative')?.getBoundingClientRect();
            if (editorRect) {
              setWikiLinkPos({
                top: coords.bottom - editorRect.top + 4,
                left: coords.left - editorRect.left,
              });
            }
          } catch { /* ignore */ }
        } else {
          setShowWikiLinkDropdown(false);
        }
      }

      // Mention detection
      if (enableMention) {
        const { state } = editor;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(
          Math.max(0, from - 50),
          from,
          '\n',
        );
        const atMatch = textBefore.match(/@([^\s@]*)$/);
        if (atMatch) {
          setMentionQuery(atMatch[1]);
          setShowMentionDropdown(true);
          setMentionSelectedIndex(0);
        } else {
          setShowMentionDropdown(false);
        }
      }
    },
    editorProps: {
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const allFiles = Array.from(event.dataTransfer.files);
          const images = allFiles.filter((f) => f.type.startsWith('image/'));
          const nonImages = allFiles.filter((f) => !f.type.startsWith('image/'));
          if (images.length > 0 || nonImages.length > 0) {
            event.preventDefault();
            images.forEach((file) => uploadAndInsertImage(file));
            nonImages.forEach((file) => uploadAndInsertFile(file));
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        // WikiLink dropdown keyboard handling
        if (showWikiLinkDropdown && wikiLinkResults.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setWikiLinkSelectedIndex((prev) =>
              prev < wikiLinkResults.length - 1 ? prev + 1 : 0,
            );
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setWikiLinkSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : wikiLinkResults.length - 1,
            );
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            selectWikiLink(wikiLinkResults[wikiLinkSelectedIndex]);
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setShowWikiLinkDropdown(false);
            return true;
          }
        }

        if (!enableMention || !showMentionDropdown || filteredMentionMembers.length === 0) return false;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setMentionSelectedIndex((prev) =>
            prev < filteredMentionMembers.length - 1 ? prev + 1 : 0,
          );
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setMentionSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredMentionMembers.length - 1,
          );
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          selectMentionMember(filteredMentionMembers[mentionSelectedIndex].name);
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setShowMentionDropdown(false);
          return true;
        }
        return false;
      },
    },
  });

  // Close image menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false);
      }
    };
    if (showImageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu]);

  // Close mention dropdown on outside click
  useEffect(() => {
    if (!enableMention || !showMentionDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (editorWrapperRef.current && !editorWrapperRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enableMention, showMentionDropdown]);

  // WikiLink search debounce
  useEffect(() => {
    if (!showWikiLinkDropdown) return;
    if (wikiLinkTimerRef.current) clearTimeout(wikiLinkTimerRef.current);
    wikiLinkTimerRef.current = setTimeout(async () => {
      if (wikiLinkQuery.length > 0) {
        try {
          const results = await meetingNoteService.linkAutocomplete(wikiLinkQuery);
          setWikiLinkResults(results);
          setWikiLinkSelectedIndex(0);
        } catch {
          setWikiLinkResults([]);
        }
      } else {
        setWikiLinkResults([]);
      }
    }, 200);
    return () => { if (wikiLinkTimerRef.current) clearTimeout(wikiLinkTimerRef.current); };
  }, [wikiLinkQuery, showWikiLinkDropdown]);

  // Close wiki link dropdown on outside click
  useEffect(() => {
    if (!showWikiLinkDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wikiLinkDropdownRef.current && !wikiLinkDropdownRef.current.contains(e.target as Node)) {
        setShowWikiLinkDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWikiLinkDropdown]);

  // Scroll to selected wiki link item
  useEffect(() => {
    if (showWikiLinkDropdown && wikiLinkDropdownRef.current) {
      const el = wikiLinkDropdownRef.current.children[wikiLinkSelectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [wikiLinkSelectedIndex, showWikiLinkDropdown]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  // Mention member selection
  const selectMentionMember = useCallback(
    (memberName: string) => {
      if (!editor) return;
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        '\n',
      );
      const atMatch = textBefore.match(/@([^\s@]*)$/);
      if (!atMatch) return;

      const deleteFrom = from - atMatch[0].length;
      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: from })
        .insertContent(`@${memberName} `)
        .run();
      setShowMentionDropdown(false);
    },
    [editor],
  );

  const selectWikiLink = useCallback(
    (item: { id: string; type: string; title: string }) => {
      if (!editor) return;
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 100),
        from,
        '\n',
      );
      const wikiMatch = textBefore.match(/\[\[([^\]\[]*)$/);
      if (!wikiMatch) return;

      const deleteFrom = from - wikiMatch[0].length;
      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: from })
        .insertContent({
          type: 'wikiLink',
          attrs: { id: item.id, type: item.type, text: item.title },
        })
        .insertContent(' ')
        .run();
      setShowWikiLinkDropdown(false);
    },
    [editor],
  );

  const getImageViewUrl = (fileId: string) => {
    const baseURL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
    return `${baseURL}/drive/files/${fileId}/view`;
  };

  const getLocalFileUrl = (storedName: string) => {
    const baseURL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
    return `${baseURL}/files/${storedName}`;
  };

  const getDownloadUrl = (storedName: string, originalName: string) => {
    const baseURL = (import.meta as any).env?.VITE_API_URL || '/api/v1';
    return `${baseURL}/files/${storedName}/download?name=${encodeURIComponent(originalName)}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        if (driveConfigured && uploadFolderId) {
          const result = await driveApiService.uploadFile(uploadFolderId, file);
          const imageUrl = getImageViewUrl(result.fileId);
          editor.chain().focus().setImage({ src: imageUrl, alt: result.name }).run();
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await apiClient.post<{ success: boolean; data: { storedName: string; originalName: string } }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const imageUrl = getLocalFileUrl(res.data.data.storedName);
          editor.chain().focus().setImage({ src: imageUrl, alt: res.data.data.originalName }).run();
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploading(false);
      }
    },
    [editor, driveConfigured, uploadFolderId],
  );

  const uploadAndInsertFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setAttachUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post<{ success: boolean; data: { storedName: string; originalName: string; fileSize: number } }>('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const { storedName, originalName, fileSize } = res.data.data;
        const downloadUrl = getDownloadUrl(storedName, originalName);
        const sizeStr = formatFileSize(fileSize);
        editor.chain().focus()
          .insertContent(`<a href="${downloadUrl}" target="_blank" rel="noopener noreferrer">\uD83D\uDCCE ${originalName} (${sizeStr})</a>&nbsp;`)
          .run();
      } catch (err) {
        console.error('File upload failed:', err);
      } finally {
        setAttachUploading(false);
      }
    },
    [editor],
  );

  const addImage = useCallback(() => {
    if (!editor) return;
    setShowImageMenu((prev) => !prev);
  }, [editor]);

  const handleImageUrlInsert = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShowImageMenu(false);
  }, [editor]);

  const handleImageFileSelect = useCallback(() => {
    fileInputRef.current?.click();
    setShowImageMenu(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          uploadAndInsertImage(file);
        }
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadAndInsertImage],
  );

  const handleAttachClick = useCallback(() => {
    attachInputRef.current?.click();
  }, []);

  const handleAttachChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      Array.from(files).forEach((file) => uploadAndInsertFile(file));
      if (attachInputRef.current) attachInputRef.current.value = '';
    },
    [uploadAndInsertFile],
  );

  const handleDriveFileSelect = useCallback(
    (files: Array<{ id: string; name: string; mimeType: string; size: string | null; webViewLink: string | null }>) => {
      if (!editor) return;
      files.forEach((file) => {
        const link = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
        const sizeNum = file.size ? Number(file.size) : 0;
        const sizeStr = sizeNum > 0 ? ` (${(sizeNum / 1024 / 1024).toFixed(1)}MB)` : '';
        const html = `<a href="${link}" target="_blank" rel="noopener noreferrer">📎 ${file.name}${sizeStr}</a>&nbsp;`;
        editor.chain().focus().insertContent(html).run();
      });
      setShowDrivePicker(false);
    },
    [editor],
  );

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

  const toggleSource = useCallback(() => {
    if (!editor) return;
    if (showSource) {
      editor.commands.setContent(sourceCode);
      onChange(sourceCode);
      setShowSource(false);
    } else {
      setSourceCode(editor.getHTML());
      setShowSource(true);
    }
  }, [editor, showSource, sourceCode, onChange]);

  const handleEditorDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleEditorDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (editorWrapperRef.current && !editorWrapperRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleEditorDrop = useCallback(() => {
    setIsDragOver(false);
  }, []);

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
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 ${
        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
    <div
      ref={editorWrapperRef}
      onDragOver={handleEditorDragOver}
      onDragLeave={handleEditorDragLeave}
      onDrop={handleEditorDrop}
      className={`relative flex flex-col overflow-hidden rounded-lg border transition-colors ${
        isDragOver
          ? 'border-indigo-500 ring-2 ring-indigo-200'
          : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500'
      }`}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-indigo-50/80 pointer-events-none">
          <div className="flex flex-col items-center gap-1 text-indigo-600">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">파일을 여기에 놓으세요</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight, overscrollBehavior: 'contain' }}>
      <div className="sticky top-0 z-10 bg-white flex flex-wrap items-center gap-1 border-b border-gray-200 px-2 py-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist">
          <ListChecks className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <div className="relative" ref={imageMenuRef}>
          <ToolbarButton onClick={addImage} title="Insert Image">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </ToolbarButton>
          {showImageMenu && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleImageFileSelect}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Upload className="h-4 w-4" />
                파일 업로드
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleImageUrlInsert}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LinkIcon className="h-4 w-4" />
                URL 입력
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <ToolbarButton onClick={handleAttachClick} title="Attach File">
          {attachUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </ToolbarButton>
        <input
          ref={attachInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.md"
          multiple
          className="hidden"
          onChange={handleAttachChange}
        />
        {driveConfigured && (
          <ToolbarButton onClick={() => setShowDrivePicker(true)} title="Google Drive">
            <HardDrive className="h-4 w-4" />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <ToolbarButton onClick={toggleSource} isActive={showSource} title="HTML Source">
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </div>
      {showSource ? (
        <textarea
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
          className={`w-full px-3 py-2 font-mono text-xs text-gray-700 outline-none`}
          style={{ minHeight }}
        />
      ) : (
        <div className="relative">
          <EditorContent editor={editor} className="prose prose-sm max-w-none px-3 py-2 [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0" style={{ minHeight }} />
          {enableMention && showMentionDropdown && filteredMentionMembers.length > 0 && (
            <MentionPortalDropdown
              anchorRef={editorWrapperRef}
              members={filteredMentionMembers}
              selectedIndex={mentionSelectedIndex}
              onSelect={selectMentionMember}
              onIndexChange={setMentionSelectedIndex}
            />
          )}
          {showWikiLinkDropdown && wikiLinkResults.length > 0 && (
            <div
              ref={wikiLinkDropdownRef}
              style={{ top: wikiLinkPos.top, left: Math.min(wikiLinkPos.left, 200) }}
              className="absolute z-50 max-h-48 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              {wikiLinkResults.map((item, idx) => {
                const typeColors: Record<string, string> = {
                  NOTE: 'text-indigo-600 bg-indigo-50',
                  TASK: 'text-purple-600 bg-purple-50',
                  ISSUE: 'text-red-600 bg-red-50',
                  PROJECT: 'text-green-600 bg-green-50',
                  MISSION: 'text-amber-600 bg-amber-50',
                };
                const colorClass = typeColors[item.type] || 'text-gray-600 bg-gray-50';
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-indigo-50 ${
                      idx === wikiLinkSelectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectWikiLink(item);
                    }}
                    onMouseEnter={() => setWikiLinkSelectedIndex(idx)}
                  >
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${colorClass}`}>
                      {item.type}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    {driveConfigured && (
      <DriveFilePickerModal
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onSelect={handleDriveFileSelect}
        multiple
      />
    )}
    </>
  );
}
