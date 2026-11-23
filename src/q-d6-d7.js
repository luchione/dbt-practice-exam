/* Domain 6 · External dependencies (8) and Domain 7 · dbt state (8) · bank expansion */
window.DBT_Q.push(
{
  id: 'd6-e-hotspot', d: 'd6', type: 'hotspot',
  topic: 'Implementing dbt exposures',
  stem: `~dbt parse~ fails for this exposure. Click the line that causes the problem.`,
  code: [{ lang: 'yaml', label: 'models/marts/_exposures.yml', hotspot: true, text: `
    exposures:
      - name: Weekly Revenue Dashboard
        type: dashboard
        maturity: high
        url: https://bi.example.com/dashboards/42
        owner:
          name: Finance Analytics
          email: finance@example.com
        depends_on:
          - ref('fct_revenue')` }],
  answer: 1,
  exp: [
    `O ~name~ de uma exposure só pode ter letras, números e underscores (desde o 1.10, nomes com espaços geram erro por padrão). Use ~name: weekly_revenue_dashboard~ e coloque o nome amigável em ~label: Weekly Revenue Dashboard~.`,
    `~type~, ~maturity~, ~url~, ~owner~ e ~depends_on~ estão corretos.`
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
    `~depends_on~ aceita ~ref()~, ~source()~ e ~metric()~, escritos como chamadas Jinja em texto. Assim a exposure aparece no fim do DAG ligada a tudo o que ela consome, e ~+exposure:nome~ passa a selecionar todos os ancestrais.`
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
    `Exposures são declarativas: não executam nada nem criam objetos. Servem para documentar quem consome os dados (com ~owner~, ~url~, ~maturity~), mostrar a linhagem até o consumidor final e permitir seleções como ~dbt build --select +exposure:nome~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'd6-e-maturity', d: 'd6', type: 'fill',
  topic: 'Implementing dbt exposures',
  stem: `Complete the blank. The exposure property that signals how stable or trustworthy the exposure is, with the values ~high~, ~medium~, or ~low~, is called ______.`,
  accept: ['maturity'],
  exp: [
    `~maturity~ indica o nível de confiança e estabilidade do consumidor declarado. Outras propriedades: ~type~ (~dashboard~, ~notebook~, ~analysis~, ~ml~, ~application~), ~owner~, ~depends_on~, ~url~, ~description~ e ~label~.`
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
    `~loaded_at_query~ (1.10+) é uma alternativa a ~loaded_at_field~: um SQL que retorna o timestamp da última carga. Definir os dois no mesmo recurso gera erro de parse.`,
    `~filter~ só adiciona um WHERE à consulta padrão. Os períodos válidos em ~warn_after~ e ~error_after~ são ~minute~, ~hour~ e ~day~.`
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
    `Sem ~loaded_at_field~, adapters compatíveis usam metadados do warehouse (como a data da última alteração) para medir a freshness.`,
    `~dbt build~ **não** roda freshness; é um comando separado (~dbt source freshness~). Os períodos são só ~minute~, ~hour~ e ~day~, e ~freshness: null~ **desliga** a checagem.`
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
    `~source_status:fresher~ compara o ~sources.json~ atual com o do estado anterior e seleciona as sources com dados mais novos; o ~+~ inclui tudo a jusante. Por isso é preciso rodar ~dbt source freshness~ antes, gerando um ~sources.json~ novo.`,
    `~state:modified~ compara **código**, não dados.`
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
    `Cada source recebe PASS, WARN ou ERROR conforme os limites. Qualquer ERROR faz o comando terminar com código de erro, o que interrompe pipelines que dependem dele. WARN não falha a execução.`,
    `O dbt não carrega dados nem pula modelos por causa da freshness. Para reagir aos resultados, use o seletor ~source_status~.`
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
    `Por padrão, o ~--defer~ só usa produção para pais **que não existem** no seu ambiente. Com ~--favor-state~, o dbt usa o objeto do manifest de ~--state~ mesmo quando existe uma versão no seu target.`
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
    `Defer muda **como os ~ref()~ são resolvidos**: pais não selecionados e inexistentes no seu ambiente apontam para os objetos de produção descritos no ~manifest.json~ de ~--state~. Nada é copiado nem reconstruído.`,
    `Para criar objetos reais no seu schema, o comando é ~dbt clone~.`
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
    `~state:modified~ compara o manifest atual com o de produção. Configs que dependem do ambiente (~target.name~, ~env_var~, ~var~) renderizam valores diferentes em CI e geram **falsos positivos**.`,
    `Evite esse tipo de lógica em configs ou centralize-a em macros como ~generate_schema_name~ (mudanças de schema e alias são tratadas por ~state:modified.relation~). Tags e meta não contam como modificação.`
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
    `Para seeds menores que 1 MiB, o dbt compara o conteúdo. A partir de 1 MiB, compara só o **caminho**, para não pesar no manifest. Nesse caso, selecione o seed explicitamente no CI (por exemplo, ~--select state:modified+ my_seed+~).`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'd7-st-artifacts', d: 'd7', type: 'match',
  topic: 'Understanding state and state selection',
  stem: `Match each selector to the artifact it reads from the ~--state~ directory. One option is not used.`,
  left: [`~state:modified~`, `~result:fail~`, `~source_status:fresher~`],
  right: [`manifest.json`, `run_results.json`, `sources.json`, `catalog.json`],
  answer: [0, 1, 2],
  exp: [
    `• ~manifest.json~ descreve o projeto (código e configs), usado por ~state:~ e por ~--defer~.`,
    `• ~run_results.json~ guarda o status de cada nó, usado por ~result:~ e pelo ~dbt retry~.`,
    `• ~sources.json~ guarda os resultados de ~dbt source freshness~, usado por ~source_status:~.`,
    `• ~catalog.json~ é gerado por ~dbt docs generate~ para a documentação.`
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
    `~dbt retry~ lê o ~run_results.json~ e retoma do ponto de falha: o nó que falhou (aqui, o teste) e os nós pulados por causa dele. O que já tinha passado não é refeito.`,
    `Se nada tivesse falhado, o retry terminaria sem executar nada.`
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
    `O retry depende dos nós registrados no ~run_results.json~. Se a falha aconteceu antes de qualquer nó rodar (conexão, permissões), não há ponto de onde retomar, e o certo é rodar de novo o comando completo.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'd7-r-artifact', d: 'd7', type: 'fill',
  topic: 'Using dbt retry',
  stem: `Complete the blank with the artifact file name. ~dbt retry~ decides where to resume by reading ______ from the previous invocation.`,
  accept: ['run_results.json', 'run_results', 'run results', 'run_results json'],
  exp: [
    `~run_results.json~ guarda o status de cada nó da última execução. O retry re-executa os que tiveram erro ou falha e os que foram pulados. Ele suporta ~build~, ~run~, ~test~, ~seed~, ~snapshot~, ~compile~, ~clone~, ~docs generate~ e ~run-operation~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
}
);
