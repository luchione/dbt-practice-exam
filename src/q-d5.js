/* Domain 5: generic, singular, custom generic and unit tests. */
window.DBT_Q.push(
{
  id: 'd5-g-relationships', d: 'd5', type: 'mc',
  codeOptions: true,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Every ~customer_id~ in ~fct_orders~ must exist in ~dim_customers~. Which YAML correctly applies the built-in test in dbt Core 1.11?`,
  options: [
    `
    - name: customer_id
      data_tests:
        - relationships:
            arguments:
              to: ref('dim_customers')
              field: customer_id`,
    `
    - name: customer_id
      data_tests:
        - relationships:
            config:
              to: ref('dim_customers')
              field: customer_id`,
    `
    - name: customer_id
      data_tests:
        - foreign_key: dim_customers.customer_id`,
    `
    - name: customer_id
      data_tests:
        - relationships:
            arguments:
              model: dim_customers
              column: customer_id`
  ],
  answer: 0,
  exp: [
    `~relationships~ checks referential integrity: it takes ~to~ (the parent model or source, via ~ref~/~source~) and ~field~ (the column in the parent). Arguments go under ~arguments:~; ~config:~ is for ~severity~, ~where~, etc.`,
    `The four built-in generic tests are ~unique~, ~not_null~, ~accepted_values~ and ~relationships~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/data-tests'
},
{
  id: 'd5-g-quote', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `An ~accepted_values~ test on the integer column ~priority~ uses ~values: [1, 2, 3]~ and fails on your platform, because the values are compared as strings. What is the cleanest fix?`,
  options: [
    `Add ~quote: false~ to the test's arguments.`,
    `Cast ~priority~ to text in the model.`,
    `Set ~severity: warn~ on the test.`,
    `Replace the test with ~relationships~.`
  ],
  answer: 0,
  exp: [
    `By default, ~accepted_values~ quotes the values (~'1'~). With ~quote: false~, the SQL compares against numbers (~1~), as expected for numeric or boolean columns.`,
    `Changing the column type just so the test passes alters the model, and ~warn~ only hides the problem.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/data-tests#accepted_values'
},
{
  id: 'd5-g-builtins', d: 'd5', type: 'multi',
  choose: 2,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which two of these are built-in generic data tests in dbt Core, available without installing any package? (Choose two.)`,
  options: [
    `~unique~`,
    `~relationships~`,
    `~expression_is_true~`,
    `~unique_combination_of_columns~`,
    `~recency~`
  ],
  answers: [0, 1],
  exp: [
    `Built into dbt: ~unique~, ~not_null~, ~accepted_values~ and ~relationships~.`,
    `~expression_is_true~, ~unique_combination_of_columns~ and ~recency~ come from the **dbt_utils** package and are called with the package prefix: ~dbt_utils.recency~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'd5-g-composite', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `In ~fct_order_lines~, the combination of ~order_id~ and ~line_number~ must be unique, but neither column is unique on its own. Which test should you use?`,
  options: [
    `~dbt_utils.unique_combination_of_columns~ at the model level, with ~combination_of_columns: [order_id, line_number]~`,
    `A ~unique~ test on ~order_id~ and another on ~line_number~`,
    `~unique_key: ['order_id', 'line_number']~ in the model config`,
    `A ~relationships~ test from ~line_number~ to ~order_id~`
  ],
  answer: 0,
  exp: [
    `Composite uniqueness is tested at the model level. ~dbt_utils.unique_combination_of_columns~ is the ready-made option; you could also test ~unique~ on a surrogate key (~generate_surrogate_key~).`,
    `Two separate ~unique~ tests would fail, because each column repeats on its own. ~unique_key~ is an incremental config, not a test.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd5-s-severity', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The singular test ~tests/assert_refunds_below_payments.sql~ should only warn, never error. How do you configure that?`,
  options: [
    `Add ~{{ config(severity = 'warn') }}~ at the top of the test's SQL file.`,
    `Add ~severity: warn~ under a column's ~data_tests~ in the model YAML.`,
    `Run the project with ~--warn-error~.`,
    `Rename the file to ~assert_refunds_below_payments_warn.sql~.`
  ],
  answer: 0,
  exp: [
    `Singular tests are configured with ~config()~ in the file itself or, as a group, under ~data_tests:~ in ~dbt_project.yml~. Since 1.9 you can also describe them in YAML (~data_tests: - name: ...~).`,
    `~--warn-error~ does the opposite: it turns warnings into errors.`
  ],
  doc: 'https://docs.getdbt.com/reference/data-test-configs'
},
{
  id: 'd5-s-zero', d: 'd5', type: 'fill',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Complete the blank with a number. A dbt data test (singular or generic) passes when its query returns ______ rows.`,
  accept: [
    `0`,
    `zero`,
    `no`,
    `none`
  ],
  exp: [
    `Data tests are queries that select the **problem rows**. Zero rows means success. By default, any nonzero count fails (~error_if: "!=0"~), and you can adjust that with ~warn_if~, ~error_if~ and ~fail_calc~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'd5-cg-domc', d: 'd5', type: 'domc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about custom generic tests is correct?`,
  options: [
    `They are ~{% test %}~ blocks, usually in ~tests/generic/~ or the macros folder, that receive ~model~ and, for column tests, ~column_name~.`,
    `They must be written in Python.`,
    `They are defined in ~dbt_project.yml~ under ~data_tests:~.`,
    `They must return the rows that pass the check.`
  ],
  answer: 0,
  exp: [
    `A custom generic test is like a macro: ~{% test name(model, column_name, other_args) %} ... {% endtest %}~. It returns the rows that **fail**, and is then applied in YAML to any model, column or source.`,
    `~dbt_project.yml~ only configures tests (severity and the like); it doesn't define them.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-cg-model-level', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `You wrote ~{% test has_min_rows(model, min_rows) %}~, which checks the row count of a whole model. How do you apply it to ~fct_orders~ with a minimum of 1,000 rows?`,
  options: [
    `Under the model's own ~data_tests:~ key (not under a column), with ~arguments: {min_rows: 1000}~`,
    `Under every column's ~data_tests:~ key`,
    `In ~dbt_project.yml~ as ~+has_min_rows: 1000~`,
    `As a unit test with ~given~ rows`
  ],
  answer: 0,
  exp: [
    `Tests without ~column_name~ in the signature are **model-level** tests and go under ~models: - name: fct_orders data_tests:~. Tests with ~column_name~ go under the column, and dbt fills in that argument automatically.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-cg-hotspot', d: 'd5', type: 'hotspot',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `This custom generic test fails on healthy data where every value is positive. Click the line with the bug.`,
  code: [
    {
      lang: 'sql',
      label: 'tests/generic/is_positive.sql',
      hotspot: true,
      text: `
    {% test is_positive(model, column_name) %}

    select *
    from {{ model }}
    where {{ column_name }} >= 0

    {% endtest %}`
    }
  ],
  answer: 4,
  exp: [
    `A data test must return the rows that **violate** the rule. This ~where~ returns the valid rows, so the test fails exactly when the data is correct. The right condition is ~where {{ column_name }} < 0~ (or ~<= 0~, if zero is also invalid).`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-u-fixture', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Several unit tests reuse the same 60-row input for ~stg_customers~. Writing it inline is unreadable. What is the recommended approach?`,
  options: [
    `Save it as a CSV fixture in ~tests/fixtures/~ and reference it with ~format: csv~ and ~fixture: <name>~.`,
    `Load it as a seed and point ~given~ to ~ref('the_seed')~.`,
    `Write ~rows: ref('stg_customers')~ so the unit test reads production data.`,
    `Put the CSV in ~models/fixtures/~ and ~ref()~ it.`
  ],
  answer: 0,
  exp: [
    `Unit tests accept ~format~ ~dict~ (default), ~csv~ or ~sql~, inline or as a **fixture**: a file in ~fixtures/~ inside a test path, referenced with ~fixture:~ under ~given~ or ~expect~.`,
    `Unit tests use **static**, controlled data; reading real data defeats the purpose.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-ephemeral', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The model under test refs ~int_customer_flags~, which is materialized as ephemeral. How must its ~given~ input be written?`,
  options: [
    `With ~format: sql~ and rows written as a SQL ~select~`,
    `With ~format: dict~ (the default)`,
    `With ~format: csv~ and a fixture file`,
    `It doesn't need an input, because ephemeral models are inlined automatically`
  ],
  answer: 0,
  exp: [
    `Inputs from ephemeral models **must** use ~format: sql~, for example ~rows: | select 1 as customer_id, true as is_vip~. Every ~ref~ or ~source~ of the model must appear under ~given~, including the ephemeral ones.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-columns', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `~dim_customers~ returns 40 columns, but your unit test only checks the email-validation logic, which uses ~email~ and produces ~is_valid_email~. What must the ~given~ and ~expect~ rows contain?`,
  options: [
    `Only the columns relevant to the logic under test, such as ~email~ and ~is_valid_email~`,
    `All 40 columns, because missing columns make the test fail`,
    `Only the primary key column`,
    `All columns, with NULL where you don't care`
  ],
  answer: 0,
  exp: [
    `In the ~dict~ and ~csv~ formats, you only need to provide the relevant columns; dbt fills in the rest. This keeps the test focused and readable, documenting exactly which rule is being checked.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-select', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want to run all unit tests defined on ~dim_customers~, and nothing else. Which command should you use?`,
  options: [
    `~dbt test --select "dim_customers,test_type:unit"~`,
    `~dbt test --select "dim_customers test_type:unit"~`,
    `~dbt build --select dim_customers~`,
    `~dbt test --select "test_type:unit+"~`
  ],
  answer: 0,
  exp: [
    `The comma is an intersection: tests attached to ~dim_customers~ **and** of type unit. With a space, it would be a union (all of the model's tests plus every unit test in the project).`,
    `~dbt build~ would also build the model and run its data tests. Other values: ~test_type:data~, ~test_type:generic~, ~test_type:singular~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#test_type'
},
{
  id: 'd5-u-vars', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `A model multiplies amounts by ~{{ var('fx_rate') }}~. In a unit test, you want the rate fixed at 5 so the expected output is predictable. What do you add to the unit test?`,
  options: [
    `~overrides: {vars: {fx_rate: 5}}~`,
    `~given: [{input: var('fx_rate'), rows: [{value: 5}]}]~`,
    `~config: {fx_rate: 5}~`,
    `Run ~dbt test~ with ~--vars '{"fx_rate": 5}'~ every time`
  ],
  answer: 0,
  exp: [
    `~overrides~ lets you fix **macros** (such as ~is_incremental~), **vars** and **env_vars** inside the unit test itself. That way it is deterministic and doesn't depend on flags passed at run time.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-when', d: 'd5', type: 'multi',
  choose: 2,
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Which two situations are good candidates for a unit test, rather than a data test? (Choose two.)`,
  options: [
    `A complex regex that validates email addresses, including tricky edge cases`,
    `Date math with window functions that must handle month-end and leap years`,
    `A staging model that only renames columns from its source`,
    `Checking that ~order_id~ is unique in today's production data`,
    `Checking that the source table was loaded in the last 12 hours`
  ],
  answers: [0, 1],
  exp: [
    `Unit tests check **logic** with fixed inputs and edge cases that may not exist in the data yet. Regex and date calculations with boundaries are the classic examples.`,
    `Simple renames don't need a unit test. Uniqueness in the real data is the job of a data test, and load delay is the job of source freshness.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-as-early', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Duplicate customer records arriving from the CRM keep breaking several marts. Following dbt's testing guidance, where should the first test for this problem go?`,
  options: [
    `At the source (or its staging model), with ~unique~ and ~not_null~ on the customer key, so the problem is caught as early as possible`,
    `Only on the final dashboards' exposures`,
    `Only on the marts, because that's where business users see the data`,
    `Nowhere; source data quality is the data engineering team's responsibility`
  ],
  answer: 0,
  exp: [
    `Test your assumptions about the data **as early as possible**. A test on the source or in staging pinpoints where the problem comes from and saves you from investigating every broken mart.`,
    `Tests on marts are still useful for new columns and grains created there, but they don't replace the check at the entry point. Exposures have no tests.`
  ],
  doc: 'https://docs.getdbt.com/blog/test-smarter-where-tests-should-go'
},
{
  id: 'd5-as-expression', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `You need to assert that ~order_date~ is never in the future in ~stg_orders~. With the dbt_utils package installed, which test fits best?`,
  options: [
    `~dbt_utils.expression_is_true~ with ~arguments: {expression: "order_date <= current_date"}~`,
    `~accepted_values~ on ~order_date~`,
    `~not_null~ on ~order_date~`,
    `Source ~freshness~ on ~order_date~`
  ],
  answer: 0,
  exp: [
    `~expression_is_true~ fails on the rows where the expression is false, which is ideal for simple single-row business rules. Without packages, a singular test with ~where order_date > current_date~ does the same.`,
    `Freshness measures load delay, not whether values are valid.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd5-w-store-as', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want the failing rows of your tests persisted as **views**, not tables, to avoid storing copies of large datasets. Which config should you use?`,
  options: [
    `~store_failures_as: view~`,
    `~store_failures: view~`,
    `~materialized: view~ on the test`,
    `~--store-failures --as-view~`
  ],
  answer: 0,
  exp: [
    `~store_failures_as~ accepts ~table~, ~view~ or ~ephemeral~ (which turns persistence off) and takes precedence over ~store_failures~. As a view, you query the current failures without duplicating data.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures_as'
},
{
  id: 'd5-w-severity-match', d: 'd5', type: 'match',
  topic: 'Implementing various testing steps in the workflow',
  stem: `A test has ~severity: error~, ~error_if: ">1000"~ and ~warn_if: ">10"~. Match each number of failing rows to the test result. One option is not used.`,
  left: [
    `5 failing rows`,
    `50 failing rows`,
    `1,500 failing rows`
  ],
  right: [
    `PASS`,
    `WARN`,
    `ERROR`,
    `SKIP`
  ],
  answer: [0, 1, 2],
  exp: [
    `With ~severity: error~, dbt first evaluates ~error_if~ (1,500 > 1,000 → ERROR); if it doesn't match, it evaluates ~warn_if~ (50 > 10 → WARN); if neither matches, PASS (5).`,
    `With ~severity: warn~, ~error_if~ would be ignored. The defaults for ~error_if~ and ~warn_if~ are ~!=0~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'd5-w-build-domc', d: 'd5', type: 'domc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `Which statement describes an advantage of ~dbt build~ over running ~dbt run~ and then ~dbt test~?`,
  options: [
    `Each node is tested right after it's built, so downstream models are skipped instead of being built on top of bad data.`,
    `All tests run before any model is built, which saves warehouse compute.`,
    `Source freshness checks run first, automatically.`,
    `Test severity is ignored, so the pipeline always completes.`
  ],
  answer: 0,
  exp: [
    `With ~run~ followed by ~test~, every model is built first, even on top of bad data, and the tests only warn afterward. ~build~ interleaves: unit tests → model → data tests → children. A FAIL keeps the problem from spreading.`,
    `~build~ doesn't run freshness and respects ~severity~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
}
);
