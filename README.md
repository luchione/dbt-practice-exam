# Simulado dbt Analytics Engineering (não oficial)

Simulado gratuito para a certificação **dbt Analytics Engineering** (dbt Core 1.11). Funciona no navegador, no computador ou no celular, sem cadastro.

- **370 questões** nos 7 formatos da prova: múltipla escolha, múltipla resposta, DOMC, associação, ordenação, preenchimento e hotspot.
- **Enunciados em inglês**, como na prova. **Explicações em português**, com o link da documentação oficial.
- **Fast study:** uma questão por vez, com correção na hora.
- **Simulado de 65 questões** em modo estudo ou modo prova (2 horas), respeitando o peso de cada domínio.
- **Prova 2:** 65 questões fixas, mais difíceis que a prova oficial.
- **Histórico** de todos os simulados, com revisão de cada questão.

O progresso fica salvo só no seu navegador. Nada é enviado para servidor nenhum.

## Aviso

Projeto independente, sem vínculo com a dbt Labs. As questões são autorais, criadas com apoio de IA (Claude) a partir do [guia de estudo oficial](https://www.getdbt.com/certifications) e da [documentação do dbt](https://docs.getdbt.com/). Nenhuma reproduz questões da prova.

Pode haver erros. Em caso de dúvida, vale o que a documentação diz. Achou um erro? Abra uma issue com o texto da questão e o link da documentação.

## Para quem quer mexer no código

As questões ficam em `src/` (`q-*.js` e `p2-*.js`). O `index.html` é gerado com:

```
node src/build.js src index.html --public
```

Sem `--public`, sai a versão pessoal, que sincroniza o histórico com a conta do Claude quando aberta como artefato no claude.ai.
