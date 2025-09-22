import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

const TiptapEditor = ({ value, onChange, placeholder = "Digite seu texto aqui..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  };

  const addColumnBefore = () => {
    if (editor) {
      editor.chain().focus().addColumnBefore().run();
    }
  };

  const addColumnAfter = () => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const deleteColumn = () => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
    }
  };

  const addRowBefore = () => {
    if (editor) {
      editor.chain().focus().addRowBefore().run();
    }
  };

  const addRowAfter = () => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  };

  const deleteRow = () => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
    }
  };

  const deleteTable = () => {
    if (editor) {
      editor.chain().focus().deleteTable().run();
    }
  };

  const toggleHeaderColumn = () => {
    if (editor) {
      editor.chain().focus().toggleHeaderColumn().run();
    }
  };

  const toggleHeaderRow = () => {
    if (editor) {
      editor.chain().focus().toggleHeaderRow().run();
    }
  };

  const toggleHeaderCell = () => {
    if (editor) {
      editor.chain().focus().toggleHeaderCell().run();
    }
  };

  const mergeCells = () => {
    if (editor) {
      editor.chain().focus().mergeCells().run();
    }
  };

  const splitCell = () => {
    if (editor) {
      editor.chain().focus().splitCell().run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2">
        {/* Formatação básica */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm font-medium italic ${
              editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1 rounded text-sm font-medium line-through ${
              editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            S
          </button>
        </div>

        {/* Cabeçalhos */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            H3
          </button>
        </div>

        {/* Listas */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            • Lista
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            1. Lista
          </button>
        </div>

        {/* Tabelas */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            onClick={insertTable}
            className="px-3 py-1 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600"
          >
            📊 Tabela
          </button>
          
          {editor.isActive('table') && (
            <>
              <button
                onClick={addColumnBefore}
                className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                title="Adicionar coluna antes"
              >
                ← Col
              </button>
              <button
                onClick={addColumnAfter}
                className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                title="Adicionar coluna depois"
              >
                Col →
              </button>
              <button
                onClick={deleteColumn}
                className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                title="Deletar coluna"
              >
                ✕ Col
              </button>
              <button
                onClick={addRowBefore}
                className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                title="Adicionar linha antes"
              >
                ↑ Lin
              </button>
              <button
                onClick={addRowAfter}
                className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                title="Adicionar linha depois"
              >
                Lin ↓
              </button>
              <button
                onClick={deleteRow}
                className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                title="Deletar linha"
              >
                ✕ Lin
              </button>
              <button
                onClick={deleteTable}
                className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700"
                title="Deletar tabela"
              >
                ✕ Tabela
              </button>
            </>
          )}
        </div>

        {/* Outras opções */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            " Citação
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100"
          >
            ― Linha
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent 
          editor={editor} 
          className="tiptap-content"
        />
      </div>

      {/* Estilos CSS para tabelas */}
      <style jsx>{`
        .tiptap-content .ProseMirror {
          outline: none;
          min-height: 400px;
          padding: 1rem;
        }

        .tiptap-content .tiptap-table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
          border: 2px solid #000;
        }

        .tiptap-content .tiptap-table td,
        .tiptap-content .tiptap-table th {
          border: 1px solid #000;
          box-sizing: border-box;
          min-width: 1em;
          padding: 8px 12px;
          position: relative;
          vertical-align: top;
        }

        .tiptap-content .tiptap-table th {
          background-color: #f1f3f4;
          font-weight: bold;
          text-align: center;
        }

        .tiptap-content .tiptap-table .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .tiptap-content .tiptap-table .column-resize-handle {
          background-color: #adf;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }

        .tiptap-content .tableWrapper {
          padding: 1rem 0;
          overflow-x: auto;
        }

        .tiptap-content .resize-cursor {
          cursor: ew-resize;
          cursor: col-resize;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;