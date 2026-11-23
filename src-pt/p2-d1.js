/* Exam 2 (exam: p2), domain 1. Per-option explanations in why[]. */
window.DBT_Q.push(
{
  id: 'p2-d1-raw-schema', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `The target database is ~analytics~. Given this source definition, what happens when a model selects from ~{{ source('ecommerce', 'raw_orders_v2') }}~?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/ecommerce/_sources.yml',
      text: `
    sources:
      - name: ecommerce
        schema: raw_shop
        tables:
          - name: orders
            identifier: raw_orders_v2`
    }
  ],
  options: [
    `It compiles to ~analytics.raw_shop.raw_orders_v2~.`,
    `It compiles to ~analytics.ecommerce.raw_orders_v2~.`,
    `Compilation fails: the source has no table ~raw_orders_v2~.`,
    `It compiles to ~analytics.raw_shop.orders~.`
  ],
  answer: 2,
  exp: [
    `O ~source()~ procura a tabela pelo ~name~ declarado (~orders~). O ~identifier~ só diz qual é o nome físico no warehouse. A chamada certa é ~source('ecommerce', 'orders')~, que compila para ~analytics.raw_shop.raw_orders_v2~.`
  ],
  why: [
    `Esse seria o resultado de ~source('ecommerce', 'orders')~. Com o identifier no lugar do nome, o dbt não encontra a tabela.`,
    `Além de a tabela não ser encontrada, o schema declarado é ~raw_shop~, não o nome da source.`,
    `Nenhuma tabela da source tem ~name: raw_orders_v2~; o dbt acusa que a source não foi encontrada.`,
    `Nada na definição leva a esse nome: o identifier troca ~orders~ por ~raw_orders_v2~ no SQL final.`
  ],
  doc: 'https://docs.getdbt.com/reference/source-properties'
},
{
  id: 'p2-d1-raw-domc', d: 'd1', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Which statement about how dbt resolves a ~source()~ call is correct?`,
  options: [
    `If a source has no ~schema~ property, dbt uses the source ~name~ as the schema.`,
    `If a table has no ~identifier~ property, dbt uses the source ~name~ as the table name.`,
    `If a source has no ~database~ property, dbt uses the source ~name~ as the database.`,
    `If a table has no ~loaded_at_field~, dbt refuses to compile ~source()~ calls to it.`
  ],
  answer: 0,
  exp: [
    `Os padrões são: schema = nome da source; tabela = nome da tabela; database = database do target.`
  ],
  why: [
    `É o padrão documentado: sem ~schema~, vale o ~name~ da source.`,
    `Sem ~identifier~, o dbt usa o ~name~ da tabela, não o da source.`,
    `Sem ~database~, o dbt usa o database do target.`,
    `~loaded_at_field~ só importa para freshness. O ~source()~ compila sem ele.`
  ],
  doc: 'https://docs.getdbt.com/reference/source-properties'
},
{
  id: 'p2-d1-mat-ephemeral', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'dag',
  topic: 'Understanding core dbt materializations',
  stem: `~int_orders_enriched~ is configured as ~ephemeral~ and is referenced by ~fct_orders~ and ~fct_refunds~. What happens to it when you run ~dbt build~?`,
  options: [
    `It is built once as a temporary table, and both downstream models read from that table.`,
    `Its SQL is inlined as a CTE into both downstream models, and no object is created for it.`,
    `It is built as a view at the start of the run, and dbt drops that view when the run ends.`,
    `Its SQL is compiled into the first downstream model, and the second one reuses that result.`
  ],
  answer: 1,
  exp: [
    `Um modelo ephemeral não cria nada no warehouse: o dbt injeta o SQL dele como CTE em cada modelo que o referencia.`
  ],
  why: [
    `Nenhum objeto é criado, nem temporário. O código roda de novo dentro de cada dependente.`,
    `O SQL vira uma CTE dentro de ~fct_orders~ e outra dentro de ~fct_refunds~.`,
    `Isso descreveria uma view descartável, que não existe entre as materializações do dbt.`,
    `Não há reaproveitamento de resultado: cada dependente recebe a sua própria CTE.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'p2-d1-mat-match', d: 'd1', type: 'match', exam: 'p2', lvl: 1,
  topic: 'Understanding core dbt materializations',
  stem: `Match each materialization to what it does. One option is not used.`,
  left: [
    `~view~`,
    `~table~`,
    `~incremental~`,
    `~materialized_view~`
  ],
  right: [
    `Stores no data; the query runs each time the relation is read`,
    `Stores the full result set and rebuilds all of it on every run`,
    `Stores data and, after the first run, processes only the rows you filter for`,
    `Stores data that the warehouse itself keeps refreshed in the background`,
    `Stores data and keeps a history of every change made to each row`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `View não guarda dados; table recria tudo; incremental processa só o recorte novo depois da primeira carga; materialized view guarda dados e o próprio warehouse cuida da atualização.`,
    `A opção que sobra descreve um snapshot, que não é uma materialização de modelo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'p2-d1-dry-macro', d: 'd1', type: 'mc', exam: 'p2', lvl: 1, art: 'sql',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Given this macro and this model, what does the expression for ~amount~ compile to?`,
  code: [
    {
      lang: 'sql',
      label: 'macros/cents_to_dollars.sql',
      text: `
    {% macro cents_to_dollars(column_name, scale=2) %}
        round({{ column_name }} / 100.0, {{ scale }})
    {% endmacro %}`
    },
    {
      lang: 'sql',
      label: 'models/staging/stg_payments.sql',
      text: `
    select
        payment_id,
        {{ cents_to_dollars('amount_cents') }} as amount,
        {{ cents_to_dollars('tax_cents', scale=4) }} as tax
    from {{ source('stripe', 'payments') }}`
    }
  ],
  options: [
    `~round('amount_cents' / 100.0, 2)~`,
    `~round(amount_cents / 100.0, 4)~`,
    `~round('amount_cents' / 100.0, 4)~`,
    `~round(amount_cents / 100.0, 2)~`
  ],
  answer: 3,
  exp: [
    `O Jinja imprime o valor do argumento como texto. A string ~'amount_cents'~ sai sem aspas no SQL, e ~scale~ usa o padrão 2 porque não foi passado.`
  ],
  why: [
    `As aspas pertencem ao Jinja, não ao SQL. ~{{ column_name }}~ imprime só ~amount_cents~.`,
    `O 4 foi passado só na segunda chamada, a de ~tax~.`,
    `Nem as aspas chegam ao SQL nem o 4 vale para esta chamada.`,
    `Nome da coluna sem aspas e ~scale~ com o valor padrão.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/jinja-macros'
},
{
  id: 'p2-d1-dry-vars', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Given the files below, you run ~dbt run --select fct_orders~. What does ~{{ var("min_order_date") }}~ produce?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
    vars:
      start_date: "2023-01-01"`
    },
    {
      lang: 'sql',
      label: 'models/marts/fct_orders.sql',
      text: `
    select * from {{ ref('stg_orders') }}
    where ordered_at >= '{{ var("min_order_date") }}'`
    }
  ],
  options: [
    `An empty string, so the warehouse rejects the comparison when the model runs.`,
    `~2023-01-01~, because dbt falls back to the only variable the project defines.`,
    `A compilation error, because the variable has no value and no default.`,
    `The text ~None~, so the filter matches nothing and the model builds empty.`
  ],
  answer: 2,
  exp: [
    `Se a variável não foi definida em lugar nenhum e o ~var()~ não recebeu um segundo argumento, o dbt interrompe a compilação. Com ~var("min_order_date", "2020-01-01")~ o padrão seria usado.`
  ],
  why: [
    `O dbt não substitui uma variável ausente por texto vazio; ele para antes de gerar o SQL.`,
    `~start_date~ é outra variável. Não existe fallback entre nomes diferentes.`,
    `Sem definição e sem padrão, o ~var()~ gera erro de compilação.`,
    `~None~ só apareceria se o padrão passado ao ~var()~ fosse ~none~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/project-variables'
},
{
  id: 'p2-d1-cmd-graph', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'cli',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `The DAG is ~stg_orders~ → ~int_orders~ → ~fct_orders~ → ~rpt_sales~, and ~stg_customers~ also feeds ~int_orders~. Which command builds ~fct_orders~, only its direct parent, and everything downstream of it?`,
  options: [
    `~dbt build --select +fct_orders+1~`,
    `~dbt build --select 1+fct_orders+1~`,
    `~dbt build --select 1+fct_orders+~`,
    `~dbt build --select @fct_orders~`,
    `~dbt build --select +fct_orders+~`
  ],
  answer: 2,
  exp: [
    `O número fica do lado de fora do ~+~: ~1+modelo~ pega um nível de pais, e ~modelo+~ pega todos os descendentes.`
  ],
  why: [
    `Todos os ancestrais entram, e os descendentes ficam limitados a um nível.`,
    `O pai direto está certo, mas os descendentes ficam limitados a um nível.`,
    `Um nível de pais (~int_orders~), o próprio modelo e todos os descendentes.`,
    `~@~ traz os descendentes e também todos os ancestrais deles, o que inclui os dois staging.`,
    `Sem número, o ~+~ da frente traz todos os ancestrais, inclusive os dois staging.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/graph-operators'
},
{
  id: 'p2-d1-cmd-intersect', d: 'd1', type: 'fill', exam: 'p2', lvl: 1, art: 'cli',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the selector with the single character that makes dbt build only the models that have both the ~nightly~ tag and the incremental materialization: ~dbt build --select "tag:nightly______config.materialized:incremental"~`,
  accept: [
    `,`
  ],
  exp: [
    `A vírgula, sem espaços, é a interseção: o nó precisa atender aos dois critérios. Um espaço entre os critérios seria a união.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/set-operators'
},
{
  id: 'p2-d1-cmd-build-order', d: 'd1', type: 'order', exam: 'p2', lvl: 2, art: 'dag',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `A project has the seed ~country_codes~, the model ~stg_customers~ (it refs the seed and has a ~not_null~ test) and the model ~dim_customers~ (it refs ~stg_customers~ and has a ~unique~ test). Put what ~dbt build~ does in order.`,
  items: [
    `Loads the seed ~country_codes~.`,
    `Builds the model ~stg_customers~.`,
    `Runs the ~not_null~ test on ~stg_customers~.`,
    `Builds the model ~dim_customers~.`,
    `Runs the ~unique~ test on ~dim_customers~.`
  ],
  exp: [
    `O ~dbt build~ segue o DAG e roda os testes de cada nó logo depois de construí-lo, antes de seguir para os filhos. Se o ~not_null~ falhar, ~dim_customers~ é pulado.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'p2-d1-cmd-show', d: 'd1', type: 'multi', exam: 'p2', lvl: 3, art: 'cli',
  choose: 2,
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which two statements about ~dbt show --select fct_orders~ are correct? (Choose two.)`,
  options: [
    `It runs the model's compiled query; it doesn't read the relation built earlier.`,
    `It prints the first 5 rows by default, and ~--limit~ changes that number.`,
    `It creates a temporary table in the target schema and drops it after printing.`,
    `It fails unless ~fct_orders~ was built before by ~dbt run~ or ~dbt build~.`,
    `It can also preview a Python model, as long as it returns a DataFrame.`
  ],
  answers: [0, 1],
  exp: [
    `O ~dbt show~ compila o SQL do modelo, executa a consulta e mostra uma amostra no terminal, sem materializar nada.`
  ],
  why: [
    `A documentação diz que ele não seleciona da relação já materializada, mesmo logo após um run.`,
    `O padrão é 5 linhas; ~--limit~ muda a quantidade.`,
    `O resultado não é materializado no warehouse.`,
    `O modelo em si não precisa existir; o que precisa existir são as relações que ele lê.`,
    `O ~dbt show~ não suporta modelos Python.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/show'
},
{
  id: 'p2-d1-dag-hotspot', d: 'd1', type: 'hotspot', exam: 'p2', lvl: 1, art: 'sql',
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `In the nightly job, ~fct_orders~ sometimes starts before ~stg_customers~ has finished, and the lineage graph doesn't show ~fct_orders~ downstream of ~stg_customers~. Click the line that causes this.`,
  code: [
    {
      lang: 'sql',
      label: 'models/marts/fct_orders.sql',
      hotspot: true,
      text: `
    with orders as (
        select * from {{ ref('stg_orders') }}
    ),
    customers as (
        select * from analytics.dbt_prod.stg_customers
    ),
    payments as (
        select * from {{ ref('int_payments_pivoted') }}
    )
    select
        orders.order_id,
        customers.customer_name,
        payments.total_amount
    from orders
    left join customers using (customer_id)
    left join payments using (order_id)
    where orders.ordered_at >= '{{ var("start_date") }}'`
    }
  ],
  answer: 4,
  exp: [
    `O nome fixo ~analytics.dbt_prod.stg_customers~ não cria dependência. Só o ~ref()~ avisa ao dbt que ~stg_customers~ precisa terminar antes, e também faz o modelo ler do schema do ambiente atual.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref'
},
{
  id: 'p2-d1-dag-domc', d: 'd1', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Creating a logical flow of models and building clean DAGs',
  stem: `Which statement follows dbt's guidance on structuring a project's DAG?`,
  options: [
    `Marts select from staging or intermediate models through ~ref()~, not from sources.`,
    `Staging models join related source tables so that marts need fewer ~ref()~ calls overall.`,
    `Intermediate models are the layer that BI tools and exposures should query.`,
    `Each source table is selected by several staging models, one per consumer team.`
  ],
  answer: 0,
  exp: [
    `O fluxo recomendado é source → staging (1 para 1 com a source) → intermediate → marts. Só o staging lê das sources.`
  ],
  why: [
    `Marts usam ~ref()~ para staging e intermediate; quem lê source é o staging.`,
    `Staging é 1 para 1 com a tabela de origem: renomeia, converte tipos e não faz joins.`,
    `Intermediate é camada interna. Quem consome dados usa os marts.`,
    `Cada tabela de origem deve ter um único modelo de staging, reaproveitado por todos.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview'
},
{
  id: 'p2-d1-proj-precedence', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `The target schema is ~analytics~, and the project uses the default ~generate_schema_name~ macro. Given the three files below, how is ~fct_revenue~ built?`,
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
          +schema: marts`
    },
    {
      lang: 'yaml',
      label: 'models/marts/finance/_finance.yml',
      text: `
    models:
      - name: fct_revenue
        config:
          materialized: incremental`
    },
    {
      lang: 'sql',
      label: 'models/marts/finance/fct_revenue.sql',
      text: `
    {{ config(schema='finance') }}
    select * from {{ ref('int_revenue') }}`
    }
  ],
  options: [
    `As a ~table~ model in the schema ~analytics_finance~`,
    `As an incremental model in the schema ~analytics_marts~`,
    `As a ~table~ model in the schema ~analytics_marts~`,
    `As an incremental model in the schema ~analytics_finance~`
  ],
  answer: 3,
  exp: [
    `A prioridade é: ~config()~ no arquivo SQL, depois o YAML de propriedades, depois o ~dbt_project.yml~. O ~materialized~ vem do YAML (incremental) e o ~schema~ vem do ~config()~ (finance).`,
    `A macro padrão junta o schema do target com o schema customizado: ~analytics_finance~.`
  ],
  why: [
    `O schema está certo, mas ~materialized: incremental~ do YAML de propriedades vence o ~table~ do projeto.`,
    `O ~schema='finance'~ do ~config()~ substitui o ~+schema: marts~ do projeto.`,
    `As duas configs do ~dbt_project.yml~ foram sobrescritas por níveis mais específicos.`,
    `Incremental pelo YAML de propriedades, schema ~finance~ pelo ~config()~, prefixado pelo schema do target.`
  ],
  doc: 'https://docs.getdbt.com/reference/configs-and-properties'
},
{
  id: 'p2-d1-proj-plus', d: 'd1', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Defining configurations in dbt_project.yml',
  stem: `Which statement about the ~+~ prefix on config names in ~dbt_project.yml~, as in ~+materialized~, is correct?`,
  options: [
    `It marks a key as a config, so dbt doesn't read it as the name of a subfolder.`,
    `It makes a config add to the value set at a higher level instead of replacing it.`,
    `It makes a config apply to subfolders only, skipping models directly in the folder.`,
    `It gives a config priority over a ~config()~ block inside a model's SQL file.`
  ],
  answer: 0,
  exp: [
    `No ~dbt_project.yml~, o ~+~ separa configs de nomes de pastas. Ele é obrigatório quando o valor da config é um dicionário, como em ~+grants~ ou ~+meta~.`
  ],
  why: [
    `É a função do prefixo: dizer que a chave é uma config e não um caminho.`,
    `Somar em vez de substituir é outro uso do ~+~: na chave do privilégio em ~grants~, como ~'+select'~.`,
    `A config vale para a pasta inteira, incluindo os modelos que estão diretamente nela.`,
    `O ~config()~ do arquivo SQL continua tendo a maior prioridade.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/plus-prefix'
},
{
  id: 'p2-d1-pkg-lock', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Using dbt Packages',
  stem: `The repository also has a committed ~package-lock.yml~ that pins ~dbt_utils~ at 1.1.1. Version 1.3.0 was released yesterday. A teammate clones the repository and runs ~dbt deps~. Which version is installed, and how does the project move to 1.3.0?`,
  code: [
    {
      lang: 'yaml',
      label: 'packages.yml',
      text: `
    packages:
      - package: dbt-labs/dbt_utils
        version: [">=1.1.0", "<2.0.0"]`
    }
  ],
  options: [
    `1.3.0, the newest in the range; ~dbt deps~ rewrites the lock file on every run.`,
    `1.1.1, from the lock file; ~dbt deps --upgrade~ resolves the range again.`,
    `1.1.0, the lowest in the range; pinning ~version: 1.3.0~ is the only way to move up.`,
    `1.1.1, from the lock file; ~dbt clean~ followed by ~dbt deps~ resolves the range again.`
  ],
  answer: 1,
  exp: [
    `Com um ~package-lock.yml~ presente e o ~packages.yml~ sem mudanças, o ~dbt deps~ instala exatamente as versões travadas. Para buscar versões mais novas dentro da faixa, use ~dbt deps --upgrade~.`
  ],
  why: [
    `O lock existe para que todos instalem a mesma versão; ele não é recalculado a cada ~dbt deps~.`,
    `Instala a versão travada; ~--upgrade~ refaz a resolução e regrava o lock.`,
    `O dbt não escolhe a menor versão da faixa, e a faixa já aceita a 1.3.0.`,
    `~dbt clean~ apaga ~dbt_packages~ e ~target~, mas não o lock. O ~dbt deps~ seguinte instala a 1.1.1 de novo.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/deps'
},
{
  id: 'p2-d1-pkg-multi', d: 'd1', type: 'multi', exam: 'p2', lvl: 2,
  choose: 2,
  topic: 'Using dbt Packages',
  stem: `A project installs ~dbt_utils~ and an internal package named ~core_finance~, which contains models. Which two statements are correct? (Choose two.)`,
  options: [
    `A package macro is called with the package name as a prefix, as in ~dbt_utils.star(...)~.`,
    `Models of ~core_finance~ can be configured in the root ~dbt_project.yml~, under ~core_finance~.`,
    `Models of ~core_finance~ are left out of ~dbt build~ unless ~package:core_finance~ is selected.`,
    `Packages are downloaded again at the start of ~dbt build~, which makes ~dbt deps~ optional.`,
    `Reading a package model from the root project requires the two-argument ~ref('core_finance', ...)~.`
  ],
  answers: [0, 1],
  exp: [
    `Macros de pacote são chamadas com o prefixo do pacote, e os modelos do pacote fazem parte do DAG: rodam por padrão e aceitam configs do projeto raiz.`
  ],
  why: [
    `É a sintaxe para macros de pacote: ~{{ dbt_utils.star(...) }}~.`,
    `O projeto raiz configura (ou desativa) modelos de um pacote sob a chave com o nome dele em ~models:~.`,
    `Os modelos do pacote entram em qualquer ~dbt run~ ou ~dbt build~ sem seleção.`,
    `Pacotes só são baixados pelo ~dbt deps~.`,
    `O ~ref()~ de um argumento funciona; o de dois só é preciso para desfazer ambiguidade de nomes.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'p2-d1-python', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'python',
  topic: 'Creating Python Models',
  stem: `This Python model on Snowflake fails when dbt runs it. What must change?`,
  code: [
    {
      lang: 'python',
      label: 'models/marts/completed_orders.py',
      text: `
    def model(dbt, session):
        dbt.config(materialized="view")
        orders = dbt.ref("stg_orders")
        return orders.filter(orders["status"] == "completed")`
    }
  ],
  options: [
    `Set ~materialized~ to ~table~ or ~incremental~; Python models allow no others.`,
    `Replace ~dbt.ref("stg_orders")~ with the Jinja call ~{{ ref('stg_orders') }}~.`,
    `Rename the function after the file, because ~model~ is a reserved name in dbt.`,
    `Move the config to YAML, because ~dbt.config()~ is ignored in Python models.`
  ],
  answer: 0,
  exp: [
    `Modelos Python só podem ser materializados como ~table~ ou ~incremental~. O resto do arquivo está certo: função ~model(dbt, session)~, ~dbt.ref()~ e um DataFrame como retorno.`
  ],
  why: [
    `~view~ (e ~ephemeral~) não existem para modelos Python.`,
    `Modelos Python não usam Jinja; ~dbt.ref()~ é a forma correta.`,
    `A função precisa se chamar exatamente ~model~.`,
    `~dbt.config()~ funciona em modelos Python; o YAML é só uma alternativa.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'p2-d1-grants', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `Given these two files, after ~dbt run --select fct_orders~ on Snowflake, which roles hold ~select~ on ~fct_orders~ through dbt's ~grants~ config?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
    models:
      jaffle_shop:
        marts:
          +grants:
            select: ['reporter']`
    },
    {
      lang: 'sql',
      label: 'models/marts/fct_orders.sql',
      text: `
    {{ config(grants={'select': ['bi_user']}) }}
    select * from {{ ref('int_orders') }}`
    }
  ],
  options: [
    `Both ~reporter~ and ~bi_user~; grants from every level are combined.`,
    `Only ~reporter~; the project-level value wins inside the ~marts~ folder.`,
    `Only ~bi_user~; the model-level value replaces the project-level one.`,
    `Both until the next ~--full-refresh~; after that, only ~bi_user~.`
  ],
  answer: 2,
  exp: [
    `Em ~grants~, a config mais específica substitui a menos específica para o mesmo privilégio. Para somar, o modelo usaria ~{'+select': ['bi_user']}~.`
  ],
  why: [
    `Só haveria combinação se a chave do privilégio no modelo fosse ~'+select'~.`,
    `O nível do modelo é mais específico que o da pasta e vence.`,
    `Sem o ~+~ na chave, ~select~ do modelo substitui o ~select~ herdado.`,
    `O resultado não depende de full refresh: o dbt ajusta os grants a cada execução.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'p2-d1-snap-hotspot', d: 'd1', type: 'hotspot', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Creating snapshots in YAML',
  stem: `~shop.orders~ has a reliable ~updated_at~ column, and the team wants dbt to use it to detect changes. ~dbt snapshot~ fails because a required config is missing. Click the line that must be replaced.`,
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
          check_cols: [status, amount]
          hard_deletes: invalidate`
    }
  ],
  answer: 7,
  exp: [
    `A estratégia ~timestamp~ exige ~updated_at: <coluna>~. ~check_cols~ pertence à estratégia ~check~. A linha certa seria ~updated_at: updated_at~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'p2-d1-snap-deletes', d: 'd1', type: 'match', exam: 'p2', lvl: 1,
  topic: 'Creating snapshots in YAML',
  stem: `Match each ~hard_deletes~ value of a snapshot to what dbt does when a row disappears from the source. One option is not used.`,
  left: [
    `~ignore~`,
    `~invalidate~`,
    `~new_record~`
  ],
  right: [
    `Leaves the snapshot row as it is, still marked as current`,
    `Sets ~dbt_valid_to~ on the current row and adds nothing else`,
    `Sets ~dbt_valid_to~ and adds a row with ~dbt_is_deleted~ set to true`,
    `Removes every version of that row from the snapshot table`
  ],
  answer: [0, 1, 2],
  exp: [
    `~ignore~ (padrão) não faz nada; ~invalidate~ fecha a linha atual com ~dbt_valid_to~; ~new_record~ fecha a linha e ainda registra a exclusão numa linha nova, com ~dbt_is_deleted~.`,
    `O snapshot nunca apaga o histórico.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/hard-deletes'
},
{
  id: 'p2-d1-inc-match', d: 'd1', type: 'match', exam: 'p2', lvl: 3,
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `Match each dataset to the incremental strategy that fits it best. Each strategy is used at most once, and one is not used.`,
  left: [
    `Immutable click events: rows are only ever added`,
    `One row per ~order_id~; existing orders change status and must be updated in place`,
    `Several rows share the ~unique_key~, and all of them must be replaced together`,
    `BigQuery table partitioned by day, with no ~event_time~ configured; the partitions the query returns replace the existing ones`
  ],
  right: [
    `~append~`,
    `~merge~`,
    `~delete+insert~`,
    `~insert_overwrite~`,
    `~microbatch~`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `~append~ só insere; ~merge~ atualiza a linha que casa com a chave e insere as novas; ~delete+insert~ apaga tudo que casa com a chave e reinsere, útil quando a chave não é única; ~insert_overwrite~ troca partições inteiras.`,
    `~microbatch~ ficaria para séries temporais grandes processadas em lotes de tempo independentes.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy'
},
{
  id: 'p2-d1-inc-predicates', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'sql',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `On Snowflake, each incremental run of this model selects only 3 days of rows, but the ~merge~ still scans all 4 years of the target table to look for matches. Rows must keep being updated by ~event_id~. Which change limits how much of the target table the merge scans?`,
  code: [
    {
      lang: 'sql',
      label: 'models/marts/fct_events.sql',
      text: `
    {{ config(
        materialized='incremental',
        incremental_strategy='merge',
        unique_key='event_id'
    ) }}
    select * from {{ ref('stg_events') }}
    {% if is_incremental() %}
    where event_date >= dateadd(day, -3, current_date)
    {% endif %}`
    }
  ],
  options: [
    `Tighten the ~where~ inside the ~is_incremental()~ block from 3 days to 1 day.`,
    `Add ~incremental_predicates~ with a condition on ~DBT_INTERNAL_DEST.event_date~.`,
    `Change ~incremental_strategy~ to ~append~, so that no matching step is needed.`,
    `Add ~cluster_by=['event_date']~, so that Snowflake prunes the target table by itself.`
  ],
  answer: 1,
  exp: [
    `~incremental_predicates~ acrescenta condições ao próprio ~merge~. Com um filtro em ~DBT_INTERNAL_DEST~ (o alias da tabela de destino), o warehouse pode descartar as partições antigas.`
  ],
  why: [
    `Esse ~where~ reduz as linhas de origem, mas o merge continua procurando correspondências no destino inteiro.`,
    `O predicado entra na cláusula do merge e restringe a leitura da tabela de destino.`,
    `Sem a etapa de correspondência não há atualização por ~event_id~: as linhas seriam duplicadas.`,
    `Clusterizar organiza o armazenamento, mas o merge segue sem nenhuma condição sobre ~event_date~ no destino; é o predicado que permite descartar partições.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy'
},
{
  id: 'p2-d1-inc-schema', d: 'd1', type: 'mc', exam: 'p2', lvl: 2,
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `An incremental model sets ~on_schema_change: append_new_columns~. A change to its query adds the column ~discount~ and removes the column ~coupon_code~. After the next incremental run, what does the target table look like?`,
  options: [
    `~discount~ exists, filled in for every row; ~coupon_code~ remains, NULL in the new rows.`,
    `~discount~ exists, NULL in the older rows; ~coupon_code~ was dropped from the table.`,
    `~discount~ exists, NULL in the older rows; ~coupon_code~ remains, NULL in the new rows.`,
    `~discount~ exists, filled in for every row; ~coupon_code~ was dropped from the table.`
  ],
  exp: [
    `~append_new_columns~ só acrescenta colunas. Ele não remove as que saíram da consulta e não preenche as linhas antigas; para isso é preciso um ~--full-refresh~.`
  ],
  why: [
    `Nenhuma opção de ~on_schema_change~ preenche as linhas antigas.`,
    `Remover colunas é comportamento de ~sync_all_columns~.`,
    `A coluna nova entra vazia para o passado, e a coluna antiga fica, sem valor nas linhas novas.`,
    `Nem há backfill nem remoção de coluna com ~append_new_columns~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-models',
  answer: 2
},
{
  id: 'p2-d1-empty', d: 'd1', type: 'mc', exam: 'p2', lvl: 3, art: 'cli',
  topic: 'Validating model logic and schema definitions in dry-runs using the --empty flag',
  stem: `By mistake, an engineer runs ~dbt run --select fct_orders --empty~ against the production target, where ~fct_orders~ is a ~table~ with 40 million rows. What is the state of ~fct_orders~ afterwards?`,
  options: [
    `Rebuilt with the right columns and zero rows, because its refs returned no rows.`,
    `Unchanged, because ~--empty~ only applies to models that don't exist yet.`,
    `Rebuilt with its rows intact, because ~--empty~ only limits the tests that follow.`,
    `Unchanged, because ~--empty~ compiles and validates the SQL without running it.`
  ],
  answer: 0,
  exp: [
    `~--empty~ não é só compilação: o dbt executa o SQL de verdade, com cada ~ref()~ e ~source()~ limitado a zero linhas. Um modelo ~table~ é recriado vazio.`
  ],
  why: [
    `A tabela é recriada com o schema certo e sem linhas. Por isso a flag é para dev e CI.`,
    `A flag vale para qualquer modelo selecionado, exista ele ou não.`,
    `A flag age nos refs e sources do modelo, não nos testes.`,
    `Quem só compila é o ~dbt compile~. Com ~--empty~ o SQL roda no warehouse.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/empty-flag'
},
{
  id: 'p2-d1-sample', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'cli',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `~fct_orders~ refs ~stg_orders~ and ~dim_customers~, and both have ~event_time~ configured. In ~dbt run --select fct_orders --sample="3 days"~, ~dim_customers~ must still be read in full, and its ~event_time~ has to stay because a microbatch model uses it. What do you change?`,
  options: [
    `Reference it as ~{{ ref('dim_customers').render() }}~ inside ~fct_orders~.`,
    `Add ~--exclude dim_customers~ to the command, so that sampling skips it.`,
    `Add ~--empty~ to the command, so that only ~stg_orders~ is time-filtered.`,
    `Set ~full_refresh: false~ on ~dim_customers~ to protect it from sampling.`
  ],
  answer: 0,
  exp: [
    `No modo sample, o dbt filtra por tempo cada ref que tem ~event_time~. Chamar ~.render()~ no ref devolve a relação sem o filtro.`
  ],
  why: [
    `~.render()~ tira esse ref da amostragem (vale também para microbatch).`,
    `~--exclude~ tira o modelo da execução; não muda como ~fct_orders~ lê a tabela.`,
    `~--empty~ zera todos os refs, inclusive ~dim_customers~.`,
    `~full_refresh: false~ só impede que um ~--full-refresh~ recrie o modelo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'p2-d1-microbatch', d: 'd1', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `The table for this model already exists. A scheduled ~dbt run --select fct_sessions~ starts on 2026-03-10 (UTC) with no extra flags. Which daily batches does dbt process?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      text: `
    models:
      - name: fct_sessions
        config:
          materialized: incremental
          incremental_strategy: microbatch
          event_time: session_start
          begin: '2024-01-01'
          batch_size: day
          lookback: 2`
    }
  ],
  options: [
    `March 9 and 10`,
    `March 8, 9 and 10`,
    `Only March 10`,
    `March 7, 8 and 9`,
    `March 8 and 9`
  ],
  answer: 1,
  exp: [
    `Numa execução incremental, o microbatch processa o lote atual mais os ~lookback~ lotes anteriores. Com ~lookback: 2~ e lotes diários, são 3 dias: 8, 9 e 10.`
  ],
  why: [
    `Seria o resultado com o padrão, ~lookback: 1~.`,
    `O lote do dia e os dois anteriores.`,
    `Seria o resultado com ~lookback: 0~.`,
    `O lote atual sempre entra; o lookback se soma a ele.`,
    `O lookback não substitui o lote atual; ele acrescenta lotes anteriores.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
}
);
