# KONEKTA — Roadmap

## Concluído
- Lovable Cloud ativado e ligado ao projeto (base de dados, autenticação, armazenamento e funções prontos a usar).
- Aplicação reencaminhada para a base de dados gerida pelo Cloud; o antigo URL fixo de uma conta externa foi eliminado.
- Textos e validações de recarga alinhados: comprovativo obrigatório em todos os pedidos de recarga.
- Verificação de erros do código: sem erros.

## Em curso
- (nada)

## Por fazer
- Criar as tabelas da app na nova base de dados (`profiles`, `pedidos`, `transacoes`, etc.) a partir de `supabase-schema.sql`, com regras de acesso por utilizador. Bloqueio: confirmação do utilizador de que deve aplicar o esquema agora.
- Primeiro registo real na app (a base de dados ainda não tem utilizadores, por isso ainda não é possível testar o acesso com sessão).
