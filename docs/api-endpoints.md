# API - Endpoints

Todas as rotas (menos `/login`) exigem o token JWT no header:

```
Authorization: Bearer <token>
```

## Autenticação

### POST /login
Login do usuário.

**Body:**
```json
{
  "email": "joao@escola.edu",
  "password": "123456"
}
```

**Resposta 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "admin"
}
```

**Resposta 401:** email ou senha inválidos.

---

## Usuários (só admin)

### GET /usuarios
Lista todos os usuários.

### POST /usuarios
Cadastra um usuário novo.

**Body:**
```json
{
  "name": "Isabelle",
  "email": "isabelle@escola.edu",
  "password": "123456",
  "role": "comum",
  "sector": "Informatica"
}
```

### PUT /usuarios/{id}
Edita um usuário. Pode atualizar name, email, role, sector e (opcional) password.

### DELETE /usuarios/{id}
Remove um usuário.

---

## Equipamentos (só admin)

### GET /equipamentos
Lista todos os equipamentos.

### POST /equipamentos
Cadastra um equipamento.

**Body:**
```json
{
  "name": "Computador 02",
  "type": "Desktop",
  "localization": "Laboratorio 2"
}
```

### PUT /equipamentos/{id}
Edita um equipamento.

### DELETE /equipamentos/{id}
Remove um equipamento.

---

## Chamados (qualquer usuário logado)

### GET /chamados
Lista chamados. Aceita filtros por query string:

- `status=aberto` - filtra por status
- `user_id=1` - filtra por usuário
- `sector=Informatica` - filtra por setor

### GET /chamados/{id}
Detalha um chamado específico.

### POST /chamados
Abre um chamado novo.

**Body:**
```json
{
  "user_name": "Isabelle",
  "user_id": 1,
  "equipment_id": 2,
  "equipment_name": "Computador 02",
  "sector": "Informatica",
  "localization": "Laboratorio 2",
  "problem_type": "Hardware",
  "description": "Computador nao liga",
  "priority": "alta",
  "date": "26/08/2026"
}
```

O status começa como `aberto`.

### PUT /chamados/{id}
Atualiza um chamado - usado principalmente para mudar status e técnico.

**Body:**
```json
{
  "status": "em_andamento",
  "technical_lead": "Joao"
}
```

### GET /chamados/busca?q=nao+liga
Pesquisa chamados por termo (procura em descrição, nome do usuário, tipo
do problema e nome do equipamento).