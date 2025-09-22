# 🚀 Deploy Gratuito - Guia Completo

## 📋 **Opções Disponíveis**

### **1. 🥇 Vercel (Recomendado - Mais Fácil)**
- ✅ **Gratuito**: Frontend + Backend serverless
- ✅ **Domínio**: `seu-projeto.vercel.app`
- ✅ **SSL**: Automático
- ✅ **Deploy**: Automático via Git

### **2. 🥈 Railway**
- ✅ **Gratuito**: $5/mês grátis
- ✅ **Full-stack**: Frontend + Backend + Banco
- ✅ **PostgreSQL**: Incluído
- ✅ **Domínio**: `seu-projeto.railway.app`

### **3. 🥉 Render**
- ✅ **Gratuito**: Frontend + Backend
- ✅ **PostgreSQL**: Banco gratuito
- ✅ **SSL**: Automático
- ✅ **Domínio**: `seu-projeto.onrender.com`

---

## 🛠️ **OPÇÃO 1: Deploy no Vercel (Recomendado)**

### **Pré-requisitos:**
1. Conta no GitHub (gratuita)
2. Conta no Vercel (gratuita)

### **Passos:**

#### **1. Preparar o Repositório**
```bash
# 1. Inicializar Git (se não tiver)
git init

# 2. Adicionar arquivos
git add .

# 3. Fazer commit
git commit -m "Preparando para deploy"

# 4. Criar repositório no GitHub
# Vá em: https://github.com/new
# Nome: soualleg-sistema
# Público ou Privado (sua escolha)

# 5. Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/soualleg-sistema.git
git branch -M main
git push -u origin main
```

#### **2. Deploy no Vercel**
1. **Acesse**: https://vercel.com
2. **Login**: Com sua conta GitHub
3. **Import Project**: Selecione seu repositório
4. **Configure**:
   - Framework: `Other`
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### **3. Configurar Variáveis de Ambiente**
No painel do Vercel:
- **Settings** → **Environment Variables**
- Adicionar:
  ```
  NODE_ENV = production
  PORT = 3002
  ```

#### **4. Deploy Automático**
- ✅ **Pronto!** Seu projeto estará em: `https://seu-projeto.vercel.app`
- ✅ **Atualizações**: Automáticas a cada push no GitHub

---

## 🛠️ **OPÇÃO 2: Deploy no Railway**

### **Passos:**

#### **1. Preparar o Projeto**
```bash
# Mesmo processo do Git acima
```

#### **2. Deploy no Railway**
1. **Acesse**: https://railway.app
2. **Login**: Com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione**: Seu repositório
5. **Configure**:
   - Start Command: `npm start`
   - Build Command: `npm run build`

#### **3. Adicionar Banco PostgreSQL**
1. **Add Service** → **Database** → **PostgreSQL**
2. **Conectar**: Railway gera automaticamente a `DATABASE_URL`

#### **4. Configurar Variáveis**
```
NODE_ENV = production
PORT = $PORT (Railway define automaticamente)
DATABASE_URL = $DATABASE_URL (Railway define automaticamente)
```

---

## 🛠️ **OPÇÃO 3: Deploy no Render**

### **Passos:**

#### **1. Deploy Frontend**
1. **Acesse**: https://render.com
2. **New** → **Static Site**
3. **Connect**: Seu repositório GitHub
4. **Configure**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`

#### **2. Deploy Backend**
1. **New** → **Web Service**
2. **Connect**: Mesmo repositório
3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`

#### **3. Adicionar PostgreSQL**
1. **New** → **PostgreSQL**
2. **Conectar**: Copiar `DATABASE_URL`

---

## 🎯 **Qual Escolher?**

### **Para Teste Rápido**: 
- **Vercel** (5 minutos para estar online)

### **Para Projeto Completo**: 
- **Railway** (melhor para full-stack)

### **Para Controle Total**: 
- **Render** (mais configurações)

---

## 🔧 **Configurações Adicionais**

### **Banco de Dados**
- **Desenvolvimento**: SQLite (atual)
- **Produção**: PostgreSQL (recomendado)

### **Uploads de Arquivos**
- **Vercel**: Usar Cloudinary (gratuito)
- **Railway/Render**: Sistema de arquivos

### **Domínio Personalizado**
- **Gratuito**: `projeto.vercel.app`
- **Personalizado**: Conectar seu domínio

---

## 📞 **Suporte**

Se precisar de ajuda:
1. **Vercel**: Documentação excelente
2. **Railway**: Discord ativo
3. **Render**: Suporte por email

---

## 🚀 **Próximos Passos**

1. **Escolha uma opção** (recomendo Vercel)
2. **Siga o guia** passo a passo
3. **Teste o link** gerado
4. **Compartilhe** com quem quiser!

**Tempo estimado**: 10-15 minutos para estar online! 🎉