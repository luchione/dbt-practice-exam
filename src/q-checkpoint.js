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
    `~--exclude~ removes nodes from what was chosen with ~--select~. It works with ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~ls~ and the other commands that select nodes.`,
    `Here, ~--select models/marts~ selects everything in that folder (the ~path~ method is implied), and ~--exclude tag:deprecated~ removes the models with that tag.`
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
    `In ~--select~, criteria separated by a **space** form a **union**: nodes with any of the tags are included. Separated by a **comma**, they form an **intersection**: only nodes that match all of them are included. That is why ~"tag:finance,tag:nightly"~ selects only the models with both tags.`,
    `Tags don't pass down to children through the DAG, and ~dbt build~ accepts any selector, including ~tag:~.`
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
    `With ~cautious~, dbt only runs tests that depend **exclusively** on selected nodes. The ~relationships~ test also depends on ~fct_orders~, which wasn't selected, so it is left out.`,
    `In the default mode, ~eager~, one selected parent is enough, and all three tests would run. The other modes are ~buildable~ and ~empty~.`
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
    `YAML selectors live in ~selectors.yml~, at the project root, and are used with ~--selector <name>~. They support ~union~, ~intersection~ and ~exclude~, so complex selections are versioned along with the code.`,
    `Command-line arguments don't go through Jinja, ~run-operation~ runs macros (it doesn't select nodes for a build) and ~profiles.yml~ holds connections, not selections.`
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
    `~dbt seed~ loads the CSVs into tables, and ~dbt snapshot~ creates or updates the snapshot tables.`,
    `~dbt compile~ only generates the SQL in ~target/compiled~. ~dbt show~ runs a query and shows a preview, creating nothing. ~dbt ls~ only lists the project's resources.`
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
    `~raw.shop.regions~ is written directly in the SQL, so dbt doesn't know the model depends on that table: it doesn't appear in the lineage or the documentation, can't have tests or freshness, and selectors such as ~source:shop+~ don't reach the model.`,
    `The fix is to declare ~regions~ in the ~shop~ source, create a staging model (~stg_shop__regions~) with ~{{ source('shop', 'regions') }}~ and replace the line with ~{{ ref('stg_shop__regions') }}~.`
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
    `On Snowflake, unquoted names become uppercase. A table created with quotes and mixed case is only found if the name is quoted exactly that way. ~quoting: {identifier: true}~ makes dbt generate ~"OrderItems"~ in quotes. The same property exists for ~database~ and ~schema~.`,
    `Changing the name to lowercase or uppercase still produces an unquoted name, which Snowflake converts to ~ORDERITEMS~. Sources have no materialization.`
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
    `The number after the ~+~ limits the depth: ~+1~ selects only the direct children. Without a number, ~source:stripe.payments+~ lists all descendants.`,
    `With the ~+~ before the name, the selector picks the **parents**, and a source has no parents in the DAG.`
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
    `~batch_size~ accepts ~hour~, ~day~, ~month~ and ~year~. Each batch processes a window of that size, defined by ~event_time~.`,
    `Together with ~event_time~ and ~begin~, ~batch_size~ is one of the required configs of a microbatch model.`
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
    `In a microbatch model, dbt filters each ~ref()~ and ~source()~ that has ~event_time~ to the batch window. ~.render()~ turns off that filter for that ~ref~ only.`,
    `The model's own ~event_time~ is required for microbatch. ~lookback~ sets how many previous batches are reprocessed, not the input filter.`
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
    `~concurrent_batches~ overrides dbt's automatic detection: with ~false~, batches run one after another; with ~true~, they run in parallel.`,
    `~batch_size~ only accepts ~hour~, ~day~, ~month~ and ~year~, ~lookback~ controls how many previous batches are reprocessed, and ~full_refresh=false~ only prevents ~--full-refresh~ from rebuilding the model.`
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
    `~adapter.dispatch~ picks the implementation for the adapter in use: it looks for ~<adapter>__name~ (such as ~bigquery__date_diff_days~) and falls back to ~default__name~ when there is no specific one. Models call a single macro, and the difference lives in one place.`,
    `An ~if~ in every model repeats logic, the opposite of DRY. Also, ~target.name~ is the target's name; the warehouse type is in ~target.type~.`
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
    `When the repeated logic produces a **dataset**, it belongs in a model: it is computed once, appears in the DAG, can be tested and documented, and the marts just use ~ref()~.`,
    `Macros are for reusable, parameterized SQL snippets, such as conversions. With a macro, the join would run three times and be invisible in the DAG. And staging should be 1:1 with the source, with no joins.`
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
    `A view recomputes the query every time someone reads it. Since the data only changes once a day, a ~table~ does the heavy work once at build time and keeps reads fast.`,
    `Ephemeral models don't exist in the warehouse, so the dashboard couldn't even read them. Threads speed up the build, not the dashboard's queries. And ~append~ without a key can duplicate rows; incremental would only pay off if the table became too expensive to rebuild.`
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
    `~ephemeral~ models don't become a table or a view: dbt injects their SQL as a CTE into each model that calls ~ref()~ on them. They are meant for light logic used by a few models.`,
    `Since they don't exist in the warehouse, you can't query them directly, and using them in many models repeats the same computation in each one.`
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
    `With the ~timestamp~ strategy, dbt creates a new version whenever the ~updated_at~ value changes. Since ~_loaded_at~ changes on every load, every row looks changed every day. The right setting is ~updated_at: updated_at~, the column that only changes when the record changes.`,
    `~schema~, ~unique_key~ and ~strategy~ are correct. If there were no reliable column at all, the alternative would be ~strategy: check~ with ~check_cols~.`
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
    `• ~ignore~ (default): dbt does nothing with deleted records.`,
    `• ~invalidate~: closes the current version by filling ~dbt_valid_to~, like the old ~invalidate_hard_deletes=true~.`,
    `• ~new_record~: inserts a new row with ~dbt_is_deleted~ = True, keeping the full history.`,
    `Snapshots don't delete rows from their own table.`
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
    `With ~--empty~, dbt rewrites each ~ref()~ and ~source()~ to return zero rows, which validates SQL, dependencies and schema without processing data. A table written directly in the SQL doesn't go through this rewrite and is read in full.`,
    `That is one more reason to declare every raw table as a source. ~--empty~ works with both ~dbt run~ and ~dbt build~.`
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
    `~merge~ uses the ~unique_key~ to decide what to update. Without it, it behaves like ~append~: it inserts everything again and doesn't check for duplicates. Reprocessing a window of days without a key produces repeated rows.`,
    `The fix is to set ~unique_key='order_id'~. ~on_schema_change~ handles new columns, not duplicates.`
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
    `~{{ this }}~ represents the model's own relation in the warehouse. Inside ~{% if is_incremental() %}~, it lets you compare the new data with what has already been loaded.`
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
    `Packages are installed with ~dbt deps~ into the ~dbt_packages/~ folder (the default ~packages-install-path~). Since the folder is generated, it usually goes in ~.gitignore~, and each environment runs ~dbt deps~ before using the project.`,
    `~dbt run~ doesn't install packages. Package models **are** built along with the project, unless you disable them. And ~packages.yml~ lives at the root, next to ~dbt_project.yml~.`
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
    `Every Python model defines ~def model(dbt, session)~ and returns a DataFrame. ~dbt~ gives access to ~dbt.ref()~, ~dbt.source()~, ~dbt.config()~ and ~dbt.this~; ~session~ is the connection to the platform (for example, the Snowpark or Spark session).`
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
    `When dbt rebuilds the model, the table is replaced and grants made by hand are lost. With the ~grants~ config, dbt reapplies the declared privileges after every build, and access is versioned in the project.`,
    `~access: public~ controls who can call ~ref()~ within dbt, not database permissions. Ephemeral models don't even exist in the warehouse.`
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
    `~--sample~ filters the inputs that have ~event_time~ to a time window, either relative (such as ~"3 days"~ or ~"6 hours"~) or with a start and end. The model is built with real data, just less of it, and you can check the result. It exists for ~dbt run~ and ~dbt build~.`,
    `~--empty~ produces zero rows and is for validating SQL and schema, not for looking at data. ~--full-refresh~ reprocesses everything, the opposite of what you want.`
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
    `Transformations that change the grain or prepare data for the marts belong in the **intermediate** layer, in folders by business area. The guide suggests names in the format ~int_[entity]s_[verb]s~, such as ~int_payments_pivoted_to_orders~.`,
    `Staging only cleans and renames, 1:1 with the source. Marts are the final entities (~fct_~, ~dim_~), exposed to consumers.`
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
    `Right below ~models:~, the first level must be the **project name** (the ~name~ at the top of the file) or the name of an installed package. ~jafle_shop~ has a typo, so no folder under it matches any models, and dbt warns that these paths don't apply to anything.`,
    `The rest is correct: ~staging~ and ~marts~ are folders inside ~models/~, and the ~+~ indicates that ~materialized~ is a config, not a subfolder.`
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
    `By default, every model is ~protected~: any model in the same project can call ~ref()~ on it, and so can the project that installs this code as a package.`,
    `~private~ restricts it to the same ~group~, and ~public~ opens it to any group, package or project.`
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
    `Each model belongs to **a single** ~group~, so ~group~ takes a name, not a list. Pick an owner (for example, ~group: finance~); if the other team needs to use the model, ~protected~ or ~public~ ~access~ already allows the ~ref()~.`,
    `The group definitions are correct: each one has a ~name~ and an ~owner~ with an ~email~, which are required.`
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
    `When defining a group, ~name~ and ~owner~ are required, and the ~owner~ needs a ~name~ or an ~email~. Groups record who is responsible for the models and act as the boundary for ~private~ access.`,
    `Groups don't touch database permissions (that is ~grants~), each model belongs to only one group, and ~protected~ is the default, which doesn't depend on groups.`
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
    `Folder configs in ~dbt_project.yml~ become the default for all models in that folder, and the more specific config, in the model's YAML, wins. That way the general rule lives in one place, and the exception lives in the model itself.`,
    `A group can have models with different access levels. The other options require repeating the config on every model or needlessly change the model's owner and location.`
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
    `An incremental model with a contract needs ~on_schema_change: append_new_columns~ or ~fail~. In both cases, existing columns are not silently removed, which would break the shape the contract promises.`,
    `~sync_all_columns~ can remove columns from the table, and ~ignore~ leaves the table without the new columns, so neither is accepted.`
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
    `For dbt, these break the contract: removing an existing column, changing the ~data_type~ of an existing column, removing or altering a constraint and, since 1.9, deleting, renaming or disabling the contracted model.`,
    `Adding columns doesn't break existing consumers, and descriptions and data tests aren't part of the shape the contract guarantees.`
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
    `By default, each version becomes a relation with the ~_v<version>~ suffix. A ~ref('dim_customers')~ without a version resolves to ~latest_version~, but in the database the names still have the suffix.`,
    `If consumers need a name without a suffix, it has to be created separately, for example with an ~alias~ on the latest version or with a view that points to it.`
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
    `Each column is an item in the ~columns~ list and must start with ~-~. ~name: customer_id~ is missing the dash, so the YAML finds a loose key in the middle of the list and can't read the file. The right form is ~- name: customer_id~.`,
    `YAML errors show up in ~dbt parse~ (and in any other command) before any access to the warehouse, with the file and the approximate line.`
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
    `In YAML, some characters can't start an unquoted value: ~@~ and the backtick are reserved, ~*~ and ~&~ mark aliases and anchors, and ~{~ and ~[~ open structures. Quoting the text fixes it.`,
    `Outside double quotes, the backslash doesn't escape anything. ~version: 2~ has been optional since dbt 1.5 and has nothing to do with the error.`
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
    `The ~name~ in the YAML must match the model name, which comes from the ~.sql~ file name. ~stg_shop_orders~ doesn't match ~stg_shop__orders~, so dbt doesn't find the node and ignores the tests, descriptions and configs in that entry.`,
    `Properties files can have any name and live in any folder under ~model-paths~.`
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
    `The ~+~ in ~state:modified+~ exists precisely to test the children of what changed. If the grain change created duplicates in ~fct_revenue~, CI caught a real problem before the merge.`,
    `Taking the model out of CI or merging anyway only hides the error, which would show up in production. ~--full-refresh~ doesn't change the logic.`
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
    `A unit test with the case that broke documents the expected behavior and runs on every ~dbt build~ and in CI. Seeing the test fail before the fix confirms it really covers the bug.`,
    `Checking with ~dbt show~ helps in the moment, but doesn't protect future changes. Comments and ~--full-refresh~ test nothing.`
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
    `The ~profile:~ in ~dbt_project.yml~ says which profile in ~profiles.yml~ to use. If that profile doesn't exist (missing file, different name or a file outside the user's ~.dbt~ folder without ~--profiles-dir~), dbt stops before connecting. ~dbt debug~ shows where it is looking.`,
    `An expired password produces a connection error (~Database Error~), and missing packages produce a different message, asking for ~dbt deps~.`
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
    `dbt's DAG must be acyclic: no model can depend, directly or indirectly, on itself. The message shows the path of the cycle. The way out is to move the shared logic into a model upstream of both, or to reverse one of the dependencies.`,
    `Duplicate names and materializations produce other errors, and ~--threads~ doesn't change the structure of the DAG.`
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
    `By default, dbt uses partial parsing: it stores the parse result in ~target/partial_parse.msgpack~ and only rereads the files that changed. When that cache seems stale or causes strange errors, ~--no-partial-parse~ forces a full parse.`
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
    `The compiled code shows the value the Jinja actually produced: the filter became ~>= '2099-01-01'~, a date in the future. This happens when the variable used in the filter isn't defined in the environment and the model falls back to the ~var()~ default.`,
    `The fix is to define ~start_date~ under ~vars:~ in ~dbt_project.yml~ (or pass ~--vars~) and to rethink that default. Reading ~target/compiled~ is the fastest way to find this kind of error, because the model file only shows the Jinja.`
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
    `Where zero-copy cloning exists (Snowflake, Databricks and BigQuery), dbt clones the tables. On other platforms, it creates a simple view, a ~select~ of everything from the production object, which is fast and doesn't duplicate data.`,
    `Either way, clone doesn't reprocess the models' logic.`
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
    `~dbt clone~ reads the source environment's ~manifest.json~, via ~--state~, to know which relations exist and where they are. Then it creates clones or views in your target, so that target's credentials must be able to read the production objects.`,
    `It doesn't rebuild production, it uses your own target (not the production ~profiles.yml~) and it doesn't depend on ~catalog.json~.`
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
    `~Database Error~ means the warehouse refused the command. If the same code runs in dev, the problem is in the environment: the production target's role or user needs privileges to create and replace objects in the destination schema, or to create the schema.`,
    `Refs are resolved by the project itself, without a production manifest, and a failing test causes SKIP on its children, not a privilege error.`
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
    `When a seed's structure changes (column names or types), you need ~--full-refresh~, which recreates the table in the new format. Without it, dbt tries to reload the data into the old table.`,
    `~dbt retry~ would repeat the same error, ~dbt run~ doesn't load seeds and ~--empty~ doesn't recreate tables.`
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
    `An error only affects what depends on the failed node: its descendants are SKIPPED, and the rest of the DAG continues. At the end, the command exits with an error, and ~run_results.json~ records each node's status, which lets you use ~dbt retry~ afterward.`,
    `Stopping everything at the first error is the behavior of ~--fail-fast~, and dbt doesn't retry automatically by default.`
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
    `Generic tests receive the standard arguments ~model~ and ~column_name~, and they must be in the signature: ~{% test not_negative(model, column_name) %}~. Without ~model~, the call dbt makes to the test doesn't fit the definition.`,
    `The body is correct: it returns the rows with a negative value, which are the failures.`
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
    `Singular tests live in ~tests/~, the default ~test-paths~ in ~dbt_project.yml~. Each file is a ~select~ that returns the rows that violate the rule and can use ~ref()~ and ~source()~.`
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
    `The ~relationships~ test filters ~customer_id is not null~ before looking for values with no match in the parent model, so NULLs never count as failures. To require a value, combine it with ~not_null~.`,
    `There is no row limit by default, and in SQL a NULL doesn't match anything in a join.`
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
    `• The built-in generic tests (~unique~, ~not_null~, ~accepted_values~, ~relationships~) cover common rules with one line of YAML.`,
    `• A singular test is a ~select~ written for a specific rule that won't repeat.`,
    `• When the same rule repeats in several places, it is worth writing your own generic test, with ~{% test %}~, and applying it in YAML.`,
    `• Unit tests check the model's logic with fixed input data, before it reaches real data.`,
    `Source freshness measures load delay, not business rules.`
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
    `The test passes when the query returns zero rows. Since it is a regular SQL file in ~tests/~, it can use ~ref()~, ~source()~, macros and ~{{ config() }}~, for example to set ~severity~.`,
    `It doesn't need YAML to run: dbt finds the file by its folder. YAML is optional, for a description and configs.`
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
    `Packages first, because the project depends on them to compile. Then freshness, so you don't spend the build on late data. Then ~dbt build~, which builds and tests each node in DAG order; unit tests are left for dev and CI. Finally ~docs generate~, so the catalog reflects the newly created objects.`
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
    `The ~test_type:~ method accepts ~generic~, ~singular~, ~unit~ and ~data~. ~test_type:singular~ selects only the tests written as SQL files, while ~test_type:data~ combines generic and singular tests.`,
    `There is no ~--singular~ flag, and ~resource_type~ distinguishes resource types (model, test, seed), not test types.`
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
    `Test configs in ~dbt_project.yml~ go under ~data_tests:~, with the project name and the path. The path is where the test is defined: for generic tests, the folder of the YAML file; for singular tests, the folder of the ~.sql~ file.`,
    `Under ~models:~, ~severity~ doesn't apply to tests. And ~+severity: warn~ directly under ~data_tests:~ would affect every test in the project, not just the staging ones.`
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
    `~accepted_range~, from dbt_utils, checks that values fall between ~min_value~ and ~max_value~, inclusive by default (~inclusive: true~). In dbt 1.11, the parameters go under ~arguments:~ in the YAML.`,
    `~accepted_values~ would accept only exactly 0 or 1, and the other tests check uniqueness and referential integrity.`
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
    `The ~where~ config filters the rows the test evaluates. That way ~not_null~ only looks at the orders that should have ~shipped_at~ and really fails when one of them is empty.`,
    `~severity: warn~ only downgrades the result, without taking the canceled orders out of the count, and the other options don't even test ~shipped_at~.`
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
    `~period~ only accepts ~minute~, ~hour~ or ~day~, always singular, so ~days~ is invalid. For two days, use ~{count: 2, period: day}~ or ~{count: 48, period: hour}~.`,
    `The rest follows the current format: ~freshness~ and ~loaded_at_field~ go under ~config:~ (since 1.9 and 1.10, respectively), and the tables inherit the source's configuration.`
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
    `~sources.json~ holds the result of the last freshness check. With the one from a previous run in ~--state~, the ~source_status:fresher~ selector compares the two and picks only what received new data.`
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
    `Exposures sit at the end of the DAG, as descendants of the models they consume. ~stg_orders+~ selects all descendants, and ~--resource-type exposure~ leaves only the exposures in the list.`,
    `~+stg_orders~ selects the ancestors, and ~exposure:stg_orders~ would look for an exposure with that name.`
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
    `The items in ~depends_on~ are resolved like any ~ref()~. If the referenced model no longer exists, parsing fails with a node-not-found error. Change it to ~ref('fct_order_lines')~.`,
    `dbt doesn't access the URL, and exposures can depend on models, sources and metrics.`
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
    `~state:new~ selects the nodes that don't exist in the comparison manifest. ~state:modified~ includes those new nodes **and** the ones that changed.`,
    `There are also ~state:old~ (nodes that already existed), ~state:unmodified~ and sub-selectors such as ~state:modified.body~ and ~state:modified.configs~.`
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
    `~state:modified~ compares the current manifest with the one in ~--state~: it picks up new nodes and changes to SQL, configs, persisted descriptions, contracts and the macros used. There are sub-selectors for each kind, such as ~state:modified.macros~.`,
    `It compares code, not data. Failures from the last run are in ~run_results.json~ and are selected with ~result:~.`
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
    `~dbt retry~ resumes the last run from the point of failure: it runs what errored and what was skipped because of it. Since the project is read again, the fix you made already applies.`,
    `What succeeded isn't repeated. This is the flow the documentation shows: fix the error and run ~dbt retry~.`
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
    `Every command writes a new ~run_results.json~ to ~target/~. Retry uses that file to know where to resume, so it now sees the ~compile~, which had no failures.`,
    `Now you need to run ~dbt build~ again. Retry works normally with ~build~ and has no time limit.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
