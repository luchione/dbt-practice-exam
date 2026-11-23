/* Extra set: conceptual contrasts (quoting, artifacts, grants, versions, flags, result selectors). */
window.DBT_Q.push(
{
  id: 'cs2-d1-quote-source', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `On Snowflake, an ELT tool created the table ~"OrderItems"~ with a quoted, mixed-case name. Models that call ~source('crm', 'OrderItems')~ fail with "Object does not exist". What is the dbt way to fix it?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/crm/_sources.yml',
      text: `
    sources:
      - name: crm
        database: RAW
        schema: CRM
        tables:
          - name: OrderItems`
    }
  ],
  options: [
    `Add ~quoting: {identifier: true}~ to the ~OrderItems~ table entry (or to the ~crm~ source).`,
    `Add ~quote: true~ to every column of ~OrderItems~.`,
    `Add an ~on-run-start~ hook that sets ~QUOTED_IDENTIFIERS_IGNORE_CASE = TRUE~ for the session.`,
    `Rename the table entry to ~ORDERITEMS~.`
  ],
  answer: 0,
  exp: [
    `Sem aspas, o dbt gera ~RAW.CRM.OrderItems~ e o Snowflake converte para ~ORDERITEMS~, que não existe. Com ~quoting: {identifier: true}~ na tabela (ou na source inteira), o dbt gera ~"OrderItems"~ e preserva a caixa.`,
    `~quote: true~ nas colunas resolve nomes de **coluna**, não da tabela. Mudar parâmetros de sessão num hook é um contorno fora do dbt e afeta todas as consultas. ~ORDERITEMS~ continuaria sem bater com a tabela criada com aspas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/quoting'
},
{
  id: 'cs2-d1-quote-override', d: 'd1', type: 'domc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `The source ~crm~ sets ~quoting: {identifier: false}~, and its table ~OrderItems~ sets ~quoting: {identifier: true}~. The source has two other tables with no quoting config. Which statement is correct?`,
  options: [
    `Only ~OrderItems~ is quoted; the table-level setting overrides the source-level one, and the other tables follow the source.`,
    `No table is quoted, because the source-level setting wins.`,
    `All three tables are quoted, because any ~true~ applies to the whole source.`,
    `dbt raises a parsing error because the two settings conflict.`
  ],
  answer: 0,
  exp: [
    `O ~quoting~ pode ficar na source ou em cada tabela. A configuração da tabela sobrescreve a da source, então só ~OrderItems~ vai com aspas. As outras herdam ~identifier: false~ da source.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/quoting'
},
{
  id: 'cs2-d1-art-match', d: 'd1', type: 'match',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Match each dbt artifact to what it records. One option is not used.`,
  left: [
    `~manifest.json~`,
    `~catalog.json~`,
    `~run_results.json~`,
    `~sources.json~`
  ],
  right: [
    `Every node's configs, dependencies, and declared database, schema, and identifier, written when dbt parses the project`,
    `Column data types and relation metadata read from the warehouse`,
    `Status and timing of each node in the last executed command`,
    `Freshness results of ~dbt source freshness~`,
    `The DDL history of each raw table`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• ~manifest.json~ é **estático**: sai da leitura do projeto e guarda o que foi declarado.`,
    `• ~catalog.json~ é gerado consultando os metadados do warehouse (tipos das colunas, por exemplo), na geração da documentação.`,
    `• ~run_results.json~ guarda o resultado da última execução, e é dele que ~dbt retry~ e o seletor ~result:~ leem.`,
    `• ~sources.json~ guarda os resultados de freshness, usados pelo seletor ~source_status:~.`,
    `Nenhum artefato do dbt guarda DDL de tabelas brutas.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/dbt-artifacts'
},
{
  id: 'cs2-d1-man-static', d: 'd1', type: 'domc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `A source table was declared in YAML, but nobody has created it in the warehouse yet. Which statement about how ~manifest.json~ describes this source is correct?`,
  options: [
    `It records the declared database, schema, identifier, and unique_id, whether or not the table exists, because the manifest comes from parsing the project.`,
    `It leaves the source out until the table exists in the warehouse.`,
    `It stores the table's row count, captured when the project is parsed.`,
    `It stores the table's CREATE TABLE statement so dbt can recreate it.`
  ],
  answer: 0,
  exp: [
    `O manifest descreve o projeto como foi **declarado**. Por isso serve para verificar dependências brutas de forma estática (qual tabela física cada ~source()~ usa), mas não prova que a tabela existe nem diz quantas linhas tem.`,
    `Para checar os dados de verdade, use testes e freshness na source. Metadados lidos do warehouse vão para o ~catalog.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/manifest-json'
},
{
  id: 'cs2-d1-gr-access-to', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `On BigQuery, the view model ~rpt_orders~ lives in the dataset ~reporting~ and selects from tables in the dataset ~raw_sales~. Analysts must be able to query the view without getting any access to ~raw_sales~. What do you configure on ~rpt_orders~?`,
  options: [
    `~grant_access_to~ with the ~raw_sales~ dataset, which makes the view an authorized view, plus ~grants~ with ~roles/bigquery.dataViewer~ for the analysts.`,
    `Only ~grants~ with ~roles/bigquery.dataViewer~ for the analysts on the ~raw_sales~ tables.`,
    `Replace ~grants~ with ~grant_access_to~ and list the analysts' e-mails in it.`,
    `Materialize ~rpt_orders~ as ephemeral, so no permission is needed.`
  ],
  answer: 0,
  exp: [
    `São dois configs diferentes. ~grant_access_to~ autoriza a **view** a ler outro dataset (authorized view). ~grants~ dá permissões a **pessoas, grupos ou service accounts** sobre a relação do modelo. Juntos, os analistas leem só o resultado da view.`,
    `~grant_access_to~ não substitui ~grants~ e não recebe usuários. Dar ~dataViewer~ em ~raw_sales~ abriria os dados brutos, e um modelo ephemeral nem cria objeto no warehouse.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/bigquery-configs'
},
{
  id: 'cs2-d2-ver-pointer', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_orders~ has ~latest_version: 2~, and v3 is ready. A teammate creates a view named ~dim_orders~ that selects from ~dim_orders_v3~ and expects every unpinned ~ref('dim_orders')~ in the project to start using v3. What happens?`,
  options: [
    `Unpinned refs still resolve to v2; only changing ~latest_version~ to 3 moves them.`,
    `Unpinned refs now resolve to the view, and therefore to v3.`,
    `Unpinned refs resolve to v3 because it is the highest version number.`,
    `Unpinned refs resolve to v3 after the next ~dbt deps~.`
  ],
  answer: 0,
  exp: [
    `Quem decide o destino de um ~ref()~ sem ~v~ é a propriedade ~latest_version~. Uma view com o nome base do modelo (o "pointer" da versão mais recente) só ajuda quem consulta fora do dbt, como ferramentas de BI. Ela não muda a resolução dos refs.`,
    `A regra da maior versão só vale quando ~latest_version~ não está definido. Aqui ele está fixado em 2.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs2-d3-bf-bugfix', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `A new dbt release corrects a defect: a config that the docs say should apply was silently ignored in some cases. Will this correction ship behind a behavior change flag?`,
  options: [
    `No. Fixing defective or undocumented behavior isn't a behavior change, so the fix ships directly in the release.`,
    `Yes, introduced disabled by default, so projects can opt in.`,
    `Yes, enabled by default, with an opt-out in ~dbt_project.yml~.`,
    `Only if the fix also adds a new warning.`
  ],
  answer: 0,
  exp: [
    `A documentação separa os casos: behavior change é uma mudança **intencional** em que o mesmo código passa a dar outro resultado. Correções de bug, avisos novos e adições que não quebram nada não são behavior changes e não ganham flag.`,
    `As flags existem para que mudanças deliberadas sigam o ciclo introduced (desligada), mature (ligada) e removed.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs2-d7-result-subset', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `In dbt Core 1.11, last night's ~dbt build~ errored on two models and skipped their downstream nodes. Its artifacts were saved in ~prod-run/~. You want to rerun the errored models and everything downstream of them, except the models tagged ~heavy~. Since ~dbt retry~ can't narrow its scope in Core, which command does this?`,
  options: [
    `~dbt build --select "result:error+" --exclude tag:heavy --state prod-run~`,
    `~dbt build --select "state:modified+" --exclude tag:heavy --state prod-run~`,
    `~dbt retry --exclude tag:heavy~`,
    `~dbt build --select "source_status:fresher+" --exclude tag:heavy --state prod-run~`
  ],
  answer: 0,
  exp: [
    `~result:error~ lê os status do ~run_results.json~ em ~--state~ e pega os nós que deram erro; o ~+~ inclui os que dependem deles (os que foram pulados). Como é um ~dbt build~ comum, ~--exclude~ funciona.`,
    `~state:modified~ compara **código** com o manifest, não resultados de execução. ~--exclude~ no retry só existe no dbt v2. ~source_status:fresher~ compara freshness de sources.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#result'
},
{
  id: 'cs2-d7-st-newmodel', d: 'd7', type: 'multi',
  choose: 2,
  topic: 'Understanding state and state selection',
  stem: `In your branch you added a new model, ~fct_refunds~, that doesn't exist in production. Comparing with the production manifest, which two selectors include it? (Choose two.)`,
  options: [
    `~state:new~`,
    `~state:modified~`,
    `~state:old~`,
    `~state:unmodified~`,
    `~result:success~`
  ],
  answers: [0, 1],
  exp: [
    `Um nó que não existe no manifest de comparação é ~state:new~, e ~state:modified~ também o inclui, porque "modified" engloba os novos e os alterados.`,
    `~state:old~ e ~state:unmodified~ só pegam nós que já existiam. ~result:success~ olha o ~run_results.json~, e um modelo novo não tem resultado anterior.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cs2-d7-sel-artifact', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Each of these selector methods needs ~--state~, but compares different things. Match each method to what it reads. One option is not used.`,
  left: [
    `~state:~`,
    `~result:~`,
    `~source_status:~`
  ],
  right: [
    `Project code and configs, compared with a previous ~manifest.json~`,
    `Node statuses from a previous ~run_results.json~`,
    `Source freshness, compared with a previous ~sources.json~`,
    `Column types from a previous ~catalog.json~`
  ],
  answer: [0, 1, 2],
  exp: [
    `• ~state:~ responde "o que mudou no código?".`,
    `• ~result:~ responde "o que falhou ou passou na última execução?".`,
    `• ~source_status:~ responde "quais sources têm dados mais novos?".`,
    `O ~dbt retry~ também usa o ~run_results.json~, mas repete a seleção anterior em vez de aceitar um seletor novo (no dbt Core).`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods'
},
{
  id: 'cs2-d7-r-fixorder', d: 'd7', type: 'order',
  topic: 'Using dbt retry',
  stem: `A ~dbt build~ of 12 models fails midway: ~int_orders~ errors with a SQL compilation error, and two downstream models are skipped. Put the steps in order.`,
  items: [
    `Read the error in the logs (or ~run_results.json~) to find the failing node and the cause.`,
    `Fix the SQL in ~int_orders~.`,
    `Run ~dbt retry~ to rerun ~int_orders~ and the two skipped models.`,
    `Check that all three now finish with status OK and their tests pass.`,
    `Commit the fix and open a pull request.`
  ],
  exp: [
    `Diagnosticar, corrigir, retomar, verificar e só então registrar a correção. A verificação vem **depois** do retry, para confirmar que ele resolveu.`,
    `O retry roda só o nó que falhou e os que foram pulados por causa dele, sem refazer os nove que já tinham dado certo.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
