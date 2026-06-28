import { useEffect, useRef, useState, ReactNode } from 'react';
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  Quote, Link2, Image as ImageIcon, Eye, Code2, Pilcrow, Strikethrough
} from 'lucide-react';
import { uploadAsset } from '../utils/storage';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync editor HTML when entering visual mode (avoids caret jumps while typing).
  useEffect(() => {
    if (mode === 'visual' && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [mode]);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('URL do link:', 'https://');
    if (url) exec('createLink', url);
  };

  const insertImageUrl = (url: string) => {
    editorRef.current?.focus();
    document.execCommand('insertImage', false, url);
    emit();
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAsset(file, 'blog');
      insertImageUrl(url);
    } catch (e) {
      window.alert('Falha no upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap bg-slate-50 border-b border-slate-200 px-2 py-1.5">
        {mode === 'visual' && (
          <>
            <Btn onClick={() => exec('bold')} title="Negrito"><Bold className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('italic')} title="Itálico"><Italic className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('underline')} title="Sublinhado"><Underline className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('strikeThrough')} title="Tachado"><Strikethrough className="h-4 w-4" /></Btn>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <Btn onClick={() => exec('formatBlock', '<h2>')} title="Título 2"><Heading2 className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('formatBlock', '<h3>')} title="Título 3"><Heading3 className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('formatBlock', '<p>')} title="Parágrafo"><Pilcrow className="h-4 w-4" /></Btn>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <Btn onClick={() => exec('insertUnorderedList')} title="Lista"><List className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('insertOrderedList')} title="Lista numerada"><ListOrdered className="h-4 w-4" /></Btn>
            <Btn onClick={() => exec('formatBlock', '<blockquote>')} title="Citação"><Quote className="h-4 w-4" /></Btn>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <Btn onClick={addLink} title="Link"><Link2 className="h-4 w-4" /></Btn>
            <Btn onClick={() => fileRef.current?.click()} title="Imagem">
              <ImageIcon className="h-4 w-4" />
            </Btn>
            {uploading && <span className="text-[10px] text-slate-400 font-semibold ml-1">enviando...</span>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0])} />
          </>
        )}
        <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${mode === 'visual' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Eye className="h-3.5 w-3.5" /> Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${mode === 'html' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Code2 className="h-3.5 w-3.5" /> HTML
          </button>
        </div>
      </div>

      {/* Editor area */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="blog-content min-h-[280px] max-h-[520px] overflow-y-auto p-4 text-sm text-slate-800 focus:outline-none leading-relaxed"
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[280px] max-h-[520px] p-4 text-xs font-mono text-slate-800 focus:outline-none resize-y"
          placeholder="<p>Escreva ou cole HTML aqui...</p>"
        />
      )}
    </div>
  );
}
