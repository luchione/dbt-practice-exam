/* Prova 2 — rewrites after validation round 1 (blind test and smart-layperson test).
   Each patch replaces fields of the question with that id; untouched fields (code, topic, doc) stay. */
(function () {
  const PATCH = {

  /* balanced 2x2 options; the call now uses the identifier, which needs knowledge of how source() looks tables up */
  'p2-d1-raw-schema': { lvl: 3,
    stem: `The target database is ~analytics~. Given this source definition, what happens when a model selects from ~{{ source('ecommerce', 'raw_orders_v2') }}~?`,
    options: [
      `It compiles to ~analytics.raw_shop.raw_orders_v2~.`,
      `It compiles to ~analytics.ecommerce.raw_orders_v2~.`,
      `Compilation fails: the source has no table ~raw_orders_v2~.`,
      `It compiles to ~analytics.raw_shop.orders~.`
    ],
    answer: 2,
    exp: [`O ~source()~ procura a tabela pelo ~name~ declarado (~orders~). O ~identifier~ só diz qual é o nome físico no warehouse. A chamada certa é ~source('ecommerce', 'orders')~, que compila para ~analytics.raw_shop.raw_orders_v2~.`],
    why: [
      `Esse seria o resultado de ~source('ecommerce', 'orders')~. Com o identifier no lugar do nome, o dbt não encontra a tabela.`,
      `Além de a tabela não ser encontrada, o schema declarado é ~raw_shop~, não o nome da source.`,
      `Nenhuma tabela da source tem ~name: raw_orders_v2~; o dbt acusa que a source não foi encontrada.`,
      `Nada na definição leva a esse nome: o identifier troca ~orders~ por ~raw_orders_v2~ no SQL final.`
    ] },

  /* ephemeral removed: its description gave away another question */
  'p2-d1-mat-match': {
    left: [`~view~`, `~table~`, `~incremental~`, `~materialized_view~`],
    right: [
      `Stores no data; the query runs each time the relation is read`,
      `Stores the full result set and rebuilds all of it on every run`,
      `Stores data and, after the first run, processes only the rows you filter for`,
      `Stores data that the warehouse itself keeps refreshed in the background`,
      `Stores data and keeps a history of every change made to each row`
    ],
    answer: [0, 1, 2, 3],
    exp: [
      `View não guarda dados; table recria tudo; incremental processa só o recorte novo depois da primeira carga; materialized view guarda dados e o próprio warehouse cuida da atualização.`,
      `A opção que sobra descreve um snapshot, que não é uma materialização de modelo.`
    ] },

  'p2-d1-dry-macro': { lvl: 1,
    options: [
      `~round('amount_cents' / 100.0, 2)~`,
      `~round(amount_cents / 100.0, 4)~`,
      `~round('amount_cents' / 100.0, 4)~`,
      `~round(amount_cents / 100.0, 2)~`
    ],
    answer: 3,
    why: [
      `As aspas pertencem ao Jinja, não ao SQL. ~{{ column_name }}~ imprime só ~amount_cents~.`,
      `O 4 foi passado só na segunda chamada, a de ~tax~.`,
      `Nem as aspas chegam ao SQL nem o 4 vale para esta chamada.`,
      `Nome da coluna sem aspas e ~scale~ com o valor padrão.`
    ] },

  /* "command line beats config" was guessable; now it asks about an undefined variable */
  'p2-d1-dry-vars': { art: 'yaml',
    stem: `Given the files below, you run ~dbt run --select fct_orders~. What does ~{{ var("min_order_date") }}~ produce?`,
    code: [
      { lang: 'yaml', label: 'dbt_project.yml', text: `
    vars:
      start_date: "2023-01-01"` },
      { lang: 'sql', label: 'models/marts/fct_orders.sql', text: `
    select * from {{ ref('stg_orders') }}
    where ordered_at >= '{{ var("min_order_date") }}'` }
    ],
    options: [
      `An empty string, so the warehouse rejects the comparison when the model runs.`,
      `~2023-01-01~, because dbt falls back to the only variable the project defines.`,
      `A compilation error, because the variable has no value and no default.`,
      `The text ~None~, so the filter matches nothing and the model builds empty.`
    ],
    answer: 2,
    exp: [`Se a variável não foi definida em lugar nenhum e o ~var()~ não recebeu um segundo argumento, o dbt interrompe a compilação. Com ~var("min_order_date", "2020-01-01")~ o padrão seria usado.`],
    why: [
      `O dbt não substitui uma variável ausente por texto vazio; ele para antes de gerar o SQL.`,
      `~start_date~ é outra variável. Não existe fallback entre nomes diferentes.`,
      `Sem definição e sem padrão, o ~var()~ gera erro de compilação.`,
      `~None~ só apareceria se o padrão passado ao ~var()~ fosse ~none~.`
    ] },

  'p2-d1-cmd-graph': {
    options: [
      `~dbt build --select +fct_orders+1~`,
      `~dbt build --select 1+fct_orders+1~`,
      `~dbt build --select 1+fct_orders+~`,
      `~dbt build --select @fct_orders~`,
      `~dbt build --select +fct_orders+~`
    ],
    answer: 2,
    why: [
      `Todos os ancestrais entram, e os descendentes ficam limitados a um nível.`,
      `O pai direto está certo, mas os descendentes ficam limitados a um nível.`,
      `Um nível de pais (~int_orders~), o próprio modelo e todos os descendentes.`,
      `~@~ traz os descendentes e também todos os ancestrais deles, o que inclui os dois staging.`,
      `Sem número, o ~+~ da frente traz todos os ancestrais, inclusive os dois staging.`
    ] },

  'p2-d1-proj-precedence': {
    options: [
      `As a ~table~ model in the schema ~analytics_finance~`,
      `As an incremental model in the schema ~analytics_marts~`,
      `As a ~table~ model in the schema ~analytics_marts~`,
      `As an incremental model in the schema ~analytics_finance~`
    ],
    answer: 3,
    why: [
      `O schema está certo, mas ~materialized: incremental~ do YAML de propriedades vence o ~table~ do projeto.`,
      `O ~schema='finance'~ do ~config()~ substitui o ~+schema: marts~ do projeto.`,
      `As duas configs do ~dbt_project.yml~ foram sobrescritas por níveis mais específicos.`,
      `Incremental pelo YAML de propriedades, schema ~finance~ pelo ~config()~, prefixado pelo schema do target.`
    ] },

  /* the setting's name gave the answer away; now a 2x2 on backfill and on the removed column */
  'p2-d1-inc-schema': { type: 'mc', choose: undefined, answers: undefined,
    stem: `An incremental model sets ~on_schema_change: append_new_columns~. A change to its query adds the column ~discount~ and removes the column ~coupon_code~. After the next incremental run, what does the target table look like?`,
    options: [
      `~discount~ exists, filled in for every row; ~coupon_code~ remains, NULL in the new rows.`,
      `~discount~ exists, NULL in the older rows; ~coupon_code~ was dropped from the table.`,
      `~discount~ exists, NULL in the older rows; ~coupon_code~ remains, NULL in the new rows.`,
      `~discount~ exists, filled in for every row; ~coupon_code~ was dropped from the table.`
    ],
    answer: 2,
    exp: [`~append_new_columns~ só acrescenta colunas. Ele não remove as que saíram da consulta e não preenche as linhas antigas; para isso é preciso um ~--full-refresh~.`],
    why: [
      `Nenhuma opção de ~on_schema_change~ preenche as linhas antigas.`,
      `Remover colunas é comportamento de ~sync_all_columns~.`,
      `A coluna nova entra vazia para o passado, e a coluna antiga fica, sem valor nas linhas novas.`,
      `Nem há backfill nem remoção de coluna com ~append_new_columns~.`
    ] },

  'p2-d1-microbatch': {
    options: [
      `March 9 and 10`,
      `March 8, 9 and 10`,
      `Only March 10`,
      `March 7, 8 and 9`,
      `March 8 and 9`
    ],
    answer: 1,
    why: [
      `Seria o resultado com o padrão, ~lookback: 1~.`,
      `O lote do dia e os dois anteriores.`,
      `Seria o resultado com ~lookback: 0~.`,
      `O lote atual sempre entra; o lookback se soma a ele.`,
      `O lookback não substitui o lote atual; ele acrescenta lotes anteriores.`
    ] },

  'p2-d1-snap-deletes': { lvl: 1 },

  'p2-d2-versions-ref': {
    options: [
      `~dim_customers_v3~ and ~dim_customers_v3~`,
      `~dim_customers_v2~ and ~dim_customers_v3~`,
      `~dim_customers_v3~ and a compilation error`,
      `~dim_customers_v2~ and a compilation error`
    ],
    answer: 1,
    why: [
      `A maior versão só seria a "latest" se ~latest_version~ não estivesse definido.`,
      `Sem versão vai para a v2 (~latest_version~); com ~v=3~ vai para a v3.`,
      `Nem o ref sem versão vai para a v3, nem fixar a v3 gera erro.`,
      `Uma versão prerelease pode ser referenciada normalmente por quem fixa a versão.`
    ] },

  /* the old distractors were contradicted by artifacts of other questions */
  'p2-d2-versions-domc': {
    options: [
      `By default, the SQL for version 2 of ~dim_customers~ lives in ~dim_customers_v2.sql~.`,
      `A version above ~latest_version~ isn't built until it is promoted to latest.`,
      `Every version must repeat the model's complete list of columns in the YAML.`,
      `All versions share one relation, with a ~version~ column to tell rows apart.`
    ],
    answer: 0,
    why: [
      `É a convenção padrão de nome de arquivo por versão (dá para mudar com ~defined_in~).`,
      `Versões prerelease são construídas normalmente; só não recebem os refs sem versão.`,
      `As colunas são herdadas do nível do modelo; cada versão declara só as diferenças, com ~include~ e ~exclude~.`,
      `Cada versão é uma relação própria, por padrão com o sufixo ~_v<versão>~.`
    ] },

  'p2-d3-log-db': {
    options: [
      `The warehouse rejected the SQL that dbt sent; rerun with ~--full-refresh~ so that the table is recreated with the new column.`,
      `The warehouse rejected the SQL that dbt sent; find which upstream relation should provide ~order_total~ and fix the ~select~.`,
      `The warehouse rejected the SQL that dbt sent; declare ~order_total~ and its ~data_type~ under ~columns:~ in the model's YAML.`,
      `dbt failed while rendering the model; fix the Jinja on line 12 of ~fct_orders.sql~ and run ~dbt compile~ to confirm it.`
    ],
    answer: 1,
    why: [
      `O diagnóstico está certo, mas recriar a tabela repete a mesma consulta inválida.`,
      `O erro é do banco: a coluna não existe nas relações lidas. O arquivo em ~target/run~ mostra o SQL exato.`,
      `O diagnóstico está certo, mas o YAML de propriedades documenta colunas; ele não as cria na consulta.`,
      `Falha de Jinja aparece como "Compilation Error" do dbt, antes de qualquer consulta. A linha 12 é do SQL compilado.`
    ] },

  /* the stem no longer says which file exists, and no option says "typo" */
  'p2-d3-log-ref': {
    stem: `~dbt run~ stops with the message below. What is the cause and the fix?`,
    options: [
      `The relation ~stg_order~ is missing from the target schema; build it first with ~dbt run --select stg_order~.`,
      `The model ~stg_order~ failed in the previous run; rerun it so that the models that depend on it can compile.`,
      `The model ~stg_order~ isn't declared in any YAML file; add it under ~models:~ so that ~ref()~ can resolve it.`,
      `No enabled model named ~stg_order~ exists in the project; fix the name in the ~ref()~ or enable that model.`
    ],
    answer: 3,
    why: [
      `O erro acontece antes de qualquer consulta; a existência da relação nem chega a ser verificada.`,
      `O dbt descobre os modelos pelos arquivos do projeto, não pelo resultado de execuções anteriores.`,
      `Um modelo existe para o dbt por causa do arquivo ~.sql~; o YAML é opcional.`,
      `O nome dentro do ~ref()~ não corresponde a nenhum modelo ativo: nome errado ou modelo desativado.`
    ] },

  /* every option now talks about two YAML entries, so the message alone doesn't settle it */
  'p2-d3-yaml-dup': {
    options: [
      `One file lists ~stg_orders~ under ~models:~ and the other under ~sources:~; rename the source table.`,
      `Both files have an entry for ~stg_orders~ under ~models:~; move one of the files to another folder.`,
      `One file lists ~stg_orders~ under ~models:~ and the other under ~seeds:~; delete the seed's entry.`,
      `Both files have an entry for ~stg_orders~ under ~models:~; merge them into a single entry.`
    ],
    answer: 3,
    why: [
      `Uma tabela de source é identificada por source e tabela; ela não disputa o nome com um modelo.`,
      `O diagnóstico está certo, mas a pasta não importa: as duas entradas continuariam descrevendo o mesmo modelo.`,
      `Um modelo e um seed com o mesmo nome geram outro erro, sobre dois recursos com o mesmo nome.`,
      `Cada recurso só pode ter uma entrada de propriedades. Junte tudo em uma.`
    ] },

  /* "only build does both" was guessable; now it needs --defer versus --state */
  'p2-d3-fix-build': { lvl: 2,
    stem: `You changed ~int_orders~ on your branch. Your development schema is empty, and the upstream staging models take hours to build. A copy of the production ~manifest.json~ is in ~prod-artifacts/~. Which command builds and tests only ~int_orders~ and its children, reading the untouched parents from production?`,
    options: [
      `~dbt build --select int_orders+ --state prod-artifacts --full-refresh~`,
      `~dbt build --select int_orders+ --defer --state prod-artifacts~`,
      `~dbt build --select +int_orders+ --state prod-artifacts~`,
      `~dbt clone --select int_orders+ --state prod-artifacts~`
    ],
    answer: 1,
    exp: [`~--state~ só informa onde está o manifest de comparação. É o ~--defer~ que faz os ~ref()~ de modelos não selecionados apontarem para as relações de produção.`],
    why: [
      `Sem ~--defer~, os refs continuam apontando para o schema de desenvolvimento, onde os pais não existem.`,
      `Constrói e testa só o que foi selecionado, lendo os pais de produção.`,
      `O ~+~ da frente manda construir os pais no desenvolvimento, que é o que se quer evitar.`,
      `O clone copia as versões de produção desses modelos; ele não executa o SQL alterado.`
    ] },

  /* without the command-line layer, convention alone doesn't answer it */
  'p2-d3-flags-precedence': {
    stem: `The CI environment also sets the environment variable for this same flag to ~buildable~. The job runs ~dbt test --select stg_orders~ with no other options. Which mode does dbt use?`,
    options: [
      `~cautious~, because flags in ~dbt_project.yml~ override environment variables.`,
      `~eager~, because the default applies when two settings disagree with each other.`,
      `None: dbt raises an error when the same flag is set in two different places.`,
      `~buildable~, because environment variables override flags in ~dbt_project.yml~.`
    ],
    answer: 3,
    why: [
      `O ~dbt_project.yml~ é o nível de menor prioridade.`,
      `Não há volta ao padrão: vale a definição de maior prioridade.`,
      `Definir a flag em mais de um lugar é permitido.`,
      `A variável de ambiente vence o projeto; só uma opção na linha de comando venceria as duas.`
    ] },

  /* "severity: error is the opposite of warn" was guessable; here it is already the default and changes nothing */
  'p2-d4-warn-skip': { art: 'yaml',
    stem: `With the config below, ~dbt build~ produced this log. The team wants any duplicated e-mail, even a single one, to stop ~dim_customers~ from being built. Which change does that?`,
    code: [
      { lang: 'yaml', label: 'models/staging/_stg_models.yml', text: `
    models:
      - name: stg_customers
        columns:
          - name: email
            data_tests:
              - unique:
                  config:
                    warn_if: ">10"
                    error_if: ">100"` },
      { lang: 'log', label: 'terminal', text: `
    3 of 6 START test unique_stg_customers_email ................ [RUN]
    3 of 6 WARN 14 unique_stg_customers_email ................... [WARN 14 in 0.84s]
    4 of 6 START sql table model marts.dim_customers ............ [RUN]
    4 of 6 OK created sql table model marts.dim_customers ....... [SUCCESS 1 in 2.10s]` }
    ],
    options: [
      `Set ~severity: error~ in the test's ~config~, next to the two thresholds.`,
      `Change ~warn_if~ to ~"!=0"~, or remove the ~warn_if~ line from the config.`,
      `Change ~error_if~ to ~"!=0"~, or remove the ~error_if~ line from the config.`,
      `Add ~--fail-fast~ to the ~dbt build~ command that the nightly job runs.`
    ],
    answer: 2,
    exp: [`A severidade já é ~error~ por padrão. O teste só avisou porque 14 não passa de 100 (~error_if~) e passa de 10 (~warn_if~). Só um resultado de erro faz o ~dbt build~ pular os nós seguintes.`],
    why: [
      `~error~ já é o padrão, então nada muda: 14 continua abaixo do ~error_if~.`,
      `Isso só faz o teste avisar com qualquer duplicata; aviso não bloqueia nada.`,
      `Com ~error_if~ em ~!=0~ (o padrão), qualquer duplicata vira erro e ~dim_customers~ é pulado.`,
      `~--fail-fast~ para a execução no primeiro erro; um warning não conta.`
    ] },

  'p2-d4-failpoints': {
    options: [
      `The data tests defined on ~int_payments~ are reported as SKIP.`,
      `Models in branches that don't depend on ~int_payments~ still build.`,
      `Models that depend on ~int_payments~ are reported as ERROR as well.`,
      `dbt retries ~int_payments~ once before it reports the node as ERROR.`,
      `Nodes that haven't started yet are cancelled and reported as SKIP.`
    ],
    answers: [0, 1],
    why: [
      `Os testes do modelo dependem dele e são pulados junto.`,
      `Ramos independentes seguem normalmente.`,
      `Os dependentes aparecem como SKIP; ERROR é só o nó que falhou.`,
      `O dbt não repete nós sozinho; para isso existe o ~dbt retry~.`,
      `Parar tudo no primeiro erro é o comportamento de ~--fail-fast~.`
    ] },

  /* the old stem showed the comma that answers the selector fill-in */
  'p2-d5-unit-parents': {
    stem: `In a brand-new CI schema, with no production artifacts available, ~dbt test --select "test_type:unit"~ fails for the unit tests of ~fct_orders~ because ~stg_orders~ and ~stg_payments~ don't exist there. What is the cheapest way to make those unit tests run?`,
    options: [
      `Add ~--defer~ to the command, so that dbt reads the parents from another schema.`,
      `Run ~dbt run --select "stg_orders stg_payments" --empty~ first, to create empty parents.`,
      `Run ~dbt compile --select fct_orders~ first, so that dbt writes the parents' compiled SQL.`,
      `Add ~--indirect-selection empty~ to the command, so that the parents aren't required.`
    ],
    answer: 1,
    why: [
      `Defer precisa de um manifest de outro ambiente em ~--state~, e aqui não há nenhum.`,
      `Cria as relações com o schema certo e zero linhas, quase sem custo.`,
      `Compilar não cria nenhuma relação no warehouse.`,
      `Nesse modo o dbt não roda teste nenhum, então os unitários nem seriam executados.`
    ] },

  /* every option now excludes something that looks like unit tests */
  'p2-d5-workflow-multi': {
    options: [
      `~dbt build --exclude-resource-type unit_test~`,
      `~dbt build --exclude "test_type:unit"~`,
      `~dbt build --exclude "tag:unit_test"~`,
      `~dbt build --exclude unit_test~`,
      `~dbt build --exclude-resource-type test~`
    ],
    answers: [0, 1],
    why: [
      `Exclui o tipo de recurso ~unit_test~ e mantém modelos e data tests.`,
      `Exclui só os testes unitários; modelos e data tests continuam.`,
      `Só funcionaria se cada teste unitário tivesse recebido essa tag.`,
      `Um nome solto procura um nó chamado ~unit_test~; nada é excluído.`,
      `O tipo ~test~ são os data tests: eles sairiam e os unitários ficariam.`
    ] },

  'p2-d6-fresh-yaml': { lvl: 1,
    options: [
      `~payments~: error; ~refunds~: not checked`,
      `~payments~: error; ~refunds~: error`,
      `~payments~: warning; ~refunds~: error`,
      `~payments~: warning; ~refunds~: not checked`
    ],
    answer: 0,
    why: [
      `Erro para ~payments~ e nenhuma checagem para ~refunds~.`,
      `~refunds~ não herda a regra, porque ~freshness: null~ a desliga para essa tabela.`,
      `30 horas passa do limite de erro, e ~refunds~ nem é avaliada.`,
      `30 horas passa do limite de erro (24), não só do de aviso (12).`
    ] }
  };

  /* ── round 2: cues named by the second blind / layperson run ── */
  Object.assign(PATCH, {
  /* distractors no longer lean on "only", "every", "must" */
  'p2-d1-pkg-multi': {
    options: [
      `A package macro is called with the package name as a prefix, as in ~dbt_utils.star(...)~.`,
      `Models of ~core_finance~ can be configured in the root ~dbt_project.yml~, under ~core_finance~.`,
      `Models of ~core_finance~ are left out of ~dbt build~ unless ~package:core_finance~ is selected.`,
      `Packages are downloaded again at the start of ~dbt build~, which makes ~dbt deps~ optional.`,
      `Reading a package model from the root project requires the two-argument ~ref('core_finance', ...)~.`
    ] },
  /* was 1 "fails" against 3 "builds" */
  'p2-d2-contract-mismatch': {
    options: [
      `The model builds, and dbt drops ~loyalty_tier~ so that the table matches the contract.`,
      `The model builds with the new column, and dbt logs a warning about the contract.`,
      `The model fails before the table is built, with an error that lists the mismatch.`,
      `The model fails after the table is built, and dbt rolls back to the previous table.`
    ],
    why: [
      `O dbt não ajusta a consulta ao contrato; ele recusa a construção.`,
      `Quebra de contrato é erro, não aviso.`,
      `A checagem acontece antes da criação da tabela e o erro mostra as colunas divergentes.`,
      `A checagem vem antes da criação; nada chega a ser construído para depois ser desfeito.`
    ] },
  /* the right option was the longest and the only one with two fixes */
  'p2-d3-log-ref': {
    options: [
      `The relation ~stg_order~ is missing from the target schema; build it first with ~dbt run --select stg_order~.`,
      `The model ~stg_order~ failed in the previous run; rerun it so that the models that depend on it can compile.`,
      `The model ~stg_order~ isn't declared in any YAML file; add it under ~models:~ so that ~ref()~ can resolve it.`,
      `No enabled model named ~stg_order~ exists in the project; correct the name inside the ~ref()~ call.`
    ] },
  /* this item explained what --defer does, which answered another question */
  'p2-d7-ci-order': {
    items: [
      `The production job finishes, and its ~manifest.json~ is saved.`,
      `A pull request is opened, and the CI job downloads that manifest into a folder.`,
      `CI runs ~dbt build --select state:modified+ --defer --state <folder>~.`,
      `Modified models and their children are built and tested in the CI schema.`,
      `The checks pass, and the pull request is merged into the main branch.`
    ] },
  /* the stem showed the selector that answers the unit-test exclusion question */
  'p2-d5-unit-parents': {
    stem: `In a brand-new CI schema, with no production artifacts available, ~dbt test --select fct_orders~ fails on the unit tests of ~fct_orders~ because ~stg_orders~ and ~stg_payments~ don't exist there. What is the cheapest way to make those unit tests run?` },
  /* a second option that also acts on the target table */
  'p2-d1-inc-predicates': {
    options: [
      `Tighten the ~where~ inside the ~is_incremental()~ block from 3 days to 1 day.`,
      `Add ~incremental_predicates~ with a condition on ~DBT_INTERNAL_DEST.event_date~.`,
      `Change ~incremental_strategy~ to ~append~, so that no matching step is needed.`,
      `Add ~cluster_by=['event_date']~, so that Snowflake prunes the target table by itself.`
    ],
    why: [
      `Esse ~where~ reduz as linhas de origem, mas o merge continua procurando correspondências no destino inteiro.`,
      `O predicado entra na cláusula do merge e restringe a leitura da tabela de destino.`,
      `Sem a etapa de correspondência não há atualização por ~event_id~: as linhas seriam duplicadas.`,
      `Clusterizar organiza o armazenamento, mas o merge segue sem nenhuma condição sobre ~event_date~ no destino; é o predicado que permite descartar partições.`
    ] },
  /* the sub-selector names were self-explanatory; now it needs the persist_docs rule */
  'p2-d7-state-sub': { lvl: 3,
    stem: `A pull request only rewrites the ~description~ of ~dim_customers~ in its YAML file. The project doesn't enable ~persist_docs~. The CI job runs ~dbt build --select state:modified+ --state prod-artifacts~. What does it build?`,
    options: [
      `Nothing: without ~persist_docs~, a description change doesn't make a model modified.`,
      `~dim_customers~ and its children: any change to a model's YAML makes it modified.`,
      `~dim_customers~ alone: property changes select the model but not its children.`,
      `Every model declared in that YAML file: dbt compares files, not single entries.`
    ],
    answer: 0,
    exp: [`~state:modified~ junta vários critérios: corpo do SQL, configs, relação, macros, contrato e descrições persistidas. Uma descrição só conta quando ~persist_docs~ está ligado, porque só então ela muda algo no warehouse.`],
    why: [
      `É o critério ~state:modified.persisted_descriptions~: vale só com ~persist_docs~.`,
      `Nem toda mudança no YAML conta; descrições só contam com ~persist_docs~.`,
      `O modelo nem chega a ser selecionado, e o ~+~ traria os filhos se fosse.`,
      `A comparação é feita nó a nó, pelo manifest, não por arquivo.`
    ] },
  /* all four options now name a default mode */
  'p2-d5-indirect-domc': {
    options: [
      `In the default ~eager~ mode, the ~relationships~ test runs even though ~fct_orders~ wasn't selected.`,
      `In the default ~cautious~ mode, the ~relationships~ test is left out because ~fct_orders~ wasn't selected.`,
      `In the default ~buildable~ mode, the ~relationships~ test runs because ~fct_orders~ is an ancestor.`,
      `In the default ~empty~ mode, the ~relationships~ test is left out because it has two parents.`
    ],
    why: [
      `Em ~eager~, o padrão, basta um dos pais (~dim_customers~) estar selecionado.`,
      `A descrição de ~cautious~ está certa, mas ele não é o modo padrão.`,
      `~buildable~ não é o padrão, e ~fct_orders~ não é ancestral de ~dim_customers~.`,
      `~empty~ não é o padrão; nesse modo o dbt não roda teste nenhum, seja qual for o número de pais.`
    ] },
  'p2-d2-deprecation': { lvl: 1 }
  });

  /* ── expert review (with docs): one medium and four low flags, plus one claim the docs don't state ── */
  const EXPERT = {
    /* item 4 also fitted microbatch */
    'p2-d1-inc-match': { left: [
      `Immutable click events: rows are only ever added`,
      `One row per ~order_id~; existing orders change status and must be updated in place`,
      `Several rows share the ~unique_key~, and all of them must be replaced together`,
      `BigQuery table partitioned by day, with no ~event_time~ configured; the partitions the query returns replace the existing ones`
    ] },
    /* branching and reproducing could be swapped */
    'p2-d3-fix-order': { items: [
      `Create a branch from the main branch.`,
      `On the new branch, reproduce the error by building the model in your development schema.`,
      `Change the SQL and run ~dbt build --select~ on the model and its children in development.`,
      `Open a pull request and let the CI job build and test the change.`,
      `Merge after the checks pass, so that the next production run uses the fix.`
    ] },
    /* "depends on" could be read as the two listed models only */
    'p2-d6-exposure-select': {
      stem: `Before the Monday refresh of this dashboard, a job must build and test the models the dashboard depends on and all of their upstream models, and nothing else. Which command does that?` },
    /* the + on a grants privilege key is a different, real use */
    'p2-d1-proj-plus': {
      stem: `Which statement about the ~+~ prefix on config names in ~dbt_project.yml~, as in ~+materialized~, is correct?` },
    /* the stem never said the model is downstream of the test */
    'p2-d4-warn-skip': {
      stem: `~dim_customers~ selects from ~stg_customers~. With the config below, ~dbt build~ produced this log. The team wants any duplicated e-mail, even a single one, to stop ~dim_customers~ from being built. Which change does that?` },
    /* the docs confirm the command and the selection are reused, not every flag */
    'p2-d7-retry': {
      options: [
        `It runs ~int_orders~ and ~fct_orders~ again as a ~build~, and it leaves ~stg_orders~ alone.`,
        `It runs ~int_orders~ and ~fct_orders~ as a plain ~run~, because the earlier command isn't kept.`,
        `It runs only ~int_orders~; the skipped node needs a separate ~dbt build~ afterwards.`,
        `It runs all three models again, because ~retry~ repeats the previous command from the start.`
      ],
      exp: [`O ~dbt retry~ lê o ~run_results.json~ da última execução e repete o mesmo comando, com a mesma seleção, só para os nós que deram erro ou foram pulados.`],
      why: [
        `Retoma do ponto de falha com o comando original.`,
        `O retry repete o comando registrado em ~args~ (aqui, ~build~).`,
        `Os nós pulados por causa do erro também entram no retry.`,
        `Nós com sucesso não são refeitos; é essa a vantagem do retry.`
      ] }
  };
  Object.assign(PATCH, Object.fromEntries(Object.entries(EXPERT).map(([id, p]) => [id, Object.assign({}, PATCH[id], p)])));

  window.DBT_Q.forEach(q => {
    const p = PATCH[q.id];
    if (!p) return;
    Object.assign(q, p);
    Object.keys(q).forEach(k => { if (q[k] === undefined) delete q[k]; });
  });
})();
