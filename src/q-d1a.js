/* Domain 1, part A: sources, materializations, DRY, commands, DAG. */
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
    `Each source corresponds to one **database + schema** combination. Here there are three: ~raw.stripe~, ~raw.shopify~ and ~finance_db.public~. The tables sit inside each source, 5 in total.`,
    `The ~finance_db.public~ source needs ~database: finance_db~ and ~schema: public~ (or a source name equal to the schema).`
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
    `Source defaults: ~database~ = the active target's database; ~schema~ = the **source name**; ~identifier~ = the table name. That is why ~source('hubspot', 'contacts')~ becomes ~<target_database>.hubspot.contacts~.`,
    `None of these properties is required; you declare them only when the physical object departs from these defaults.`
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
    `~source:stripe.payments+~ selects the source table and **all its descendants**. ~dbt ls~ (or ~dbt list~) only lists the nodes, without running anything, which is ideal for assessing impact.`,
    `• A ~+~ on the left selects ancestors, and sources have no ancestors.`,
    `• Without the ~source:~ method and the ~+~, there is no descendant selection.`,
    `• ~source freshness~ measures load delay, not dependencies.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#source'
},
{
  id: 'd1-src-why', d: 'd1', type: 'multi',
  choose: 2,
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
    `With ~source()~, dbt knows about the dependency: raw tables become nodes in the DAG and in the documentation, and you can declare data tests and ~freshness~ on them. The physical name also lives in a single place (the YAML).`,
    `dbt doesn't store data locally, doesn't deduplicate anything and doesn't manage the raw table. It only generates the SQL that runs in the warehouse.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'd1-mat-default', d: 'd1', type: 'fill',
  topic: 'Understanding core dbt materializations',
  stem: `Complete the blank. If no ~materialized~ config is set anywhere for a SQL model, dbt builds it as a ______.`,
  accept: [
    `view`
  ],
  exp: [
    `The default is ~view~: cheap to build and always up to date, but recomputed on every query. Projects usually set ~+materialized~ per folder in ~dbt_project.yml~ (for example, views in staging and tables in marts).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/materializations'
},
{
  id: 'd1-mat-match', d: 'd1', type: 'match',
  topic: 'Understanding core dbt materializations',
  stem: `Match each materialization to its behavior.`,
  left: [
    `~view~`,
    `~table~`,
    `~incremental~`,
    `~ephemeral~`,
    `~materialized_view~`
  ],
  right: [
    `Stores only the query; it runs every time the object is queried`,
    `Rebuilt from scratch on every run`,
    `After the first build, inserts or updates only new or changed rows`,
    `Not built in the warehouse; injected as a CTE into dependent models`,
    `Warehouse-managed object that stores and refreshes results`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `• **view**: only stores the query; zero cost at build time, a cost on every read.`,
    `• **table**: a full ~create table as~ on every run.`,
    `• **incremental**: processes only what changed after the first build (uses ~is_incremental()~).`,
    `• **ephemeral**: becomes a CTE in its consumers; doesn't exist in the database.`,
    `• **materialized_view**: the platform keeps the result up to date; dbt reacts to configuration changes with ~on_configuration_change~.`
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
    `~on_configuration_change~ defines what happens when dbt detects a configuration change on a materialized view: ~apply~ (default) applies the change; ~continue~ moves on without applying it and raises a warning; ~fail~ stops with an error.`,
    `~full_refresh: false~ only prevents full rebuilds; it doesn't control the reaction to configuration changes.`
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
    `Python models can't reference ephemeral models, because there is no object in the database to read. Ephemeral models also don't support contracts and can't have ~access: public~.`,
    `They don't become temporary views: the SQL is injected as a CTE into the consuming model. That is why there is nothing to query after the run.`
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
    `With ~{% set methods = [...] %}~ and ~{% for m in methods %}~, a single line generates all the columns. To add a method, just add it to the list (or fetch the list dynamically with ~dbt_utils.get_column_values~).`,
    `Watch out for the comma on the last iteration: use ~{% if not loop.last %},{% endif %}~.`
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
    `~dbt_utils.generate_surrogate_key~ standardizes key generation (it handles NULLs and concatenates consistently on every adapter). Reusing tested macros from packages is the DRY way.`,
    `• A test would only detect problems; it standardizes nothing.`,
    `• ~row_number()~ isn't stable across runs.`,
    `• ~unique_key~ is an incremental config; it doesn't generate a key.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd1-dry-endmacro', d: 'd1', type: 'fill',
  topic: 'Conceptualizing modularity and how to incorporate DRY principles',
  stem: `Complete the macro so it compiles. What keyword goes in the blank?`,
  code: [
    {
      lang: 'sql',
      label: 'macros/cents_to_dollars.sql',
      text: `
    {% macro cents_to_dollars(column_name, scale=2) %}
        round({{ column_name }} / 100.0, {{ scale }})
    {% ______ %}`
    }
  ],
  accept: [
    `endmacro`
  ],
  exp: [
    `Macros go between ~{% macro name(args) %}~ and ~{% endmacro %}~, in ~.sql~ files inside ~macros/~. Without the closing tag, dbt reports *Reached EOF without finding a close tag for macro*.`,
    `Arguments can have a default value (~scale=2~), and the call is ~{{ cents_to_dollars('amount_cents') }}~.`
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
    `~var()~ centralizes the value (DRY), and the ~--vars~ flag on the command line takes precedence over ~vars:~ in ~dbt_project.yml~, without changing code. You can also give a default in the call: ~{{ var('start_date', '2020-01-01') }}~.`,
    `The other options require editing code or add unnecessary joins.`
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
    `~dbt build~ combines ~run~, ~test~ (data and unit tests), ~seed~ and ~snapshot~ in a single run, following the DAG: each node is tested right after it is built, and failures skip its dependents.`,
    `~dbt run~ only materializes models; tests require ~dbt test~ or ~dbt build~.`
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
    `~dbt docs generate~ compiles the project and queries the warehouse to create ~catalog.json~ (types, statistics); together with ~manifest.json~, it feeds the site. ~dbt docs serve~ only serves these files locally; it generates nothing.`,
    `~--no-compile~ skips the compilation step of ~docs generate~.`
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
    `By default dbt infers the CSV column types. ~column_types~ forces the type of specific columns. Since the table already exists with the wrong type, use ~--full-refresh~ to recreate it.`,
    `• ~quote_columns~ handles quoting of the column **names**.`,
    `• ~delimiter~ changes the separator.`,
    `• Converting afterward doesn't recover the zeros already lost.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/column_types'
},
{
  id: 'd1-cmd-show-inline', d: 'd1', type: 'fill',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the command to run an ad hoc query against a model and preview the result, without creating a model file: ~dbt show --______ "select count(*) from {{ ref('fct_orders') }}"~`,
  accept: [
    `inline`
  ],
  exp: [
    `~dbt show --inline "..."~ compiles the given SQL (including ~ref~ and macros), runs it in the warehouse and shows the result. ~--limit~ controls how many rows appear (default 5).`,
    `~dbt compile --inline~ also exists, but it only renders the SQL, without running it.`
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
    `In selection syntax, a **comma** is an intersection (both criteria must match) and a **space** is a union (either one matches).`,
    `• The version with a space would select every model with the tag and every incremental model.`,
    `• The ~--exclude~ would remove exactly the incremental models.`,
    `• ~+~ is a graph operator, not a set operator.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/set-operators'
},
{
  id: 'd1-cmd-selector-match', d: 'd1', type: 'match',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Match each selector to the nodes it selects.`,
  left: [
    `~tag:finance~`,
    `~path:models/staging~`,
    `~config.materialized:incremental~`,
    `~2+fct_orders~`,
    `~fct_orders+~`
  ],
  right: [
    `Every node tagged finance`,
    `Every node inside the models/staging directory`,
    `Every model configured as incremental`,
    `fct_orders, its parents, and its grandparents`,
    `fct_orders and all of its descendants`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `Methods (~tag:~, ~path:~, ~config.~, ~source:~, ~state:~, etc.) filter by node properties. Graph operators (~+~ and ~n+~) expand to ancestors or descendants: ~2+~ limits it to two degrees up; ~+~ on the right selects all descendants.`
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
    `The convention from the structure guide: ~stg_[source]__[entity]s~, with the ~stg_~ prefix, the source name, **two underscores** and the entity in the plural. It makes the origin easy to see and the files easy to sort.`,
    `Intermediate models follow ~int_[entity]s_[verb]s~ (e.g. ~int_payments_pivoted_to_orders~); marts use ~fct_~ and ~dim_~.`
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
    `The recommended flow goes left to right, never backward: sources → staging (1:1 cleaning) → intermediate (reusable logic) → marts (business entities) → exposures (who consumes the data).`,
    `Lines that skip layers or go back in the DAG are warning signs.`
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
    `This pattern (*rejoining of upstream concepts*) creates redundant dependencies and muddles the DAG. If ~int_orders_enriched~ already starts from ~stg_orders~, carry the needed columns forward and make ~fct_orders~ depend only on the intermediate model.`,
    `Changing the materialization, adding tests or duplicating logic doesn't fix the structure.`
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
    `Staging is the 1:1 cleaning layer on top of the source: renaming, casting types, simple calculations (cents to dollars) and categorizing with ~case when~. Joins, aggregations and combining several sources belong in intermediate or marts.`
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
    `In ~dbt_project.yml~, keys nested under ~models:~ can be folders or configs. The ~+~ makes it clear it is a config. It is always recommended and required in some cases (for example, ~+grants~ and configs whose value is a dictionary).`,
    `Don't confuse it with the ~+~ inside ~grants~ (~'+select'~), which means "add" instead of replace.`
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
    `~on-run-start~ and ~on-run-end~ run **once** per invocation, before or after all nodes. ~pre-hook~ and ~post-hook~ run **for each** configured model, seed or snapshot.`,
    `For privileges on objects (select on tables and views), prefer the ~grants~ config.`
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
    `~alias~ only changes the object's name in the database (the ~generate_alias_name~ macro uses this value). The **node** name is still the file name, so ~ref()~ uses ~fct_orders_rebuild~.`,
    `• ~schema~ changes the schema, not the object name.`,
    `• ~identifier~ is a property of source tables, not of models.`
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
    `Environment variables with the ~DBT_ENV_SECRET_~ prefix are masked in logs and can only be used in ~profiles.yml~ and ~packages.yml~ (for example, Git tokens).`,
    `A ~var()~ passed with ~--vars~ can show up in logs and artifacts. A password in a versioned file or in a seed is a security flaw.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/env_var'
}
);
