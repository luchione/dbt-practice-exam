/* Extra set: packages, quoting, manifest, snapshots, grants on BigQuery, versions, behavior flags, clone, state, retry. */
window.DBT_Q.push(
{
  id: 'cs-d1-pkg-local', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `In a monorepo, the ~marketing~ dbt project and an internal macro package, ~core_macros~, live in sibling folders. Developers edit ~core_macros~ and want ~marketing~ to use their working copy right away, without committing, tagging, or publishing anything. Which ~packages.yml~ entry fits?`,
  options: [
    `~- local: ../core_macros~`,
    `~- git: "https://github.com/org/core_macros.git"~ with no ~revision~`,
    `~- package: org/core_macros~ with ~version: latest~`,
    `~- tarball: https://artifacts.example.com/core_macros.tar.gz~`
  ],
  answer: 0,
  exp: [
    `~local:~ points to a folder on the same file system, with a path relative to the project. ~dbt deps~ links the package to that folder, so the project reads the code as it is on disk, similar to an editable install in Python.`,
    `Git, Hub and tarball download a published version: edits only arrive after a commit (or release) and a new ~dbt deps~. Without ~revision~, dbt also warns that the install may bring unexpected changes.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-pkg-norev', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `A ~packages.yml~ entry uses ~- git: "https://github.com/org/finance_utils.git"~ with no ~revision~. What does dbt do, and what is the recommended fix?`,
  options: [
    `It installs the package but warns that this can introduce breaking changes without warning; pin a tag or commit with ~revision~.`,
    `It refuses to install the package until a ~revision~ is added.`,
    `It installs the latest release from dbt Hub instead of Git.`,
    `It installs the package and re-fetches it automatically before every ~dbt run~.`
  ],
  answer: 0,
  exp: [
    `Without ~revision~, dbt installs the package and warns that this can bring changes that break the project without notice. ~package-lock.yml~ records the installed commit, but the right move is to pin a tag or commit in ~revision~.`,
    `Packages are only downloaded by ~dbt deps~, never on every ~dbt run~, and a Git URL never becomes a Hub install.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-pkg-match', d: 'd1', type: 'match',
  topic: 'Using dbt Packages',
  stem: `Match each ~packages.yml~ syntax to where dbt gets the package from. One option is not used.`,
  left: [
    `~package:~ with ~version:~`,
    `~git:~ with ~revision:~`,
    `~local:~`,
    `~tarball:~`
  ],
  right: [
    `dbt Hub, using a version or version range`,
    `A Git repository, at a tag, branch, or commit`,
    `A folder on the same file system`,
    `An archive downloaded from a URL`,
    `A Python wheel installed with pip`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• ~package:~ + ~version:~ uses dbt Hub and accepts ranges like ~[">=1.1.0", "<2.0.0"]~.`,
    `• ~git:~ + ~revision:~ installs from a repository, pinned to a tag, branch or commit.`,
    `• ~local:~ uses a folder on disk, useful in monorepos and for testing changes to a package.`,
    `• ~tarball:~ downloads an archive from a URL.`,
    `dbt packages aren't installed with pip; the adapter and dbt Core are.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'cs-d1-quote-column', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `On Snowflake, an ELT tool created a source column with a quoted, mixed-case name: ~"CustomerID"~. The ~not_null~ test declared on that column in the source YAML fails with an invalid identifier error. What is the fix?`,
  options: [
    `Add ~quote: true~ to the ~CustomerID~ column in the source YAML.`,
    `Add ~quoting: {identifier: true}~ to ~dbt_project.yml~.`,
    `Rename the column entry to ~customerid~ in the YAML.`,
    `Add an ~on-run-start~ hook that sets ~QUOTED_IDENTIFIERS_IGNORE_CASE = TRUE~.`
  ],
  answer: 0,
  exp: [
    `**Column** names are quoted with the ~quote: true~ property on the column itself. Without it, the test generates ~CustomerID~ unquoted, Snowflake converts it to ~CUSTOMERID~ and doesn't find the column.`,
    `The ~quoting:~ config (database, schema, identifier) applies to **relation** names, meaning tables and views, not columns. Changing Snowflake session parameters in a hook affects everything and isn't dbt's way of solving this.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/columns'
},
{
  id: 'cs-d1-quote-domc', d: 'd1', type: 'domc',
  topic: 'Defining configurations in dbt_project.yml',
  stem: `Which statement about quoting in dbt is correct?`,
  options: [
    `The ~quoting:~ config controls whether database, schema, and identifier names of relations are quoted; column names use the column property ~quote~.`,
    `On Snowflake, dbt quotes database, schema, and identifier names by default.`,
    `~quoting: {identifier: true}~ also quotes every column name in your models.`,
    `Setting ~quote: true~ on a column also quotes the name of its table.`
  ],
  answer: 0,
  exp: [
    `~quoting:~ (in ~dbt_project.yml~ or on a source) wraps the database, schema and identifier names of relations in quotes. On Snowflake the default is ~false~; on most other adapters, ~true~.`,
    `Columns have their own control: ~quote: true~ on the column, which affects tests and documentation. One doesn't interfere with the other.`
  ],
  doc: 'https://docs.getdbt.com/reference/project-configs/quoting'
},
{
  id: 'cs-d1-quote-fill', d: 'd1', type: 'fill',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Complete the column property so dbt wraps the column name in quotes when it generates tests: ~columns: [{name: CustomerID, ______: true}]~`,
  accept: [
    `quote`
  ],
  exp: [
    `~quote~ is a column property, false by default. Use it when the column needs quotes to be read, for example to preserve case on Snowflake. Without it, the column's tests may generate invalid SQL.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/columns'
},
{
  id: 'cs-d1-man-source', d: 'd1', type: 'mc',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `A CI script must list the physical tables (database, schema, and table name) behind every ~source()~ the project uses, without querying the warehouse. Which artifact should it read?`,
  options: [
    `~manifest.json~, whose source entries record each source's database, schema, identifier, and unique_id`,
    `~catalog.json~, which only exists after dbt queries the warehouse metadata`,
    `~run_results.json~, which records the status of each node in the last run`,
    `~sources.json~, which records the freshness results of each source`
  ],
  answer: 0,
  exp: [
    `~manifest.json~ is generated when the project is parsed and describes every node. For sources, it holds ~database~, ~schema~, ~identifier~ and the full relation name, so you can audit raw dependencies without accessing the warehouse.`,
    `~catalog.json~ comes from metadata queries run by ~dbt docs generate~, ~run_results.json~ holds execution results and ~sources.json~ holds freshness results.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/manifest-json'
},
{
  id: 'cs-d1-man-nodes', d: 'd1', type: 'fill',
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Complete the blank. In ~manifest.json~, the models and sources a model depends on are listed in its ~depends_on~ object, under the key ______.`,
  accept: [
    `nodes`,
    `depends_on.nodes`
  ],
  exp: [
    `~depends_on~ has two lists: ~nodes~, with the unique_ids of the models, sources, seeds and snapshots used, and ~macros~, with the macros called. That is how tools read the lineage without running dbt.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/manifest-json'
},
{
  id: 'cs-d1-raw-verify', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Identifying and verifying any raw object dependencies',
  stem: `Which two practices let you catch problems in raw tables before the models built on them break? (Choose two.)`,
  options: [
    `Declare the tables as sources and add data tests, such as ~unique~ and ~not_null~, to their key columns.`,
    `Configure source freshness, with ~loaded_at_field~ and thresholds, and run ~dbt source freshness~.`,
    `Hard-code the raw table names in the models, with comments describing them.`,
    `Materialize the sources as tables in your schema.`,
    `Wrap each raw table in an ephemeral model instead of declaring a source.`
  ],
  answers: [0, 1],
  exp: [
    `Declaring the tables as sources lets you test them and measure freshness. Tests catch invalid data (duplicates, nulls) and freshness catches late loads, before the models use that data.`,
    `Sources aren't materialized by dbt, and hard-coded names or ephemeral models hide the raw tables from the lineage.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sources'
},
{
  id: 'cs-d1-snap-run', d: 'd1', type: 'mc',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `The nightly job runs only ~dbt run~. Models update correctly, but ~customers_snapshot~ never records new versions. Why?`,
  options: [
    `~dbt run~ only executes models; snapshots run with ~dbt snapshot~ or ~dbt build~.`,
    `Snapshots only run on the first day of each month.`,
    `~dbt run~ executes snapshots only when ~--full-refresh~ is passed.`,
    `The snapshot needs ~materialized: incremental~ to run with models.`
  ],
  answer: 0,
  exp: [
    `~dbt run~ only builds models. Snapshots run with ~dbt snapshot~ or inside ~dbt build~, which executes models, tests, seeds and snapshots in DAG order.`,
    `Snapshots have no configurable materialization or schedule of their own: they run whenever you execute the command.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/snapshot'
},
{
  id: 'cs-d1-snap-multi', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Which two commands execute the snapshot ~orders_snapshot~? (Choose two.)`,
  options: [
    `~dbt snapshot --select orders_snapshot~`,
    `~dbt build --select orders_snapshot~`,
    `~dbt run --select orders_snapshot~`,
    `~dbt seed --select orders_snapshot~`,
    `~dbt compile --select orders_snapshot~`
  ],
  answers: [0, 1],
  exp: [
    `~dbt snapshot~ runs snapshots, and ~dbt build~ runs every selected resource type, including snapshots, followed by their tests.`,
    `~dbt run~ only executes models, ~dbt seed~ only loads CSVs and ~dbt compile~ only generates SQL.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/snapshot'
},
{
  id: 'cs-d1-snap-fill', d: 'd1', type: 'fill',
  topic: 'Using commands such as build, run, test, docs, show, snapshot, and seed',
  stem: `Complete the selector so ~dbt build~ runs every snapshot in the project, plus their tests, and nothing else: ~dbt build --select resource_type:______~`,
  accept: [
    `snapshot`
  ],
  exp: [
    `The ~resource_type:~ method filters by resource type (~model~, ~seed~, ~snapshot~, ~test~...). With ~dbt build~, the tests of the selected snapshots run too. For snapshots only, without tests, use ~dbt snapshot~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods'
},
{
  id: 'cs-d1-gr-bq-hotspot', d: 'd1', type: 'hotspot',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `This project runs on BigQuery. One of the grants below is invalid. Click the line that must change.`,
  code: [
    {
      lang: 'yaml',
      label: 'models/marts/_marts.yml',
      hotspot: true,
      text: `
    models:
      - name: fct_revenue
        config:
          materialized: table
          grants:
            roles/bigquery.dataViewer: ['user:ana@company.com']
            select: ['user:bruno@company.com']`
    }
  ],
  answer: 6,
  exp: [
    `On BigQuery, the "privileges" are IAM roles, in the format ~roles/service.roleName~. ~select~ is the word used on Snowflake, Postgres and Redshift, not on BigQuery. The right line would be ~roles/bigquery.dataViewer: ['user:bruno@company.com']~ (or both emails in the same list).`,
    `The grantees are correct: on BigQuery each one needs a prefix with the principal type, such as ~user:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d1-gr-bq-grantee', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `On BigQuery, ~grants: {roles/bigquery.dataViewer: ['analyst@company.com']}~ is rejected. What must change?`,
  options: [
    `Prefix the grantee with its principal type: ~user:analyst@company.com~.`,
    `Replace the role with ~select~.`,
    `Move the grant into an ~on-run-end~ hook, because BigQuery doesn't support the grants config.`,
    `Wrap the e-mail in double quotes instead of single quotes.`
  ],
  answer: 0,
  exp: [
    `On BigQuery, each grantee needs a prefix that states the principal type, such as ~user:someone@company.com~. The role (~roles/bigquery.dataViewer~) is already in the right format.`,
    `BigQuery supports the ~grants~ config; only the vocabulary changes. Single or double quotes make no difference in YAML.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d1-gr-match', d: 'd1', type: 'match',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `A team runs the same project on Snowflake and on BigQuery. Match each part of the ~grants~ config to a valid example. One option is not used.`,
  left: [
    `Privilege key on Snowflake`,
    `Privilege key on BigQuery`,
    `Grantee on BigQuery`
  ],
  right: [
    `~select~`,
    `~roles/bigquery.dataViewer~`,
    `~user:ana@company.com~`,
    `~GRANT ALL ON SCHEMA~`
  ],
  answer: [0, 1, 2],
  exp: [
    `• On Snowflake (and on Postgres and Redshift), the keys are SQL privileges, such as ~select~, and the grantees are roles or users.`,
    `• On BigQuery, the keys are IAM roles (~roles/bigquery.dataViewer~), and the grantees take a prefix, such as ~user:~.`,
    `The ~grants~ config applies to the relation the model creates; schema permissions are outside it, for example in an ~on-run-end~ hook.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'cs-d2-ver-default', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_orders~ declares ~versions: [{v: 1}, {v: 2}, {v: 3}]~ and has no ~latest_version~ property. Which version does an unpinned ~{{ ref('dim_orders') }}~ resolve to?`,
  options: [
    `Version 3, because without ~latest_version~ the numerically greatest version is the latest`,
    `Version 1, because the first declared version is the default`,
    `None; dbt raises an error until ~latest_version~ is set`,
    `Whichever version was built most recently`
  ],
  answer: 0,
  exp: [
    `If ~latest_version~ isn't set, dbt treats the highest numeric version as the latest, and a ~ref()~ without ~v~ resolves to it.`,
    `To keep consumers on an earlier version while the new one is tested, set ~latest_version~ explicitly.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d2-ver-prerelease', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_orders~ has ~latest_version: 2~ and also declares version 3, which is still being tested. What is true about version 3?`,
  options: [
    `It is a prerelease: unpinned refs keep resolving to v2, and you reach v3 with ~ref('dim_orders', v=3)~.`,
    `It becomes the latest automatically, because it is the highest number.`,
    `dbt refuses to build it until ~latest_version~ is changed to 3.`,
    `It is treated as deprecated, because it is above ~latest_version~.`
  ],
  answer: 0,
  exp: [
    `Versions above ~latest_version~ are **prerelease**: they are built, but only those who pin the version (~v=3~) use them. Versions below ~latest_version~ are **old**. The ~version:prerelease~, ~version:latest~ and ~version:old~ selectors use this classification.`,
    `When v3 is ready, just change ~latest_version~ to 3, and every unversioned ref points to it.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d2-ver-fill', d: 'd2', type: 'fill',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Version 3 of ~dim_orders~ is ready. Complete the model property you change so every unpinned ~ref('dim_orders')~ in the project resolves to v3, without editing any downstream model: ~______: 3~`,
  accept: [
    `latest_version`,
    `latest version`
  ],
  exp: [
    `~latest_version~ defines where ~ref()~ calls without ~v~ go. Changing this number promotes the new version across the whole project at once, while pinned refs (~v=2~) stay where they are.`,
    `Afterward, mark the old version with a ~deprecation_date~ to give a migration deadline.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'cs-d3-bf-lifecycle', d: 'd3', type: 'order',
  topic: 'Managing dbt behavior with flags',
  stem: `Put the stages of a behavior change flag's life cycle in order.`,
  items: [
    `Introduced: dbt supports both behaviors, and the flag is disabled by default.`,
    `Mature: the flag's default flips, so the new behavior is enabled by default.`,
    `Removed: the old behavior is deleted from the dbt codebase.`
  ],
  exp: [
    `A behavior change flag starts off (you can turn it on early), then becomes on by default (you can still turn it off, with deprecation warnings), and finally the old behavior is removed, with plenty of notice beforehand.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-where', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `The team wants to opt in early to the behavior change flag ~require_resource_names_without_spaces~, and the decision should go through code review. Where must the flag be set?`,
  options: [
    `In the ~flags:~ dictionary of ~dbt_project.yml~`,
    `As a CLI option on each command, such as ~--require-resource-names-without-spaces~`,
    `In an environment variable on each developer's machine`,
    `In each developer's ~profiles.yml~`
  ],
  answer: 0,
  exp: [
    `Behavior change flags **must** go in the ~flags:~ dictionary in ~dbt_project.yml~. That way the choice applies to everyone who runs the project and is versioned, going through a pull request.`,
    `Other flags (such as ~fail_fast~) can also come from the command line or environment variables, but behavior change flags can't.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-optout', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `After an upgrade, a behavior change flag became enabled by default, and some of your models depend on the old behavior. You set the flag to ~false~ in ~dbt_project.yml~. What happens?`,
  options: [
    `dbt keeps the old behavior but keeps logging deprecation warnings until you migrate, and the old behavior will eventually be removed.`,
    `dbt keeps the old behavior permanently, with no warnings.`,
    `dbt ignores the setting, because mature flags can't be disabled.`,
    `dbt fails to parse until the models are fixed.`
  ],
  answer: 0,
  exp: [
    `In the mature phase, you can still turn the flag off and keep the old behavior, but dbt keeps showing deprecation warnings. It is a deadline to migrate: in the next phase, the old behavior no longer exists.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d3-bf-domc', d: 'd3', type: 'domc',
  topic: 'Managing dbt behavior with flags',
  stem: `Which statement describes a behavior change flag in dbt?`,
  options: [
    `It controls a deliberate change in which the same project code produces a different result, so teams can migrate on their own schedule.`,
    `It ships urgent bug fixes between minor releases.`,
    `It is a per-model config that changes how one model is materialized.`,
    `It changes the verbosity of dbt's logs.`
  ],
  answer: 0,
  exp: [
    `Behavior change flags exist for intentional changes where the same code starts producing a different result. They aren't bug fixes or new warnings, and they apply to the whole project, not to one model.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},
{
  id: 'cs-d4-cl-refresh', d: 'd4', type: 'fill',
  topic: 'Using dbt clone',
  stem: `Your CI schema already has clones from last week, so ~dbt clone --state prod-artifacts~ leaves them untouched. Complete the command so dbt recreates them from the current production state: ~dbt clone --state prod-artifacts ______~`,
  accept: [
    `--full-refresh`,
    `full-refresh`
  ],
  exp: [
    `By default, ~dbt clone~ doesn't recreate relations that already exist in the target. With ~--full-refresh~, it recreates all of them from the current production state.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d4-cl-select', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `Before a CI build, you want to clone only the production incremental models into the CI schema, so they can run incrementally instead of being built from scratch. Which command does that?`,
  options: [
    `~dbt clone --select config.materialized:incremental --state prod-artifacts~`,
    `~dbt clone --state prod-artifacts --full-refresh~`,
    `~dbt build --select config.materialized:incremental --defer~`,
    `~dbt clone --select state:new --state prod-artifacts~`
  ],
  answer: 0,
  exp: [
    `~dbt clone~ accepts the usual selectors. Here, ~config.materialized:incremental~ restricts the clone to incremental models, and ~--state~ says where the relations come from.`,
    `Without ~--select~, clone takes everything in the manifest. ~state:new~ would select nodes that don't even exist in production, so there would be nothing to clone.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d4-cl-domc', d: 'd4', type: 'domc',
  topic: 'Using dbt clone',
  stem: `Which statement correctly compares ~dbt clone~ with ~--defer~?`,
  options: [
    `~dbt clone~ creates real objects (clones or views) in your target schema that other tools can query; ~--defer~ only changes how refs resolve while a dbt command runs.`,
    `~--defer~ copies production tables into your schema; ~dbt clone~ only changes how refs resolve.`,
    `Both create copies of production data in your schema.`,
    `~dbt clone~ requires a full refresh of production first.`
  ],
  answer: 0,
  exp: [
    `Clone materializes something in your schema: a zero-copy clone or, where that doesn't exist, a view. That is why a BI tool can read these objects.`,
    `~--defer~ creates nothing: it only makes ~ref()~ calls to unselected nodes point to production during that command.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'cs-d7-st-changed', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `In CI, you want to build only models that already exist in production and were changed, leaving out brand-new models. Which selection does that?`,
  options: [
    `~--select "state:modified,state:old" --state prod-artifacts~`,
    `~--select "state:modified state:old" --state prod-artifacts~`,
    `~--select state:unmodified --state prod-artifacts~`,
    `~--select state:new --state prod-artifacts~`
  ],
  answer: 0,
  exp: [
    `~state:modified~ includes new nodes. Intersecting it with ~state:old~ (nodes that already exist in the comparison manifest) using a **comma** leaves only the modified nodes that already existed.`,
    `With a **space**, the criteria become a union and every unchanged old node gets in too. ~state:unmodified~ and ~state:new~ select exactly what you want to leave out.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cs-d7-st-match', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Match each selector to the nodes it picks, compared with the manifest passed in ~--state~. One option is not used.`,
  left: [
    `~state:new~`,
    `~state:modified~`,
    `~state:old~`,
    `~state:unmodified~`
  ],
  right: [
    `Nodes that don't exist in the comparison manifest`,
    `New nodes plus nodes whose code or configs changed`,
    `Nodes that already exist in the comparison manifest`,
    `Existing nodes with no changes`,
    `Nodes that failed in the previous run`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `• ~state:new~: doesn't exist in the comparison manifest.`,
    `• ~state:modified~: the new ones **and** the changed ones.`,
    `• ~state:old~: already existed, changed or not.`,
    `• ~state:unmodified~: already existed and didn't change.`,
    `Failures from the previous run come from ~run_results.json~ and are selected with ~result:~, not with ~state:~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'cs-d7-r-scope', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `In dbt Core 1.11, a ~dbt build~ failed on one model, and 5 nodes were skipped. You want ~dbt retry~ to rerun only part of that work. What can you do?`,
  options: [
    `Nothing with retry: in dbt Core it always reruns the failed node and the nodes skipped because of it. To run a different subset, use ~dbt build~ with your own ~--select~.`,
    `Pass ~--select~ to ~dbt retry~ with the nodes you want.`,
    `Pass ~--exclude~ to ~dbt retry~ with the nodes you want to skip.`,
    `Pass ~--state~ to ~dbt retry~ with a saved manifest.`
  ],
  answer: 0,
  exp: [
    `In dbt Core (v1), retry repeats the last run from the point of failure, with the same selection: you can't narrow the scope with ~--select~ or ~--exclude~. For a subset, use for example ~dbt build --select "result:error+" --state folder-with-the-artifacts~ with whatever ~--exclude~ you want.`,
    `The documentation says that **dbt v2** (the new engine) accepts ~--select~, ~--exclude~ and ~--selector~ on retry. Some practice exams use this new rule, but the exam covers dbt Core 1.11.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'cs-d7-r-order', d: 'd7', type: 'order',
  topic: 'Using dbt retry',
  stem: `The nightly ~dbt build~ failed: one test errored, and several models were skipped. You don't know yet which node failed or why. It turns out to be a ~not_null~ test on a source, caused by bad rows loaded by another team. Put your steps in order.`,
  items: [
    `Read the error in the logs (or ~run_results.json~) to see which node failed and why.`,
    `Ask the upstream team to fix the bad rows, and confirm the source is clean.`,
    `Run ~dbt retry~ to rerun the failed test and the skipped nodes.`,
    `Check that the failed and skipped nodes now finish with PASS or OK.`
  ],
  exp: [
    `First read the error: it tells you which node failed and that the cause is in a source's data, not in your code. Only then do you know what to ask the upstream team. With the source fixed (there is nothing to change in the models), resume with ~dbt retry~, which runs the failed test and the skipped nodes, and finally check the statuses.`,
    `Running retry before fixing the cause just repeats the same error.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
