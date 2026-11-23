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
    `Declarar o pacote em ~packages.yml~ não basta: ~dbt deps~ baixa os pacotes para ~dbt_packages/~ (e atualiza o ~package-lock.yml~). Sem isso, os macros do pacote não existem no contexto Jinja.`,
    `Rode ~dbt deps~ sempre que alterar ~packages.yml~ e em cada ambiente novo (CI, jobs de produção).`
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
    `O ~dbt_project.yml~ do projeto raiz pode configurar recursos de pacotes usando o **nome do pacote** como chave sob ~models:~ (o mesmo vale para ~+enabled: false~ e outras configs).`,
    `Arquivos em ~dbt_packages/~ são sobrescritos a cada ~dbt deps~. ~packages.yml~ só declara o que instalar, e ~profiles.yml~ só define conexões.`
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
    `~dependencies.yml~ aceita pacotes e dependências de projetos (dbt Mesh), mas **não renderiza Jinja**. Quando você precisa de ~env_var()~ na definição (como tokens de repositórios privados), use ~packages.yml~.`,
    `Variáveis ~DBT_ENV_SECRET_~ são permitidas em ~packages.yml~ e ficam mascaradas nos logs.`
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
    `Pacotes do Hub aceitam uma versão exata ou um intervalo como lista de restrições. O intervalo permite correções e melhorias sem pular para uma versão major com mudanças incompatíveis. O ~package-lock.yml~ fixa o que foi resolvido.`,
    `• ~">1.1.0"~ aceitaria a 2.x e exclui a própria 1.1.0.`,
    `• ~revision~ é para pacotes Git.`
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
    `Modelos Python não renderizam Jinja. Valores de ~target~, ~var~ ou ~env_var~ entram por configs no YAML (onde o Jinja é renderizado) e são lidos com ~dbt.config.get()~.`,
    `O código roda remotamente na plataforma de dados, então variáveis de ambiente da máquina do dbt não estão disponíveis. O objeto ~dbt~ expõe apenas ~ref~, ~source~, ~this~, ~is_incremental~ e ~config~.`
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
    `A config ~packages~ lista as bibliotecas Python que o modelo precisa, e a plataforma (Snowpark, por exemplo) as disponibiliza na execução remota.`,
    `~packages.yml~ é para pacotes **dbt**. Instalar localmente não adianta, porque o código não roda na máquina do dbt.`
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
    `Em Python, ~dbt.is_incremental~ cumpre o papel do macro ~is_incremental()~ do SQL, e ~dbt.this~ aponta para a tabela atual (~dbt.this.database~, ~.schema~, ~.identifier~).`,
    `Exemplo: ~df.filter(df.updated_at >= session.sql(f"select max(updated_at) from {dbt.this}").collect()[0][0])~.`
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
    `O dbt faz os grants do objeto ficarem **iguais** à lista configurada: quem sai da lista é revogado. Para tirar todos, use ~select: []~.`,
    `• Apagar a config ~grants~ inteira faz o dbt parar de gerenciar os grants, e ele não revoga nada.`,
    `• ~'+select'~ adiciona aos grants herdados.`,
    `• A chave ~revoke~ não existe.`
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
    `A config ~grants~ aceita Jinja, então dá para variar pelo contexto (~target.name~). Assim o mesmo código serve para dev e prod.`,
    `• ~profiles.yml~ não aceita configs de recursos.`,
    `• A var sugerida não está ligada a nenhuma config.`,
    `• Revogar à mão anula o propósito de gerenciar grants pelo dbt.`
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
    `~grants~ vale para recursos que o dbt materializa como tabela ou view: **models, seeds e snapshots**. Sources são objetos que o dbt só lê, exposures não criam objetos e unit tests não persistem nada.`
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
    `No snapshot, a linha vigente é a que ainda não foi fechada, ou seja, ~dbt_valid_to~ é nulo. Com ~dbt_valid_to_current~ configurado (por exemplo ~'9999-12-31'~), filtre por esse valor.`,
    `• O ~max(dbt_valid_from)~ da tabela inteira retornaria só as mudanças mais recentes.`,
    `• ~dbt_is_deleted~ só existe com ~hard_deletes: new_record~.`
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
    `A estratégia ~timestamp~ exige ~updated_at~, a coluna que indica quando a linha mudou. Já ~check_cols~ é obrigatório na estratégia ~check~, e ~unique_key~ e ~relation~ valem para as duas.`,
    `~hard_deletes~ e o schema são opcionais. Desde o dbt 1.9, ~target_schema~ deixou de ser obrigatório, e o snapshot usa ~generate_schema_name~.`
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
    `~snapshot_meta_column_names~ (dbt 1.9+) renomeia as colunas de metadados que o dbt cria: ~dbt_valid_from~, ~dbt_valid_to~, ~dbt_scd_id~, ~dbt_updated_at~ e ~dbt_is_deleted~.`,
    `~alias~ muda o nome do objeto, e ~column_types~ é config de seeds.`
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
    `Snapshots guardam um histórico que **não pode ser recriado**, então capture o dado o mais bruto possível e transforme depois. Lógica pesada dentro do snapshot fica congelada no histórico.`,
    `Snapshots ignoram ~--full-refresh~. ~timestamp~ é a estratégia preferida quando existe ~updated_at~ confiável. Use um schema separado e protegido para os snapshots.`
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
    `O padrão é ~on_schema_change: ignore~: colunas novas **não** entram na tabela (e remover uma coluna faz a execução falhar). Com ~append_new_columns~, a coluna é adicionada.`,
    `Nenhuma opção preenche o histórico das linhas antigas; para isso use ~--full-refresh~ ou um update manual.`
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
    `Nenhum valor preenche colunas novas em linhas antigas. Contratos em incrementais exigem ~append_new_columns~ ou ~fail~. ~sync_all_columns~ pode ser caro em algumas plataformas (no BigQuery, mudar tipo exige varrer a tabela).`
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
    `O filtro só traz eventos com ~event_at~ maior que o máximo já carregado. Um evento atrasado tem ~event_at~ antigo e nunca passa por ele.`,
    `Use uma janela de segurança, como ~where event_at >= (select max(event_at) from {{ this }}) - interval '2 days'~ (ou ~dateadd~). Como existe ~unique_key~, as linhas reprocessadas são atualizadas pelo merge em vez de duplicadas. No microbatch, a config ~lookback~ faz o mesmo papel.`
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
    `~incremental_predicates~ adiciona condições ao ~merge~ (ou ao delete), limitando quais linhas da tabela de destino são consideradas. ~DBT_INTERNAL_DEST~ é o alias da tabela de destino e ~DBT_INTERNAL_SOURCE~ o dos dados novos.`,
    `É uma otimização avançada para volumes grandes; o dbt não valida o SQL informado.`
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
    `Por padrão, o merge sobrescreve todas as colunas das linhas encontradas. ~merge_exclude_columns~ lista as colunas que **não** são atualizadas; ~merge_update_columns~ faz o inverso e atualiza **só** as colunas listadas.`
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
    `~--empty~ existe em comandos que constroem ou compilam nós: ~run~, ~build~, ~snapshot~ e ~compile~ (e ~seed~ a partir do 1.12). Ele limita refs e sources a zero linhas, validando SQL e dependências sem custo de leitura.`,
    `~test~, ~source freshness~ e ~docs generate~ não oferecem o flag.`
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
    `A documentação diz que ~--empty~ é **ignorado** em modelos Python (o ~--sample~ também). O modelo roda normalmente, com todos os dados.`,
    `Leve isso em conta no custo de um ~build --empty~ em CI: modelos Python pesados continuam caros.`
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
    `~--sample~ aceita uma janela relativa (~"3 days"~) ou estática, no formato de dicionário com ~start~ e ~end~. Ele filtra as entradas que têm ~event_time~ configurado.`,
    `~--event-time-start~/~--event-time-end~ servem para backfill de modelos **microbatch**; é outro recurso, com outro propósito.`
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
    `O sample mode filtra por tempo, usando o ~event_time~ de cada ref ou source; entradas sem ~event_time~ são lidas inteiras. Está disponível em ~dbt run~ e ~dbt build~ e é ignorado em modelos Python.`,
    `Seeds são criados normalmente, mas são amostrados quando referenciados por modelos a jusante (se tiverem ~event_time~).`
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
    `~.render()~ faz o ref ser renderizado como o nome completo da relação, **sem** o filtro de amostragem. O mesmo truque desliga a filtragem automática de upstreams no microbatch.`,
    `• ~sample=false~ não existe.`,
    `• ~--exclude~ só tira o nó da seleção; não muda como ele é lido.`,
    `• Trocar por ~source()~ quebraria a linhagem.`
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
    `Backfills de microbatch usam ~--event-time-start~ e ~--event-time-end~, que são obrigatórios **juntos**. Cada lote do intervalo vira uma consulta independente. Os lotes seguem intervalos semiabertos (~>= início~ e ~< fim~), então, com o fim em 04/09, são processados os lotes de 1, 2 e 3 de setembro.`,
    `~--sample~ é para desenvolvimento e não sobrescreve lotes de forma controlada. ~--full-refresh~ sem o intervalo reconstruiria tudo desde ~begin~.`
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
    `Obrigatórios: ~event_time~ (a coluna de tempo da linha), ~begin~ (o "início dos tempos" para o build inicial ou completo) e ~batch_size~ (~hour~, ~day~, ~month~ ou ~year~).`,
    `~lookback~ é opcional (padrão 1). ~unique_key~ só é exigido em algumas plataformas, como o Postgres, onde o microbatch usa merge.`
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
    `O microbatch só filtra automaticamente os upstreams que têm ~event_time~ configurado; os demais são lidos por inteiro em **cada** lote. Configure ~event_time~ nos pais relevantes, mesmo que a coluna tenha outro nome.`,
    `~.render()~ faz o oposto (desliga o filtro). Paralelizar lotes não reduz o volume lido por lote.`
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
    `~lookback~ define quantos lotes anteriores ao último processado são refeitos em cada execução (padrão 1). Com atraso de até 3 dias e lotes diários, ~lookback: 3~ garante que esses dados entrem.`,
    `~begin~ é a data inicial, ~batch_size~ define a granularidade e ~concurrent_batches~ controla o paralelismo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/incremental-microbatch'
}
);
