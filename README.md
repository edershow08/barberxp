# BarberXP v85 — produto e quantidade no mesmo salvamento

## Instalar v85 sobre v84

1. Supabase → SQL Editor → consulta nova: execute `barberxp-produto-individual-v85.sql` inteiro.
2. Extraia este pacote na raiz do projeto, substituindo os arquivos. Não crie uma subpasta.
3. Execute `git add .`, faça commit e push. Aguarde a publicação e reabra o aplicativo.

Em **Produtos**, use **Novo produto**. Preencha nome, preço de venda, custo e quantidade
inicial e clique em **Salvar produto e quantidade**. Cada produto possui seu próprio botão.
Para um produto existente, a quantidade é uma entrada adicional, somada ao estoque;
deixe zero para editar só o nome e os preços. A quantidade volta a zero após salvar.
Uma mesma tentativa repetida não duplica produto ou estoque. Se a conexão impedir a
confirmação, use **Tentar novamente** antes de modificar os campos.

Os resultados financeiros, comissões e meta ficam abaixo do cadastro. Só o dono
altera percentuais e meta; dono e gestor cadastram produtos e entradas de estoque.
As atualizações de dados preservam os campos e a posição do formulário. Rascunhos
são mantidos durante a navegação da sessão; salve antes de fechar o aplicativo.

O SQL v85 não apaga produtos, vendas ou estoque. Requer a estrutura v84 já instalada.
Caso a v84 ainda não esteja configurada, execute primeiro o SQL v84 incluído no pacote.
Não é necessário repetir outros SQLs. Não altere os segredos VAPID ou a função de push.

### Comissão pessoal no dashboard

Na visão de barbeiro, abaixo do ritmo da semana, **Sua comissão em produtos** exibe
o percentual atual e o valor acumulado do mês em suas próprias vendas aprovadas.
O total usa a comissão gravada em cada venda; não recalcula registros antigos ao
trocar a porcentagem. Vendas antigas sem comissão registrada ficam fora do valor
e recebem um aviso. Custos e margens da barbearia não aparecem neste cartão.
O resumo consulta apenas a conta conectada e atualiza em até cerca de 20 segundos
enquanto o dashboard estiver aberto. O mês segue o horário de São Paulo.

Se o SQL v85 anterior já foi executado, execute este arquivo v85 atualizado novamente
em uma consulta nova para adicionar o resumo pessoal. O script pode ser repetido.

## Histórico da estrutura v84 (já instalada)

## Atualização v84

1. No Supabase → SQL Editor, abra uma consulta nova, copie todo o arquivo
   `barberxp-produtos-comissoes-v84.sql` e execute. Preserve as consultas antigas.
2. Extraia o pacote na raiz do projeto BarberXP, substituindo os arquivos.
3. Faça commit e push. Aguarde a publicação e reabra o aplicativo.
4. Na visão do dono ou gestor, abra **Produtos**. Cadastre nome, custo por unidade e preço
   de venda. As comissões começam em **15% para barbeiros** e **10% para recepção**.
5. Salve o catálogo e as comissões antes de registrar entradas no estoque.
   Uma entrada representa a quantidade comprada; uma venda representa uma unidade.

O SQL v84 é único e inclui a estrutura de entradas, caso ela ainda não exista.
Ele não apaga dados nem reexecuta migrações de missões, push ou fotos.
Se o SQL v83 já foi executado, não é necessário repeti-lo.

### Cálculos e histórico

Ao registrar, escolha **Cliente do plano** ou **Cliente avulso**. Clientes do plano
têm 10% de desconto, aplicado pelo banco ao preço do catálogo. O avulso paga o preço
integral. A escolha não valida automaticamente a assinatura: o vendedor a informa.
Os relatórios separam vendas, faturamento e descontos por tipo de cliente.

Comissão = valor efetivamente vendido (após desconto) × percentual da função.
Margem = venda após desconto − custo − comissão.
Os cálculos monetários são arredondados para centavos. Margem não representa lucro
líquido: taxas, impostos e despesas ainda não são descontados.

O banco registra produto, preço de tabela, tipo de cliente, desconto, valor vendido,
custo, função, percentual e comissão no lançamento.
Trocar preço, custo ou função posteriormente não altera os valores daquela venda.
Somente vendas aprovadas entram no resultado mensal e reduzem o estoque.
Vendas antigas sem comissão registrada são identificadas e ficam fora do cálculo
completo; não são convertidas automaticamente em comissões a pagar.
Entradas antigas sem custo também são preservadas sem inventar um valor histórico.

O dono e o gestor podem cadastrar produtos, registrar entradas, selecionar o mês e
conferir valores e comissões. Somente o dono altera percentuais de comissão e meta.
Barbeiros continuam escolhendo o tipo de cliente e o produto, sem valores financeiros
na seleção. Gestores veem o preço correto na venda; custos e margens ficam na gestão.
A comissão escalonada fica para uma próxima versão.

### Validação v84

Testes locais de PostgreSQL: regras 15%/10%, autorização do dono, gravação atômica,
valores calculados pelo banco, desconto de 10% antes da comissão, preservação do
histórico, acesso do gestor ao catálogo/estoque e migração repetível.
Testes de interface simulada: cadastro, rascunho, navegação, falha de envio,
clique repetido, margens e exclusão de pendentes. Também foram repetidos os cenários
de ocorrências, fotos e apelido do v83. Falta a conferência nos aparelhos reais após
a publicação no seu projeto.

## Recursos mantidos do v83

Esta versão parte da v82, mantendo seu código de notificações, resumo semanal,
missões, medalhas por resgate, ranking mensal e ritmo da equipe.

### Instalação inicial da personalização (somente se o SQL v83 ainda não foi executado)

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
