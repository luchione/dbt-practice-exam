/* Extra set: packages, quoting, manifest, snapshots, grants on BigQuery, versions, behavior flags, clone, state, retry. */
window.DBT_Q.push(
{
  id: 'cs-d1-pkg-local', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `In a monorepo, the ~marketing~ dbt project and an internal macro package, ~core_macros~, live in sibling folders. Developers edit ~core_macros~ and want ~marketing~ to use their working copy right away, without committing, tagging, or publishing anything. Which ~packages.yml~ entry fits?`,
  options: [
    `~- local: ../core_macros~`,
    `~- git: "https://github.com/org/core_macros.git"~ with no ~revision~`,
    `~- package: org/core_macros~ with ~version: latest~`,
    `~- tarball: https://artifacts.example.com/core_macros.tar.gz~`
  ],
  answer: 0,
  exp: [
    `~local:~ aponta para uma pasta no mesmo sistema de arquivos, com caminho relativo ao projeto. O ~dbt deps~ liga o pacote a essa pasta, então o projeto lê o código como ele está no disco, parecido com uma instalação editável do Python.`,
    `Git, Hub e tarball baixam uma versão publicada: as edições só chegam depois de commit (ou release) e de um novo ~dbt deps~. Sem ~revision~, o dbt ainda avisa que a instalação pode trazer mudanças inesperadas.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-pkg-norev', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `A ~packages.yml~ entry uses ~- git: "https://github.com/org/finance_utils.git"~ with no ~revision~. What does dbt do, and what is the recommended fix?`,
  options: [
    `It installs the package but warns that this can introduce breaking changes without warning; pin a tag or commit with ~revision~.`,
    `It refuses to install the package until a ~revision~ is added.`,
    `It installs the latest release from dbt Hub instead of Git.`,
    `It installs the package and re-fetches it automatically before every ~dbt run~.`
  ],
  answer: 0,
  exp: [
    `Sem ~revision~, o dbt instala o pacote e avisa que isso pode trazer mudanças que quebram o projeto sem aviso. O ~package-lock.yml~ registra o commit instalado, mas o certo é fixar uma tag ou um commit em ~revision~.`,
    `Pacotes só são baixados no ~dbt deps~, nunca a cada ~dbt run~, e uma URL de Git nunca vira uma instalação do Hub.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-pkg-match', d: 'd1', type: 'match',
  topic: 'Using dbt Packages',
  stem: `Match each ~packages.yml~ syntax to where dbt gets the package from. One option is not used.`,
  left: [
    `~package:~ with ~version:~`,
    `~git:~ with ~revision:~`,
    `~local:~`,
    `~tarball:~`
  ],
  right: [
    `dbt Hub, using a version or version range`,
    `A Git repository, at a tag, branch, or commit`,
    `A folder on the same file system`,
    `An archive downloaded from a URL`,
    `A Python wheel installed with pip`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• ~package:~ + ~version:~ usa o dbt Hub e aceita faixas como ~[">=1.1.0", "<2.0.0"]~.`,
    `• ~git:~ + ~revision:~ instala de um repositório, fixado numa tag, branch ou commit.`,
    `• ~local:~ usa uma pasta do disco, útil em monorepos e para testar mudanças num pacote.`,
    `• ~tarball:~ baixa um arquivo compactado de uma URL.`,
    `Pacotes dbt não são instalados com pip; o adapter e o dbt Core é que são.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-quote-column', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `On Snowflake, an ELT tool created a source column with a quoted, mixed-case name: ~"CustomerID"~. The ~not_null~ test declared on that column in the source YAML fails with an invalid identifier error. What is the fix?`,
  options: [
    `Add ~quote: true~ to the ~CustomerID~ column in the source YAML.`,
    `Add ~quoting: {identifier: true}~ to ~dbt_project.yml~.`,
    `Rename the column entry to ~customerid~ in the YAML.`,
    `Add an ~on-run-start~ hook that sets ~QUOTED_IDENTIFIERS_IGNORE_CASE = TRUE~.`
  ],
  answer: 0,
  exp: [
    `Nomes de **coluna** são citados com a propriedade ~quote: true~ na própria coluna. Sem ela, o teste gera ~CustomerID~ sem aspas, o Snowflake converte para ~CUSTOMERID~ e não encontra a coluna.`,
    `O config ~quoting:~ (database, schema, identifier) vale para nomes de **relações**, ou seja, tabelas e views, não para colunas. Mudar parâmetros da sessão do Snowflake num hook afeta tudo e não é a forma do dbt de resolver isso.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/columns'
},
{
  id: 'cs-d1-quote-domc', d: 'd1', type: 'domc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `Which statement about quoting in dbt is correct?`,
  options: [
    `The ~quoting:~ config controls whether database, schema, and identifier names of relations are quoted; column names use the column property ~quote~.`,
    `On Snowflake, dbt quotes database, schema, and identifier names by default.`,
    `~quoting: {identifier: true}~ also quotes every column name in your models.`,
    `Setting ~quote: true~ on a column also quotes the name of its table.`
  ],
  answer: 0,
  exp: [
    `~quoting:~ (no ~dbt_project.yml~ ou numa source) envolve em aspas os nomes de database, schema e identifier das relações. No Snowflake o padrão é ~false~; na maioria dos outros adapters, ~true~.`,
    `Colunas têm controle próprio: ~quote: true~ na coluna, que afeta testes e documentação. Um não interfere no outro.`
  ],
  doc: 'https://docs.getdbt.com/reference/project-configs/quoting'
},
{
  id: 'cs-d1-quote-fill', d: 'd1', type: 'fill',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Complete the column property so dbt wraps the column name in quotes when it generates tests: ~columns: [{name: CustomerID, ______: true}]~`,
  accept: [
    `quote`
  ],
  exp: [
    `~quote~ é uma propriedade de coluna, falsa por padrão. Use-a quando a coluna precisa de aspas para ser lida, por exemplo para preservar maiúsculas e minúsculas no Snowflake. Sem ela, os testes da coluna podem gerar SQL inválido.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/columns'
},
{
  id: 'cs-d1-man-source', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `A CI script must list the physical tables (database, schema, and table name) behind every ~source()~ the project uses, without querying the warehouse. Which artifact should it read?`,
  options: [
    `~manifest.json~, whose source entries record each source's database, schema, identifier, and unique_id`,
    `~catalog.json~, which only exists after dbt queries the warehouse metadata`,
    `~run_results.json~, which records the status of each node in the last run`,
    `~sources.json~, which records the freshness results of each source`
  ],
  answer: 0,
  exp: [
    `O ~manifest.json~ é gerado na leitura do projeto e descreve cada nó. Para sources, guarda ~database~, ~schema~, ~identifier~ e o nome completo da relação, então dá para auditar dependências brutas sem acessar o warehouse.`,
    `~catalog.json~ vem de consultas de metadados feitas pelo ~dbt docs generate~, ~run_results.json~ guarda resultados de execução e ~sources.json~ guarda resultados de freshness.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/manifest-json'
},
{
  id: 'cs-d1-man-nodes', d: 'd1', type: 'fill',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Complete the blank. In ~manifest.json~, the models and sources a model depends on are listed in its ~depends_on~ object, under the key ______.`,
  accept: [
    `nodes`,
    `depends_on.nodes`
  ],
  exp: [
    `~depends_on~ tem duas listas: ~nodes~, com os unique_ids de modelos, sources, seeds e snapshots usados, e ~macros~, com as macros chamadas. É assim que ferramentas leem a linhagem sem rodar o dbt.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/manifest-json'
},
{
  id: 'cs-d1-raw-verify', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Which two practices let you catch problems in raw tables before the models built on them break? (Choose two.)`,
  options: [
    `Declare the tables as sources and add data tests, such as ~unique~ and ~not_null~, to their key columns.`,
    `Configure source freshness, with ~loaded_at_field~ and thresholds, and run ~dbt source freshness~.`,
    `Hard-code the raw table names in the models, with comments describing them.`,
    `Materialize the sources as tables in your schema.`,
    `Wrap each raw table in an ephemeral model instead of declaring a source.`
  ],
  answers: [0, 1],
  exp: [
    `Declarar as tabelas como sources permite testá-las e medir a freshness. Testes pegam dados inválidos (duplicatas, nulos) e a freshness pega cargas atrasadas, antes que os modelos usem esses dados.`,
    `Sources não são materializadas pelo dbt, e nomes fixos ou modelos ephemeral escondem as tabelas brutas da linhagem.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'cs-d1-snap-run', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `The nightly job runs only ~dbt run~. Models update correctly, but ~customers_snapshot~ never records new versions. Why?`,
  options: [
    `~dbt run~ only executes models; snapshots run with ~dbt snapshot~ or ~dbt build~.`,
    `Snapshots only run on the first day of each month.`,
    `~dbt run~ executes snapshots only when ~--full-refresh~ is passed.`,
    `The snapshot needs ~materialized: incremental~ to run with models.`
  ],
  answer: 0,
  exp: [
    `~dbt run~ constrói só modelos. Snapshots rodam com ~dbt snapshot~ ou dentro de ~dbt build~, que executa modelos, testes, seeds e snapshots na ordem do DAG.`,
    `Snapshots não têm materialização configurável nem agenda própria: rodam sempre que você executa o comando.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/snapshot'
},
{
  id: 'cs-d1-snap-multi', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which two commands execute the snapshot ~orders_snapshot~? (Choose two.)`,
  options: [
    `~dbt snapshot --select orders_snapshot~`,
    `~dbt build --select orders_snapshot~`,
    `~dbt run --select orders_snapshot~`,
    `~dbt seed --select orders_snapshot~`,
    `~dbt compile --select orders_snapshot~`
  ],
  answers: [0, 1],
  exp: [
    `~dbt snapshot~ roda snapshots, e ~dbt build~ roda todos os tipos de recurso selecionados, inclusive snapshots, seguidos dos testes deles.`,
    `~dbt run~ só executa modelos, ~dbt seed~ só carrega CSVs e ~dbt compile~ só gera SQL.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/snapshot'
},
{
  id: 'cs-d1-snap-fill', d: 'd1', type: 'fill',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the selector so ~dbt build~ runs every snapshot in the project, plus their tests, and nothing else: ~dbt build --select resource_type:______~`,
  accept: [
    `snapshot`
  ],
  exp: [
    `O método ~resource_type:~ filtra por tipo de recurso (~model~, ~seed~, ~snapshot~, ~test~...). Com ~dbt build~, os testes dos snapshots selecionados rodam junto. Para só os snapshots, sem testes, use ~dbt snapshot~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods'
},
{
  id: 'cs-d1-gr-bq-hotspot', d: 'd1', type: 'hotspot',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `This project runs on BigQuery. One of the grants below is invalid. Click the line that must change.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      hotspot: true,
      text: `
    models:
      - name: fct_revenue
        config:
          materialized: table
          grants:
            roles/bigquery.dataViewer: ['user:ana@company.com']
            select: ['user:bruno@company.com']`
    }
  ],
  answer: 6,
  exp: [
    `No BigQuery, os "privilégios" são papéis do IAM, no formato ~roles/service.roleName~. ~select~ é a palavra usada em Snowflake, Postgres e Redshift, não no BigQuery. A linha certa seria ~roles/bigquery.dataViewer: ['user:bruno@company.com']~ (ou os dois e-mails na mesma lista).`,
    `Os grantees estão certos: no BigQuery cada um precisa de um prefixo com o tipo de principal, como ~user:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d1-gr-bq-grantee', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `On BigQuery, ~grants: {roles/bigquery.dataViewer: ['analyst@company.com']}~ is rejected. What must change?`,
  options: [
    `Prefix the grantee with its principal type: ~user:analyst@company.com~.`,
    `Replace the role with ~select~.`,
    `Move the grant into an ~on-run-end~ hook, because BigQuery doesn't support the grants config.`,
    `Wrap the e-mail in double quotes instead of single quotes.`
  ],
  answer: 0,
  exp: [
    `No BigQuery, cada grantee precisa de um prefixo que diga o tipo de principal, como ~user:someone@company.com~. O papel (~roles/bigquery.dataViewer~) já está no formato certo.`,
    `O BigQuery suporta o config ~grants~; só muda o vocabulário. Aspas simples ou duplas não fazem diferença no YAML.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d1-gr-match', d: 'd1', type: 'match',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `A team runs the same project on Snowflake and on BigQuery. Match each part of the ~grants~ config to a valid example. One option is not used.`,
  left: [
    `Privilege key on Snowflake`,
    `Privilege key on BigQuery`,
    `Grantee on BigQuery`
  ],
  right: [
    `~select~`,
    `~roles/bigquery.dataViewer~`,
    `~user:ana@company.com~`,
    `~GRANT ALL ON SCHEMA~`
  ],
  answer: [0, 1, 2],
  exp: [
    `• No Snowflake (e em Postgres e Redshift), as chaves são privilégios SQL, como ~select~, e os grantees são roles ou usuários.`,
    `• No BigQuery, as chaves são papéis do IAM (~roles/bigquery.dataViewer~), e os grantees levam prefixo, como ~user:~.`,
    `O config ~grants~ vale para a relação criada pelo modelo; permissões de schema ficam fora dele, por exemplo num hook ~on-run-end~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d2-ver-default', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_orders~ declares ~versions: [{v: 1}, {v: 2}, {v: 3}]~ and has no ~latest_version~ property. Which version does an unpinned ~{{ ref('dim_orders') }}~ resolve to?`,
  options: [
    `Version 3, because without ~latest_version~ the numerically greatest version is the latest`,
    `Version 1, because the first declared version is the default`,
    `None; dbt raises an error until ~latest_version~ is set`,
    `Whichever version was built most recently`
  ],
  answer: 0,
  exp: [
    `Se ~latest_version~ não for definido, o dbt considera a maior versão numérica como a mais recente, e ~ref()~ sem ~v~ resolve para ela.`,
    `Para segurar os consumidores numa versão anterior enquanto a nova é testada, defina ~latest_version~ explicitamente.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d2-ver-prerelease', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_orders~ has ~latest_version: 2~ and also declares version 3, which is still being tested. What is true about version 3?`,
  options: [
    `It is a prerelease: unpinned refs keep resolving to v2, and you reach v3 with ~ref('dim_orders', v=3)~.`,
    `It becomes the latest automatically, because it is the highest number.`,
    `dbt refuses to build it until ~latest_version~ is changed to 3.`,
    `It is treated as deprecated, because it is above ~latest_version~.`
  ],
  answer: 0,
  exp: [
    `Versões acima de ~latest_version~ são **prerelease**: são construídas, mas só quem fixa a versão (~v=3~) as usa. Versões abaixo de ~latest_version~ são **old**. Os seletores ~version:prerelease~, ~version:latest~ e ~version:old~ usam essa classificação.`,
    `Quando a v3 estiver pronta, basta mudar ~latest_version~ para 3, e todos os refs sem versão passam a apontar para ela.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d2-ver-fill', d: 'd2', type: 'fill',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Version 3 of ~dim_orders~ is ready. Complete the model property you change so every unpinned ~ref('dim_orders')~ in the project resolves to v3, without editing any downstream model: ~______: 3~`,
  accept: [
    `latest_version`,
    `latest version`
  ],
  exp: [
    `~latest_version~ define para qual versão vão os ~ref()~ sem ~v~. Mudar esse número promove a nova versão para todo o projeto de uma vez, enquanto refs fixados (~v=2~) continuam onde estão.`,
    `Depois, marque a versão antiga com ~deprecation_date~ para dar um prazo de migração.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d3-bf-lifecycle', d: 'd3', type: 'order',
  topic: 'Managing dbt behavior with flags',
  stem: `Put the stages of a behavior change flag's life cycle in order.`,
  items: [
    `Introduced: dbt supports both behaviors, and the flag is disabled by default.`,
    `Mature: the flag's default flips, so the new behavior is enabled by default.`,
    `Removed: the old behavior is deleted from the dbt codebase.`
  ],
  exp: [
    `Uma behavior change flag nasce desligada (você pode ativá-la cedo), depois passa a vir ligada por padrão (você ainda pode desligá-la, com avisos de depreciação), e por fim o comportamento antigo é removido, com bastante aviso antes.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-where', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `The team wants to opt in early to the behavior change flag ~require_resource_names_without_spaces~, and the decision should go through code review. Where must the flag be set?`,
  options: [
    `In the ~flags:~ dictionary of ~dbt_project.yml~`,
    `As a CLI option on each command, such as ~--require-resource-names-without-spaces~`,
    `In an environment variable on each developer's machine`,
    `In each developer's ~profiles.yml~`
  ],
  answer: 0,
  exp: [
    `Behavior change flags **precisam** ficar no dicionário ~flags:~ do ~dbt_project.yml~. Assim a escolha vale para todo mundo que roda o projeto e fica versionada, passando por pull request.`,
    `Outras flags (como ~fail_fast~) também podem vir da linha de comando ou de variáveis de ambiente, mas as de mudança de comportamento não.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-optout', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `After an upgrade, a behavior change flag became enabled by default, and some of your models depend on the old behavior. You set the flag to ~false~ in ~dbt_project.yml~. What happens?`,
  options: [
    `dbt keeps the old behavior but keeps logging deprecation warnings until you migrate, and the old behavior will eventually be removed.`,
    `dbt keeps the old behavior permanently, with no warnings.`,
    `dbt ignores the setting, because mature flags can't be disabled.`,
    `dbt fails to parse until the models are fixed.`
  ],
  answer: 0,
  exp: [
    `Na fase madura, você ainda pode desligar a flag e manter o comportamento antigo, mas o dbt continua mostrando avisos de depreciação. É um prazo para migrar: na fase seguinte, o comportamento antigo deixa de existir.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-domc', d: 'd3', type: 'domc',
  topic: 'Managing dbt behavior with flags',
  stem: `Which statement describes a behavior change flag in dbt?`,
  options: [
    `It controls a deliberate change in which the same project code produces a different result, so teams can migrate on their own schedule.`,
    `It ships urgent bug fixes between minor releases.`,
    `It is a per-model config that changes how one model is materialized.`,
    `It changes the verbosity of dbt's logs.`
  ],
  answer: 0,
  exp: [
    `Behavior change flags existem para mudanças intencionais em que o mesmo código passa a dar outro resultado. Elas não são correções de bug nem novos avisos, e valem para o projeto inteiro, não para um modelo.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d4-cl-refresh', d: 'd4', type: 'fill',
  topic: 'Using dbt clone',
  stem: `Your CI schema already has clones from last week, so ~dbt clone --state prod-artifacts~ leaves them untouched. Complete the command so dbt recreates them from the current production state: ~dbt clone --state prod-artifacts ______~`,
  accept: [
    `--full-refresh`,
    `full-refresh`
  ],
  exp: [
    `Por padrão, o ~dbt clone~ não recria relações que já existem no target. Com ~--full-refresh~, ele recria todas a partir do estado atual de produção.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d4-cl-select', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `Before a CI build, you want to clone only the production incremental models into the CI schema, so they can run incrementally instead of being built from scratch. Which command does that?`,
  options: [
    `~dbt clone --select config.materialized:incremental --state prod-artifacts~`,
    `~dbt clone --state prod-artifacts --full-refresh~`,
    `~dbt build --select config.materialized:incremental --defer~`,
    `~dbt clone --select state:new --state prod-artifacts~`
  ],
  answer: 0,
  exp: [
    `O ~dbt clone~ aceita os seletores de sempre. Aqui, ~config.materialized:incremental~ restringe o clone aos incrementais, e ~--state~ indica de onde vêm as relações.`,
    `Sem ~--select~, o clone pega tudo do manifest. ~state:new~ selecionaria nós que nem existem em produção, então não haveria o que clonar.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d4-cl-domc', d: 'd4', type: 'domc',
  topic: 'Using dbt clone',
  stem: `Which statement correctly compares ~dbt clone~ with ~--defer~?`,
  options: [
    `~dbt clone~ creates real objects (clones or views) in your target schema that other tools can query; ~--defer~ only changes how refs resolve while a dbt command runs.`,
    `~--defer~ copies production tables into your schema; ~dbt clone~ only changes how refs resolve.`,
    `Both create copies of production data in your schema.`,
    `~dbt clone~ requires a full refresh of production first.`
  ],
  answer: 0,
  exp: [
    `O clone materializa algo no seu schema: um clone sem cópia de dados ou, onde isso não existe, uma view. Por isso uma ferramenta de BI pode ler esses objetos.`,
    `O ~--defer~ não cria nada: só faz os ~ref()~ de nós não selecionados apontarem para produção durante aquele comando.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d7-st-changed', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `In CI, you want to build only models that already exist in production and were changed, leaving out brand-new models. Which selection does that?`,
  options: [
    `~--select "state:modified,state:old" --state prod-artifacts~`,
    `~--select "state:modified state:old" --state prod-artifacts~`,
    `~--select state:unmodified --state prod-artifacts~`,
    `~--select state:new --state prod-artifacts~`
  ],
  answer: 0,
  exp: [
    `~state:modified~ inclui os nós novos. Cruzando com ~state:old~ (nós que já existem no manifest de comparação) pela **vírgula**, sobram só os modificados que já existiam.`,
    `Com **espaço**, os critérios viram união e entram também todos os nós antigos sem mudança. ~state:unmodified~ e ~state:new~ selecionam exatamente o que você quer deixar de fora.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cs-d7-st-match', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Match each selector to the nodes it picks, compared with the manifest passed in ~--state~. One option is not used.`,
  left: [
    `~state:new~`,
    `~state:modified~`,
    `~state:old~`,
    `~state:unmodified~`
  ],
  right: [
    `Nodes that don't exist in the comparison manifest`,
    `New nodes plus nodes whose code or configs changed`,
    `Nodes that already exist in the comparison manifest`,
    `Existing nodes with no changes`,
    `Nodes that failed in the previous run`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• ~state:new~: não existem no manifest de comparação.`,
    `• ~state:modified~: os novos **e** os alterados.`,
    `• ~state:old~: já existiam, com ou sem mudança.`,
    `• ~state:unmodified~: já existiam e não mudaram.`,
    `Falhas da execução anterior vêm do ~run_results.json~ e são selecionadas com ~result:~, não com ~state:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cs-d7-r-scope', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `In dbt Core 1.11, a ~dbt build~ failed on one model, and 5 nodes were skipped. You want ~dbt retry~ to rerun only part of that work. What can you do?`,
  options: [
    `Nothing with retry: in dbt Core it always reruns the failed node and the nodes skipped because of it. To run a different subset, use ~dbt build~ with your own ~--select~.`,
    `Pass ~--select~ to ~dbt retry~ with the nodes you want.`,
    `Pass ~--exclude~ to ~dbt retry~ with the nodes you want to skip.`,
    `Pass ~--state~ to ~dbt retry~ with a saved manifest.`
  ],
  answer: 0,
  exp: [
    `No dbt Core (v1), o retry repete a última execução a partir do ponto de falha, com a mesma seleção: não dá para estreitar o escopo com ~--select~ ou ~--exclude~. Para um subconjunto, use por exemplo ~dbt build --select "result:error+" --state pasta-com-os-artefatos~ com o ~--exclude~ que quiser.`,
    `A documentação diz que o **dbt v2** (o novo motor) passou a aceitar ~--select~, ~--exclude~ e ~--selector~ no retry. Alguns simulados usam essa regra nova, mas a sua prova é do dbt Core 1.11.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'cs-d7-r-order', d: 'd7', type: 'order',
  topic: 'Using dbt retry',
  stem: `The nightly ~dbt build~ failed: one test errored, and several models were skipped. You don't know yet which node failed or why. It turns out to be a ~not_null~ test on a source, caused by bad rows loaded by another team. Put your steps in order.`,
  items: [
    `Read the error in the logs (or ~run_results.json~) to see which node failed and why.`,
    `Ask the upstream team to fix the bad rows, and confirm the source is clean.`,
    `Run ~dbt retry~ to rerun the failed test and the skipped nodes.`,
    `Check that the failed and skipped nodes now finish with PASS or OK.`
  ],
  exp: [
    `Primeiro ler o erro: é ele que diz qual nó falhou e que a causa está nos dados de uma source, e não no seu código. Só então você sabe o que pedir ao time upstream. Com a source corrigida (não há nada para mudar nos modelos), retome com ~dbt retry~, que roda o teste que falhou e os nós pulados, e por fim confira os status.`,
    `Rodar o retry antes de corrigir a causa só repete o mesmo erro.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
