const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const multer = require("multer");
const slugify = require("slugify");
const fs = require("fs");
const { google } = require("googleapis");

// Tratamento de erros não capturados
process.on("uncaughtException", (err) => {
  console.error("Erro não capturado:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promise rejeitada não tratada:", err);
});

const app = express();

// Tratamento de erro para o SQLite
let db;
try {
  db = new Database("events.db", {
    verbose: null,
    fileMustExist: false,
  });

  // Verificar conexão com o banco
  db.prepare("SELECT 1").get();
  console.log("Conexão com o banco de dados estabelecida com sucesso");
} catch (error) {
  console.error("Erro ao conectar com o banco de dados:", error);
  process.exit(1);
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Configurações do Express
app.use(
  cors({
    origin: true, // Permite todas as origens em desenvolvimento
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../public/uploads"))
);

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  next();
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error("Erro na aplicação:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

// Criar tabela de eventos se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    company TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    setor TEXT
  )
`);

// Verificar se a coluna setor existe na tabela events e adicioná-la se não existir
try {
  // Tentar selecionar a coluna setor
  db.prepare("SELECT setor FROM events LIMIT 1").get();
} catch (error) {
  // Se der erro, significa que a coluna não existe, então vamos criá-la
  console.log("Adicionando coluna setor à tabela events...");
  db.exec("ALTER TABLE events ADD COLUMN setor TEXT");
}

// Criar tabela de empresas se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo TEXT,
    primaryColor TEXT NOT NULL,
    secondaryColor TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// Verificar se a coluna status existe e adicioná-la se não existir
try {
  // Tentar selecionar a coluna status
  db.prepare("SELECT status FROM companies LIMIT 1").get();
} catch (error) {
  // Se der erro, significa que a coluna não existe, então vamos criá-la
  console.log("Adicionando coluna status à tabela companies...");
  db.exec('ALTER TABLE companies ADD COLUMN status TEXT DEFAULT "active"');
}

// Atualizar empresas existentes sem status para 'active'
db.exec(`
  UPDATE companies 
  SET status = 'active' 
  WHERE status IS NULL OR status = ''
`);

// Criar tabela de denúncias se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT,
    email TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    who_did_it TEXT,
    how_it_happened TEXT,
    additional_info TEXT,
    attachments TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  )
`);

// Criar tabela de não conformidades se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS nonconformities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT,
    email TEXT,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    who_did_it TEXT,
    how_it_happened TEXT,
    additional_info TEXT,
    attachments TEXT,
    setor TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  )
`);

// Criar tabela de chat/mensagens se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    parent_id INTEGER NULL,
    likes INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (parent_id) REFERENCES chat_messages (id)
  )
`);

// Criar tabela de likes das mensagens
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_message_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(message_id, user_id)
  )
`);

// Verificar se a coluna setor existe e adicioná-la se não existir
try {
  // Tentar selecionar a coluna setor
  db.prepare("SELECT setor FROM nonconformities LIMIT 1").get();
} catch (error) {
  // Se der erro, significa que a coluna não existe, então vamos criá-la
  console.log("Adicionando coluna setor à tabela nonconformities...");
  db.exec("ALTER TABLE nonconformities ADD COLUMN setor TEXT");
}

// Criar tabela de usuários se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    full_name TEXT,
    department TEXT,
    user_type TEXT NOT NULL DEFAULT 'admin',
    company_id INTEGER,
    can_view_denuncias INTEGER NOT NULL DEFAULT 1,
    can_view_documentacao INTEGER NOT NULL DEFAULT 1,
    can_view_naoconformidades INTEGER NOT NULL DEFAULT 1,
    can_view_empresas INTEGER NOT NULL DEFAULT 1,
    first_login_required INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_login TEXT,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  )
`);

// Garantir que colunas existam em bancos já criados
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN can_view_denuncias INTEGER NOT NULL DEFAULT 1"
  ).run();
} catch (e) {}
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN can_view_documentacao INTEGER NOT NULL DEFAULT 1"
  ).run();
} catch (e) {}
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN can_view_naoconformidades INTEGER NOT NULL DEFAULT 1"
  ).run();
} catch (e) {}
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN can_view_empresas INTEGER NOT NULL DEFAULT 1"
  ).run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN full_name TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE users ADD COLUMN department TEXT").run();
} catch (e) {}
try {
  db.prepare(
    "ALTER TABLE users ADD COLUMN first_login_required INTEGER NOT NULL DEFAULT 0"
  ).run();
} catch (e) {}

// Criar tabela de indicadores se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    current_value REAL NOT NULL DEFAULT 0,
    target_value REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '%',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Inserir dados iniciais dos indicadores se não existirem
const indicatorCount = db
  .prepare("SELECT COUNT(*) as count FROM indicators")
  .get().count;
if (indicatorCount === 0) {
  console.log("Inserindo dados iniciais dos indicadores...");
  const insertIndicator = db.prepare(`
    INSERT INTO indicators (name, current_value, target_value, unit)
    VALUES (?, ?, ?, ?)
  `);

  const indicators = [
    ["Satisfação dos Municípios", 92, 90, "%"],
    ["Eficácia de NC", 87, 95, "%"],
    ["Capacitações", 23, 20, "unidades"],
    ["Cumprimento Prazos", 85, 90, "%"],
    ["Tempo Resposta", 2.8, 3, "dias"],
    ["Alcance Publicações", 8.5, 10, "%"],
  ];

  indicators.forEach((indicator) => {
    insertIndicator.run(...indicator);
  });

  console.log("Dados iniciais dos indicadores inseridos com sucesso");
}

// Verificar se existe usuário admin, se não existir, criar
const adminUser = db
  .prepare("SELECT id FROM users WHERE username = ?")
  .get("admin");
if (!adminUser) {
  console.log("Criando usuário admin padrão...");
  const stmt = db.prepare(`
    INSERT INTO users (username, password, user_type, can_view_denuncias, can_view_documentacao, can_view_naoconformidades, can_view_empresas, created_at)
    VALUES (?, ?, ?, 1, 1, 1, 1, ?)
  `);
  stmt.run("admin", "admin", "admin", new Date().toISOString());
}

// Inserir alguns dados de exemplo se a tabela estiver vazia
const count = db.prepare("SELECT COUNT(*) as count FROM events").get().count;
console.log("Número de eventos no banco:", count);

if (count === 0) {
  console.log("Inserindo dados de exemplo...");
  const stmt = db.prepare(
    "INSERT INTO events (date, category, company, status, description) VALUES (?, ?, ?, ?, ?)"
  );
  const sampleData = [
    [
      "2024-03-16 13:57:41",
      "Cadastros",
      "Campo Grande",
      "fechado",
      "Finalização do processo de cadastro da empresa no sistema. Documentação completa recebida e validada. CNPJ e certidões verificados com sucesso.",
    ],
    [
      "2024-03-16 13:44:28",
      "Cadastros",
      "Terra Verde",
      "fechado",
      "Atualização dos dados cadastrais solicitada pela empresa. Alteração de endereço e contatos principais. Novos documentos anexados ao registro.",
    ],
    [
      "2024-03-16 13:26:07",
      "Elogios",
      "Terra Velha",
      "aberto",
      "Cliente extremamente satisfeito com o atendimento da equipe de suporte. Destacou a rapidez na resolução de problemas e a cordialidade dos atendentes. Sugeriu implementação de novas funcionalidades.",
    ],
    [
      "2024-03-16 12:15:33",
      "Denúncias",
      "Empresa X",
      "aberto",
      "Denúncia recebida sobre possíveis irregularidades nas práticas comerciais. Relatos de descumprimento de prazos contratuais e falta de transparência nas negociações. Necessária investigação detalhada.",
    ],
    [
      "2024-03-16 11:45:19",
      "Reclamações",
      "Empresa Y",
      "fechado",
      "Reclamação referente ao atraso na entrega de produtos. Cliente reportou demora de mais de 30 dias além do prazo acordado. Situação resolvida com compensação e novo prazo estabelecido.",
    ],
  ];
  sampleData.forEach((data) => stmt.run(...data));
  console.log("Dados de exemplo inseridos com sucesso");
}

// Middleware para verificar se o usuário é admin
const checkAdminUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Para simplificar, vamos aceitar qualquer token válido
    // e verificar se existe um usuário admin no banco
    const adminUser = db
      .prepare("SELECT * FROM users WHERE user_type = ? LIMIT 1")
      .get("admin");
    if (!adminUser) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Nenhum administrador encontrado." });
    }

    req.user = adminUser;
    next();
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

// Rota para listar todos os eventos
app.get("/api/events", (req, res) => {
  try {
    console.log("Buscando eventos...");
    const { company } = req.query;

    let events;
    if (company) {
      // Se uma empresa específica foi solicitada
      events = db
        .prepare("SELECT * FROM events WHERE company = ? ORDER BY date DESC")
        .all(company);
    } else {
      // Se nenhuma empresa foi especificada, retorna todos os eventos
      events = db.prepare("SELECT * FROM events ORDER BY date DESC").all();
    }

    console.log("Eventos encontrados:", events.length);
    res.json(events);
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    res.status(500).json({ error: "Erro ao buscar eventos" });
  }
});

// Rota para criar um novo evento
app.post("/api/events", checkAdminUser, (req, res) => {
  try {
    const { date, category, company, status, description } = req.body;
    console.log("Dados recebidos:", {
      date,
      category,
      company,
      status,
      description,
    });

    // Validar campos obrigatórios
    if (!date || !category || !company || !status) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Se for uma denúncia, criar primeiro a denúncia
    if (category === "Denúncias") {
      // Buscar o ID da empresa
      const companyData = db
        .prepare("SELECT id, slug FROM companies WHERE name = ?")
        .get(company);
      if (!companyData) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      // Criar a denúncia
      const complaintStmt = db.prepare(`
        INSERT INTO complaints (
          company_id, subject, description, created_at
        ) VALUES (?, ?, ?, ?)
      `);

      complaintStmt.run(
        companyData.id,
        "Denúncia registrada via administrador",
        description,
        date
      );
    }

    // Criar o evento
    const stmt = db.prepare(`
      INSERT INTO events (date, category, company, status, description) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(date, category, company, status, description || "");
    console.log("Resultado da inserção:", result);

    // Buscar o evento recém-criado
    const newEvent = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Erro detalhado ao criar evento:", error);
    res
      .status(500)
      .json({ error: "Erro ao criar evento", details: error.message });
  }
});

// Rota para atualizar um evento
app.put("/api/events/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { category, company, status, description } = req.body;
    console.log("Dados recebidos para atualização:", {
      id,
      category,
      company,
      status,
      description,
    });

    // Validar campos obrigatórios
    if (!category || !company || !status) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Primeiro verifica se o evento existe
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
    if (!event) {
      console.log("Evento não encontrado:", id);
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Atualiza o evento
    const stmt = db.prepare(`
      UPDATE events 
      SET category = ?, 
          company = ?, 
          status = ?,
          description = ?
      WHERE id = ?
    `);

    const result = stmt.run(category, company, status, description || "", id);
    console.log("Resultado da atualização:", result);

    if (result.changes === 0) {
      return res.status(500).json({ error: "Erro ao atualizar evento" });
    }

    // Retorna o evento atualizado
    const updatedEvent = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(id);
    console.log("Evento atualizado:", updatedEvent);
    res.json(updatedEvent);
  } catch (error) {
    console.error("Erro detalhado ao atualizar evento:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar evento", details: error.message });
  }
});

// Rota para excluir um evento
app.delete("/api/events/:id", checkAdminUser, (req, res) => {
  try {
    console.log("Excluindo evento:", req.params.id);
    const stmt = db.prepare("DELETE FROM events WHERE id = ?");
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    res.status(500).json({ error: "Erro ao excluir evento" });
  }
});

// Rota para obter estatísticas
app.get("/api/stats", (req, res) => {
  try {
    console.log("Calculando estatísticas...");
    const { company } = req.query;

    let stats;
    if (company) {
      // Se uma empresa específica foi solicitada
      stats = {
        total: db
          .prepare("SELECT COUNT(*) as count FROM events WHERE company = ?")
          .get(company).count,
        open: db
          .prepare(
            "SELECT COUNT(*) as count FROM events WHERE status = ? AND company = ?"
          )
          .get("aberto", company).count,
        closed: db
          .prepare(
            "SELECT COUNT(*) as count FROM events WHERE status = ? AND company = ?"
          )
          .get("fechado", company).count,
        byCategory: db
          .prepare(
            "SELECT category, COUNT(*) as count FROM events WHERE company = ? GROUP BY category"
          )
          .all(company),
      };
    } else {
      // Se nenhuma empresa foi especificada, retorna todas as estatísticas
      stats = {
        total: db.prepare("SELECT COUNT(*) as count FROM events").get().count,
        open: db
          .prepare("SELECT COUNT(*) as count FROM events WHERE status = ?")
          .get("aberto").count,
        closed: db
          .prepare("SELECT COUNT(*) as count FROM events WHERE status = ?")
          .get("fechado").count,
        byCategory: db
          .prepare(
            "SELECT category, COUNT(*) as count FROM events GROUP BY category"
          )
          .all(),
      };
    }

    console.log("Estatísticas:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    res.status(500).json({ error: "Erro ao calcular estatísticas" });
  }
});

// Rota para listar todas as não conformidades
app.get("/api/nonconformities", (req, res) => {
  try {
    console.log("Buscando não conformidades...");
    const { company } = req.query;

    let nonconformities;
    if (company) {
      // Se uma empresa específica foi solicitada
      const companyData = db
        .prepare("SELECT id FROM companies WHERE name = ?")
        .get(company);
      if (!companyData) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      nonconformities = db
        .prepare(
          `
        SELECT n.*, c.name as company_name, c.slug as company_slug
        FROM nonconformities n
        JOIN companies c ON n.company_id = c.id
        WHERE n.company_id = ?
        ORDER BY n.created_at DESC
      `
        )
        .all(companyData.id);
    } else {
      // Se nenhuma empresa foi especificada, retorna todas as não conformidades
      nonconformities = db
        .prepare(
          `
        SELECT n.*, c.name as company_name, c.slug as company_slug
        FROM nonconformities n
        JOIN companies c ON n.company_id = c.id
        ORDER BY n.created_at DESC
      `
        )
        .all();
    }

    console.log("Não conformidades encontradas:", nonconformities.length);
    res.json(nonconformities);
  } catch (error) {
    console.error("Erro ao buscar não conformidades:", error);
    res.status(500).json({ error: "Erro ao buscar não conformidades" });
  }
});

// Rota para criar uma nova não conformidade (simplificada para empresa única)
app.post("/api/nonconformities", upload.array("attachments"), (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      description,
      whoDidIt,
      howItHappened,
      additionalInfo,
      setor,
      company_id,
    } = req.body;

    // Se company_id não foi fornecido, usar ASSOMASUL (ID: 4)
    const targetCompanyId = company_id || 4;

    // Verificar se a empresa existe
    const company = db
      .prepare("SELECT id, name FROM companies WHERE id = ?")
      .get(targetCompanyId);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    if (!subject || !description) {
      return res
        .status(400)
        .json({ error: "Assunto e descrição são obrigatórios" });
    }

    const attachments = req.files
      ? req.files.map((file) => file.filename).join(",")
      : null;
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO nonconformities (
        company_id, name, email, subject, description,
        who_did_it, how_it_happened, additional_info,
        attachments, setor, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      targetCompanyId,
      name || null,
      email || null,
      subject,
      description,
      whoDidIt || null,
      howItHappened || null,
      additionalInfo || null,
      attachments,
      setor || "ADM", // Valor padrão
      created_at
    );

    // Criar um novo evento para a não conformidade
    const eventStmt = db.prepare(`
      INSERT INTO events (date, category, company, status, description, setor) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    eventStmt.run(
      created_at,
      "Não conformidades",
      company.name,
      "aberto",
      `Nova não conformidade recebida: ${subject}`,
      setor || "ADM"
    );

    // Buscar a não conformidade recém-criada
    const newNonconformity = db
      .prepare(
        `
      SELECT n.*, c.name as company_name, c.slug as company_slug
      FROM nonconformities n
      JOIN companies c ON n.company_id = c.id
      WHERE n.id = ?
    `
      )
      .get(result.lastInsertRowid);

    console.log("Nova não conformidade criada:", newNonconformity.id);
    res.status(201).json(newNonconformity);
  } catch (error) {
    console.error("Erro ao criar não conformidade:", error);
    res.status(500).json({
      error: "Erro ao criar não conformidade",
      details: error.message,
    });
  }
});

// Rota para listar todas as empresas
app.get("/api/companies", (req, res) => {
  try {
    console.log("Buscando todas as empresas...");
    const companies = db
      .prepare("SELECT * FROM companies ORDER BY created_at DESC")
      .all();
    console.log("Empresas encontradas:", companies.length);
    console.log(
      "Lista de empresas:",
      companies.map((c) => ({
        name: c.name,
        url: `/empresa/${c.slug}`,
        created_at: c.created_at,
      }))
    );
    res.json(companies);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    res.status(500).json({ error: "Erro ao buscar empresas" });
  }
});

// Rota para criar uma nova empresa
app.post("/api/companies", upload.single("logo"), (req, res) => {
  try {
    console.log("Dados recebidos para criação de empresa:", req.body);
    const { name, cnpj, phone, email, address, primaryColor, secondaryColor } =
      req.body;

    if (!name) {
      console.error("Nome da empresa não fornecido");
      return res.status(400).json({ error: "Nome da empresa é obrigatório" });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const logo = req.file ? req.file.filename : null;
    const created_at = new Date().toISOString();

    // Verificar se já existe uma empresa com o mesmo slug
    const existingCompany = db
      .prepare("SELECT id FROM companies WHERE slug = ?")
      .get(slug);
    if (existingCompany) {
      console.error("Empresa já existe:", { name, slug });
      return res
        .status(400)
        .json({ error: "Já existe uma empresa com este nome" });
    }

    // Iniciar transação
    const transaction = db.transaction(() => {
      // Criar empresa
      const companyStmt = db.prepare(`
        INSERT INTO companies (
          name, slug, cnpj, phone, email, address, logo, 
          primaryColor, secondaryColor, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const companyResult = companyStmt.run(
        name,
        slug,
        cnpj || null,
        phone || null,
        email || null,
        address || null,
        logo,
        primaryColor || "#FF6B00",
        secondaryColor || "#1F2937",
        "active",
        created_at
      );

      // Criar usuário para a empresa
      const userStmt = db.prepare(`
        INSERT INTO users (
          username, password, email, user_type, company_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      userStmt.run(
        slug, // username será o slug da empresa
        "demo123", // senha padrão
        email || null,
        "company",
        companyResult.lastInsertRowid,
        created_at
      );

      // Criar evento para o cadastro
      const eventStmt = db.prepare(`
        INSERT INTO events (date, category, company, status, description) 
        VALUES (?, ?, ?, ?, ?)
      `);

      eventStmt.run(
        created_at,
        "Cadastros",
        name,
        "fechado",
        `Empresa cadastrada com sucesso. CNPJ: ${cnpj || "Não informado"}`
      );

      return companyResult.lastInsertRowid;
    });

    // Buscar a empresa recém-criada
    const newCompany = db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .get(transaction());

    console.log("Empresa criada com sucesso:", {
      name: newCompany.name,
      url: `/empresa/${newCompany.slug}`,
      created_at: newCompany.created_at,
    });

    res.status(201).json({
      ...newCompany,
      url: `/empresa/${newCompany.slug}`,
    });
  } catch (error) {
    console.error("Erro detalhado ao criar empresa:", error);
    res
      .status(500)
      .json({ error: "Erro ao criar empresa", details: error.message });
  }
});

// Rota para buscar uma empresa pelo slug
app.get("/api/companies/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const company = db
      .prepare("SELECT * FROM companies WHERE slug = ?")
      .get(slug);

    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    res.json(company);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    res.status(500).json({ error: "Erro ao buscar empresa" });
  }
});

// Rota para excluir uma empresa
app.delete("/api/companies/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const { id } = req.body;

    // Verificar se a empresa existe
    const company = db
      .prepare("SELECT * FROM companies WHERE slug = ? AND id = ?")
      .get(slug, id);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Iniciar transação para excluir empresa e dados relacionados
    const transaction = db.transaction(() => {
      // Excluir eventos relacionados
      db.prepare("DELETE FROM events WHERE company = ?").run(company.name);

      // Excluir denúncias relacionadas
      db.prepare("DELETE FROM complaints WHERE company_id = ?").run(company.id);

      // Excluir não conformidades relacionadas
      db.prepare("DELETE FROM nonconformities WHERE company_id = ?").run(
        company.id
      );

      // Excluir usuários relacionados
      db.prepare("DELETE FROM users WHERE company_id = ?").run(company.id);

      // Por fim, excluir a empresa
      const result = db
        .prepare("DELETE FROM companies WHERE id = ?")
        .run(company.id);

      return result.changes;
    });

    // Executar a transação
    const changes = transaction();

    if (changes === 0) {
      return res.status(500).json({ error: "Erro ao excluir empresa" });
    }

    res.json({ success: true, message: "Empresa excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    res
      .status(500)
      .json({ error: "Erro ao excluir empresa", details: error.message });
  }
});

// Rota para criar uma nova denúncia
app.post(
  "/api/companies/:slug/complaints",
  upload.array("attachments"),
  (req, res) => {
    try {
      const { slug } = req.params;
      const {
        name,
        email,
        subject,
        description,
        whoDidIt,
        howItHappened,
        additionalInfo,
      } = req.body;

      // Buscar a empresa
      const company = db
        .prepare("SELECT id FROM companies WHERE slug = ?")
        .get(slug);
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      if (!subject || !description) {
        return res
          .status(400)
          .json({ error: "Assunto e descrição são obrigatórios" });
      }

      const attachments = req.files
        ? req.files.map((file) => file.filename).join(",")
        : null;
      const created_at = new Date().toISOString();

      const stmt = db.prepare(`
      INSERT INTO complaints (
        company_id, name, email, subject, description,
        who_did_it, how_it_happened, additional_info,
        attachments, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const result = stmt.run(
        company.id,
        name || null,
        email || null,
        subject,
        description,
        whoDidIt || null,
        howItHappened || null,
        additionalInfo || null,
        attachments,
        created_at
      );

      // Buscar o nome da empresa para o evento
      const companyData = db
        .prepare("SELECT name FROM companies WHERE id = ?")
        .get(company.id);

      // Criar um novo evento para a denúncia
      const eventStmt = db.prepare(`
      INSERT INTO events (date, category, company, status, description) 
      VALUES (?, ?, ?, ?, ?)
    `);

      eventStmt.run(
        created_at,
        "Denúncias",
        companyData.name,
        "aberto",
        `Nova denúncia recebida: ${subject}`
      );

      // Buscar a denúncia recém-criada
      const newComplaint = db
        .prepare("SELECT * FROM complaints WHERE id = ?")
        .get(result.lastInsertRowid);
      res.status(201).json(newComplaint);
    } catch (error) {
      console.error("Erro ao criar denúncia:", error);
      res
        .status(500)
        .json({ error: "Erro ao criar denúncia", details: error.message });
    }
  }
);

// Rota para criar uma nova não conformidade
app.post(
  "/api/companies/:slug/nonconformities",
  upload.array("attachments"),
  (req, res) => {
    try {
      const { slug } = req.params;
      const {
        name,
        email,
        subject,
        description,
        whoDidIt,
        howItHappened,
        additionalInfo,
        setor,
      } = req.body;

      // Buscar a empresa
      const company = db
        .prepare("SELECT id FROM companies WHERE slug = ?")
        .get(slug);
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      if (!subject || !description) {
        return res
          .status(400)
          .json({ error: "Assunto e descrição são obrigatórios" });
      }

      const attachments = req.files
        ? req.files.map((file) => file.filename).join(",")
        : null;
      const created_at = new Date().toISOString();

      const stmt = db.prepare(`
      INSERT INTO nonconformities (
        company_id, name, email, subject, description,
        who_did_it, how_it_happened, additional_info,
        attachments, setor, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const result = stmt.run(
        company.id,
        name || null,
        email || null,
        subject,
        description,
        whoDidIt || null,
        howItHappened || null,
        additionalInfo || null,
        attachments,
        setor || "ADF", // Valor padrão se não for especificado
        created_at
      );

      // Buscar o nome da empresa para o evento
      const companyData = db
        .prepare("SELECT name FROM companies WHERE id = ?")
        .get(company.id);

      // Criar um novo evento para a não conformidade
      const eventStmt = db.prepare(`
      INSERT INTO events (date, category, company, status, description, setor) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

      eventStmt.run(
        created_at,
        "Não conformidades",
        companyData.name,
        "aberto",
        `Nova não conformidade recebida: ${subject}`,
        setor || "ADF"
      );

      // Buscar a não conformidade recém-criada
      const newNonconformity = db
        .prepare("SELECT * FROM nonconformities WHERE id = ?")
        .get(result.lastInsertRowid);
      res.status(201).json(newNonconformity);
    } catch (error) {
      console.error("Erro ao criar não conformidade:", error);
      res.status(500).json({
        error: "Erro ao criar não conformidade",
        details: error.message,
      });
    }
  }
);

// Rota para listar denúncias de uma empresa
app.get("/api/companies/:slug/complaints", (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar o ID da empresa
    const company = db
      .prepare("SELECT id FROM companies WHERE slug = ?")
      .get(slug);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Buscar todas as denúncias da empresa
    const complaints = db
      .prepare(
        `
      SELECT complaints.*, companies.name as company_name 
      FROM complaints 
      JOIN companies ON complaints.company_id = companies.id 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `
      )
      .all(company.id);

    console.log(`Denúncias encontradas para ${slug}:`, complaints.length);
    res.json(complaints);
  } catch (error) {
    console.error("Erro ao buscar denúncias:", error);
    res.status(500).json({ error: "Erro ao buscar denúncias" });
  }
});

// Rota para listar não conformidades de uma empresa
app.get("/api/companies/:slug/nonconformities", (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar o ID da empresa
    const company = db
      .prepare("SELECT id FROM companies WHERE slug = ?")
      .get(slug);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Buscar todas as não conformidades da empresa
    const nonconformities = db
      .prepare(
        `
      SELECT nonconformities.*, companies.name as company_name 
      FROM nonconformities 
      JOIN companies ON nonconformities.company_id = companies.id 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `
      )
      .all(company.id);

    console.log(
      `Não conformidades encontradas para ${slug}:`,
      nonconformities.length
    );
    res.json(nonconformities);
  } catch (error) {
    console.error("Erro ao buscar não conformidades:", error);
    res.status(500).json({ error: "Erro ao buscar não conformidades" });
  }
});

// Rota para atualizar o status da empresa
app.put("/api/companies/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Status inválido. Use "active" ou "inactive".' });
    }

    const stmt = db.prepare("UPDATE companies SET status = ? WHERE id = ?");
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Criar um evento para a mudança de status
    const company = db
      .prepare("SELECT name FROM companies WHERE id = ?")
      .get(id);
    const eventStmt = db.prepare(`
      INSERT INTO events (date, category, company, status, description) 
      VALUES (?, ?, ?, ?, ?)
    `);

    eventStmt.run(
      new Date().toISOString(),
      "Cadastros",
      company.name,
      "fechado",
      `Status da empresa alterado para ${
        status === "active" ? "Ativo" : "Inativo"
      }`
    );

    const updatedCompany = db
      .prepare("SELECT * FROM companies WHERE id = ?")
      .get(id);
    res.json(updatedCompany);
  } catch (error) {
    console.error("Erro ao atualizar status da empresa:", error);
    res.status(500).json({ error: "Erro ao atualizar status da empresa" });
  }
});

// Rota para autenticar usuário
app.post("/api/auth/login", (req, res) => {
  try {
    console.log("Tentativa de login:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("Credenciais faltando");
      return res
        .status(400)
        .json({ error: "Username e password são obrigatórios" });
    }

    console.log("Buscando usuário no banco...");
    const user = db
      .prepare(
        `
      SELECT users.*, companies.name as company_name, companies.slug as company_slug,
        users.can_view_denuncias, users.can_view_documentacao, users.can_view_naoconformidades, users.can_view_empresas
      FROM users 
      LEFT JOIN companies ON users.company_id = companies.id 
      WHERE users.username = ? AND users.password = ?
    `
      )
      .get(username, password);

    console.log(
      "Resultado da busca:",
      user ? "Usuário encontrado" : "Usuário não encontrado"
    );

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Atualizar último login
    console.log("Atualizando último login...");
    db.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(
      new Date().toISOString(),
      user.id
    );

    // Remover a senha antes de enviar
    delete user.password;
    // DEBUG: mostrar permissões no login
    console.log("Login realizado. Permissões:", {
      username: user.username,
      can_view_denuncias: user.can_view_denuncias,
      can_view_documentacao: user.can_view_documentacao,
      can_view_naoconformidades: user.can_view_naoconformidades,
      can_view_empresas: user.can_view_empresas,
    });
    res.json(user);
  } catch (error) {
    console.error("Erro detalhado ao autenticar usuário:", error);
    res
      .status(500)
      .json({ error: "Erro ao autenticar usuário", details: error.message });
  }
});

// Rota para obter informações do usuário
app.get("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = db
      .prepare(
        "SELECT id, username, email, created_at, last_login FROM users WHERE id = ?"
      )
      .get(id);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

// Rota para atualizar senha do usuário
app.put("/api/users/:id/password", (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log("Tentando atualizar senha:", {
      userId: id,
      currentPassword: "***",
      newPassword: "***",
    });

    // Verificar senha atual
    const user = db
      .prepare("SELECT * FROM users WHERE id = ? AND password = ?")
      .get(id, currentPassword);

    if (!user) {
      console.log("Senha atual incorreta para o usuário:", id);
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // Atualizar senha
    const stmt = db.prepare("UPDATE users SET password = ? WHERE id = ?");
    const result = stmt.run(newPassword, id);

    console.log("Resultado da atualização:", {
      userId: id,
      changes: result.changes,
      success: result.changes > 0,
    });

    if (result.changes === 0) {
      return res.status(500).json({ error: "Erro ao atualizar senha" });
    }

    // Verificar se a senha foi realmente atualizada
    const updatedUser = db
      .prepare("SELECT id, username, password FROM users WHERE id = ?")
      .get(id);
    console.log("Senha atualizada com sucesso:", {
      userId: id,
      username: updatedUser.username,
      passwordChanged: updatedUser.password === newPassword,
    });

    res.json({ success: true, message: "Senha atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro ao atualizar senha" });
  }
});

// Rota para buscar usuário de uma empresa
app.get("/api/users/company/:companyId", (req, res) => {
  try {
    const { companyId } = req.params;

    // Adicionar headers para prevenir cache
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Expires", "0");
    res.set("Pragma", "no-cache");

    // Buscar usuário da empresa com a senha atual
    const user = db
      .prepare(
        `
      SELECT username, password 
      FROM users 
      WHERE company_id = ? 
        AND user_type = 'company'
      ORDER BY id DESC 
      LIMIT 1
    `
      )
      .get(companyId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Log para debug
    console.log("Credenciais encontradas:", {
      companyId,
      username: user.username,
      password: user.password,
    });

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

// Endpoint para atualizar permissões de visualização de menus do usuário
app.put("/api/users/:id/permissions", (req, res) => {
  try {
    const { id } = req.params;
    const {
      can_view_denuncias,
      can_view_documentacao,
      can_view_naoconformidades,
      can_view_empresas,
    } = req.body;
    // Apenas admin pode alterar
    // (implemente autenticação real em produção)
    const stmt = db.prepare(
      "UPDATE users SET can_view_denuncias = ?, can_view_documentacao = ?, can_view_naoconformidades = ?, can_view_empresas = ? WHERE id = ?"
    );
    const result = stmt.run(
      can_view_denuncias ? 1 : 0,
      can_view_documentacao ? 1 : 0,
      can_view_naoconformidades ? 1 : 0,
      can_view_empresas ? 1 : 0,
      id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    // DEBUG: mostrar valores atualizados
    const updatedUser = db
      .prepare(
        "SELECT id, username, can_view_denuncias, can_view_documentacao, can_view_naoconformidades, can_view_empresas FROM users WHERE id = ?"
      )
      .get(id);
    console.log("Permissões atualizadas:", updatedUser);
    res.json({ success: true, updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar permissões:", error);
    res.status(500).json({ error: "Erro ao atualizar permissões" });
  }
});

// Endpoint para listar todos os usuários (apenas admin)
app.get("/api/users", (req, res) => {
  try {
    const { company_id, department_id, role_id, status } = req.query;

    let query = `
      SELECT 
        u.id, u.username, u.email, u.full_name, u.department, 
        u.user_type, u.company_id, u.first_login_required,
        u.can_view_denuncias, u.can_view_documentacao, 
        u.can_view_naoconformidades, u.can_view_empresas,
        u.department_id, u.role_id, u.employee_code, u.hire_date, 
        u.phone, u.manager_id, u.status, u.is_manager,
        c.name as company_name,
        d.name as department_name,
        d.code as department_code,
        r.name as role_name,
        r.code as role_code,
        r.level as role_level,
        m.full_name as manager_name,
        u.created_at, u.last_login
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE 1=1
    `;

    const params = [];

    // Filtros opcionais
    if (company_id) {
      query += " AND u.company_id = ?";
      params.push(company_id);
    }

    if (department_id) {
      query += " AND u.department_id = ?";
      params.push(department_id);
    }

    if (role_id) {
      query += " AND u.role_id = ?";
      params.push(role_id);
    }

    if (status) {
      query += " AND u.status = ?";
      params.push(status);
    }

    query += " ORDER BY c.name, d.name, u.full_name";

    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Endpoint para criar funcionário de empresa
app.post(
  "/api/users",
  /* checkAdminUser, */ (req, res) => {
    try {
      const {
        username,
        password,
        email,
        full_name,
        department, // campo legado, mantido para compatibilidade
        department_id, // novo campo
        role_id,
        employee_code,
        hire_date,
        phone,
        manager_id,
        company_id,
        can_view_denuncias = false,
        can_view_documentacao = false,
        can_view_naoconformidades = false,
        can_view_empresas = false,
        first_login_required = true,
      } = req.body;

      // Validações mais robustas
      if (!username || !password || !full_name || !company_id) {
        return res.status(400).json({
          error:
            "Campos obrigatórios: username, password, full_name, company_id",
        });
      }

      // Validar formato do email se fornecido
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Formato de email inválido" });
      }

      // Validar tamanho dos campos
      if (username.length < 3 || username.length > 50) {
        return res
          .status(400)
          .json({ error: "Username deve ter entre 3 e 50 caracteres" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Senha deve ter pelo menos 6 caracteres" });
      }

      if (full_name.length < 2 || full_name.length > 100) {
        return res
          .status(400)
          .json({ error: "Nome completo deve ter entre 2 e 100 caracteres" });
      }

      // Validar username (apenas letras, números, pontos e underscores)
      if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        return res.status(400).json({
          error:
            "Username deve conter apenas letras, números, pontos e underscores",
        });
      }

      // Verificar se username já existe
      const existingUser = db
        .prepare("SELECT id FROM users WHERE username = ?")
        .get(username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      // Verificar se empresa existe
      const company = db
        .prepare("SELECT id, name FROM companies WHERE id = ?")
        .get(company_id);
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      // Verificar se departamento existe (se informado)
      if (department_id) {
        const dept = db
          .prepare("SELECT id FROM departments WHERE id = ? AND company_id = ?")
          .get(department_id, company_id);
        if (!dept) {
          return res.status(400).json({
            error: "Departamento não encontrado ou não pertence à empresa",
          });
        }
      }

      // Verificar se cargo existe (se informado)
      if (role_id) {
        const role = db
          .prepare("SELECT id FROM roles WHERE id = ? AND company_id = ?")
          .get(role_id, company_id);
        if (!role) {
          return res
            .status(400)
            .json({ error: "Cargo não encontrado ou não pertence à empresa" });
        }
      }

      // Verificar se gerente existe (se informado)
      if (manager_id) {
        const manager = db
          .prepare(
            'SELECT id FROM users WHERE id = ? AND company_id = ? AND status = "active"'
          )
          .get(manager_id, company_id);
        if (!manager) {
          return res
            .status(400)
            .json({ error: "Gerente não encontrado ou inativo" });
        }
      }

      // Verificar se código de funcionário já existe na empresa (se informado)
      if (employee_code) {
        const existingCode = db
          .prepare(
            "SELECT id FROM users WHERE employee_code = ? AND company_id = ?"
          )
          .get(employee_code, company_id);
        if (existingCode) {
          return res
            .status(400)
            .json({ error: "Código de funcionário já existe nesta empresa" });
        }
      }

      const stmt = db.prepare(`
      INSERT INTO users (
        username, password, email, full_name, department, user_type, company_id,
        department_id, role_id, employee_code, hire_date, phone, manager_id, status,
        can_view_denuncias, can_view_documentacao, can_view_naoconformidades, can_view_empresas,
        first_login_required, last_password_change, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      const result = stmt.run(
        username,
        password, // TODO: Implementar hash da senha
        email || null,
        full_name,
        department || null, // campo legado
        "employee",
        company_id,
        department_id || null,
        role_id || null,
        employee_code || null,
        hire_date || null,
        phone || null,
        manager_id || null,
        "active",
        can_view_denuncias ? 1 : 0,
        can_view_documentacao ? 1 : 0,
        can_view_naoconformidades ? 1 : 0,
        can_view_empresas ? 1 : 0,
        first_login_required ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );

      const newUser = db
        .prepare(
          `
      SELECT 
        u.*, 
        c.name as company_name,
        d.name as department_name,
        r.name as role_name,
        m.full_name as manager_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id 
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.id = ?
    `
        )
        .get(result.lastInsertRowid);

      console.log(
        "Funcionário criado:",
        newUser.full_name,
        "para empresa:",
        company.name
      );

      // Remover senha antes de enviar
      delete newUser.password;
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);
      res
        .status(500)
        .json({ error: "Erro ao criar funcionário", details: error.message });
    }
  }
);

// Endpoint para excluir funcionário
app.delete("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se é admin (não pode excluir admin)
    const user = db.prepare("SELECT user_type FROM users WHERE id = ?").get(id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.user_type === "admin") {
      return res
        .status(403)
        .json({ error: "Não é possível excluir usuários administradores" });
    }

    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ success: true, message: "Funcionário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir funcionário:", error);
    res.status(500).json({ error: "Erro ao excluir funcionário" });
  }
});

// Integração com Google Drive
let driveAuth = null;
let driveService = null;
try {
  // 1. Pega o conteúdo da variável de ambiente que você vai criar na Vercel
  const keyFileContent = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!keyFileContent) {
    throw new Error(
      "Variável de ambiente GOOGLE_SERVICE_ACCOUNT_KEY não encontrada"
    );
  }

  // 2. Converte o texto JSON (que veio da variável) para um objeto
  const credentials = JSON.parse(keyFileContent);

  // 3. Usa as 'credentials' em vez de 'keyFile'
  driveAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  driveService = google.drive({ version: "v3", auth: driveAuth });
} catch (e) {
  console.error("Erro ao configurar Google Drive:", e.message);
}

// Teste interno: listar arquivos da pasta ALLEG ao iniciar o servidor
(async () => {
  try {
    if (driveAuth) {
      const authClient = await driveAuth.getClient();
      const drive = google.drive({ version: "v3", auth: authClient });
      // Buscar a pasta ALLEG em qualquer lugar
      const folderList = await drive.files.list({
        q: `name='ALLEG' and mimeType='application/vnd.google-apps.folder'`,
        fields: "files(id, name)",
      });
      console.log(
        "[DRIVE TEST] Resultado da busca de pastas:",
        folderList.data.files
      );
      if (!folderList.data.files.length) {
        console.log("[DRIVE TEST] Pasta ALLEG não encontrada!");
        return;
      }
      const folderId = folderList.data.files[0].id;
      console.log("[DRIVE TEST] ID da pasta ALLEG:", folderId);
      const files = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: "files(id, name, webViewLink, mimeType)",
      });
      console.log(
        "[DRIVE TEST] Arquivos encontrados na pasta ALLEG:",
        files.data.files
      );
    }
  } catch (err) {
    console.error("[DRIVE TEST] Erro ao acessar Google Drive:", err.message);
  }
})();

// Endpoint para listar arquivos da pasta ALLEG
app.get("/api/documentacao/drive", async (req, res) => {
  try {
    // Verificar se a autenticação do Google Drive está configurada
    if (!driveAuth) {
      return res.status(500).json({
        error: "Integração com Google Drive não configurada corretamente",
        details: "Verifique o arquivo google-service-account.json",
      });
    }

    const authClient = await driveAuth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // Verificar se foi especificado um ID de pasta específico
    const { folderId } = req.query;
    let parentFolderId;

    if (folderId) {
      // Usar o ID fornecido
      parentFolderId = folderId;
    } else {
      // Buscar a pasta ALLEG (raiz)
      const folderList = await drive.files.list({
        q: `name='ALLEG' and mimeType='application/vnd.google-apps.folder'`,
        fields: "files(id, name)",
      });
      if (!folderList.data.files.length) {
        return res.status(404).json({
          error: "Pasta ALLEG não encontrada",
          details:
            "Verifique se a pasta existe no Google Drive e se as permissões estão configuradas corretamente",
        });
      }
      parentFolderId = folderList.data.files[0].id;
    }

    // Buscar tanto arquivos quanto pastas
    const files = await drive.files.list({
      q: `'${parentFolderId}' in parents and trashed=false`,
      fields: "files(id, name, webViewLink, mimeType)",
    });

    // Log para debug
    console.log(
      `[DRIVE] Listando arquivos da pasta ${parentFolderId}:`,
      files.data.files.length
    );

    res.json(files.data.files);
  } catch (error) {
    console.error("Erro detalhado ao listar arquivos do Drive:", error);
    res.status(500).json({
      error: "Erro ao listar arquivos do Google Drive",
      details: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// Endpoint de debug para testar a listagem do Google Drive
app.get("/api/documentacao/drive-debug", async (req, res) => {
  try {
    // Verificar se a autenticação do Google Drive está configurada
    if (!driveAuth) {
      return res.status(500).json({
        error: "Integração com Google Drive não configurada corretamente",
        details: "Verifique o arquivo google-service-account.json",
      });
    }

    const authClient = await driveAuth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    // Buscar a pasta ALLEG em qualquer lugar
    const folderList = await drive.files.list({
      q: `name='ALLEG' and mimeType='application/vnd.google-apps.folder'`,
      fields: "files(id, name)",
    });

    console.log(
      "[DRIVE DEBUG] Resultado da busca de pastas:",
      folderList.data.files
    );

    if (!folderList.data.files.length) {
      return res.status(404).json({
        error: "Pasta ALLEG não encontrada",
        debug: folderList.data,
      });
    }

    const folderId = folderList.data.files[0].id;
    console.log("[DRIVE DEBUG] ID da pasta ALLEG:", folderId);

    // Buscar tanto arquivos quanto pastas
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, webViewLink, mimeType)",
    });

    console.log(
      "[DRIVE DEBUG] Arquivos encontrados na pasta ALLEG:",
      files.data.files
    );

    res.json({
      pastas: folderList.data.files,
      idPasta: folderId,
      arquivos: files.data.files,
    });
  } catch (error) {
    console.error(
      "[DRIVE DEBUG] Erro detalhado ao listar arquivos do Drive:",
      error
    );
    res.status(500).json({
      error: "Erro ao listar arquivos do Drive",
      details: error.message,
      stack: error.stack,
    });
  }
});

// Rotas do Chat
app.get("/api/chat/messages", (req, res) => {
  try {
    // Buscar mensagens principais (sem parent_id)
    const messages = db
      .prepare(
        `
      SELECT 
        id, 
        user_id, 
        username, 
        message, 
        parent_id,
        likes,
        created_at
      FROM chat_messages 
      WHERE parent_id IS NULL
      ORDER BY created_at DESC 
      LIMIT 50
    `
      )
      .all();

    // Buscar respostas para cada mensagem
    const messagesWithReplies = messages.map((msg) => {
      const replies = db
        .prepare(
          `
        SELECT 
          id, 
          user_id, 
          username, 
          message, 
          likes,
          created_at
        FROM chat_messages 
        WHERE parent_id = ?
        ORDER BY created_at ASC
      `
        )
        .all(msg.id);

      return { ...msg, replies };
    });

    // Inverter para mostrar as mais recentes por último
    res.json(messagesWithReplies.reverse());
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

app.post("/api/chat/messages", (req, res) => {
  try {
    const { user_id, username, message, parent_id } = req.body;

    if (!user_id || !username || !message || message.trim() === "") {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const stmt = db.prepare(`
      INSERT INTO chat_messages (user_id, username, message, parent_id, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      user_id,
      username,
      message.trim(),
      parent_id || null,
      new Date().toISOString()
    );

    const newMessage = db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

// Rota para curtir/descurtir mensagem
app.post("/api/chat/messages/:id/like", (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id é obrigatório" });
    }

    // Verificar se já curtiu
    const existingLike = db
      .prepare(
        "SELECT id FROM chat_message_likes WHERE message_id = ? AND user_id = ?"
      )
      .get(id, user_id);

    if (existingLike) {
      // Remover like
      db.prepare(
        "DELETE FROM chat_message_likes WHERE message_id = ? AND user_id = ?"
      ).run(id, user_id);
      db.prepare("UPDATE chat_messages SET likes = likes - 1 WHERE id = ?").run(
        id
      );
    } else {
      // Adicionar like
      db.prepare(
        "INSERT INTO chat_message_likes (message_id, user_id) VALUES (?, ?)"
      ).run(id, user_id);
      db.prepare("UPDATE chat_messages SET likes = likes + 1 WHERE id = ?").run(
        id
      );
    }

    const updatedMessage = db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(id);
    res.json(updatedMessage);
  } catch (error) {
    console.error("Erro ao curtir mensagem:", error);
    res.status(500).json({ error: "Erro ao curtir mensagem" });
  }
});

// ==========================================
// ENDPOINTS DE DEPARTAMENTOS/SETORES
// ==========================================

// Listar todos os departamentos de uma empresa
app.get("/api/departments", (req, res) => {
  try {
    const { company_id } = req.query;

    let query = `
      SELECT 
        d.*,
        u.full_name as manager_name,
        c.name as company_name,
        parent.name as parent_name,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id AND status = 'active') as employee_count
      FROM departments d
      LEFT JOIN users u ON d.manager_user_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN departments parent ON d.parent_id = parent.id
      WHERE d.is_active = 1
    `;

    const params = [];
    if (company_id) {
      query += " AND d.company_id = ?";
      params.push(company_id);
    }

    query += " ORDER BY c.name, d.name";

    const departments = db.prepare(query).all(...params);
    res.json(departments);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Buscar departamento específico
app.get("/api/departments/:id", (req, res) => {
  try {
    const { id } = req.params;

    const department = db
      .prepare(
        `
      SELECT 
        d.*,
        u.full_name as manager_name,
        u.id as manager_id,
        c.name as company_name,
        parent.name as parent_name,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id AND status = 'active') as employee_count
      FROM departments d
      LEFT JOIN users u ON d.manager_user_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN departments parent ON d.parent_id = parent.id
      WHERE d.id = ?
    `
      )
      .get(id);

    if (!department) {
      return res.status(404).json({ error: "Departamento não encontrado" });
    }

    res.json(department);
  } catch (error) {
    console.error("Erro ao buscar departamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar novo departamento
app.post("/api/departments", checkAdminUser, (req, res) => {
  try {
    const { company_id, name, code, description, parent_id, manager_user_id } =
      req.body;

    // Validações
    if (!company_id || !name || !code) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: company_id, name, code" });
    }

    if (code.length > 10) {
      return res
        .status(400)
        .json({ error: "Código deve ter no máximo 10 caracteres" });
    }

    if (!/^[A-Z0-9_]+$/.test(code)) {
      return res.status(400).json({
        error:
          "Código deve conter apenas letras maiúsculas, números e underscore",
      });
    }

    // Verificar se código já existe na empresa
    const existingCode = db
      .prepare("SELECT id FROM departments WHERE company_id = ? AND code = ?")
      .get(company_id, code);
    if (existingCode) {
      return res.status(400).json({ error: "Código já existe nesta empresa" });
    }

    // Verificar se empresa existe
    const company = db
      .prepare("SELECT id FROM companies WHERE id = ?")
      .get(company_id);
    if (!company) {
      return res.status(400).json({ error: "Empresa não encontrada" });
    }

    // Verificar se gerente existe (se informado)
    if (manager_user_id) {
      const manager = db
        .prepare(
          'SELECT id FROM users WHERE id = ? AND company_id = ? AND status = "active"'
        )
        .get(manager_user_id, company_id);
      if (!manager) {
        return res
          .status(400)
          .json({ error: "Gerente não encontrado ou inativo" });
      }
    }

    const result = db
      .prepare(
        `
      INSERT INTO departments (company_id, name, code, description, parent_id, manager_user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `
      )
      .run(
        company_id,
        name,
        code,
        description,
        parent_id || null,
        manager_user_id || null
      );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: "Departamento criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar departamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Atualizar departamento
app.put("/api/departments/:id", checkAdminUser, (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, parent_id, manager_user_id, is_active } =
      req.body;

    // Verificar se departamento existe
    const department = db
      .prepare("SELECT * FROM departments WHERE id = ?")
      .get(id);
    if (!department) {
      return res.status(404).json({ error: "Departamento não encontrado" });
    }

    // Validar código se foi alterado
    if (code && code !== department.code) {
      if (!/^[A-Z0-9_]+$/.test(code)) {
        return res.status(400).json({
          error:
            "Código deve conter apenas letras maiúsculas, números e underscore",
        });
      }

      const existingCode = db
        .prepare(
          "SELECT id FROM departments WHERE company_id = ? AND code = ? AND id != ?"
        )
        .get(department.company_id, code, id);
      if (existingCode) {
        return res
          .status(400)
          .json({ error: "Código já existe nesta empresa" });
      }
    }

    db.prepare(
      `
      UPDATE departments 
      SET name = ?, code = ?, description = ?, parent_id = ?, manager_user_id = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    ).run(
      name || department.name,
      code || department.code,
      description !== undefined ? description : department.description,
      parent_id !== undefined ? parent_id : department.parent_id,
      manager_user_id !== undefined
        ? manager_user_id
        : department.manager_user_id,
      is_active !== undefined ? is_active : department.is_active,
      id
    );

    res.json({ message: "Departamento atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar departamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ==========================================
// ENDPOINTS DE CARGOS/FUNÇÕES
// ==========================================

// Listar todos os cargos de uma empresa
app.get("/api/roles", (req, res) => {
  try {
    const { company_id } = req.query;

    let query = `
      SELECT 
        r.*,
        c.name as company_name,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id AND status = 'active') as employee_count
      FROM roles r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE r.is_active = 1
    `;

    const params = [];
    if (company_id) {
      query += " AND r.company_id = ?";
      params.push(company_id);
    }

    query += " ORDER BY c.name, r.level, r.name";

    const roles = db.prepare(query).all(...params);
    res.json(roles);
  } catch (error) {
    console.error("Erro ao buscar cargos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar novo cargo
app.post("/api/roles", checkAdminUser, (req, res) => {
  try {
    const { company_id, name, code, level, description } = req.body;

    // Validações
    if (!company_id || !name || !code) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: company_id, name, code" });
    }

    if (!/^[A-Z0-9_]+$/.test(code)) {
      return res.status(400).json({
        error:
          "Código deve conter apenas letras maiúsculas, números e underscore",
      });
    }

    // Verificar se código já existe na empresa
    const existingCode = db
      .prepare("SELECT id FROM roles WHERE company_id = ? AND code = ?")
      .get(company_id, code);
    if (existingCode) {
      return res.status(400).json({ error: "Código já existe nesta empresa" });
    }

    const result = db
      .prepare(
        `
      INSERT INTO roles (company_id, name, code, level, description, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `
      )
      .run(company_id, name, code, level || 5, description);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: "Cargo criado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ==========================================
// ENDPOINTS DE PERMISSÕES
// ==========================================

// Listar todas as permissões
app.get("/api/permissions", (req, res) => {
  try {
    const permissions = db
      .prepare(
        `
      SELECT * FROM permissions 
      ORDER BY module, action
    `
      )
      .all();

    // Agrupar por módulo
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.json(groupedPermissions);
  } catch (error) {
    console.error("Erro ao buscar permissões:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Buscar permissões de um usuário
app.get("/api/users/:id/permissions", (req, res) => {
  try {
    const { id } = req.params;

    const permissions = db
      .prepare(
        `
      SELECT DISTINCT
        p.id,
        p.code,
        p.module,
        p.action,
        p.name,
        up.department_id,
        d.name as department_name,
        'user' as source
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      LEFT JOIN departments d ON up.department_id = d.id
      WHERE up.user_id = ? AND up.is_active = 1
      
      UNION
      
      SELECT DISTINCT
        p.id,
        p.code,
        p.module,
        p.action,
        p.name,
        rp.department_id,
        d.name as department_name,
        'role' as source
      FROM users u
      JOIN role_permissions rp ON u.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN departments d ON rp.department_id = d.id
      WHERE u.id = ?
      
      ORDER BY module, action
    `
      )
      .all(id, id);

    res.json(permissions);
  } catch (error) {
    console.error("Erro ao buscar permissões do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Buscar permissões de um usuário por username
app.get("/api/user-permissions/:username", (req, res) => {
  try {
    const { username } = req.params;

    // Buscar o ID do usuário pelo username
    const user = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const permissions = db
      .prepare(
        `
      SELECT DISTINCT p.code
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ? AND up.is_active = 1
      
      UNION
      
      SELECT DISTINCT p.code
      FROM users u
      JOIN role_permissions rp ON u.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
      
      ORDER BY code
    `
      )
      .all(user.id, user.id);

    // Retornar apenas os códigos das permissões
    const permissionCodes = permissions.map((p) => p.code);
    res.json(permissionCodes);
  } catch (error) {
    console.error("Erro ao buscar permissões do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Conceder permissão a um usuário
app.post("/api/users/:id/permissions", checkAdminUser, (req, res) => {
  try {
    const { id } = req.params;
    const { permission_id, department_id, expires_at, notes } = req.body;

    if (!permission_id) {
      return res.status(400).json({ error: "permission_id é obrigatório" });
    }

    // Verificar se usuário existe
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar se permissão existe
    const permission = db
      .prepare("SELECT id FROM permissions WHERE id = ?")
      .get(permission_id);
    if (!permission) {
      return res.status(400).json({ error: "Permissão não encontrada" });
    }

    // Verificar se já existe
    const existing = db
      .prepare(
        `
      SELECT id FROM user_permissions 
      WHERE user_id = ? AND permission_id = ? AND (department_id = ? OR (department_id IS NULL AND ? IS NULL))
    `
      )
      .get(id, permission_id, department_id, department_id);

    if (existing) {
      return res.status(400).json({ error: "Permissão já concedida" });
    }

    const result = db
      .prepare(
        `
      INSERT INTO user_permissions (user_id, permission_id, department_id, granted_by, granted_at, expires_at, notes)
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?)
    `
      )
      .run(
        id,
        permission_id,
        department_id || null,
        1,
        expires_at || null,
        notes || null
      );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: "Permissão concedida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao conceder permissão:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rotas para indicadores
app.get("/api/indicators", (req, res) => {
  try {
    const indicators = db
      .prepare("SELECT * FROM indicators ORDER BY name")
      .all();
    res.json(indicators);
  } catch (error) {
    console.error("Erro ao buscar indicadores:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.put("/api/indicators/:id", checkAdminUser, (req, res) => {
  try {
    const { id } = req.params;
    const { current_value, target_value } = req.body;

    if (current_value === undefined || target_value === undefined) {
      return res
        .status(400)
        .json({ error: "Valores atual e meta são obrigatórios" });
    }

    const stmt = db.prepare(`
      UPDATE indicators 
      SET current_value = ?, target_value = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(current_value, target_value, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Indicador não encontrado" });
    }

    const updatedIndicator = db
      .prepare("SELECT * FROM indicators WHERE id = ?")
      .get(id);
    res.json(updatedIndicator);
  } catch (error) {
    console.error("Erro ao atualizar indicador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

server.on("error", (error) => {
  console.error("Erro no servidor:", error);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.info("SIGTERM recebido. Fechando servidor...");
  server.close(() => {
    console.log("Servidor fechado");
    db.close();
    process.exit(0);
  });
});

module.exports = app;
