# BarberXP v83 — foto e apelido pessoal

Esta versão parte da v82, mantendo seu código de notificações, resumo semanal,
missões, medalhas por resgate, ranking mensal e ritmo da equipe.

## Instalação

1. Execute `barberxp-personalizacao-v83.sql` no SQL Editor do Supabase.
2. Extraia o pacote na raiz do projeto e substitua os arquivos.
3. Faça commit e push. A publicação usa `npm run build` e saída `dist`.
4. Após publicar, recarregue o aplicativo e abra Configurações da conta.

O SQL cria somente os recursos desta atualização. Não é necessário executar
novamente os SQLs antigos incluídos no pacote se já foram aplicados.

## Foto

Configurações da conta → Foto do profissional → Escolher foto.
O aplicativo corta o centro da foto em um quadrado de 256 × 256 pixels,
converte para JPG e comprime antes de enviar, com limite de 100 KB.
Fotos JPG, PNG e WebP são aceitas; HEIC depende da leitura pelo navegador.
É possível trocar ou remover a própria foto. Ela aparece no perfil, cabeçalho,
pódio e ranking. Sem foto, aparecem as iniciais do profissional.

As fotos ficam num bucket privado e são exibidas por URLs temporárias.
Colaboradores ativos podem ver fotos; cada pessoa altera somente a sua.

## Apelido

A compra começa desligada, sem inventar um preço para a equipe.
O dono define o preço em Configurações → Personalização → preço do apelido
e ativa a compra. Cada mudança custa esse valor; repetir o apelido atual
não desconta novamente. Use entre 2 e 24 caracteres.

O colaborador compra em Configurações da conta → Seu apelido no jogo.
O preço e a confirmação aparecem antes do desconto. O banco verifica o
saldo mensal e registra a compra, protegendo contra envio repetido.
O desconto usa pontos, sem alterar XP.

O apelido é privado: somente o próprio colaborador o vê em seu cabeçalho,
perfil e sua linha do ranking. Dono e gestor continuam vendo o nome real.
Na visão de dono, inclusive para quem também é barbeiro, usa-se o nome real.
Cadastros, aprovações, relatórios e registros continuam usando o nome real.

## Ocorrências na Equipe

O formulário permanece aberto durante a sincronização automática. Colaborador,
tipo, data e motivo são preservados enquanto você preenche e ao navegar entre
páginas na mesma sessão. Trocar o tipo não reconstrói o formulário.
Cliques repetidos durante o envio são bloqueados. Uma falha mantém o texto;
o envio concluído limpa somente o motivo e mantém o colaborador selecionado.
Essa correção está no mesmo v83 e não altera o SQL de personalização.

## Publicação e notificações

O build inclui `sw.js` na raiz de `dist`, preservando o arquivo necessário
ao Web Push. Ícones e manifest existentes na raiz também são preservados.
Não altere os segredos nem publique a chave VAPID privada no GitHub.

## Verificação

Validação local de sintaxe e cenários de interface não substitui a execução
do SQL no seu projeto. Após publicar, teste a foto em duas contas e a compra
com um preço definido pelo dono. Confira saldo, XP e nome real nos relatórios.
