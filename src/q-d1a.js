/* Domain 1 · Developing and optimizing dbt models · bank expansion A (26) */
window.DBT_Q.push(
{
  id: 'd1-src-count', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `A legacy query reads from ~raw.stripe.payments~, ~raw.stripe.refunds~, ~raw.shopify.orders~, ~raw.shopify.customers~, and ~finance_db.public.fx_rates~. When you convert it to dbt, how many sources and tables should you declare?`,
  options: [
    `3 sources with 5 tables`,
    `2 sources with 5 tables`,
    `5 sources with 5 tables`,
    `1 source with 5 tables`
  ],
  answer: 0,
  exp: [
    `Cada source corresponde a uma combinação de **database + schema**. Aqui existem três: ~raw.stripe~, ~raw.shopify~ e ~finance_db.public~. As tabelas ficam dentro de cada source, totalizando 5.`,
    `A source ~finance_db.public~ precisa de ~database: finance_db~ e ~schema: public~ (ou de um nome de source igual ao schema).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'd1-src-database', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `A source is declared with ~name: hubspot~ and no ~database~ or ~schema~ properties. When dbt resolves ~{{ source('hubspot', 'contacts') }}~, which database and schema does it use?`,
  options: [
    `The database of the active target in ~profiles.yml~, and a schema named ~hubspot~`,
    `A database named ~hubspot~ and the target's schema`,
    `The database and schema of the model that calls ~source()~`,
    `dbt raises an error because ~database~ and ~schema~ are required`
  ],
  answer: 0,
  exp: [
    `Valores padrão de uma source: ~database~ = database do target ativo; ~schema~ = **nome da source**; ~identifier~ = nome da tabela. Por isso ~source('hubspot', 'contacts')~ vira ~<database_do_target>.hubspot.contacts~.`,
    `Nenhuma dessas propriedades é obrigatória; você só as declara quando o objeto físico foge desse padrão.`
  ],
  doc: 'https://docs.getdbt.com/reference/source-properties'
},
{
  id: 'd1-src-ls', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `The Stripe team will rename columns in ~raw.stripe.payments~ next week. You need a list of every dbt node that depends on that table, directly or indirectly. Which command gives you that list?`,
  options: [
    `~dbt ls --select +source:stripe.payments~`,
    `~dbt ls --select source:stripe.payments+~`,
    `~dbt ls --select stripe.payments~`,
    `~dbt source freshness --select source:stripe.payments~`
  ],
  answer: 1,
  exp: [
    `~source:stripe.payments+~ seleciona a tabela da source e **todos os descendentes** dela. ~dbt ls~ (ou ~dbt list~) só lista os nós, sem executar nada, o que é ideal para avaliar impacto.`,
    `• O ~+~ à esquerda seleciona ancestrais, e sources não têm ancestrais.`,
    `• Sem o método ~source:~ e sem o ~+~, não há seleção de descendentes.`,
    `• ~source freshness~ mede atraso de carga, não dependências.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#source'
},
{
  id: 'd1-src-why', d: 'd1', type: 'multi', choose: 2,
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Which two benefits do you get from replacing hard-coded raw table names with ~{{ source() }}~? (Choose two.)`,
  options: [
    `Raw tables appear as nodes in the DAG and documentation, so lineage from raw data to marts is visible.`,
    `You can define data tests and freshness checks on the raw tables.`,
    `dbt caches the raw data locally, which makes runs faster.`,
    `dbt automatically deduplicates rows read from the raw table.`,
    `The raw table becomes an incremental model managed by dbt.`
  ],
  answers: [0, 1],
  exp: [
    `Com ~source()~, o dbt passa a conhecer a dependência: as tabelas brutas viram nós no DAG e na documentação, e você pode declarar data tests e ~freshness~ nelas. O nome físico também fica num único lugar (o YAML).`,
    `O dbt não armazena dados localmente, não deduplica nada e não gerencia a tabela bruta. Ele só gera o SQL que roda no warehouse.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'd1-mat-default', d: 'd1', type: 'fill',
  topic: 'Understanding core dbt materializations',
  stem: `Complete the blank. If no ~materialized~ config is set anywhere for a SQL model, dbt builds it as a ______.`,
  accept: ['view'],
  exp: [
    `O padrão é ~view~: barata de construir e sempre atualizada, mas recalculada a cada consulta. Projetos costumam configurar ~+materialized~ por pasta no ~dbt_project.yml~ (por exemplo, views em staging e tables em marts).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'd1-mat-match', d: 'd1', type: 'match',
  topic: 'Understanding core dbt materializations',
  stem: `Match each materialization to its behavior.`,
  left: [`~view~`, `~table~`, `~incremental~`, `~ephemeral~`, `~materialized_view~`],
  right: [
    `Stores only the query; it runs every time the object is queried`,
    `Rebuilt from scratch on every run`,
    `After the first build, inserts or updates only new or changed rows`,
    `Not built in the warehouse; injected as a CTE into dependent models`,
    `Warehouse-managed object that stores and refreshes results`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `• **view**: só guarda a consulta; custo zero no build, custo em toda leitura.`,
    `• **table**: ~create table as~ completo a cada execução.`,
    `• **incremental**: processa só o que mudou após o primeiro build (usa ~is_incremental()~).`,
    `• **ephemeral**: vira CTE nos consumidores; não existe no banco.`,
    `• **materialized_view**: a plataforma mantém o resultado atualizado; o dbt reage a mudanças de configuração com ~on_configuration_change~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'd1-mat-mv', d: 'd1', type: 'mc',
  topic: 'Understanding core dbt materializations',
  stem: `A model is materialized as ~materialized_view~. If someone changes one of its configurations, you want dbt to raise an error instead of applying the change automatically. Which config should you set?`,
  options: [
    `~on_configuration_change: fail~`,
    `~on_configuration_change: continue~`,
    `~on_configuration_change: apply~`,
    `~full_refresh: false~`
  ],
  answer: 0,
  exp: [
    `~on_configuration_change~ define o que acontece quando o dbt detecta mudança de configuração numa materialized view: ~apply~ (padrão) aplica a mudança; ~continue~ segue sem aplicar e emite um warning; ~fail~ interrompe com erro.`,
    `~full_refresh: false~ só impede reconstruções completas; não controla a reação a mudanças de configuração.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations#materialized-view'
},
{
  id: 'd1-mat-ephemeral-domc', d: 'd1', type: 'domc',
  topic: 'Understanding core dbt materializations',
  stem: `Which statement about ephemeral models is correct?`,
  options: [
    `Ephemeral models cannot be referenced by Python models.`,
    `During a run, ephemeral models are created as temporary views and dropped at the end.`,
    `Ephemeral models support enforced model contracts.`,
    `After a run, you can query an ephemeral model in the warehouse to debug it.`
  ],
  answer: 0,
  exp: [
    `Modelos Python não podem referenciar modelos ephemeral, porque não existe objeto no banco para ler. Ephemeral também não suporta contratos e não pode ter ~access: public~.`,
    `Eles não viram views temporárias: o SQL é injetado como CTE no modelo consumidor. Por isso não há o que consultar depois da execução.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations#ephemeral'
},
{
  id: 'd1-dry-loop', d: 'd1', type: 'mc',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `A model pivots payments with six nearly identical lines like ~sum(case when payment_method = 'coupon' then amount end) as coupon_amount~, one per payment method. What is the DRY way to write this?`,
  options: [
    `Use a Jinja ~{% for %}~ loop over a list of payment methods to generate each pivoted column.`,
    `Create one ephemeral model per payment method and join them together.`,
    `Create six seeds, one per payment method.`,
    `Rewrite the model in Python, because SQL cannot pivot data.`
  ],
  answer: 0,
  exp: [
    `Com ~{% set methods = [...] %}~ e ~{% for m in methods %}~, uma única linha gera todas as colunas. Para acrescentar um método, basta incluí-lo na lista (ou buscá-lo dinamicamente com ~dbt_utils.get_column_values~).`,
    `Cuidado com a vírgula da última iteração: use ~{% if not loop.last %},{% endif %}~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/jinja-macros'
},
{
  id: 'd1-dry-surrogate', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `Eight models build surrogate keys with hand-written ~md5(concat(...))~ expressions, and each one handles NULLs differently. What is the best way to standardize this?`,
  options: [
    `Use ~{{ dbt_utils.generate_surrogate_key(['order_id', 'line_number']) }}~ from the dbt_utils package.`,
    `Add a ~unique~ test to each surrogate key and leave the expressions as they are.`,
    `Use ~row_number()~ as the surrogate key in every model.`,
    `Configure ~unique_key~ on all eight models.`
  ],
  answer: 0,
  exp: [
    `~dbt_utils.generate_surrogate_key~ padroniza a geração (trata NULLs e concatena de forma consistente em cada adapter). Reaproveitar macros testadas de pacotes é o caminho DRY.`,
    `• Um teste só detectaria problemas; não padroniza nada.`,
    `• ~row_number()~ não é estável entre execuções.`,
    `• ~unique_key~ é config de incrementais, não gera chave.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd1-dry-endmacro', d: 'd1', type: 'fill',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Complete the macro so it compiles. What keyword goes in the blank?`,
  code: [{ lang: 'sql', label: 'macros/cents_to_dollars.sql', text: `
    {% macro cents_to_dollars(column_name, scale=2) %}
        round({{ column_name }} / 100.0, {{ scale }})
    {% ______ %}` }],
  accept: ['endmacro'],
  exp: [
    `Macros ficam entre ~{% macro nome(args) %}~ e ~{% endmacro %}~, em arquivos ~.sql~ dentro de ~macros/~. Sem o fechamento, o dbt acusa *Reached EOF without finding a close tag for macro*.`,
    `Argumentos podem ter valor padrão (~scale=2~), e a chamada fica ~{{ cents_to_dollars('amount_cents') }}~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/jinja-macros'
},
{
  id: 'd1-dry-var', d: 'd1', type: 'mc',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Fifteen models filter on the same start date. The nightly job should use ~2020-01-01~, but a one-off backfill must use ~2024-06-01~ without any code change. What should you do?`,
  options: [
    `Define ~start_date~ under ~vars:~ in ~dbt_project.yml~, use ~{{ var('start_date') }}~ in the models, and override it with ~--vars '{"start_date": "2024-06-01"}'~.`,
    `Create a macro that returns the date and edit it before each backfill.`,
    `Store the date in a seed and join the seed in all fifteen models.`,
    `Hard-code the date in each model and use find-and-replace before the backfill.`
  ],
  answer: 0,
  exp: [
    `~var()~ centraliza o valor (DRY), e o flag ~--vars~ na linha de comando tem precedência sobre ~vars:~ do ~dbt_project.yml~, sem mudar código. Também é possível dar um padrão na chamada: ~{{ var('start_date', '2020-01-01') }}~.`,
    `As outras opções exigem editar código ou acrescentam joins desnecessários.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/project-variables'
},
{
  id: 'd1-cmd-run-build', d: 'd1', type: 'domc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which statement correctly compares ~dbt run~ and ~dbt build~?`,
  options: [
    `~dbt run~ only executes models; ~dbt build~ also runs tests, seeds, and snapshots, in DAG order.`,
    `~dbt run~ also executes the data tests attached to the selected models.`,
    `~dbt build~ skips seeds, because seeds are only loaded by ~dbt seed~.`,
    `~dbt build~ runs every model first and then runs every test at the end.`
  ],
  answer: 0,
  exp: [
    `~dbt build~ junta ~run~, ~test~ (data e unit tests), ~seed~ e ~snapshot~ numa única execução, respeitando o DAG: cada nó é testado logo depois de construído, e falhas pulam os dependentes.`,
    `~dbt run~ só materializa modelos; testes exigem ~dbt test~ ou ~dbt build~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'd1-cmd-docs', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `You want the documentation site to show column data types read from the warehouse, then browse the site locally. Which sequence should you run?`,
  options: [
    `~dbt docs generate~, then ~dbt docs serve~`,
    `~dbt docs serve~ only; it queries the warehouse automatically`,
    `~dbt compile~, then open ~target/manifest.json~ in the browser`,
    `~dbt show --select my_model~ for each model`
  ],
  answer: 0,
  exp: [
    `~dbt docs generate~ compila o projeto e consulta o warehouse para criar o ~catalog.json~ (tipos, estatísticas); com o ~manifest.json~, ele alimenta o site. ~dbt docs serve~ apenas serve esses arquivos localmente; não gera nada.`,
    `~--no-compile~ pula a etapa de compilação do ~docs generate~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/cmd-docs'
},
{
  id: 'd1-cmd-seed-types', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `~seeds/zip_codes.csv~ contains values like ~01234~, but after ~dbt seed~ the warehouse column is numeric and the leading zeros are gone. What is the correct fix?`,
  options: [
    `Set ~column_types: {zip_code: varchar(10)}~ for the seed, then run ~dbt seed --full-refresh~.`,
    `Set ~quote_columns: true~ for the seed.`,
    `Set ~delimiter: ";"~ for the seed.`,
    `Cast ~zip_code~ to text in every downstream model.`
  ],
  answer: 0,
  exp: [
    `Por padrão o dbt infere os tipos das colunas do CSV. ~column_types~ força o tipo de colunas específicas. Como a tabela já existe com o tipo errado, use ~--full-refresh~ para recriá-la.`,
    `• ~quote_columns~ trata as aspas dos **nomes** das colunas.`,
    `• ~delimiter~ muda o separador.`,
    `• Converter depois não recupera os zeros já perdidos.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/column_types'
},
{
  id: 'd1-cmd-show-inline', d: 'd1', type: 'fill',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the command to run an ad hoc query against a model and preview the result, without creating a model file: ~dbt show --______ "select count(*) from {{ ref('fct_orders') }}"~`,
  accept: ['inline'],
  exp: [
    `~dbt show --inline "..."~ compila o SQL informado (inclusive com ~ref~ e macros), executa-o no warehouse e mostra o resultado. ~--limit~ controla quantas linhas aparecem (padrão 5).`,
    `~dbt compile --inline~ também existe, mas só renderiza o SQL, sem executar.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/show'
},
{
  id: 'd1-cmd-intersection', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `You want to run only the incremental models that are also tagged ~nightly~. Which selection should you use?`,
  options: [
    `~--select "tag:nightly config.materialized:incremental"~`,
    `~--select "tag:nightly,config.materialized:incremental"~`,
    `~--select "tag:nightly" --exclude "config.materialized:incremental"~`,
    `~--select "tag:nightly+config.materialized:incremental"~`
  ],
  answer: 1,
  exp: [
    `Na sintaxe de seleção, a **vírgula** faz interseção (precisa atender aos dois critérios) e o **espaço** faz união (atende a qualquer um).`,
    `• A versão com espaço pegaria todos os modelos com a tag e todos os incrementais.`,
    `• O ~--exclude~ removeria justamente os incrementais.`,
    `• O ~+~ é operador de grafo, não de conjunto.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/set-operators'
},
{
  id: 'd1-cmd-selector-match', d: 'd1', type: 'match',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Match each selector to the nodes it selects.`,
  left: [`~tag:finance~`, `~path:models/staging~`, `~config.materialized:incremental~`, `~2+fct_orders~`, `~fct_orders+~`],
  right: [
    `Every node tagged finance`,
    `Every node inside the models/staging directory`,
    `Every model configured as incremental`,
    `fct_orders, its parents, and its grandparents`,
    `fct_orders and all of its descendants`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `Métodos (~tag:~, ~path:~, ~config.~, ~source:~, ~state:~ etc.) filtram por propriedades do nó. Operadores de grafo (~+~ e ~n+~) expandem para ancestrais ou descendentes: ~2+~ limita a dois graus acima; ~+~ à direita pega todos os descendentes.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods'
},
{
  id: 'd1-dag-naming', d: 'd1', type: 'mc',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `Following dbt's recommended naming conventions, what should the staging model for the ~payments~ table from the ~stripe~ source be called?`,
  options: [
    `~stg_stripe__payments~`,
    `~stripe_payments_stg~`,
    `~stg_payments_stripe~`,
    `~stg__stripe_payment~`
  ],
  answer: 0,
  exp: [
    `Convenção do guia de estrutura: ~stg_[source]__[entity]s~, com prefixo ~stg_~, nome da source, **dois underscores** e a entidade no plural. Fica fácil ver a origem e ordenar os arquivos.`,
    `Intermediários seguem ~int_[entity]s_[verb]s~ (ex.: ~int_payments_pivoted_to_orders~); marts usam ~fct_~ e ~dim_~.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/2-staging'
},
{
  id: 'd1-dag-layers', d: 'd1', type: 'order',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `Put the layers of a well-structured dbt DAG in order, from raw data to consumption.`,
  items: [
    `Sources declared in YAML`,
    `Staging models (one per source table)`,
    `Intermediate models (purpose-built transformations)`,
    `Marts (fct_ and dim_ models)`,
    `Exposures (dashboards, ML models, apps)`
  ],
  exp: [
    `O fluxo recomendado vai da esquerda para a direita, sem voltar: sources → staging (limpeza 1:1) → intermediate (lógica reutilizável) → marts (entidades de negócio) → exposures (quem consome).`,
    `Linhas que pulam camadas ou voltam no DAG são sinais de problema.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview'
},
{
  id: 'd1-dag-rejoin', d: 'd1', type: 'mc',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `A DAG audit shows that ~fct_orders~ reads from both ~stg_orders~ and ~int_orders_enriched~, and ~int_orders_enriched~ itself reads from ~stg_orders~. What is the recommended fix?`,
  options: [
    `Bring the columns ~fct_orders~ needs forward through ~int_orders_enriched~, and remove the direct join to ~stg_orders~.`,
    `Materialize ~stg_orders~ as ephemeral.`,
    `Add a ~relationships~ test between ~fct_orders~ and ~stg_orders~.`,
    `Copy the logic of ~int_orders_enriched~ into ~fct_orders~.`
  ],
  answer: 0,
  exp: [
    `Esse padrão (*rejoining of upstream concepts*) cria dependências redundantes e confunde o DAG. Se ~int_orders_enriched~ já parte de ~stg_orders~, leve adiante as colunas necessárias e deixe ~fct_orders~ depender só do intermediário.`,
    `Mudar a materialização, adicionar testes ou duplicar lógica não resolve a estrutura.`
  ],
  doc: 'https://docs.getdbt.com/blog/essential-dbt-project-checklist'
},
{
  id: 'd1-dag-staging-domc', d: 'd1', type: 'domc',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `Which transformation belongs in a staging model?`,
  options: [
    `Renaming columns and casting them to the correct data types`,
    `Joining orders to customers to add customer attributes`,
    `Aggregating revenue by month`,
    `Combining Stripe and PayPal payments into a single finance table`
  ],
  answer: 0,
  exp: [
    `Staging é a camada de limpeza 1:1 com a source: renomear, converter tipos, cálculos simples (centavos para reais) e categorizações com ~case when~. Joins, agregações e combinações de várias fontes ficam em intermediate ou marts.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/2-staging'
},
{
  id: 'd1-proj-plus', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `In ~dbt_project.yml~, why are configs such as ~+materialized~ and ~+schema~ written with a ~+~ prefix?`,
  options: [
    `The ~+~ marks the key as a config instead of a folder (resource path), which avoids ambiguity when a folder has the same name as a config.`,
    `The ~+~ appends the value to inherited values instead of replacing them.`,
    `The ~+~ makes the config apply only to models created after the change.`,
    `The ~+~ is required on every key, including folder names.`
  ],
  answer: 0,
  exp: [
    `No ~dbt_project.yml~, chaves aninhadas sob ~models:~ podem ser pastas ou configs. O ~+~ deixa claro que é config. É recomendado sempre e obrigatório em alguns casos (por exemplo, ~+grants~ e configs com valor de dicionário).`,
    `Não confunda com o ~+~ dentro de ~grants~ (~'+select'~), que significa "adicionar" em vez de substituir.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/plus-prefix'
},
{
  id: 'd1-proj-hooks', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `After every ~dbt run~ or ~dbt build~, you need to execute ~grant usage on schema analytics to role reporter~ exactly once. Where should you configure this?`,
  options: [
    `As an ~on-run-end~ hook in ~dbt_project.yml~`,
    `As a ~post-hook~ on every model`,
    `As a ~pre-hook~ on the first model of the DAG`,
    `In a seed that runs before the models`
  ],
  answer: 0,
  exp: [
    `~on-run-start~ e ~on-run-end~ rodam **uma vez** por invocação, antes ou depois de todos os nós. ~pre-hook~ e ~post-hook~ rodam **para cada** modelo, seed ou snapshot configurado.`,
    `Para privilégios em objetos (select em tabelas e views), prefira a config ~grants~.`
  ],
  doc: 'https://docs.getdbt.com/reference/project-configs/on-run-start-on-run-end'
},
{
  id: 'd1-proj-alias', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `The model file is ~models/marts/fct_orders_rebuild.sql~, but the table in the warehouse must be named ~fct_orders~. Which approach is correct, and how do downstream models reference it?`,
  options: [
    `Set ~alias: fct_orders~; downstream models still use ~ref('fct_orders_rebuild')~.`,
    `Set ~alias: fct_orders~; downstream models must switch to ~ref('fct_orders')~.`,
    `Set ~schema: fct_orders~; downstream models keep the same ref.`,
    `Set ~identifier: fct_orders~ on the model.`
  ],
  answer: 0,
  exp: [
    `~alias~ muda só o nome do objeto no banco (o macro ~generate_alias_name~ usa esse valor). O nome do **nó** continua sendo o nome do arquivo, então o ~ref()~ usa ~fct_orders_rebuild~.`,
    `• ~schema~ muda o schema, não o nome do objeto.`,
    `• ~identifier~ é propriedade de tabelas de sources, não de modelos.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/alias'
},
{
  id: 'd1-proj-secret', d: 'd1', type: 'mc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `The warehouse password must come from an environment variable and must never appear in dbt logs or artifacts. How should ~profiles.yml~ reference it?`,
  options: [
    `~password: "{{ env_var('DBT_ENV_SECRET_PASSWORD') }}"~`,
    `~password: "{{ var('password') }}"~, passing ~--vars~ at runtime`,
    `Hard-code the password in ~dbt_project.yml~ and keep the repository private`,
    `Store the password in a seed and read it with a macro`
  ],
  answer: 0,
  exp: [
    `Variáveis de ambiente com prefixo ~DBT_ENV_SECRET_~ são mascaradas nos logs e só podem ser usadas em ~profiles.yml~ e ~packages.yml~ (por exemplo, tokens de Git).`,
    `~var()~ passado por ~--vars~ pode aparecer em logs e artefatos. Senha em arquivo versionado ou em seed é uma falha de segurança.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/env_var'
}
);
