/* Exam 2 (exam: p2), domains 2 to 4. */
window.DBT_Q.push(
{
  id: 'p2-d2-contract-mismatch', d: 'd2', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `A developer adds the column ~loyalty_tier~ to the ~select~ in ~dim_customers.sql~ but doesn't edit this YAML. What happens on ~dbt run --select dim_customers~?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      text: `
    models:
      - name: dim_customers
        config:
          contract:
            enforced: true
        columns:
          - name: customer_id
            data_type: int
          - name: customer_name
            data_type: varchar`
    }
  ],
  options: [
    `The model builds, and dbt drops ~loyalty_tier~ so that the table matches the contract.`,
    `The model builds with the new column, and dbt logs a warning about the contract.`,
    `The model fails before the table is built, with an error that lists the mismatch.`,
    `The model fails after the table is built, and dbt rolls back to the previous table.`
  ],
  answer: 2,
  exp: [
    `With ~contract.enforced: true~, dbt compares the names and types of the columns the query returns with the YAML before building. Any difference, including an extra column, stops the model.`
  ],
  why: [
    `dbt doesn't adjust the query to the contract; it refuses to build.`,
    `A contract violation is an error, not a warning.`,
    `The check happens before the table is created and the error shows the mismatched columns.`,
    `The check comes before creation; nothing gets built only to be undone later.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'p2-d2-contract-support', d: 'd2', type: 'multi', exam: 'p2', lvl: 3,
  choose: 2,
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `Which two models can have an enforced contract? (Choose two.)`,
  options: [
    `A SQL ~table~ model whose YAML declares every column`,
    `A SQL ~incremental~ model with ~on_schema_change: append_new_columns~`,
    `A SQL ~incremental~ model with ~on_schema_change: sync_all_columns~`,
    `A Python ~table~ model whose YAML declares every column`,
    `A SQL ~ephemeral~ model whose YAML declares every column`
  ],
  answers: [0, 1],
  exp: [
    `Contracts apply to SQL models materialized as ~table~, ~view~ or ~incremental~. For incremental, only with ~on_schema_change~ set to ~append_new_columns~ or ~fail~.`
  ],
  why: [
    `A SQL model as a ~table~ is the basic case.`,
    `Incremental is accepted with ~append_new_columns~ or ~fail~.`,
    `~sync_all_columns~ could remove columns and break the contract, so it isn't accepted.`,
    `Python models don't support contracts.`,
    `An ephemeral model creates no relation, so there is nowhere to enforce the contract.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'p2-d2-constraints-platform', d: 'd2', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `On Snowflake, the query of ~dim_customers~ returns two rows with the same ~email~ and no NULL ~customer_id~. What happens on ~dbt run~?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      text: `
    models:
      - name: dim_customers
        config:
          materialized: table
          contract:
            enforced: true
        columns:
          - name: customer_id
            data_type: int
            constraints:
              - type: not_null
          - name: email
            data_type: varchar
            constraints:
              - type: unique`
    }
  ],
  options: [
    `The run fails, because Snowflake rejects the duplicate when the table is loaded.`,
    `The run succeeds, and dbt then runs a ~unique~ data test generated from the constraint.`,
    `The run fails at parse time, because ~unique~ constraints aren't allowed on Snowflake.`,
    `The run succeeds; Snowflake records the ~unique~ constraint but doesn't enforce it.`
  ],
  answer: 3,
  exp: [
    `Constraints are enforced by the platform, and each platform decides what it enforces. On Snowflake, only ~not_null~ is enforced; ~unique~, ~primary_key~ and ~foreign_key~ are recorded as metadata. To guarantee uniqueness there, use a data test.`
  ],
  why: [
    `Snowflake accepts the ~unique~ constraint, but doesn't check it on load.`,
    `Constraints don't generate data tests; they are separate things.`,
    `~unique~ is supported on Snowflake (defined, not enforced). The one that isn't supported is ~check~.`,
    `The table is created with the declared constraint and both rows get in.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'p2-d2-constraints-fill', d: 'd2', type: 'fill', exam: 'p2', lvl: 1, art: 'yaml',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `Complete the model-level constraint type that declares ~order_id~ plus ~line_number~ as the table's primary key.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      text: `
    models:
      - name: fct_order_lines
        config:
          contract: {enforced: true}
        constraints:
          - type: ______
            columns: [order_id, line_number]`
    }
  ],
  accept: [
    `primary_key`
  ],
  exp: [
    `Keys with more than one column are declared at the model level, with ~type: primary_key~ and the ~columns~ list. Constraints require a contract with ~enforced: true~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'p2-d2-versions-ref', d: 'd2', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `With default aliases, which relations do ~{{ ref('dim_customers') }}~ and ~{{ ref('dim_customers', v=3) }}~ resolve to?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
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
    `~dim_customers_v3~ and ~dim_customers_v3~`,
    `~dim_customers_v2~ and ~dim_customers_v3~`,
    `~dim_customers_v3~ and a compilation error`,
    `~dim_customers_v2~ and a compilation error`
  ],
  answer: 1,
  exp: [
    `A ~ref()~ without a version goes to ~latest_version~ (2). Version 3, above it, is a prerelease: it exists and can be referenced with ~v=3~. Each version's default alias is ~<model>_v<version>~.`
  ],
  why: [
    `The highest version would only be "latest" if ~latest_version~ weren't set.`,
    `Without a version it goes to v2 (~latest_version~); with ~v=3~ it goes to v3.`,
    `The unversioned ref doesn't go to v3, and pinning v3 doesn't raise an error.`,
    `A prerelease version can be referenced normally by anyone who pins the version.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'p2-d2-deprecation', d: 'd2', type: 'multi', exam: 'p2', lvl: 1,
  choose: 2,
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Version 1 of ~dim_customers~ has ~deprecation_date: 2026-01-31~. Today is 2026-03-10, and ~fct_orders~ still uses ~ref('dim_customers', v=1)~. Which two statements are correct? (Choose two.)`,
  options: [
    `dbt logs a warning that ~fct_orders~ references a deprecated model.`,
    `~fct_orders~ keeps building against v1 until its ref is changed.`,
    `dbt stops building v1 now that the date has passed.`,
    `The ref now resolves to the latest version automatically.`,
    `Parsing fails until the ref points to a version that is still supported.`
  ],
  answers: [0, 1],
  exp: [
    `~deprecation_date~ is a deadline notice. After the date, dbt only raises warnings; nothing is turned off or redirected. Anyone who wants to treat it as an error can promote the warning with ~--warn-error-options~.`
  ],
  why: [
    `Referencing a model past its date raises a warning.`,
    `The model keeps existing and being built; the ref stays valid.`,
    `dbt doesn't disable or remove the model on its own.`,
    `A ref pinned to ~v=1~ keeps pointing to v1.`,
    `It is a warning, not a parsing error.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/deprecation_date'
},
{
  id: 'p2-d2-versions-domc', d: 'd2', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Which statement about model versions is correct?`,
  options: [
    `By default, the SQL for version 2 of ~dim_customers~ lives in ~dim_customers_v2.sql~.`,
    `A version above ~latest_version~ isn't built until it is promoted to latest.`,
    `Every version must repeat the model's complete list of columns in the YAML.`,
    `All versions share one relation, with a ~version~ column to tell rows apart.`
  ],
  answer: 0,
  exp: [
    `Each version has its own file, by default ~<model>_v<version>.sql~ (you can change that with ~defined_in~).`
  ],
  why: [
    `This is the default file naming convention per version (you can change it with ~defined_in~).`,
    `Prerelease versions are built normally; they just don't receive unversioned refs.`,
    `Columns are inherited from the model level; each version declares only the differences, with ~include~ and ~exclude~.`,
    `Each version is its own relation, by default with the ~_v<version>~ suffix.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'p2-d3-log-db', d: 'd3', type: 'mc', exam: 'p2', lvl: 3, art: 'log',
  topic: 'Understanding logged error messages',
  stem: `What does this log tell you, and what is the best next step?`,
  code: [
    {
      lang: 'log',
      label: 'terminal',
      text: `
    14:02:11  1 of 1 START sql table model marts.fct_orders ......... [RUN]
    14:02:13  1 of 1 ERROR creating sql table model marts.fct_orders  [ERROR in 1.92s]
    14:02:13  Database Error in model fct_orders (models/marts/fct_orders.sql)
    14:02:13    000904 (42000): SQL compilation error: error line 12 at position 4
    14:02:13    invalid identifier 'ORDER_TOTAL'
    14:02:13    compiled code at target/run/jaffle_shop/models/marts/fct_orders.sql`
    }
  ],
  options: [
    `The warehouse rejected the SQL that dbt sent; rerun with ~--full-refresh~ so that the table is recreated with the new column.`,
    `The warehouse rejected the SQL that dbt sent; find which upstream relation should provide ~order_total~ and fix the ~select~.`,
    `The warehouse rejected the SQL that dbt sent; declare ~order_total~ and its ~data_type~ under ~columns:~ in the model's YAML.`,
    `dbt failed while rendering the model; fix the Jinja on line 12 of ~fct_orders.sql~ and run ~dbt compile~ to confirm it.`
  ],
  answer: 1,
  exp: [
    `"Database Error" means dbt compiled and sent the SQL, and the warehouse refused it. The text "SQL compilation error" comes from Snowflake, not from Jinja. Line 12 refers to the compiled SQL.`
  ],
  why: [
    `The diagnosis is right, but recreating the table repeats the same invalid query.`,
    `The error is from the database: the column doesn't exist in the relations read. The file in ~target/run~ shows the exact SQL.`,
    `The diagnosis is right, but the properties YAML documents columns; it doesn't create them in the query.`,
    `A Jinja failure shows up as a dbt "Compilation Error", before any query. Line 12 is from the compiled SQL.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-log-ref', d: 'd3', type: 'mc', exam: 'p2', lvl: 2, art: 'log',
  topic: 'Understanding logged error messages',
  stem: `The project contains ~models/staging/stg_orders.sql~. ~dbt run~ stops with the message below. What is the cause and the fix?`,
  code: [
    {
      lang: 'log',
      label: 'terminal',
      text: `
    Compilation Error in model fct_orders (models/marts/fct_orders.sql)
      Model 'model.jaffle_shop.fct_orders' (models/marts/fct_orders.sql) depends on a node named 'stg_order' which was not found`
    }
  ],
  options: [
    `The relation ~stg_order~ is missing from the target schema; build it first with ~dbt run --select stg_order~.`,
    `The model ~stg_order~ failed in the previous run; rerun it so that the models that depend on it can compile.`,
    `The model ~stg_order~ isn't declared in any YAML file; add it under ~models:~ so that ~ref()~ can resolve it.`,
    `No enabled model named ~stg_order~ exists in the project; correct the name inside the ~ref()~ call.`
  ],
  answer: 3,
  exp: [
    `"Compilation Error ... depends on a node named ... which was not found" appears when dbt builds the DAG, before talking to the warehouse: the name inside ~ref()~ doesn't match any active model.`
  ],
  why: [
    `The error happens before any query; whether the table exists isn't even checked.`,
    `dbt discovers models from the project files, not from the results of previous runs.`,
    `A model exists for dbt because of its ~.sql~ file; the YAML is optional.`,
    `~stg_order~ is a typo for ~stg_orders~.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-compiled', d: 'd3', type: 'multi', exam: 'p2', lvl: 2,
  choose: 2,
  topic: 'Troubleshooting using compiled code',
  stem: `After ~dbt run --select fct_orders~, which two statements about the files under ~target/~ are correct? (Choose two.)`,
  options: [
    `~target/compiled/~ holds the model's ~select~ with the Jinja already rendered.`,
    `~target/run/~ holds the statement dbt executed, with the DDL around the ~select~.`,
    `~target/compiled/~ holds the model as written, with the Jinja still in place.`,
    `~target/run/~ holds the rows the model returned, for inspection after a failure.`,
    `~target/compiled/~ is written only by ~dbt compile~, not by ~dbt run~.`
  ],
  answers: [0, 1],
  exp: [
    `~target/compiled~ has the plain ~select~, good for pasting into the warehouse and debugging. ~target/run~ has the full command dbt executed, such as ~create or replace table ... as (...)~.`
  ],
  why: [
    `It is the model's SQL with refs, sources and macros already resolved.`,
    `It includes the materialization's DDL or DML around the ~select~.`,
    `The code with Jinja is the file itself in ~models/~.`,
    `dbt doesn't write the model's data to files.`,
    `~dbt run~, ~dbt build~ and ~dbt test~ also compile and write these files.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-yaml-hotspot', d: 'd3', type: 'hotspot', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt parse~ fails with a YAML syntax error in this file. Click the line that is indented incorrectly.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_models.yml',
      hotspot: true,
      text: `
    models:
      - name: stg_orders
        description: One row per order
        columns:
          - name: order_id
            data_tests:
              - unique
              - not_null
          - name: status
          description: Order status
            data_tests:
              - accepted_values:
                  arguments:
                    values: ['placed', 'shipped']`
    }
  ],
  answer: 9,
  exp: [
    `The ~description~ of the ~status~ column must be aligned with ~name~ (two spaces after the dash), like ~data_tests~ right below it. As it is, it falls out of the list item and the YAML becomes invalid.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-yaml-dup', d: 'd3', type: 'mc', exam: 'p2', lvl: 2, art: 'log',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt build~ stops with the message below. What is the cause and the fix?`,
  code: [
    {
      lang: 'log',
      label: 'terminal',
      text: `
    Compilation Error
      dbt found two schema.yml entries for the same resource named stg_orders. Resources and their
      associated patches (i.e. schema.yml entries) must have unique names. To fix this, please delete
      or rename one of the entries.
       - models/staging/_stg_models.yml
       - models/staging/orders/_orders.yml`
    }
  ],
  options: [
    `One file lists ~stg_orders~ under ~models:~ and the other under ~sources:~; rename the source table.`,
    `Both files have an entry for ~stg_orders~ under ~models:~; move one of the files to another folder.`,
    `One file lists ~stg_orders~ under ~models:~ and the other under ~seeds:~; delete the seed's entry.`,
    `Both files have an entry for ~stg_orders~ under ~models:~; merge them into a single entry.`
  ],
  answer: 3,
  exp: [
    `Each resource can have only one properties entry (a "patch"). Here the ~stg_orders~ model appears under ~models:~ in both files listed. Merge everything into a single entry.`
  ],
  why: [
    `A source table is identified by source and table; it doesn't compete for the name with a model.`,
    `The diagnosis is right, but the folder doesn't matter: both entries would still describe the same model.`,
    `A model and a seed with the same name produce a different error, about two resources with the same name.`,
    `Each resource can have only one properties entry. Merge everything into one.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-fix-order', d: 'd3', type: 'order', exam: 'p2', lvl: 2,
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `A model fails in production because an upstream column was renamed. Put the steps of a safe fix in order.`,
  items: [
    `Create a branch from the main branch.`,
    `On the new branch, reproduce the error by building the model in your development schema.`,
    `Change the SQL and run ~dbt build --select~ on the model and its children in development.`,
    `Open a pull request and let the CI job build and test the change.`,
    `Merge after the checks pass, so that the next production run uses the fix.`
  ],
  exp: [
    `Isolate the change on a branch, reproduce, fix and validate in development, validate again in CI and only then merge.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-fix-build', d: 'd3', type: 'mc', exam: 'p2', lvl: 2, art: 'cli',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You changed ~int_orders~ on your branch. Your development schema is empty, and the upstream staging models take hours to build. A copy of the production ~manifest.json~ is in ~prod-artifacts/~. Which command builds and tests only ~int_orders~ and its children, reading the untouched parents from production?`,
  options: [
    `~dbt build --select int_orders+ --state prod-artifacts --full-refresh~`,
    `~dbt build --select int_orders+ --defer --state prod-artifacts~`,
    `~dbt build --select +int_orders+ --state prod-artifacts~`,
    `~dbt clone --select int_orders+ --state prod-artifacts~`
  ],
  answer: 1,
  exp: [
    `~--state~ only says where the comparison manifest is. ~--defer~ is what makes ~ref()~ calls to unselected models point to the production relations.`
  ],
  why: [
    `Without ~--defer~, refs keep pointing to the development schema, where the parents don't exist.`,
    `It builds and tests only what was selected, reading the parents from production.`,
    `The leading ~+~ tells dbt to build the parents in development, which is what you want to avoid.`,
    `Clone copies the production versions of these models; it doesn't run the changed SQL.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'p2-d3-flags-precedence', d: 'd3', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Managing dbt behavior with flags',
  stem: `The CI environment also sets the environment variable for this same flag to ~buildable~. The job runs ~dbt test --select stg_orders~ with no other options. Which mode does dbt use?`,
  code: [
    {
      lang: 'yaml',
      label: 'dbt_project.yml',
      text: `
    flags:
      indirect_selection: cautious`
    }
  ],
  options: [
    `~cautious~, because flags in ~dbt_project.yml~ override environment variables.`,
    `~eager~, because the default applies when two settings disagree with each other.`,
    `None: dbt raises an error when the same flag is set in two different places.`,
    `~buildable~, because environment variables override flags in ~dbt_project.yml~.`
  ],
  answer: 3,
  exp: [
    `For global flags, the order is: the command-line option, then the environment variable, then ~flags:~ in ~dbt_project.yml~.`
  ],
  why: [
    `~dbt_project.yml~ is the lowest-priority level.`,
    `There is no falling back to the default: the highest-priority setting applies.`,
    `Setting the flag in more than one place is allowed.`,
    `The environment variable beats the project; only a command-line option would beat both.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/about-global-configs'
},
{
  id: 'p2-d3-flags-domc', d: 'd3', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Managing dbt behavior with flags',
  stem: `Which statement about behavior change flags is correct?`,
  options: [
    `They are set under ~flags:~ in ~dbt_project.yml~, not as CLI options or environment variables.`,
    `When one is introduced it is on by default, and projects can opt out of it until it is removed.`,
    `They are how dbt ships fixes for defects without waiting for the next minor version.`,
    `A value set in ~profiles.yml~ overrides the one in ~dbt_project.yml~ for that user.`
  ],
  answer: 0,
  exp: [
    `Behavior change flags can only be set in the ~flags:~ dictionary in ~dbt_project.yml~, so the choice applies to everyone and is versioned.`
  ],
  why: [
    `That is the documentation's rule for this kind of flag.`,
    `A flag starts off; it only becomes on by default when it matures.`,
    `A bug fix isn't a behavior change and doesn't get a flag.`,
    `Project flags go in ~dbt_project.yml~; ~profiles.yml~ isn't the place for them.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'p2-d4-warn-skip', d: 'd4', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `~dim_customers~ selects from ~stg_customers~. With the config below, ~dbt build~ produced this log. The team wants any duplicated e-mail, even a single one, to stop ~dim_customers~ from being built. Which change does that?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_models.yml',
      text: `
    models:
      - name: stg_customers
        columns:
          - name: email
            data_tests:
              - unique:
                  config:
                    warn_if: ">10"
                    error_if: ">100"`
    },
    {
      lang: 'log',
      label: 'terminal',
      text: `
    3 of 6 START test unique_stg_customers_email ................ [RUN]
    3 of 6 WARN 14 unique_stg_customers_email ................... [WARN 14 in 0.84s]
    4 of 6 START sql table model marts.dim_customers ............ [RUN]
    4 of 6 OK created sql table model marts.dim_customers ....... [SUCCESS 1 in 2.10s]`
    }
  ],
  options: [
    `Set ~severity: error~ in the test's ~config~, next to the two thresholds.`,
    `Change ~warn_if~ to ~"!=0"~, or remove the ~warn_if~ line from the config.`,
    `Change ~error_if~ to ~"!=0"~, or remove the ~error_if~ line from the config.`,
    `Add ~--fail-fast~ to the ~dbt build~ command that the nightly job runs.`
  ],
  answer: 2,
  exp: [
    `Severity is already ~error~ by default. The test only warned because 14 doesn't exceed 100 (~error_if~) and does exceed 10 (~warn_if~). Only an error result makes ~dbt build~ skip the following nodes.`
  ],
  why: [
    `~error~ is already the default, so nothing changes: 14 is still below ~error_if~.`,
    `This only makes the test warn on any duplicate; a warning blocks nothing.`,
    `With ~error_if~ at ~!=0~ (the default), any duplicate becomes an error and ~dim_customers~ is skipped.`,
    `~--fail-fast~ stops the run at the first error; a warning doesn't count.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d4-failpoints', d: 'd4', type: 'multi', exam: 'p2', lvl: 2,
  choose: 2,
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `A ~dbt build~ with 8 threads and no ~--fail-fast~ hits a database error in ~int_payments~. Which two statements are correct? (Choose two.)`,
  options: [
    `The data tests defined on ~int_payments~ are reported as SKIP.`,
    `Models in branches that don't depend on ~int_payments~ still build.`,
    `Models that depend on ~int_payments~ are reported as ERROR as well.`,
    `dbt retries ~int_payments~ once before it reports the node as ERROR.`,
    `Nodes that haven't started yet are cancelled and reported as SKIP.`
  ],
  answers: [0, 1],
  exp: [
    `An error skips only what depends on the failed node. The rest of the DAG continues, unless ~--fail-fast~ is on.`
  ],
  why: [
    `The model's tests depend on it and are skipped along with it.`,
    `Independent branches continue normally.`,
    `Dependents show up as SKIP; ERROR is only the node that failed.`,
    `dbt doesn't rerun nodes on its own; that is what ~dbt retry~ is for.`,
    `Stopping everything at the first error is the behavior of ~--fail-fast~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'p2-d4-clone-vs-defer', d: 'd4', type: 'mc', exam: 'p2', lvl: 3, art: 'cli',
  topic: 'Using dbt clone',
  stem: `On Snowflake, a CI job builds only the modified models into a pull-request schema. Reviewers point a BI tool at that schema and need to query every model, including the unmodified ones, without paying to rebuild them. Which approach fits?`,
  options: [
    `Run ~dbt clone --state~ first, so that unmodified models exist in the schema as clones.`,
    `Run the build with ~--favor-state~, so that production relations are copied into the schema.`,
    `Run ~dbt run --empty~ first, so that unmodified models exist in the schema at no cost.`,
    `Run the build with ~--defer --state~, so that unmodified models are read from production.`
  ],
  answer: 0,
  exp: [
    `~--defer~ only changes where ~ref()~ calls point during the dbt command; nothing appears in the PR schema. ~dbt clone~ actually creates the objects (zero-copy clones on Snowflake), and the BI tool can read them.`
  ],
  why: [
    `The clones exist in the schema, with production data and no rebuild cost.`,
    `~--favor-state~ only changes the ref resolution preference in defer; it copies nothing.`,
    `The models would exist, but empty.`,
    `With defer, unmodified models don't exist in the PR schema; the BI tool would have nothing to query.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'p2-d4-clone-fill', d: 'd4', type: 'fill', exam: 'p2', lvl: 1, art: 'cli',
  topic: 'Using dbt clone',
  stem: `Complete the flag that tells ~dbt clone~ where to find the manifest of the environment to clone from: ~dbt clone ______ prod-artifacts/~`,
  accept: [
    `--state`,
    `state`
  ],
  exp: [
    `~dbt clone~ needs ~--state~ with the folder that contains the source environment's ~manifest.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'p2-d4-clone-domc', d: 'd4', type: 'domc', exam: 'p2', lvl: 3,
  topic: 'Using dbt clone',
  stem: `Which statement about ~dbt clone~ is correct?`,
  options: [
    `On a warehouse without zero-copy cloning, it creates views that point at the source relations.`,
    `It rebuilds the selected models from their SQL and reads unselected parents from the other schema.`,
    `It overwrites relations that already exist in the target schema, unless ~--defer~ is passed.`,
    `It needs the ~run_results.json~ of the other environment to know which models succeeded.`
  ],
  answer: 0,
  exp: [
    `~dbt clone~ copies relations from the environment described in ~--state~ into the target schema: clones where the warehouse supports them, views pointing to the source where it doesn't.`
  ],
  why: [
    `This is the documented behavior for platforms without zero-copy cloning.`,
    `That describes ~dbt build --defer~. Clone doesn't run the models' SQL.`,
    `Relations that already exist are kept; only ~--full-refresh~ recreates them.`,
    `Clone uses the other environment's ~manifest.json~, not ~run_results.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
}
);
