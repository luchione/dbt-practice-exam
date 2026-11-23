/* Domains and the core bank (one question per subtopic of the Topics Outline, weighted by domain). */
window.DBT_DOMAINS = [
  { id: 'd1', n: 1, en: `Developing and optimizing dbt models`, subs: 14 },
  { id: 'd2', n: 2, en: `Managing dbt models governance`, subs: 3 },
  { id: 'd3', n: 3, en: `Debugging data modeling errors`, subs: 5 },
  { id: 'd4', n: 4, en: `Troubleshooting and optimizing dbt pipelines`, subs: 2 },
  { id: 'd5', n: 5, en: `Implementing dbt tests`, subs: 3 },
  { id: 'd6', n: 6, en: `Implementing and maintaining external dependencies`, subs: 2 },
  { id: 'd7', n: 7, en: `Leveraging the dbt state`, subs: 2 }
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
    `When ~schema~ is not set, dbt uses the **source name** as the schema, so today it resolves to ~raw.stripe.payments~. Adding ~schema: stripe_v2~ keeps the logical name ~stripe~ (no model changes) and points to the right physical object.`,
    `• ~identifier~ changes the physical name of the **table**, not the schema.`,
    `• Renaming the source would break every ~source('stripe', ...)~ in the models.`,
    `• ~ref()~ is for models, seeds and snapshots. Using it for a raw table breaks the DAG lineage.`
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
    `~identifier~ sets the physical table name in the warehouse, while ~name~ becomes just the logical name used in ~source()~. Models stay readable and, if the physical name changes again, you only edit the YAML.`,
    `How a source resolves: ~database~ (default: the target's database) → ~schema~ (default: the source name) → ~identifier~ (default: the table name).`
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
    `~ephemeral~ models are not built in the database: dbt injects their SQL as a CTE into the models that reference them. They work well for light logic used in a few places. The downsides are debugging (there is no object to query) and, if many models use them, the logic is recomputed in each one.`,
    `• ~view~ creates an object (the view) in the warehouse.`,
    `• Ephemeral does not use a temporary table.`,
    `• ~full_refresh: false~ only prevents a full rebuild of incremental models and seeds.`
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
    `The materialization best-practices guide says: start with a **view**; when querying it gets slow for the people using the data, switch to a **table**; move to **incremental** only when *building* the table gets too slow.`,
    `• A 40-second build doesn't justify the complexity of an incremental or microbatch model.`,
    `• An ephemeral model doesn't even exist in the warehouse, so the BI tool would have nothing to query.`,
    `• Making staging incremental doesn't reduce the cost of queries on the mart.`
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
    `Macros are the DRY way to reuse **parameterized** SQL snippets. Here the column name changes, so the logic needs to take an argument: ~{{ cents_to_dollars('amount_cents') }}~.`,
    `• A ~var~ holds a fixed value and takes no arguments.`,
    `• A seed would only add unnecessary joins.`,
    `• Analyses are not materialized and cannot be referenced with ~ref()~.`
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
    `The flow from the *Refactoring legacy SQL to dbt* guide: first make sure the SQL runs in dbt unchanged; then replace hard-coded references with ~source()~; organize it into CTEs (imports → logic → final); split it into reusable layers; finally, audit the result (for example, with ~audit_helper.compare_relations~) to prove it still matches the legacy output.`
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
    `In ~dbt build~, each node follows DAG order. A model's **unit tests** run *before* it is materialized (they check the logic with fixed data); then the model is built; then its **data tests** run; only then are its children executed.`,
    `If a test on ~stg_orders~ fails with severity ~error~, ~fct_orders~ is SKIPPED.`
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
    `~dbt show~ compiles the node, runs the query in the warehouse and prints the result in the terminal (5 rows by default; ~--limit~ changes that). It materializes nothing. It also accepts ad hoc SQL with ~--inline "select ..."~.`,
    `• ~dbt run --empty~ creates or replaces the object (empty).`,
    `• ~dbt compile~ only generates the SQL, without returning rows.`,
    `• ~dbt docs generate~ generates the documentation artifacts.`
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
    `• ~dbt seed~: loads small, static CSVs (for example, country codes). ~--full-refresh~ recreates the table when the columns change.`,
    `• ~dbt snapshot~: runs snapshots (SCD type 2), adding ~dbt_valid_from~ and ~dbt_valid_to~.`,
    `• ~dbt docs generate~: generates ~catalog.json~ (with warehouse metadata) and ~manifest.json~; ~dbt docs serve~ opens the site locally.`,
    `• ~dbt compile~: writes the rendered SQL to ~target/compiled~.`,
    `• ~dbt show~: previews results without materializing.`
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
    `The ~@~ operator selects the model, all its descendants **and** all the ancestors of those descendants. It is useful in CI to make sure the children have all their parents built.`,
    `• ~+my_model+~ selects only the ancestors and descendants of ~my_model~ itself.`,
    `• ~my_model+~ selects only the descendants.`,
    `• ~1+my_model+1~ selects only the first degree above and below.`
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
    `In the recommended structure, each source table has **one** staging model (a 1:1 relationship) that renames, casts and does light cleaning. The rest of the project references these models with ~ref()~. That way each raw dataset has a single entry point and the DAG stays clean: sources → staging → intermediate → marts.`,
    `Using ~source()~ in marts or intermediate models creates direct joins to raw data and duplicates the cleaning logic.`
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
    `A mart should not read directly from a source. Create ~stg_stripe__payments~ (1:1 with the source, with renames and casts) and use ~ref()~ here. This avoids duplicated cleaning and keeps the source → staging → marts pattern.`,
    `The ~dbt_project_evaluator~ package flags this case as a *direct join to source*.`
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
    `The default ~generate_schema_name~ macro concatenates ~<target.schema>_<custom_schema>~, giving ~dbt_jdoe_analytics~. This keeps developers from writing to the production schema.`,
    `To use just ~analytics~ (in production, for example), override the ~generate_schema_name~ macro in your project.`
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
    `Precedence, from most to least specific: the ~config()~ block in the model file > ~config:~ in the properties YAML > ~dbt_project.yml~. Conflicting configs don't raise an error; the most specific one wins.`
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
    `Since dbt 1.7, ~dbt deps~ generates ~package-lock.yml~ with the exact resolved versions. With this file committed to Git, everyone installs the same versions.`,
    `• ~dbt_packages/~ should stay out of Git (it is listed in ~clean-targets~).`,
    `• ~--upgrade~ does the opposite: it ignores the lock and resolves newer versions.`,
    `• ~require-dbt-version~ restricts the dbt version, not the package versions.`
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
    `Git packages use ~revision~, which accepts a tag, a branch or a full commit SHA. Pinning a tag or commit makes installs reproducible; pointing to a branch (such as ~main~) can bring unexpected changes.`,
    `dbt Hub packages use ~package:~ + ~version:~ (ranges like ~[">=1.0.0", "<2.0.0"]~ are allowed). Local packages use ~local:~.`
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
    `Python models define ~def model(dbt, session):~ and return a DataFrame. References use ~dbt.ref()~ and ~dbt.source()~; configs go in ~dbt.config(...)~ or in YAML. Supported materializations: ~table~ and ~incremental~ (with ~dbt.is_incremental~ and ~dbt.this~).`,
    `There is no Jinja in ~.py~ files. The code runs **on the data platform** (Snowpark on Snowflake, Databricks, BigQuery via Dataproc or BigFrames), not on the local machine.`
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
    `By default, the more specific ~grants~ config **replaces** (clobbers) the less specific one. The ~+~ prefix on the privilege (~'+select'~) changes that to **add** to the inherited grantees. Without the ~+~, only ~finance_analyst~ would get select.`,
    `This ~+~ inside ~grants~ is different from the ~+~ used before configs in ~dbt_project.yml~. To revoke access, provide a shorter or empty list (~select: []~). If you delete the whole ~grants~ config, dbt stops managing grants and revokes nothing.`
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
    `~hard_deletes~ (dbt 1.9+) has three values: ~ignore~ (default) does nothing; ~invalidate~ closes the current record by filling ~dbt_valid_to~; ~new_record~ inserts a new row with ~dbt_is_deleted = True~.`,
    `Snapshots never delete history and ignore ~--full-refresh~.`
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
    `Without a reliable updated-at column, use ~strategy: check~ with ~check_cols~ (a list of columns or ~all~). ~check_cols~ is required for this strategy.`,
    `• Using ~current_timestamp()~ as ~updated_at~ would make every record look changed on every run.`,
    `• The ~timestamp~ strategy requires a real updated-at date/time column.`,
    `~relation~ (at the top of the entry) and ~unique_key~ are also required.`
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
    `• **append**: only inserts, with no duplicate check. It is the cheapest.`,
    `• **merge**: upserts by ~unique_key~ (updates existing rows, inserts new ones). It can get expensive on huge tables; without ~unique_key~ it behaves like append.`,
    `• **insert_overwrite**: replaces whole partitions. Ideal for partitioned tables, such as date-partitioned tables on BigQuery.`,
    `• **microbatch**: processes time batches (~event_time~, ~batch_size~), with backfill and retry per batch.`,
    `• **delete+insert**: deletes the rows for the keys present and reinserts them. Useful when the key is not truly unique or when merge is not supported.`
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
    `~is_incremental()~ only returns true when: the model is configured as incremental, the target table already exists (as a table) and there is no ~--full-refresh~ (or the model has ~full_refresh: false~, which makes the flag be ignored).`,
    `~unique_key~, the command used (~run~ or ~build~) and ~on_schema_change~ don't change the result.`
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
    `~--empty~ limits refs and sources to zero rows. The SQL really runs in the warehouse (checking syntax, columns, permissions and dependencies), but without the cost of reading data. The result is empty objects, so use it in dev or CI. It works with ~run~, ~build~, ~snapshot~ and ~compile~, and is ignored for Python models.`,
    `• ~compile~ and ~parse~ don't validate the SQL in the warehouse.`,
    `• ~--sample~ still reads data (a time window).`
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
    `Sample mode filters the **inputs** (refs and sources) that have ~event_time~ configured. Those that don't are read in full, with no error.`,
    `The value can be relative (~"3 days"~, ~"6 hours"~) or static (~"{'start': '2024-07-01', 'end': '2024-07-08'}"~). To exclude a specific ref from sampling, use ~{{ ref('x').render() }}~. Available in ~dbt run~ and ~dbt build~; ignored for Python models.`
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
    `With microbatch, each batch is an independent query, and ~dbt retry~ reprocesses **only the batches that failed**.`,
    `• ~--full-refresh~ would rebuild everything since ~begin~, which is expensive. The recommendation is even to set ~full_refresh: false~ on these models and backfill with ~--event-time-start~/~--event-time-end~.`,
    `• ~result:fail~ selects tests that failed, not models that errored.`,
    `• ~begin~ is required.`
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
    `Microbatch requires ~event_time~, ~batch_size~ (~hour~, ~day~, ~month~ or ~year~) and ~begin~. The default ~lookback~ is **1** (it reprocesses one previous batch to catch late-arriving data). It doesn't need ~is_incremental()~.`,
    `For a backfill, ~--event-time-start~ and ~--event-time-end~ are required together. Upstream models without ~event_time~ are read in full in every batch. All times are treated as UTC.`
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
    `With an enforced contract, every column returned by the SQL must be in the YAML with ~name~ and ~data_type~, and vice versa. dbt runs this preflight check before building the model.`,
    `• The check ignores column order, so reordering doesn't fix it.`,
    `• Views also enforce the contract (names and types).`,
    `• A test runs after the build and doesn't fix the preflight check.`
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
    `Contracts are supported on SQL models materialized as ~table~, ~view~ (names and types, no constraints) and ~incremental~, the latter **only** with ~on_schema_change~ set to ~append_new_columns~ or ~fail~.`,
    `Not supported: ~ephemeral~, ~materialized_view~, Python models and other resource types (sources, seeds, snapshots).`
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
    `A ~ref~ without a version resolves to ~latest_version~ (here, v2). Versions above ~latest_version~ are *prerelease*; consumers can try them with ~ref('dim_customers', v=3)~. If ~latest_version~ is omitted, the highest version applies.`,
    `By default, each version lives in ~dim_customers_v<N>.sql~ and creates the relation ~dim_customers_v<N>~. Useful selectors: ~version:latest~, ~version:prerelease~, ~version:old~.`
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
    `~deprecation_date~ marks when a version (or model) will be retired. dbt raises warnings for anyone who references or builds a model whose deprecation date is near or past. This gives a clear deadline to migrate; after it, remove the old version.`
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
    `Constraint enforcement depends on the platform. On Snowflake, only ~not_null~ is actually enforced; ~primary_key~, ~unique~ and ~foreign_key~ are created but not checked, and ~check~ is not supported. Postgres enforces all of them.`,
    `That is why constraints don't replace data tests such as ~unique~. The contract preflight only compares column names and types.`
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
    `Constraints are only applied to ~table~ and ~incremental~ models, never to ~view~ or ~ephemeral~. A view with an enforced contract only checks column names and types.`,
    `Switch to ~table~ (or ~incremental~) so the ~not null~ goes into the DDL. Constraints also require ~contract: {enforced: true}~ and ~data_type~ on every column.`
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
    `~access~ controls who can reference the model: ~private~ only models in the same ~group~; ~protected~ (default) models in the same project, including when it is installed as a package; ~public~ anyone, including other projects through dbt Mesh.`,
    `A ~ref~ that violates the access level raises an error at parse time. Access doesn't depend on a contract, although having a contract on public models is good practice.`
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
    `This is a compilation error: dbt builds the DAG from the ~ref()~ calls and found no node named ~stg_order~ in the project (a typo, a renamed file or a model with ~enabled: false~). This error doesn't depend on whether the object exists in the warehouse.`,
    `Cycles raise a different error (*Dependency Error: Found a cycle*).`
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
    `The categories from the *Debugging errors* guide, one for each stage of a command:`,
    `• **Runtime Error** (initialization): dbt can't start, for example with no ~dbt_project.yml~, a wrong profile or no connection.`,
    `• **Compilation Error** (parse): invalid Jinja or YAML, a ~ref~ to a node that doesn't exist.`,
    `• **Dependency Error** (graph validation): cycles in the DAG. Use ~{{ this }}~ if the model needs to reference itself.`,
    `• **Database Error** (execution): the warehouse rejected the SQL. Check ~target/compiled~ or ~target/run~ and ~logs/dbt.log~.`
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
    `*Database Error* means the generated SQL reached the warehouse and was rejected. With Jinja, the problem is usually in the rendered SQL, such as a trailing comma on the last item of a loop (fix it with ~loop.last~).`,
    `Open ~target/compiled/...~ (the rendered SELECT) or ~target/run/...~ (the executed DDL), find the error and run the SQL directly in the warehouse. The other commands don't address the cause.`
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
    `~target/compiled~ holds each node's SQL with the Jinja rendered (the SELECT), which you can run in any editor. ~target/run~ holds what was actually sent to the warehouse, wrapped in the materialization's DDL/DML (~create or replace view/table ... as~, ~merge~, etc.).`,
    `Use compiled to debug logic and run to debug the materialization. Both are generated by commands such as ~run~ and ~build~.`
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
    `YAML depends on indentation. The items in the ~columns~ list are indented 6 spaces (~      - name: customer_id~), but ~first_name~ is indented 5, and the parser can't fit it into the structure. Align it with the previous item.`,
    `YAML errors show up as a *Compilation Error* naming the file and line. ~dbt parse~ is the fastest way to validate.`
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
    `Each resource can have its properties described only **once**. Two ~- name: stg_orders~ entries (in the same file or in different files) raise an error at parse time; merge them.`,
    `• ~dbt clean~ removes ~target/~ and ~dbt_packages/~; it doesn't fix YAML conflicts.`,
    `• ~version: 2~ is optional in current versions.`
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
    `Never fix directly on the main branch. The flow is: branch → fix in dev → ~dbt build --select model+~ in dev → PR → CI (for example ~dbt build --select state:modified+ --defer --state ...~) + review → merge → deploy.`,
    `Git reminder: ~git pull~ = ~git fetch~ + ~git merge~, used to bring changes from the main branch into yours.`
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
    `~--fail-fast~ (or ~-x~, or the ~DBT_FAIL_FAST=true~ variable) stops the run at the first failure.`,
    `• ~--warn-error~ turns warnings into errors, but doesn't stop the run immediately (~--warn-error-options~ lets you choose which warnings).`,
    `• ~--full-refresh~ rebuilds incremental models and seeds.`,
    `• ~--no-partial-parse~ forces a full parse.`
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
    `Behavior change flags are set in the ~flags:~ dictionary in ~dbt_project.yml~, so they are versioned and the same for everyone. The life cycle is: the flag starts off (old behavior) → it matures and becomes on by default → the old behavior is removed.`,
    `Common global flags (such as ~fail_fast~) can also go in ~flags:~, but the CLI and environment variables take precedence over the project (CLI > env var > ~dbt_project.yml~). The ~config:~ block in ~profiles.yml~ is the old location, from before dbt 1.8.`
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
    `When a node fails (ERROR on a model, or FAIL on a test with severity ~error~), dbt marks **all nodes downstream** of it as SKIP, but keeps running the independent branches. That is why the ~stg_customers~ test ran.`,
    `With ~--fail-fast~, the whole run would have stopped. After fixing it, ~dbt retry~ resumes from the point of failure (the node that errored and the ones that were skipped).`
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
    `In ~dbt build~, a test with WARN status doesn't block downstream nodes; a FAIL (severity ~error~) does. With ~severity: warn~ (or a high ~error_if~ and ~warn_if: ">0"~), the pipeline continues and the alert keeps showing up.`,
    `• ~--fail-fast~ makes things worse (it stops everything).`,
    `• Splitting run and test makes models build without the protection of the tests.`,
    `• ~store_failures~ only stores the failing rows; it doesn't change the status.`
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
    `Ephemeral injects the SQL as a CTE into each consumer. With 15 consumers, the heavy logic is recomputed 15 times and the compiled SQL becomes huge. Materializing it as a table computes it only once.`,
    `• More threads parallelize the work, but don't remove the duplication.`,
    `• ~--empty~ builds empty objects, which is useless in production.`
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
    `Recommended practice (*Clone incremental models*): as the first CI step, clone (zero-copy) the modified incremental models that already exist in production (~state:old~). Then ~dbt build~ runs incrementally on top of the clone, instead of rebuilding the whole history.`,
    `• ~--full-refresh~ would do exactly the opposite.`,
    `• ~--defer~ resolves refs to unbuilt nodes against production, but doesn't create objects; without it, unmodified parents wouldn't be found in the CI schema.`
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
    `~dbt clone --state <artifacts>~ clones the selected nodes from the given state into the target. With zero-copy (Snowflake, Databricks, BigQuery), it creates clones; without that support, it creates *pointer views* (~select * from~ the source object).`,
    `By default it does **not** recreate relations that already exist; use ~--full-refresh~ for that. ~--defer~ creates no objects and is usually cheaper. Clone creates real objects, which is useful for testing in BI tools, for blue/green deployments and for CI with incremental models.`
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
    `~where~ filters the tested data (dbt wraps the model in a subquery with that filter), so only the 2 rows from 2024 count. With ~severity: warn~, ~error_if~ is ignored and the default ~warn_if~ (~!= 0~) produces WARN.`,
    `Since dbt 1.10.5, generic test arguments go under ~arguments:~ and configs under ~config:~.`
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
    `A singular test is a SQL query in ~tests/~ that returns the **failing rows**; it passes when it returns zero rows. It is ideal for one-off rules.`,
    `• ~relationships~ checks referential integrity, not sums.`,
    `• Unit tests check logic with fixed data, not the real data.`,
    `• A ~check~ constraint only looks at the row in its own table and isn't even supported on every platform.`
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
    `Custom generic tests are ~{% test %}~ blocks (in ~tests/generic/~ or ~macros/~) that receive ~model~ and ~column_name~ automatically. The other parameters are passed as named arguments.`,
    `In current versions, arguments go under ~arguments:~ and configs (~severity~, ~where~...) under ~config:~. Putting arguments under ~config:~ is the classic mistake: they never reach the test.`
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
    `A ~config()~ inside the test block sets the default for every use of that generic test. The YAML properties of a specific use override that default (precedence: YAML > the test's ~config()~ > ~dbt_project.yml~).`,
    `• ~+severity~ in ~dbt_project.yml~ would affect every test in the project.`,
    `• ~--warn-error~ does the opposite: it promotes warnings to errors.`
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
    `Sources accept data tests in YAML, just like models. Testing at the source catches problems as early as possible. Selection: ~dbt test --select source:shop~ (the whole source) or ~source:shop.orders~ (one table).`,
    `• Unit tests only test SQL models.`,
    `• Freshness measures load delay, not nulls.`
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
    `Unit tests need the direct parents to exist in the warehouse (dbt uses their schema to build the test data), but they don't need the data. Building with ~--empty~ solves it with no read cost.`,
    `• Every ~ref~ or ~source~ the model uses must appear as an ~input~ under ~given~; removing it raises an error.`,
    `• A full build works, but it is expensive.`
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
    `Unit tests (dbt 1.8+) are defined in YAML (~unit_tests:~ in files under ~models/~), and only for **SQL** models in the current project. Under ~given~ you only need the columns relevant to the test (formats ~dict~, ~csv~ or ~sql~; ephemeral inputs require ~sql~).`,
    `In ~dbt build~, unit tests run before materialization; if they fail, the model is not built.`
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
    `To test incremental mode, override the ~is_incremental~ macro to ~true~ and provide ~input: this~ simulating the current contents of the table.`,
    `~expect~ must contain the rows that would be inserted or merged (the SELECT result), not the final table after the merge. With ~overrides~ you can also override ~vars~ and ~env_vars~.`
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
    `~where~ restricts the data evaluated; it is the right feature to test only the new part of large or incremental models. ~error_if: ">100"~ makes the test fail only above 100 rows (up to that, the default ~warn_if~ ~!= 0~ produces WARN).`,
    `• ~limit~ only limits how many failing rows are returned; it doesn't reduce the scan.`,
    `• ~store_failures~ stores the failures in a table (in a schema with the ~dbt_test__audit~ suffix).`,
    `• ~fail_calc~ defines *how* the number of failures is calculated (default ~count(*)~), not the threshold.`
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
    `Unit tests use fixed data, so running them in production only wastes time. Use ~dbt build --exclude-resource-type unit_test~ in the production job (or the equivalent environment variable).`,
    `Skipping all tests in production would remove the protection of the data tests, which validate the real data.`
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
    `Exposures are nodes dbt doesn't execute; they sit at the end of the DAG to document who consumes the data. ~+exposure:name~ selects all ancestors (models, seeds, snapshots and, in ~build~, their tests).`,
    `• ~exposure:x+~ doesn't pick up the parents (and exposures have no children).`,
    `• ~dbt run --select weekly_revenue~ would look for a model with that name.`
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
    `The valid types are ~dashboard~, ~notebook~, ~analysis~, ~ml~ and ~application~.`,
    `Other properties: ~name~ (no spaces), ~label~, ~owner~ (~name~/~email~), ~depends_on~ (~ref~, ~source~, ~metric~), ~maturity~ (~high~/~medium~/~low~), ~url~, ~description~ and ~config~ (~tags~, ~meta~, ~enabled~).`
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
    `The source's freshness configs apply to all its tables, and each table can override them. 15 h is past 12 h (warn) but not 24 h (error), so ~orders~ ends in WARN. ~freshness: null~ turns off the check for ~countries~.`,
    `Valid periods: ~minute~, ~hour~, ~day~. The result goes to ~target/sources.json~, used by the ~source_status:fresher~ selector. ~dbt build~ does **not** run freshness; it is a separate command.`
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
    `~filter~ adds a WHERE **only** to the freshness query, which is great for large or partitioned tables, and affects nothing else.`,
    `• ~where~ and ~limit~ are data test configs, not freshness configs.`,
    `• Changing ~period~ only changes the unit of the thresholds.`,
    `Without ~loaded_at_field~, some adapters compute freshness from warehouse metadata.`
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
    `~state:modified+~ compares the current project with the manifest in ~--state~ and selects new or modified nodes plus their descendants. ~--defer~ makes the ~ref()~ calls to unselected parents point to the production objects described in the manifest.`,
    `• Without ~--state~, the ~state~ method doesn't work.`,
    `• ~+state:modified~ would rebuild all ancestors.`,
    `• ~result:~ uses ~run_results.json~, not code changes.`
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
    `~state:modified~ sub-selectors:`,
    `• ~.body~: the node's SQL or content.`,
    `• ~.configs~: configs, except database/schema/alias/tags/meta.`,
    `• ~.relation~: database, schema or alias.`,
    `• ~.persisted_descriptions~: descriptions, when ~persist_docs~ is on.`,
    `• ~.macros~: macros used, directly or indirectly.`,
    `• ~.contract~: the name or type of contract columns; breaking contract changes raise an error.`,
    `~state:new~ = the node doesn't exist in the comparison manifest; ~state:old~ = it does. Changes only to ~tags~ or ~meta~ don't count as modifications.`
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
    `~dbt retry~ reads the previous run's ~run_results.json~ and resumes from the point of failure: the nodes that errored and the ones skipped because of them. What already passed doesn't run again. If nothing failed, it finishes without doing anything.`,
    `It supports ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~compile~, ~clone~, ~docs generate~ and ~run-operation~. If no node got to execute (for example, a connection failure right at the start), there is nothing to resume from.`
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
    `~result:fail~ selects the tests that failed (with ~--state~ pointing to the ~run_results.json~). Since tests have no descendants, ~result:fail+~ returns only the tests; ~1+result:fail~ includes the tested models (first-degree parents).`,
    `• ~result:error~ selects nodes that errored (such as models), not tests that failed.`,
    `• ~state:modified~ compares code, not results.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#result'
}
];
