/* Domain 5 · Implementing dbt tests · bank expansion (20) */
window.DBT_Q.push(
{
  id: 'd5-g-relationships', d: 'd5', type: 'mc', codeOptions: true,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Every ~customer_id~ in ~fct_orders~ must exist in ~dim_customers~. Which YAML correctly applies the built-in test in dbt Core 1.11?`,
  options: [
    `
    - name: customer_id
      data_tests:
        - relationships:
            arguments:
              to: ref('dim_customers')
              field: customer_id`,
    `
    - name: customer_id
      data_tests:
        - relationships:
            config:
              to: ref('dim_customers')
              field: customer_id`,
    `
    - name: customer_id
      data_tests:
        - foreign_key: dim_customers.customer_id`,
    `
    - name: customer_id
      data_tests:
        - relationships:
            arguments:
              model: dim_customers
              column: customer_id`
  ],
  answer: 0,
  exp: [
    `~relationships~ verifica integridade referencial: recebe ~to~ (o modelo ou source pai, via ~ref~/~source~) e ~field~ (a coluna no pai). Os argumentos ficam em ~arguments:~; ~config:~ é para ~severity~, ~where~ etc.`,
    `Os quatro testes genéricos nativos são ~unique~, ~not_null~, ~accepted_values~ e ~relationships~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/data-tests'
},
{
  id: 'd5-g-quote', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `An ~accepted_values~ test on the integer column ~priority~ uses ~values: [1, 2, 3]~ and fails on your platform, because the values are compared as strings. What is the cleanest fix?`,
  options: [
    `Add ~quote: false~ to the test's arguments.`,
    `Cast ~priority~ to text in the model.`,
    `Set ~severity: warn~ on the test.`,
    `Replace the test with ~relationships~.`
  ],
  answer: 0,
  exp: [
    `Por padrão, ~accepted_values~ coloca aspas nos valores (~'1'~). Com ~quote: false~, o SQL compara com números (~1~), como esperado para colunas numéricas ou booleanas.`,
    `Mudar o tipo da coluna só para o teste passar altera o modelo, e ~warn~ só esconde o problema.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-properties/data-tests#accepted_values'
},
{
  id: 'd5-g-builtins', d: 'd5', type: 'multi', choose: 2,
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which two of these are built-in generic data tests in dbt Core, available without installing any package? (Choose two.)`,
  options: [`~unique~`, `~relationships~`, `~expression_is_true~`, `~unique_combination_of_columns~`, `~recency~`],
  answers: [0, 1],
  exp: [
    `Nativos do dbt: ~unique~, ~not_null~, ~accepted_values~ e ~relationships~.`,
    `~expression_is_true~, ~unique_combination_of_columns~ e ~recency~ vêm do pacote **dbt_utils** e são chamados com o prefixo do pacote: ~dbt_utils.recency~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'd5-g-composite', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `In ~fct_order_lines~, the combination of ~order_id~ and ~line_number~ must be unique, but neither column is unique on its own. Which test should you use?`,
  options: [
    `~dbt_utils.unique_combination_of_columns~ at the model level, with ~combination_of_columns: [order_id, line_number]~`,
    `A ~unique~ test on ~order_id~ and another on ~line_number~`,
    `~unique_key: ['order_id', 'line_number']~ in the model config`,
    `A ~relationships~ test from ~line_number~ to ~order_id~`
  ],
  answer: 0,
  exp: [
    `Unicidade composta é testada no nível do modelo. ~dbt_utils.unique_combination_of_columns~ é a opção pronta; também daria para testar ~unique~ numa chave substituta (~generate_surrogate_key~).`,
    `Dois testes ~unique~ separados falhariam, porque cada coluna sozinha se repete. ~unique_key~ é config de incrementais, não teste.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd5-s-severity', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The singular test ~tests/assert_refunds_below_payments.sql~ should only warn, never error. How do you configure that?`,
  options: [
    `Add ~{{ config(severity = 'warn') }}~ at the top of the test's SQL file.`,
    `Add ~severity: warn~ under a column's ~data_tests~ in the model YAML.`,
    `Run the project with ~--warn-error~.`,
    `Rename the file to ~assert_refunds_below_payments_warn.sql~.`
  ],
  answer: 0,
  exp: [
    `Testes singulares são configurados com ~config()~ no próprio arquivo ou, em grupo, em ~data_tests:~ no ~dbt_project.yml~. Desde o 1.9 é possível descrevê-los em YAML (~data_tests: - name: ...~).`,
    `~--warn-error~ faz o contrário: transforma warnings em erros.`
  ],
  doc: 'https://docs.getdbt.com/reference/data-test-configs'
},
{
  id: 'd5-s-zero', d: 'd5', type: 'fill',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Complete the blank with a number. A dbt data test (singular or generic) passes when its query returns ______ rows.`,
  accept: ['0', 'zero', 'no', 'none'],
  exp: [
    `Data tests são consultas que selecionam as **linhas com problema**. Zero linhas significa sucesso. Por padrão, qualquer contagem diferente de zero falha (~error_if: "!=0"~), e você pode ajustar isso com ~warn_if~, ~error_if~ e ~fail_calc~.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/data-tests'
},
{
  id: 'd5-cg-domc', d: 'd5', type: 'domc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Which statement about custom generic tests is correct?`,
  options: [
    `They are ~{% test %}~ blocks, usually in ~tests/generic/~ or the macros folder, that receive ~model~ and, for column tests, ~column_name~.`,
    `They must be written in Python.`,
    `They are defined in ~dbt_project.yml~ under ~data_tests:~.`,
    `They must return the rows that pass the check.`
  ],
  answer: 0,
  exp: [
    `Um teste genérico customizado é como um macro: ~{% test nome(model, column_name, outros_args) %} ... {% endtest %}~. Ele retorna as linhas que **falham**, e depois é aplicado em YAML a qualquer modelo, coluna ou source.`,
    `O ~dbt_project.yml~ só configura testes (severity e afins); não os define.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-cg-model-level', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `You wrote ~{% test has_min_rows(model, min_rows) %}~, which checks the row count of a whole model. How do you apply it to ~fct_orders~ with a minimum of 1,000 rows?`,
  options: [
    `Under the model's own ~data_tests:~ key (not under a column), with ~arguments: {min_rows: 1000}~`,
    `Under every column's ~data_tests:~ key`,
    `In ~dbt_project.yml~ as ~+has_min_rows: 1000~`,
    `As a unit test with ~given~ rows`
  ],
  answer: 0,
  exp: [
    `Testes sem ~column_name~ na assinatura são de **nível de modelo** e ficam em ~models: - name: fct_orders data_tests:~. Testes com ~column_name~ ficam sob a coluna, e o dbt preenche esse argumento automaticamente.`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-cg-hotspot', d: 'd5', type: 'hotspot',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `This custom generic test fails on healthy data where every value is positive. Click the line with the bug.`,
  code: [{ lang: 'sql', label: 'tests/generic/is_positive.sql', hotspot: true, text: `
    {% test is_positive(model, column_name) %}

    select *
    from {{ model }}
    where {{ column_name }} >= 0

    {% endtest %}` }],
  answer: 4,
  exp: [
    `Um data test deve retornar as linhas que **violam** a regra. Esse ~where~ retorna as linhas válidas, então o teste falha justamente quando os dados estão corretos. O certo é ~where {{ column_name }} < 0~ (ou ~<= 0~, se zero também for inválido).`
  ],
  doc: 'https://docs.getdbt.com/best-practices/writing-custom-generic-tests'
},
{
  id: 'd5-u-fixture', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `Several unit tests reuse the same 60-row input for ~stg_customers~. Writing it inline is unreadable. What is the recommended approach?`,
  options: [
    `Save it as a CSV fixture in ~tests/fixtures/~ and reference it with ~format: csv~ and ~fixture: <name>~.`,
    `Load it as a seed and point ~given~ to ~ref('the_seed')~.`,
    `Write ~rows: ref('stg_customers')~ so the unit test reads production data.`,
    `Put the CSV in ~models/fixtures/~ and ~ref()~ it.`
  ],
  answer: 0,
  exp: [
    `Unit tests aceitam ~format~ ~dict~ (padrão), ~csv~ ou ~sql~, inline ou como **fixture**: um arquivo em ~fixtures/~ dentro de um test path, referenciado por ~fixture:~ em ~given~ ou ~expect~.`,
    `Unit tests usam dados **estáticos** e controlados; ler dados reais anula o propósito.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-ephemeral', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `The model under test refs ~int_customer_flags~, which is materialized as ephemeral. How must its ~given~ input be written?`,
  options: [
    `With ~format: sql~ and rows written as a SQL ~select~`,
    `With ~format: dict~ (the default)`,
    `With ~format: csv~ and a fixture file`,
    `It doesn't need an input, because ephemeral models are inlined automatically`
  ],
  answer: 0,
  exp: [
    `Inputs de modelos ephemeral **precisam** usar ~format: sql~, por exemplo ~rows: | select 1 as customer_id, true as is_vip~. Todo ~ref~ ou ~source~ do modelo precisa aparecer em ~given~, inclusive os ephemeral.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-columns', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `~dim_customers~ returns 40 columns, but your unit test only checks the email-validation logic, which uses ~email~ and produces ~is_valid_email~. What must the ~given~ and ~expect~ rows contain?`,
  options: [
    `Only the columns relevant to the logic under test, such as ~email~ and ~is_valid_email~`,
    `All 40 columns, because missing columns make the test fail`,
    `Only the primary key column`,
    `All columns, with NULL where you don't care`
  ],
  answer: 0,
  exp: [
    `Nos formatos ~dict~ e ~csv~, basta informar as colunas relevantes; o dbt completa o resto. Isso deixa o teste focado e legível, documentando exatamente qual regra está sendo validada.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-select', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want to run all unit tests defined on ~dim_customers~, and nothing else. Which command should you use?`,
  options: [
    `~dbt test --select "dim_customers,test_type:unit"~`,
    `~dbt test --select "dim_customers test_type:unit"~`,
    `~dbt build --select dim_customers~`,
    `~dbt test --select "test_type:unit+"~`
  ],
  answer: 0,
  exp: [
    `A vírgula faz a interseção: testes ligados a ~dim_customers~ **e** do tipo unit. Com espaço, seria união (todos os testes do modelo mais todos os unit tests do projeto).`,
    `~dbt build~ também construiria o modelo e rodaria seus data tests. Outros valores: ~test_type:data~, ~test_type:generic~, ~test_type:singular~.`
  ],
  doc: 'https://docs.getdbt.com/reference/node-selection/methods#test_type'
},
{
  id: 'd5-u-vars', d: 'd5', type: 'mc',
  topic: 'Using generic, singular, custom, custom generic, and unit tests',
  stem: `A model multiplies amounts by ~{{ var('fx_rate') }}~. In a unit test, you want the rate fixed at 5 so the expected output is predictable. What do you add to the unit test?`,
  options: [
    `~overrides: {vars: {fx_rate: 5}}~`,
    `~given: [{input: var('fx_rate'), rows: [{value: 5}]}]~`,
    `~config: {fx_rate: 5}~`,
    `Run ~dbt test~ with ~--vars '{"fx_rate": 5}'~ every time`
  ],
  answer: 0,
  exp: [
    `~overrides~ permite fixar **macros** (como ~is_incremental~), **vars** e **env_vars** dentro do próprio unit test. Assim ele é determinístico e não depende de flags passados na execução.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-u-when', d: 'd5', type: 'multi', choose: 2,
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Which two situations are good candidates for a unit test, rather than a data test? (Choose two.)`,
  options: [
    `A complex regex that validates email addresses, including tricky edge cases`,
    `Date math with window functions that must handle month-end and leap years`,
    `A staging model that only renames columns from its source`,
    `Checking that ~order_id~ is unique in today's production data`,
    `Checking that the source table was loaded in the last 12 hours`
  ],
  answers: [0, 1],
  exp: [
    `Unit tests validam **lógica** com entradas fixas e casos extremos que talvez ainda não existam nos dados. Regex e cálculos de data com bordas são os exemplos clássicos.`,
    `Renomeações simples não precisam de unit test. Unicidade nos dados reais é papel de data test, e atraso de carga é papel de source freshness.`
  ],
  doc: 'https://docs.getdbt.com/docs/build/unit-tests'
},
{
  id: 'd5-as-early', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `Duplicate customer records arriving from the CRM keep breaking several marts. Following dbt's testing guidance, where should the first test for this problem go?`,
  options: [
    `At the source (or its staging model), with ~unique~ and ~not_null~ on the customer key, so the problem is caught as early as possible`,
    `Only on the final dashboards' exposures`,
    `Only on the marts, because that's where business users see the data`,
    `Nowhere; source data quality is the data engineering team's responsibility`
  ],
  answer: 0,
  exp: [
    `Teste as premissas sobre os dados **o mais cedo possível**. Um teste na source ou no staging identifica a origem do problema e evita investigar cada mart quebrado.`,
    `Testes nos marts continuam úteis para colunas e grãos novos criados ali, mas não substituem a checagem na entrada. Exposures não têm testes.`
  ],
  doc: 'https://docs.getdbt.com/blog/test-smarter-where-tests-should-go'
},
{
  id: 'd5-as-expression', d: 'd5', type: 'mc',
  topic: 'Testing assumptions for dbt models and sources',
  stem: `You need to assert that ~order_date~ is never in the future in ~stg_orders~. With the dbt_utils package installed, which test fits best?`,
  options: [
    `~dbt_utils.expression_is_true~ with ~arguments: {expression: "order_date <= current_date"}~`,
    `~accepted_values~ on ~order_date~`,
    `~not_null~ on ~order_date~`,
    `Source ~freshness~ on ~order_date~`
  ],
  answer: 0,
  exp: [
    `~expression_is_true~ falha nas linhas em que a expressão é falsa, o que é ideal para regras de negócio simples numa linha. Sem pacotes, um teste singular com ~where order_date > current_date~ faz o mesmo.`,
    `Freshness mede atraso de carga, não validade de valores.`
  ],
  doc: 'https://hub.getdbt.com/dbt-labs/dbt_utils/latest/'
},
{
  id: 'd5-w-store-as', d: 'd5', type: 'mc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `You want the failing rows of your tests persisted as **views**, not tables, to avoid storing copies of large datasets. Which config should you use?`,
  options: [
    `~store_failures_as: view~`,
    `~store_failures: view~`,
    `~materialized: view~ on the test`,
    `~--store-failures --as-view~`
  ],
  answer: 0,
  exp: [
    `~store_failures_as~ aceita ~table~, ~view~ ou ~ephemeral~ (que desliga a persistência) e tem precedência sobre ~store_failures~. Como view, você consulta as falhas atuais sem duplicar dados.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/store_failures_as'
},
{
  id: 'd5-w-severity-match', d: 'd5', type: 'match',
  topic: 'Implementing various testing steps in the workflow',
  stem: `A test has ~severity: error~, ~error_if: ">1000"~ and ~warn_if: ">10"~. Match each number of failing rows to the test result. One option is not used.`,
  left: [`5 failing rows`, `50 failing rows`, `1,500 failing rows`],
  right: [`PASS`, `WARN`, `ERROR`, `SKIP`],
  answer: [0, 1, 2],
  exp: [
    `Com ~severity: error~, o dbt avalia primeiro ~error_if~ (1.500 > 1.000 → ERROR); se não bater, avalia ~warn_if~ (50 > 10 → WARN); se nenhum bater, PASS (5).`,
    `Com ~severity: warn~, o ~error_if~ seria ignorado. Os padrões de ~error_if~ e ~warn_if~ são ~!=0~.`
  ],
  doc: 'https://docs.getdbt.com/reference/resource-configs/severity'
},
{
  id: 'd5-w-build-domc', d: 'd5', type: 'domc',
  topic: 'Implementing various testing steps in the workflow',
  stem: `Which statement describes an advantage of ~dbt build~ over running ~dbt run~ and then ~dbt test~?`,
  options: [
    `Each node is tested right after it's built, so downstream models are skipped instead of being built on top of bad data.`,
    `All tests run before any model is built, which saves warehouse compute.`,
    `Source freshness checks run first, automatically.`,
    `Test severity is ignored, so the pipeline always completes.`
  ],
  answer: 0,
  exp: [
    `Com ~run~ seguido de ~test~, todos os modelos são construídos primeiro, inclusive em cima de dados ruins, e os testes só avisam depois. ~build~ intercala: unit tests → modelo → data tests → filhos. Um FAIL impede que o problema se propague.`,
    `~build~ não roda freshness e respeita ~severity~.`
  ],
  doc: 'https://docs.getdbt.com/reference/commands/build'
}
);
