/* Domains and the core bank (one question per subtopic of the Topics Outline, weighted by domain). */
window.DBT_DOMAINS = [
  {
    id: 'd1',
    n: 1,
    pt: `Desenvolvimento e otimização de modelos`,
    en: `Developing and optimizing dbt models`,
    subs: 14
  },
  { id: 'd2', n: 2, pt: `Governança de modelos`, en: `Managing dbt models governance`, subs: 3 },
  { id: 'd3', n: 3, pt: `Depuração de erros de modelagem`, en: `Debugging data modeling errors`, subs: 5 },
  {
    id: 'd4',
    n: 4,
    pt: `Troubleshooting e otimização de pipelines`,
    en: `Troubleshooting and optimizing dbt pipelines`,
    subs: 2
  },
  { id: 'd5', n: 5, pt: `Testes no dbt`, en: `Implementing dbt tests`, subs: 3 },
  {
    id: 'd6',
    n: 6,
    pt: `Dependências externas`,
    en: `Implementing and maintaining external dependencies`,
    subs: 2
  },
  { id: 'd7', n: 7, pt: `dbt state`, en: `Leveraging the dbt state`, subs: 2 }
];

window.DBT_Q = [
{
  id: 'd1-source-schema', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Your model selects from ~{{ source('stripe', 'payments') }}~, declared as shown below. The data engineering team moved the raw table to ~raw.stripe_v2.payments~, and dbt keeps reading the old, stale table. Which change fixes the dependency without editing any model SQL?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/stripe/_stripe__sources.yml',
      text: `
    sources:
      - name: stripe
        database: raw
        tables:
          - name: payments`
    }
  ],
  options: [
    `Add ~identifier: stripe_v2~ to the ~payments~ table entry.`,
    `Add ~schema: stripe_v2~ to the ~stripe~ source entry.`,
    `Rename the source from ~stripe~ to ~stripe_v2~.`,
    `Replace ~source()~ with ~ref('payments')~ in the model.`
  ],
  answer: 1,
  exp: [
    `Quando ~schema~ não é informado, o dbt usa o **nome da source** como schema, então hoje ele resolve ~raw.stripe.payments~. Adicionar ~schema: stripe_v2~ mantém o nome lógico ~stripe~ (nenhum modelo muda) e aponta para o objeto físico correto.`,
    `• ~identifier~ troca o nome físico da **tabela**, não do schema.`,
    `• Renomear a source quebraria todos os ~source('stripe', ...)~ dos modelos.`,
    `• ~ref()~ é para modelos, seeds e snapshots. Usá-lo para uma tabela bruta quebra a linhagem do DAG.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'd1-identifier', d: 'd1', type: 'fill',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Complete the blank. A raw table is physically named ~tbl_ord_2024_final~, but you want models to reference it as ~{{ source('erp', 'orders') }}~. In the source's table entry, you keep ~name: orders~ and set the ______ property to ~tbl_ord_2024_final~.`,
  accept: [
    `identifier`
  ],
  exp: [
    `~identifier~ define o nome físico da tabela no warehouse, enquanto ~name~ vira apenas o nome lógico usado em ~source()~. Os modelos ficam legíveis e, se o nome físico mudar de novo, você só altera o YAML.`,
    `Hierarquia de resolução de uma source: ~database~ (padrão: database do target) → ~schema~ (padrão: nome da source) → ~identifier~ (padrão: nome da tabela).`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/identifier'
},
{
  id: 'd1-ephemeral', d: 'd1', type: 'mc',
  topic: 'Understanding core dbt materializations',
  stem: `A lightweight model, ~int_payments_pivoted~, is referenced by only one downstream model. You don't want it to create any object in the warehouse. Which materialization fits, and what is a trade-off of that choice?`,
  options: [
    `~view~: it creates no object in the warehouse, but it is recomputed on every query.`,
    `~ephemeral~: dbt builds it as a temporary table and drops it at the end of the run.`,
    `~ephemeral~: its SQL is interpolated as a CTE into the downstream model, but it cannot be queried directly in the warehouse, which makes debugging harder.`,
    `~table~ with ~full_refresh: false~, so no object is persisted between runs.`
  ],
  answer: 2,
  exp: [
    `Modelos ~ephemeral~ não são construídos no banco: o dbt injeta o SQL deles como CTE nos modelos que os referenciam. Funcionam bem para lógica leve usada em poucos lugares. A desvantagem é a depuração (não existe objeto para consultar) e, se muitos modelos os usarem, a lógica é recalculada em cada um.`,
    `• ~view~ cria um objeto (a view) no warehouse.`,
    `• Ephemeral não usa tabela temporária.`,
    `• ~full_refresh: false~ apenas impede o rebuild completo de incrementais e seeds.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'd1-mat-best', d: 'd1', type: 'mc',
  topic: 'Understanding core dbt materializations',
  stem: `Your project follows dbt's materialization best practices, and staging models are views. ~fct_orders~ is a view that joins several staging views. BI dashboards that query ~fct_orders~ are slow, and building it as a table would take about 40 seconds. What is the recommended next step?`,
  options: [
    `Materialize ~fct_orders~ as a table.`,
    `Materialize every staging model as incremental.`,
    `Change ~fct_orders~ to ephemeral so the BI tool reads the compiled CTEs.`,
    `Change ~fct_orders~ to incremental with the microbatch strategy.`
  ],
  answer: 0,
  exp: [
    `O guia de boas práticas de materialização diz: comece com **view**; quando a consulta ficar lenta para quem usa o dado, mude para **table**; só vá para **incremental** quando o *build* da tabela ficar lento demais.`,
    `• 40 segundos de build não justificam a complexidade de um incremental ou de microbatch.`,
    `• Um modelo ephemeral nem existe no warehouse, então o BI não teria o que consultar.`,
    `• Transformar o staging em incremental não reduz o custo das consultas no mart.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/materializations/1-guide-overview'
},
{
  id: 'd1-dry-macro', d: 'd1', type: 'mc',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `The expression ~round(<column> / 100.0, 2)~ is copy-pasted in 12 models to convert different cent-based columns (for example ~amount_cents~ and ~tax_cents~) into dollars. You want a single place to change this logic in the future. What should you do?`,
  options: [
    `Create a seed with conversion factors and join it in each model.`,
    `Store the full SQL expression in a project ~var~ and call ~{{ var('to_dollars') }}~.`,
    `Create a macro such as ~cents_to_dollars(column_name)~ in the ~macros/~ folder and call it in each model.`,
    `Move the expression into an analysis file and ~ref()~ it from each model.`
  ],
  answer: 2,
  exp: [
    `Macros são a forma DRY de reutilizar trechos de SQL **parametrizados**. Aqui o nome da coluna muda, então a lógica precisa receber um argumento: ~{{ cents_to_dollars('amount_cents') }}~.`,
    `• Uma ~var~ guarda um valor fixo e não recebe argumentos.`,
    `• Um seed só acrescentaria joins desnecessários.`,
    `• Analyses não são materializadas e não podem ser referenciadas com ~ref()~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/jinja-macros'
},
{
  id: 'd1-refactor-order', d: 'd1', type: 'order',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Put the steps of the recommended process for refactoring a legacy SQL query into dbt in the correct order.`,
  items: [
    `Migrate the legacy query into a dbt model unchanged (1:1)`,
    `Replace hard-coded table references with ~source()~`,
    `Restructure the query into import, logical, and final CTEs`,
    `Split the logic into staging, intermediate, and mart models`,
    `Audit the refactored output against the legacy output`
  ],
  exp: [
    `Fluxo do guia *Refactoring legacy SQL to dbt*: primeiro garanta que o SQL roda no dbt sem mudanças; depois troque as referências fixas por ~source()~; organize em CTEs (imports → lógica → final); quebre em camadas reutilizáveis; por fim, audite o resultado (por exemplo, com ~audit_helper.compare_relations~) para provar que ele continua igual ao legado.`
  ],
  doc: 'https://docs.getdbt.com/guides/refactoring-legacy-sql'
},
{
  id: 'd1-build-order', d: 'd1', type: 'order',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `~stg_orders~ has one unit test and one ~not_null~ data test. ~fct_orders~ refs ~stg_orders~ and has a ~unique~ data test. You run ~dbt build --select stg_orders+~. Put the execution steps in order.`,
  items: [
    `Unit test on ~stg_orders~`,
    `Build the ~stg_orders~ model`,
    `~not_null~ test on ~stg_orders~`,
    `Build the ~fct_orders~ model`,
    `~unique~ test on ~fct_orders~`
  ],
  exp: [
    `No ~dbt build~, cada nó segue a ordem do DAG. Os **unit tests** de um modelo rodam *antes* de ele ser materializado (validam a lógica com dados fixos); depois o modelo é construído; em seguida rodam os **data tests** dele; só então os filhos são executados.`,
    `Se um teste de ~stg_orders~ falhar com severity ~error~, ~fct_orders~ fica como SKIP.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'd1-show', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `You want to preview 10 rows returned by ~fct_orders~ while iterating on its logic, without creating or replacing any object in the warehouse. Which command should you use?`,
  options: [
    `~dbt run --select fct_orders --empty~`,
    `~dbt show --select fct_orders --limit 10~`,
    `~dbt compile --select fct_orders~`,
    `~dbt docs generate --select fct_orders~`
  ],
  answer: 1,
  exp: [
    `~dbt show~ compila o nó, executa a consulta no warehouse e mostra o resultado no terminal (5 linhas por padrão; ~--limit~ muda isso). Não materializa nada. Também aceita SQL avulso com ~--inline "select ..."~.`,
    `• ~dbt run --empty~ cria ou substitui o objeto (vazio).`,
    `• ~dbt compile~ só gera o SQL, sem retornar linhas.`,
    `• ~dbt docs generate~ gera os artefatos da documentação.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/show'
},
{
  id: 'd1-commands-match', d: 'd1', type: 'match',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Match each command to what it does.`,
  left: [
    `~dbt seed~`,
    `~dbt snapshot~`,
    `~dbt docs generate~`,
    `~dbt compile~`,
    `~dbt show~`
  ],
  right: [
    `Loads CSV files from the seed paths into the warehouse`,
    `Records changes to mutable source data over time (SCD Type 2)`,
    `Produces catalog.json for the documentation site`,
    `Renders Jinja into SQL under target/ without building models`,
    `Runs a query and prints a preview of the results`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `• ~dbt seed~: carrega CSVs pequenos e estáticos (por exemplo, códigos de país). ~--full-refresh~ recria a tabela quando as colunas mudam.`,
    `• ~dbt snapshot~: executa os snapshots (SCD tipo 2), adicionando ~dbt_valid_from~ e ~dbt_valid_to~.`,
    `• ~dbt docs generate~: gera ~catalog.json~ (com metadados do warehouse) e ~manifest.json~; ~dbt docs serve~ abre o site localmente.`,
    `• ~dbt compile~: grava o SQL renderizado em ~target/compiled~.`,
    `• ~dbt show~: pré-visualiza resultados sem materializar.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-commands'
},
{
  id: 'd1-selector-at', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which command builds ~my_model~, all of its descendants, and all ancestors of those descendants, so that every descendant has its parents up to date?`,
  options: [
    `~dbt build --select +my_model+~`,
    `~dbt build --select my_model+~`,
    `~dbt build --select @my_model~`,
    `~dbt build --select 1+my_model+1~`
  ],
  answer: 2,
  exp: [
    `O operador ~@~ seleciona o modelo, todos os descendentes **e** todos os ancestrais desses descendentes. É útil em CI para garantir que os filhos tenham todos os pais construídos.`,
    `• ~+my_model+~ pega só os ancestrais e os descendentes do próprio ~my_model~.`,
    `• ~my_model+~ pega só os descendentes.`,
    `• ~1+my_model+1~ pega só o primeiro grau acima e abaixo.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/graph-operators'
},
{
  id: 'd1-dag-staging', d: 'd1', type: 'mc',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `According to dbt's recommended project structure, where should ~{{ source() }}~ be used?`,
  options: [
    `In any model that needs raw data, to avoid unnecessary layers.`,
    `Only in mart models, so business logic stays close to the raw data.`,
    `Only in intermediate models, which combine several sources.`,
    `Only in staging models, typically one staging model per source table.`
  ],
  answer: 3,
  exp: [
    `Na estrutura recomendada, cada tabela de origem tem **um** modelo de staging (relação 1:1) que renomeia, faz casts e limpezas leves. O resto do projeto referencia esses modelos via ~ref()~. Assim cada dado bruto tem um único ponto de entrada e o DAG fica limpo: sources → staging → intermediate → marts.`,
    `Usar ~source()~ em marts ou intermediários cria joins diretos com dados brutos e duplica a lógica de limpeza.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/2-staging'
},
{
  id: 'd1-dag-hotspot', d: 'd1', type: 'hotspot',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `The model below lives in ~models/marts/finance/fct_orders.sql~. Click the line that most undermines a clean, modular DAG.`,
  code: [
    {
      lang: 'sql',
      label: 'models/marts/finance/fct_orders.sql',
      hotspot: true,
      text: `
    with orders as (
        select * from {{ ref('stg_shop__orders') }}
    ),
    customers as (
        select * from {{ ref('stg_shop__customers') }}
    ),
    payments as (
        select * from {{ source('stripe', 'payments') }}
    ),
    final as (
        select
            orders.order_id,
            customers.customer_id,
            sum(payments.amount) as amount
        from orders
        left join customers using (customer_id)
        left join payments using (order_id)
        group by 1, 2
    )
    select * from final`
    }
  ],
  answer: 7,
  exp: [
    `Um mart não deve ler direto de uma source. Crie ~stg_stripe__payments~ (1:1 com a source, com renomeações e casts) e use ~ref()~ aqui. Isso evita limpeza duplicada e mantém o padrão source → staging → marts.`,
    `O pacote ~dbt_project_evaluator~ aponta esse caso como *direct join to source*.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview'
},
{
  id: 'd1-custom-schema', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `Your development target schema in ~profiles.yml~ is ~dbt_jdoe~. Using the default ~generate_schema_name~ macro, in which schema is ~models/marts/fct_orders.sql~ built?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
    models:
      jaffle_shop:
        +materialized: view
        marts:
          +materialized: table
          +schema: analytics`
    }
  ],
  options: [
    `~analytics~`,
    `~dbt_jdoe~`,
    `~analytics_dbt_jdoe~`,
    `~dbt_jdoe_analytics~`
  ],
  answer: 3,
  exp: [
    `O macro padrão ~generate_schema_name~ concatena ~<target.schema>_<custom_schema>~, resultando em ~dbt_jdoe_analytics~. Isso evita que desenvolvedores escrevam no schema de produção.`,
    `Para usar só ~analytics~ (em produção, por exemplo), sobrescreva o macro ~generate_schema_name~ no seu projeto.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/custom-schemas'
},
{
  id: 'd1-config-precedence', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `~fct_orders~ receives ~materialized~ in three places: ~dbt_project.yml~ sets ~+materialized: view~ for ~models/marts/~, the model's properties YAML sets ~config: {materialized: incremental}~, and ~fct_orders.sql~ starts with ~{{ config(materialized='table') }}~. How is the model materialized?`,
  options: [
    `As a view`,
    `As an incremental model`,
    `As a table`,
    `dbt raises a compilation error because of conflicting configs`
  ],
  answer: 2,
  exp: [
    `Precedência, da mais específica para a menos específica: bloco ~config()~ no arquivo do modelo > ~config:~ no YAML de propriedades > ~dbt_project.yml~. Configs conflitantes não geram erro; vence a mais específica.`
  ],
  doc: 'https://docs.getdbt.com/reference/define-configs'
},
{
  id: 'd1-package-lock', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `Two engineers run ~dbt deps~ on different days and get different versions of ~dbt_utils~, even though ~packages.yml~ (which uses a version range) is the same. How do you guarantee that every environment installs exactly the same package versions?`,
  options: [
    `Commit the ~dbt_packages/~ folder to the repository.`,
    `Commit the ~package-lock.yml~ file generated by ~dbt deps~.`,
    `Run ~dbt deps --upgrade~ in every environment before each run.`,
    `Add ~require-dbt-version~ to ~dbt_project.yml~.`
  ],
  answer: 1,
  exp: [
    `Desde o dbt 1.7, ~dbt deps~ gera o ~package-lock.yml~ com as versões exatas resolvidas. Com esse arquivo versionado no Git, todo mundo instala as mesmas versões.`,
    `• ~dbt_packages/~ deve ficar fora do Git (fica em ~clean-targets~).`,
    `• ~--upgrade~ faz o oposto: ignora o lock e resolve versões novas.`,
    `• ~require-dbt-version~ restringe a versão do dbt, não a dos pacotes.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'd1-git-revision', d: 'd1', type: 'fill',
  topic: 'Using dbt Packages',
  stem: `Complete the ~packages.yml~ entry so the package is pinned to the tag ~1.3.0~ of its Git repository. What key goes in the blank?`,
  code: [
    {
      lang: 'yaml',
      label: 'packages.yml',
      text: `
    packages:
      - git: "https://github.com/dbt-labs/dbt-utils.git"
        ______: 1.3.0`
    }
  ],
  accept: [
    `revision`
  ],
  exp: [
    `Pacotes Git usam ~revision~, que aceita tag, branch ou SHA completo de commit. Fixar tag ou commit garante reprodutibilidade; apontar para uma branch (como ~main~) pode trazer mudanças inesperadas.`,
    `Pacotes do dbt Hub usam ~package:~ + ~version:~ (aceita intervalos como ~[">=1.0.0", "<2.0.0"]~). Pacotes locais usam ~local:~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'd1-python', d: 'd1', type: 'domc',
  topic: 'Creating Python Models',
  stem: `Which statement about dbt Python models is correct?`,
  options: [
    `A Python model defines a ~model(dbt, session)~ function that returns a DataFrame, and it can be materialized as ~table~ or ~incremental~.`,
    `A Python model can use Jinja such as ~{{ ref('stg_orders') }}~ inside the ~.py~ file.`,
    `A Python model can be materialized as ~view~ or ~ephemeral~.`,
    `dbt executes Python models on the machine running dbt and then uploads the result to the warehouse.`
  ],
  answer: 0,
  exp: [
    `Modelos Python definem ~def model(dbt, session):~ e retornam um DataFrame. Referências usam ~dbt.ref()~ e ~dbt.source()~; configs vão em ~dbt.config(...)~ ou no YAML. Materializações suportadas: ~table~ e ~incremental~ (com ~dbt.is_incremental~ e ~dbt.this~).`,
    `Não existe Jinja em arquivos ~.py~. O código roda **na plataforma de dados** (Snowpark no Snowflake, Databricks, BigQuery via Dataproc ou BigFrames), não na máquina local.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'd1-grants', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `Given the configuration below, which roles receive ~select~ on ~fct_revenue~ after ~dbt run~?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
      models:
        +grants:
          select: ['reporter']`
    },
    {
      lang: 'sql',
      label: 'models/marts/fct_revenue.sql',
      text: `
      {{ config(grants={'+select': ['finance_analyst']}) }}

      select ...`
    }
  ],
  options: [
    `Only ~finance_analyst~`,
    `Only ~reporter~`,
    `Both ~reporter~ and ~finance_analyst~`,
    `None, because dbt raises an error when grants are defined twice`
  ],
  answer: 2,
  exp: [
    `Por padrão, a configuração de ~grants~ mais específica **substitui** (clobber) a menos específica. O prefixo ~+~ no privilégio (~'+select'~) muda isso para **adicionar** aos grantees herdados. Sem o ~+~, só ~finance_analyst~ receberia select.`,
    `Esse ~+~ dentro de ~grants~ é diferente do ~+~ usado antes das configs no ~dbt_project.yml~. Para revogar um acesso, informe uma lista menor ou vazia (~select: []~). Se você apagar a config ~grants~ inteira, o dbt deixa de gerenciar os grants e não revoga nada.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'd1-snapshot-deletes', d: 'd1', type: 'mc',
  topic: 'Creating snapshots in YAML',
  stem: `Customer 42 is physically deleted from the source table. What happens to ~customers_snapshot~ on the next ~dbt snapshot~?`,
  code: [
    {
      lang: 'yaml',
      label: 'snapshots/customers_snapshot.yml',
      text: `
    snapshots:
      - name: customers_snapshot
        relation: source('crm', 'customers')
        config:
          unique_key: customer_id
          strategy: timestamp
          updated_at: updated_at
          hard_deletes: invalidate`
    }
  ],
  options: [
    `Nothing changes; the current row for customer 42 stays open.`,
    `The current row for customer 42 is closed by setting ~dbt_valid_to~.`,
    `A new row for customer 42 is inserted with ~dbt_is_deleted = true~.`,
    `All history rows for customer 42 are deleted from the snapshot.`
  ],
  answer: 1,
  exp: [
    `~hard_deletes~ (dbt 1.9+) tem três valores: ~ignore~ (padrão) não faz nada; ~invalidate~ fecha o registro atual preenchendo ~dbt_valid_to~; ~new_record~ insere uma nova linha com ~dbt_is_deleted = True~.`,
    `Snapshots nunca apagam histórico e ignoram ~--full-refresh~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'd1-snapshot-check', d: 'd1', type: 'mc',
  topic: 'Creating snapshots in YAML',
  stem: `You must track changes to a source table that has no reliable ~updated_at~ column. Only changes to ~status~ and ~plan_tier~ matter. Which snapshot configuration is most appropriate?`,
  options: [
    `~strategy: timestamp~ with ~updated_at: current_timestamp()~`,
    `~strategy: check~ with ~check_cols: ['status', 'plan_tier']~`,
    `~strategy: check~ without ~check_cols~, so dbt compares every column`,
    `~strategy: timestamp~ with ~updated_at: plan_tier~`
  ],
  answer: 1,
  exp: [
    `Sem uma coluna de atualização confiável, use ~strategy: check~ com ~check_cols~ (uma lista de colunas ou ~all~). ~check_cols~ é obrigatório nessa estratégia.`,
    `• Usar ~current_timestamp()~ como ~updated_at~ faria todo registro parecer alterado a cada execução.`,
    `• A estratégia ~timestamp~ exige uma coluna de data/hora real de atualização.`,
    `Também são obrigatórios ~relation~ (no topo da entrada) e ~unique_key~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'd1-strategy-match', d: 'd1', type: 'match',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `Match each dataset to the most appropriate incremental strategy.`,
  left: [
    `Append-only clickstream; rows are never updated and duplicates are handled downstream`,
    `Customer table where existing rows change; reliable unique key; moderate size`,
    `BigQuery table partitioned by date where whole days are reprocessed each run`,
    `Multi-terabyte event table; you want to process, retry, and backfill independent daily batches`,
    `Rows keyed by a column that isn't truly unique; replace all rows for the keys present in the new data`
  ],
  right: [
    `append`,
    `merge`,
    `insert_overwrite`,
    `microbatch`,
    `delete+insert`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `• **append**: só insere, sem checar duplicados. É a mais barata.`,
    `• **merge**: upsert pela ~unique_key~ (atualiza existentes, insere novos). Pode ficar caro em tabelas enormes; sem ~unique_key~ se comporta como append.`,
    `• **insert_overwrite**: substitui partições inteiras. Ideal para tabelas particionadas, como no BigQuery por data.`,
    `• **microbatch**: processa lotes de tempo (~event_time~, ~batch_size~), com backfill e retry por lote.`,
    `• **delete+insert**: apaga as linhas das chaves presentes e reinsere. Útil quando a chave não é realmente única ou quando merge não é suportado.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy'
},
{
  id: 'd1-is-incremental', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `In which two situations does ~is_incremental()~ evaluate to false, so the full query runs? (Choose two.)`,
  code: [
    {
      lang: 'sql',
      label: 'models/fct_events.sql',
      text: `
    {{ config(materialized='incremental', unique_key='event_id') }}

    select * from {{ ref('stg_events') }}
    {% if is_incremental() %}
      where loaded_at > (select max(loaded_at) from {{ this }})
    {% endif %}`
    }
  ],
  options: [
    `The first run, when the target table does not exist yet`,
    `A run with the ~--full-refresh~ flag (and no ~full_refresh: false~ config)`,
    `Any run where ~unique_key~ is configured`,
    `Any run triggered by ~dbt build~ instead of ~dbt run~`,
    `A run where ~on_schema_change~ is set to ~fail~`
  ],
  answers: [0, 1],
  exp: [
    `~is_incremental()~ só retorna true quando: o modelo está configurado como incremental, a tabela de destino já existe (como tabela) e não há ~--full-refresh~ (ou o modelo tem ~full_refresh: false~, que faz o flag ser ignorado).`,
    `~unique_key~, o comando usado (~run~ ou ~build~) e ~on_schema_change~ não mudam esse retorno.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-models'
},
{
  id: 'd1-empty', d: 'd1', type: 'mc',
  topic: 'Validating model logic and schema definitions in dry-runs using the --empty flag',
  stem: `Before merging a large refactor, you want to confirm that every model compiles, all dependencies resolve, and the generated SQL is valid on the warehouse, without paying to scan the input data. Which command best achieves this?`,
  options: [
    `~dbt compile~`,
    `~dbt parse~`,
    `~dbt run --empty~`,
    `~dbt run --sample="1 day"~`
  ],
  answer: 2,
  exp: [
    `~--empty~ limita refs e sources a zero linhas. O SQL é executado de verdade no warehouse (validando sintaxe, colunas, permissões e dependências), mas sem custo de leitura de dados. O resultado são objetos vazios, então use em dev ou CI. Funciona em ~run~, ~build~, ~snapshot~ e ~compile~, e é ignorado em modelos Python.`,
    `• ~compile~ e ~parse~ não validam o SQL no warehouse.`,
    `• ~--sample~ ainda lê dados (uma janela de tempo).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/empty-flag'
},
{
  id: 'd1-sample', d: 'd1', type: 'mc',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `~fct_sessions~ refs ~stg_sessions~ (configured with ~event_time: session_start~) and ~dim_users~ (no ~event_time~). You run ~dbt run --select fct_sessions --sample="3 days"~. What happens?`,
  options: [
    `Both refs are filtered to the last 3 days.`,
    `dbt raises an error because ~dim_users~ has no ~event_time~.`,
    `Only the final output of ~fct_sessions~ is limited to 3 days, based on its own ~event_time~.`,
    `~stg_sessions~ is filtered to the last 3 days of ~session_start~, and ~dim_users~ is read in full.`
  ],
  answer: 3,
  exp: [
    `O modo sample filtra **as entradas** (refs e sources) que têm ~event_time~ configurado. As que não têm são lidas por completo, sem erro.`,
    `O valor pode ser relativo (~"3 days"~, ~"6 hours"~) ou estático (~"{'start': '2024-07-01', 'end': '2024-07-08'}"~). Para tirar um ref específico da amostragem, use ~{{ ref('x').render() }}~. Disponível em ~dbt run~ e ~dbt build~; ignorado em modelos Python.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'd1-microbatch-retry', d: 'd1', type: 'mc',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `During last night's run of the model below, 2 of the 30 daily batches failed because of a warehouse timeout. The other 28 succeeded. What is the most efficient way to reprocess only the failed batches?`,
  code: [
    {
      lang: 'sql',
      label: 'models/fct_sessions.sql',
      text: `
    {{ config(
        materialized='incremental',
        incremental_strategy='microbatch',
        event_time='session_start',
        begin='2024-01-01',
        batch_size='day'
    ) }}

    select * from {{ ref('stg_sessions') }}`
    }
  ],
  options: [
    `~dbt retry~`,
    `~dbt run --select fct_sessions --full-refresh~`,
    `~dbt build --select result:fail --state target~`,
    `Remove ~begin~ from the config and run the model again`
  ],
  answer: 0,
  exp: [
    `No microbatch, cada lote é uma consulta independente, e o ~dbt retry~ reprocessa **apenas os lotes que falharam**.`,
    `• ~--full-refresh~ reconstruiria tudo desde ~begin~, o que é caro. A recomendação é até configurar ~full_refresh: false~ nesses modelos e usar backfill com ~--event-time-start~/~--event-time-end~.`,
    `• ~result:fail~ seleciona testes que falharam, não modelos com erro.`,
    `• ~begin~ é obrigatório.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'd1-microbatch-domc', d: 'd1', type: 'domc',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `Which statement about the microbatch incremental strategy is correct?`,
  options: [
    `You write the model query to process a single batch, and dbt automatically filters upstream refs that have ~event_time~ configured.`,
    `The model must wrap its filter in ~{% if is_incremental() %}~ so dbt knows which rows belong to each batch.`,
    `The default ~lookback~ is 0, so late-arriving data is never reprocessed unless configured.`,
    `You can backfill with ~--event-time-start~ alone; dbt uses the current time as the end.`
  ],
  answer: 0,
  exp: [
    `Microbatch exige ~event_time~, ~batch_size~ (~hour~, ~day~, ~month~ ou ~year~) e ~begin~. O ~lookback~ padrão é **1** (reprocessa um lote anterior para pegar dados atrasados). Não precisa de ~is_incremental()~.`,
    `Para backfill, ~--event-time-start~ e ~--event-time-end~ são obrigatórios juntos. Upstreams sem ~event_time~ são lidos por inteiro em cada lote. Todos os horários são tratados como UTC.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'd2-contract-missing', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `You added ~lifetime_value~ to the SQL of ~dim_customers~, which has an enforced contract. ~dbt run~ now fails with the error below. What resolves the error while keeping the contract enforced?`,
  code: [
    {
      lang: 'log',
      text: `
    Compilation Error in model dim_customers (models/marts/dim_customers.sql)
      This model has an enforced contract that failed.
      Please ensure the name, data_type, and number of columns in your contract
      match the columns in your model's definition.

      | column_name    | definition_type | contract_type | mismatch_reason     |
      | -------------- | --------------- | ------------- | ------------------- |
      | lifetime_value | NUMBER          |               | missing in contract |`
    }
  ],
  options: [
    `Declare ~lifetime_value~ with its ~data_type~ in the model's YAML columns.`,
    `Reorder the YAML columns so they match the order of the SQL select.`,
    `Change the materialization from ~table~ to ~view~.`,
    `Add a ~not_null~ test to ~lifetime_value~.`
  ],
  answer: 0,
  exp: [
    `Com contrato aplicado, toda coluna retornada pelo SQL precisa estar no YAML com ~name~ e ~data_type~, e vice-versa. O dbt faz essa checagem prévia (preflight) antes de construir o modelo.`,
    `• A checagem ignora a ordem das colunas, então reordenar não resolve.`,
    `• Views também aplicam o contrato (nomes e tipos).`,
    `• Um teste roda depois do build e não corrige a checagem prévia.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-contract-supported', d: 'd2', type: 'domc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `Which of the following models can have an enforced model contract?`,
  options: [
    `A SQL incremental model with ~on_schema_change: append_new_columns~`,
    `A SQL model materialized as ~ephemeral~`,
    `A Python model materialized as ~table~`,
    `A SQL incremental model with ~on_schema_change: sync_all_columns~`
  ],
  answer: 0,
  exp: [
    `Contratos são suportados em modelos SQL ~table~, ~view~ (nomes e tipos, sem constraints) e ~incremental~, este **apenas** com ~on_schema_change~ igual a ~append_new_columns~ ou ~fail~.`,
    `Não são suportados: ~ephemeral~, ~materialized_view~, modelos Python e outros tipos de recurso (sources, seeds, snapshots).`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-versions-resolve', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `A downstream model uses ~{{ ref('dim_customers') }}~ with no version argument. Which version does it resolve to, and how is v3 classified?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_dim_customers.yml',
      text: `
    models:
      - name: dim_customers
        latest_version: 2
        versions:
          - v: 1
          - v: 2
          - v: 3`
    }
  ],
  options: [
    `v3, because it is the highest version number`,
    `v2; v3 is a prerelease version`,
    `v1, because unpinned refs resolve to the oldest version`,
    `None; dbt raises an error because refs to versioned models must be pinned`
  ],
  answer: 1,
  exp: [
    `Um ~ref~ sem versão resolve para a ~latest_version~ (aqui, v2). Versões acima da ~latest_version~ são *prerelease*; quem consome pode testá-las com ~ref('dim_customers', v=3)~. Se ~latest_version~ for omitido, vale a maior versão.`,
    `Por padrão, cada versão fica em ~dim_customers_v<N>.sql~ e gera a relação ~dim_customers_v<N>~. Seletores úteis: ~version:latest~, ~version:prerelease~, ~version:old~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'd2-deprecation', d: 'd2', type: 'fill',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `You released ~dim_customers~ v2 with a breaking change. To give consumers a migration window, and have dbt warn when v1 is used after a given date, which property do you set on v1?`,
  accept: [
    `deprecation_date`,
    `deprecation date`,
    `deprecation-date`
  ],
  exp: [
    `~deprecation_date~ marca quando uma versão (ou modelo) será descontinuada. O dbt emite avisos para quem referencia ou constrói um modelo com a data de descontinuação próxima ou vencida. Isso dá um prazo claro para migrar; depois dele, remova a versão antiga.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/deprecation_date'
},
{
  id: 'd2-constraints-snowflake', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `On Snowflake, ~fct_orders~ has an enforced contract, and ~order_id~ has ~not_null~ and ~primary_key~ constraints. An upstream bug produces two rows with the same ~order_id~. What happens on ~dbt run~?`,
  options: [
    `The model builds successfully, because Snowflake doesn't enforce primary keys; you still need a ~unique~ data test.`,
    `The build fails because Snowflake rejects duplicate primary key values.`,
    `dbt automatically deduplicates the rows before inserting them.`,
    `The build fails during the contract's preflight check.`
  ],
  answer: 0,
  exp: [
    `A aplicação de constraints depende da plataforma. No Snowflake, só ~not_null~ é aplicado de fato; ~primary_key~, ~unique~ e ~foreign_key~ são criados mas não verificados, e ~check~ não é suportado. O Postgres aplica todos.`,
    `Por isso constraints não substituem data tests como ~unique~. O preflight do contrato só compara nomes e tipos de colunas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-constraints-hotspot', d: 'd2', type: 'hotspot',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `The team expects the warehouse to reject NULL ~payment_id~ values, but NULLs are loaded with no error. Click the line responsible.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_fct_payments.yml',
      hotspot: true,
      text: `
    models:
      - name: fct_payments
        config:
          materialized: view
          contract:
            enforced: true
        columns:
          - name: payment_id
            data_type: int
            constraints:
              - type: not_null
          - name: amount
            data_type: numeric`
    }
  ],
  answer: 3,
  exp: [
    `Constraints só são aplicadas em modelos ~table~ e ~incremental~, nunca em ~view~ ou ~ephemeral~. Uma view com contrato aplicado valida apenas nomes e tipos das colunas.`,
    `Mude para ~table~ (ou ~incremental~) para que o ~not null~ entre no DDL. Constraints também exigem ~contract: {enforced: true}~ e ~data_type~ em todas as colunas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-access-match', d: 'd2', type: 'match',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Match each ~access~ level to the models that can ~ref()~ it. One option is not used.`,
  left: [
    `~private~`,
    `~protected~`,
    `~public~`
  ],
  right: [
    `Only models in the same group`,
    `Models in the same project or package (default)`,
    `Any model, including other projects`,
    `Only models with an enforced contract`
  ],
  answer: [0, 1, 2],
  exp: [
    `~access~ controla quem pode referenciar o modelo: ~private~ só modelos do mesmo ~group~; ~protected~ (padrão) modelos do mesmo projeto, inclusive quando ele é instalado como pacote; ~public~ qualquer um, inclusive outros projetos via dbt Mesh.`,
    `Um ~ref~ que viola o nível de acesso gera erro no parse. Access não depende de contrato, embora ter contrato em modelos públicos seja boa prática.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd3-node-not-found', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `What is the most likely cause of this error?`,
  code: [
    {
      lang: 'log',
      text: `
    Compilation Error
      Model 'model.jaffle_shop.fct_orders' (models/marts/fct_orders.sql) depends on
      a node named 'stg_order' which was not found`
    }
  ],
  options: [
    `The warehouse table ~stg_order~ was dropped.`,
    `~fct_orders~ references a model name that doesn't exist in the project, such as a typo or a disabled model.`,
    `There is a circular dependency between ~fct_orders~ and ~stg_orders~.`,
    `The profile's target schema is incorrect.`
  ],
  answer: 1,
  exp: [
    `É um erro de compilação: o dbt monta o DAG a partir dos ~ref()~ e não encontrou um nó chamado ~stg_order~ no projeto (erro de digitação, arquivo renomeado ou modelo com ~enabled: false~). Esse erro não depende de o objeto existir no warehouse.`,
    `Ciclos geram outro erro (*Dependency Error: Found a cycle*).`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-error-types', d: 'd3', type: 'match',
  topic: 'Understanding logged error messages',
  stem: `Match each error message to its category.`,
  left: [
    `~Could not find profile named 'jaffle_shop'~`,
    `~depends on a node named 'stg_payment' which was not found~`,
    `~Found a cycle: model.jaffle.a --> model.jaffle.b --> model.jaffle.a~`,
    `~SQL compilation error: invalid identifier 'ORDER_TOTL'~`
  ],
  right: [
    `Runtime Error`,
    `Compilation Error`,
    `Dependency Error`,
    `Database Error`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `Categorias do guia *Debugging errors*, uma para cada etapa de um comando:`,
    `• **Runtime Error** (inicialização): o dbt não consegue começar, por exemplo sem ~dbt_project.yml~, com profile errado ou sem conexão.`,
    `• **Compilation Error** (parse): Jinja ou YAML inválido, ~ref~ para nó inexistente.`,
    `• **Dependency Error** (validação do grafo): ciclos no DAG. Use ~{{ this }}~ se o modelo precisa referenciar a si mesmo.`,
    `• **Database Error** (execução): o warehouse rejeitou o SQL. Confira ~target/compiled~ ou ~target/run~ e ~logs/dbt.log~.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-compiled-first', d: 'd3', type: 'mc',
  topic: 'Troubleshooting using compiled code',
  stem: `A model full of Jinja loops fails with ~Database Error in model customers: syntax error at or near ")"~. What is the best first step to debug it?`,
  options: [
    `Run ~dbt run --full-refresh~ to rebuild the model from scratch.`,
    `Open the compiled SQL in the ~target/~ directory, find the generated syntax problem, and run that SQL directly in the warehouse.`,
    `Delete ~dbt_packages/~ and run ~dbt deps~.`,
    `Add ~--warn-error~ to get a full stack trace.`
  ],
  answer: 1,
  exp: [
    `*Database Error* significa que o SQL gerado chegou ao warehouse e foi rejeitado. Com Jinja, o problema costuma estar no SQL renderizado, como uma vírgula sobrando no último item de um loop (resolva com ~loop.last~).`,
    `Abra ~target/compiled/...~ (o SELECT renderizado) ou ~target/run/...~ (o DDL executado), ache o erro e rode o SQL direto no warehouse. Os outros comandos não atacam a causa.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-target-dirs', d: 'd3', type: 'mc',
  topic: 'Troubleshooting using compiled code',
  stem: `What is the difference between the files in ~target/compiled/~ and ~target/run/~?`,
  options: [
    `~compiled~ has the rendered SELECT statement; ~run~ has the full statement dbt executed, including DDL/DML such as ~create table as~.`,
    `~compiled~ has SQL for models; ~run~ has SQL for tests only.`,
    `~compiled~ is generated only by ~dbt compile~; ~run~ is generated only by ~dbt test~.`,
    `They are identical; ~run~ is a backup copy of ~compiled~.`
  ],
  answer: 0,
  exp: [
    `~target/compiled~ guarda o SQL de cada nó com o Jinja renderizado (o SELECT), que você pode rodar em qualquer editor. ~target/run~ guarda o que foi realmente enviado ao warehouse, envolvido pelo DDL/DML da materialização (~create or replace view/table ... as~, ~merge~ etc.).`,
    `Use o compiled para depurar lógica e o run para depurar a materialização. Ambos são gerados por comandos como ~run~ e ~build~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/compile'
},
{
  id: 'd3-yaml-hotspot', d: 'd3', type: 'hotspot',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt parse~ fails with a YAML parsing error in this file. Click the line that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_customers.yml',
      hotspot: true,
      text: `
    version: 2

    models:
      - name: stg_customers
        description: One row per customer
        columns:
          - name: customer_id
            data_tests:
              - unique
              - not_null
         - name: first_name
            description: Customer first name`
    }
  ],
  answer: 10,
  exp: [
    `YAML depende da indentação. Os itens da lista ~columns~ estão com 6 espaços (~      - name: customer_id~), mas ~first_name~ está com 5, e o parser não consegue encaixá-lo na estrutura. Alinhe com o item anterior.`,
    `Erros de YAML aparecem como *Compilation Error* indicando o arquivo e a linha. ~dbt parse~ é a forma mais rápida de validar.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-duplicate-yaml', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `After a teammate's merge, ~dbt parse~ fails with the error below. What fixes it?`,
  code: [
    {
      lang: 'log',
      text: `
    Compilation Error
      dbt found two schema.yml entries for the same resource named stg_orders.
      Resources and their associated columns may only be described a single time.
      To fix this, remove one of the resource entries for stg_orders in this file:
       - models/staging/_stg_orders.yml`
    }
  ],
  options: [
    `Remove one of the two YAML entries that describe ~stg_orders~, keeping its properties in a single place.`,
    `Rename ~stg_orders.sql~ to ~stg_orders_v2.sql~.`,
    `Run ~dbt clean~ and then ~dbt deps~.`,
    `Add ~version: 2~ to the top of both YAML files.`
  ],
  answer: 0,
  exp: [
    `Cada recurso só pode ter suas propriedades descritas **uma vez**. Duas entradas ~- name: stg_orders~ (no mesmo arquivo ou em arquivos diferentes) geram erro no parse; consolide-as.`,
    `• ~dbt clean~ remove ~target/~ e ~dbt_packages/~; não resolve conflitos de YAML.`,
    `• ~version: 2~ é opcional nas versões atuais.`
  ],
  doc: 'https://docs.getdbt.com/reference/model-properties'
},
{
  id: 'd3-fix-workflow', d: 'd3', type: 'order',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `A bug was found in a production model. Put the steps to develop, test, and ship the fix in order.`,
  items: [
    `Create a feature branch from the main branch`,
    `Reproduce and fix the bug in your development environment`,
    `Run ~dbt build~ on the modified model and its downstream models in development`,
    `Commit, push, and open a pull request`,
    `Let the CI job build and test the modified nodes, and get a peer review`,
    `Merge into main so the production job picks up the change`
  ],
  exp: [
    `Nunca corrija direto na branch principal. O fluxo é: branch → correção em dev → ~dbt build --select modelo+~ em dev → PR → CI (por exemplo ~dbt build --select state:modified+ --defer --state ...~) + revisão → merge → deploy.`,
    `Lembrete de Git: ~git pull~ = ~git fetch~ + ~git merge~, usado para trazer as mudanças da branch principal para a sua.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/best-practice-workflows'
},
{
  id: 'd3-fail-fast', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `In a CI job, you want dbt to stop running as soon as the first node errors or a test fails, to avoid wasting compute. Which flag should you add?`,
  options: [
    `~--warn-error~`,
    `~--fail-fast~ (~-x~)`,
    `~--full-refresh~`,
    `~--no-partial-parse~`
  ],
  answer: 1,
  exp: [
    `~--fail-fast~ (ou ~-x~, ou a variável ~DBT_FAIL_FAST=true~) interrompe a execução na primeira falha.`,
    `• ~--warn-error~ transforma warnings em erros, mas não para a execução imediatamente (~--warn-error-options~ permite escolher quais warnings).`,
    `• ~--full-refresh~ reconstrói incrementais e seeds.`,
    `• ~--no-partial-parse~ força o parse completo.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/failing-fast'
},
{
  id: 'd3-behavior-flags', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `You want to opt in early to the behavior change flag ~skip_nodes_if_on_run_start_fails~, so the whole team gets the same behavior. Where should you set it?`,
  options: [
    `In ~profiles.yml~, under the ~config:~ block`,
    `As a CLI flag on every dbt command`,
    `In the ~flags:~ dictionary in ~dbt_project.yml~`,
    `As an environment variable in each developer's shell`
  ],
  answer: 2,
  exp: [
    `Behavior change flags são definidas no dicionário ~flags:~ do ~dbt_project.yml~, para ficarem versionadas e iguais para todos. O ciclo de vida é: a flag nasce desligada (comportamento antigo) → amadurece e passa a vir ligada → o comportamento antigo é removido.`,
    `Flags globais comuns (como ~fail_fast~) também podem ir em ~flags:~, mas CLI e variáveis de ambiente têm precedência sobre o projeto (CLI > env var > ~dbt_project.yml~). O bloco ~config:~ do ~profiles.yml~ é o local antigo, de antes do dbt 1.8.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'd4-skip-log', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `Given the ~dbt build~ log below, why was ~dim_customers~ skipped even though ~stg_customers~ and its test succeeded?`,
  code: [
    {
      lang: 'log',
      text: `
    1 of 6 START sql view model staging.stg_customers ........ [RUN]
    1 of 6 OK created sql view model staging.stg_customers ... [OK in 0.41s]
    2 of 6 START sql view model staging.stg_orders ........... [RUN]
    2 of 6 ERROR creating sql view model staging.stg_orders .. [ERROR in 0.38s]
    3 of 6 START test unique_stg_customers_customer_id ....... [RUN]
    3 of 6 PASS unique_stg_customers_customer_id ............. [PASS in 0.52s]
    4 of 6 SKIP test not_null_stg_orders_order_id ............ [SKIP]
    5 of 6 SKIP relation marts.fct_orders .................... [SKIP]
    6 of 6 SKIP relation marts.dim_customers ................. [SKIP]`
    }
  ],
  options: [
    `~dim_customers~ depends, directly or indirectly, on ~stg_orders~, and dbt skips every node downstream of a node that errored.`,
    `dbt stops the entire run after the first error.`,
    `~dim_customers~ has a failing test that was evaluated earlier in the run.`,
    `The run used ~--fail-fast~, which skips all remaining nodes.`
  ],
  answer: 0,
  exp: [
    `Quando um nó falha (ERROR em modelo, ou FAIL em teste com severity ~error~), o dbt marca como SKIP **todos os nós a jusante** dele, mas continua executando os ramos independentes. Por isso o teste de ~stg_customers~ rodou.`,
    `Se fosse ~--fail-fast~, a execução inteira teria sido interrompida. Depois de corrigir, ~dbt retry~ retoma do ponto de falha (o nó com erro e os que foram pulados).`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'd4-warn-severity', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `The ~accepted_values~ test on ~stg_payments.payment_method~ fails because of 3 rows with a new method that the source team is still documenting. The business wants the downstream ~fct_revenue~ to keep being built daily, while the team is still alerted. What is the best approach?`,
  options: [
    `Add ~--fail-fast~ to the production job.`,
    `Switch the job from ~dbt build~ to ~dbt run~ followed by ~dbt test~.`,
    `Set ~severity: warn~ on that test (or tune ~warn_if~ and ~error_if~).`,
    `Add ~store_failures: true~ to that test.`
  ],
  answer: 2,
  exp: [
    `No ~dbt build~, um teste com status WARN não bloqueia os nós a jusante; um FAIL (severity ~error~) bloqueia. Com ~severity: warn~ (ou ~error_if~ alto e ~warn_if: ">0"~), o pipeline segue e o alerta continua aparecendo.`,
    `• ~--fail-fast~ piora a situação (para tudo).`,
    `• Separar run e test faz os modelos serem construídos sem a proteção dos testes.`,
    `• ~store_failures~ só grava as linhas com falha; não muda o status.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'd4-ephemeral-perf', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `~int_orders_enriched~ is materialized as ~ephemeral~ and is referenced by 15 downstream models. Runs are slow, and the compiled SQL of each downstream model repeats the same heavy CTE. What is the best optimization?`,
  options: [
    `Materialize ~int_orders_enriched~ as a table so its logic is computed once per run and reused downstream.`,
    `Increase ~threads~ in ~profiles.yml~.`,
    `Convert the 15 downstream models to ephemeral as well.`,
    `Add ~--empty~ to the production job.`
  ],
  answer: 0,
  exp: [
    `Ephemeral injeta o SQL como CTE em cada consumidor. Com 15 consumidores, a lógica pesada é recalculada 15 vezes e o SQL compilado fica enorme. Materializar como tabela calcula uma vez só.`,
    `• Mais threads paralelizam, mas não eliminam o trabalho duplicado.`,
    `• ~--empty~ constrói objetos vazios, o que não serve em produção.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/materializations/2-available-materializations'
},
{
  id: 'd4-clone-ci', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `On Snowflake, your CI job runs ~dbt build --select state:modified+ --defer --state prod-artifacts~. Modified incremental models are always built from scratch in the CI schema, which is slow and expensive. What is the recommended improvement?`,
  options: [
    `Add ~--full-refresh~ to the CI job.`,
    `Before the build, run ~dbt clone --select state:modified+,config.materialized:incremental,state:old --state prod-artifacts~.`,
    `Change the incremental models to ~table~ only in CI.`,
    `Remove ~--defer~ so CI reads the incremental models directly from production.`
  ],
  answer: 1,
  exp: [
    `Prática recomendada (*Clone incremental models*): como primeiro passo do CI, clonar (zero-copy) os incrementais modificados que já existem em produção (~state:old~). Depois o ~dbt build~ roda de forma incremental sobre o clone, em vez de reconstruir todo o histórico.`,
    `• ~--full-refresh~ faria exatamente o contrário.`,
    `• ~--defer~ resolve os refs não construídos para produção, mas não cria objetos; sem ele, os pais não modificados não seriam encontrados no schema de CI.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/clone-incremental-models'
},
{
  id: 'd4-clone-domc', d: 'd4', type: 'domc',
  topic: 'Using dbt clone',
  stem: `Which statement about ~dbt clone~ is correct?`,
  options: [
    `On platforms without zero-copy cloning, ~dbt clone~ creates views that select from the relations in the provided state.`,
    `By default, ~dbt clone~ replaces relations that already exist in the target schema.`,
    `~dbt clone~ works without any state artifacts, because it reads production relations directly.`,
    `~dbt clone~ is always cheaper than ~--defer~, because deferral copies data into the development schema.`
  ],
  answer: 0,
  exp: [
    `~dbt clone --state <artefatos>~ clona os nós selecionados a partir do estado informado para o target. Com zero-copy (Snowflake, Databricks, BigQuery), cria clones; sem esse suporte, cria *pointer views* (~select * from~ o objeto de origem).`,
    `Por padrão **não** recria relações que já existem; para isso use ~--full-refresh~. ~--defer~ não cria objetos e costuma ser mais barato. O clone cria objetos reais, o que é útil para testar em ferramentas de BI, para blue/green e para CI com incrementais.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'd5-accepted-where', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `~stg_orders~ contains 5 rows with ~status = 'pending'~ dated in 2023 and 2 rows with ~status = 'pending'~ dated in 2024. What is the result of this test?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_orders.yml',
      text: `
    models:
      - name: stg_orders
        columns:
          - name: status
            data_tests:
              - accepted_values:
                  arguments:
                    values: ['placed', 'shipped', 'completed', 'returned']
                  config:
                    severity: warn
                    where: "order_date >= '2024-01-01'"`
    }
  ],
  options: [
    `FAIL with 7 failures`,
    `WARN with 2 failures`,
    `PASS, because the severity is warn`,
    `WARN with 7 failures`
  ],
  answer: 1,
  exp: [
    `~where~ filtra os dados testados (o dbt envolve o modelo numa subconsulta com esse filtro), então só as 2 linhas de 2024 contam. Com ~severity: warn~, o ~error_if~ é ignorado e o ~warn_if~ padrão (~!= 0~) gera WARN.`,
    `Desde o dbt 1.10.5, os argumentos de testes genéricos ficam em ~arguments:~ e as configs em ~config:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/where'
},
{
  id: 'd5-singular', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `You need to verify that, for every order, the sum of ~payments.amount~ equals ~orders.amount~. No generic test covers this, and the check only applies to this pair of models. What is the most appropriate approach?`,
  options: [
    `A singular test: a ~.sql~ file in the ~tests/~ directory that selects the orders whose amounts differ.`,
    `A unit test whose ~given~ inputs come from both models in production.`,
    `A ~relationships~ test between ~payments.order_id~ and ~orders.order_id~.`,
    `A model contract on ~orders~ with a ~check~ constraint.`
  ],
  answer: 0,
  exp: [
    `Um teste singular é uma consulta SQL em ~tests/~ que retorna as **linhas com falha**; ele passa quando retorna zero linhas. É ideal para regras pontuais.`,
    `• ~relationships~ verifica integridade referencial, não somas.`,
    `• Unit tests validam lógica com dados fixos, não os dados reais.`,
    `• Uma constraint ~check~ só olha a linha da própria tabela e nem é suportada em todas as plataformas.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'd5-custom-args', d: 'd5', type: 'mc',
  codeOptions: true,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Given this custom generic test, which YAML correctly applies it to the ~discount_pct~ column in dbt Core 1.11?`,
  code: [
    {
      lang: 'sql',
      label: 'tests/generic/is_within_range.sql',
      text: `
    {% test is_within_range(model, column_name, min_value, max_value) %}
    select *
    from {{ model }}
    where {{ column_name }} < {{ min_value }}
       or {{ column_name }} > {{ max_value }}
    {% endtest %}`
    }
  ],
  options: [
    `
    - name: discount_pct
      data_tests:
        - is_within_range:
            arguments:
              min_value: 0
              max_value: 100`,
    `
    - name: discount_pct
      data_tests:
        - is_within_range(0, 100)`,
    `
    - name: discount_pct
      data_tests:
        - is_within_range:
            config:
              min_value: 0
              max_value: 100`,
    `
    - name: discount_pct
      data_tests:
        - is_within_range: [0, 100]`
  ],
  answer: 0,
  exp: [
    `Testes genéricos customizados são blocos ~{% test %}~ (em ~tests/generic/~ ou ~macros/~) que recebem ~model~ e ~column_name~ automaticamente. Os demais parâmetros são passados como argumentos nomeados.`,
    `Nas versões atuais, os argumentos vão em ~arguments:~ e as configs (~severity~, ~where~...) em ~config:~. Colocar argumentos em ~config:~ é o erro clássico: eles não chegam ao teste.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-custom-config', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `You wrote a custom generic test, ~{% test has_recent_rows(model, column_name, days) %}~. You want every use of this test to default to ~warn~, while individual uses can still override it in YAML. What should you do?`,
  options: [
    `Add ~{{ config(severity='warn') }}~ inside the ~{% test %}~ block.`,
    `Set ~+severity: warn~ for all data tests in ~dbt_project.yml~.`,
    `Add ~severity~ as an extra argument in the test's signature.`,
    `Run the project with ~--warn-error~.`
  ],
  answer: 0,
  exp: [
    `Um ~config()~ dentro do bloco do teste define o padrão para todos os usos daquele teste genérico. As propriedades no YAML de um uso específico sobrescrevem esse padrão (precedência: YAML > ~config()~ do teste > ~dbt_project.yml~).`,
    `• ~+severity~ no ~dbt_project.yml~ afetaria todos os testes do projeto.`,
    `• ~--warn-error~ faz o contrário: promove warnings a erros.`
  ],
  doc: 'https://docs.getdbt.com/reference/data-test-configs'
},
{
  id: 'd5-source-test', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `You want to verify that ~id~ is unique and not null in the raw table ~shop.orders~ before any model uses it, and to run only those checks. Which approach is correct?`,
  options: [
    `Add ~data_tests~ under the ~id~ column of the ~orders~ table in the source YAML, then run ~dbt test --select source:shop.orders~.`,
    `Add the tests to the ~stg_orders~ model only, because sources cannot have tests.`,
    `Write a unit test that uses the source as the model under test.`,
    `Configure source ~freshness~ with ~error_after~ to catch nulls.`
  ],
  answer: 0,
  exp: [
    `Sources aceitam data tests no YAML, assim como modelos. Testar já na source detecta problemas o mais cedo possível. Seleção: ~dbt test --select source:shop~ (a source inteira) ou ~source:shop.orders~ (uma tabela).`,
    `• Unit tests só testam modelos SQL.`,
    `• Freshness mede atraso de carga, não nulos.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources#testing-and-documenting-sources'
},
{
  id: 'd5-unit-parent', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `In a fresh CI schema, ~dbt test --select test_type:unit~ fails because the relation for ~stg_customers~, a direct parent of the model under test, does not exist. What is the most cost-effective fix?`,
  options: [
    `Remove ~stg_customers~ from the unit test's ~given~ inputs.`,
    `Run a full production build in the CI schema before every unit test run.`,
    `First build the direct parents with ~--empty~ (for example ~dbt run --select stg_customers --empty~), then run the unit tests.`,
    `Convert the unit test into a singular data test.`
  ],
  answer: 2,
  exp: [
    `Unit tests precisam que os pais diretos existam no warehouse (o dbt usa o esquema deles para montar os dados de teste), mas não precisam dos dados. Construir com ~--empty~ resolve sem custo de leitura.`,
    `• Todo ~ref~ ou ~source~ usado pelo modelo precisa aparecer como ~input~ em ~given~; removê-lo gera erro.`,
    `• Um build completo funciona, mas é caro.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-unit-domc', d: 'd5', type: 'domc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about dbt unit tests is correct?`,
  options: [
    `In ~dbt build~, a model's unit tests run before the model is materialized.`,
    `Unit tests can be written for Python models as well as SQL models.`,
    `Each ~given~ input must list every column of the upstream model.`,
    `Unit tests are SQL files placed in the ~tests/~ directory.`
  ],
  answer: 0,
  exp: [
    `Unit tests (dbt 1.8+) são definidos em YAML (~unit_tests:~ em arquivos de ~models/~), e só para modelos **SQL** do projeto atual. Em ~given~ basta informar as colunas relevantes para o teste (formatos ~dict~, ~csv~ ou ~sql~; inputs ephemeral exigem ~sql~).`,
    `No ~dbt build~, os unit tests rodam antes da materialização; se falharem, o modelo não é construído.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-unit-incremental', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `You want to unit test the incremental branch (~{% if is_incremental() %}~) of ~fct_events~. What must the unit test include?`,
  options: [
    `~overrides: {macros: {is_incremental: true}}~, plus a ~given~ input ~this~ with the rows already in the target table`,
    `~config: {materialized: table}~, so dbt rebuilds the model during the test`,
    `The ~--full-refresh~ flag when running ~dbt test~`,
    `A ~given~ input ~ref('fct_events')~ containing the expected final table`
  ],
  answer: 0,
  exp: [
    `Para testar o modo incremental, sobrescreva o macro ~is_incremental~ para ~true~ e forneça ~input: this~ simulando o conteúdo atual da tabela.`,
    `O ~expect~ deve conter as linhas que seriam inseridas ou mescladas (o resultado do SELECT), não a tabela final depois do merge. Com ~overrides~ também é possível sobrescrever ~vars~ e ~env_vars~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-where-errorif', d: 'd5', type: 'multi',
  choose: 2,
  topic: 'Implementing various testing steps in the workflow',
  stem: `~fct_events~ has 2 billion rows. You want its ~not_null~ test on ~event_id~ to (1) scan only the last 3 days of data and (2) fail the pipeline only if more than 100 rows are null. Which two configs should you set? (Choose two.)`,
  options: [
    `~where: "event_date >= dateadd('day', -3, current_date)"~`,
    `~error_if: ">100"~`,
    `~limit: 100~`,
    `~store_failures: true~`,
    `~fail_calc: "count(*) > 100"~`
  ],
  answers: [0, 1],
  exp: [
    `~where~ restringe os dados avaliados; é o recurso indicado para testar só a parte nova de modelos grandes ou incrementais. ~error_if: ">100"~ faz o teste falhar só acima de 100 linhas (até lá, o ~warn_if~ padrão ~!= 0~ gera WARN).`,
    `• ~limit~ só limita quantas linhas com falha são retornadas; não reduz o scan.`,
    `• ~store_failures~ grava as falhas numa tabela (schema com sufixo ~dbt_test__audit~).`,
    `• ~fail_calc~ define *como* calcular o número de falhas (padrão ~count(*)~), não o limite.`
  ],
  doc: 'https://docs.getdbt.com/reference/data-test-configs'
},
{
  id: 'd5-unit-prod', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `Unit tests run in development and CI. Following dbt's recommendation, you don't want them to run in the production job, which uses ~dbt build~. What should you do?`,
  options: [
    `Delete the unit tests from the main branch after CI passes.`,
    `Add ~--exclude-resource-type unit_test~ to the production ~dbt build~ command.`,
    `Set ~severity: warn~ on all unit tests.`,
    `Run production with ~dbt run~ only and skip all tests.`
  ],
  answer: 1,
  exp: [
    `Unit tests usam dados fixos, então rodá-los em produção só gasta tempo. Use ~dbt build --exclude-resource-type unit_test~ no job de produção (ou a variável de ambiente equivalente).`,
    `Pular todos os testes em produção removeria a proteção dos data tests, que validam os dados reais.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd6-exposure-build', d: 'd6', type: 'mc',
  topic: 'Implementing dbt exposures',
  stem: `The ~weekly_revenue~ dashboard is declared as an exposure. Before a board meeting, you want to build and test every node the dashboard depends on, and nothing else. Which command should you run?`,
  options: [
    `~dbt build --select exposure:weekly_revenue+~`,
    `~dbt build --select +exposure:weekly_revenue~`,
    `~dbt run --select weekly_revenue~`,
    `~dbt source freshness --select exposure:weekly_revenue~`
  ],
  answer: 1,
  exp: [
    `Exposures são nós que o dbt não executa; ficam no fim do DAG para documentar quem consome os dados. ~+exposure:nome~ seleciona todos os ancestrais (modelos, seeds, snapshots e, no ~build~, os testes deles).`,
    `• ~exposure:x+~ não pega os pais (e exposures não têm filhos).`,
    `• ~dbt run --select weekly_revenue~ procuraria um modelo com esse nome.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'd6-exposure-type', d: 'd6', type: 'domc',
  topic: 'Implementing dbt exposures',
  stem: `Which value is a valid ~type~ for a dbt exposure?`,
  options: [
    `~ml~`,
    `~report~`,
    `~bi_tool~`,
    `~dataset~`
  ],
  answer: 0,
  exp: [
    `Os tipos válidos são ~dashboard~, ~notebook~, ~analysis~, ~ml~ e ~application~.`,
    `Outras propriedades: ~name~ (sem espaços), ~label~, ~owner~ (~name~/~email~), ~depends_on~ (~ref~, ~source~, ~metric~), ~maturity~ (~high~/~medium~/~low~), ~url~, ~description~ e ~config~ (~tags~, ~meta~, ~enabled~).`
  ],
  doc: 'https://docs.getdbt.com/reference/exposure-properties'
},
{
  id: 'd6-freshness-result', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `The latest ~_etl_loaded_at~ in ~orders~ is 15 hours old, and ~countries~ was last loaded 30 days ago. What does ~dbt source freshness~ report?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/shop/_shop__sources.yml',
      text: `
    sources:
      - name: shop
        config:
          freshness:
            warn_after: {count: 12, period: hour}
            error_after: {count: 24, period: hour}
          loaded_at_field: _etl_loaded_at
        tables:
          - name: orders
          - name: countries
            config:
              freshness: null`
    }
  ],
  options: [
    `~orders~: WARN; ~countries~: not checked`,
    `~orders~: ERROR; ~countries~: ERROR`,
    `~orders~: PASS; ~countries~: WARN`,
    `~orders~: WARN; ~countries~: ERROR`
  ],
  answer: 0,
  exp: [
    `As configs de freshness da source valem para todas as tabelas, e cada tabela pode sobrescrevê-las. 15 h passa de 12 h (warn) mas não de 24 h (error), então ~orders~ fica em WARN. ~freshness: null~ desliga a verificação de ~countries~.`,
    `Períodos válidos: ~minute~, ~hour~, ~day~. O resultado vai para ~target/sources.json~, usado pelo seletor ~source_status:fresher~. ~dbt build~ **não** roda freshness; é um comando separado.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'd6-freshness-filter', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `~raw.events~ holds 3 TB, and computing ~max(_loaded_at)~ for freshness scans the whole table every run. How can you reduce the cost of the freshness check without affecting the models that read this source?`,
  options: [
    `Add a ~filter~ to the table's freshness config, for example ~filter: "_loaded_at >= dateadd('day', -2, current_date)"~.`,
    `Add a ~where~ config to the table's freshness block.`,
    `Change ~period~ from ~hour~ to ~day~.`,
    `Add ~limit: 1000~ to the source.`
  ],
  answer: 0,
  exp: [
    `~filter~ adiciona um WHERE **apenas** na consulta de freshness, o que é ótimo para tabelas grandes ou particionadas, e não afeta mais nada.`,
    `• ~where~ e ~limit~ são configs de data tests, não de freshness.`,
    `• Mudar ~period~ só muda a unidade dos limites.`,
    `Sem ~loaded_at_field~, alguns adapters calculam a freshness pelos metadados do warehouse.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'd7-slim-ci', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `Your CI job has the production ~manifest.json~ in ~./prod-artifacts~. You want to build and test only the models changed in the PR and everything downstream, while unmodified upstream models are read from production instead of being rebuilt. Which command should you run?`,
  options: [
    `~dbt build --select state:modified+ --defer --state ./prod-artifacts~`,
    `~dbt build --select state:modified+~`,
    `~dbt build --select +state:modified --state ./prod-artifacts~`,
    `~dbt build --select result:error+ --defer --state ./prod-artifacts~`
  ],
  answer: 0,
  exp: [
    `~state:modified+~ compara o projeto atual com o manifest de ~--state~ e seleciona os nós novos ou modificados mais os descendentes. ~--defer~ faz os ~ref()~ de pais não selecionados apontarem para os objetos de produção descritos no manifest.`,
    `• Sem ~--state~, o método ~state~ não funciona.`,
    `• ~+state:modified~ reconstruiria todos os ancestrais.`,
    `• ~result:~ usa ~run_results.json~, não mudanças de código.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/state-selection'
},
{
  id: 'd7-state-match', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Match each change to the state selector that detects it.`,
  left: [
    `A model's SQL logic changed`,
    `A model's materialization changed from view to table`,
    `A model's alias changed`,
    `The data_type of a column in a contracted model changed`,
    `A model exists in the project but not in the comparison manifest`
  ],
  right: [
    `state:modified.body`,
    `state:modified.configs`,
    `state:modified.relation`,
    `state:modified.contract`,
    `state:new`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `Subseletores de ~state:modified~:`,
    `• ~.body~: o SQL ou conteúdo do nó.`,
    `• ~.configs~: configs, exceto database/schema/alias/tags/meta.`,
    `• ~.relation~: database, schema ou alias.`,
    `• ~.persisted_descriptions~: descrições, quando ~persist_docs~ está ativo.`,
    `• ~.macros~: macros usadas, direta ou indiretamente.`,
    `• ~.contract~: nome ou tipo das colunas do contrato; mudanças que quebram o contrato geram erro.`,
    `~state:new~ = o nó não existe no manifest de comparação; ~state:old~ = existe. Mudanças só em ~tags~ ou ~meta~ não contam como modificação.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'd7-retry', d: 'd7', type: 'domc',
  topic: 'Using dbt retry',
  stem: `Which statement about ~dbt retry~ is correct?`,
  options: [
    `If the previous command completed successfully, ~dbt retry~ runs nothing.`,
    `~dbt retry~ re-runs every node from the previous command, including those that succeeded.`,
    `~dbt retry~ reads the production ~manifest.json~ to decide which nodes to run.`,
    `~dbt retry~ only works after ~dbt run~; it does not support ~dbt build~ or ~dbt test~.`
  ],
  answer: 0,
  exp: [
    `~dbt retry~ lê o ~run_results.json~ da execução anterior e retoma do ponto de falha: os nós com erro e os que foram pulados por causa deles. O que já passou não roda de novo. Se não houve falha, termina sem fazer nada.`,
    `Suporta ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~compile~, ~clone~, ~docs generate~ e ~run-operation~. Se nenhum nó chegou a executar (por exemplo, falha de conexão logo no início), não há de onde retomar.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'd7-result-fail', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `Last night's ~dbt build~ artifacts are in ~./last-run~, and several tests failed. After fixing the data, you want to rebuild the models those tests check and re-run the failed tests. Which command should you run?`,
  options: [
    `~dbt build --select result:fail+ --state ./last-run~`,
    `~dbt test --select result:error --state ./last-run~`,
    `~dbt build --select 1+result:fail --state ./last-run~`,
    `~dbt build --select state:modified --state ./last-run~`
  ],
  answer: 2,
  exp: [
    `~result:fail~ seleciona os testes que falharam (com ~--state~ apontando para o ~run_results.json~). Como testes não têm descendentes, ~result:fail+~ retorna só os testes; ~1+result:fail~ inclui os modelos testados (pais de 1º grau).`,
    `• ~result:error~ pega nós com erro (como modelos), não testes que falharam.`,
    `• ~state:modified~ compara código, não resultados.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#result'
}
];
