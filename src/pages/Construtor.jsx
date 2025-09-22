import React, { useState, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import "./Construtor.css";

const Construtor = () => {
  const [templateName, setTemplateName] = useState("");
  const editorRef = useRef(null);

  const handleSave = () => {
    if (!templateName.trim()) {
      alert("Por favor, digite um nome para o template antes de salvar.");
      return;
    }

    if (editorRef.current) {
      const content = editorRef.current.getContent();

      if (
        !content.trim() ||
        content === "<p></p>" ||
        content === "<p><br></p>"
      ) {
        alert(
          "Por favor, adicione algum conteúdo ao template antes de salvar."
        );
        return;
      }

      // Criar objeto do template
      const template = {
        id: Date.now(),
        name: templateName.trim(),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const existingTemplates = JSON.parse(
          localStorage.getItem("templates") || "[]"
        );
        existingTemplates.push(template);
        localStorage.setItem("templates", JSON.stringify(existingTemplates));

        console.log("Template salvo:", template);
        alert(
          `✅ Template "${templateName}" salvo com sucesso!\n\nID: ${
            template.id
          }\nData: ${new Date().toLocaleString()}`
        );
      } catch (error) {
        console.error("Erro ao salvar template:", error);
        alert("❌ Erro ao salvar o template. Tente novamente.");
      }
    } else {
      alert("Editor não está disponível. Tente recarregar a página.");
    }
  };

  const handleExport = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      console.log("Exportando template:", {
        name: templateName,
        content: content,
      });

      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${templateName || "template"}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("Template exportado com sucesso!");
    }
  };

  const handleClear = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o conteúdo?")) {
      if (editorRef.current) {
        editorRef.current.setContent("");
      }
      setTemplateName("");
      console.log("Conteúdo limpo");
    }
  };

  return (
    <div className="construtor-container">
      <div className="management-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="main-title">Construtor de Templates</h1>
            <p className="subtitle">
              Crie e edite templates profissionais com facilidade
            </p>
          </div>

          <div className="controls-section">
            <div className="input-group">
              <label htmlFor="template-name">Nome do Template:</label>
              <input
                id="template-name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onInput={(e) => setTemplateName(e.target.value)}
                placeholder="Digite o nome do seu template..."
                className="template-name-input"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className="button-group">
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!templateName.trim()}
              >
                💾 Salvar
              </button>

              <button onClick={handleExport} className="btn btn-secondary">
                📤 Exportar
              </button>

              <button onClick={handleClear} className="btn btn-danger">
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="editor-container">
        <Editor
          apiKey="k6884smi8qp44yucv1bgwe2d889zyppx9htwocn7if78ptf6"
          onInit={(evt, editor) => (editorRef.current = editor)}
          init={{
            // Configurações de aparência
            height: 700,
            menubar: false,
            statusbar: false,
            branding: false,
            promotion: false,
            language: "pt_BR",
            language_url:
              "https://cdn.tiny.cloud/1/no-api-key/tinymce/6/langs/pt_BR.js",

            plugins: "table lists advlist autolink",

            toolbar:
              "undo redo | fontfamily fontsize | bold italic underline | alignleft aligncenter alignright alignjustify | table",

            fontsize_formats:
              "8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt 60pt 72pt",

            font_family_formats:
              "Arial=arial,helvetica,sans-serif;" +
              "Times New Roman=times new roman,times,serif;" +
              "Courier New=courier new,courier,monospace;" +
              "Helvetica=helvetica,arial,sans-serif;" +
              "Georgia=georgia,serif;" +
              "Verdana=verdana,geneva,sans-serif;" +
              "Comic Sans MS=comic sans ms,cursive;" +
              "Impact=impact,charcoal,sans-serif;" +
              "Tahoma=tahoma,geneva,sans-serif;" +
              "Trebuchet MS=trebuchet ms,helvetica,sans-serif;" +
              "Lucida Console=lucida console,monaco,monospace;" +
              "Palatino=palatino linotype,book antiqua,palatino,serif",

            content_style: `
              body { 
                font-family: 'Times New Roman', Times, serif; 
                font-size: 16px; 
                line-height: 1.6; 
                padding: 40px; 
                background-color: white;
                margin: 0;
              } 
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 10px 0;
              } 
              table, th, td { 
                border: 1px solid #ccc; 
              } 
              th, td { 
                padding: 8px; 
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              p {
                margin: 0 0 10px 0;
              }
            `,

            setup: (editor) => {
              editor.on("init", () => {
                console.log("Editor TinyMCE inicializado com sucesso");
              });
            },
          }}
        />
      </div>
    </div>
  );
};

export default Construtor;
