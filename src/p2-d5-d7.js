/* Exam 2 (exam: p2), domains 5 to 7. */
window.DBT_Q.push(
{
  id: 'p2-d5-singular-warn', d: 'd5', type: 'mc', exam: 'p2', lvl: 3, art: 'sql',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `This singular test returns 3 rows and blocks the nightly ~dbt build~. The team wants it to keep reporting those rows, but only as a warning. Which change does that?`,
  code: [
    {
      lang: 'sql',
      label: 'tests/assert_no_negative_totals.sql',
      text: `
    select order_id
    from {{ ref('fct_orders') }}
    where order_total < 0`
    }
  ],
  options: [
    `Add ~{{ config(warn_if='>0') }}~ at the top of the test's SQL file.`,
    `Add ~severity: warn~ to the ~data_tests~ of ~order_total~ in the model's YAML.`,
    `Add ~--warn-error-options~ to the ~dbt build~ command of the nightly job.`,
    `Add ~{{ config(severity='warn') }}~ at the top of the test's SQL file.`
  ],
  answer: 3,
  exp: [
    `A singular test is configured with ~config()~ in the SQL file itself. With ~severity='warn'~, dbt ignores ~error_if~ and only evaluates ~warn_if~.`
  ],
  why: [
    `Not enough: the default severity is still ~error~ and the default ~error_if~ (~!=0~) is evaluated first, so 3 rows still produce an error.`,
    `This YAML entry configures generic tests applied to the column, not this singular test.`,
    `This option promotes warnings to errors; it doesn't go the other way.`,
    `The test's severity becomes warning, and the rows are still reported.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d5-thresholds', d: 'd5', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The query of this test returns 500 duplicated values. What is the result of the test?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/_stg_models.yml',
      text: `
    models:
      - name: stg_payments
        columns:
          - name: payment_id
            data_tests:
              - unique:
                  config:
                    severity: warn
                    error_if: ">100"`
    }
  ],
  options: [
    `ERROR, because 500 is above the ~error_if~ threshold of 100.`,
    `WARN, because ~severity: warn~ makes dbt skip the ~error_if~ check.`,
    `PASS, because no ~warn_if~ condition was set for the test.`,
    `ERROR, because a met ~error_if~ always takes priority over ~severity~.`
  ],
  answer: 1,
  exp: [
    `With ~severity: warn~, dbt skips ~error_if~ and only evaluates ~warn_if~, whose default is ~!=0~. Since 500 is not zero, the result is WARN.`
  ],
  why: [
    `~error_if~ is only evaluated when severity is ~error~.`,
    `The test can only warn; the default ~warn_if~ is met.`,
    `~warn_if~ defaults to ~!=0~ even when it isn't declared.`,
    `It is the opposite: severity decides whether ~error_if~ comes into play.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d5-store-failures', d: 'd5', type: 'domc', exam: 'p2', lvl: 2,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about a data test configured with ~store_failures: true~ is correct?`,
  options: [
    `Its failing rows are saved in a table that is replaced the next time the test runs.`,
    `Its failing rows are appended to an audit table, together with the time of each run.`,
    `Its failing rows are written to ~target/run_results.json~ at the end of each run.`,
    `Its result is always reported as a warning, since the rows are kept for review.`
  ],
  answer: 0,
  exp: [
    `With ~store_failures~, dbt stores the failing rows in a warehouse table (by default in a schema with the ~dbt_test__audit~ suffix). Each run replaces the previous result of the same test.`
  ],
  why: [
    `The table holds only the result of the most recent run.`,
    `There is no accumulated history; the table is overwritten.`,
    `~run_results.json~ holds the status and the failure count, not the rows.`,
    `Storing failures doesn't change the test's severity.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures'
},
{
  id: 'p2-d5-custom-generic', d: 'd5', type: 'mc', exam: 'p2', lvl: 2, art: 'sql',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Where does this block belong, and how is it applied to the column ~order_total~ of ~fct_orders~?`,
  code: [
    {
      lang: 'sql',
      label: 'is_positive.sql',
      text: `
    {% test is_positive(model, column_name) %}
    select *
    from {{ model }}
    where {{ column_name }} <= 0
    {% endtest %}`
    }
  ],
  options: [
    `In ~tests/generic/~; applied by listing ~is_positive~ under the column's ~data_tests~ in YAML.`,
    `In ~tests/~; dbt then runs it against every model automatically, as a singular test.`,
    `In ~macros/~; applied by calling ~{{ is_positive() }}~ in the ~where~ clause of the model.`,
    `In ~tests/generic/~; applied with ~{{ config(data_tests=['is_positive']) }}~ in the model's SQL.`
  ],
  answer: 0,
  exp: [
    `A ~{% test %}~ block defines a generic test. It lives in ~tests/generic/~ (or in ~macros/~) and is applied through YAML, where dbt fills in ~model~ and ~column_name~.`
  ],
  why: [
    `Right location and right way to use it.`,
    `Loose files in ~tests/~ are singular tests: a ~select~ without the ~{% test %}~ block, which takes no arguments.`,
    `The folder is accepted, but a generic test isn't called inside the model's SQL.`,
    `The location is right, but generic tests are applied in the properties YAML, not in ~config()~.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'p2-d5-unit-incremental', d: 'd5', type: 'mc', exam: 'p2', lvl: 3, art: 'yaml',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Given this incremental model and this unit test, which rows belong in ~expect~?`,
  code: [
    {
      lang: 'sql',
      label: 'models/marts/fct_events.sql',
      text: `
    {{ config(materialized='incremental') }}
    select * from {{ ref('stg_events') }}
    {% if is_incremental() %}
    where event_date > (select max(event_date) from {{ this }})
    {% endif %}`
    },
    {
      lang: 'yaml',
      label: 'models/marts/_unit_tests.yml',
      text: `
    unit_tests:
      - name: test_fct_events_incremental
        model: fct_events
        overrides:
          macros:
            is_incremental: true
        given:
          - input: ref('stg_events')
            rows:
              - {event_id: 1, event_date: 2026-03-01}
              - {event_id: 2, event_date: 2026-03-02}
              - {event_id: 3, event_date: 2026-03-03}
          - input: this
            rows:
              - {event_id: 1, event_date: 2026-03-01}
        expect:
          rows: # ?`
    }
  ],
  options: [
    `Events 1, 2 and 3: the table as it will look after the run.`,
    `Event 1: the row that is already present in ~this~.`,
    `Events 2 and 3: the rows that this run would insert or merge.`,
    `No rows: with the override, dbt only checks that the model compiles.`
  ],
  answer: 2,
  exp: [
    `In a unit test for an incremental model, ~expect~ describes what the query returns in that run, that is, the rows that would be inserted or merged, not the final state of the table.`
  ],
  why: [
    `The unit test doesn't simulate the merge; it compares only the query result.`,
    `That row is input data (~this~) and is excluded by the filter.`,
    `The filter only lets through events after 2026-03-01.`,
    `The override only fixes the value of ~is_incremental()~; the query runs and is compared.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-unit-parents', d: 'd5', type: 'mc', exam: 'p2', lvl: 2, art: 'cli',
  topic: 'Implementing various testing steps in the workflow',
  stem: `In a brand-new CI schema, with no production artifacts available, ~dbt test --select fct_orders~ fails on the unit tests of ~fct_orders~ because ~stg_orders~ and ~stg_payments~ don't exist there. What is the cheapest way to make those unit tests run?`,
  options: [
    `Set ~format: sql~ on every ~given~ input, so that dbt no longer looks up the parents.`,
    `Run ~dbt run --select "stg_orders stg_payments" --empty~ first, to create empty parents.`,
    `Run ~dbt compile --select fct_orders~ first, so that dbt writes the parents' compiled SQL.`,
    `Add ~--indirect-selection empty~ to the command, so that the parents aren't required.`
  ],
  answer: 1,
  exp: [
    `The direct parents of the tested model must exist in the warehouse, but they don't need data. The documentation recommends creating them with ~--empty~.`
  ],
  why: [
    `~format: sql~ changes how the input data is written; the parents still need to exist.`,
    `It creates the relations with the right schema and zero rows, at almost no cost.`,
    `Compiling doesn't create any relation in the warehouse.`,
    `This flag controls which tests are selected indirectly, not dependencies.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-unit-multi', d: 'd5', type: 'multi', exam: 'p2', lvl: 3,
  choose: 3,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which three statements about unit tests are correct? (Choose three.)`,
  options: [
    `They can only be defined for models written in SQL.`,
    `They are defined in YAML files inside the models directory.`,
    `An input that is an ephemeral model must use ~format: sql~.`,
    `They run as part of ~dbt run~, right before each model is built.`,
    `dbt Labs recommends running them in every production job.`,
    `They can replace data tests on materialized views.`
  ],
  answers: [0, 1, 2],
  exp: [
    `Unit tests check the SQL logic with fixed data. They live in YAML in the models folder, only apply to SQL models and should run in development and CI, not in production.`
  ],
  why: [
    `Python models can't have unit tests.`,
    `They are declared under ~unit_tests:~ in a YAML file inside ~models/~.`,
    `For ephemeral inputs, the documentation requires ~format: sql~.`,
    `They run with ~dbt test~ or ~dbt build~, not with ~dbt run~.`,
    `The recommendation is to run them only in development and CI.`,
    `Materialized views aren't supported by unit tests.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-assume-match', d: 'd5', type: 'match', exam: 'p2', lvl: 1,
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Match each assumption about the data to the test that checks it. One option is not used.`,
  left: [
    `Every ~customer_id~ in ~fct_orders~ exists in ~dim_customers~`,
    `~status~ is always one of four known values`,
    `There is no more than one row per ~order_id~`,
    `Refund totals never exceed order totals, a rule that spans two models`
  ],
  right: [
    `~relationships~`,
    `~accepted_values~`,
    `~unique~`,
    `A singular test`,
    `~not_null~`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `~relationships~ checks referential integrity, ~accepted_values~ checks the value domain, ~unique~ checks for duplicates, and business rules that span models call for a singular test (a ~select~ that returns the invalid rows).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'p2-d5-workflow-multi', d: 'd5', type: 'multi', exam: 'p2', lvl: 3, art: 'cli',
  choose: 2,
  topic: 'Implementing various testing steps in the workflow',
  stem: `A production job must build every model and run every data test, but skip unit tests. Which two commands do that? (Choose two.)`,
  options: [
    `~dbt build --exclude-resource-type unit_test~`,
    `~dbt build --exclude "test_type:unit"~`,
    `~dbt build --exclude "tag:unit_test"~`,
    `~dbt build --exclude unit_test~`,
    `~dbt build --exclude-resource-type test~`
  ],
  answers: [0, 1],
  exp: [
    `You can leave out unit tests by resource type (~--exclude-resource-type unit_test~) or with the ~test_type:unit~ selector in ~--exclude~. The rest of ~dbt build~ stays the same.`
  ],
  why: [
    `Excludes the ~unit_test~ resource type and keeps models and data tests.`,
    `Excludes only the unit tests; models and data tests remain.`,
    `It would only work if every unit test had been given that tag.`,
    `A bare name looks for a node called ~unit_test~; nothing is excluded.`,
    `The ~test~ type means data tests: they would be left out and the unit tests would stay.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-indirect-domc', d: 'd5', type: 'domc', exam: 'p2', lvl: 3, art: 'cli',
  topic: 'Implementing various testing steps in the workflow',
  stem: `~fct_orders~ has a ~relationships~ test that points to ~dim_customers~. Which statement about ~dbt test --select dim_customers~ is correct?`,
  options: [
    `In the default ~eager~ mode, the ~relationships~ test runs even though ~fct_orders~ wasn't selected.`,
    `In the default ~cautious~ mode, the ~relationships~ test is left out because ~fct_orders~ wasn't selected.`,
    `In the default ~buildable~ mode, the ~relationships~ test runs because ~fct_orders~ is an ancestor.`,
    `In the default ~empty~ mode, the ~relationships~ test is left out because it has two parents.`
  ],
  answer: 0,
  exp: [
    `The default indirect selection mode is ~eager~: a test runs if any of its parents was selected. ~cautious~ requires all parents to be selected.`
  ],
  why: [
    `In ~eager~, the default, one selected parent (~dim_customers~) is enough.`,
    `The description of ~cautious~ is right, but it isn't the default mode.`,
    `~buildable~ isn't the default, and ~fct_orders~ isn't an ancestor of ~dim_customers~.`,
    `~empty~ isn't the default; in that mode dbt runs no tests at all, whatever the number of parents.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/test-selection-examples'
},
{
  id: 'p2-d6-exposure-select', d: 'd6', type: 'mc', exam: 'p2', lvl: 2, art: 'yaml',
  topic: 'Implementing dbt exposures',
  stem: `Before the Monday refresh of this dashboard, a job must build and test the models the dashboard depends on and all of their upstream models, and nothing else. Which command does that?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_exposures.yml',
      text: `
    exposures:
      - name: weekly_revenue
        type: dashboard
        owner:
          name: Finance Analytics
          email: finance@example.com
        depends_on:
          - ref('fct_revenue')
          - ref('dim_customers')`
    }
  ],
  options: [
    `~dbt build --select exposure:weekly_revenue+~`,
    `~dbt build --select fct_revenue dim_customers~`,
    `~dbt build --select +exposure:weekly_revenue~`,
    `~dbt build --select +tag:weekly_revenue~`
  ],
  answer: 2,
  exp: [
    `The ~exposure:~ method selects the exposure, and the leading ~+~ brings all its ancestors: the two models and everything they depend on.`
  ],
  why: [
    `A ~+~ after the name selects descendants, and an exposure has none.`,
    `It builds only the two models, without their parents.`,
    `All the exposure's ancestors, and only them.`,
    `The exposure's name isn't a tag; nothing would be selected.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'p2-d6-exposure-multi', d: 'd6', type: 'multi', exam: 'p2', lvl: 2,
  choose: 2,
  topic: 'Implementing dbt exposures',
  stem: `Which two statements about exposures are correct? (Choose two.)`,
  options: [
    `~depends_on~ can list models, sources and metrics.`,
    `~type~ accepts values such as ~dashboard~, ~notebook~ and ~ml~.`,
    `dbt builds each exposure as a view in the target schema.`,
    `~maturity~ is required and accepts ~dev~ or ~prod~.`,
    `An exposure is declared in the BI tool and imported by dbt.`
  ],
  answers: [0, 1],
  exp: [
    `An exposure is just a YAML declaration of an external use of the data. It appears in the DAG and in the documentation, but creates nothing in the warehouse.`
  ],
  why: [
    `It accepts ~ref()~, ~source()~ and ~metric()~.`,
    `The types are ~dashboard~, ~notebook~, ~analysis~, ~ml~ and ~application~.`,
    `Exposures aren't materialized.`,
    `~maturity~ is optional and accepts ~high~, ~medium~ or ~low~.`,
    `It is written by hand in the dbt project's YAML.`
  ],
  doc: 'https://docs.getdbt.com/reference/exposure-properties'
},
{
  id: 'p2-d6-fresh-yaml', d: 'd6', type: 'mc', exam: 'p2', lvl: 1, art: 'yaml',
  topic: 'Implementing source freshness',
  stem: `~dbt source freshness~ runs when the newest ~_loaded_at~ is 30 hours old in ~payments~ and 40 hours old in ~refunds~. What does the command report?`,
  code: [
    {
      lang: 'yaml',
      label: 'models/staging/stripe/_sources.yml',
      text: `
    sources:
      - name: stripe
        config:
          loaded_at_field: _loaded_at
          freshness:
            warn_after: {count: 12, period: hour}
            error_after: {count: 24, period: hour}
        tables:
          - name: payments
          - name: refunds
            config:
              freshness: null`
    }
  ],
  options: [
    `~payments~: error; ~refunds~: not checked`,
    `~payments~: error; ~refunds~: error`,
    `~payments~: warning; ~refunds~: error`,
    `~payments~: warning; ~refunds~: not checked`
  ],
  answer: 0,
  exp: [
    `The tables inherit the source's freshness. ~payments~ is past the 24 hours of ~error_after~. ~refunds~ has ~freshness: null~, which takes the table out of the check.`
  ],
  why: [
    `Error for ~payments~ and no check for ~refunds~.`,
    `~refunds~ doesn't inherit the rule, because ~freshness: null~ turns it off for that table.`,
    `30 hours is past the error threshold, and ~refunds~ isn't even evaluated.`,
    `30 hours is past the error threshold (24), not just the warning threshold (12).`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'p2-d6-fresh-fill', d: 'd6', type: 'fill', exam: 'p2', lvl: 2,
  topic: 'Implementing source freshness',
  stem: `Complete the name of the artifact that ~dbt source freshness~ writes with the result for each source: ~target/______.json~`,
  accept: [
    `sources`,
    `sources.json`
  ],
  exp: [
    `The command writes ~target/sources.json~. That is the file the ~source_status:fresher~ selector compares with the one from a previous run.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/sources-json'
},
{
  id: 'p2-d7-ci-order', d: 'd7', type: 'order', exam: 'p2', lvl: 3, art: 'cli',
  topic: 'Understanding state and state selection',
  stem: `A team sets up CI so that each pull request builds only what changed. Put the steps in order.`,
  items: [
    `The production job finishes, and its ~manifest.json~ is saved.`,
    `A pull request is opened, and the CI job downloads that manifest into a folder.`,
    `CI runs ~dbt build --select state:modified+ --defer --state <folder>~.`,
    `Modified models and their children are built and tested in the CI schema.`,
    `The checks pass, and the pull request is merged into the main branch.`
  ],
  exp: [
    `The production manifest is the basis for comparison. ~state:modified+~ picks what changed and its children, and ~--defer~ makes unmodified parents be read from production.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/defer'
},
{
  id: 'p2-d7-state-sub', d: 'd7', type: 'mc', exam: 'p2', lvl: 3, art: 'cli',
  topic: 'Understanding state and state selection',
  stem: `A pull request only rewrites the ~description~ of ~dim_customers~ in its YAML file. The project doesn't enable ~persist_docs~. The CI job runs ~dbt build --select state:modified+ --state prod-artifacts~. What does it build?`,
  options: [
    `Nothing: without ~persist_docs~, a description change doesn't make a model modified.`,
    `~dim_customers~ and its children: any change to a model's YAML makes it modified.`,
    `~dim_customers~ alone: property changes select the model but not its children.`,
    `Every model declared in that YAML file: dbt compares files, not single entries.`
  ],
  answer: 0,
  exp: [
    `~state:modified~ combines several criteria: SQL body, configs, relation, macros, contract and persisted descriptions. A description only counts when ~persist_docs~ is on, because only then does it change something in the warehouse.`
  ],
  why: [
    `This is the ~state:modified.persisted_descriptions~ criterion: it only applies with ~persist_docs~.`,
    `Not every YAML change counts; descriptions only count with ~persist_docs~.`,
    `The model isn't even selected, and the ~+~ would bring its children if it were.`,
    `The comparison is done node by node, through the manifest, not by file.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'p2-d7-retry', d: 'd7', type: 'mc', exam: 'p2', lvl: 3, art: 'json',
  topic: 'Using dbt retry',
  stem: `This is an excerpt of ~target/run_results.json~ after a failed job. You fix ~int_orders~ and run ~dbt retry~ in the same project folder. What does dbt do?`,
  code: [
    {
      lang: 'json',
      label: 'target/run_results.json (excerpt)',
      text: `
    {
      "args": { "which": "build", "select": ["tag:nightly"], "full_refresh": true },
      "results": [
        { "unique_id": "model.jaffle.stg_orders", "status": "success" },
        { "unique_id": "model.jaffle.int_orders", "status": "error" },
        { "unique_id": "model.jaffle.fct_orders", "status": "skipped" }
      ]
    }`
    }
  ],
  options: [
    `It runs ~int_orders~ and ~fct_orders~ again as a ~build~, and it leaves ~stg_orders~ alone.`,
    `It runs ~int_orders~ and ~fct_orders~ as a plain ~run~, because the earlier command isn't kept.`,
    `It runs only ~int_orders~; the skipped node needs a separate ~dbt build~ afterwards.`,
    `It runs all three models again, because ~retry~ repeats the previous command from the start.`
  ],
  answer: 0,
  exp: [
    `~dbt retry~ reads the last run's ~run_results.json~ and repeats the same command, with the same selection, only for the nodes that errored or were skipped.`
  ],
  why: [
    `It resumes from the point of failure with the original command.`,
    `Retry repeats the command recorded in ~args~ (here, ~build~).`,
    `Nodes skipped because of the error are included in the retry too.`,
    `Successful nodes aren't redone; that is the advantage of retry.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'p2-d7-result-fill', d: 'd7', type: 'fill', exam: 'p2', lvl: 2, art: 'cli',
  topic: 'Understanding state and state selection',
  stem: `Complete the selector so that dbt rebuilds the models that ended with an error in the previous run, plus everything downstream of them: ~dbt build --select "result:______+" --state ./previous-run~`,
  accept: [
    `error`
  ],
  exp: [
    `The ~result:~ method reads the ~run_results.json~ in the folder given in ~--state~. ~error~ is the status of models that failed; ~fail~ is the status of tests that failed.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#result'
}
);
