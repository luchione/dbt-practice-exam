/* Domain 1, part B: project config, packages, Python, grants, snapshots, incremental, --empty, --sample, microbatch. */
window.DBT_Q.push(
{
  id: 'd1-pkg-deps', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `You added ~dbt-labs/dbt_utils~ to ~packages.yml~ and used ~{{ dbt_utils.star(ref('stg_orders')) }}~ in a model. ~dbt run~ fails with ~'dbt_utils' is undefined~. What is missing?`,
  options: [
    `Running ~dbt deps~ to install the package into ~dbt_packages/~`,
    `Running ~dbt clean~ to clear the target directory`,
    `Adding ~dbt_utils~ to ~macro-paths~ in ~dbt_project.yml~`,
    `Running ~dbt parse~ with ~--no-partial-parse~`
  ],
  answer: 0,
  exp: [
    `Declaring the package in ~packages.yml~ isn't enough: ~dbt deps~ downloads the packages into ~dbt_packages/~ (and updates ~package-lock.yml~). Without it, the package's macros don't exist in the Jinja context.`,
    `Run ~dbt deps~ whenever you change ~packages.yml~ and in every new environment (CI, production jobs).`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/deps'
},
{
  id: 'd1-pkg-override', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `Models from an installed package called ~stripe~ are being built in your default schema as views. You want them built as tables in a custom schema named ~stripe~. Where do you configure this?`,
  options: [
    `In your ~dbt_project.yml~, under ~models: stripe:~ with ~+materialized: table~ and ~+schema: stripe~`,
    `By editing the model files inside ~dbt_packages/stripe/~`,
    `In ~packages.yml~, under the package entry`,
    `In ~profiles.yml~, under the target`
  ],
  answer: 0,
  exp: [
    `The root project's ~dbt_project.yml~ can configure package resources using the **package name** as the key under ~models:~ (the same goes for ~+enabled: false~ and other configs).`,
    `Files in ~dbt_packages/~ are overwritten on every ~dbt deps~. ~packages.yml~ only declares what to install, and ~profiles.yml~ only defines connections.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages#configuring-packages'
},
{
  id: 'd1-pkg-depsyml', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `A private Git package must be installed with a token from an environment variable, using ~git: "https://{{ env_var('DBT_ENV_SECRET_GIT_TOKEN') }}@github.com/acme/dbt-internal.git"~. In which file must this entry go?`,
  options: [
    `~packages.yml~, because ~dependencies.yml~ does not support Jinja`,
    `~dependencies.yml~, because it is the newer file and supports everything ~packages.yml~ does`,
    `~dbt_project.yml~, under ~packages:~`,
    `~profiles.yml~, next to the warehouse credentials`
  ],
  answer: 0,
  exp: [
    `~dependencies.yml~ accepts packages and project dependencies (dbt Mesh), but **doesn't render Jinja**. When you need ~env_var()~ in the definition (such as tokens for private repositories), use ~packages.yml~.`,
    `~DBT_ENV_SECRET_~ variables are allowed in ~packages.yml~ and are masked in logs.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages'
},
{
  id: 'd1-pkg-range', d: 'd1', type: 'mc',
  topic: 'Using dbt Packages',
  stem: `For a dbt Hub package, you want to accept any version from 1.1.0 up to, but not including, 2.0.0. Which entry is correct?`,
  options: [
    `~version: [">=1.1.0", "<2.0.0"]~`,
    `~version: "1.x"~`,
    `~version: ">1.1.0"~`,
    `~revision: 1.1.0~`
  ],
  answer: 0,
  exp: [
    `Hub packages accept an exact version or a range as a list of constraints. The range allows fixes and improvements without jumping to a major version with breaking changes. ~package-lock.yml~ pins what was resolved.`,
    `• ~">1.1.0"~ would accept 2.x and excludes 1.1.0 itself.`,
    `• ~revision~ is for Git packages.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/packages#hub-packages'
},
{
  id: 'd1-py-config-get', d: 'd1', type: 'mc',
  topic: 'Creating Python Models',
  stem: `A Python model should process only 1,000 rows when it runs against the ~dev~ target. How do you make the target name available inside the model?`,
  options: [
    `Set ~target_name: "{{ target.name }}"~ in the model's YAML ~config~ and read it with ~dbt.config.get("target_name")~.`,
    `Write ~{{ target.name }}~ directly in the ~.py~ file.`,
    `Read ~dbt.target.name~ inside the ~model()~ function.`,
    `Use ~os.environ["DBT_TARGET"]~, because Python models run on the dbt machine.`
  ],
  answer: 0,
  exp: [
    `Python models don't render Jinja. Values from ~target~, ~var~ or ~env_var~ come in through configs in YAML (where Jinja is rendered) and are read with ~dbt.config.get()~.`,
    `The code runs remotely on the data platform, so environment variables from the dbt machine aren't available. The ~dbt~ object only exposes ~ref~, ~source~, ~this~, ~is_incremental~ and ~config~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'd1-py-packages', d: 'd1', type: 'mc',
  topic: 'Creating Python Models',
  stem: `A Python model on Snowflake uses ~scikit-learn~. How should you declare this third-party dependency?`,
  options: [
    `~dbt.config(packages=["scikit-learn"])~ in the model, or ~packages:~ in its YAML config`,
    `Add ~scikit-learn~ to ~packages.yml~ and run ~dbt deps~.`,
    `Run ~pip install scikit-learn~ in the environment where dbt runs.`,
    `Add a ~requirements.txt~ file inside the ~models/~ directory.`
  ],
  answer: 0,
  exp: [
    `The ~packages~ config lists the Python libraries the model needs, and the platform (Snowpark, for example) makes them available in the remote run.`,
    `~packages.yml~ is for **dbt** packages. Installing locally doesn't help, because the code doesn't run on the dbt machine.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'd1-py-incremental', d: 'd1', type: 'fill',
  topic: 'Creating Python Models',
  stem: `Complete the blank. In an incremental Python model, ~if dbt.______:~ is true when the model runs incrementally, so you can filter the source DataFrame using ~dbt.this~.`,
  accept: [
    `is_incremental`
  ],
  exp: [
    `In Python, ~dbt.is_incremental~ plays the role of the SQL ~is_incremental()~ macro, and ~dbt.this~ points to the current table (~dbt.this.database~, ~.schema~, ~.identifier~).`,
    `Example: ~df.filter(df.updated_at >= session.sql(f"select max(updated_at) from {dbt.this}").collect()[0][0])~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/python-models'
},
{
  id: 'd1-grants-revoke', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `A model currently has ~grants: {select: ['user_a', 'user_b']}~. You need to remove ~user_b~'s access. What should you do?`,
  options: [
    `Change it to ~select: ['user_a']~ and run the model.`,
    `Delete the whole ~grants~ config from the model and run it.`,
    `Change it to ~'+select': ['user_a']~ and run the model.`,
    `Add a ~revoke: ['user_b']~ key to the grants config.`
  ],
  answer: 0,
  exp: [
    `dbt makes the object's grants **match** the configured list: anyone removed from the list is revoked. To remove everyone, use ~select: []~.`,
    `• Deleting the whole ~grants~ config makes dbt stop managing grants, and it revokes nothing.`,
    `• ~'+select'~ adds to the inherited grants.`,
    `• There is no ~revoke~ key.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'd1-grants-env', d: 'd1', type: 'mc',
  topic: 'Providing access to users to models with the "grants" config',
  stem: `The ~bi_role~ should get ~select~ on mart models only in production. Development builds should grant nothing. Which configuration achieves this?`,
  options: [
    `~+grants: {select: "{{ ['bi_role'] if target.name == 'prod' else [] }}"}~`,
    `Define grants in the ~prod~ target inside ~profiles.yml~.`,
    `Pass ~--vars '{grants: bi_role}'~ only in production jobs.`,
    `Use a ~post-hook~ that grants in every environment, and revoke manually in development.`
  ],
  answer: 0,
  exp: [
    `The ~grants~ config accepts Jinja, so it can vary by context (~target.name~). That way the same code works for dev and prod.`,
    `• ~profiles.yml~ doesn't accept resource configs.`,
    `• The suggested var isn't tied to any config.`,
    `• Revoking by hand defeats the purpose of managing grants with dbt.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'd1-grants-types', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Providing access to users to models with the "grants" config',
  stem: `Besides models, which two resource types support the ~grants~ config? (Choose two.)`,
  options: [
    `Seeds`,
    `Snapshots`,
    `Sources`,
    `Exposures`,
    `Unit tests`
  ],
  answers: [0, 1],
  exp: [
    `~grants~ applies to resources dbt materializes as a table or view: **models, seeds and snapshots**. Sources are objects dbt only reads, exposures don't create objects and unit tests persist nothing.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/grants'
},
{
  id: 'd1-snap-current', d: 'd1', type: 'mc',
  topic: 'Creating snapshots in YAML',
  stem: `~customers_snapshot~ uses default settings (no ~dbt_valid_to_current~). Which filter returns only the current version of each customer?`,
  options: [
    `~where dbt_valid_to is null~`,
    `~where dbt_valid_from = (select max(dbt_valid_from) from customers_snapshot)~`,
    `~where dbt_is_deleted = false~`,
    `~where dbt_updated_at = current_date~`
  ],
  answer: 0,
  exp: [
    `In a snapshot, the current row is the one that hasn't been closed yet, meaning ~dbt_valid_to~ is null. With ~dbt_valid_to_current~ configured (for example ~'9999-12-31'~), filter on that value.`,
    `• ~max(dbt_valid_from)~ over the whole table would return only the most recent changes.`,
    `• ~dbt_is_deleted~ only exists with ~hard_deletes: new_record~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'd1-snap-missing', d: 'd1', type: 'mc',
  topic: 'Creating snapshots in YAML',
  stem: `This snapshot fails to parse. What fixes it?`,
  code: [
    {
      lang: 'yaml',
      label: 'snapshots/orders_snapshot.yml',
      text: `
    snapshots:
      - name: orders_snapshot
        relation: source('shop', 'orders')
        config:
          unique_key: order_id
          strategy: timestamp`
    }
  ],
  options: [
    `Add ~updated_at: last_modified_at~ (the column that records when each row changed).`,
    `Add ~check_cols: all~ and keep ~strategy: timestamp~.`,
    `Add ~hard_deletes: invalidate~.`,
    `Add ~target_schema: snapshots~.`
  ],
  answer: 0,
  exp: [
    `The ~timestamp~ strategy requires ~updated_at~, the column that says when the row changed. ~check_cols~ is required for the ~check~ strategy, and ~unique_key~ and ~relation~ apply to both.`,
    `~hard_deletes~ and the schema are optional. Since dbt 1.9, ~target_schema~ is no longer required, and the snapshot uses ~generate_schema_name~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'd1-snap-names', d: 'd1', type: 'mc',
  topic: 'Creating snapshots in YAML',
  stem: `Your team's convention requires the snapshot table itself to use ~valid_from~ and ~valid_to~ instead of ~dbt_valid_from~ and ~dbt_valid_to~. Which config should you set?`,
  options: [
    `~snapshot_meta_column_names: {dbt_valid_from: valid_from, dbt_valid_to: valid_to}~`,
    `~alias: {dbt_valid_from: valid_from, dbt_valid_to: valid_to}~`,
    `~column_types: {valid_from: timestamp, valid_to: timestamp}~`,
    `Rename the columns in a downstream view; the snapshot columns cannot be changed.`
  ],
  answer: 0,
  exp: [
    `~snapshot_meta_column_names~ (dbt 1.9+) renames the metadata columns dbt creates: ~dbt_valid_from~, ~dbt_valid_to~, ~dbt_scd_id~, ~dbt_updated_at~ and ~dbt_is_deleted~.`,
    `~alias~ changes the object name, and ~column_types~ is a seed config.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/snapshot_meta_column_names'
},
{
  id: 'd1-snap-best-domc', d: 'd1', type: 'domc',
  topic: 'Creating snapshots in YAML',
  stem: `Which statement reflects dbt's recommended practice for snapshots?`,
  options: [
    `Snapshot the raw source (or a light ephemeral model over it) and keep business logic in downstream models.`,
    `Run ~dbt snapshot --full-refresh~ to rebuild the history whenever the snapshot logic changes.`,
    `Prefer the ~check~ strategy over ~timestamp~ even when a reliable ~updated_at~ column exists.`,
    `Build snapshots in the same schema as staging views, so they are dropped and rebuilt with the project.`
  ],
  answer: 0,
  exp: [
    `Snapshots keep a history that **can't be recreated**, so capture the data as raw as possible and transform it later. Heavy logic inside the snapshot gets frozen into the history.`,
    `Snapshots ignore ~--full-refresh~. ~timestamp~ is the preferred strategy when there is a reliable ~updated_at~. Use a separate, protected schema for snapshots.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/snapshots'
},
{
  id: 'd1-inc-osc', d: 'd1', type: 'mc',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `You added a new column, ~discount_amount~, to an incremental model with no ~on_schema_change~ config. ~dbt run~ succeeds, but the column doesn't appear in the target table. What should you do?`,
  options: [
    `Set ~on_schema_change: append_new_columns~. Existing rows will have NULL in the new column unless you run a ~--full-refresh~.`,
    `Nothing; dbt failed silently, so just run the model again.`,
    `Add ~discount_amount~ to the ~unique_key~.`,
    `Change the strategy to ~delete+insert~, which always adds new columns.`
  ],
  answer: 0,
  exp: [
    `The default is ~on_schema_change: ignore~: new columns do **not** go into the table (and removing a column makes the run fail). With ~append_new_columns~, the column is added.`,
    `No option backfills the history of old rows; for that, use ~--full-refresh~ or a manual update.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-models#what-if-the-columns-of-my-incremental-model-change'
},
{
  id: 'd1-inc-osc-match', d: 'd1', type: 'match',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `Match each ~on_schema_change~ value to its behavior.`,
  left: [
    `~ignore~ (default)`,
    `~fail~`,
    `~append_new_columns~`,
    `~sync_all_columns~`
  ],
  right: [
    `New columns are not added; removing a column makes the run fail`,
    `The run errors when the source and target schemas diverge`,
    `Adds new columns but keeps columns missing from the new data`,
    `Adds new columns, removes missing ones, and applies type changes`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `No value fills new columns on old rows. Contracts on incremental models require ~append_new_columns~ or ~fail~. ~sync_all_columns~ can be expensive on some platforms (on BigQuery, changing a type requires scanning the table).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-models'
},
{
  id: 'd1-inc-late', d: 'd1', type: 'hotspot',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `Events can arrive up to 2 days late, with an ~event_at~ in the past. Analysts report that late events never reach this table. Click the line that causes them to be dropped.`,
  code: [
    {
      lang: 'sql',
      label: 'models/marts/fct_events.sql',
      hotspot: true,
      text: `
    {{ config(materialized='incremental', unique_key='event_id') }}

    select
        event_id,
        user_id,
        event_type,
        event_at
    from {{ ref('stg_events') }}
    {% if is_incremental() %}
    where event_at > (select max(event_at) from {{ this }})
    {% endif %}`
    }
  ],
  answer: 9,
  exp: [
    `The filter only brings events whose ~event_at~ is greater than the maximum already loaded. A late event has an old ~event_at~ and never gets through.`,
    `Use a safety window, such as ~where event_at >= (select max(event_at) from {{ this }}) - interval '2 days'~ (or ~dateadd~). Since there is a ~unique_key~, the reprocessed rows are updated by the merge instead of duplicated. With microbatch, the ~lookback~ config plays the same role.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-models'
},
{
  id: 'd1-inc-predicates', d: 'd1', type: 'mc',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `A merge-based incremental model writes into a 5 TB target table. Each run's merge scans the whole target, but new rows can only match target rows from the last 7 days. Which config reduces the scan on the target?`,
  options: [
    `~incremental_predicates: ["DBT_INTERNAL_DEST.event_date > dateadd(day, -7, current_date)"]~`,
    `~on_schema_change: ignore~`,
    `~full_refresh: false~`,
    `~merge_update_columns: ['event_date']~`
  ],
  answer: 0,
  exp: [
    `~incremental_predicates~ adds conditions to the ~merge~ (or the delete), limiting which rows of the target table are considered. ~DBT_INTERNAL_DEST~ is the alias of the target table and ~DBT_INTERNAL_SOURCE~ the alias of the new data.`,
    `It is an advanced optimization for large volumes; dbt doesn't validate the SQL you provide.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy#about-incremental_predicates'
},
{
  id: 'd1-inc-merge-exclude', d: 'd1', type: 'mc',
  topic: 'Selecting the optimal incremental strategy based on a dataset\'s characteristics',
  stem: `An incremental model uses ~merge~ with ~unique_key='customer_id'~. When an existing customer is updated, ~first_seen_at~ must keep its original value, while every other column is refreshed. Which config achieves this?`,
  options: [
    `~merge_exclude_columns: ['first_seen_at']~`,
    `~merge_update_columns: ['first_seen_at']~`,
    `~on_schema_change: ignore~`,
    `~unique_key: 'first_seen_at'~`
  ],
  answer: 0,
  exp: [
    `By default, merge overwrites every column of the matched rows. ~merge_exclude_columns~ lists the columns that are **not** updated; ~merge_update_columns~ does the opposite and updates **only** the listed columns.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-strategy'
},
{
  id: 'd1-empty-cmds', d: 'd1', type: 'multi',
  choose: 2,
  topic: 'Validating model logic and schema definitions in dry-runs using the --empty flag',
  stem: `Which two of these commands accept the ~--empty~ flag? (Choose two.)`,
  options: [
    `~dbt run~`,
    `~dbt build~`,
    `~dbt test~`,
    `~dbt source freshness~`,
    `~dbt docs generate~`
  ],
  answers: [0, 1],
  exp: [
    `~--empty~ exists on commands that build or compile nodes: ~run~, ~build~, ~snapshot~ and ~compile~ (and ~seed~ from 1.12). It limits refs and sources to zero rows, validating SQL and dependencies without read costs.`,
    `~test~, ~source freshness~ and ~docs generate~ don't offer the flag.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/empty-flag'
},
{
  id: 'd1-empty-python', d: 'd1', type: 'mc',
  topic: 'Validating model logic and schema definitions in dry-runs using the --empty flag',
  stem: `Your project has SQL models and one Python model, ~ml_scores~. You run ~dbt build --empty~. What happens to ~ml_scores~?`,
  options: [
    `The flag is ignored for Python models, so ~ml_scores~ processes its full input data.`,
    `~ml_scores~ is skipped.`,
    `~ml_scores~ is built as an empty table.`,
    `The command fails, because ~--empty~ is not compatible with Python models.`
  ],
  answer: 0,
  exp: [
    `The documentation says ~--empty~ is **ignored** for Python models (so is ~--sample~). The model runs normally, with all the data.`,
    `Keep this in mind for the cost of a ~build --empty~ in CI: heavy Python models are still expensive.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/empty-flag'
},
{
  id: 'd1-sample-static', d: 'd1', type: 'mc',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `You want to build ~fct_sessions~ in development using only input data from July 1–8, 2024. Which command is correct?`,
  options: [
    `~dbt run --select fct_sessions --sample="{'start': '2024-07-01', 'end': '2024-07-08'}"~`,
    `~dbt run --select fct_sessions --event-time-start "2024-07-01" --event-time-end "2024-07-08"~`,
    `~dbt run --select fct_sessions --sample="2024-07-01:2024-07-08"~`,
    `~dbt run --select fct_sessions --sample-start "2024-07-01"~`
  ],
  answer: 0,
  exp: [
    `~--sample~ accepts a relative window (~"3 days"~) or a static one, as a dictionary with ~start~ and ~end~. It filters the inputs that have ~event_time~ configured.`,
    `~--event-time-start~/~--event-time-end~ are for backfilling **microbatch** models; that is a different feature, with a different purpose.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'd1-sample-domc', d: 'd1', type: 'domc',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `Which statement about sample mode (~--sample~) is correct?`,
  options: [
    `It is time-based: refs and sources are filtered using their configured ~event_time~.`,
    `It reads a random percentage of rows from each input, like ~TABLESAMPLE~.`,
    `It can be used with ~dbt test~ and ~dbt source freshness~.`,
    `It also samples the inputs of Python models.`
  ],
  answer: 0,
  exp: [
    `Sample mode filters by time, using the ~event_time~ of each ref or source; inputs without ~event_time~ are read in full. It is available in ~dbt run~ and ~dbt build~ and is ignored for Python models.`,
    `Seeds are built normally, but they are sampled when referenced by downstream models (if they have ~event_time~).`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'd1-sample-render', d: 'd1', type: 'mc',
  topic: 'Running models in sample mode using the --sample flag',
  stem: `~fct_sales~ joins ~dim_dates~, which has ~event_time~ configured. In sample mode, ~dim_dates~ gets filtered too, and the calendar loses rows that ~fct_sales~ needs. How do you keep ~dim_dates~ unsampled only in this model?`,
  options: [
    `Reference it as ~{{ ref('dim_dates').render() }}~.`,
    `Reference it as ~{{ ref('dim_dates', sample=false) }}~.`,
    `Add ~--exclude dim_dates~ to the command.`,
    `Replace the ref with ~{{ source('calendar', 'dim_dates') }}~.`
  ],
  answer: 0,
  exp: [
    `~.render()~ makes the ref render as the full relation name, **without** the sampling filter. The same trick turns off automatic upstream filtering in microbatch.`,
    `• ~sample=false~ doesn't exist.`,
    `• ~--exclude~ only removes the node from the selection; it doesn't change how it is read.`,
    `• Switching to ~source()~ would break the lineage.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/sample-flag'
},
{
  id: 'd1-mb-backfill', d: 'd1', type: 'mc',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `A microbatch model with ~batch_size='day'~ needs to reprocess September 1 through September 3, 2024. Which command runs exactly those batches?`,
  options: [
    `~dbt run --select fct_sessions --event-time-start "2024-09-01" --event-time-end "2024-09-04"~`,
    `~dbt run --select fct_sessions --event-time-start "2024-09-01"~`,
    `~dbt run --select fct_sessions --sample="{'start': '2024-09-01', 'end': '2024-09-04'}"~`,
    `~dbt run --select fct_sessions --full-refresh --vars '{"start": "2024-09-01"}'~`
  ],
  answer: 0,
  exp: [
    `Microbatch backfills use ~--event-time-start~ and ~--event-time-end~, which are required **together**. Each batch in the range becomes an independent query. Batches follow half-open intervals (~>= start~ and ~< end~), so with the end on September 4, the batches for September 1, 2 and 3 are processed.`,
    `~--sample~ is for development and doesn't overwrite batches in a controlled way. ~--full-refresh~ without the range would rebuild everything since ~begin~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch#backfills'
},
{
  id: 'd1-mb-required', d: 'd1', type: 'multi',
  choose: 3,
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `On Snowflake, besides ~materialized='incremental'~ and ~incremental_strategy='microbatch'~, which three configs are required on a microbatch model? (Choose three.)`,
  options: [
    `~event_time~`,
    `~begin~`,
    `~batch_size~`,
    `~lookback~`,
    `~unique_key~`
  ],
  answers: [0, 1, 2],
  exp: [
    `Required: ~event_time~ (the row's time column), ~begin~ (the "beginning of time" for the initial or full build) and ~batch_size~ (~hour~, ~day~, ~month~ or ~year~).`,
    `~lookback~ is optional (default 1). ~unique_key~ is only required on some platforms, such as Postgres, where microbatch uses merge.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'd1-mb-upstream', d: 'd1', type: 'mc',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `Each daily batch of a microbatch model scans the entire 3 TB ~stg_order_items~ table it refs, which makes every batch slow. What should you change?`,
  options: [
    `Configure ~event_time~ on ~stg_order_items~, so dbt filters it to each batch's time window.`,
    `Set ~lookback: 0~ on the microbatch model.`,
    `Set ~concurrent_batches: true~ on the microbatch model.`,
    `Reference it as ~{{ ref('stg_order_items').render() }}~.`
  ],
  answer: 0,
  exp: [
    `Microbatch only automatically filters upstream models that have ~event_time~ configured; the others are read in full in **every** batch. Configure ~event_time~ on the relevant parents, even if the column has a different name.`,
    `~.render()~ does the opposite (it turns the filter off). Running batches in parallel doesn't reduce the volume read per batch.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
},
{
  id: 'd1-mb-lookback', d: 'd1', type: 'mc',
  topic: 'Understanding advanced dbt materializations such as microbatch',
  stem: `A daily microbatch model receives records up to 3 days late. Which config ensures each run reprocesses enough prior batches to pick them up?`,
  options: [
    `~lookback: 3~`,
    `~begin: 3~`,
    `~batch_size: 'month'~`,
    `~concurrent_batches: true~`
  ],
  answer: 0,
  exp: [
    `~lookback~ sets how many batches before the last processed one are redone on each run (default 1). With delays of up to 3 days and daily batches, ~lookback: 3~ makes sure that data gets in.`,
    `~begin~ is the start date, ~batch_size~ sets the granularity and ~concurrent_batches~ controls parallelism.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
}
);
