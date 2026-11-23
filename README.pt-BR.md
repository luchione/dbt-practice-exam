# Simulado dbt Analytics Engineering (não oficial)

[English version](README.md)

Simulado gratuito para a certificação **dbt Analytics Engineering** (dbt Core 1.11). Funciona no navegador, no computador ou no celular, sem cadastro.

**Acesse:** https://luchione.github.io/dbt-practice-exam/pt/

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

A versão em português fica em `src-pt/` e é gerada com:

```
node src/build.js src-pt pt/index.html --public --lang=pt-BR
```

Detalhes da estrutura no [README em inglês](README.md#working-on-the-code).
