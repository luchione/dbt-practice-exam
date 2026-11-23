/* Domains 6 and 7: exposures, source freshness, state, retry. */
window.DBT_Q.push(
{
  id: 'd6-e-hotspot', d: 'd6', type: 'hotspot',
  topic: 'Implementing dbt exposures',
  stem: `~dbt parse~ fails for this exposure. Click the line that causes the problem.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_exposures.yml',
      hotspot: true,
      text: `
    exposures:
      - name: Weekly Revenue Dashboard
        type: dashboard
        maturity: high
        url: https://bi.example.com/dashboards/42
        owner:
          name: Finance Analytics
          email: finance@example.com
        depends_on:
          - ref('fct_revenue')`
    }
  ],
  answer: 1,
  exp: [
    `An exposure's ~name~ can only contain letters, numbers and underscores (since 1.10, names with spaces raise an error by default). Use ~name: weekly_revenue_dashboard~ and put the friendly name in ~label: Weekly Revenue Dashboard~.`,
    `~type~, ~maturity~, ~url~, ~owner~ and ~depends_on~ are correct.`
  ],
  doc: 'https://docs.getdbt.com/reference/exposure-properties'
},
{
  id: 'd6-e-depends', d: 'd6', type: 'mc',
  topic: 'Implementing dbt exposures',
  stem: `A dashboard reads ~fct_orders~ and also a raw Google Sheets table declared as source ~gsheets.targets~. How should its exposure declare these dependencies?`,
  options: [
    `~depends_on: [ref('fct_orders'), source('gsheets', 'targets')]~`,
    `~depends_on: [fct_orders, gsheets.targets]~`,
    `~refs: [fct_orders]~ and ~sources: [gsheets.targets]~`,
    `Only ~ref('fct_orders')~, because exposures can't depend on sources`
  ],
  answer: 0,
  exp: [
    `~depends_on~ accepts ~ref()~, ~source()~ and ~metric()~, written as Jinja calls in a string. That way the exposure appears at the end of the DAG connected to everything it consumes, and ~+exposure:name~ selects all its ancestors.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'd6-e-why-domc', d: 'd6', type: 'domc',
  topic: 'Implementing dbt exposures',
  stem: `Which statement describes what dbt exposures do?`,
  options: [
    `They document downstream consumers in the DAG, so you can see and select everything a dashboard or app depends on.`,
    `dbt refreshes the dashboard automatically after each build.`,
    `They run data tests inside the BI tool.`,
    `They materialize a view that the BI tool reads from.`
  ],
  answer: 0,
  exp: [
    `Exposures are declarative: they don't run anything or create objects. They document who consumes the data (with ~owner~, ~url~, ~maturity~), show lineage all the way to the final consumer and enable selections such as ~dbt build --select +exposure:name~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'd6-e-maturity', d: 'd6', type: 'fill',
  topic: 'Implementing dbt exposures',
  stem: `Complete the blank. The exposure property that signals how stable or trustworthy the exposure is, with the values ~high~, ~medium~, or ~low~, is called ______.`,
  accept: [
    `maturity`
  ],
  exp: [
    `~maturity~ indicates the level of confidence and stability of the declared consumer. Other properties: ~type~ (~dashboard~, ~notebook~, ~analysis~, ~ml~, ~application~), ~owner~, ~depends_on~, ~url~, ~description~ and ~label~.`
  ],
  doc: 'https://docs.getdbt.com/reference/exposure-properties'
},
{
  id: 'd6-f-query', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `A source table has no single column that reliably records load time; the latest load can only be determined with a custom SQL query. In dbt 1.10 or later, which property lets you define that query for freshness checks?`,
  options: [
    `~loaded_at_query~`,
    `~filter~`,
    `~freshness: {period: query}~`,
    `~error_after: {count: 1, period: load}~`
  ],
  answer: 0,
  exp: [
    `~loaded_at_query~ (1.10+) is an alternative to ~loaded_at_field~: a SQL query that returns the timestamp of the last load. Setting both on the same resource raises a parse error.`,
    `~filter~ only adds a WHERE to the default query. The valid periods in ~warn_after~ and ~error_after~ are ~minute~, ~hour~ and ~day~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'd6-f-domc', d: 'd6', type: 'domc',
  topic: 'Implementing source freshness',
  stem: `Which statement about source freshness is correct?`,
  options: [
    `If a table has a freshness config but no ~loaded_at_field~, dbt can calculate freshness from warehouse metadata on adapters that support it.`,
    `~dbt build~ runs source freshness checks automatically before building models.`,
    `~warn_after~ and ~error_after~ accept the periods minute, hour, day, week, and month.`,
    `Setting ~freshness: null~ on a source makes dbt check all of its tables with default thresholds.`
  ],
  answer: 0,
  exp: [
    `Without ~loaded_at_field~, supported adapters use warehouse metadata (such as the last-modified time) to measure freshness.`,
    `~dbt build~ does **not** run freshness; it is a separate command (~dbt source freshness~). The periods are only ~minute~, ~hour~ and ~day~, and ~freshness: null~ **turns off** the check.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'd6-f-fresher', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `To save compute, a frequent job should only rebuild models whose sources received new data since the last production run. You have the production artifacts, including ~sources.json~, in ~./prod~. Which sequence should the job run?`,
  options: [
    `~dbt source freshness~, then ~dbt build --select source_status:fresher+ --state ./prod~`,
    `~dbt build --select state:modified+ --state ./prod~`,
    `~dbt build --select source:*+ --full-refresh~`,
    `~dbt source freshness --select state:modified~`
  ],
  answer: 0,
  exp: [
    `~source_status:fresher~ compares the current ~sources.json~ with the one from the previous state and selects the sources with newer data; the ~+~ includes everything downstream. That is why you need to run ~dbt source freshness~ first, generating a new ~sources.json~.`,
    `~state:modified~ compares **code**, not data.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#source_status'
},
{
  id: 'd6-f-exit', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `A job runs ~dbt source freshness~ as its first step, followed by ~dbt build~. One source is past its ~error_after~ threshold, and another is past only its ~warn_after~ threshold. What happens?`,
  options: [
    `The first source reports ERROR and the second WARN; the command exits with an error code, so a job that requires this step to succeed stops.`,
    `Both sources report WARN, and the job continues normally.`,
    `dbt reloads the stale sources automatically before building.`,
    `~dbt build~ skips the models that read from stale sources.`
  ],
  answer: 0,
  exp: [
    `Each source gets PASS, WARN or ERROR according to the thresholds. Any ERROR makes the command exit with an error code, which stops pipelines that depend on it. WARN doesn't fail the run.`,
    `dbt doesn't load data or skip models because of freshness. To react to the results, use the ~source_status~ selector.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/source'
},
{
  id: 'd7-st-favor', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `You run ~dbt build --select my_model --defer --state prod-artifacts~. An unselected parent exists in your dev schema from weeks ago, so dbt uses that stale dev version instead of production. How do you make dbt prefer the production relation?`,
  options: [
    `Add ~--favor-state~.`,
    `Add ~--full-refresh~.`,
    `Select ~state:old~ as well.`,
    `Add ~--empty~.`
  ],
  answer: 0,
  exp: [
    `By default, ~--defer~ only uses production for parents **that don't exist** in your environment. With ~--favor-state~, dbt uses the object from the ~--state~ manifest even when a version exists in your target.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/defer'
},
{
  id: 'd7-st-defer-domc', d: 'd7', type: 'domc',
  topic: 'Understanding state and state selection',
  stem: `Which statement about ~--defer~ is correct?`,
  options: [
    `With ~--defer~ and ~--state~, refs to unselected nodes that don't exist in your target resolve to the relations recorded in the state manifest.`,
    `~--defer~ copies production tables into your development schema.`,
    `~--defer~ works without ~--state~ by querying production directly.`,
    `~--defer~ rebuilds every unselected parent in development.`
  ],
  answer: 0,
  exp: [
    `Defer changes **how ~ref()~ calls are resolved**: parents that are unselected and missing from your environment point to the production objects described in the ~--state~ ~manifest.json~. Nothing is copied or rebuilt.`,
    `To create real objects in your schema, the command is ~dbt clone~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/defer'
},
{
  id: 'd7-st-env', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `In CI, ~state:modified~ keeps selecting dozens of models that nobody changed. They all set ~snowflake_warehouse~ with ~{{ 'transforming_xl' if target.name == 'prod' else 'transforming_xs' }}~. What is the most likely explanation?`,
  options: [
    `The config renders to a different value in CI than in the production manifest, so dbt sees a changed config.`,
    `~state:modified~ always selects every model that has tags.`,
    `The production manifest is more than 7 days old, so dbt marks everything as modified.`,
    `~--defer~ forces all models to be treated as modified.`
  ],
  answer: 0,
  exp: [
    `~state:modified~ compares the current manifest with the production one. Configs that depend on the environment (~target.name~, ~env_var~, ~var~) render different values in CI and produce **false positives**.`,
    `Avoid this kind of logic in configs or centralize it in macros such as ~generate_schema_name~ (schema and alias changes are handled by ~state:modified.relation~). Tags and meta don't count as modifications.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/state-comparison-caveats'
},
{
  id: 'd7-st-seed', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `You edited several rows in a 5 MB seed file without renaming or moving it. Your Slim CI job using ~state:modified+~ does not select the seed. Why?`,
  options: [
    `For seeds of 1 MiB or more, ~state:modified~ only detects changes to the file path, not to its contents.`,
    `Seeds are never part of ~state:modified~.`,
    `Seeds need ~--full-refresh~ to be compared.`,
    `~state:modified~ only compares ~.sql~ files.`
  ],
  answer: 0,
  exp: [
    `For seeds smaller than 1 MiB, dbt compares the contents. From 1 MiB up, it compares only the **path**, to keep the manifest light. In that case, select the seed explicitly in CI (for example, ~--select state:modified+ my_seed+~).`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'd7-st-artifacts', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Match each selector to the artifact it reads from the ~--state~ directory. One option is not used.`,
  left: [
    `~state:modified~`,
    `~result:fail~`,
    `~source_status:fresher~`
  ],
  right: [
    `manifest.json`,
    `run_results.json`,
    `sources.json`,
    `catalog.json`
  ],
  answer: [0, 1, 2],
  exp: [
    `• ~manifest.json~ describes the project (code and configs), used by ~state:~ and by ~--defer~.`,
    `• ~run_results.json~ holds each node's status, used by ~result:~ and by ~dbt retry~.`,
    `• ~sources.json~ holds the results of ~dbt source freshness~, used by ~source_status:~.`,
    `• ~catalog.json~ is generated by ~dbt docs generate~ for the documentation.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods'
},
{
  id: 'd7-r-build', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `In ~dbt build~, ~stg_orders~ built successfully, its ~not_null~ test FAILED, and ~fct_orders~ and ~dim_customers~ were SKIPPED. The upstream team fixed the data. You run ~dbt retry~. What does it execute?`,
  options: [
    `The failed test plus the nodes that were skipped (~fct_orders~, ~dim_customers~, and their tests), but not ~stg_orders~`,
    `The whole build again, including ~stg_orders~`,
    `Only the failed test`,
    `Nothing, because a test failure isn't considered an error`
  ],
  answer: 0,
  exp: [
    `~dbt retry~ reads ~run_results.json~ and resumes from the point of failure: the node that failed (here, the test) and the nodes skipped because of it. What had already passed isn't redone.`,
    `If nothing had failed, retry would finish without running anything.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'd7-r-nonodes', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `A production job failed immediately with a warehouse connection error, before any node started. After the network issue is fixed, you run ~dbt retry~. What happens?`,
  options: [
    `Nothing useful runs, because no nodes were recorded; you need to re-run the original command.`,
    `dbt retries the whole job automatically.`,
    `dbt retries only the first model of the DAG.`,
    `dbt reads the production manifest and runs every modified node.`
  ],
  answer: 0,
  exp: [
    `Retry depends on the nodes recorded in ~run_results.json~. If the failure happened before any node ran (connection, permissions), there is no point to resume from, and the right move is to run the full command again.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'd7-r-artifact', d: 'd7', type: 'fill',
  topic: 'Using dbt retry',
  stem: `Complete the blank with the artifact file name. ~dbt retry~ decides where to resume by reading ______ from the previous invocation.`,
  accept: [
    `run_results.json`,
    `run_results`,
    `run results`,
    `run_results json`
  ],
  exp: [
    `~run_results.json~ holds the status of each node from the last run. Retry re-executes the ones that errored or failed and the ones that were skipped. It supports ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~compile~, ~clone~, ~docs generate~ and ~run-operation~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
