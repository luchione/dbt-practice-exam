/* Prova 2 · nível real — D2 (7), D3 (9), D4 (5). */
window.DBT_Q.push(

/* ── D2 ── */
{
  id: 'p2-d2-contract-mismatch', exam: 'p2', lvl: 2, art: 'yaml', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `A developer adds the column ~loyalty_tier~ to the ~select~ in ~dim_customers.sql~ but doesn't edit this YAML. What happens on ~dbt run --select dim_customers~?`,
  code: [{ lang: 'yaml', label: 'models/marts/_marts.yml', text: `
    models:
      - name: dim_customers
        config:
          contract:
            enforced: true
        columns:
          - name: customer_id
            data_type: int
          - name: customer_name
            data_type: varchar` }],
  options: [
    `The model builds, and dbt drops ~loyalty_tier~ so that the table matches the contract.`,
    `The model builds with the new column, and dbt logs a warning about the contract.`,
    `The model fails before the table is built, with an error that lists the mismatch.`,
    `The model builds, and the mismatch surfaces later, when ~dbt test~ runs.`
  ],
  answer: 2,
  exp: [`Com ~contract.enforced: true~, o dbt compara os nomes e os tipos das colunas que a consulta devolve com o YAML antes de construir. Qualquer diferença, inclusive uma coluna a mais, interrompe o modelo.`],
  why: [
    `O dbt não ajusta a consulta ao contrato; ele recusa a construção.`,
    `Quebra de contrato é erro, não aviso.`,
    `A checagem acontece antes da criação da tabela e o erro mostra as colunas divergentes.`,
    `O contrato é verificado na construção do modelo, não nos data tests.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'p2-d2-contract-support', exam: 'p2', lvl: 3, d: 'd2', type: 'multi', choose: 2,
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
  exp: [`Contratos valem para modelos SQL materializados como ~table~, ~view~ ou ~incremental~. No incremental, só com ~on_schema_change~ igual a ~append_new_columns~ ou ~fail~.`],
  why: [
    `Modelo SQL em ~table~ é o caso básico.`,
    `Incremental é aceito com ~append_new_columns~ ou ~fail~.`,
    `~sync_all_columns~ poderia remover colunas e quebrar o contrato, por isso não é aceito.`,
    `Modelos Python não suportam contratos.`,
    `Um modelo ephemeral não cria relação, então não há onde garantir o contrato.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'p2-d2-constraints-platform', exam: 'p2', lvl: 3, art: 'yaml', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `On Snowflake, the query of ~dim_customers~ returns two rows with the same ~email~ and no NULL ~customer_id~. What happens on ~dbt run~?`,
  code: [{ lang: 'yaml', label: 'models/marts/_marts.yml', text: `
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
              - type: unique` }],
  options: [
    `The run fails, because Snowflake rejects the duplicate when the table is loaded.`,
    `The run succeeds, and dbt then runs a ~unique~ data test generated from the constraint.`,
    `The run fails at parse time, because ~unique~ constraints aren't allowed on Snowflake.`,
    `The run succeeds; Snowflake records the ~unique~ constraint but doesn't enforce it.`
  ],
  answer: 3,
  exp: [`Constraints são aplicadas pela plataforma, e cada uma decide o que impõe. No Snowflake, só ~not_null~ é imposta; ~unique~, ~primary_key~ e ~foreign_key~ ficam registradas como metadado. Para garantir unicidade ali, use um data test.`],
  why: [
    `O Snowflake aceita a constraint ~unique~, mas não a verifica na carga.`,
    `Constraints não geram data tests; são coisas separadas.`,
    `~unique~ é suportada no Snowflake (definida, não imposta). A que não é suportada é ~check~.`,
    `A tabela é criada com a constraint declarada e as duas linhas entram.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'p2-d2-constraints-fill', exam: 'p2', lvl: 1, art: 'yaml', d: 'd2', type: 'fill',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `Complete the model-level constraint type that declares ~order_id~ plus ~line_number~ as the table's primary key.`,
  code: [{ lang: 'yaml', label: 'models/marts/_marts.yml', text: `
    models:
      - name: fct_order_lines
        config:
          contract: {enforced: true}
        constraints:
          - type: ______
            columns: [order_id, line_number]` }],
  accept: ['primary_key'],
  exp: [`Chaves de mais de uma coluna são declaradas no nível do modelo, com ~type: primary_key~ e a lista ~columns~. Constraints exigem um contrato com ~enforced: true~.`],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'p2-d2-versions-ref', exam: 'p2', lvl: 2, art: 'yaml', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `With default aliases, which relations do ~{{ ref('dim_customers') }}~ and ~{{ ref('dim_customers', v=3) }}~ resolve to?`,
  code: [{ lang: 'yaml', label: 'models/marts/_marts.yml', text: `
    models:
      - name: dim_customers
        latest_version: 2
        versions:
          - v: 1
          - v: 2
          - v: 3` }],
  options: [
    `~dim_customers~ and ~dim_customers_v3~`,
    `~dim_customers_v2~ and ~dim_customers_v3~`,
    `~dim_customers_v3~ and ~dim_customers_v3~`,
    `~dim_customers_v2~ and a compilation error`
  ],
  answer: 1,
  exp: [`O ~ref()~ sem versão vai para ~latest_version~ (2). A versão 3, acima dela, é prerelease: existe e pode ser referenciada com ~v=3~. O alias padrão de cada versão é ~<modelo>_v<versão>~.`],
  why: [
    `Sem configuração extra, nenhuma relação fica com o nome sem sufixo.`,
    `Sem versão vai para a v2 (~latest_version~); com ~v=3~ vai para a v3.`,
    `A maior versão só seria a "latest" se ~latest_version~ não estivesse definido.`,
    `Uma versão prerelease pode ser referenciada normalmente por quem fixa a versão.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'p2-d2-deprecation', exam: 'p2', lvl: 2, d: 'd2', type: 'multi', choose: 2,
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
  exp: [`~deprecation_date~ é um aviso de prazo. Depois da data, o dbt só emite warnings; nada é desligado nem redirecionado. Quem quiser tratar como erro pode promover o warning com ~--warn-error-options~.`],
  why: [
    `Referenciar um modelo com data vencida gera um warning.`,
    `O modelo continua existindo e sendo construído; o ref continua válido.`,
    `O dbt não desativa nem remove o modelo sozinho.`,
    `Um ref fixado em ~v=1~ continua apontando para a v1.`,
    `É warning, não erro de parsing.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/deprecation_date'
},
{
  id: 'p2-d2-versions-domc', exam: 'p2', lvl: 2, d: 'd2', type: 'domc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Which statement about model versions is correct?`,
  options: [
    `By default, the SQL for version 2 of ~dim_customers~ lives in ~dim_customers_v2.sql~.`,
    `~latest_version~ must always be the highest version number that is declared in the YAML.`,
    `An unpinned ~ref()~ raises an error once a model has more than one version.`,
    `dbt drops the relation of an old version when its ~deprecation_date~ passes.`
  ],
  answer: 0,
  exp: [`Cada versão tem o próprio arquivo, por padrão ~<modelo>_v<versão>.sql~ (dá para mudar com ~defined_in~).`],
  why: [
    `É a convenção padrão de nome de arquivo por versão.`,
    `~latest_version~ pode ser menor que a maior versão; as que ficam acima são prerelease.`,
    `O ref sem versão resolve para a versão "latest".`,
    `O dbt nunca remove relações por causa de ~deprecation_date~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},

/* ── D3 ── */
{
  id: 'p2-d3-log-db', exam: 'p2', lvl: 3, art: 'log', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `What does this log tell you, and what is the best next step?`,
  code: [{ lang: 'log', label: 'terminal', text: `
    14:02:11  1 of 1 START sql table model marts.fct_orders ......... [RUN]
    14:02:13  1 of 1 ERROR creating sql table model marts.fct_orders  [ERROR in 1.92s]
    14:02:13  Database Error in model fct_orders (models/marts/fct_orders.sql)
    14:02:13    000904 (42000): SQL compilation error: error line 12 at position 4
    14:02:13    invalid identifier 'ORDER_TOTAL'
    14:02:13    compiled code at target/run/jaffle_shop/models/marts/fct_orders.sql` }],
  options: [
    `dbt couldn't render the model's Jinja; check the macros and variables used on line 12 of the model file.`,
    `The warehouse rejected the SQL that dbt sent; open the compiled file and check where ~order_total~ should come from.`,
    `dbt couldn't parse the project; declare ~order_total~ under ~columns:~ in the model's properties YAML.`,
    `The warehouse rejected the SQL that dbt sent; rerun with ~--full-refresh~ so that the table is dropped and recreated first.`
  ],
  answer: 1,
  exp: [`"Database Error" significa que o dbt compilou e enviou o SQL, e o warehouse recusou. O texto "SQL compilation error" vem do Snowflake, não do Jinja. A linha 12 se refere ao SQL compilado.`],
  why: [
    `Falha de Jinja aparece como "Compilation Error" do dbt, antes de qualquer consulta.`,
    `O erro é do banco: a coluna não existe nas relações lidas. O arquivo compilado mostra o SQL exato.`,
    `Erro de parsing impede a execução de começar, e o YAML de propriedades não cria colunas.`,
    `O diagnóstico está certo, mas recriar a tabela repete a mesma consulta inválida.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-log-ref', exam: 'p2', lvl: 2, art: 'log', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `The project contains ~models/staging/stg_orders.sql~. ~dbt run~ stops with the message below. What is the cause and the fix?`,
  code: [{ lang: 'log', label: 'terminal', text: `
    Compilation Error in model fct_orders (models/marts/fct_orders.sql)
      Model 'model.jaffle_shop.fct_orders' (models/marts/fct_orders.sql) depends on a node named 'stg_order' which was not found` }],
  options: [
    `The relation ~stg_order~ doesn't exist in the warehouse yet; build the staging models first.`,
    `The staging model failed in an earlier run; rerun it so that dbt registers it again.`,
    `The properties YAML doesn't list ~stg_orders~; add it under ~models:~ so that dbt finds it.`,
    `The ~ref()~ in ~fct_orders~ names a model that isn't in the project; change it to ~stg_orders~.`
  ],
  answer: 3,
  exp: [`"Compilation Error ... depends on a node named ... which was not found" aparece quando o dbt monta o DAG, antes de falar com o warehouse: o nome dentro do ~ref()~ não corresponde a nenhum modelo ativo.`],
  why: [
    `O erro acontece antes de qualquer consulta; a existência da tabela nem chega a ser verificada.`,
    `O dbt descobre os modelos pelos arquivos do projeto, não pelo resultado de execuções anteriores.`,
    `Um modelo existe para o dbt por causa do arquivo ~.sql~; o YAML é opcional.`,
    `~stg_order~ é um erro de digitação de ~stg_orders~.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-compiled', exam: 'p2', lvl: 2, d: 'd3', type: 'multi', choose: 2,
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
  exp: [`~target/compiled~ tem o ~select~ puro, bom para colar no warehouse e depurar. ~target/run~ tem o comando completo que o dbt executou, como ~create or replace table ... as (...)~.`],
  why: [
    `É o SQL do modelo com refs, sources e macros já resolvidos.`,
    `Inclui o DDL ou DML da materialização em volta do ~select~.`,
    `O código com Jinja é o do próprio arquivo em ~models/~.`,
    `O dbt não grava os dados do modelo em arquivos.`,
    `~dbt run~, ~dbt build~ e ~dbt test~ também compilam e gravam esses arquivos.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-yaml-hotspot', exam: 'p2', lvl: 2, art: 'yaml', d: 'd3', type: 'hotspot',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt parse~ fails with a YAML syntax error in this file. Click the line that is indented incorrectly.`,
  code: [{ lang: 'yaml', label: 'models/staging/_stg_models.yml', hotspot: true, text: `
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
                    values: ['placed', 'shipped']` }],
  answer: 9,
  exp: [`~description~ da coluna ~status~ precisa ficar alinhada com ~name~ (dois espaços depois do traço), como ~data_tests~ logo abaixo. Do jeito que está, ela sai do item da lista e o YAML fica inválido.`],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-yaml-dup', exam: 'p2', lvl: 2, art: 'log', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `~dbt build~ stops with the message below. What is the cause and the fix?`,
  code: [{ lang: 'log', label: 'terminal', text: `
    Compilation Error
      dbt found two schema.yml entries for the same resource named stg_orders. Resources and their
      associated patches (i.e. schema.yml entries) must have unique names. To fix this, please delete
      or rename one of the entries.
       - models/staging/_stg_models.yml
       - models/staging/orders/_orders.yml` }],
  options: [
    `Two SQL files in those folders are both named ~stg_orders.sql~; rename one of the models.`,
    `Both YAML files describe ~stg_orders~ under ~models:~; keep the entry in only one file.`,
    `Both YAML files declare a source table named ~stg_orders~; set an ~identifier~ on one.`,
    `The two YAML files are nested in the same folder tree; move one of them out of it.`
  ],
  answer: 1,
  exp: [`Cada recurso só pode ter uma entrada de propriedades (um "patch"). Aqui o modelo ~stg_orders~ aparece em ~models:~ nos dois arquivos listados. Junte tudo em uma entrada só.`],
  why: [
    `Dois modelos com o mesmo nome geram outro erro, que cita os dois arquivos ~.sql~.`,
    `A mensagem fala de entradas de schema.yml duplicadas para o mesmo recurso.`,
    `Tabelas de source são identificadas por source e tabela; a mensagem trata de um recurso só.`,
    `Vários arquivos YAML na mesma árvore de pastas são permitidos.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-fix-order', exam: 'p2', lvl: 2, d: 'd3', type: 'order',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `A model fails in production because an upstream column was renamed. Put the steps of a safe fix in order.`,
  items: [
    `Create a branch from the main branch.`,
    `Reproduce the error by building the model in your development schema.`,
    `Change the SQL and run ~dbt build --select~ on the model and its children in development.`,
    `Open a pull request and let the CI job build and test the change.`,
    `Merge after the checks pass, so that the next production run uses the fix.`
  ],
  exp: [`Isolar a mudança num branch, reproduzir, corrigir e validar em desenvolvimento, validar de novo no CI e só então fazer o merge.`],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'p2-d3-fix-build', exam: 'p2', lvl: 1, art: 'cli', d: 'd3', type: 'mc',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You changed the logic of ~int_orders~ on your branch. Before opening a pull request, you want your development schema to show that the model and everything that depends on it still build and pass their tests. Which command does that?`,
  options: [
    `~dbt test --select int_orders+~, which runs every test of the model and its children`,
    `~dbt run --select int_orders+~, which rebuilds the model and its children`,
    `~dbt build --select int_orders+~, which rebuilds and tests the model and its children`,
    `~dbt compile --select int_orders+~, which validates the model and its children`
  ],
  answer: 2,
  exp: [`Só o ~dbt build~ reconstrói os modelos e roda os testes de cada um na ordem do DAG.`],
  why: [
    `Sem reconstruir, os testes rodam contra as relações antigas, com a lógica anterior.`,
    `Reconstrói, mas não roda nenhum teste.`,
    `Reconstrói com a lógica nova e testa cada nó antes de seguir para os filhos.`,
    `Só gera o SQL; nada é construído nem testado.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'p2-d3-flags-precedence', exam: 'p2', lvl: 2, art: 'yaml', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `The CI environment sets the environment variable for this same flag to ~buildable~, and the job runs ~dbt test --select stg_orders --indirect-selection eager~. Which mode does dbt use?`,
  code: [{ lang: 'yaml', label: 'dbt_project.yml', text: `
    flags:
      indirect_selection: cautious` }],
  options: [
    `~buildable~, because environment variables override both of the other settings.`,
    `~cautious~, because project flags are the version-controlled source of truth.`,
    `None: dbt raises an error when the three settings disagree with each other.`,
    `~eager~, because command-line options override both of the other settings.`
  ],
  answer: 3,
  exp: [`Para flags globais, a ordem é: opção na linha de comando, depois variável de ambiente, depois ~flags:~ no ~dbt_project.yml~.`],
  why: [
    `A variável de ambiente vence o projeto, mas perde para a linha de comando.`,
    `O ~dbt_project.yml~ é o nível de menor prioridade dos três.`,
    `Definir a flag em mais de um lugar é permitido; vale o de maior prioridade.`,
    `A opção passada no comando é a de maior prioridade.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/about-global-configs'
},
{
  id: 'p2-d3-flags-domc', exam: 'p2', lvl: 2, d: 'd3', type: 'domc',
  topic: 'Managing dbt behavior with flags',
  stem: `Which statement about behavior change flags is correct?`,
  options: [
    `They are set under ~flags:~ in ~dbt_project.yml~, not as CLI options or environment variables.`,
    `When one is introduced it is on by default, and projects can opt out of it until it is removed.`,
    `They are how dbt ships fixes for defects without waiting for the next minor version.`,
    `A value set in ~profiles.yml~ overrides the one in ~dbt_project.yml~ for that user.`
  ],
  answer: 0,
  exp: [`Behavior change flags só podem ser definidas no dicionário ~flags:~ do ~dbt_project.yml~, para que a escolha valha para todos e fique versionada.`],
  why: [
    `É a regra da documentação para esse tipo de flag.`,
    `Uma flag nasce desligada; só fica ligada por padrão quando amadurece.`,
    `Correção de bug não é behavior change e não recebe flag.`,
    `Flags de projeto ficam no ~dbt_project.yml~; o ~profiles.yml~ não é o lugar delas.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/behavior-changes'
},

/* ── D4 ── */
{
  id: 'p2-d4-warn-skip', exam: 'p2', lvl: 3, art: 'log', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `The team lead expected ~dim_customers~ to be skipped whenever ~stg_customers~ has duplicate e-mails. Why was it built in this ~dbt build~, and what makes the duplicates block it?`,
  code: [{ lang: 'log', label: 'terminal', text: `
    3 of 6 START test unique_stg_customers_email ................ [RUN]
    3 of 6 WARN 14 unique_stg_customers_email ................... [WARN 14 in 0.84s]
    4 of 6 START sql table model marts.dim_customers ............ [RUN]
    4 of 6 OK created sql table model marts.dim_customers ....... [SUCCESS 1 in 2.10s]` }],
  options: [
    `~dbt build~ only skips nodes downstream of a model error, never of a test; running ~dbt test~ before ~dbt run~ makes the failure block ~dim_customers~.`,
    `The test is configured to warn, and a warning doesn't skip downstream nodes; adding ~--fail-fast~ to the command makes the warning block ~dim_customers~.`,
    `The test is configured to warn, and a warning doesn't skip downstream nodes; setting ~severity: error~ on the test makes the failure block ~dim_customers~.`,
    `The test ran on another thread, so the model started without waiting for its result; setting ~threads: 1~ in the profile makes the failure block ~dim_customers~.`
  ],
  answer: 2,
  exp: [`O resultado foi WARN, não FAIL. No ~dbt build~, só uma falha de teste (ou um erro) faz os nós dependentes serem pulados.`],
  why: [
    `No ~dbt build~, um teste que falha com erro também pula os modelos seguintes.`,
    `O diagnóstico está certo, mas ~--fail-fast~ só para a execução no primeiro erro; warning não conta.`,
    `Com severidade de erro, as 14 linhas viram FAIL e ~dim_customers~ é pulado.`,
    `O dbt respeita a ordem do DAG com qualquer número de threads.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d4-failpoints', exam: 'p2', lvl: 2, d: 'd4', type: 'multi', choose: 2,
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `A ~dbt build~ with 8 threads and no ~--fail-fast~ hits a database error in ~int_payments~. Which two statements are correct? (Choose two.)`,
  options: [
    `Models that depend on ~int_payments~ are reported as SKIP.`,
    `Branches of the DAG that don't depend on ~int_payments~ keep running.`,
    `The data tests on ~int_payments~ still run, against the old table.`,
    `dbt retries ~int_payments~ once before reporting it as ERROR.`,
    `Every node that hasn't started yet is cancelled and reported as SKIP.`
  ],
  answers: [0, 1],
  exp: [`Um erro pula só o que depende do nó que falhou. O resto do DAG continua, a não ser que ~--fail-fast~ esteja ligado.`],
  why: [
    `Os descendentes do nó com erro são pulados.`,
    `Ramos independentes seguem normalmente.`,
    `Os testes do próprio modelo também dependem dele e são pulados.`,
    `O dbt não repete nós sozinho; para isso existe o ~dbt retry~.`,
    `Parar tudo no primeiro erro é o comportamento de ~--fail-fast~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'p2-d4-clone-vs-defer', exam: 'p2', lvl: 3, art: 'cli', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `On Snowflake, a CI job builds only the modified models into a pull-request schema. Reviewers point a BI tool at that schema and need to query every model, including the unmodified ones, without paying to rebuild them. Which approach fits?`,
  options: [
    `Run ~dbt clone --state~ first, so that unmodified models exist in the schema as clones.`,
    `Run the build with ~--favor-state~, so that production relations are copied into the schema.`,
    `Run ~dbt run --empty~ first, so that unmodified models exist in the schema at no cost.`,
    `Run the build with ~--defer --state~, so that unmodified models are read from production.`
  ],
  answer: 0,
  exp: [`~--defer~ só muda para onde os ~ref()~ apontam durante o comando do dbt; nada aparece no schema do PR. O ~dbt clone~ cria os objetos de fato (clones sem cópia de dados no Snowflake), e a ferramenta de BI consegue lê-los.`],
  why: [
    `Os clones existem no schema, com os dados de produção e sem custo de rebuild.`,
    `~--favor-state~ só muda a preferência de resolução dos refs no defer; não copia nada.`,
    `Os modelos passariam a existir, mas vazios.`,
    `Com defer, os modelos não modificados não existem no schema do PR; o BI não teria o que consultar.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'p2-d4-clone-fill', exam: 'p2', lvl: 1, art: 'cli', d: 'd4', type: 'fill',
  topic: 'Using dbt clone',
  stem: `Complete the flag that tells ~dbt clone~ where to find the manifest of the environment to clone from: ~dbt clone ______ prod-artifacts/~`,
  accept: ['--state', 'state'],
  exp: [`O ~dbt clone~ precisa de ~--state~ com a pasta que contém o ~manifest.json~ do ambiente de origem.`],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'p2-d4-clone-domc', exam: 'p2', lvl: 3, d: 'd4', type: 'domc',
  topic: 'Using dbt clone',
  stem: `Which statement about ~dbt clone~ is correct?`,
  options: [
    `On a warehouse without zero-copy cloning, it creates views that point at the source relations.`,
    `It rebuilds the selected models from their SQL and reads unselected parents from the other schema.`,
    `It overwrites relations that already exist in the target schema, unless ~--defer~ is passed.`,
    `It needs the ~run_results.json~ of the other environment to know which models succeeded.`
  ],
  answer: 0,
  exp: [`O ~dbt clone~ copia relações do ambiente descrito em ~--state~ para o schema do target: clones onde o warehouse suporta, views que apontam para a origem onde não suporta.`],
  why: [
    `É o comportamento documentado para plataformas sem clone sem cópia.`,
    `Isso descreve ~dbt build --defer~. O clone não executa o SQL dos modelos.`,
    `Relações que já existem são mantidas; só ~--full-refresh~ as recria.`,
    `O clone usa o ~manifest.json~ do outro ambiente, não o ~run_results.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
}
);
