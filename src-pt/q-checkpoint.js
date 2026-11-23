/* Extra set across all domains (set: cp1). */
window.DBT_Q.push(
{
  id: 'cp-d1-cmd-exclude', d: 'd1', type: 'fill', set: 'cp1',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the command so it builds every model in ~models/marts~ except the ones tagged ~deprecated~: ~dbt build --select models/marts ______ tag:deprecated~`,
  accept: [
    `--exclude`,
    `exclude`
  ],
  exp: [
    `~--exclude~ remove nós do que foi escolhido com ~--select~. Funciona em ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~ls~ e nos outros comandos que selecionam nós.`,
    `Aqui, ~--select models/marts~ pega tudo o que está nessa pasta (o método ~path~ fica implícito), e ~--exclude tag:deprecated~ tira os modelos com essa tag.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/syntax'
},
{
  id: 'cp-d1-cmd-union', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `A teammate runs ~dbt build --select tag:finance tag:nightly~, expecting only the models that have **both** tags. Many more models run. Why, and what is the fix?`,
  options: [
    `Space-separated criteria form a union; use ~--select "tag:finance,tag:nightly"~ to get the intersection.`,
    `~tag:~ can only appear once per command, so dbt ignores the second tag; split it into two runs.`,
    `Tags are inherited by every descendant in the DAG; add ~--exclude~ for the children.`,
    `~dbt build~ ignores tag selection; use ~dbt run~ instead.`
  ],
  answer: 0,
  exp: [
    `No ~--select~, critérios separados por **espaço** formam uma **união**: entram os nós que têm qualquer uma das tags. Separados por **vírgula**, formam uma **interseção**: só entram os nós que atendem a todos. Por isso ~"tag:finance,tag:nightly"~ pega só os modelos com as duas tags.`,
    `Tags não passam para os filhos pelo DAG, e ~dbt build~ aceita qualquer seletor, inclusive ~tag:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/set-operators'
},
{
  id: 'cp-d1-cmd-cautious', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `~dim_customers~ has ~unique~ and ~not_null~ tests. ~fct_orders~ has a ~relationships~ test from ~fct_orders.customer_id~ to ~dim_customers~. You run ~dbt test --select dim_customers --indirect-selection cautious~. Which tests run?`,
  options: [
    `Only the ~unique~ and ~not_null~ tests on ~dim_customers~`,
    `All three tests, because the ~relationships~ test references ~dim_customers~`,
    `Only the ~relationships~ test`,
    `No tests, because ~cautious~ only runs tests named directly in ~--select~`
  ],
  answer: 0,
  exp: [
    `Com ~cautious~, o dbt só roda os testes que dependem **exclusivamente** de nós selecionados. O ~relationships~ também depende de ~fct_orders~, que não foi selecionado, então fica de fora.`,
    `No modo padrão, ~eager~, basta um dos pais estar selecionado, e os três testes rodariam. Os outros modos são ~buildable~ e ~empty~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/test-selection-examples'
},
{
  id: 'cp-d1-cmd-selectors', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `The nightly job and three engineers keep retyping the same long selection: ~--select "tag:nightly,config.materialized:incremental" --exclude "path:models/legacy"~. How do you define it once and reuse it by name?`,
  options: [
    `Define it in ~selectors.yml~ and run ~dbt build --selector nightly_incremental~.`,
    `Save it as a var in ~dbt_project.yml~ and run ~dbt build --select "{{ var('nightly') }}"~.`,
    `Write a macro that returns the selection and call it with ~dbt run-operation~.`,
    `Add it to the production target in ~profiles.yml~.`
  ],
  answer: 0,
  exp: [
    `Seletores YAML ficam no ~selectors.yml~, na raiz do projeto, e são usados com ~--selector <nome>~. Eles aceitam ~union~, ~intersection~ e ~exclude~, então seleções complexas ficam versionadas junto com o código.`,
    `Os argumentos da linha de comando não passam pelo Jinja, ~run-operation~ executa macros (não seleciona nós para um build) e o ~profiles.yml~ guarda conexões, não seleções.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/yaml-selectors'
},
{
  id: 'cp-d1-cmd-objects', d: 'd1', type: 'multi', set: 'cp1',
  choose: 2,
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which two commands create or update objects in the warehouse? (Choose two.)`,
  options: [
    `~dbt seed~`,
    `~dbt snapshot~`,
    `~dbt compile~`,
    `~dbt show~`,
    `~dbt ls~`
  ],
  answers: [0, 1],
  exp: [
    `~dbt seed~ carrega os CSVs em tabelas, e ~dbt snapshot~ cria ou atualiza as tabelas de snapshot.`,
    `~dbt compile~ só gera o SQL em ~target/compiled~. ~dbt show~ executa uma consulta e mostra uma prévia, sem criar nada. ~dbt ls~ apenas lista os recursos do projeto.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-commands'
},
{
  id: 'cp-d1-src-hotspot', d: 'd1', type: 'hotspot', set: 'cp1',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `In the lineage graph, ~int_customers_enriched~ shows only ~stg_shop__customers~ as a parent, but the model also reads a raw table. Click the line that creates a dependency dbt can't see.`,
  code: [
    {
      lang: 'sql',
      label: 'models/intermediate/int_customers_enriched.sql',
      hotspot: true,
      text: `
    with customers as (
        select * from {{ ref('stg_shop__customers') }}
    ),
    regions as (
        select region_id, region_name from raw.shop.regions
    ),
    final as (
        select
            customers.customer_id,
            customers.customer_name,
            regions.region_name
        from customers
        left join regions using (region_id)
    )
    select * from final`
    }
  ],
  answer: 4,
  exp: [
    `~raw.shop.regions~ está escrito direto no SQL, então o dbt não sabe que o modelo depende dessa tabela: ela não aparece na linhagem nem na documentação, não pode ter testes nem freshness, e seletores como ~source:shop+~ não alcançam o modelo.`,
    `A correção é declarar ~regions~ na source ~shop~, criar um staging (~stg_shop__regions~) com ~{{ source('shop', 'regions') }}~ e trocar a linha por ~{{ ref('stg_shop__regions') }}~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'cp-d1-src-quoting', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `On Snowflake, a raw table was created with a quoted, mixed-case name: ~"RAW"."SHOP"."OrderItems"~. Your source declares the table as ~- name: OrderItems~, but queries fail because Snowflake looks for ~ORDERITEMS~. What is the fix in the source YAML?`,
  options: [
    `Set ~quoting: {identifier: true}~ on the table, so dbt quotes the name and keeps its case.`,
    `Rename the table entry to ~orderitems~, in lowercase.`,
    `Add ~identifier: ORDERITEMS~ to the table.`,
    `Set ~materialized: quoted~ in the source config.`
  ],
  answer: 0,
  exp: [
    `No Snowflake, nomes sem aspas viram maiúsculas. Uma tabela criada com aspas e letras misturadas só é encontrada se o nome for citado exatamente assim. ~quoting: {identifier: true}~ faz o dbt gerar ~"OrderItems"~ entre aspas. A mesma propriedade existe para ~database~ e ~schema~.`,
    `Mudar o nome para minúsculas ou maiúsculas continua gerando um nome sem aspas, que o Snowflake converte para ~ORDERITEMS~. Sources não têm materialização.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/quoting'
},
{
  id: 'cp-d1-src-children', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Before the Stripe team changes ~raw.stripe.payments~, you want to list only the models that read that source **directly**, not the models further downstream. Which command should you run?`,
  options: [
    `~dbt ls --select source:stripe.payments+1~`,
    `~dbt ls --select source:stripe.payments+~`,
    `~dbt ls --select +source:stripe.payments~`,
    `~dbt ls --select 1+source:stripe.payments~`
  ],
  answer: 0,
  exp: [
    `O número depois do ~+~ limita a profundidade: ~+1~ pega só os filhos diretos. Sem número, ~source:stripe.payments+~ lista todos os descendentes.`,
    `Com o ~+~ antes do nome, o seletor pega os **pais**, e uma source não tem pais no DAG.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/graph-operators'
},
{
  id: 'cp-d1-mb-hour', d: 'd1', type: 'fill', set: 'cp1',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `Complete the config so each batch of this microbatch model covers one hour of events: ~{{ config(materialized='incremental', incremental_strategy='microbatch', event_time='event_at', begin='2024-01-01', batch_size='______') }}~`,
  accept: [
    `hour`
  ],
  exp: [
    `~batch_size~ aceita ~hour~, ~day~, ~month~ e ~year~. Cada batch processa uma janela desse tamanho, definida pelo ~event_time~.`,
    `Junto com ~event_time~ e ~begin~, ~batch_size~ é uma das configs obrigatórias de um modelo microbatch.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'cp-d1-mb-render', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `~fct_sessions~ is a microbatch model. It refs ~stg_events~, which has ~event_time~ configured, but it must read **all** of ~stg_events~ in every batch to compute lifetime metrics. How do you turn off the automatic batch filter for that one ref?`,
  options: [
    `Use ~{{ ref('stg_events').render() }}~.`,
    `Remove ~event_time~ from the config of ~fct_sessions~.`,
    `Set ~lookback: 0~.`,
    `Run the model with ~--full-refresh~ every time.`
  ],
  answer: 0,
  exp: [
    `Num modelo microbatch, o dbt filtra cada ~ref()~ e ~source()~ que tenha ~event_time~ para a janela do batch. ~.render()~ desliga esse filtro só naquele ~ref~.`,
    `O ~event_time~ do próprio modelo é obrigatório no microbatch. ~lookback~ define quantos batches anteriores são reprocessados, não o filtro dos inputs.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'cp-d1-mb-concurrent', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `The batches of a microbatch model run in parallel, but each batch reads rows written by the previous one, so they must run one at a time. Which config forces sequential batches for this model?`,
  options: [
    `~concurrent_batches=false~`,
    `~batch_size='sequential'~`,
    `~lookback=0~`,
    `~full_refresh=false~`
  ],
  answer: 0,
  exp: [
    `~concurrent_batches~ substitui a detecção automática do dbt: com ~false~, os batches rodam um depois do outro; com ~true~, rodam em paralelo.`,
    `~batch_size~ só aceita ~hour~, ~day~, ~month~ e ~year~, ~lookback~ controla quantos batches anteriores são reprocessados, e ~full_refresh=false~ só impede que ~--full-refresh~ reconstrua o modelo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/parallel-batch-execution'
},
{
  id: 'cp-d1-dry-dispatch', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Your package needs a date-difference expression whose SQL differs between Snowflake and BigQuery. Following dbt's pattern for cross-database macros, what should you build?`,
  options: [
    `A macro that calls ~adapter.dispatch('date_diff_days', 'my_package')~, with ~default__date_diff_days~ and ~bigquery__date_diff_days~ implementations`,
    `Two separate macros, plus an ~if~ on ~target.name~ in every model that uses them`,
    `A Python model that detects the warehouse at run time`,
    `A separate copy of the package for each warehouse`
  ],
  answer: 0,
  exp: [
    `~adapter.dispatch~ escolhe a implementação pelo adapter em uso: procura ~<adapter>__nome~ (como ~bigquery__date_diff_days~) e usa ~default__nome~ quando não há uma específica. Os modelos chamam uma macro só, e a diferença fica num lugar.`,
    `Um ~if~ em cada modelo repete lógica, o contrário de DRY. Além disso, ~target.name~ é o nome do target; o tipo do warehouse fica em ~target.type~.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/dispatch'
},
{
  id: 'cp-d1-dry-intermediate', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Three marts each start with the same 40-line CTE that joins ~stg_orders~ to ~stg_payments~ and computes order totals. What is the most modular way to remove the duplication?`,
  options: [
    `Move the logic into an intermediate model, such as ~int_order_totals~, and ~ref()~ it from the three marts.`,
    `Wrap the 40 lines in a macro and call it inside each mart's CTE.`,
    `Move the join into ~stg_orders~, so every mart already gets it.`,
    `Keep the duplication, because marts should never depend on other models.`
  ],
  answer: 0,
  exp: [
    `Quando a lógica repetida produz um **conjunto de dados**, o lugar dela é um modelo: ele é calculado uma vez, aparece no DAG, pode ser testado e documentado, e os marts só fazem ~ref()~.`,
    `Macros servem para trechos de SQL reutilizáveis com parâmetros, como conversões. Com uma macro, o join rodaria três vezes e ficaria invisível no DAG. E staging deve ser 1 para 1 com a source, sem joins.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/3-intermediate'
},
{
  id: 'cp-d1-mat-table', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Understanding core dbt materializations',
  stem: `~fct_daily_sales~ is a view with heavy joins over 500 million rows. A dashboard queries it dozens of times per hour, and every query is slow. The data only changes once a day, after the nightly ~dbt build~. What is the best materialization change?`,
  options: [
    `Materialize it as a ~table~, so the joins run once per build instead of on every dashboard query.`,
    `Make it ~ephemeral~, so the dashboard reads it as a CTE.`,
    `Keep the view and give the nightly job more threads.`,
    `Materialize it as ~incremental~ with ~append~, so the dashboard always gets the newest rows.`
  ],
  answer: 0,
  exp: [
    `Uma view recalcula a consulta toda vez que alguém a lê. Como os dados só mudam uma vez por dia, uma ~table~ faz o trabalho pesado uma vez no build e deixa as leituras rápidas.`,
    `Modelos ephemeral não existem no warehouse, então o dashboard nem conseguiria lê-los. Threads aceleram o build, não as consultas do dashboard. E ~append~ sem chave pode duplicar linhas; um incremental só compensaria se a tabela ficasse cara demais para reconstruir.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'cp-d1-mat-ephemeral', d: 'd1', type: 'fill', set: 'cp1',
  topic: 'Understanding core dbt materializations',
  stem: `Complete the blank. A model with ~materialized='______'~ is never created in the warehouse: dbt inserts its SQL as a CTE into every model that refs it.`,
  accept: [
    `ephemeral`
  ],
  exp: [
    `Modelos ~ephemeral~ não viram tabela nem view: o dbt injeta o SQL deles como CTE em cada modelo que faz ~ref()~. Servem para lógica leve, usada por poucos modelos.`,
    `Como não existem no warehouse, não dá para consultá-los diretamente, e usá-los em muitos modelos repete o mesmo cálculo em cada um.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'cp-d1-snap-hotspot', d: 'd1', type: 'hotspot', set: 'cp1',
  topic: 'Creating snapshots in YAML',
  stem: `The ~orders~ table is fully reloaded every night, which refreshes ~_loaded_at~ on every row. Its ~updated_at~ column only changes when an order really changes. The snapshot below records a new version of **every** order on every run. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'snapshots/orders_snapshot.yml',
      hotspot: true,
      text: `
    snapshots:
      - name: orders_snapshot
        relation: source('shop', 'orders')
        config:
          schema: snapshots
          unique_key: order_id
          strategy: timestamp
          updated_at: _loaded_at`
    }
  ],
  answer: 7,
  exp: [
    `Na estratégia ~timestamp~, o dbt cria uma nova versão sempre que o valor de ~updated_at~ muda. Como ~_loaded_at~ muda em toda carga, todas as linhas parecem alteradas todo dia. O certo é ~updated_at: updated_at~, a coluna que só muda quando o registro muda.`,
    `~schema~, ~unique_key~ e ~strategy~ estão corretos. Se não houvesse nenhuma coluna confiável, a alternativa seria ~strategy: check~ com ~check_cols~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'cp-d1-snap-deletes', d: 'd1', type: 'match', set: 'cp1',
  topic: 'Creating snapshots in YAML',
  stem: `Match each ~hard_deletes~ value to what happens in the snapshot table when a row is deleted from the source. One option is not used.`,
  left: [
    `~ignore~`,
    `~invalidate~`,
    `~new_record~`
  ],
  right: [
    `Nothing changes; the deleted row's current version stays open`,
    `The current version is closed by filling its ~dbt_valid_to~`,
    `A new row is inserted with ~dbt_is_deleted~ set to True`,
    `The row is deleted from the snapshot table as well`
  ],
  answer: [0, 1, 2],
  exp: [
    `• ~ignore~ (padrão): o dbt não faz nada com registros apagados.`,
    `• ~invalidate~: fecha a versão atual preenchendo ~dbt_valid_to~, como o antigo ~invalidate_hard_deletes=true~.`,
    `• ~new_record~: insere uma nova linha com ~dbt_is_deleted~ = True, mantendo o histórico completo.`,
    `Snapshots não apagam linhas da própria tabela.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'cp-d1-empty-hardcoded', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Validating model logic and schema definitions in dry-runs using the --empty flag',
  stem: `You run ~dbt build --empty~ to validate a large refactor cheaply. One model still runs for 20 minutes and scans a 2 TB table. Its SQL reads ~raw.events.page_views~ directly, without ~source()~. Why wasn't it limited?`,
  options: [
    `~--empty~ only limits ~ref()~ and ~source()~ calls; tables named directly in the SQL are queried normally.`,
    `~--empty~ skips the limit for tables larger than 1 TB.`,
    `~--empty~ only applies to ~dbt run~, not to ~dbt build~.`,
    `The warehouse ignores ~limit 0~ on large tables.`
  ],
  answer: 0,
  exp: [
    `Com ~--empty~, o dbt reescreve cada ~ref()~ e ~source()~ para devolver zero linhas, o que valida SQL, dependências e schema sem processar dados. Uma tabela escrita direto no SQL não passa por essa reescrita e é lida inteira.`,
    `É mais um motivo para declarar toda tabela bruta como source. ~--empty~ funciona tanto em ~dbt run~ quanto em ~dbt build~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/empty-flag'
},
{
  id: 'cp-d1-inc-nokey', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `An incremental model uses ~incremental_strategy='merge'~ but has no ~unique_key~. Each run reprocesses the last 3 days of orders, and analysts now see duplicate ~order_id~ values. Why?`,
  options: [
    `Without a ~unique_key~, ~merge~ behaves like ~append~ and inserts the reprocessed rows again.`,
    `~merge~ always appends; only ~delete+insert~ updates existing rows.`,
    `The incremental filter must reference ~{{ this }}~, or dbt duplicates the rows.`,
    `~merge~ needs ~on_schema_change: sync_all_columns~ to deduplicate.`
  ],
  answer: 0,
  exp: [
    `O ~merge~ usa a ~unique_key~ para decidir o que atualizar. Sem ela, ele se comporta como ~append~: insere tudo de novo e não checa duplicatas. Reprocessar uma janela de dias sem chave gera linhas repetidas.`,
    `A correção é definir ~unique_key='order_id'~. ~on_schema_change~ trata colunas novas, não duplicatas.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy'
},
{
  id: 'cp-d1-inc-this', d: 'd1', type: 'fill', set: 'cp1',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `Complete the incremental filter so each run only processes events newer than the ones already in the target table: ~where event_at > (select max(event_at) from {{ ______ }})~`,
  accept: [
    `this`
  ],
  exp: [
    `~{{ this }}~ representa a própria relação do modelo no warehouse. Dentro de ~{% if is_incremental() %}~, ele permite comparar os dados novos com o que já foi carregado.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/this'
},
{
  id: 'cp-d1-pkg-domc', d: 'd1', type: 'domc', set: 'cp1',
  topic: 'Using dbt Packages',
  stem: `Which statement about dbt packages is correct?`,
  options: [
    `~dbt deps~ installs the packages listed in ~packages.yml~ into the ~dbt_packages/~ folder, which is usually kept out of Git.`,
    `~dbt run~ installs any missing packages automatically before building.`,
    `Models that come from an installed package are never built by your project.`,
    `~packages.yml~ must live inside the ~models/~ folder.`
  ],
  answer: 0,
  exp: [
    `Pacotes são instalados com ~dbt deps~ na pasta ~dbt_packages/~ (o caminho padrão de ~packages-install-path~). Como a pasta é gerada, ela costuma ficar no ~.gitignore~, e cada ambiente roda ~dbt deps~ antes de usar o projeto.`,
    `~dbt run~ não instala pacotes. Os modelos de pacotes **são** construídos junto com o projeto, a menos que você os desative. E o ~packages.yml~ fica na raiz, ao lado do ~dbt_project.yml~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cp-d1-py-session', d: 'd1', type: 'fill', set: 'cp1',
  topic: 'Creating Python Models',
  stem: `Complete the function signature that every dbt Python model defines: ~def model(dbt, ______):~`,
  accept: [
    `session`
  ],
  exp: [
    `Todo modelo Python define ~def model(dbt, session)~ e retorna um DataFrame. ~dbt~ dá acesso a ~dbt.ref()~, ~dbt.source()~, ~dbt.config()~ e ~dbt.this~; ~session~ é a conexão com a plataforma (por exemplo, a sessão Snowpark ou Spark).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'cp-d1-grants-manual', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `A DBA manually ran ~grant select on analytics.fct_orders to role analyst~. After every nightly ~dbt build~, analysts lose access again. What is the dbt way to fix this?`,
  options: [
    `Add ~grants: {select: ['analyst']}~ to the model's config, so dbt applies the grant every time it builds the table.`,
    `Ask the DBA to rerun the grant after each build.`,
    `Change the model to ~ephemeral~, so the table keeps its grants.`,
    `Add ~access: public~ to the model.`
  ],
  answer: 0,
  exp: [
    `Quando o dbt reconstrói o modelo, a tabela é substituída e os grants feitos à mão se perdem. Com o config ~grants~, o dbt reaplica os privilégios declarados depois de cada build, e o acesso fica versionado no projeto.`,
    `~access: public~ controla quem pode fazer ~ref()~ dentro do dbt, não permissões no banco. Modelos ephemeral nem existem no warehouse.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cp-d1-sample-vs-empty', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `You changed a join in ~fct_sessions~ and want to inspect real output rows in development without processing years of history. Its upstream models have ~event_time~ configured. Which command fits?`,
  options: [
    `~dbt build --select fct_sessions --sample="3 days"~, which builds it from only the last 3 days of input data`,
    `~dbt build --select fct_sessions --empty~, which builds it with real rows but skips its tests`,
    `~dbt show --select fct_sessions --limit 0~`,
    `~dbt build --select fct_sessions --full-refresh~`
  ],
  answer: 0,
  exp: [
    `~--sample~ filtra os inputs que têm ~event_time~ para uma janela de tempo, relativa (como ~"3 days"~ ou ~"6 hours"~) ou com início e fim. O modelo é construído com dados reais, só que menos, e dá para conferir o resultado. Ele existe para ~dbt run~ e ~dbt build~.`,
    `~--empty~ gera zero linhas e serve para validar SQL e schema, não para ver dados. ~--full-refresh~ reprocessa tudo, o oposto do que você quer.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'cp-d1-dag-intermediate', d: 'd1', type: 'mc', set: 'cp1',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `Following dbt's project structure guide, where should a model that pivots Stripe payments to one row per order live, and what should it be called?`,
  options: [
    `~models/intermediate/finance/int_payments_pivoted_to_orders.sql~`,
    `~models/staging/stripe/stg_stripe__payments_pivoted.sql~`,
    `~models/marts/finance/payments_pivot.sql~`,
    `~models/int/pivot__payments__orders.sql~`
  ],
  answer: 0,
  exp: [
    `Transformações que mudam o grão ou preparam dados para os marts ficam na camada **intermediate**, em pastas por área de negócio. O guia sugere nomes no formato ~int_[entidade]s_[verbo]s~, como ~int_payments_pivoted_to_orders~.`,
    `Staging só limpa e renomeia, 1 para 1 com a source. Marts são as entidades finais (~fct_~, ~dim_~), expostas aos consumidores.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/3-intermediate'
},
{
  id: 'cp-d1-proj-hotspot', d: 'd1', type: 'hotspot', set: 'cp1',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `None of the folder configs below are applied, and dbt warns that some configuration paths in ~dbt_project.yml~ don't apply to any resources. The models live in ~models/staging/~ and ~models/marts/~. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      hotspot: true,
      text: `
    name: jaffle_shop
    version: '1.0.0'
    profile: jaffle_shop

    model-paths: ["models"]

    models:
      jafle_shop:
        staging:
          +materialized: view
        marts:
          +materialized: table`
    }
  ],
  answer: 7,
  exp: [
    `Logo abaixo de ~models:~, o primeiro nível tem que ser o **nome do projeto** (o ~name~ do topo do arquivo) ou de um pacote instalado. ~jafle_shop~ está com erro de digitação, então nenhuma pasta embaixo dele corresponde a modelos, e o dbt avisa que esses caminhos não se aplicam a nada.`,
    `O resto está certo: ~staging~ e ~marts~ são pastas dentro de ~models/~, e o ~+~ indica que ~materialized~ é um config, não uma subpasta.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt_project.yml'
},
{
  id: 'cp-d2-acc-default', d: 'd2', type: 'fill', set: 'cp1',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Complete the blank. A model with no ~access~ config can be referenced by any model in the same project, and by a project that installs it as a package. This default access level is ______.`,
  accept: [
    `protected`
  ],
  exp: [
    `Por padrão, todo modelo é ~protected~: qualquer modelo do mesmo projeto pode fazer ~ref()~, e o projeto que instala esse código como pacote também.`,
    `~private~ restringe ao mesmo ~group~, e ~public~ libera para qualquer grupo, pacote ou projeto.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'cp-d2-grp-hotspot', d: 'd2', type: 'hotspot', set: 'cp1',
  topic: 'Model access, groups, contracts, and versions',
  stem: `The finance and marketing teams both want to own ~fct_campaign_revenue~. ~dbt parse~ fails on this file. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_groups.yml',
      hotspot: true,
      text: `
    groups:
      - name: finance
        owner:
          email: finance@example.com
      - name: marketing
        owner:
          email: marketing@example.com

    models:
      - name: fct_campaign_revenue
        config:
          group: [finance, marketing]
          access: protected`
    }
  ],
  answer: 11,
  exp: [
    `Cada modelo pertence a **um único** ~group~, então ~group~ recebe um nome, não uma lista. Escolha um dono (por exemplo, ~group: finance~); se o outro time precisa usar o modelo, o ~access~ ~protected~ ou ~public~ já permite o ~ref()~.`,
    `As definições dos grupos estão certas: cada uma tem ~name~ e um ~owner~ com ~email~, que são obrigatórios.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/groups'
},
{
  id: 'cp-d2-grp-domc', d: 'd2', type: 'domc', set: 'cp1',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Which statement about dbt groups is correct?`,
  options: [
    `Every group needs an ~owner~ with at least a ~name~ or an ~email~.`,
    `A group grants database privileges to its owner.`,
    `A model can belong to several groups at the same time.`,
    `You must define a group before you can use ~access: protected~.`
  ],
  answer: 0,
  exp: [
    `Ao definir um grupo, ~name~ e ~owner~ são obrigatórios, e o ~owner~ precisa ter ~name~ ou ~email~. Grupos registram quem é responsável pelos modelos e servem de fronteira para o acesso ~private~.`,
    `Grupos não mexem em permissões do banco (isso é ~grants~), cada modelo pertence a um grupo só, e ~protected~ é o padrão, que não depende de grupo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/groups'
},
{
  id: 'cp-d2-acc-folder', d: 'd2', type: 'mc', set: 'cp1',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Every model in ~models/finance/~ should belong to the ~finance~ group and be ~private~, except ~fct_finance_summary~, which other teams must be able to ~ref()~. What is the most maintainable setup?`,
  options: [
    `In ~dbt_project.yml~, set ~+group: finance~ and ~+access: private~ for the ~finance~ folder, and set ~access: public~ in the YAML config of ~fct_finance_summary~.`,
    `Set ~access: private~ in the YAML of every model, and take ~fct_finance_summary~ out of the group.`,
    `Set ~+access: public~ for the folder, and ~access: private~ on each of the other models.`,
    `Move ~fct_finance_summary~ to another project, because one group can't mix access levels.`
  ],
  answer: 0,
  exp: [
    `Configs de pasta no ~dbt_project.yml~ viram o padrão para todos os modelos dela, e a config mais específica, no YAML do modelo, vence. Assim a regra geral fica num lugar só, e a exceção fica no próprio modelo.`,
    `Um grupo pode ter modelos com níveis de acesso diferentes. As outras opções exigem repetir a config em cada modelo ou mudam o dono e o lugar do modelo sem necessidade.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/access'
},
{
  id: 'cp-d2-con-incremental', d: 'd2', type: 'mc', set: 'cp1',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `You want to enforce a contract on ~fct_events~, an incremental model. According to the requirements for model contracts, which ~on_schema_change~ values can it use?`,
  options: [
    `~append_new_columns~ or ~fail~`,
    `Only ~ignore~`,
    `~sync_all_columns~ or ~ignore~`,
    `Any value, as long as ~unique_key~ is set`
  ],
  answer: 0,
  exp: [
    `Um modelo incremental com contrato precisa de ~on_schema_change: append_new_columns~ ou ~fail~. Nos dois casos, colunas existentes não são removidas em silêncio, o que quebraria a forma prometida pelo contrato.`,
    `~sync_all_columns~ pode remover colunas da tabela, e ~ignore~ deixa a tabela sem as colunas novas, então nenhum dos dois é aceito.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'cp-d2-con-breaking', d: 'd2', type: 'domc', set: 'cp1',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `~dim_customers~ is a public model with an enforced contract. Which change is a breaking change to its contract?`,
  options: [
    `Changing the ~data_type~ of the existing ~customer_id~ column from ~int~ to ~varchar~`,
    `Adding a new column, ~loyalty_tier~, to the model and its YAML`,
    `Updating the ~description~ of ~customer_id~`,
    `Adding a ~not_null~ data test on ~email~`
  ],
  answer: 0,
  exp: [
    `Para o dbt, quebram o contrato: remover uma coluna existente, mudar o ~data_type~ de uma coluna existente, remover ou alterar uma constraint e, desde o 1.9, apagar, renomear ou desativar o modelo contratado.`,
    `Adicionar colunas não quebra quem já consome o modelo, e descrições e data tests não fazem parte da forma garantida pelo contrato.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'cp-d2-ver-names', d: 'd2', type: 'mc', set: 'cp1',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_customers~ declares ~versions: [{v: 1}, {v: 2}]~ and ~latest_version: 2~, with no ~alias~ config. After ~dbt run~, which relations exist in the warehouse?`,
  options: [
    `~dim_customers_v1~ and ~dim_customers_v2~`,
    `~dim_customers~ (version 2) and ~dim_customers_v1~`,
    `Only ~dim_customers~, which always holds the latest version`,
    `~dim_customers__1~ and ~dim_customers__2~`
  ],
  answer: 0,
  exp: [
    `Por padrão, cada versão vira uma relação com o sufixo ~_v<versão>~. Um ~ref('dim_customers')~ sem versão resolve para a ~latest_version~, mas no banco os nomes continuam com sufixo.`,
    `Se os consumidores precisam de um nome sem sufixo, é preciso criá-lo à parte, por exemplo com ~alias~ na versão mais recente ou com uma view que aponte para ela.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cp-d3-yaml-dash', d: 'd3', type: 'hotspot', set: 'cp1',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt parse~ fails with a YAML error in this properties file. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_shop.yml',
      hotspot: true,
      text: `
    models:
      - name: stg_shop__orders
        columns:
          - name: order_id
            data_tests:
              - unique
              - not_null
          name: customer_id
            description: Foreign key to stg_shop__customers
          - name: status
            description: Current order status`
    }
  ],
  answer: 7,
  exp: [
    `Cada coluna é um item da lista ~columns~ e precisa começar com ~-~. Em ~name: customer_id~ falta o traço, então o YAML encontra uma chave solta no meio da lista e não consegue ler o arquivo. O certo é ~- name: customer_id~.`,
    `Erros de YAML aparecem no ~dbt parse~ (e em qualquer outro comando) antes de qualquer acesso ao warehouse, com o arquivo e a linha aproximada.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'cp-d3-yaml-at', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `Parsing fails with ~found character '@' that cannot start any token~, pointing at this line of a properties file: ~description: @deprecated use fct_orders_v2 instead~. What is the fix?`,
  options: [
    `Quote the value: ~description: "@deprecated use fct_orders_v2 instead"~`,
    `Escape the character as ~\\@deprecated~.`,
    `Move the description into a ~meta~ block.`,
    `Add ~version: 2~ at the top of the file.`
  ],
  answer: 0,
  exp: [
    `No YAML, alguns caracteres não podem começar um valor sem aspas: ~@~ e a crase são reservados, ~*~ e ~&~ marcam alias e âncora, e ~{~ e ~[~ abrem estruturas. Colocar o texto entre aspas resolve.`,
    `Fora de aspas duplas, a barra invertida não escapa nada. ~version: 2~ é opcional desde o dbt 1.5 e não tem relação com o erro.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'cp-d3-yaml-patch', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `The tests and descriptions in ~models/staging/_stg_shop.yml~ are never applied, and every run logs: ~Did not find matching node for patch with name 'stg_shop_orders' in the 'models' section of file 'models/staging/_stg_shop.yml'~. The model file is ~models/staging/stg_shop__orders.sql~. What is wrong?`,
  options: [
    `The ~name~ in the YAML doesn't match the model's file name: it is missing one underscore.`,
    `A properties file must have the same name as the model it describes.`,
    `Properties files must sit in the same folder as ~dbt_project.yml~.`,
    `The model needs ~{{ config(patch=true) }}~ to accept YAML properties.`
  ],
  answer: 0,
  exp: [
    `O ~name~ no YAML precisa ser igual ao nome do modelo, que vem do nome do arquivo ~.sql~. ~stg_shop_orders~ não corresponde a ~stg_shop__orders~, então o dbt não encontra o nó e ignora os testes, as descrições e as configs dessa entrada.`,
    `Arquivos de propriedades podem ter qualquer nome e ficar em qualquer pasta de ~model-paths~.`
  ],
  doc: 'https://docs.getdbt.com/reference/model-properties'
},
{
  id: 'cp-d3-fix-ci-child', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You changed the grain logic in ~int_orders~. The Slim CI job (~dbt build --select state:modified+ --defer --state prod-artifacts~) now fails on a ~unique~ test in ~fct_revenue~, a model you didn't touch. What should you do?`,
  options: [
    `Treat it as a real regression: ~fct_revenue~ is downstream of your change, so fix the logic before merging.`,
    `Exclude ~fct_revenue~ from the CI selection, since it wasn't modified.`,
    `Merge anyway, because the CI test reads production data.`,
    `Rerun CI with ~--full-refresh~ until the test passes.`
  ],
  answer: 0,
  exp: [
    `O ~+~ em ~state:modified+~ existe justamente para testar os filhos do que mudou. Se a mudança de grão gerou duplicatas em ~fct_revenue~, o CI pegou um problema real antes do merge.`,
    `Tirar o modelo do CI ou fazer o merge só esconde o erro, que apareceria em produção. ~--full-refresh~ não muda a lógica.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/best-practice-workflows'
},
{
  id: 'cp-d3-fix-test-first', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `A bug in ~fct_orders~ counts refunded orders as revenue. Before you change the SQL, which step best ensures the same bug can't come back unnoticed?`,
  options: [
    `Add a unit test with input rows that reproduce the refund case, confirm it fails, then fix the model until it passes.`,
    `Fix the SQL, then check a few rows with ~dbt show~.`,
    `Add a comment above the logic explaining the fix.`,
    `Rebuild the model with ~--full-refresh~ after the fix.`
  ],
  answer: 0,
  exp: [
    `Um unit test com o caso que quebrou documenta o comportamento esperado e passa a rodar em todo ~dbt build~ e no CI. Ver o teste falhar antes da correção confirma que ele realmente cobre o bug.`,
    `Conferir com ~dbt show~ ajuda na hora, mas não protege as mudanças futuras. Comentários e ~--full-refresh~ não testam nada.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'cp-d3-log-profile', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Understanding logged error messages',
  stem: `A new teammate clones the repository, and every dbt command fails right away with: ~Runtime Error: Could not find profile named 'jaffle_shop'~. What is the most likely cause?`,
  options: [
    `Their ~profiles.yml~ has no profile called ~jaffle_shop~, the name set in ~profile:~ inside ~dbt_project.yml~.`,
    `The ~jaffle_shop~ model has a SQL syntax error.`,
    `The warehouse password has expired.`,
    `~dbt deps~ hasn't been run yet.`
  ],
  answer: 0,
  exp: [
    `O ~profile:~ do ~dbt_project.yml~ diz qual perfil do ~profiles.yml~ usar. Se esse perfil não existe (arquivo ausente, nome diferente ou arquivo fora da pasta ~.dbt~ do usuário sem ~--profiles-dir~), o dbt para antes de conectar. ~dbt debug~ mostra onde ele está procurando.`,
    `Senha expirada gera erro de conexão (~Database Error~), e pacotes faltando geram outra mensagem, que pede ~dbt deps~.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'cp-d3-log-cycle', d: 'd3', type: 'mc', set: 'cp1',
  topic: 'Understanding logged error messages',
  stem: `After a refactor, every command fails with: ~Found a cycle: model.shop.int_orders --> model.shop.int_payments --> model.shop.int_orders~. What does it mean, and how do you fix it?`,
  options: [
    `The two models depend on each other. Move the logic they share into a new upstream model that both can ref.`,
    `Two models have the same name; rename one of them.`,
    `~int_payments~ is ephemeral; change it to a table.`,
    `The DAG is too deep; increase ~--threads~.`
  ],
  answer: 0,
  exp: [
    `O DAG do dbt precisa ser acíclico: nenhum modelo pode depender, direta ou indiretamente, de si mesmo. A mensagem mostra o caminho do ciclo. A saída é levar a lógica comum para um modelo anterior aos dois, ou inverter uma das dependências.`,
    `Nomes duplicados e materializações geram outros erros, e ~--threads~ não muda a estrutura do DAG.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'cp-d3-flag-partial', d: 'd3', type: 'fill', set: 'cp1',
  topic: 'Managing dbt behavior with flags',
  stem: `Complete the flag that makes dbt ignore its saved parse results and read the whole project again from scratch: ~dbt run ______~`,
  accept: [
    `--no-partial-parse`,
    `no-partial-parse`
  ],
  exp: [
    `Por padrão, o dbt usa partial parsing: guarda o resultado da leitura em ~target/partial_parse.msgpack~ e só relê os arquivos alterados. Quando esse cache parece desatualizado ou causa erros estranhos, ~--no-partial-parse~ força uma leitura completa.`
  ],
  doc: 'https://docs.getdbt.com/reference/parsing'
},
{
  id: 'cp-d3-cc-hotspot', d: 'd3', type: 'hotspot', set: 'cp1',
  topic: 'Troubleshooting using compiled code',
  stem: `~fct_orders~ returns zero rows in development, even though ~stg_orders~ has data. Below is the model's SQL from ~target/compiled~. Click the line that explains the empty result.`,
  code: [
    {
      lang: 'sql',
      label: 'target/compiled/jaffle_shop/models/marts/fct_orders.sql',
      hotspot: true,
      text: `
    with orders as (
        select * from "analytics"."dbt_jdoe"."stg_orders"
    ),
    payments as (
        select * from "analytics"."dbt_jdoe"."stg_payments"
    ),
    final as (
        select
            orders.order_id,
            orders.order_date,
            sum(payments.amount) as amount
        from orders
        left join payments using (order_id)
        where orders.order_date >= '2099-01-01'
        group by 1, 2
    )
    select * from final`
    }
  ],
  answer: 13,
  exp: [
    `O código compilado mostra o valor que o Jinja realmente gerou: o filtro virou ~>= '2099-01-01'~, uma data no futuro. Isso acontece quando a variável usada no filtro não está definida no ambiente e o modelo cai no valor padrão de ~var()~.`,
    `A correção é definir ~start_date~ em ~vars:~ no ~dbt_project.yml~ (ou passar ~--vars~) e rever esse padrão. Ler ~target/compiled~ é o jeito mais rápido de achar esse tipo de erro, porque o arquivo do modelo só mostra o Jinja.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/compile'
},
{
  id: 'cp-d4-cl-views', d: 'd4', type: 'mc', set: 'cp1',
  topic: 'Using dbt clone',
  stem: `Your team's warehouse doesn't support zero-copy cloning. You run ~dbt clone --state prod-artifacts~ against your development target. What does dbt create for each production model?`,
  options: [
    `A view that selects from the production relation`,
    `A full physical copy of each production table`,
    `Nothing, because ~dbt clone~ only works on Snowflake`,
    `An empty table with the same columns`
  ],
  answer: 0,
  exp: [
    `Onde existe clone sem cópia de dados (Snowflake, Databricks e BigQuery), o dbt clona as tabelas. Nas outras plataformas, ele cria uma view simples, um ~select~ de tudo do objeto de produção, que é rápida e não duplica dados.`,
    `Em qualquer caso, o clone não reprocessa a lógica dos modelos.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cp-d4-cl-needs', d: 'd4', type: 'multi', set: 'cp1',
  choose: 2,
  topic: 'Using dbt clone',
  stem: `You want to use ~dbt clone~ to populate a new CI schema from production. Which two things does it need? (Choose two.)`,
  options: [
    `The production ~manifest.json~, passed with ~--state~`,
    `Read access, from your target's credentials, to the production relations`,
    `A full refresh of production right before the clone`,
    `The production ~profiles.yml~ committed to the repository`,
    `The ~catalog.json~ produced by ~dbt docs generate~`
  ],
  answers: [0, 1],
  exp: [
    `O ~dbt clone~ lê o ~manifest.json~ do ambiente de origem, via ~--state~, para saber quais relações existem e onde estão. Depois cria clones ou views no seu target, então as credenciais desse target precisam conseguir ler os objetos de produção.`,
    `Ele não reconstrói produção, usa o seu próprio target (não o ~profiles.yml~ de produção) e não depende do ~catalog.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cp-d4-tr-privileges', d: 'd4', type: 'mc', set: 'cp1',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `A new production job fails on its first model with ~Database Error: Insufficient privileges to operate on schema 'MARTS'~. The same models build fine in development. What is the most likely cause?`,
  options: [
    `The role used by the production target lacks privileges to create objects in that schema.`,
    `The production manifest is missing, so dbt can't resolve the refs.`,
    `The models need ~--full-refresh~ in production.`,
    `A data test failed upstream.`
  ],
  answer: 0,
  exp: [
    `~Database Error~ quer dizer que o warehouse recusou o comando. Se o mesmo código roda em dev, o problema está no ambiente: o role ou usuário do target de produção precisa de privilégios para criar e substituir objetos no schema de destino, ou para criar o schema.`,
    `Os refs são resolvidos pelo próprio projeto, sem manifest de produção, e um teste falhando gera SKIP nos filhos, não erro de privilégio.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'cp-d4-tr-seed', d: 'd4', type: 'mc', set: 'cp1',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `You added a ~region~ column to ~seeds/country_codes.csv~. The scheduled ~dbt build~ now fails when loading that seed, because the existing table doesn't have the new column. What should you run?`,
  options: [
    `~dbt seed --select country_codes --full-refresh~`,
    `~dbt seed --select country_codes --empty~`,
    `~dbt retry~`,
    `~dbt run --select country_codes~`
  ],
  answer: 0,
  exp: [
    `Quando a estrutura de um seed muda (nomes ou tipos de colunas), é preciso ~--full-refresh~, que recria a tabela no novo formato. Sem isso, o dbt tenta recarregar os dados na tabela antiga.`,
    `~dbt retry~ repetiria o mesmo erro, ~dbt run~ não carrega seeds e ~--empty~ não recria tabelas.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/seed'
},
{
  id: 'cp-d4-fp-branches', d: 'd4', type: 'mc', set: 'cp1',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `During a nightly ~dbt build~ with 8 threads, ~stg_payments~ fails with a SQL error. The DAG has 120 other models in branches that don't depend on ~stg_payments~, and the job doesn't use ~--fail-fast~. What happens?`,
  options: [
    `The descendants of ~stg_payments~ are skipped, the other branches keep running, and the command ends with an error status.`,
    `dbt stops the whole run immediately.`,
    `dbt retries ~stg_payments~ three times, then skips everything else.`,
    `Every model still runs, and ~stg_payments~ is reported as a warning.`
  ],
  answer: 0,
  exp: [
    `Um erro só afeta quem depende do nó que falhou: os descendentes ficam como SKIP, e o resto do DAG continua. No fim, o comando termina com erro, e o ~run_results.json~ registra o status de cada nó, o que permite usar ~dbt retry~ depois.`,
    `Parar tudo no primeiro erro é o comportamento de ~--fail-fast~, e o dbt não faz novas tentativas automáticas por padrão.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'cp-d5-cg-hotspot', d: 'd5', type: 'hotspot', set: 'cp1',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `This custom generic test fails to compile as soon as it is applied to a column in YAML. Click the line with the bug.`,
  code: [
    {
      lang: 'sql',
      label: 'tests/generic/not_negative.sql',
      hotspot: true,
      text: `
    {% test not_negative(column_name) %}

    select *
    from {{ model }}
    where {{ column_name }} < 0

    {% endtest %}`
    }
  ],
  answer: 0,
  exp: [
    `Testes genéricos recebem os argumentos padrão ~model~ e ~column_name~, e eles precisam estar na assinatura: ~{% test not_negative(model, column_name) %}~. Sem ~model~, a chamada que o dbt faz ao teste não encaixa na definição.`,
    `O corpo está certo: retorna as linhas com valor negativo, que são as falhas.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'cp-d5-sg-folder', d: 'd5', type: 'fill', set: 'cp1',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Complete the blank with the default folder name. A singular data test is a ~.sql~ file whose query returns the failing rows, saved in the ______ folder of the project.`,
  accept: [
    `tests`,
    `tests/`,
    `tests folder`
  ],
  exp: [
    `Testes singulares ficam em ~tests/~, o caminho padrão de ~test-paths~ no ~dbt_project.yml~. Cada arquivo é um ~select~ que retorna as linhas que violam a regra e pode usar ~ref()~ e ~source()~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'cp-d5-rel-nulls', d: 'd5', type: 'mc', set: 'cp1',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `~fct_orders~ has a ~relationships~ test from ~customer_id~ to ~dim_customers.customer_id~. The test passes, but 500 orders have a NULL ~customer_id~. Why?`,
  options: [
    `The built-in ~relationships~ test ignores NULL values; add a ~not_null~ test to catch them.`,
    `~relationships~ only checks the first 100 rows by default.`,
    `A NULL matches any value in a join, so those orders count as valid.`,
    `The test only runs when ~dim_customers~ is rebuilt.`
  ],
  answer: 0,
  exp: [
    `O teste ~relationships~ filtra ~customer_id is not null~ antes de procurar valores sem correspondência no modelo pai, então NULLs nunca contam como falha. Para exigir o valor, combine com ~not_null~.`,
    `Não há limite de linhas por padrão, e em SQL um NULL não casa com nada num join.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/data-tests'
},
{
  id: 'cp-d5-types-match', d: 'd5', type: 'match', set: 'cp1',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Match each need to the type of test that fits it best. One option is not used.`,
  left: [
    `Check that ~order_id~ is unique in ~fct_orders~`,
    `A one-off rule: refunds never exceed payments for any order`,
    `The same "value must be positive" rule on 30 columns`,
    `Validate a complex CASE expression against hand-made input rows`
  ],
  right: [
    `Built-in generic test`,
    `Singular test`,
    `Custom generic test`,
    `Unit test`,
    `Source freshness`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• Os genéricos nativos (~unique~, ~not_null~, ~accepted_values~, ~relationships~) cobrem regras comuns com uma linha de YAML.`,
    `• Um teste singular é um ~select~ escrito para uma regra específica, que não vai se repetir.`,
    `• Quando a mesma regra se repete em vários lugares, vale escrever um teste genérico próprio, com ~{% test %}~, e aplicá-lo no YAML.`,
    `• Unit tests checam a lógica do modelo com dados de entrada fixos, antes de chegar aos dados reais.`,
    `Source freshness mede atraso de carga, não regras de negócio.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'cp-d5-sg-domc', d: 'd5', type: 'domc', set: 'cp1',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about singular tests is correct?`,
  options: [
    `A singular test is a SELECT that returns the rows that break the rule, and it can use ~ref()~ and ~source()~.`,
    `A singular test only runs if it is declared under ~data_tests:~ in a YAML file.`,
    `A singular test must return a single boolean column called ~passed~.`,
    `Singular tests can't use Jinja.`
  ],
  answer: 0,
  exp: [
    `O teste passa quando a consulta retorna zero linhas. Por ser um arquivo SQL comum em ~tests/~, pode usar ~ref()~, ~source()~, macros e ~{{ config() }}~, por exemplo para definir ~severity~.`,
    `Ele não precisa de YAML para rodar: o dbt encontra o arquivo pela pasta. O YAML é opcional, para descrição e configs.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'cp-d5-wf-order', d: 'd5', type: 'order', set: 'cp1',
  topic: 'Implementing various testing steps in the workflow',
  stem: `Put the steps of a nightly production job in the recommended order.`,
  items: [
    `~dbt deps~, to install the packages`,
    `~dbt source freshness~, to check that the raw data arrived`,
    `~dbt build --exclude-resource-type unit_test~, to build and test the models`,
    `~dbt docs generate~, to refresh the documentation`
  ],
  exp: [
    `Primeiro os pacotes, porque o projeto depende deles para compilar. Depois a freshness, para não gastar o build com dados atrasados. Então o ~dbt build~, que constrói e testa cada nó na ordem do DAG; os unit tests ficam para dev e CI. Por último o ~docs generate~, para o catálogo refletir os objetos recém-criados.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'cp-d5-wf-singular', d: 'd5', type: 'mc', set: 'cp1',
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want to run only the singular tests in the project, with no generic tests and no unit tests. Which command should you use?`,
  options: [
    `~dbt test --select test_type:singular~`,
    `~dbt test --select test_type:data~`,
    `~dbt test --singular~`,
    `~dbt test --select resource_type:singular~`
  ],
  answer: 0,
  exp: [
    `O método ~test_type:~ aceita ~generic~, ~singular~, ~unit~ e ~data~. ~test_type:singular~ pega só os testes escritos como arquivos SQL, enquanto ~test_type:data~ junta genéricos e singulares.`,
    `Não existe a flag ~--singular~, e ~resource_type~ distingue tipos de recurso (model, test, seed), não tipos de teste.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#test_type'
},
{
  id: 'cp-d5-wf-severity', d: 'd5', type: 'mc', set: 'cp1',
  codeOptions: true,
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want every data test defined in ~models/staging/~ to warn instead of error, without editing each test. The project is named ~jaffle_shop~. What should you add to ~dbt_project.yml~?`,
  options: [
    `
    data_tests:
      jaffle_shop:
        staging:
          +severity: warn`,
    `
    models:
      jaffle_shop:
        staging:
          +severity: warn`,
    `
    data_tests:
      +severity: warn`,
    `
    models:
      jaffle_shop:
        staging:
          +data_tests:
            severity: warn`
  ],
  answer: 0,
  exp: [
    `Configs de testes no ~dbt_project.yml~ ficam sob ~data_tests:~, com o nome do projeto e o caminho. O caminho é onde o teste está definido: para testes genéricos, a pasta do arquivo YAML; para singulares, a pasta do ~.sql~.`,
    `Sob ~models:~, ~severity~ não vale para os testes. E ~+severity: warn~ direto em ~data_tests:~ afetaria todos os testes do projeto, não só os de staging.`
  ],
  doc: 'https://docs.getdbt.com/reference/data-test-configs'
},
{
  id: 'cp-d5-as-range', d: 'd5', type: 'mc', set: 'cp1',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `~discount_pct~ in ~stg_orders~ must always be between 0 and 1, inclusive. The ~dbt_utils~ package is installed. Which test fits most directly?`,
  options: [
    `~dbt_utils.accepted_range~ with ~min_value: 0~ and ~max_value: 1~`,
    `~accepted_values~ with ~values: [0, 1]~`,
    `~dbt_utils.unique_combination_of_columns~`,
    `~relationships~ to a table of valid discounts`
  ],
  answer: 0,
  exp: [
    `~accepted_range~, do dbt_utils, verifica se os valores ficam entre ~min_value~ e ~max_value~, inclusivos por padrão (~inclusive: true~). No dbt 1.11, os parâmetros ficam em ~arguments:~ no YAML.`,
    `~accepted_values~ aceitaria só exatamente 0 ou 1, e os outros testes checam unicidade e integridade referencial.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'cp-d5-as-where', d: 'd5', type: 'mc', set: 'cp1',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `~shipped_at~ in ~stg_orders~ must be filled for every order except cancelled ones, which never ship. How do you test this assumption with a built-in test?`,
  options: [
    `A ~not_null~ test on ~shipped_at~ with ~config: {where: "status != 'cancelled'"}~`,
    `A ~not_null~ test on ~shipped_at~ with ~severity: warn~`,
    `An ~accepted_values~ test on ~status~ with ~values: ['cancelled']~`,
    `A ~not_null~ test on ~status~`
  ],
  answer: 0,
  exp: [
    `O config ~where~ filtra as linhas que o teste avalia. Assim o ~not_null~ só olha os pedidos que deveriam ter ~shipped_at~ e falha de verdade quando um deles está vazio.`,
    `~severity: warn~ só rebaixa o resultado, sem tirar os cancelados da conta, e as outras opções nem testam ~shipped_at~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/where'
},
{
  id: 'cp-d6-f-hotspot', d: 'd6', type: 'hotspot', set: 'cp1',
  topic: 'Implementing source freshness',
  stem: `~dbt parse~ fails on this source definition. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/shop/_shop__sources.yml',
      hotspot: true,
      text: `
    sources:
      - name: shop
        database: raw
        config:
          loaded_at_field: _loaded_at
          freshness:
            warn_after: {count: 12, period: hour}
            error_after: {count: 2, period: days}
        tables:
          - name: orders
          - name: customers`
    }
  ],
  answer: 7,
  exp: [
    `~period~ só aceita ~minute~, ~hour~ ou ~day~, sempre no singular, então ~days~ é inválido. Para dois dias, use ~{count: 2, period: day}~ ou ~{count: 48, period: hour}~.`,
    `O resto segue o formato atual: ~freshness~ e ~loaded_at_field~ ficam em ~config:~ (desde o 1.9 e o 1.10, respectivamente), e as tabelas herdam a configuração da source.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'cp-d6-f-artifact', d: 'd6', type: 'fill', set: 'cp1',
  topic: 'Implementing source freshness',
  stem: `Complete the blank with the artifact file name. ~dbt source freshness~ saves the status and age of each source table to ______ in the target folder.`,
  accept: [
    `sources.json`,
    `sources`,
    `target/sources.json`,
    `sources json`
  ],
  exp: [
    `~sources.json~ guarda o resultado da última checagem de freshness. Com o de uma execução anterior em ~--state~, o seletor ~source_status:fresher~ compara as duas e pega só o que recebeu dados novos.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/sources-json'
},
{
  id: 'cp-d6-e-ls', d: 'd6', type: 'mc', set: 'cp1',
  topic: 'Implementing dbt exposures',
  stem: `Before changing ~stg_orders~, the BI team asks which of the declared dashboards and apps depend on it, directly or indirectly. Which command answers this?`,
  options: [
    `~dbt ls --select stg_orders+ --resource-type exposure~`,
    `~dbt ls --select +stg_orders --resource-type exposure~`,
    `~dbt docs generate --select exposure:*~`,
    `~dbt ls --select exposure:stg_orders~`
  ],
  answer: 0,
  exp: [
    `Exposures ficam no fim do DAG, como descendentes dos modelos que consomem. ~stg_orders+~ pega todos os descendentes, e ~--resource-type exposure~ deixa só as exposures na lista.`,
    `~+stg_orders~ pega os ancestrais, e ~exposure:stg_orders~ procuraria uma exposure com esse nome.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'cp-d6-e-rename', d: 'd6', type: 'mc', set: 'cp1',
  topic: 'Implementing dbt exposures',
  stem: `You renamed ~fct_orders~ to ~fct_order_lines~ and updated every model that refs it. Now ~dbt parse~ fails, pointing at ~models/marts/_exposures.yml~. What is the most likely cause?`,
  options: [
    `An exposure still lists ~ref('fct_orders')~ in its ~depends_on~, and that ref no longer resolves to a node.`,
    `Exposures have to be renamed whenever a model they use changes.`,
    `~dbt parse~ checks that each exposure's dashboard URL is reachable.`,
    `Exposures can only depend on sources.`
  ],
  answer: 0,
  exp: [
    `Os itens de ~depends_on~ são resolvidos como qualquer ~ref()~. Se o modelo citado não existe mais, o parse falha com um erro de nó não encontrado. Troque para ~ref('fct_order_lines')~.`,
    `O dbt não acessa a URL, e exposures podem depender de modelos, sources e métricas.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'cp-d7-st-new', d: 'd7', type: 'fill', set: 'cp1',
  topic: 'Understanding state and state selection',
  stem: `Complete the selector so it picks only nodes that don't exist at all in the production manifest: ~dbt build --select state:______ --state prod-artifacts~`,
  accept: [
    `new`
  ],
  exp: [
    `~state:new~ seleciona os nós que não existem no manifest de comparação. ~state:modified~ inclui esses nós novos **e** os que mudaram.`,
    `Também existem ~state:old~ (nós que já existiam), ~state:unmodified~ e subseletores como ~state:modified.body~ e ~state:modified.configs~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cp-d7-st-domc', d: 'd7', type: 'domc', set: 'cp1',
  topic: 'Understanding state and state selection',
  stem: `Which statement about ~state:modified~ is correct?`,
  options: [
    `It selects new nodes as well as nodes whose code or configs changed compared to the ~--state~ manifest.`,
    `It compares the data in your tables with the data in production.`,
    `It reads ~run_results.json~ to find the nodes that failed last time.`,
    `It ignores changes made inside macros that a model calls.`
  ],
  answer: 0,
  exp: [
    `~state:modified~ compara o manifest atual com o de ~--state~: pega nós novos e mudanças no SQL, nas configs, nas descrições persistidas, nos contratos e nas macros usadas. Há subseletores para cada tipo, como ~state:modified.macros~.`,
    `Ele compara código, não dados. As falhas da última execução ficam no ~run_results.json~ e são selecionadas com ~result:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cp-d7-r-fixed', d: 'd7', type: 'mc', set: 'cp1',
  topic: 'Using dbt retry',
  stem: `~dbt build~ failed on ~fct_orders~ because of a typo in its SQL; 30 downstream nodes were skipped and 80 others succeeded. You fix the typo and run ~dbt retry~. What happens?`,
  options: [
    `dbt runs ~fct_orders~ with the corrected SQL, then the 30 skipped nodes; the 80 successful nodes aren't run again.`,
    `dbt runs all 111 nodes again, because the code changed.`,
    `dbt runs ~fct_orders~ with the SQL from the failed run, so you have to use ~dbt build~ instead.`,
    `dbt runs only ~fct_orders~ and leaves the skipped nodes for the next scheduled job.`
  ],
  answer: 0,
  exp: [
    `O ~dbt retry~ retoma a última execução a partir do ponto de falha: roda o que deu erro e o que foi pulado por causa dele. Como o projeto é lido de novo, a correção que você fez já vale.`,
    `O que deu certo não é repetido. É o fluxo que a documentação mostra: corrigir o erro e rodar ~dbt retry~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'cp-d7-r-overwritten', d: 'd7', type: 'mc', set: 'cp1',
  topic: 'Using dbt retry',
  stem: `Last night's ~dbt build~ failed on two models. This morning, before investigating, you ran ~dbt compile --select fct_orders~ in the same project folder. Then you ran ~dbt retry~, and nothing was rebuilt. Why?`,
  options: [
    `~dbt retry~ resumes the last invocation, and the ~dbt compile~ run replaced the ~run_results.json~ from the failed build.`,
    `~dbt retry~ only works within one hour of the failure.`,
    `~dbt compile~ fixed the two failed models.`,
    `~dbt retry~ can't resume a ~dbt build~.`
  ],
  answer: 0,
  exp: [
    `Cada comando grava um novo ~run_results.json~ em ~target/~. O retry usa esse arquivo para saber de onde retomar, então passou a ver o ~compile~, que não teve falhas.`,
    `Agora é preciso rodar o ~dbt build~ de novo. O retry funciona normalmente com ~build~ e não tem limite de tempo.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
