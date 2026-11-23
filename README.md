# dbt Analytics Engineering Practice Exam (unofficial)

[Versão em português](README.pt-BR.md)

A free practice exam for the **dbt Analytics Engineering** certification (dbt Core 1.11). It runs in the browser, on desktop or mobile, with no sign-up.

**Open it:** https://luchione.github.io/dbt-practice-exam/ (Portuguese version: https://luchione.github.io/dbt-practice-exam/pt/)

- **370 questions** in the 7 exam formats: multiple choice, multiple answer, DOMC, matching, build list, fill in the blank and hotspot.
- **An explanation for every question**, with a link to the official dbt documentation.
- **Fast study:** one question at a time, graded right away.
- **65-question practice exam** in study mode or exam mode (2-hour timer), following the weight of each domain.
- **Exam 2:** 65 fixed questions, harder than the official exam.
- **History** of every practice exam, with a question-by-question review.

Your progress is saved only in your browser. Nothing is sent to any server.

## Disclaimer

This is an independent project, not affiliated with dbt Labs. The questions are original, written with AI assistance (Claude) from the [official study guide](https://www.getdbt.com/certifications) and the [dbt documentation](https://docs.getdbt.com/). None of them reproduces exam questions.

There may be mistakes. When in doubt, the documentation wins. Found an error? Open an issue with the question text and the documentation link.

## Working on the code

| Folder | Contents |
|---|---|
| `src/` | English version: questions (`q-*.js`, `p2-*.js`), `app.js`, `head.html` and `build.js` |
| `src-pt/` | Portuguese version, same files except `build.js` |

The question stems and options are the same in both languages; only the explanations and the interface differ. Build the pages with:

```
node src/build.js src index.html --public
node src/build.js src-pt pt/index.html --public --lang=pt-BR
```
