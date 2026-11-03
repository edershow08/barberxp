# BarberXP v94 — edição de comissões e seleção de profissionais

Atualização de interface sobre a v93. Não há SQL novo; permanece a estrutura da v92.

Comissões: dono pode editar valores e percentuais mesmo com a flag desligada. A flag controla a aplicação da regra. Para aplicar os novos limites/percentuais, ative a função e salve. Enquanto edita, os controles não são recriados pela sincronização; o rascunho fica preservado. Gestores continuam sem permissão de configurar comissões.

Unidades: seleção interna de profissional com lista e busca substitui o seletor nativo. Clique em Selecionar profissional, busque o nome, clique na pessoa e use Adicionar à unidade para gravar. O seletor aberto e o texto da busca permanecem intactos durante atualizações. A escolha em si não faz requisição ao banco. Ao concluir, o foco retorna ao cabeçalho do seletor, evitando manter um campo oculto em foco.

Validação local de primeira abertura com dados atrasados, clique com MouseEvent, busca/seleção, atualização durante menu aberto, edição com flag desligada, alternância da flag, preservação do valor/percentual, permissões de gestor e regressão de gráfico/unidades. Ainda não testado no navegador físico do usuário.

Substitua os arquivos, publique e confira BarberXP v94 no rodapé.

---

# BarberXP v93 — correções de interface e carregamento

Esta é uma atualização de interface sobre a v92. Quem já executou barberxp-atualizacao-v92.sql não precisa de um novo SQL. Substitua os arquivos, publique e confira BarberXP v93 no rodapé.

Equipe: Unidades e profissionais aparece no início da página, sem depender de abrir um menu recolhido. Cada unidade tem o campo de nome, Salvar nome, profissionais vinculados abaixo e um seletor Adicionar à unidade para mover ou vincular pessoas. Profissionais sem unidade aparecem separados. O carregamento cria os campos mesmo quando o banco responde depois da primeira abertura. Alterar unidade afeta próximos registros; não move histórico já vinculado.

Gráficos: seleção isolada por usuário, função e mês; profissional, dia e indicador mantidos durante sincronizações, inclusive respostas temporariamente vazias. A imagem do gráfico permanece estável; Atualizar dados do gráfico busca novos registros. Cliques no profissional, no dia e no indicador mudam apenas a área do gráfico. Os relatórios de produção continuam sincronizando.

Produtos: painel Comissão escalonável com abas Configuração e Histórico de comissões, sem menus de configuração duplicados. Dois cartões com quatro valores e quatro percentuais editáveis, seguindo a organização aprovada. Regra antes da primeira meta disponível no detalhe logo abaixo de cada cartão; a validação abre esse campo quando necessário. Cálculo, regras financeiras e histórico da v92 permanecem iguais.

Testes locais: entrada na página com listas vazias, resposta atrasada cria unidades e comissões sem navegar novamente; edição e vinculação com permissões; cliques reais em profissional, dia, indicador e abas; atualizações e listas temporariamente vazias não mudam a seleção. Não houve teste no banco de produção nem no iPhone real.

---

# BarberXP v92 — unidades editáveis, comissão aprovada e contraste

## Instalação desta atualização

1. Execute apenas barberxp-atualizacao-v92.sql numa nova consulta do SQL Editor do Supabase. O arquivo reúne as migrações sobre a estrutura de produtos já instalada. Não apaga contas, ações nem histórico.
2. Substitua os arquivos do aplicativo em C:\Users\Nicolas\barberxp, publique e confira BarberXP v92 no rodapé. A função admin-team não precisa ser alterada.

Equipe → Unidades da equipe: o dono pode editar o nome de cada unidade e salvar. A unidade mantém o ID; profissionais, registros e comissões não mudam de unidade ao renomear. Abaixo, selecione profissional e unidade para distribuir a equipe. A opção de vincular registros antigos só alcança ações ainda sem unidade; não move históricos já vinculados. Campos preservam o rascunho durante sincronização. Nomes duplicados e alterações concorrentes são sinalizados.

Produtos → Comissão escalonável: visual aprovado, quatro metas e quatro percentuais editáveis por função. Valores propostos 140/220/300/400 e percentuais 10/15/20/25 não são ativados automaticamente. Antes de ativar, defina também o percentual antes da primeira meta. É possível informar zero, ou o percentual desejado. O cálculo por parcelas continua como escolhido anteriormente: cada parte da venda recebe a porcentagem da sua faixa; não aplica a maior porcentagem ao total inteiro. A configuração segue nos próximos meses até alteração. Salvar recalcula o mês atual e preserva meses encerrados. Cada profissional acumula suas próprias vendas; a soma considera todas as unidades, e o relatório distribui os valores pela unidade de cada venda. Desligar a regra preserva o percentual fixo registrado nas vendas.

A meta de margem é opcional (zero ou em branco significa sem meta). Nomes personalizados de unidades permanecem ao executar o SQL novamente. Temas claro e escuro recebem contraste maior em textos, campos e navegação; campos de entrada têm 16px para facilitar o uso no celular, com marca BarberXP no topo mobile e menu oliva no notebook.

Validação local: banco SQL, limites das faixas e permissões, edição e atribuição de unidades, repetição do instalador, rascunhos e cliques duplicados na interface; pares principais de texto/fundo com contraste mínimo 4,5:1. Não houve teste conectado ao banco de produção nem confirmação dos valores reais da Edna.

---

# BarberXP v91 — recepção no gráfico e comissão escalonável

1. Execute barberxp-atualizacao-v91.sql no SQL Editor, em nova consulta. É o único SQL necessário para esta atualização sobre a v90. Ao final aparece uma tabela de diagnóstico das vendas da recepção por mês: aprovadas, pendentes, recusadas e registros sem cálculo. Ela não inventa comissão nem altera vendas antigas.
2. Substitua os arquivos do aplicativo, publique e confira BarberXP v91 no rodapé. A função admin-team permanece igual.

Em Produtos, Comissão escalonável fica acima do estoque. Barbeiros/dono e recepção/gestores aparecem juntos, cada função com sua chave de ativação e limites de venda para 15%, 20% e 25%; a primeira faixa é 10%. Uma configuração segue vigente nos meses posteriores até ser alterada; o acumulado individual reinicia a cada mês. Salvar recalcula o mês atual e preserva meses encerrados. O histórico consultado não muda o formulário de configuração.

A meta mensal de margem é editável no fim do mesmo bloco. Nenhum valor de meta nem limites novos são inventados. Ao desligar as faixas, os percentuais fixos registrados nas vendas são preservados.

Equipe: o gráfico existente inclui recepção individual, recepção total e equipe total, com produtos e assinaturas entre as métricas. Mede vendas registradas/aprovadas, sem presumir a causa de uma queda. Os avisos no relatório distinguem vendas pendentes e sem cálculo; vendas antigas sem dados completos precisam ser conferidas antes de pagar comissão.

A implementação e os cenários de SQL e interface foram testados localmente. O banco de produção da Edna não foi consultado; o resultado final da consulta permite identificar o motivo do zero sem alterar o histórico.

---

# Complemento v90.2 — produção de toda a equipe

Produção inclui dono, barbeiros, gestores e recepção. Comissões lista todos os ativos, mesmo sem vendas aprovadas, e preserva vendas anteriores de desativados. Valores são calculados somente com vendas aprovadas; registros antigos sem cálculo permanecem sinalizados.

Quem já instalou v90.1 executa apenas barberxp-equipe-completa-v90.2.sql e atualiza o aplicativo. A função admin-team não precisa ser alterada.

# BarberXP v90.2 — comissão por faixa, equipe ativa e cadastro confirmado

## Complemento desta mesma atualização

Ao desativar, o colaborador sai automaticamente da equipe ativa, do ranking
atual. Sua produção aprovada permanece no relatório do período. Quem já estava inativo também deixa de aparecer na
lista de equipe. As vendas, ocorrências, temporadas anteriores e comissões
continuam registradas para conferência e acerto. Nenhuma conta é apagada com
exclusão física, que destruiria dados ligados ao colaborador. Novas ações de
contas desativadas são bloqueadas no banco. A produção já registrada da loja
continua nos relatórios financeiros e na meta coletiva.

Os campos de nome/e-mail da ficha em **Equipe → Equipe ativa** ficam editáveis
para o dono. **Salvar cadastro** só mostra sucesso depois de confirmar os valores
persistidos. Rascunhos ficam preservados durante a sincronização; a atualização
não pode restaurar o nome antigo recebido por uma consulta que começou antes
do salvamento. **Recarregar cadastro** permite buscar uma edição feita em outro
aparelho. Gestores não ganham permissão de editar acessos.

### Instalação adicional para mudar e-mail de colaborador

1. Execute **barberxp-comissoes-v90.sql atualizado**, mesmo se já executou a
   primeira versão v90. Continua sendo o único SQL necessário.
2. Supabase → **Edge Functions → Deploy a new function → Via Editor**: crie a
   função com o nome exato **admin-team**. Substitua o conteúdo de `index.ts`
   pelo arquivo **barberxp-admin-equipe-v90.ts** entregue junto ao pacote e publique.
   O mesmo código está em `supabase/functions/admin-team/index.ts` neste projeto.
   Mantenha a verificação de JWT ativa. A função também valida a sessão no Auth
   e exige perfil ativo de dono antes de qualquer alteração administrativa.
3. Extraia o pacote na raiz do projeto, substitua os arquivos, faça commit/push
   e confira **BarberXP v90.2** no rodapé após a publicação.

Como alternativa para quem já usa a CLI: `supabase functions deploy admin-team`.
O projeto deve estar ligado ao Supabase correto e autenticado na CLI.

Não altere `send-push`, VAPID ou as configurações de notificações. A nova função
usa as variáveis de servidor fornecidas pelo Supabase, com preferência pela
chave secreta de servidor atual e compatibilidade com service_role existente.
Nenhuma chave administrativa vai para o HTML. Nome sem troca de e-mail é salvo
por uma função do banco exclusiva do dono; trocar e-mail exige publicar admin-team.

O e-mail alterado passa a ser o e-mail de acesso. A função verifica duplicidade
e alterações concorrentes e confirma nome/e-mail no Auth e no cadastro. A troca
administrativa usa confirmação pelo dono. O colaborador usará o novo e-mail e
a senha que já possui. Não reutilize a conta de alguém que saiu para uma pessoa
nova: cadastre outro acesso para manter o histórico e as comissões corretos.

Referências técnicas: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
e https://supabase.com/docs/guides/functions/secrets.

## Funcionalidades de comissão desta versão

## Atualizar

1. Em uma consulta nova do Supabase SQL Editor, execute inteiro
   **barberxp-comissoes-v90.sql**. É o único arquivo necessário nesta atualização:
   ele inclui a estrutura v89 e o cálculo v90. Requer produtos/comissões v84 e as
   atualizações v85/v86 já instaladas. Não apaga vendas nem ativa faixas automaticamente.
2. Extraia o pacote na raiz do projeto, substitua os arquivos e faça commit/push.
3. Aguarde a publicação e reabra o aplicativo. Confira **BarberXP v90** no rodapé.

## Comissão escalonada escolhida: por parcela de venda

Em **Produtos → Comissões e meta de margem → Comissão escalonada**, o dono escolhe
a função (barbeiro/dono na produção ou recepção/gestor), define os limites de venda
para iniciar 15%, 20% e 25%, marca a ativação e salva. A faixa inicial é 10%.
Não foram inventados limites nem alteradas as porcentagens fixas de 15%/10%.
Enquanto uma função estiver sem faixas ativadas, mantém a comissão fixa gravada
nas vendas. Funções podem ser ativadas separadamente.

Exemplo APENAS ilustrativo: limites R$ 100, R$ 200 e R$ 300. Com R$ 350 vendidos,
as parcelas são R$ 100 × 10% + R$ 100 × 15% + R$ 100 × 20% + R$ 50 × 25%:
comissão R$ 57,50. O percentual mais alto não é aplicado sobre todo o mês.

Só entram vendas aprovadas e valores após o desconto de 10% do assinante.
A progressão é individual no mês e soma as vendas do profissional em todas as
unidades. A comissão é então distribuída entre unidades pelas vendas respectivas.
Uma venda que atravessa um limite é dividida entre as faixas, com cálculo em centavos.
Estornos e novas aprovações recalculam o resultado calculado do período.

Salvar ou desativar a regra altera a comissão calculada do mês selecionado. A
última regra de cada função continua nos próximos meses até uma configuração
posterior. Regras de meses encerrados só podem ser consultadas; não se alteram
ao editar o mês atual. Os valores originais de preço, custo e comissão nas vendas
ficam preservados para auditoria. Não há registro de pagamentos nesta versão:
o valor exibido é a comissão calculada, não um saldo que desconta pagamentos já feitos.

## Como consultar e baixar o mês anterior

- Em **Produtos**, use **Consultar comissões e meses anteriores**.
- Dentro do histórico, toque **Mês anterior** ou escolha o mês na lista/filtro.
- Escolha unidade e profissional, se quiser, e consulte os valores nos cartões
  do celular ou na tabela do computador. **Baixar relatório CSV** exporta o filtro.
- Em **Temporadas**, o botão **Consultar comissões desta temporada** abre o mesmo
  histórico no mês escolhido.

Vendas antigas sem preço/custo/comissão registrados são sinalizadas e não recebem
estimativas. No CSV esses valores ficam em branco quando todo o grupo está sem
cálculo. Isso evita confundir um valor desconhecido com uma comissão de zero reais.
Barbeiros continuam vendo somente a própria comissão no dashboard, agora com a
indicação de comissão por faixa quando estiver ativa. Gestor pode consultar o
relatório, mas não configurar limites ou ativar faixas.

## Referência da v89

## Atualizar sobre v88

1. Supabase → SQL Editor → consulta nova: execute inteiro
   `barberxp-relatorio-profissionais-v89.sql`. Pode repetir, sem apagar dados.
2. Extraia este pacote na raiz do projeto, substitua os arquivos, faça commit e push.
3. Aguarde a publicação e reabra o aplicativo. Confira **BarberXP v89** no rodapé.

### Onde consultar os valores

Em **Produtos**, abra a última seção **Vendas e comissões por profissional**.
Selecione mês, unidade e, opcionalmente, profissional. No computador há uma tabela;
no celular, cartões com os valores visíveis: vendas, percentual(is), comissão e
margem após custo e comissão. O total inclui vendas, custo, comissões e margem.
Quando um profissional está selecionado, o total corresponde somente a ele.

O relatório lê todas as ações aprovadas do mês no banco, sem limite de 1.000 linhas
do cliente. O mês segue São Paulo. Usa o preço após desconto do plano e a comissão
gravados em cada venda, sem recalcular o passado. Percentuais distintos no mesmo
mês aparecem juntos. Não representa saldo pago ou líquido de impostos/despesas.
Registros antigos sem cálculo são sinalizados e excluídos dos valores monetários.
Falhas de carregamento exibem aviso, sem apresentar um zero como resultado real.

### Unidades: primeira configuração pelo dono

A base anterior não tinha unidade vinculada aos profissionais. O SQL cria
**Unidade 1** e **Unidade 2**, sem atribuir ninguém automaticamente.
No painel do dono, vá a **Equipe → Unidades da equipe**, selecione profissional
e unidade e salve. As próximas ações preservarão a unidade da data do registro.

Para registros antigos, marque **Vincular também os registros anteriores...**
somente se aqueles registros realmente pertencem à unidade selecionada.
A opção vincula apenas registros ainda sem unidade. Transferir alguém depois
não altera registros que já estavam vinculados. Sem configuração, os totais
continuam consultáveis em **Todas as unidades** ou **Sem unidade definida**.

### Gestor e visual mobile

O gestor tem **Equipe**, com produção dos barbeiros, dono e recepção, inclusive
a sua própria. Consulta mês/unidade/profissional, apenas ações aprovadas.
Não ganha edição de acessos nem permissão de alterar unidades ou percentuais.
Ocorrências continuam em uma seção recolhida, com proteção do formulário.

Registrar usa **+**, Ranking usa **troféu**, Loja usa **presente**. O visual mobile
do pódio e dos cartões de prêmios foi ajustado sem alterar pontuação, ordem do
ranking, estoque, resgates ou regras de premiação. Não foram incluídas fotos de
prêmios fictícios nem as novas abas de agenda/clientes desenhadas na ilustração.

Os relatórios de gestão exigem conta ativa de dono/gestor e são bloqueados no
banco para barbeiros. O resumo pessoal do barbeiro permanece separado.

## Referência da v88

## Instalar v88 sobre v86 ou v87

Extraia na raiz do projeto substituindo os arquivos, faça commit e push, aguarde
a publicação e reabra o aplicativo. Não precisa de outro SQL se o v86 foi executado.
O rodapé mostra **BarberXP v88**.

O painel do dono mostra primeiro a meta coletiva, depois atalhos de aprovação e
equipe e acesso a relatórios/temporadas e produtos. O barbeiro mantém os números
reais, suas missões e bônus, ranking compacto e comissão pessoal. A comparação
mensal fica em **Minha evolução**, que pode ser expandida. O ritmo ganha linha
contínua e pontos, mantendo os dias clicáveis e o detalhamento dos serviços.

Navegação inferior no celular do barbeiro: Início, Registrar, Ranking e Loja.
O menu completo continua disponível. As telas usam os mesmos campos, cartões,
botões e ícones, com contraste de grafite/verde no escuro e tema claro disponível.
Nenhum número de demonstração da imagem foi incorporado. Cadastros, vendas,
aprovações, pontos, medalhas e regras atuais são preservados.

## Referência da v87

## Instalar v87 sobre v86

Esta atualização corrige as superfícies que ainda usavam o azul anterior e adiciona
ícones vetoriais verdes: caixa no estoque, etiqueta no cadastro, lista na consulta,
gráfico nas vendas e alvo nas comissões. A navegação usa ícones da mesma família.
A quantidade possui controles + e −. O rodapé mostra **BarberXP v87** para conferir
se a publicação correta está aberta. A imagem é referência visual, não captura do app.

Extraia na raiz do projeto substituindo os arquivos, faça commit e push, aguarde
a publicação e reabra o aplicativo. Não precisa de outro SQL se o v86 foi executado.
Na primeira abertura desta atualização, o tema escuro aprovado é ativado uma vez.
Depois a pessoa pode voltar ao tema claro nas configurações, se preferir.

## Referência da estrutura v86

## Instalar v86

1. Supabase → SQL Editor → consulta nova: execute somente
   `barberxp-produtos-visual-v86.sql` inteiro. Esse arquivo reúne o v85 atualizado
   (incluindo a comissão pessoal) e a reposição v86. Pode repetir se já executou
   o v85: não apaga os registros. Requer a estrutura de produtos v84 já instalada.
2. Extraia o pacote na raiz do projeto, substitua os arquivos, faça commit e push.
3. Aguarde a publicação e reabra o aplicativo.

Em **Produtos**, a entrada de estoque fica aberta: selecione o produto existente,
informe a quantidade e use **Salvar entrada de estoque**. Isso soma ao estoque e
não altera nome, preço ou custo. A tela mostra o estoque atual e a previsão após
a entrada; vendas pendentes só reduzem estoque quando aprovadas.

**Cadastrar ou editar produtos**, **Consultar estoque**, **Vendas e resultados**
e **Comissões e meta de margem** são seções recolhidas. A criação de um produto
mantém o botão que salva produto e quantidade inicial juntos. A comissão pessoal
continua abaixo do ritmo da semana no dashboard do barbeiro.

A paleta escura utiliza grafite, cartões escuros e botões verdes. O tema claro
continua disponível. A navegação e as permissões das funções são preservadas.

## Referência da v85

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
