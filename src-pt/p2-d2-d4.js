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
    `Com ~contract.enforced: true~, o dbt compara os nomes e os tipos das colunas que a consulta devolve com o YAML antes de construir. Qualquer diferença, inclusive uma coluna a mais, interrompe o modelo.`
  ],
  why: [
    `O dbt não ajusta a consulta ao contrato; ele recusa a construção.`,
    `Quebra de contrato é erro, não aviso.`,
    `A checagem acontece antes da criação da tabela e o erro mostra as colunas divergentes.`,
    `A checagem vem antes da criação; nada chega a ser construído para depois ser desfeito.`
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
    `Contratos valem para modelos SQL materializados como ~table~, ~view~ ou ~incremental~. No incremental, só com ~on_schema_change~ igual a ~append_new_columns~ ou ~fail~.`
  ],
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
    `Constraints são aplicadas pela plataforma, e cada uma decide o que impõe. No Snowflake, só ~not_null~ é imposta; ~unique~, ~primary_key~ e ~foreign_key~ ficam registradas como metadado. Para garantir unicidade ali, use um data test.`
  ],
  why: [
    `O Snowflake aceita a constraint ~unique~, mas não a verifica na carga.`,
    `Constraints não geram data tests; são coisas separadas.`,
    `~unique~ é suportada no Snowflake (definida, não imposta). A que não é suportada é ~check~.`,
    `A tabela é criada com a constraint declarada e as duas linhas entram.`
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
    `Chaves de mais de uma coluna são declaradas no nível do modelo, com ~type: primary_key~ e a lista ~columns~. Constraints exigem um contrato com ~enforced: true~.`
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
    `O ~ref()~ sem versão vai para ~latest_version~ (2). A versão 3, acima dela, é prerelease: existe e pode ser referenciada com ~v=3~. O alias padrão de cada versão é ~<modelo>_v<versão>~.`
  ],
  why: [
    `A maior versão só seria a "latest" se ~latest_version~ não estivesse definido.`,
    `Sem versão vai para a v2 (~latest_version~); com ~v=3~ vai para a v3.`,
    `Nem o ref sem versão vai para a v3, nem fixar a v3 gera erro.`,
    `Uma versão prerelease pode ser referenciada normalmente por quem fixa a versão.`
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
    `~deprecation_date~ é um aviso de prazo. Depois da data, o dbt só emite warnings; nada é desligado nem redirecionado. Quem quiser tratar como erro pode promover o warning com ~--warn-error-options~.`
  ],
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
    `Cada versão tem o próprio arquivo, por padrão ~<modelo>_v<versão>.sql~ (dá para mudar com ~defined_in~).`
  ],
  why: [
    `É a convenção padrão de nome de arquivo por versão (dá para mudar com ~defined_in~).`,
    `Versões prerelease são construídas normalmente; só não recebem os refs sem versão.`,
    `As colunas são herdadas do nível do modelo; cada versão declara só as diferenças, com ~include~ e ~exclude~.`,
    `Cada versão é uma relação própria, por padrão com o sufixo ~_v<versão>~.`
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
    `"Database Error" significa que o dbt compilou e enviou o SQL, e o warehouse recusou. O texto "SQL compilation error" vem do Snowflake, não do Jinja. A linha 12 se refere ao SQL compilado.`
  ],
  why: [
    `O diagnóstico está certo, mas recriar a tabela repete a mesma consulta inválida.`,
    `O erro é do banco: a coluna não existe nas relações lidas. O arquivo em ~target/run~ mostra o SQL exato.`,
    `O diagnóstico está certo, mas o YAML de propriedades documenta colunas; ele não as cria na consulta.`,
    `Falha de Jinja aparece como "Compilation Error" do dbt, antes de qualquer consulta. A linha 12 é do SQL compilado.`
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
    `"Compilation Error ... depends on a node named ... which was not found" aparece quando o dbt monta o DAG, antes de falar com o warehouse: o nome dentro do ~ref()~ não corresponde a nenhum modelo ativo.`
  ],
  why: [
    `O erro acontece antes de qualquer consulta; a existência da tabela nem chega a ser verificada.`,
    `O dbt descobre os modelos pelos arquivos do projeto, não pelo resultado de execuções anteriores.`,
    `Um modelo existe para o dbt por causa do arquivo ~.sql~; o YAML é opcional.`,
    `~stg_order~ é um erro de digitação de ~stg_orders~.`
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
    `~target/compiled~ tem o ~select~ puro, bom para colar no warehouse e depurar. ~target/run~ tem o comando completo que o dbt executou, como ~create or replace table ... as (...)~.`
  ],
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
    `~description~ da coluna ~status~ precisa ficar alinhada com ~name~ (dois espaços depois do traço), como ~data_tests~ logo abaixo. Do jeito que está, ela sai do item da lista e o YAML fica inválido.`
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
    `Cada recurso só pode ter uma entrada de propriedades (um "patch"). Aqui o modelo ~stg_orders~ aparece em ~models:~ nos dois arquivos listados. Junte tudo em uma entrada só.`
  ],
  why: [
    `Uma tabela de source é identificada por source e tabela; ela não disputa o nome com um modelo.`,
    `O diagnóstico está certo, mas a pasta não importa: as duas entradas continuariam descrevendo o mesmo modelo.`,
    `Um modelo e um seed com o mesmo nome geram outro erro, sobre dois recursos com o mesmo nome.`,
    `Cada recurso só pode ter uma entrada de propriedades. Junte tudo em uma.`
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
    `Isolar a mudança num branch, reproduzir, corrigir e validar em desenvolvimento, validar de novo no CI e só então fazer o merge.`
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
    `~--state~ só informa onde está o manifest de comparação. É o ~--defer~ que faz os ~ref()~ de modelos não selecionados apontarem para as relações de produção.`
  ],
  why: [
    `Sem ~--defer~, os refs continuam apontando para o schema de desenvolvimento, onde os pais não existem.`,
    `Constrói e testa só o que foi selecionado, lendo os pais de produção.`,
    `O ~+~ da frente manda construir os pais no desenvolvimento, que é o que se quer evitar.`,
    `O clone copia as versões de produção desses modelos; ele não executa o SQL alterado.`
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
    `Para flags globais, a ordem é: opção na linha de comando, depois variável de ambiente, depois ~flags:~ no ~dbt_project.yml~.`
  ],
  why: [
    `O ~dbt_project.yml~ é o nível de menor prioridade.`,
    `Não há volta ao padrão: vale a definição de maior prioridade.`,
    `Definir a flag em mais de um lugar é permitido.`,
    `A variável de ambiente vence o projeto; só uma opção na linha de comando venceria as duas.`
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
    `Behavior change flags só podem ser definidas no dicionário ~flags:~ do ~dbt_project.yml~, para que a escolha valha para todos e fique versionada.`
  ],
  why: [
    `É a regra da documentação para esse tipo de flag.`,
    `Uma flag nasce desligada; só fica ligada por padrão quando amadurece.`,
    `Correção de bug não é behavior change e não recebe flag.`,
    `Flags de projeto ficam no ~dbt_project.yml~; o ~profiles.yml~ não é o lugar delas.`
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
    `A severidade já é ~error~ por padrão. O teste só avisou porque 14 não passa de 100 (~error_if~) e passa de 10 (~warn_if~). Só um resultado de erro faz o ~dbt build~ pular os nós seguintes.`
  ],
  why: [
    `~error~ já é o padrão, então nada muda: 14 continua abaixo do ~error_if~.`,
    `Isso só faz o teste avisar com qualquer duplicata; aviso não bloqueia nada.`,
    `Com ~error_if~ em ~!=0~ (o padrão), qualquer duplicata vira erro e ~dim_customers~ é pulado.`,
    `~--fail-fast~ para a execução no primeiro erro; um warning não conta.`
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
    `Um erro pula só o que depende do nó que falhou. O resto do DAG continua, a não ser que ~--fail-fast~ esteja ligado.`
  ],
  why: [
    `Os testes do modelo dependem dele e são pulados junto.`,
    `Ramos independentes seguem normalmente.`,
    `Os dependentes aparecem como SKIP; ERROR é só o nó que falhou.`,
    `O dbt não repete nós sozinho; para isso existe o ~dbt retry~.`,
    `Parar tudo no primeiro erro é o comportamento de ~--fail-fast~.`
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
    `~--defer~ só muda para onde os ~ref()~ apontam durante o comando do dbt; nada aparece no schema do PR. O ~dbt clone~ cria os objetos de fato (clones sem cópia de dados no Snowflake), e a ferramenta de BI consegue lê-los.`
  ],
  why: [
    `Os clones existem no schema, com os dados de produção e sem custo de rebuild.`,
    `~--favor-state~ só muda a preferência de resolução dos refs no defer; não copia nada.`,
    `Os modelos passariam a existir, mas vazios.`,
    `Com defer, os modelos não modificados não existem no schema do PR; o BI não teria o que consultar.`
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
    `O ~dbt clone~ precisa de ~--state~ com a pasta que contém o ~manifest.json~ do ambiente de origem.`
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
    `O ~dbt clone~ copia relações do ambiente descrito em ~--state~ para o schema do target: clones onde o warehouse suporta, views que apontam para a origem onde não suporta.`
  ],
  why: [
    `É o comportamento documentado para plataformas sem clone sem cópia.`,
    `Isso descreve ~dbt build --defer~. O clone não executa o SQL dos modelos.`,
    `Relações que já existem são mantidas; só ~--full-refresh~ as recria.`,
    `O clone usa o ~manifest.json~ do outro ambiente, não o ~run_results.json~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
}
);
