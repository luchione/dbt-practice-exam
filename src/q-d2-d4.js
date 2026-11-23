/* Domains 2 to 4: governance, debugging, troubleshooting. */
window.DBT_Q.push(
{
  id: 'd2-c-type', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `~dim_customers~ has an enforced contract, and ~dbt build~ fails with the error below. In this case the YAML declaration is correct and the SQL is wrong. How do you fix it?`,
  code: [
    {
      lang: 'log',
      text: `
    Compilation Error in model dim_customers (models/marts/dim_customers.sql)
      This model has an enforced contract that failed.

      | column_name | definition_type | contract_type | mismatch_reason    |
      | ----------- | --------------- | ------------- | ------------------ |
      | customer_id | TEXT            | INT           | data type mismatch |`
    }
  ],
  options: [
    `Make the SQL return the declared type, for example ~cast(customer_id as int) as customer_id~.`,
    `Reorder the columns in the YAML so ~customer_id~ comes first.`,
    `Add a ~not_null~ constraint to ~customer_id~.`,
    `Run the model with ~--full-refresh~ to rebuild the table.`
  ],
  answer: 0,
  exp: [
    `The contract's preflight check compares **names and types**: the SQL returns ~TEXT~ and the contract declares ~INT~. Fix the SQL (cast) or, if text is the right type, fix the ~data_type~ in the YAML.`,
    `Column order doesn't matter in this check. Constraints and ~--full-refresh~ don't change the type the SQL returns.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-c-breaking', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Other teams consume ~dim_customers~, which has an enforced contract. You must remove the ~country_name~ column. Your CI job (using ~state:modified~) fails with a breaking-change error. What is the recommended approach?`,
  options: [
    `Create a new version (v2) without the column, keep v1 available with a ~deprecation_date~, and let consumers migrate.`,
    `Set ~contract: {enforced: false}~ so the change passes CI.`,
    `Run CI with ~--full-refresh~ so the comparison is skipped.`,
    `Rename the model to ~dim_customers_new~ and delete the old one in the same PR.`
  ],
  answer: 0,
  exp: [
    `Removing a column, changing a ~data_type~ or altering constraints on a model with a contract are **changes that break consumers**, and dbt detects them by comparing against the production state.`,
    `The right path is versioning: publish v2, keep v1 for a migration period with a ~deprecation_date~ and then remove it. Turning off the contract or renaming/deleting the model breaks consumers without warning.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'd2-c-order-domc', d: 'd2', type: 'domc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `Which statement about enforced model contracts is correct?`,
  options: [
    `dbt creates the table with its columns in the order declared in the contract.`,
    `The preflight check fails if the SQL lists the columns in a different order than the YAML.`,
    `The contract checks column values, such as nulls and duplicates.`,
    `An enforced contract requires a constraint on every column.`
  ],
  answer: 0,
  exp: [
    `The preflight check ignores order and compares names and types. In the DDL, dbt uses the order declared in the contract.`,
    `Contracts guarantee the model's **shape**, not its values; for values there are constraints (when the platform enforces them) and data tests. Constraints are optional.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-c-hotspot', d: 'd2', type: 'hotspot',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `~dbt run~ fails with a parsing error about an invalid configuration for one column of this contracted model. Click the column definition that causes it.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_fct_orders.yml',
      hotspot: true,
      text: `
    models:
      - name: fct_orders
        config:
          contract:
            enforced: true
        columns:
          - name: order_id
            data_type: int
            constraints:
              - type: not_null
          - name: created_at
            constraints:
              - type: not_null
          - name: amount
            data_type: numeric`
    }
  ],
  answer: 10,
  exp: [
    `With ~contract: {enforced: true}~, **every** column needs a ~data_type~. ~created_at~ has a constraint but no type. Add, for example, ~data_type: timestamp~.`,
    `It is the same scenario as the sample question in the official study guide: the parse error comes before any test, so fixing the YAML is the first step.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/contract'
},
{
  id: 'd2-c-project', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `You want every model in ~models/marts/~ to have an enforced contract without editing each model. What should you add to ~dbt_project.yml~?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
    models:
      jaffle_shop:
        marts:
          # ???`
    }
  ],
  options: [
    `~+contract: {enforced: true}~`,
    `~+constraints: [{type: not_null}]~`,
    `~+access: public~`,
    `~+materialized: table~`
  ],
  answer: 0,
  exp: [
    `~contract~ can be set in ~dbt_project.yml~, in the properties YAML or in the model's ~config()~. In the ~marts~ folder, every model then requires ~name~ and ~data_type~ for each column in the YAML.`,
    `~access: public~ doesn't enforce a contract, although combining them is good practice. Constraints depend on the contract, not the other way around.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/contract'
},
{
  id: 'd2-v-file', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `You declare ~versions: [{v: 1}, {v: 2}]~ for ~dim_customers~ and don't set ~defined_in~. By default, which file does dbt expect to contain the SQL for version 2?`,
  options: [
    `~dim_customers_v2.sql~`,
    `~v2/dim_customers.sql~`,
    `~dim_customers.v2.sql~`,
    `~dim_customers_2.sql~`
  ],
  answer: 0,
  exp: [
    `The convention is ~<model_name>_v<v>~, both for the file and for the relation created (~dim_customers_v2~). ~defined_in~ allows a different file, but the documentation recommends following the convention.`,
    `The "latest" version can also live in ~dim_customers.sql~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'd2-v-selectors', d: 'd2', type: 'match',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Match each version selector to what it selects.`,
  left: [
    `~version:latest~`,
    `~version:prerelease~`,
    `~version:old~`,
    `~version:none~`
  ],
  right: [
    `Only the version marked as latest_version`,
    `Versions newer than latest_version`,
    `Versions older than latest_version`,
    `Models that are not versioned`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `These selectors help in version workflows. For example, ~dbt build --exclude version:old~ avoids rebuilding old versions in development, and ~--select dim_customers,version:latest~ builds only the current version.`,
    `Selecting ~dim_customers~ with no filter includes **all** versions.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#version'
},
{
  id: 'd2-v-exclude', d: 'd2', type: 'mc',
  codeOptions: true,
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_customers~ v1 has all columns declared at the model level. Version 2 is identical except that it drops ~country_name~. Which YAML declares v2 correctly?`,
  options: [
    `
    versions:
      - v: 1
      - v: 2
        columns:
          - include: all
            exclude: [country_name]`,
    `
    versions:
      - v: 1
      - v: 2
        exclude_columns: [country_name]`,
    `
    versions:
      - v: 1
      - v: 2
        config:
          exclude: country_name`,
    `
    versions:
      - v: 1
      - v: 2
        columns:
          - name: country_name
            enabled: false`
  ],
  answer: 0,
  exp: [
    `Under ~versions~, each version inherits the model's columns and declares only the differences. ~include: all~ with ~exclude: [...]~ is the syntax for "all except these". Versions can also have their own configs (~config:~), including a different materialization.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/versions'
},
{
  id: 'd2-v-pin', d: 'd2', type: 'fill',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~latest_version~ of ~dim_customers~ was bumped to 2, but your model must keep reading version 1 during the migration window. Complete the blank: ~{{ ref('dim_customers', ___=1) }}~`,
  accept: [
    `v`,
    `version`
  ],
  exp: [
    `~ref('dim_customers', v=1)~ (or ~version=1~) pins the version. Without the argument, the ref resolves to ~latest_version~, and dbt warns when there is a newer prerelease version.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref#versioned-ref'
},
{
  id: 'd2-k-composite', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `~fct_order_lines~ has a composite primary key of ~(order_id, line_number)~. How should you declare this primary key constraint?`,
  options: [
    `As a model-level constraint: ~constraints: [{type: primary_key, columns: [order_id, line_number]}]~`,
    `As a ~primary_key~ constraint on each of the two columns`,
    `With ~unique_key: ['order_id', 'line_number']~`,
    `With ~+primary_key: [order_id, line_number]~ in ~dbt_project.yml~`
  ],
  answer: 0,
  exp: [
    `Multi-column constraints (such as a composite PK) **must** be declared at the model level, with the ~columns~ list. Two separate ~primary_key~ constraints would define two PKs, which is invalid.`,
    `~unique_key~ is an incremental config and doesn't create a constraint. Remember that constraints require an enforced contract and only apply to ~table~ and ~incremental~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-k-fk', d: 'd2', type: 'mc',
  codeOptions: true,
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `In dbt 1.9 or later, which YAML correctly declares a foreign key from ~fct_orders.customer_id~ to ~dim_customers.customer_id~ in a way that also captures the dependency between the models?`,
  options: [
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: foreign_key
          to: ref('dim_customers')
          to_columns: [customer_id]`,
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: foreign_key
          references: dim_customers.customer_id`,
    `
    - name: customer_id
      data_type: int
      data_tests:
        - type: foreign_key
          to: ref('dim_customers')`,
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: relationships
          field: customer_id`
  ],
  answer: 0,
  exp: [
    `Since 1.9, foreign keys use ~to~ (usually ~ref()~ or ~source()~) and ~to_columns~. With ~ref()~, dbt records the dependency and resolves the right name in each environment.`,
    `~relationships~ is a **data test**, not a constraint. Remember that on several platforms (Snowflake, BigQuery, Redshift) FKs are created but not enforced.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-k-postgres', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `On Postgres, ~fct_payments~ is a table with an enforced contract and a ~check~ constraint with ~expression: "amount >= 0"~. New data includes a payment with ~amount = -10~. What happens on ~dbt run~?`,
  options: [
    `The build fails, because Postgres rejects the row that violates the check constraint.`,
    `The model builds and dbt logs a warning about the invalid row.`,
    `dbt filters out the invalid row before inserting.`,
    `The constraint is ignored, as it would be on Snowflake.`
  ],
  answer: 0,
  exp: [
    `Postgres enforces every constraint type (~not_null~, ~unique~, ~primary_key~, ~foreign_key~, ~check~). The insert is rejected and the model build fails.`,
    `The behavior depends on the platform: Snowflake ignores ~check~ (with a warning), and Databricks enforces ~not_null~ and ~check~ after the table is created. dbt never filters rows because of constraints.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-a-private', d: 'd2', type: 'mc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `~finance_model~ belongs to the ~finance~ group and has ~access: private~. A model in the ~marketing~ group adds ~{{ ref('finance_model') }}~. What happens?`,
  options: [
    `dbt raises a ~DbtReferenceError~ at parse time, because the model is private to the finance group.`,
    `The ref works, but dbt logs a deprecation warning.`,
    `The ref works only when the command is ~dbt build~.`,
    `dbt builds a private copy of ~finance_model~ in the marketing schema.`
  ],
  answer: 0,
  exp: [
    `~private~: only models in the **same group** can reference it; any other ~ref~ fails at parse time. To open access, the owner can change it to ~protected~ (same project) or ~public~ (other projects too).`,
    `Access controls who can use the model in ~ref()~; it isn't a database permission, which is the job of ~grants~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd2-a-ephemeral', d: 'd2', type: 'mc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `A model configured with ~materialized: ephemeral~ also sets ~access: public~. What happens when dbt parses the project?`,
  options: [
    `A parsing error, because ephemeral models cannot be public.`,
    `dbt automatically materializes the model as a view so other projects can read it.`,
    `It parses normally; other projects can ref the model as a CTE.`,
    `dbt logs a warning and changes access to protected.`
  ],
  answer: 0,
  exp: [
    `~public~ models need to exist in the warehouse so other projects can read them, and ephemeral is never materialized. dbt rejects the combination with a parse error (*invalid value (public) for the access field*).`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd2-a-grants-domc', d: 'd2', type: 'domc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Which statement about model access is correct?`,
  options: [
    `Setting ~access: public~ does not grant any database privileges; the ~grants~ config handles that.`,
    `The default access level for models is ~private~.`,
    `Access can be configured on seeds, snapshots, and sources.`,
    `Private models are hidden from the documentation site for users of the same project.`
  ],
  answer: 0,
  exp: [
    `Access governs **references between models** (~ref~), not warehouse permissions. The default is ~protected~, and governance features (access, contracts, versions) apply only to models.`,
    `Anyone with development access to the project sees every model, including private ones.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd4-fp-cautious', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `In a fresh CI schema without deferral, you run ~dbt build --select fct_orders~. A ~relationships~ test from ~fct_orders.customer_id~ to ~dim_customers~ errors because ~dim_customers~ was never built in that schema. Which option makes dbt skip tests that reference unselected nodes?`,
  options: [
    `~--indirect-selection=cautious~`,
    `~--indirect-selection=eager~`,
    `~--fail-fast~`,
    `~--exclude-resource-type unit_test~`
  ],
  answer: 0,
  exp: [
    `Indirect selection: ~eager~ (default) runs every test that references a selected node, even if it depends on unselected nodes; ~cautious~ only runs tests whose parents are **all** selected; ~buildable~ accepts parents that are selected or ancestors of selected nodes; ~empty~ runs no indirect tests.`,
    `Another solution is to use ~--defer~ so ~dim_customers~ is read from production.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/test-selection-examples'
},
{
  id: 'd4-fp-threads', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `A project has 120 models with many independent branches. The log shows models starting strictly one at a time, and the profile has ~threads: 1~. What is the simplest way to shorten the run?`,
  options: [
    `Increase ~threads~ (in the profile or with ~--threads 8~), so independent nodes run in parallel.`,
    `Add ~--fail-fast~.`,
    `Materialize all models as ephemeral.`,
    `Run with ~--empty~.`
  ],
  answer: 0,
  exp: [
    `~threads~ sets how many nodes dbt runs at the same time, always respecting DAG dependencies. With 1 thread, everything runs serially. Increase it carefully, considering the warehouse's capacity.`,
    `The other options change the behavior or the result, not the parallelism.`
  ],
  doc: 'https://docs.getdbt.com/docs/running-a-dbt-project/using-threads'
},
{
  id: 'd4-fp-domc', d: 'd4', type: 'domc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `Which statement about how failures propagate in ~dbt build~ is correct?`,
  options: [
    `A test that returns WARN does not cause downstream nodes to be skipped.`,
    `When any model errors, dbt skips every remaining node in the run, including independent branches.`,
    `dbt automatically retries skipped nodes at the end of the run.`,
    `~--fail-fast~ only skips the downstream nodes of the failed node.`
  ],
  answer: 0,
  exp: [
    `Only ERROR (on a model) and FAIL (on a test with severity ~error~) cause downstream nodes to be skipped; WARN blocks nothing. Independent branches keep running.`,
    `~--fail-fast~ stops the whole run. To resume after fixing, use ~dbt retry~, which doesn't run on its own.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'd4-fp-store', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `A ~unique~ test on ~fct_orders.order_id~ fails in the nightly job. You want the failing rows saved in the warehouse so you can investigate them the next morning. What should you configure?`,
  options: [
    `~store_failures: true~ on the test (or ~--store-failures~ on the command)`,
    `~limit: 0~ on the test`,
    `~severity: warn~ on the test`,
    `~--log-level debug~ on the job`
  ],
  answer: 0,
  exp: [
    `With ~store_failures~, dbt stores the test result (the failing rows) in a table, by default in a schema with the ~dbt_test__audit~ suffix. ~store_failures_as~ lets you choose ~table~, ~view~ or ~ephemeral~.`,
    `• ~limit~ only reduces how many failures are returned.`,
    `• ~severity~ changes the status; it stores nothing.`,
    `• Debug logs show the SQL, not the rows.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures'
},
{
  id: 'd4-fp-incremental', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `~fct_page_views~ is a table rebuilt every hour from 2 billion append-only events. Each rebuild takes 45 minutes, and only the last hour's events are new. What is the best optimization?`,
  options: [
    `Make it incremental, processing only new events on each run.`,
    `Materialize it as a view.`,
    `Materialize it as ephemeral.`,
    `Add more data tests to the model.`
  ],
  answer: 0,
  exp: [
    `When *building* a table gets too slow and the data is mostly new (append-only), incremental is the next step. For very large time-series volumes, microbatch is also an option.`,
    `A view would move the cost to every query; ephemeral would be recomputed in every consumer.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/materializations/1-guide-overview'
},
{
  id: 'd4-fp-run-results', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `You want to find which nodes took the longest in last night's run, along with their final status. Which artifact holds per-node execution timing and status for the last invocation?`,
  options: [
    `~target/run_results.json~`,
    `~target/manifest.json~`,
    `~target/catalog.json~`,
    `~target/sources.json~`
  ],
  answer: 0,
  exp: [
    `~run_results.json~ records every executed node with its status, timings (~timing~, ~execution_time~) and messages. It is what ~dbt retry~ and the ~result:~ selector read.`,
    `~manifest.json~ describes the project (nodes, configs, dependencies); ~catalog.json~ holds warehouse metadata for the documentation; ~sources.json~ holds freshness results.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/run-results-json'
},
{
  id: 'd4-fp-order', d: 'd4', type: 'order',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `The nightly production job failed on one model. Put the troubleshooting steps in a sensible order.`,
  items: [
    `Identify the failing node and the error category in the logs`,
    `Inspect the compiled SQL in ~target/~ and reproduce the error in the warehouse`,
    `Fix it in a feature branch and run ~dbt build~ on the node and its children`,
    `Merge the fix through the CI job and code review`,
    `Resume the production run from the point of failure (for example, with ~dbt retry~)`
  ],
  exp: [
    `Diagnose (log and error category) → reproduce (compiled SQL) → fix and test in development → go through CI and review → resume production without redoing what already succeeded.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd4-cl-bi', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `An analyst modified 3 models in development and wants to check a Tableau dashboard pointed at their dev schema. The dashboard also reads 20 unmodified upstream models that don't exist in the dev schema. What is the most cost-effective way to make them available?`,
  options: [
    `Run ~dbt clone --state prod-artifacts~ for the unmodified models, so they exist in the dev schema as clones or pointer views.`,
    `Run the dev build with ~--defer~; Tableau will then find the production objects in the dev schema.`,
    `Rebuild all 23 models from scratch in the dev schema.`,
    `Run ~dbt docs generate~ so Tableau can read the catalog.`
  ],
  answer: 0,
  exp: [
    `External tools, such as BI tools, need **real objects** in the schema. ~--defer~ only redirects ~ref()~ calls during dbt compilation and creates nothing in the dev schema. ~dbt clone~ creates zero-copy clones (or views, where that isn't supported) at little cost.`,
    `Rebuilding everything works, but it is expensive.`
  ],
  doc: 'https://docs.getdbt.com/blog/to-defer-or-to-clone'
},
{
  id: 'd4-cl-refresh', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `Last week you cloned production into your dev schema. Production has changed since then, but running ~dbt clone --state prod-artifacts~ again leaves your existing clones untouched. What should you run?`,
  options: [
    `~dbt clone --state prod-artifacts --full-refresh~`,
    `~dbt retry~`,
    `~dbt clone --state prod-artifacts --empty~`,
    `Delete the ~target/~ folder and run the same command`
  ],
  answer: 0,
  exp: [
    `By default, ~dbt clone~ does **not** recreate relations that already exist in the target. ~--full-refresh~ forces recreation from the given state. To speed it up, increase ~--threads~, since the clones are independent.`,
    `~target/~ holds local artifacts and doesn't affect warehouse objects.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'd4-cl-uses', d: 'd4', type: 'multi',
  choose: 2,
  topic: 'Using dbt clone',
  stem: `Which two are documented use cases for ~dbt clone~? (Choose two.)`,
  options: [
    `Blue/green deployments on warehouses that support zero-copy cloning`,
    `Cloning the current production state into development schemas`,
    `Migrating data between two different warehouse vendors`,
    `Restoring deleted rows from snapshot history`,
    `Replacing source freshness checks`
  ],
  answers: [0, 1],
  exp: [
    `The documentation lists: blue/green deployment, bringing the production state into development schemas, handling incremental models in CI and testing changes in BI tools.`,
    `Clone works within the same warehouse, starting from the objects described in the ~--state~ artifacts.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'd4-cl-state', d: 'd4', type: 'fill',
  topic: 'Using dbt clone',
  stem: `Complete the command that clones every model from the production artifacts into your current target: ~dbt clone --______ path/to/prod-artifacts~`,
  accept: [
    `state`
  ],
  exp: [
    `~dbt clone~ clones the selected nodes **from the state given** in ~--state~ (the production ~manifest.json~). With ~--select~ you limit what is cloned.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
}
);
