---
layout: post
title: Otimizando o uso de Expressões Regulares (Regex)
author: Eduardo Stein Brito
author-info:
  name: Eduardo Stein Brito
  image: eduardo-brito.jpg
  description: Engineering Manager, com foco em desenvolvimento Backend. Engenheiro de Computação pela Universidade Federal do Rio Grande do Sul.
  linkedin: esbrito
date: 2021-05-17 09:36:00 -0300
---


Como descrito em nossos [Pilares Técnicos](https://engineering.axur.com/2020/07/08/pilares-tecnicos.html), nosso objetivo como time de Engineering da Axur é construir a tecnologia que permite a nossos produtos tornarem a internet mais segura. Para tal, existem etapas essenciais para prover maior segurança na Web, como o monitoramento e a inspeção de conteúdo na internet. É dessa forma que identificamos possíveis ameaças aos nossos clientes. Este artigo aborda [expressões regulares](https://pt.wikipedia.org/wiki/Express%C3%A3o_regular) (_regex_, do inglês _Regular Expressions_), uma entre tantas ferramentas que utilizamos para o combate a riscos digitais.

De mecanismos simples como comparação de _strings_ até recursos mais complexos como o uso de [_Machine Learning_](https://blog.axur.com/pt/como-a-axur-usa-machine-learning-para-encontrar-phishings), existe uma variedade de tecnologias e conhecimentos técnicos aplicados para processar a enorme quantidade de dados que coletamos na internet — tudo isso em tempo hábil e com custo computacional apropriado. Entre essas tecnologias, o uso de expressões regulares destaca-se como um forte aliado para executarmos buscas flexíveis em conteúdos diversos. Todavia, o emprego inapropriado de _regex_ gera gargalos de processamentos, principalmente em um cenário de alto _throughput_ de dados.

Aqui, discutiremos diferentes aspectos da utilização de expressões regulares, com _benchmarks_, otimizações e comparativos de resultados. Não será abordada a sintaxe das expressões. Este artigo também não tem o objetivo ser um manual exaustivo de todas as otimizações possíveis, e sim, mostrar alguns pontos importantes ao se trabalhar com _regex_.

## Compile uma única vez

Linguagens de programação geralmente possuem suporte _built-in_ ao uso de _regex_. Esse uso pode ser classificado em duas etapas principais: compilação e _matching_.

Na compilação, a expressão é transformada em uma sequência de instruções internas que serão usadas por um motor de correspondência (_regex/matching engine_). Para o _matching,_ um determinado conjunto de caracteres é comparado com esse padrão compilado para verificar equivalência. Em Python, por exemplo, [o motor desenvolvido em C interpreta _bytecodes_ gerados](https://docs.python.org/3/howto/regex.html).

Aqui temos exemplos em diferentes linguagens de programação do uso da compilação e _matching_. Neste caso, o código busca a palavra &quot;internet&quot; na frase _&quot;a Axur torna a internet mais segura&quot;_.



<details>
 <summary>Código Java</summary>


<a href="https://replit.com/@EduardoBrito5/Match-Simples-Java" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight java %}
[...]
final Pattern pattern = Pattern.compile(".*internet.*");
final Matcher matcher = pattern.matcher("a Axur torna a internet mais segura");
boolean hasMatched = matcher.find(); // uso do “find” para que seja procurada uma substring
System.out.println("has matched: " + hasMatched);
[...]
{% endhighlight %}


</details>
<br/> 

<details>
 <summary>Código Python</summary>
<a href="https://replit.com/@EduardoBrito5/Match-Simples-Python" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight python %}
import re

pattern = re.compile('.*internet.*')
has_matched = pattern.match('a Axur torna a internet mais segura')

print("has matched:", bool(has_matched))
{% endhighlight %}


</details>
<br/> 




Dependendo da linguagem de programação, existem outros meios de verificar a palavra na frase com outras sintaxes, objetos, funções, classes e métodos. Todavia, o ponto é que, devido ao custo computacional da compilação da _regex_, deve-se evitar a necessidade de recompilá-la toda vez que há uma verificação de _matching_. Para demonstrar os efeitos da compilação, veja o código a seguir:


<details>
 <summary>Código Java</summary>


<a href="https://replit.com/@EduardoBrito5/Compilacao-Codigo-Java" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight java %}
[...]
final List<String> allRegex = generateRegexes(keywords);

final String[] contents = {"a axur torna a internet mais segura",
        "Detecte e remova fraudes digitais da internet automaticamente",
        "Takedown proativo e transparente"};

long totalTimeInMsForMethod1 = 0;
long totalTimeInMsForMethod2 = 0;

System.out.println("Processing... it may take a while...");
for (int i = 0; i < TOTAL_CHECKS; i++) {
    String content = randomContentFrom(contents);
    for (String regex: allRegex) {
        totalTimeInMsForMethod1 += alwaysCompilingMethod(regex, content);
        totalTimeInMsForMethod2 += cachedPatternCompilingMethod(regex, content);
    }
}
System.out.println("Average time (ms) for Method 1: " + totalTimeInMsForMethod1/ TOTAL_CHECKS.floatValue());
System.out.println("Total time (seconds) for Method 1: " + totalTimeInMsForMethod1/MILLIS_IN_SECONDS);

System.out.println("Average time (ms) for Method 2: " + totalTimeInMsForMethod2/ TOTAL_CHECKS.floatValue());
System.out.println("Total time (seconds) for Method 2: " + totalTimeInMsForMethod2/MILLIS_IN_SECONDS);
[...]

[...]
private static long alwaysCompilingMethod(String regex, String content) {
    long startTime = System.currentTimeMillis();
    Pattern pattern = Pattern.compile(regex);
    Matcher matcher = pattern.matcher(content);
    sinkHole = matcher.find();
    long endTime = System.currentTimeMillis();
    return endTime - startTime;
}

private static long cachedPatternCompilingMethod(String regex, String content) {
    long startTime = System.currentTimeMillis();
    Matcher matcher = matcherFromCache(regex, content);
    sinkHole = matcher.find();
    long endTime = System.currentTimeMillis();
    return endTime - startTime;
}

private static Matcher matcherFromCache(String regex, String content) {
    if (cachedPatterns.containsKey(regex)) {
        return cachedPatterns.get(regex).matcher(content);
    } else {
        Pattern pattern = Pattern.compile(regex);
        cachedPatterns.put(regex, pattern);
        return pattern.matcher(content);
    }
}
[...]
{% endhighlight %}


</details>
<br/> 

Este código gera 10.000 expressões regulares combinando palavras-chave (_keywords_). Então, são verificados se os padrões das expressões têm correspondência com 1.000 conteúdos randômicos. A ideia deste algoritmo é simular uma ampla gama de conteúdos diferentes testados com uma grande variedade de _regexes_ para _matching_.

Para o _benchmark_ são usados dois métodos distintos: um que compila a _regex_ em toda verificação de _match_ da expressão com o conteúdo (método 1) e outro que compila uma única vez e salva em memória o padrão compilado para reuso (método 2). Ou seja, o segundo método usa um mecanismo simples de _cache_. O resultado da execução do código é o seguinte:


{% highlight text %}
Average time (ms) for Method 1: 40.592
Total time (seconds) for Method 1: 40
Average time (ms) for Method 2: 24.546
Total time (seconds) for Method 2: 24
{% endhighlight %}


Cada execução pode gerar resultados diferentes de acordo com o ambiente utilizado. Entretanto, independentemente disso, existe diferença significativa entre os métodos. Nesse ambiente, com uso de _caching_, a velocidade de processamento foi 66% maior.

**Fique atento!** De acordo com a linguagem utilizada, este mecanismo pode estar embutido de alguma forma. Em Python, a operação de _compiling_ usa _cache_ em memória. O trecho a seguir foi retirado da _Python Standard Library_, mais especificamente do arquivo &quot;re.py&quot;:


<details>
 <summary>Código do re.py</summary>

<p>

{% highlight python %}
_MAXCACHE = 512
def _compile(pattern, flags):
    # internal: compile pattern
    if isinstance(flags, RegexFlag):
        flags = flags.value
    try:
        return _cache[type(pattern), pattern, flags]
    except KeyError:
        pass
    if isinstance(pattern, Pattern):
        if flags:
            raise ValueError(
                "cannot process flags argument with a compiled pattern")
        return pattern
    if not sre_compile.isstring(pattern):
        raise TypeError("first argument must be string or compiled pattern")
    p = sre_compile.compile(pattern, flags)
    if not (flags & DEBUG):
        if len(_cache) >= _MAXCACHE:
            # Drop the oldest item
            try:
                del _cache[next(iter(_cache))]
            except (StopIteration, RuntimeError, KeyError):
                pass
        _cache[type(pattern), pattern, flags] = p
    return p
{% endhighlight %}

</p>

</details>
<br/> 

É importante lembrar: **há um _trade-off_ entre velocidade de processamento e uso de memória** , pois a _cache_ irá gastar invariavelmente mais recursos de memória.

## Tamanho do conteúdo e complexidade das expressões

A velocidade de processamento de _matching_ de uma _regex_ depende de ao menos dois fatores: complexidade da expressão e tamanho do conteúdo em que é feita a busca do padrão da expressão. Para demonstrar o impacto dessas duas variáveis, temos o seguinte _benchmark_.


<details>
 <summary>Código Java</summary>


<a href="https://replit.com/@EduardoBrito5/Tamanho-de-Conteudo-e-Complexidade" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight java %}
[...]
String smallContent = generateContentWithNKeywords(keywords, 10);
String mediumContent = generateContentWithNKeywords(keywords, 100);
String bigContent = generateContentWithNKeywords(keywords, 10000);
String giantContent = generateContentWithNKeywords(keywords, 100000);

System.out.println("For simple regex, increasing content size....");
testMatching(smallContent, simpleRegex);
testMatching(mediumContent, simpleRegex);
testMatching(bigContent, simpleRegex);
testMatching(giantContent, simpleRegex);

System.out.println("For complex regex, increasing content size....");
testMatching(smallContent, complexRegex);
testMatching(mediumContent, complexRegex);
testMatching(bigContent, complexRegex);
testMatching(giantContent, complexRegex);
[...]
{% endhighlight %}


</details>
<br/> 


Os resultados da execução do código foram os seguintes:

{% highlight text %}
For simple regex, increasing content size....
Took 2 ms
Took 1 ms
Took 94 ms
Took 53 ms
For complex regex, increasing content size....
Took 2 ms
Took 4 ms
Took 112 ms
Took 323 ms
{% endhighlight %}

<sub><sup>\* os resultados variam a cada execução, mas eles mantêm sempre a notável diferença entre os tempos para as diferentes combinações de _regexes_ e conteúdos.
</sup></sub>

Pelos resultados, há impacto significativo de ambas as variáveis. Para dois conteúdos idênticos, com uma _regex_ mais complexa entre um conteúdo e outro, o tempo aumentou em mais de 6 vezes. Já para duas _regexes_ idênticas o tempo cresceu em mais de 160 vezes, com o aumento do conteúdo entre uma comparação e outra.

Assim, fica clara a importância de verificar a complexidade da expressão. Ademais, é interessante identificar se o conteúdo pode ser reduzido antes da comparação. Por exemplo, se for desejado buscar algum texto em página Web pode ser que faça sentido aplicar a _regex_ apenas no texto visível e não em todo o HTML da página.

## Otimização nas expressões

Um ponto importante é entender como funcionam _regexes_ e suas sintaxes na linguagem de programação escolhida pelo desenvolvedor. O mau uso da sintaxe pode gerar duas expressões regulares equivalentes em _matching_ de padrões, mas com desempenhos completamente distintos. Isso pode ser facilmente verificado no _benchmark_ abaixo:


<details>
 <summary>Código Java</summary>


<a href="https://replit.com/@EduardoBrito5/Otimizacao-de-Expressao-Java" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight java %}
[...]
Pattern notOptimizedPattern = Pattern.compile(
        ".?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?" +
        "(m.?e.?u.?s.?i.?t.?e.?|site|meusite|minhapagina|teste|website|internet|p[aá]gina|" +
        "(my).?site|sitenovo)");

Pattern optimizedSamePattern = Pattern.compile(".{0,21}" +
        "(m.?e.?u.?s.?i.?t.?e.?|site|meusite|minhapagina|teste|website|internet|p[aá]gina|" +
        "(my).?site|sitenovo)");

String contentThatDoesNotMatch = "uma string com mais de vinte um caracteres no inicio fazendo que o match não ocorra";
String contentThatMatches = "uma string qualquer sitenovo";


System.out.println("For NOT optimized regex...");
testMatching(contentThatDoesNotMatch, notOptimizedPattern);
testMatching(contentThatMatches, notOptimizedPattern);

System.out.println("For optimized regex...");
testMatching(contentThatDoesNotMatch, optimizedSamePattern);
testMatching(contentThatMatches, optimizedSamePattern);
[...]
{% endhighlight %}


</details>
<br/> 


O resultado, em tempo para processamento, é **absurdamente diferente** :

{% highlight text %}
For NOT optimized regex...
Took 36796 ms - Result:false
Took 1 ms - Result:true
For optimized regex...
Took 1 ms - Result:false
Took 0 ms - Result:true
{% endhighlight %}


A otimização teve êxito: as expressões são equivalentes em _matching_ de conteúdos e o tempo de processamento foi reduzido drasticamente em um dos casos. Com apenas a substituição das sequências de `.?` pelo uso de quantificadores `{n,m}`, notou-se aumento na velocidade de processamento em **dezenas de milhares de vezes**.

**Por que isso ocorre?** Java utiliza [autômatos finitos não determinísticos](https://en.wikipedia.org/wiki/Nondeterministic_finite_automaton) — como pode ser visto [aqui](https://docs.oracle.com/en/java/javase/14/docs/api/java.base/java/util/regex/Pattern.html#:~:text=The%20Pattern%20engine%20performs%20traditional%20NFA-based%20matching%20with%20ordered%20alternation%20as%20occurs%20in%20Perl%205) — para resolver as expressões. O algoritmo usa o mecanismo de [_backtracking_](https://en.wikipedia.org/wiki/Backtracking), testa todas as expansões da expressão regular e aceita a primeira correspondência encontrada. Por conta das sequências de `.?`, existe uma explosão de caminhos que devem ser verificados, prejudicando o desempenho.

Em outras implementações algorítmicas esses resultados podem ser bem diferentes. Por este motivo, é importante conhecer a implementação utilizada e realizar validações nas _regexes_ criadas. Para o uso da _regex_ padrão do Java, o impacto da não otimização da _regex_ é enorme e pode gerar gargalos significativos em um sistema. No código equivalente em Python também há diferença nos tempos de processamento entre as expressões, porém o tempo total de execução da aplicação foi muito menor que em Java. Isso não é um problema da linguagem, apenas que **neste cenário** , o _matching engine_ do Java foi menos eficiente que o motor usado por Python.


<details>
 <summary>Código Python</summary>


<a href="https://replit.com/@EduardoBrito5/Otimizacao-de-Expressao-Python" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight python %}
[...]
not_optimized = re.compile(
    ".?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?.?" +
    "(m.?e.?u.?s.?i.?t.?e.?|site|meusite|minhapagina|teste|website|internet|p[aá]gina|"
    + "(my).?site|sitenovo)")
optimized = re.compile(
    ".{0,21}(m.?e.?u.?s.?i.?t.?e.?|site|meusite|minhapagina|teste|website|internet|p[aá]gina|"
    + "(my).?site|sitenovo)")

content_that_does_not_match = "uma string com mais de vinte um caracteres no inicio fazendo que o match não ocorra"
content_that_matches = "uma string qualquer sitenovo"
print("For NOT optimized regex...")
test_matching(content_that_does_not_match, not_optimized)
test_matching(content_that_matches, not_optimized)

print("For optimized regex...")
test_matching(content_that_does_not_match, optimized)
test_matching(content_that_matches, optimized)
[...]
{% endhighlight %}


</details>
<br/> 

{% highlight text %}
For NOT optimized regex...
Took 503.0701160430908 ms - Result: False
Took 0.0059604644775390625 ms - Result: True
For optimized regex...
Took 0.004291534423828125 ms - Result: False
Took 0.0016689300537109375 ms - Result: True
{% endhighlight %}


## Só use se necessário

Sempre verifique se a utilização da expressão regular faz sentido em determinado contexto. Muitas vezes podemos substituí-la por outros recursos da linguagem que melhoram o desempenho do código e o tornam mais legível. Vejamos o exemplo a seguir:


<details>
 <summary>Código Java</summary>


<a href="https://replit.com/@EduardoBrito5/Regex-e-StartsWith-Java" target="_blank">Se deseja ver o código completo e/ou executar o código em seu browser clique aqui</a>

{% highlight java %}
[...]
final String[] names = {
        "João da Silva", "Eduardo dos Santos", "Maria Joana", "Carlos de Jesus"
};
Pattern regex = Pattern.compile("^João .*");

System.out.println("With regex...");
for (String name: names) {
    checkFirstNameWithRegex(name, regex);
}

System.out.println("Without regex...");
for (String name: names) {
    checkFirstNameWithStartsWith(name);
}
[...]

[...]
private static void checkFirstNameWithStartsWith(String name) {
    long startTime = System.nanoTime();
    boolean hasMatched = name.startsWith("João ");
    System.out.println("Took " + (System.nanoTime() - startTime) + " ms - Matched: " + hasMatched);
}

private static void checkFirstNameWithRegex(String name, Pattern regex) {
    long startTime = System.nanoTime();
    boolean hasMatched = regex.matcher(name).matches();
    System.out.println("Took " + (System.nanoTime() - startTime) + " ms - Matched: " + hasMatched);
}
[...]

{% endhighlight %}


</details>
<br/> 

Neste código, procura-se o primeiro nome &quot;João&quot; em uma lista de nomes. O resultado apresenta variações de desempenho entre os conteúdos. Houve melhor desempenho no uso do método `startsWith` em vez de _regex_ no teste realizado.


{% highlight text %}
With regex...
Took 410914 ns - Matched: true
Took 13858 ns - Matched: false
Took 7386 ns - Matched: false
Took 6795 ns - Matched: false
Without regex...
Took 10815 ns - Matched: true
Took 2538 ns - Matched: false
Took 1745 ns - Matched: false
Took 1529 ns - Matched: false
{% endhighlight %}

A performance _pode_ ser irrelevante para um cenário simples como esse. Entretanto, o método `startsWith` também deixa mais clara a intenção do código que a expressão regular. Isso deve ser considerado na solução, afinal, [_um código é muito mais lido que escrito_](https://www.goodreads.com/quotes/835238-indeed-the-ratio-of-time-spent-reading-versus-writing-is).

## Conclusão

Neste artigo mostramos testes que comprovam o impacto da compilação e sintaxe das expressões. Também ficam claros os efeitos das otimizações realizadas e a diferença entre abordagens com e sem _regex_. Demonstramos aqui a importância de testar e validar diferentes expressões, entender o contexto de aplicação da ferramenta e como algumas otimizações ajudam na construção de programas melhores. Em sistemas que processam grandes volumes de dados, esses cuidados podem fazer a diferença para garantir um bom desempenho e evitar gargalos.


