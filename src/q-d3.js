/* Domain 3 · Debugging data modeling errors · bank expansion (19) */
window.DBT_Q.push(
{
  id: 'd3-l-eof', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `What is the most likely cause of this error?`,
  code: [{ lang: 'log', text: `
    Compilation Error in macro cents_to_dollars (macros/cents_to_dollars.sql)
      Reached EOF without finding a close tag for macro (searched from line 1)` }],
  options: [
    `The macro file is missing its ~{% endmacro %}~ tag.`,
    `The ~dbt_utils~ package is not installed.`,
    `The macro is called before ~dbt deps~ has run.`,
    `The macro must be wrapped in ~{% if execute %}~.`
  ],
  answer: 0,
  exp: [
    `*Reached EOF without finding a close tag* quer dizer que o parser chegou ao fim do arquivo sem encontrar o fechamento do bloco. Aqui falta o ~{% endmacro %}~; o mesmo acontece com ~{% endif %}~, ~{% endfor %}~ e ~{% endtest %}~.`,
    `É um *Compilation Error*: o Jinja está estruturalmente inválido, e o problema não tem relação com pacotes ou com o warehouse.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-l-dbtlog', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `You need to see every SQL statement dbt sent to the warehouse during the last invocation, including introspective queries such as metadata lookups. Where do you look?`,
  options: [
    `~logs/dbt.log~`,
    `~target/compiled/~`,
    `~target/manifest.json~`,
    `~dbt_packages/~`
  ],
  answer: 0,
  exp: [
    `~logs/dbt.log~ registra tudo o que o dbt fez, inclusive as consultas de metadados, com mais detalhe que o terminal; os erros recentes ficam no fim. Para isolar um problema, limpe o arquivo e rode só o nó com falha.`,
    `~target/compiled~ tem só o SELECT renderizado de cada nó, e o ~manifest.json~ descreve o projeto.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-l-debug', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `Every dbt command now fails before any model runs, with ~Database Error: Incorrect username or password was specified~. Which command helps you diagnose the problem?`,
  options: [
    `~dbt debug~`,
    `~dbt parse~`,
    `~dbt compile~`,
    `~dbt deps~`
  ],
  answer: 0,
  exp: [
    `~dbt debug~ valida a instalação, o ~dbt_project.yml~, o ~profiles.yml~ (e onde ele está) e **testa a conexão** com o warehouse. É o primeiro passo para problemas de credenciais ou rede.`,
    `~parse~ e ~compile~ não resolvem credenciais inválidas (o ~compile~ ainda precisaria conectar). ~deps~ só instala pacotes.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/debug'
},
{
  id: 'd3-l-missing-rel', d: 'd3', type: 'mc',
  topic: 'Understanding logged error messages',
  stem: `In a brand-new development schema, ~dbt run --select fct_orders~ fails with ~Database Error: Object 'ANALYTICS.DBT_JDOE.STG_ORDERS' does not exist or not authorized~. What is the most likely cause, and a fix?`,
  options: [
    `The parent model was never built in the dev schema; run ~dbt run --select +fct_orders~, or defer to production.`,
    `~stg_orders~ should be referenced with ~source()~ instead of ~ref()~.`,
    `~fct_orders~ needs ~--full-refresh~.`,
    `The project needs ~dbt deps~ to install ~stg_orders~.`
  ],
  answer: 0,
  exp: [
    `É um *Database Error*: o SQL compilou, mas o warehouse não encontrou ~stg_orders~ no schema de dev, porque você selecionou só o filho. Construa os pais (~+fct_orders~) ou use ~--defer --state~ para que refs não construídos apontem para produção.`,
    `~stg_orders~ é um modelo, então ~ref()~ está correto.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/defer'
},
{
  id: 'd3-cc-comma', d: 'd3', type: 'hotspot',
  topic: 'Troubleshooting using compiled code',
  stem: `This model fails with ~syntax error at or near "from"~. In ~target/compiled~, the line right before ~from~ ends with ~as bank_transfer_amount,~. Click the line that must change.`,
  code: [{ lang: 'sql', label: 'models/marts/fct_order_payments.sql', hotspot: true, text: `
    {% set methods = ['credit_card', 'coupon', 'bank_transfer'] %}
    select
        order_id,
        {% for m in methods %}
        sum(case when payment_method = '{{ m }}' then amount end) as {{ m }}_amount,
        {% endfor %}
    from {{ ref('stg_payments') }}
    group by 1` }],
  answer: 4,
  exp: [
    `O loop coloca vírgula depois de **todas** as colunas, inclusive da última, e o SQL compilado fica com ~,~ antes do ~from~. Troque a vírgula fixa por ~{% if not loop.last %},{% endif %}~.`,
    `Ver o SQL em ~target/compiled~ é o jeito mais rápido de achar erros gerados por Jinja.`
  ],
  doc: 'https://docs.getdbt.com/guides/using-jinja'
},
{
  id: 'd3-cc-execute', d: 'd3', type: 'mc',
  topic: 'Troubleshooting using compiled code',
  stem: `A model calls ~run_query()~ at the top level to fetch the list of payment methods and then reads ~results.columns[0].values()~. Parsing fails with ~'None' has no attribute 'columns'~. What is the fix?`,
  options: [
    `Wrap the code that uses the query result in ~{% if execute %} ... {% endif %}~.`,
    `Run ~dbt deps~ before parsing.`,
    `Add ~--empty~ to the command.`,
    `Move the model into the ~analyses/~ folder.`
  ],
  answer: 0,
  exp: [
    `O dbt renderiza o Jinja duas vezes: no **parse**, quando nada é executado no banco e ~run_query~ retorna ~None~, e na **execução**. ~execute~ é falso no parse e verdadeiro na execução, então proteger esse trecho com ~{% if execute %}~ evita o erro.`
  ],
  doc: 'https://docs.getdbt.com/reference/dbt-jinja-functions/execute'
},
{
  id: 'd3-cc-inline', d: 'd3', type: 'mc',
  topic: 'Troubleshooting using compiled code',
  stem: `You want to see exactly what SQL the macro call ~{{ cents_to_dollars('amount', 4) }}~ renders to, without creating a model or touching the warehouse data. Which command should you use?`,
  options: [
    `~dbt compile --inline "{{ cents_to_dollars('amount', 4) }}"~`,
    `~dbt show --select cents_to_dollars~`,
    `~dbt run-operation cents_to_dollars~`,
    `~dbt docs generate --select cents_to_dollars~`
  ],
  answer: 0,
  exp: [
    `~dbt compile --inline~ renderiza um trecho avulso de SQL ou Jinja (com acesso aos macros e ~ref~ do projeto) e imprime o resultado.`,
    `• Macros não são nós selecionáveis em ~show~ ou ~docs~.`,
    `• ~run-operation~ executa o macro, mas não mostra o SQL que ele produz quando usado num modelo.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/compile'
},
{
  id: 'd3-y-colon', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `Parsing fails with ~mapping values are not allowed in this context~ at line 5 of the file below. What fixes it?`,
  code: [{ lang: 'yaml', label: 'models/staging/_stg_payments.yml', text: `
    models:
      - name: stg_payments
        columns:
          - name: amount
            description: Note: amounts are stored in cents` }],
  options: [
    `Wrap the description in quotes, for example ~description: "Note: amounts are stored in cents"~.`,
    `Indent ~description~ two more spaces.`,
    `Add ~version: 2~ to the top of the file.`,
    `Rename the file to ~schema.yml~.`
  ],
  answer: 0,
  exp: [
    `Em YAML, ~: ~ (dois-pontos seguido de espaço) dentro de um valor sem aspas é lido como o início de outro par chave/valor, o que é inválido ali. Coloque o texto entre aspas.`,
    `O nome do arquivo YAML é livre, e ~version: 2~ é opcional nas versões atuais.`
  ],
  doc: 'https://docs.getdbt.com/guides/debug-errors'
},
{
  id: 'd3-y-doc', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `A column has ~description: {{ doc("order_status") }}~ in a properties file, and parsing fails with a YAML error on that line. What is the fix?`,
  options: [
    `Quote the Jinja: ~description: '{{ doc("order_status") }}'~`,
    `Move the ~{% docs %}~ block into the YAML file.`,
    `Replace ~doc()~ with ~ref()~.`,
    `Run ~dbt docs generate~ before ~dbt parse~.`
  ],
  answer: 0,
  exp: [
    `Em YAML, um valor que começa com ~{~ é lido como um dicionário inline. Jinja em YAML precisa estar entre aspas para ser tratado como string e renderizado pelo dbt.`,
    `Blocos ~{% docs %}~ ficam em arquivos ~.md~ dentro dos paths do projeto.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/description'
},
{
  id: 'd3-y-dupnames', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `After adding a PayPal integration, parsing fails with ~dbt found two models with the name "stg_payments"~. The files are ~models/staging/stripe/stg_payments.sql~ and ~models/staging/paypal/stg_payments.sql~. What is the correct fix?`,
  options: [
    `Rename them to unique names, such as ~stg_stripe__payments~ and ~stg_paypal__payments~.`,
    `Give each folder a different ~+schema~ so the tables don't collide.`,
    `Set a different ~alias~ on each model.`,
    `Run with ~--no-partial-parse~.`
  ],
  answer: 0,
  exp: [
    `O nome do **nó** (o nome do arquivo) precisa ser único no projeto, porque é ele que o ~ref()~ usa. Schema e alias mudam só o objeto no banco; dois ~ref('stg_payments')~ continuariam ambíguos.`,
    `A convenção ~stg_[source]__[entity]s~ evita esse problema desde o início.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/how-we-structure/2-staging'
},
{
  id: 'd3-y-parse', d: 'd3', type: 'mc',
  topic: 'Troubleshooting .yml compilation errors',
  stem: `You edited a dozen YAML files and want the fastest check that the project still parses (YAML structure, refs, Jinja), without running anything in the warehouse. Which command should you run?`,
  options: [
    `~dbt parse~`,
    `~dbt debug~`,
    `~dbt build --empty~`,
    `~dbt docs serve~`
  ],
  answer: 0,
  exp: [
    `~dbt parse~ lê o projeto, valida YAML e Jinja, monta o DAG e grava o ~manifest.json~, sem executar SQL de modelos no warehouse.`,
    `~dbt debug~ testa a conexão. ~build --empty~ executa SQL no warehouse. ~docs serve~ só serve a documentação.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/parse'
},
{
  id: 'd3-f-downstream', d: 'd3', type: 'mc',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You changed the logic of ~stg_orders~. Before opening a pull request, you want to confirm in development that ~stg_orders~ and everything that depends on it still build and pass their tests. Which command should you run?`,
  options: [
    `~dbt build --select stg_orders+~`,
    `~dbt run --select stg_orders~`,
    `~dbt test --select stg_orders~`,
    `~dbt build --select +stg_orders~`
  ],
  answer: 0,
  exp: [
    `~stg_orders+~ seleciona o modelo e **todos os descendentes**, e ~build~ constrói e testa cada um na ordem do DAG. Assim você vê o impacto da mudança a jusante.`,
    `~+stg_orders~ pegaria os ancestrais, que não mudaram. ~run~ ou ~test~ sozinhos cobrem só metade do trabalho.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/graph-operators'
},
{
  id: 'd3-f-audit', d: 'd3', type: 'mc',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You refactored ~fct_revenue~ for readability, and the output must stay identical to production. How do you best verify this before merging?`,
  options: [
    `Use the ~audit_helper~ package (for example, ~compare_relations~) to compare your dev relation with the production relation.`,
    `Run ~dbt clone~ from production into dev.`,
    `Run ~fct_revenue~ with ~--sample="3 days"~.`,
    `Write a unit test whose ~given~ inputs are copied from production data.`
  ],
  answer: 0,
  exp: [
    `~audit_helper~ compara duas relações ou consultas linha a linha e coluna a coluna, mostrando quantas linhas batem e quais divergem. É a ferramenta indicada para refatorações que não podem mudar o resultado.`,
    `Clone só copiaria produção, sem testar nada. Amostras e unit tests não comparam o resultado completo.`
  ],
  doc: 'https://docs.getdbt.com/guides/refactoring-legacy-sql'
},
{
  id: 'd3-f-branch', d: 'd3', type: 'mc',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `You're on ~main~ with an up-to-date copy. Which Git command creates a new branch called ~fix/orders-nulls~ and switches to it, so you can start the fix?`,
  options: [
    `~git checkout -b fix/orders-nulls~`,
    `~git merge fix/orders-nulls~`,
    `~git commit -m "fix/orders-nulls"~`,
    `~git push origin main~`
  ],
  answer: 0,
  exp: [
    `~git checkout -b <branch>~ (ou ~git switch -c <branch>~) cria a branch a partir da atual e muda para ela. Depois: commits, ~git push~ da branch, PR e CI.`,
    `Para trazer o que outros colegas já mesclaram em ~main~, use ~git pull~ (que faz ~fetch~ + ~merge~).`
  ],
  doc: 'https://docs.getdbt.com/best-practices/best-practice-workflows'
},
{
  id: 'd3-f-ci-domc', d: 'd3', type: 'domc',
  topic: 'Developing and implementing a fix and testing it prior to merging',
  stem: `Which statement about a CI job for dbt pull requests is correct?`,
  options: [
    `It builds and tests the modified models and their children in an isolated schema, often with ~state:modified+~ and ~--defer~, without touching production.`,
    `It should run ~--full-refresh~ against the production schemas to guarantee accuracy.`,
    `It is unnecessary as long as ~dbt compile~ succeeds on the developer's machine.`,
    `It should only run ~dbt run~, because tests are executed after deployment.`
  ],
  answer: 0,
  exp: [
    `CI valida o PR **antes** do merge, num schema temporário: constrói e testa só o que mudou e os dependentes (Slim CI), usando produção como referência (~--defer --state~).`,
    `Rodar contra produção, confiar só no compile ou deixar os testes para depois do deploy anulam o propósito do CI.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/best-practice-workflows'
},
{
  id: 'd3-fl-weo', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `In CI, you want every warning promoted to an error, except ~NoNodesForSelectionCriteria~, which should stay a warning. Which flag is correct in dbt 1.8 and later?`,
  options: [
    `~--warn-error-options '{"error": "all", "warn": ["NoNodesForSelectionCriteria"]}'~`,
    `~--warn-error --exclude NoNodesForSelectionCriteria~`,
    `~--warn-error-options '{"include": "all", "exclude": "NoNodesForSelectionCriteria"}'~`,
    `~--fail-fast --warn NoNodesForSelectionCriteria~`
  ],
  answer: 0,
  exp: [
    `~--warn-error-options~ recebe um JSON com ~error~ (~"all"~ ou uma lista), ~warn~ (exceções que continuam warning) e ~silence~ (warnings suprimidos). ~include~ e ~exclude~ são os nomes antigos, descontinuados no 1.8; os valores devem ser listas.`,
    `~--exclude~ é flag de seleção de nós, não de warnings. ~--warn-error~ sozinho promove **todos** os warnings.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/warnings'
},
{
  id: 'd3-fl-precedence', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `~dbt_project.yml~ sets ~flags: {fail_fast: true}~. A developer runs ~dbt build --no-fail-fast~ locally. How does the run behave?`,
  options: [
    `Fail-fast is off; the CLI flag takes precedence over the project flag.`,
    `Fail-fast is on; ~dbt_project.yml~ always wins, so the whole team gets the same behavior.`,
    `dbt raises an error about conflicting settings.`,
    `Fail-fast is on, because boolean flags can't be disabled from the CLI.`
  ],
  answer: 0,
  exp: [
    `Para flags globais, a precedência é: **CLI > variável de ambiente (~DBT_FAIL_FAST~) > ~flags:~ no ~dbt_project.yml~**. Flags booleanas costumam ter a forma ~--no-...~ para desligar.`,
    `Behavior change flags são exceção: só existem no ~dbt_project.yml~.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/about-global-configs'
},
{
  id: 'd3-fl-fullrefresh', d: 'd3', type: 'mc',
  topic: 'Managing dbt behavior with flags',
  stem: `An incremental model has ~full_refresh: false~ in its config. Someone runs ~dbt run --full-refresh --select fct_events~. What happens to ~fct_events~?`,
  options: [
    `It runs incrementally; the model config takes precedence over the flag.`,
    `It is dropped and rebuilt, because the CLI flag always wins.`,
    `The run fails with a configuration conflict error.`,
    `The model is skipped.`
  ],
  answer: 0,
  exp: [
    `A config ~full_refresh~ (~true~ ou ~false~), quando definida no modelo, **tem precedência** sobre a presença ou ausência do flag ~--full-refresh~. É uma proteção comum para tabelas enormes ou com histórico difícil de reconstruir, como microbatch.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/full_refresh'
},
{
  id: 'd3-fl-match', d: 'd3', type: 'match',
  topic: 'Managing dbt behavior with flags',
  stem: `Match each flag to its effect.`,
  left: [`~--fail-fast~`, `~--warn-error~`, `~--full-refresh~`, `~--quiet~`, `~--threads 8~`],
  right: [
    `Stops the run at the first failure`,
    `Treats every warning as an error`,
    `Rebuilds incremental models and seeds from scratch`,
    `Suppresses non-error log output`,
    `Runs up to 8 nodes in parallel`
  ],
  answer: [0, 1, 2, 3, 4],
  exp: [
    `Esses flags podem ir na linha de comando, em variáveis de ambiente ou em ~flags:~ no ~dbt_project.yml~ (os globais), com a CLI tendo precedência. ~--full-refresh~ é ignorado por modelos com ~full_refresh: false~ e por snapshots.`
  ],
  doc: 'https://docs.getdbt.com/reference/global-configs/about-global-configs'
}
);
