/* Prova 2 · nível real — D5 (10), D6 (4), D7 (4). */
window.DBT_Q.push(

/* ── D5 ── */
{
  id: 'p2-d5-singular-warn', exam: 'p2', lvl: 3, art: 'sql', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `This singular test returns 3 rows and blocks the nightly ~dbt build~. The team wants it to keep reporting those rows, but only as a warning. Which change does that?`,
  code: [{ lang: 'sql', label: 'tests/assert_no_negative_totals.sql', text: `
    select order_id
    from {{ ref('fct_orders') }}
    where order_total < 0` }],
  options: [
    `Add ~{{ config(warn_if='>0') }}~ at the top of the test's SQL file.`,
    `Add ~severity: warn~ to the ~data_tests~ of ~order_total~ in the model's YAML.`,
    `Add ~--warn-error-options~ to the ~dbt build~ command of the nightly job.`,
    `Add ~{{ config(severity='warn') }}~ at the top of the test's SQL file.`
  ],
  answer: 3,
  exp: [`Um teste singular é configurado com ~config()~ no próprio arquivo SQL. Com ~severity='warn'~, o dbt ignora ~error_if~ e só avalia ~warn_if~.`],
  why: [
    `Não basta: a severidade padrão continua ~error~ e o ~error_if~ padrão (~!=0~) é avaliado primeiro, então 3 linhas ainda dão erro.`,
    `Essa entrada do YAML configura testes genéricos aplicados à coluna, não este teste singular.`,
    `Essa opção promove warnings a erros; não faz o caminho contrário.`,
    `A severidade do teste passa a ser warning, e as linhas continuam sendo reportadas.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d5-thresholds', exam: 'p2', lvl: 3, art: 'yaml', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The query of this test returns 500 duplicated values. What is the result of the test?`,
  code: [{ lang: 'yaml', label: 'models/staging/_stg_models.yml', text: `
    models:
      - name: stg_payments
        columns:
          - name: payment_id
            data_tests:
              - unique:
                  config:
                    severity: warn
                    error_if: ">100"` }],
  options: [
    `ERROR, because 500 is above the ~error_if~ threshold of 100.`,
    `WARN, because ~severity: warn~ makes dbt skip the ~error_if~ check.`,
    `PASS, because no ~warn_if~ condition was set for the test.`,
    `ERROR, because a met ~error_if~ always takes priority over ~severity~.`
  ],
  answer: 1,
  exp: [`Com ~severity: warn~, o dbt pula ~error_if~ e só avalia ~warn_if~, cujo padrão é ~!=0~. Como 500 é diferente de zero, o resultado é WARN.`],
  why: [
    `~error_if~ só é avaliado quando a severidade é ~error~.`,
    `O teste só pode avisar; o ~warn_if~ padrão é atendido.`,
    `~warn_if~ tem padrão ~!=0~ mesmo sem ser declarado.`,
    `É o contrário: a severidade decide se ~error_if~ entra em jogo.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'p2-d5-store-failures', exam: 'p2', lvl: 2, d: 'd5', type: 'domc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about a data test configured with ~store_failures: true~ is correct?`,
  options: [
    `Its failing rows are saved in a table that is replaced the next time the test runs.`,
    `Its failing rows are appended to an audit table, together with the time of each run.`,
    `Its failing rows are written to ~target/run_results.json~ at the end of each run.`,
    `Its result is always reported as a warning, since the rows are kept for review.`
  ],
  answer: 0,
  exp: [`Com ~store_failures~, o dbt grava as linhas que falharam numa tabela do warehouse (por padrão num schema com sufixo ~dbt_test__audit~). Cada execução substitui o resultado anterior do mesmo teste.`],
  why: [
    `A tabela guarda só o resultado da execução mais recente.`,
    `Não há histórico acumulado; a tabela é sobrescrita.`,
    `O ~run_results.json~ guarda status e contagem de falhas, não as linhas.`,
    `Guardar as falhas não muda a severidade do teste.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures'
},
{
  id: 'p2-d5-custom-generic', exam: 'p2', lvl: 2, art: 'sql', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Where does this block belong, and how is it applied to the column ~order_total~ of ~fct_orders~?`,
  code: [{ lang: 'sql', label: 'is_positive.sql', text: `
    {% test is_positive(model, column_name) %}
    select *
    from {{ model }}
    where {{ column_name }} <= 0
    {% endtest %}` }],
  options: [
    `In ~tests/generic/~; applied by listing ~is_positive~ under the column's ~data_tests~ in YAML.`,
    `In ~tests/~; dbt then runs it against every model automatically, as a singular test.`,
    `In ~macros/~; applied by calling ~{{ is_positive() }}~ in the ~where~ clause of the model.`,
    `In ~tests/generic/~; applied with ~{{ config(data_tests=['is_positive']) }}~ in the model's SQL.`
  ],
  answer: 0,
  exp: [`Um bloco ~{% test %}~ define um teste genérico. Ele fica em ~tests/generic/~ (ou em ~macros/~) e é aplicado pelo YAML, onde o dbt preenche ~model~ e ~column_name~.`],
  why: [
    `Local e forma de uso corretos.`,
    `Arquivos soltos em ~tests/~ são testes singulares: um ~select~ sem o bloco ~{% test %}~, que não recebe argumentos.`,
    `A pasta é aceita, mas um teste genérico não é chamado dentro do SQL do modelo.`,
    `O local está certo, mas testes genéricos são aplicados no YAML de propriedades, não no ~config()~.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'p2-d5-unit-incremental', exam: 'p2', lvl: 3, art: 'yaml', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Given this incremental model and this unit test, which rows belong in ~expect~?`,
  code: [
    { lang: 'sql', label: 'models/marts/fct_events.sql', text: `
    {{ config(materialized='incremental') }}
    select * from {{ ref('stg_events') }}
    {% if is_incremental() %}
    where event_date > (select max(event_date) from {{ this }})
    {% endif %}` },
    { lang: 'yaml', label: 'models/marts/_unit_tests.yml', text: `
    unit_tests:
      - name: test_fct_events_incremental
        model: fct_events
        overrides:
          macros:
            is_incremental: true
        given:
          - input: ref('stg_events')
            rows:
              - {event_id: 1, event_date: 2026-03-01}
              - {event_id: 2, event_date: 2026-03-02}
              - {event_id: 3, event_date: 2026-03-03}
          - input: this
            rows:
              - {event_id: 1, event_date: 2026-03-01}
        expect:
          rows: # ?` }
  ],
  options: [
    `Events 1, 2 and 3: the table as it will look after the run.`,
    `Event 1: the row that is already present in ~this~.`,
    `Events 2 and 3: the rows that this run would insert or merge.`,
    `No rows: with the override, dbt only checks that the model compiles.`
  ],
  answer: 2,
  exp: [`Num teste unitário de modelo incremental, ~expect~ descreve o que a consulta devolve nessa execução, ou seja, as linhas que seriam inseridas ou mescladas, e não o estado final da tabela.`],
  why: [
    `O teste unitário não simula o merge; ele compara só o resultado da consulta.`,
    `Essa linha é dado de entrada (~this~) e é excluída pelo filtro.`,
    `O filtro deixa passar só os eventos depois de 2026-03-01.`,
    `O override só fixa o valor de ~is_incremental()~; a consulta roda e é comparada.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-unit-parents', exam: 'p2', lvl: 2, art: 'cli', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `In a brand-new CI schema, with no production artifacts available, ~dbt test --select "fct_orders,test_type:unit"~ fails because ~stg_orders~ and ~stg_payments~ don't exist there. What is the cheapest way to make the unit tests run?`,
  options: [
    `Set ~format: sql~ on every ~given~ input, so that dbt no longer looks up the parents.`,
    `Run ~dbt run --select "stg_orders stg_payments" --empty~ first, to create empty parents.`,
    `Run ~dbt compile --select fct_orders~ first, so that dbt writes the parents' compiled SQL.`,
    `Add ~--indirect-selection empty~ to the command, so that the parents aren't required.`
  ],
  answer: 1,
  exp: [`Os pais diretos do modelo testado precisam existir no warehouse, mas não precisam ter dados. A documentação recomenda criá-los com ~--empty~.`],
  why: [
    `~format: sql~ muda como os dados de entrada são escritos; os pais continuam precisando existir.`,
    `Cria as relações com o schema certo e zero linhas, quase sem custo.`,
    `Compilar não cria nenhuma relação no warehouse.`,
    `Essa flag controla quais testes são selecionados de forma indireta, não dependências.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-unit-multi', exam: 'p2', lvl: 3, d: 'd5', type: 'multi', choose: 3,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which three statements about unit tests are correct? (Choose three.)`,
  options: [
    `They can only be defined for models written in SQL.`,
    `They are defined in YAML files inside the models directory.`,
    `An input that is an ephemeral model must use ~format: sql~.`,
    `They run as part of ~dbt run~, right before each model is built.`,
    `dbt Labs recommends running them in every production job.`,
    `They can replace data tests on materialized views.`
  ],
  answers: [0, 1, 2],
  exp: [`Testes unitários validam a lógica do SQL com dados fixos. Ficam em YAML na pasta de modelos, só valem para modelos SQL e devem rodar em desenvolvimento e CI, não em produção.`],
  why: [
    `Modelos Python não podem ter testes unitários.`,
    `São declarados em ~unit_tests:~ num YAML dentro de ~models/~.`,
    `Para entradas ephemeral, a documentação exige ~format: sql~.`,
    `Eles rodam com ~dbt test~ ou ~dbt build~, não com ~dbt run~.`,
    `A recomendação é rodá-los só em desenvolvimento e CI.`,
    `Materialized views não são suportadas por testes unitários.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-assume-match', exam: 'p2', lvl: 1, d: 'd5', type: 'match',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Match each assumption about the data to the test that checks it. One option is not used.`,
  left: [
    `Every ~customer_id~ in ~fct_orders~ exists in ~dim_customers~`,
    `~status~ is always one of four known values`,
    `There is no more than one row per ~order_id~`,
    `Refund totals never exceed order totals, a rule that spans two models`
  ],
  right: [`~relationships~`, `~accepted_values~`, `~unique~`, `A singular test`, `~not_null~`],
  answer: [0, 1, 2, 3],
  exp: [`~relationships~ checa integridade referencial, ~accepted_values~ checa o domínio de valores, ~unique~ checa duplicatas, e regras de negócio que cruzam modelos pedem um teste singular (um ~select~ que devolve as linhas inválidas).`],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'p2-d5-workflow-multi', exam: 'p2', lvl: 3, art: 'cli', d: 'd5', type: 'multi', choose: 2,
  topic: 'Implementing various testing steps in the workflow',
  stem: `A production job must build every model and run every data test, but skip unit tests. Which two commands do that? (Choose two.)`,
  options: [
    `~dbt build --exclude-resource-type unit_test~`,
    `~dbt build --exclude "test_type:unit"~`,
    `~dbt build --select "test_type:data"~`,
    `~dbt run --exclude "test_type:unit"~`,
    `~dbt test --exclude "test_type:unit"~`
  ],
  answers: [0, 1],
  exp: [`Dá para tirar os testes unitários pelo tipo de recurso (~--exclude-resource-type unit_test~) ou pelo seletor ~test_type:unit~ em ~--exclude~. O resto do ~dbt build~ continua igual.`],
  why: [
    `Exclui o tipo de recurso ~unit_test~ e mantém modelos e data tests.`,
    `Exclui só os testes unitários; modelos e data tests continuam.`,
    `Seleciona apenas os data tests; nenhum modelo é construído.`,
    `~dbt run~ não executa teste nenhum, então os data tests ficam de fora.`,
    `Roda os data tests, mas ~dbt test~ não constrói nenhum modelo.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'p2-d5-indirect-domc', exam: 'p2', lvl: 3, art: 'cli', d: 'd5', type: 'domc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `~fct_orders~ has a ~relationships~ test that points to ~dim_customers~. Which statement about ~dbt test --select dim_customers~ is correct?`,
  options: [
    `In the default ~eager~ mode, the ~relationships~ test runs even though ~fct_orders~ wasn't selected.`,
    `In the default ~cautious~ mode, the ~relationships~ test is left out because ~fct_orders~ wasn't selected.`,
    `In every mode, a test runs only when all the models that it depends on were selected.`,
    `The ~relationships~ test never runs here, because it is defined in the YAML of ~fct_orders~.`
  ],
  answer: 0,
  exp: [`O modo padrão de seleção indireta é ~eager~: um teste roda se qualquer um dos pais dele foi selecionado. ~cautious~ exige que todos os pais estejam selecionados.`],
  why: [
    `Em ~eager~ basta um dos pais (~dim_customers~) estar selecionado.`,
    `A descrição de ~cautious~ está certa, mas ele não é o modo padrão.`,
    `Isso vale para ~cautious~, não para ~eager~.`,
    `O teste depende dos dois modelos, não importa em qual YAML foi declarado.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/test-selection-examples'
},

/* ── D6 ── */
{
  id: 'p2-d6-exposure-select', exam: 'p2', lvl: 2, art: 'yaml', d: 'd6', type: 'mc',
  topic: 'Implementing dbt exposures',
  stem: `Before the Monday refresh of this dashboard, a job must build and test everything the dashboard depends on, and nothing else. Which command does that?`,
  code: [{ lang: 'yaml', label: 'models/marts/_exposures.yml', text: `
    exposures:
      - name: weekly_revenue
        type: dashboard
        owner:
          name: Finance Analytics
          email: finance@example.com
        depends_on:
          - ref('fct_revenue')
          - ref('dim_customers')` }],
  options: [
    `~dbt build --select exposure:weekly_revenue+~`,
    `~dbt build --select fct_revenue dim_customers~`,
    `~dbt build --select +exposure:weekly_revenue~`,
    `~dbt build --select +tag:weekly_revenue~`
  ],
  answer: 2,
  exp: [`O método ~exposure:~ seleciona a exposure, e o ~+~ na frente traz todos os ancestrais dela: os dois modelos e tudo de que eles dependem.`],
  why: [
    `O ~+~ depois do nome pega descendentes, e uma exposure não tem nenhum.`,
    `Constrói só os dois modelos, sem os pais deles.`,
    `Todos os ancestrais da exposure, e só eles.`,
    `O nome da exposure não é uma tag; nada seria selecionado.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/exposures'
},
{
  id: 'p2-d6-exposure-multi', exam: 'p2', lvl: 2, d: 'd6', type: 'multi', choose: 2,
  topic: 'Implementing dbt exposures',
  stem: `Which two statements about exposures are correct? (Choose two.)`,
  options: [
    `~depends_on~ can list models, sources and metrics.`,
    `~type~ accepts values such as ~dashboard~, ~notebook~ and ~ml~.`,
    `dbt builds each exposure as a view in the target schema.`,
    `~maturity~ is required and accepts ~dev~ or ~prod~.`,
    `An exposure is declared in the BI tool and imported by dbt.`
  ],
  answers: [0, 1],
  exp: [`Uma exposure é só uma declaração em YAML de um uso externo dos dados. Ela aparece no DAG e na documentação, mas não cria nada no warehouse.`],
  why: [
    `Aceita ~ref()~, ~source()~ e ~metric()~.`,
    `Os tipos são ~dashboard~, ~notebook~, ~analysis~, ~ml~ e ~application~.`,
    `Exposures não são materializadas.`,
    `~maturity~ é opcional e aceita ~high~, ~medium~ ou ~low~.`,
    `Ela é escrita à mão no YAML do projeto dbt.`
  ],
  doc: 'https://docs.getdbt.com/reference/exposure-properties'
},
{
  id: 'p2-d6-fresh-yaml', exam: 'p2', lvl: 3, art: 'yaml', d: 'd6', type: 'mc',
  topic: 'Implementing source freshness',
  stem: `~dbt source freshness~ runs when the newest ~_loaded_at~ is 30 hours old in ~payments~ and 40 hours old in ~refunds~. What does the command report?`,
  code: [{ lang: 'yaml', label: 'models/staging/stripe/_sources.yml', text: `
    sources:
      - name: stripe
        config:
          loaded_at_field: _loaded_at
          freshness:
            warn_after: {count: 12, period: hour}
            error_after: {count: 24, period: hour}
        tables:
          - name: payments
          - name: refunds
            config:
              freshness: null` }],
  options: [
    `~payments~: error; ~refunds~: not checked`,
    `~payments~: error; ~refunds~: error`,
    `~payments~: error; ~refunds~: warning`,
    `~payments~: warning; ~refunds~: not checked`
  ],
  answer: 0,
  exp: [`As tabelas herdam o freshness da source. ~payments~ passou das 24 horas do ~error_after~. ~refunds~ tem ~freshness: null~, que tira a tabela da checagem.`],
  why: [
    `Erro para ~payments~ e nenhuma checagem para ~refunds~.`,
    `~refunds~ não herda a regra, porque ~freshness: null~ a desliga para essa tabela.`,
    `~refunds~ não é avaliada, então não recebe aviso nem erro.`,
    `30 horas passa do limite de erro (24), não só do de aviso (12).`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/freshness'
},
{
  id: 'p2-d6-fresh-fill', exam: 'p2', lvl: 2, d: 'd6', type: 'fill',
  topic: 'Implementing source freshness',
  stem: `Complete the name of the artifact that ~dbt source freshness~ writes with the result for each source: ~target/______.json~`,
  accept: ['sources', 'sources.json'],
  exp: [`O comando grava ~target/sources.json~. É esse arquivo que o seletor ~source_status:fresher~ compara com o de uma execução anterior.`],
  doc: 'https://docs.getdbt.com/reference/artifacts/sources-json'
},

/* ── D7 ── */
{
  id: 'p2-d7-ci-order', exam: 'p2', lvl: 3, art: 'cli', d: 'd7', type: 'order',
  topic: 'Understanding state and state selection',
  stem: `A team sets up CI so that each pull request builds only what changed. Put the steps in order.`,
  items: [
    `The production job finishes, and its ~manifest.json~ is saved.`,
    `A pull request is opened, and the CI job downloads that manifest into a folder.`,
    `CI runs ~dbt build --select state:modified+ --defer --state <folder>~.`,
    `Modified models and their children are built in the CI schema, reading unmodified parents from production.`,
    `The pull request is merged, and the next production run saves a new manifest.`
  ],
  exp: [`O manifest de produção é a base de comparação. ~state:modified+~ escolhe o que mudou e os filhos, e ~--defer~ faz os pais não modificados serem lidos de produção.`],
  doc: 'https://docs.getdbt.com/reference/node-selection/defer'
},
{
  id: 'p2-d7-state-sub', exam: 'p2', lvl: 2, art: 'cli', d: 'd7', type: 'mc',
  topic: 'Understanding state and state selection',
  stem: `A pull request changes the ~materialized~ config of ~dim_customers~ in YAML and the SQL of ~fct_orders~. The CI job should build only the models whose SQL changed and ignore config-only changes. Which selector does that?`,
  options: [
    `~state:modified.configs~`,
    `~state:modified.contract~`,
    `~state:modified.body~`,
    `~state:modified.relation~`
  ],
  answer: 2,
  exp: [`~state:modified~ aceita subseletores. ~.body~ compara só o código do modelo; ~.configs~ compara as configs; ~.relation~ compara database, schema e alias; ~.contract~ compara o contrato.`],
  why: [
    `Pegaria ~dim_customers~, o caso que deve ficar de fora.`,
    `Só detecta mudanças no contrato do modelo.`,
    `Compara apenas o SQL do modelo: só ~fct_orders~ entra.`,
    `Só detecta mudanças de database, schema ou alias.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#state'
},
{
  id: 'p2-d7-retry', exam: 'p2', lvl: 3, art: 'json', d: 'd7', type: 'mc',
  topic: 'Using dbt retry',
  stem: `This is an excerpt of ~target/run_results.json~ after a failed job. You fix ~int_orders~ and run ~dbt retry~ in the same project folder. What does dbt do?`,
  code: [{ lang: 'json', label: 'target/run_results.json (excerpt)', text: `
    {
      "args": { "which": "build", "select": ["tag:nightly"], "full_refresh": true },
      "results": [
        { "unique_id": "model.jaffle.stg_orders", "status": "success" },
        { "unique_id": "model.jaffle.int_orders", "status": "error" },
        { "unique_id": "model.jaffle.fct_orders", "status": "skipped" }
      ]
    }` }],
  options: [
    `It runs ~int_orders~ and ~fct_orders~ with the earlier command and flags, skipping ~stg_orders~.`,
    `It runs ~int_orders~ and ~fct_orders~ as a plain ~run~, because the earlier flags aren't kept.`,
    `It runs only ~int_orders~; the skipped node needs a separate ~dbt build~ afterwards.`,
    `It runs all three models again, because ~retry~ repeats the previous command from the start.`
  ],
  answer: 0,
  exp: [`O ~dbt retry~ lê o ~run_results.json~ da última execução e repete o mesmo comando, com as mesmas opções, só para os nós que deram erro ou foram pulados.`],
  why: [
    `Retoma do ponto de falha com o comando e as flags originais.`,
    `O retry reaproveita o comando (~build~) e as flags registradas em ~args~.`,
    `Os nós pulados por causa do erro também entram no retry.`,
    `Nós com sucesso não são refeitos; é essa a vantagem do retry.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/retry'
},
{
  id: 'p2-d7-result-fill', exam: 'p2', lvl: 2, art: 'cli', d: 'd7', type: 'fill',
  topic: 'Understanding state and state selection',
  stem: `Complete the selector so that dbt rebuilds the models that ended with an error in the previous run, plus everything downstream of them: ~dbt build --select "result:______+" --state ./previous-run~`,
  accept: ['error'],
  exp: [`O método ~result:~ lê o ~run_results.json~ da pasta indicada em ~--state~. ~error~ é o status de modelos que falharam; ~fail~ é o de testes que falharam.`],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#result'
}
);
