/* Domain 2 · Governance (15) and Domain 4 · Troubleshooting pipelines (11) · bank expansion */
window.DBT_Q.push(
{
  id: 'd2-c-type', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `~dim_customers~ has an enforced contract, and ~dbt build~ fails with the error below. In this case the YAML declaration is correct and the SQL is wrong. How do you fix it?`,
  code: [{ lang: 'log', text: `
    Compilation Error in model dim_customers (models/marts/dim_customers.sql)
      This model has an enforced contract that failed.

      | column_name | definition_type | contract_type | mismatch_reason    |
      | ----------- | --------------- | ------------- | ------------------ |
      | customer_id | TEXT            | INT           | data type mismatch |` }],
  options: [
    `Make the SQL return the declared type, for example ~cast(customer_id as int) as customer_id~.`,
    `Reorder the columns in the YAML so ~customer_id~ comes first.`,
    `Add a ~not_null~ constraint to ~customer_id~.`,
    `Run the model with ~--full-refresh~ to rebuild the table.`
  ],
  answer: 0,
  exp: [
    `A checagem prévia do contrato compara **nomes e tipos**: o SQL entrega ~TEXT~ e o contrato declara ~INT~. Ajuste o SQL (cast) ou, se o tipo correto for texto, corrija o ~data_type~ no YAML.`,
    `A ordem das colunas não importa nessa checagem. Constraints e ~--full-refresh~ não mudam o tipo que o SQL retorna.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-c-breaking', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Other teams consume ~dim_customers~, which has an enforced contract. You must remove the ~country_name~ column. Your CI job (using ~state:modified~) fails with a breaking-change error. What is the recommended approach?`,
  options: [
    `Create a new version (v2) without the column, keep v1 available with a ~deprecation_date~, and let consumers migrate.`,
    `Set ~contract: {enforced: false}~ so the change passes CI.`,
    `Run CI with ~--full-refresh~ so the comparison is skipped.`,
    `Rename the model to ~dim_customers_new~ and delete the old one in the same PR.`
  ],
  answer: 0,
  exp: [
    `Remover coluna, mudar ~data_type~ ou alterar constraints de um modelo com contrato são **mudanças que quebram consumidores**, e o dbt as detecta ao comparar com o estado de produção.`,
    `O caminho correto é versionar: publicar v2, manter v1 por um período de migração com ~deprecation_date~ e depois removê-la. Desligar o contrato ou renomear/apagar o modelo quebra os consumidores sem aviso.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'd2-c-order-domc', d: 'd2', type: 'domc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `Which statement about enforced model contracts is correct?`,
  options: [
    `dbt creates the table with its columns in the order declared in the contract.`,
    `The preflight check fails if the SQL lists the columns in a different order than the YAML.`,
    `The contract checks column values, such as nulls and duplicates.`,
    `An enforced contract requires a constraint on every column.`
  ],
  answer: 0,
  exp: [
    `A checagem prévia ignora a ordem e compara nomes e tipos. No DDL, o dbt usa a ordem declarada no contrato.`,
    `Contratos garantem a **forma** do modelo, não os valores; para valores existem constraints (quando a plataforma aplica) e data tests. Constraints são opcionais.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'
},
{
  id: 'd2-c-hotspot', d: 'd2', type: 'hotspot',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `~dbt run~ fails with a parsing error about an invalid configuration for one column of this contracted model. Click the column definition that causes it.`,
  code: [{ lang: 'yaml', label: 'models/marts/_fct_orders.yml', hotspot: true, text: `
    models:
      - name: fct_orders
        config:
          contract:
            enforced: true
        columns:
          - name: order_id
            data_type: int
            constraints:
              - type: not_null
          - name: created_at
            constraints:
              - type: not_null
          - name: amount
            data_type: numeric` }],
  answer: 10,
  exp: [
    `Com ~contract: {enforced: true}~, **toda** coluna precisa de ~data_type~. ~created_at~ tem constraint, mas não tem tipo. Adicione, por exemplo, ~data_type: timestamp~.`,
    `É o mesmo cenário da questão de exemplo do guia oficial: o erro de parse vem antes de qualquer teste, então ajustar o YAML é o primeiro passo.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/contract'
},
{
  id: 'd2-c-project', d: 'd2', type: 'mc',
  topic: 'Adding contracts to models to ensure the shape of models',
  stem: `You want every model in ~models/marts/~ to have an enforced contract without editing each model. What should you add to ~dbt_project.yml~?`,
  code: [{ lang: 'yaml', label: 'dbt_project.yml', text: `
    models:
      jaffle_shop:
        marts:
          # ???` }],
  options: [
    `~+contract: {enforced: true}~`,
    `~+constraints: [{type: not_null}]~`,
    `~+access: public~`,
    `~+materialized: table~`
  ],
  answer: 0,
  exp: [
    `~contract~ pode ser definida no ~dbt_project.yml~, no YAML de propriedades ou no ~config()~ do modelo. Na pasta ~marts~, todos os modelos passam a exigir ~name~ e ~data_type~ de cada coluna no YAML.`,
    `~access: public~ não aplica contrato, embora seja boa prática combiná-los. Constraints dependem do contrato, e não o contrário.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/contract'
},
{
  id: 'd2-v-file', d: 'd2', type: 'mc',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `You declare ~versions: [{v: 1}, {v: 2}]~ for ~dim_customers~ and don't set ~defined_in~. By default, which file does dbt expect to contain the SQL for version 2?`,
  options: [
    `~dim_customers_v2.sql~`,
    `~v2/dim_customers.sql~`,
    `~dim_customers.v2.sql~`,
    `~dim_customers_2.sql~`
  ],
  answer: 0,
  exp: [
    `A convenção é ~<model_name>_v<v>~, tanto para o arquivo quanto para a relação criada (~dim_customers_v2~). ~defined_in~ permite outro arquivo, mas a documentação recomenda seguir a convenção.`,
    `A versão "latest" também pode viver em ~dim_customers.sql~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-versions'
},
{
  id: 'd2-v-selectors', d: 'd2', type: 'match',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `Match each version selector to what it selects.`,
  left: [`~version:latest~`, `~version:prerelease~`, `~version:old~`, `~version:none~`],
  right: [
    `Only the version marked as latest_version`,
    `Versions newer than latest_version`,
    `Versions older than latest_version`,
    `Models that are not versioned`
  ],
  answer: [0, 1, 2, 3],
  exp: [
    `Esses seletores ajudam em fluxos de versão. Por exemplo, ~dbt build --exclude version:old~ evita reconstruir versões antigas em desenvolvimento, e ~--select dim_customers,version:latest~ constrói só a versão atual.`,
    `Selecionar ~dim_customers~ sem filtro inclui **todas** as versões.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#version'
},
{
  id: 'd2-v-exclude', d: 'd2', type: 'mc', codeOptions: true,
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~dim_customers~ v1 has all columns declared at the model level. Version 2 is identical except that it drops ~country_name~. Which YAML declares v2 correctly?`,
  options: [
    `
    versions:
      - v: 1
      - v: 2
        columns:
          - include: all
            exclude: [country_name]`,
    `
    versions:
      - v: 1
      - v: 2
        exclude_columns: [country_name]`,
    `
    versions:
      - v: 1
      - v: 2
        config:
          exclude: country_name`,
    `
    versions:
      - v: 1
      - v: 2
        columns:
          - name: country_name
            enabled: false`
  ],
  answer: 0,
  exp: [
    `Em ~versions~, cada versão herda as colunas do modelo e declara só as diferenças. ~include: all~ com ~exclude: [...]~ é a sintaxe para "todas menos estas". Versões também podem ter configs próprias (~config:~), inclusive outra materialização.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/versions'
},
{
  id: 'd2-v-pin', d: 'd2', type: 'fill',
  topic: 'Creating different versions of our models and deprecating the old ones',
  stem: `~latest_version~ of ~dim_customers~ was bumped to 2, but your model must keep reading version 1 during the migration window. Complete the blank: ~{{ ref('dim_customers', ___=1) }}~`,
  accept: ['v', 'version'],
  exp: [
    `~ref('dim_customers', v=1)~ (ou ~version=1~) fixa a versão. Sem o argumento, o ref resolve para a ~latest_version~, e o dbt avisa quando existe uma versão prerelease mais nova.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref#versioned-ref'
},
{
  id: 'd2-k-composite', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `~fct_order_lines~ has a composite primary key of ~(order_id, line_number)~. How should you declare this primary key constraint?`,
  options: [
    `As a model-level constraint: ~constraints: [{type: primary_key, columns: [order_id, line_number]}]~`,
    `As a ~primary_key~ constraint on each of the two columns`,
    `With ~unique_key: ['order_id', 'line_number']~`,
    `With ~+primary_key: [order_id, line_number]~ in ~dbt_project.yml~`
  ],
  answer: 0,
  exp: [
    `Constraints de várias colunas (como PK composta) **precisam** ser declaradas no nível do modelo, com a lista ~columns~. Duas constraints ~primary_key~ separadas definiriam duas PKs, o que é inválido.`,
    `~unique_key~ é config de incrementais e não cria constraint. Lembre que constraints exigem contrato aplicado e só valem para ~table~ e ~incremental~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-k-fk', d: 'd2', type: 'mc', codeOptions: true,
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `In dbt 1.9 or later, which YAML correctly declares a foreign key from ~fct_orders.customer_id~ to ~dim_customers.customer_id~ in a way that also captures the dependency between the models?`,
  options: [
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: foreign_key
          to: ref('dim_customers')
          to_columns: [customer_id]`,
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: foreign_key
          references: dim_customers.customer_id`,
    `
    - name: customer_id
      data_type: int
      data_tests:
        - type: foreign_key
          to: ref('dim_customers')`,
    `
    - name: customer_id
      data_type: int
      constraints:
        - type: relationships
          field: customer_id`
  ],
  answer: 0,
  exp: [
    `Desde o 1.9, foreign keys usam ~to~ (normalmente ~ref()~ ou ~source()~) e ~to_columns~. Com ~ref()~, o dbt registra a dependência e resolve o nome correto em cada ambiente.`,
    `~relationships~ é um **data test**, não uma constraint. Lembre que em várias plataformas (Snowflake, BigQuery, Redshift) FKs são criadas mas não aplicadas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-k-postgres', d: 'd2', type: 'mc',
  topic: 'Defining constraints in YAML to enforce data integrity at the platform level',
  stem: `On Postgres, ~fct_payments~ is a table with an enforced contract and a ~check~ constraint with ~expression: "amount >= 0"~. New data includes a payment with ~amount = -10~. What happens on ~dbt run~?`,
  options: [
    `The build fails, because Postgres rejects the row that violates the check constraint.`,
    `The model builds and dbt logs a warning about the invalid row.`,
    `dbt filters out the invalid row before inserting.`,
    `The constraint is ignored, as it would be on Snowflake.`
  ],
  answer: 0,
  exp: [
    `O Postgres aplica todos os tipos de constraint (~not_null~, ~unique~, ~primary_key~, ~foreign_key~, ~check~). A inserção é rejeitada e o build do modelo falha.`,
    `O comportamento depende da plataforma: o Snowflake ignora ~check~ (com warning), e o Databricks aplica ~not_null~ e ~check~ depois que a tabela é criada. O dbt nunca filtra linhas por causa de constraints.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/constraints'
},
{
  id: 'd2-a-private', d: 'd2', type: 'mc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `~finance_model~ belongs to the ~finance~ group and has ~access: private~. A model in the ~marketing~ group adds ~{{ ref('finance_model') }}~. What happens?`,
  options: [
    `dbt raises a ~DbtReferenceError~ at parse time, because the model is private to the finance group.`,
    `The ref works, but dbt logs a deprecation warning.`,
    `The ref works only when the command is ~dbt build~.`,
    `dbt builds a private copy of ~finance_model~ in the marketing schema.`
  ],
  answer: 0,
  exp: [
    `~private~: só modelos do **mesmo group** podem referenciá-lo; qualquer outro ~ref~ falha no parse. Para liberar o acesso, o dono pode mudar para ~protected~ (mesmo projeto) ou ~public~ (inclusive outros projetos).`,
    `Access controla quem pode usar o modelo em ~ref()~; não é permissão no banco, que é papel dos ~grants~.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd2-a-ephemeral', d: 'd2', type: 'mc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `A model configured with ~materialized: ephemeral~ also sets ~access: public~. What happens when dbt parses the project?`,
  options: [
    `A parsing error, because ephemeral models cannot be public.`,
    `dbt automatically materializes the model as a view so other projects can read it.`,
    `It parses normally; other projects can ref the model as a CTE.`,
    `dbt logs a warning and changes access to protected.`
  ],
  answer: 0,
  exp: [
    `Modelos ~public~ precisam existir no warehouse para que outros projetos os leiam, e ephemeral nunca é materializado. O dbt rejeita a combinação com erro de parse (*invalid value (public) for the access field*).`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},
{
  id: 'd2-a-grants-domc', d: 'd2', type: 'domc',
  topic: 'Model access, groups, contracts, and versions',
  stem: `Which statement about model access is correct?`,
  options: [
    `Setting ~access: public~ does not grant any database privileges; the ~grants~ config handles that.`,
    `The default access level for models is ~private~.`,
    `Access can be configured on seeds, snapshots, and sources.`,
    `Private models are hidden from the documentation site for users of the same project.`
  ],
  answer: 0,
  exp: [
    `Access governa **referências entre modelos** (~ref~), não permissões no warehouse. O padrão é ~protected~, e recursos de governança (access, contracts, versions) valem apenas para modelos.`,
    `Quem tem acesso de desenvolvimento ao projeto vê todos os modelos, inclusive os privados.`
  ],
  doc: 'https://docs.getdbt.com/docs/mesh/govern/model-access'
},

{
  id: 'd4-fp-cautious', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `In a fresh CI schema without deferral, you run ~dbt build --select fct_orders~. A ~relationships~ test from ~fct_orders.customer_id~ to ~dim_customers~ errors because ~dim_customers~ was never built in that schema. Which option makes dbt skip tests that reference unselected nodes?`,
  options: [
    `~--indirect-selection=cautious~`,
    `~--indirect-selection=eager~`,
    `~--fail-fast~`,
    `~--exclude-resource-type unit_test~`
  ],
  answer: 0,
  exp: [
    `Seleção indireta: ~eager~ (padrão) roda todo teste que referencia um nó selecionado, mesmo que dependa de nós não selecionados; ~cautious~ só roda testes cujos pais estão **todos** selecionados; ~buildable~ aceita pais selecionados ou ancestrais deles; ~empty~ não roda testes indiretos.`,
    `Outra solução é usar ~--defer~ para que ~dim_customers~ seja lido de produção.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/test-selection-examples'
},
{
  id: 'd4-fp-threads', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `A project has 120 models with many independent branches. The log shows models starting strictly one at a time, and the profile has ~threads: 1~. What is the simplest way to shorten the run?`,
  options: [
    `Increase ~threads~ (in the profile or with ~--threads 8~), so independent nodes run in parallel.`,
    `Add ~--fail-fast~.`,
    `Materialize all models as ephemeral.`,
    `Run with ~--empty~.`
  ],
  answer: 0,
  exp: [
    `~threads~ define quantos nós o dbt executa ao mesmo tempo, sempre respeitando as dependências do DAG. Com 1 thread, tudo roda em série. Aumente com cuidado, considerando a capacidade do warehouse.`,
    `As outras opções mudam o comportamento ou o resultado, não o paralelismo.`
  ],
  doc: 'https://docs.getdbt.com/docs/running-a-dbt-project/using-threads'
},
{
  id: 'd4-fp-domc', d: 'd4', type: 'domc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `Which statement about how failures propagate in ~dbt build~ is correct?`,
  options: [
    `A test that returns WARN does not cause downstream nodes to be skipped.`,
    `When any model errors, dbt skips every remaining node in the run, including independent branches.`,
    `dbt automatically retries skipped nodes at the end of the run.`,
    `~--fail-fast~ only skips the downstream nodes of the failed node.`
  ],
  answer: 0,
  exp: [
    `Só ERROR (em modelo) e FAIL (em teste com severity ~error~) fazem os nós a jusante serem pulados; WARN não bloqueia nada. Ramos independentes continuam rodando.`,
    `~--fail-fast~ interrompe a execução inteira. Para retomar depois de corrigir, use ~dbt retry~, que não roda sozinho.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
},
{
  id: 'd4-fp-store', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `A ~unique~ test on ~fct_orders.order_id~ fails in the nightly job. You want the failing rows saved in the warehouse so you can investigate them the next morning. What should you configure?`,
  options: [
    `~store_failures: true~ on the test (or ~--store-failures~ on the command)`,
    `~limit: 0~ on the test`,
    `~severity: warn~ on the test`,
    `~--log-level debug~ on the job`
  ],
  answer: 0,
  exp: [
    `Com ~store_failures~, o dbt grava o resultado do teste (as linhas com falha) numa tabela, por padrão num schema com sufixo ~dbt_test__audit~. ~store_failures_as~ permite escolher ~table~, ~view~ ou ~ephemeral~.`,
    `• ~limit~ só reduz quantas falhas são retornadas.`,
    `• ~severity~ muda o status, não guarda nada.`,
    `• Logs de debug mostram o SQL, não as linhas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures'
},
{
  id: 'd4-fp-incremental', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `~fct_page_views~ is a table rebuilt every hour from 2 billion append-only events. Each rebuild takes 45 minutes, and only the last hour's events are new. What is the best optimization?`,
  options: [
    `Make it incremental, processing only new events on each run.`,
    `Materialize it as a view.`,
    `Materialize it as ephemeral.`,
    `Add more data tests to the model.`
  ],
  answer: 0,
  exp: [
    `Quando o *build* de uma tabela fica lento demais e os dados são majoritariamente novos (append-only), incremental é o próximo passo. Para volumes muito grandes de séries temporais, microbatch também é uma opção.`,
    `View transferiria o custo para cada consulta; ephemeral seria recalculado em cada consumidor.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/materializations/1-guide-overview'
},
{
  id: 'd4-fp-run-results', d: 'd4', type: 'mc',
  topic: 'Troubleshooting and optimizing dbt pipelines',
  stem: `You want to find which nodes took the longest in last night's run, along with their final status. Which artifact holds per-node execution timing and status for the last invocation?`,
  options: [
    `~target/run_results.json~`,
    `~target/manifest.json~`,
    `~target/catalog.json~`,
    `~target/sources.json~`
  ],
  answer: 0,
  exp: [
    `~run_results.json~ registra cada nó executado com status, tempos (~timing~, ~execution_time~) e mensagens. É ele que o ~dbt retry~ e o seletor ~result:~ leem.`,
    `~manifest.json~ descreve o projeto (nós, configs, dependências); ~catalog.json~ guarda metadados do warehouse para a documentação; ~sources.json~ guarda resultados de freshness.`
  ],
  doc: 'https://docs.getdbt.com/reference/artifacts/run-results-json'
},
{
  id: 'd4-fp-order', d: 'd4', type: 'order',
  topic: 'Troubleshooting and managing failure points in the DAG',
  stem: `The nightly production job failed on one model. Put the troubleshooting steps in a sensible order.`,
  items: [
    `Identify the failing node and the error category in the logs`,
    `Inspect the compiled SQL in ~target/~ and reproduce the error in the warehouse`,
    `Fix it in a feature branch and run ~dbt build~ on the node and its children`,
    `Merge the fix through the CI job and code review`,
    `Resume the production run from the point of failure (for example, with ~dbt retry~)`
  ],
  exp: [
    `Diagnosticar (log e categoria do erro) → reproduzir (SQL compilado) → corrigir e testar em desenvolvimento → passar por CI e revisão → retomar produção sem refazer o que já deu certo.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd4-cl-bi', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `An analyst modified 3 models in development and wants to check a Tableau dashboard pointed at their dev schema. The dashboard also reads 20 unmodified upstream models that don't exist in the dev schema. What is the most cost-effective way to make them available?`,
  options: [
    `Run ~dbt clone --state prod-artifacts~ for the unmodified models, so they exist in the dev schema as clones or pointer views.`,
    `Run the dev build with ~--defer~; Tableau will then find the production objects in the dev schema.`,
    `Rebuild all 23 models from scratch in the dev schema.`,
    `Run ~dbt docs generate~ so Tableau can read the catalog.`
  ],
  answer: 0,
  exp: [
    `Ferramentas externas, como BIs, precisam de **objetos reais** no schema. ~--defer~ só redireciona os ~ref()~ durante a compilação do dbt e não cria nada no schema de dev. ~dbt clone~ cria clones zero-copy (ou views, onde não há suporte) com pouco custo.`,
    `Reconstruir tudo funciona, mas é caro.`
  ],
  doc: 'https://docs.getdbt.com/blog/to-defer-or-to-clone'
},
{
  id: 'd4-cl-refresh', d: 'd4', type: 'mc',
  topic: 'Using dbt clone',
  stem: `Last week you cloned production into your dev schema. Production has changed since then, but running ~dbt clone --state prod-artifacts~ again leaves your existing clones untouched. What should you run?`,
  options: [
    `~dbt clone --state prod-artifacts --full-refresh~`,
    `~dbt retry~`,
    `~dbt clone --state prod-artifacts --empty~`,
    `Delete the ~target/~ folder and run the same command`
  ],
  answer: 0,
  exp: [
    `Por padrão, ~dbt clone~ **não** recria relações que já existem no target. ~--full-refresh~ força a recriação a partir do estado informado. Para acelerar, aumente ~--threads~, porque os clones são independentes.`,
    `~target/~ guarda artefatos locais e não afeta objetos do warehouse.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'd4-cl-uses', d: 'd4', type: 'multi', choose: 2,
  topic: 'Using dbt clone',
  stem: `Which two are documented use cases for ~dbt clone~? (Choose two.)`,
  options: [
    `Blue/green deployments on warehouses that support zero-copy cloning`,
    `Cloning the current production state into development schemas`,
    `Migrating data between two different warehouse vendors`,
    `Restoring deleted rows from snapshot history`,
    `Replacing source freshness checks`
  ],
  answers: [0, 1],
  exp: [
    `A documentação lista: deploy blue/green, levar o estado de produção para schemas de desenvolvimento, lidar com incrementais em CI e testar mudanças em ferramentas de BI.`,
    `O clone trabalha dentro do mesmo warehouse, a partir dos objetos descritos nos artefatos de ~--state~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
},
{
  id: 'd4-cl-state', d: 'd4', type: 'fill',
  topic: 'Using dbt clone',
  stem: `Complete the command that clones every model from the production artifacts into your current target: ~dbt clone --______ path/to/prod-artifacts~`,
  accept: ['state'],
  exp: [
    `~dbt clone~ clona os nós selecionados **a partir do estado informado** em ~--state~ (o ~manifest.json~ de produção). Com ~--select~ você limita o que é clonado.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/clone'
}
);
