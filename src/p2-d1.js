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
    `~source()~ looks up the table by its declared ~name~ (~orders~). ~identifier~ only says what the physical name is in the warehouse. The right call is ~source('ecommerce', 'orders')~, which compiles to ~analytics.raw_shop.raw_orders_v2~.`
  ],
  why: [
    `That would be the result of ~source('ecommerce', 'orders')~. With the identifier in place of the name, dbt doesn't find the table.`,
    `Besides the table not being found, the declared schema is ~raw_shop~, not the source name.`,
    `No table in the source has ~name: raw_orders_v2~; dbt reports that the source wasn't found.`,
    `Nothing in the definition leads to this name: the identifier replaces ~orders~ with ~raw_orders_v2~ in the final SQL.`
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
    `The defaults are: schema = the source name; table = the table name; database = the target's database.`
  ],
  why: [
    `This is the documented default: without ~schema~, the source's ~name~ applies.`,
    `Without ~identifier~, dbt uses the table's ~name~, not the source's.`,
    `Without ~database~, dbt uses the target's database.`,
    `~loaded_at_field~ only matters for freshness. ~source()~ compiles without it.`
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
    `An ephemeral model creates nothing in the warehouse: dbt injects its SQL as a CTE into each model that references it.`
  ],
  why: [
    `No object is created, not even a temporary one. The code runs again inside each dependent.`,
    `The SQL becomes one CTE inside ~fct_orders~ and another inside ~fct_refunds~.`,
    `That would describe a throwaway view, which isn't one of dbt's materializations.`,
    `Results aren't reused: each dependent gets its own CTE.`
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
    `A view stores no data; a table recreates everything; incremental processes only the new slice after the first load; a materialized view stores data and the warehouse itself handles the refresh.`,
    `The leftover option describes a snapshot, which isn't a model materialization.`
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
    `Jinja prints the argument's value as text. The string ~'amount_cents'~ comes out without quotes in the SQL, and ~scale~ uses the default 2 because it wasn't passed.`
  ],
  why: [
    `The quotes belong to Jinja, not to SQL. ~{{ column_name }}~ prints just ~amount_cents~.`,
    `The 4 was passed only in the second call, the one for ~tax~.`,
    `Neither do the quotes reach the SQL nor does the 4 apply to this call.`,
    `Column name without quotes and ~scale~ with the default value.`
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
    `If the variable wasn't defined anywhere and ~var()~ didn't get a second argument, dbt stops compilation. With ~var("min_order_date", "2020-01-01")~ the default would be used.`
  ],
  why: [
    `dbt doesn't replace a missing variable with empty text; it stops before generating the SQL.`,
    `~start_date~ is a different variable. There is no fallback between different names.`,
    `With no definition and no default, ~var()~ raises a compilation error.`,
    `~None~ would only appear if the default passed to ~var()~ were ~none~.`
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
    `The number goes on the outside of the ~+~: ~1+model~ selects one level of parents, and ~model+~ selects all descendants.`
  ],
  why: [
    `All ancestors are included, and descendants are limited to one level.`,
    `The direct parent is right, but descendants are limited to one level.`,
    `One level of parents (~int_orders~), the model itself and all descendants.`,
    `~@~ brings the descendants and also all their ancestors, which includes both staging models.`,
    `Without a number, the leading ~+~ brings all ancestors, including both staging models.`
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
    `A comma, with no spaces, is an intersection: the node must match both criteria. A space between the criteria would be a union.`
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
    `~dbt build~ follows the DAG and runs each node's tests right after building it, before moving on to its children. If the ~not_null~ test fails, ~dim_customers~ is skipped.`
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
    `~dbt show~ compiles the model's SQL, runs the query and shows a sample in the terminal, without materializing anything.`
  ],
  why: [
    `The documentation says it doesn't select from the already materialized relation, even right after a run.`,
    `The default is 5 rows; ~--limit~ changes the number.`,
    `The result isn't materialized in the warehouse.`,
    `The model itself doesn't need to exist; what needs to exist are the relations it reads.`,
    `~dbt show~ doesn't support Python models.`
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
    `The hard-coded name ~analytics.dbt_prod.stg_customers~ creates no dependency. Only ~ref()~ tells dbt that ~stg_customers~ must finish first, and it also makes the model read from the current environment's schema.`
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
    `The recommended flow is source → staging (1:1 with the source) → intermediate → marts. Only staging reads from sources.`
  ],
  why: [
    `Marts use ~ref()~ on staging and intermediate; staging is what reads the source.`,
    `Staging is 1:1 with the source table: it renames, casts types and does no joins.`,
    `Intermediate is an internal layer. Data consumers use the marts.`,
    `Each source table should have a single staging model, reused by everyone.`
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
    `The priority is: ~config()~ in the SQL file, then the properties YAML, then ~dbt_project.yml~. ~materialized~ comes from the YAML (incremental) and ~schema~ comes from ~config()~ (finance).`,
    `The default macro joins the target schema with the custom schema: ~analytics_finance~.`
  ],
  why: [
    `The schema is right, but ~materialized: incremental~ in the properties YAML beats the project's ~table~.`,
    `~schema='finance'~ in ~config()~ replaces the project's ~+schema: marts~.`,
    `Both ~dbt_project.yml~ configs were overridden by more specific levels.`,
    `Incremental from the properties YAML, schema ~finance~ from ~config()~, prefixed with the target schema.`
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
    `In ~dbt_project.yml~, the ~+~ separates configs from folder names. It is required when the config's value is a dictionary, as in ~+grants~ or ~+meta~.`
  ],
  why: [
    `That is the prefix's job: to say the key is a config and not a path.`,
    `Adding instead of replacing is a different use of ~+~: on the privilege key in ~grants~, such as ~'+select'~.`,
    `The config applies to the whole folder, including the models directly in it.`,
    `~config()~ in the SQL file still has the highest priority.`
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
    `With a ~package-lock.yml~ present and ~packages.yml~ unchanged, ~dbt deps~ installs exactly the locked versions. To fetch newer versions within the range, use ~dbt deps --upgrade~.`
  ],
  why: [
    `The lock exists so everyone installs the same version; it isn't recalculated on every ~dbt deps~.`,
    `It installs the locked version; ~--upgrade~ redoes the resolution and rewrites the lock.`,
    `dbt doesn't pick the lowest version in the range, and the range already accepts 1.3.0.`,
    `~dbt clean~ deletes ~dbt_packages~ and ~target~, but not the lock. The next ~dbt deps~ installs 1.1.1 again.`
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
    `Package macros are called with the package prefix, and the package's models are part of the DAG: they run by default and accept configs from the root project.`
  ],
  why: [
    `That is the syntax for package macros: ~{{ dbt_utils.star(...) }}~.`,
    `The root project configures (or disables) a package's models under the key with its name in ~models:~.`,
    `The package's models are included in any ~dbt run~ or ~dbt build~ without a selection.`,
    `Packages are only downloaded by ~dbt deps~.`,
    `One-argument ~ref()~ works; the two-argument form is only needed to resolve name ambiguity.`
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
    `Python models can only be materialized as ~table~ or ~incremental~. The rest of the file is correct: a ~model(dbt, session)~ function, ~dbt.ref()~ and a DataFrame as the return value.`
  ],
  why: [
    `~view~ (and ~ephemeral~) don't exist for Python models.`,
    `Python models don't use Jinja; ~dbt.ref()~ is the right form.`,
    `The function must be named exactly ~model~.`,
    `~dbt.config()~ works in Python models; YAML is just an alternative.`
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
    `In ~grants~, the more specific config replaces the less specific one for the same privilege. To add, the model would use ~{'+select': ['bi_user']}~.`
  ],
  why: [
    `They would only combine if the privilege key on the model were ~'+select'~.`,
    `The model level is more specific than the folder level and wins.`,
    `Without the ~+~ on the key, the model's ~select~ replaces the inherited ~select~.`,
    `The result doesn't depend on a full refresh: dbt adjusts grants on every run.`
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
    `The ~timestamp~ strategy requires ~updated_at: <column>~. ~check_cols~ belongs to the ~check~ strategy. The right line would be ~updated_at: updated_at~.`
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
    `~ignore~ (default) does nothing; ~invalidate~ closes the current row with ~dbt_valid_to~; ~new_record~ closes the row and also records the deletion in a new row, with ~dbt_is_deleted~.`,
    `A snapshot never deletes history.`
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
    `~append~ only inserts; ~merge~ updates the row that matches the key and inserts the new ones; ~delete+insert~ deletes everything matching the key and reinserts it, useful when the key isn't unique; ~insert_overwrite~ replaces whole partitions.`,
    `~microbatch~ would be for large time series processed in independent time batches.`
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
    `~incremental_predicates~ adds conditions to the ~merge~ itself. With a filter on ~DBT_INTERNAL_DEST~ (the alias of the target table), the warehouse can prune the old partitions.`
  ],
  why: [
    `This ~where~ reduces the source rows, but the merge still looks for matches across the whole target.`,
    `The predicate goes into the merge clause and restricts the read of the target table.`,
    `Without the matching step there is no update by ~event_id~: rows would be duplicated.`,
    `Clustering organizes storage, but the merge still has no condition on ~event_date~ in the target; the predicate is what allows partitions to be pruned.`
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
    `~append_new_columns~ only adds columns. It doesn't remove the ones that left the query and doesn't fill old rows; that requires a ~--full-refresh~.`
  ],
  why: [
    `No ~on_schema_change~ option fills old rows.`,
    `Removing columns is the behavior of ~sync_all_columns~.`,
    `The new column is empty for the past, and the old column stays, with no value on new rows.`,
    `There is neither a backfill nor a column removal with ~append_new_columns~.`
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
    `~--empty~ isn't just compilation: dbt really runs the SQL, with each ~ref()~ and ~source()~ limited to zero rows. A ~table~ model is recreated empty.`
  ],
  why: [
    `The table is recreated with the right schema and no rows. That is why the flag is for dev and CI.`,
    `The flag applies to any selected model, whether it exists or not.`,
    `The flag acts on the model's refs and sources, not on tests.`,
    `~dbt compile~ is what only compiles. With ~--empty~ the SQL runs in the warehouse.`
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
    `In sample mode, dbt filters by time each ref that has ~event_time~. Calling ~.render()~ on the ref returns the relation without the filter.`
  ],
  why: [
    `~.render()~ takes that ref out of sampling (it also works for microbatch).`,
    `~--exclude~ takes the model out of the run; it doesn't change how ~fct_orders~ reads the table.`,
    `~--empty~ empties every ref, including ~dim_customers~.`,
    `~full_refresh: false~ only keeps a ~--full-refresh~ from recreating the model.`
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
    `In an incremental run, microbatch processes the current batch plus the ~lookback~ previous batches. With ~lookback: 2~ and daily batches, that is 3 days: the 8th, 9th and 10th.`
  ],
  why: [
    `That would be the result with the default, ~lookback: 1~.`,
    `The day's batch and the two before it.`,
    `That would be the result with ~lookback: 0~.`,
    `The current batch is always included; the lookback is added to it.`,
    `The lookback doesn't replace the current batch; it adds previous batches.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
}
);
