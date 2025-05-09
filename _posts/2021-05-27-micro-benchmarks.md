---
layout: post
title: Micro-benchmarks em Java
lang: pt
author: Jose Ferreira
author-info:
  name: Jose Ferreira
  image: jose-ferreira.jpg
  description: Back-end Developer na Axur, e escovador de bits nas horas vagas. Graduado em Ciência da Computação pela
               Universidade Federal do Rio Grande do Sul.
  linkedin: jose-ferreira-3000
date: 2021-05-27 10:13:00 -0300
---

Durante a participação em um projeto, o engenheiro de _software_ pode ter que passar pelo processo de escolha
de uma determinada biblioteca, _framework_ ou componente dentre uma gama de possibilidades, baseado no
desempenho do componente. Pode ser necessário escolher qual a biblioteca de serialização de JSONs mais
rápida, qual a biblioteca de processamento de expressões regulares mais rápida, e assim por diante. Geralmente,
será possível encontrar na Internet _benchmarks_ prontos e de qualidade para os tópicos mais quentes do mundo da
programação, contudo, para casos particulares, pode ser necessário que o próprio engenheiro tenha que executar
seus _benchmarks_ para ajudar no processo de decisão. Neste artigo, abordaremos alguns aspectos do processo de
criação/execução de _micro-benchmark_ em Java para o caso em que seja necessária a criação rápida de _benchmarks_.


# O que é um _micro-benchmark_?

Um _micro-benchmark_ é um _benchmark_ rápido e leve, com o objetivo de testar rapidamente alguma ideia ou
conceito no código, podendo inclusive ser descartado após a obtenção dos resultados. Em geral, o enfoque
do _micro-benchmark_ é a comparação entre duas ou mais opções. Isso o diferencia do _profiling_, que é a análise
do desempenho de um código com objetivo de otimização, incluindo possivelmente a análise de frequência e
duração das chamadas de métodos.

Um exemplo de _micro-benchmark_ pode ser um _benchmark_ que mostra qual componente é mais rápido em gerar
um número aleatório, comparando entre `java.util.Random` e `java.util.SplittableRandom`. É um _benchmark_
rápido que pode guiar as decisões de desenvolvimento de um componente mais complexo, e também é um assunto
que não é tão quente e pode não haver um _benchmark_ pronto na Internet.


# Anatomia de um _micro-benchmark_

O _micro-benchmark_ mais simples é composto de um trecho de código a ser testado, e de uma rotina que chama
esse código cronometrando o tempo que o código testado leva para rodar. Contudo, os
_benchmarks_ mais úteis são aqueles que comparam diversas abordagens de forma a auxiliar em uma tomada de
decisão. Assim, o _micro-benchmark_ mais comum possui dois ou mais trechos de código a serem testados,
sendo um deles considerado o código padrão (chamado _baseline_) e as outras opções sendo variações ou opções
do mesmo código a fim de provar alguma hipótese ou conceito.

{% highlight java %}
private static void microBenchmarkRandomNextInt() {
   long startTime = System.currentTimeMillis();
   int result = new Random().nextInt();
   long stopTime = System.currentTimeMillis();
   System.out.printf("Duration: %d%n", stopTime - startTime);
}
{% endhighlight %}

O trecho de código acima é um exemplo de _micro-benchmark_ bem simples que serve para cronometrar o tempo
necessário para `Random` retornar um número inteiro aleatório de 32 bits. Contudo, o trecho de código também
é um exemplo de um _micro-benchmark_ de baixa qualidade, e veremos o motivo a seguir.


# Armadilhas em _micro-benchmarks_ em Java

A máquina virtual Java (JVM) é muito boa em otimização de código, incluindo o uso do compilador _Just-In-Time_ (JIT)
para geração de código de máquina a fim de acelerar os caminhos críticos de execução de código.
Além disso, a JVM também é muito boa em
esconder os detalhes de otimização de forma que os desenvolvedores não precisem se preocupar em
micro-gerenciamento dos pormenores de otimização. Contudo, esse gerenciamento de otimização pode ser
relevante para _benchmarks_, pois a natureza sintética do _benchmark_ pode induzir a máquina virtual
a fazer otimizações inesperadas ou indesejáveis. A seguir, vamos enumerar algumas situações que podem gerar
um comportamento inesperado em _micro-benchmarks_.


**Remoção de variáveis e resultados que nunca são lidos**

A JVM possui uma implementação bem madura para detectar código inútil ou nunca utilizado,
e isso também vale para variáveis que são gravadas e nunca são lidas.
Nesse caso, a atribuição é um candidato a ser eliminado do caminho de execução.
Caso a atribuição tenha efeitos colaterais, por exemplo a chamada de uma rotina, o otimizador pode desmembrar
os efeitos colaterais e descartar a parte não usada pelo retorno da rotina. O código a seguir é um exemplo em
que a atribuição da variável `result` pode ser suprimida pois a variável nunca é lida.

{% highlight java %}
private static void microBenchmarkRandom() {
   long startTime = System.currentTimeMillis();
   int result = new Random().nextInt();
   long stopTime = System.currentTimeMillis();
   System.out.printf("Duration: %d%n", stopTime - startTime);
}
{% endhighlight %}


**Necessidade de aquecimento do JIT**

Em geral, a JVM executa o _bytecode_ Java através de interpretação do _bytecode_, que é um processo muito mais
lento do que a execução de código de máquina. Contudo, a JVM também possui disponível um compilador JIT para
geração de código de máquina em tempo de execução. Apesar disso, nem todo código é transformado em
código de máquina, pois a geração de código de máquina é um processo custoso e que consome recursos
computacionais importantes. Em face disso, o otimizador analisa o perfil de execução de trechos de código
e escolhe, em tempo de execução, os códigos executados com maior frequência como candidatos para execução
através do JIT. Dessa forma, o código de um _micro-benchmark_ precisa ser executado dezenas ou centenas de
vezes a fim de garantir que o otimizador prepare o código para ser executado através de JIT. As primeiras
execuções também precisam ser descartadas, pois representam a execução do código de maneira interpretada, e
podem causar um desvio estatístico nos tempos calculados.


**Remoção de gravações intermediárias para uma mesma variável**

Caso uma variável seja gravada diversas vezes, o otimizador pode suprimir as diversas gravações e manter
somente a última atribuição. Caso o valor da última atribuição dependa das gravações intermediárias, por
exemplo em um laço, o otimizador ainda pode tentar algumas otimizações para suprimir o laço, incluindo
calcular o valor final a frente e manter apenas a última atribuição, eliminando completamente o laço.
Este ponto é especialmente importante no caso de _micro-benchmarks_ executados em um laço - que é um caso
comum em vista da necessidade de aquecimento do JIT.


**Granularidade da base de tempo**

Às vezes, pode ser necessário fazer o _benchmark_ de um código que executa muito rápido, por exemplo
a comparação entre o acesso a um vetor usando `MethodHandle` e `VarHandle`, cujo tempo de execução é da ordem
de nanosegundos. Para casos assim, existe a dificuldade de obter uma base de tempo precisa e da ordem de
nanosegundos, pois as bases de tempo mais comuns disponíveis para o desenvolvedor possuem uma granularidade
da ordem de alguns milissegundos. Além disso, para marcações de tempo menores do que 1 milissegundo,
existe a possibilidade de que os testes possam conter ruído das imprecisões causadas pelo próprio sistema
operacional, como trocas de contexto e interrupções de _hardware_.

Para contornar este problema, a saída mais comum é executar o código em teste diversas vezes, acumulando
o tempo total de execução e depois calculando o tempo médio de cada execução. Dessa forma, o ruído da
imprecisão presente em algumas execuções estará diluído entre todas as centenas ou milhares de execuções.


**Execução do _Garbage-Collector_**

O _garbage-collector_ pode ser executado pela JVM a qualquer momento, incluindo durante a execução do
_micro-benchmark_, provocando pausas na execução e outros efeitos que podem causar divergências nos resultados.
A execução (ou não execução) do _garbage-collector_ é um elemento da JVM que não é fácil de ser controlado pelo
desenvolvedor, e por isso mesmo é um ponto relevante a ser levado em conta na construção do código de teste.
A maneira mais fácil para tentar aliviar os efeitos das execuções do _garbage-collector_ é evitar grandes
alocações de memória, bem como executar o teste centenas ou milhares de vezes a fim de distribuir o desvio
estatístico causado por ele.


# Como criar um _micro-benchmark_ de qualidade?

Conhecendo algumas das principais armadilhas para a construção de um _benchmark_, podemos enumerar os
principais pontos necessários para a construção de um bom código de teste:

 - Evitar a eliminação de código, armazenando e/ou usando os valores retornados pelos códigos em teste em
   variáveis públicas e/ou voláteis. A semântica do modificador `volatile` do Java pode ajudar a impedir
   que atribuições sejam eliminadas pelo otimizador, já que informa ao otimizador que a variável pode ser
   lida/gravada a qualquer momento por outras _threads_.
 - Executar o código muitas vezes antes da execução cronometrada do teste, a fim de aquecer o JIT, de forma que
   o _bytecode_ seja transformado em código de máquina.
 - Executar o código muitas vezes a fim de diluir ruídos na marcação de tempo que podem ocorrer por causa de
   fatores externos (sistema operacional, _hardware_), fatores internos (execução do _garbage-collector_,
   execução do otimizador JIT) ou granularidade da base de tempo.

Certamente, um código de teste pode ser construído levando em consideração todos esses requisitos sem
muita dificuldade. A seguir é mostrado um código de _micro-benchmark_ que mostra o tempo de execução médio
para uma construção do tipo `variable = random.nextInt();`.

{% highlight java %}
public class SelfMadeMicroBenchmarkRandomNextInt {

   public static volatile int sinkHole;

   public static void main(String[] args) {
      executeBenchmark();
   }

   private static void executeBenchmark() {
      int maxCount = 100000000;
      Random random = new Random();
      for (int pass = 0; pass < 8; pass++) {
         long startTime = System.currentTimeMillis();
         for (int count = 0; count < maxCount; count++) {
            sinkHole = random.nextInt();
         }
         long stopTime = System.currentTimeMillis();
         double averageTime = (stopTime - startTime) * 1000000.0 / maxCount;
         System.out.printf("PASS %d: average %.2f ns%n", pass, averageTime);
      }
   }
}
{% endhighlight %}

Ao executar o código, a saída obtida é a seguinte:

{% highlight text %}
PASS 0: average 10.94 ns
PASS 1: average 12.97 ns
PASS 2: average 13.06 ns
PASS 3: average 12.97 ns
PASS 4: average 12.95 ns
PASS 5: average 12.93 ns
PASS 6: average 12.95 ns
PASS 7: average 12.93 ns
{% endhighlight %}

Como podemos ver acima, o primeiro passe possui um certo nível de ruído inserido, inclusive mostrando um
valor menor do que a média dos valores seguintes. De qualquer forma, o código é muito simples e não mostra
atributos estatísticos da amostragem, por exemplo o desvio padrão e erro médio, que poderiam ser dados
interessantes a serem mostrados dependendo da natureza do teste.


# Usando JMH para escrever _micro-benchmarks_ de qualidade

O _Java Microbenchmark Harness_ (JMH) é um _framework_ para criação rápida de _micro-benchmarks_ em Java,
sendo que podemos destacar como principais vantagens a facilidade de escrita do teste,
e a abstração dos principais problemas de otimização ocultos pela JVM.

Para usar o JMH é bem simples, primeiramente acrescentando as seguintes dependências no arquivo POM do projeto Java:

{% highlight xml %}
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-core</artifactId>
    <version>1.31</version>
</dependency>
<dependency>
    <groupId>org.openjdk.jmh</groupId>
    <artifactId>jmh-generator-annprocess</artifactId>
    <version>1.31</version>
</dependency>
{% endhighlight %}

Em seguida, basta marcar os métodos de teste com `@Benchmark`, e, para rodar o _micro-benchmark_, pode ser
usado um método `main` conforme o exemplo abaixo:

{% highlight java %}
public class JmhRegexExample {

   private static final String REGEX = "(alfa|bravo|charlie|delta|echo)";
   private static final String CONTENT =
      "abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij";
   private static final Pattern PATTERN = Pattern.compile(REGEX);

   @Benchmark
   public boolean notPreCompiledRegex() {
      return Pattern.compile(REGEX).matcher(CONTENT).find();
   }

   @Benchmark
   public boolean preCompiledRegex() {
      return PATTERN.matcher(CONTENT).find();
   }

   public static void main(String[] args) throws IOException {
      org.openjdk.jmh.Main.main(args);
   }
}
{% endhighlight %}

Ao rodar o método `main` da classe `JmhRegexExample`, o componente JMH executa o _benchmark_ para os dois
métodos marcados com `@Benchmark`, exibindo os resultados ao final. Para o exemplo, estamos verificando a
diferença de desempenho entre usar uma _regex_ pré-compilada e compilar a _regex_ a cada teste.

Quem está acostumado com JUnit deve ter notado que os métodos de _benchmark_ não estão com retorno
do tipo `void`. Esta é uma das várias _features_ do JMH, e neste caso auxilia o otimizador para que não
simplifique a execução do processamento para o valor de retorno não usado visto anteriormente na seção
“Remoção de variáveis e resultados que nunca são lidos”.

Após mais de 18 minutos de processamento do _benchmark_, os resultados obtidos foram os seguintes:

{% highlight text %}
# Run complete. Total time: 00:18:23
Benchmark                             Mode  Cnt       Score       Error  Units
JmhRegexExample.notPreCompiledRegex  thrpt   25  560290,156 ± 26009,161  ops/s
JmhRegexExample.preCompiledRegex     thrpt   25  694972,423 ±  4512,448  ops/s
{% endhighlight %}

Basicamente, os resultados mostram que o uso da _regex_ pré-compilada é quase 24% mais rápido
(_score_ de 694.972 ops/s) do que a abordagem de compilar a _regex_ a cada uso (_score_ de 560.290 ops/s),
para os casos do exemplo.

Um ponto de atenção é que a configuração padrão para os testes pode demorar um tempo significativo, pois
está ajustada para executar muitas repetições. Na versão 1.31 usada no exemplo, a
configuração padrão está ajustada para executar 5 _warmups_ e 5 _iterations_ de 10 segundos por teste, com
5 repetições (_forks_) para cada teste. Para ajustar os tempos e número de repetições, podem ser usadas as
anotações `@Warmup`, `@Measurement` e `@Fork`, conforme os exemplos abaixo:

 - **`@Warmup(iterations = 5, time = 3000, timeUnit = TimeUnit.MILLISECONDS)`**: antes de cada teste, o
   JMH vai executar 5 _warmups_ (campo _iterations_), ou seja, executar o _benchmark_ sem
   computar o tempo, de forma que o otimizador da JVM possa executar o JIT e outros componentes do fluxo de
   otimização de código. Cada _warmup_ será executado por 3000 milissegundos.
 - **`@Measurement(iterations = 5, time = 3000, timeUnit = TimeUnit.MILLISECONDS)`**: para cada teste, o JMH
   vai executar 5 _iterations_ de 3000 milissegundos cada, registrando estatísticas para
   as contagens de execução e o tempo decorrido.
 - **`@Fork(value = 2, warmups = 1)`**: cada teste será executado 3 vezes, sendo a primeira vez a título
   de _warmup_, ou seja, sem computar as
   estatísticas, e as outras duas vezes com armazenamento das estatísticas. As repetições para o `@Fork` podem
   envolver a execução dos testes em novas instâncias da JVM, de forma a validar a execução em uma instância
   nova ao invés de reaproveitar a mesma instância para as repetições.

Dessa forma, podemos variar a estrutura de repetições dos testes para obtermos uma execução mais rápida
ou mais precisa conforme cada caso. As anotações `Warmup`, `Measurement` e `Fork` também podem ser usadas
a nível de classe, e então são aplicadas para todos os _benchmarks_ dentro da classe.

O JMH também permite o ajuste do parâmetro `@BenchmarkMode` para selecionar o modo de cálculo do resultado
do _benchmark_, sendo 4 opções disponíveis: `Throughput`, `AverageTime`, `SampleTime` e `SingleShotTime`.
Caso mais de uma opção seja selecionada, o JMH vai calcular os resultados dos _benchmarks_ dos diferentes
modos e exibir os diferentes valores ao final. Ainda é possível usar a marcação `@OutputTimeUnit` para informar
a unidade de tempo do resultado (`TimeUnit`).

 - Modo **`Throughput`**: o resultado será calculado em termos de contagem de operações por segundo
   (ou pela unidade informada em `OutputTimeUnit`)
 - Modo **`AverageTime`**: conforme a documentação, na prática é o inverso do `Throughput`, ou seja, o tempo
   médio para execução do método do _benchmark_.
 - Modo **`SingleShotTime`**: usado para que seja feita apenas uma execução do _benchmark_, sem aquecimento
   e repetições.
 - Modo **`SampleTime`**: nesse modo, é gerada uma distribuição do tempo de execução do _benchmark_, mostrando
   alguns percentis e seus _scores_, conforme o exemplo abaixo:

{% highlight text %}
Benchmark                              Mode     Cnt       Score    Error  Units
JmhExample.preCompiledRegex          sample  321947    1514,339 ± 27,902  ns/op
JmhExample.preCompiledRegex:p0.00    sample            1410,000           ns/op
JmhExample.preCompiledRegex:p0.50    sample            1462,000           ns/op
JmhExample.preCompiledRegex:p0.90    sample            1498,000           ns/op
JmhExample.preCompiledRegex:p0.95    sample            1504,000           ns/op
JmhExample.preCompiledRegex:p0.99    sample            1558,000           ns/op
JmhExample.preCompiledRegex:p0.999   sample            3556,000           ns/op
JmhExample.preCompiledRegex:p0.9999  sample          114588,262           ns/op
JmhExample.preCompiledRegex:p1.00    sample          997376,000           ns/op
{% endhighlight %}

Cabe salientar que o trecho de código apresentado para o método `main` roda todos os _benchmarks_ presentes
no projeto Java, independente de estarem localizados na mesma classe onde se encontra o método `main`.
Para obter um melhor controle da execução dos _benchmarks_, pode ser usado o `OptionsBuilder` conforme exemplo
abaixo, onde é selecionado para executar somente os _benchmarks_ da classe `JmhRegexExample`:

{% highlight java %}
public static void main(String[] args) throws RunnerException {
   Options opt = new OptionsBuilder()
      .include(JmhRegexExample.class.getSimpleName())
      .forks(1)
      .build();
   new Runner(opt).run();
}
{% endhighlight %}


# Usando JMH no IntelliJ

Através do uso de métodos `main` conforme mostrado anteriormente, os _benchmarks_ podem ser executados de dentro
do próprio IntelliJ usando os atalhos já disponíveis na _interface_ da IDE.

Existem alguns _plugins_ de integração à ferramenta que auxiliam o uso dela na IDE.
Um exemplo deles é o **JMH Java Microbenchmark Harness**,
fornecendo, dentre outras coisas, botões de atalho na IDE para a execução dos _benchmarks_ diretamente a partir
dos métodos. Dessa forma, não há a necessidade de declaração dos métodos `main`, conforme o
exemplo de captura a seguir:

![IntelliJ JMH Plugin](/assets/2021-05-27-micro-benchmarks/intellij-jmh-plugin.png)


# Conclusão

Os _micro-benchmarks_ são uma ferramenta poderosa para auxiliar o engenheiro de _software_ a entender melhor
os detalhes de desempenho tanto do código sendo produzido, quanto das bibliotecas e outros componentes em uso
em um projeto. Mostramos um pouco das armadilhas e detalhes escondidos em termos de otimização de código pela
JVM, que podem afetar a construção de _micro-benchmarks_ de qualidade e gerar resultados imprecisos ou incorretos.

Mostramos também uma forma de escrever _benchmarks_ de qualidade em Java usando o _framework_ JMH para
construção fácil de _micro-benchmarks_. O JMH abstrai do desenvolvedor a maioria dos problemas e detalhes
técnicos quanto a otimização de código, fornecendo uma _interface_ simples e concisa para a escrita dos _benchmarks_.


# Referências

 - [*Profiling (computer programming)*](https://en.wikipedia.org/wiki/Profiling_(computer_programming))

 - [*GitHub - Java Microbenchmark Harness (JMH)*](https://github.com/openjdk/jmh)

 - [*Microbenchmarking with Java*](https://www.baeldung.com/java-microbenchmark-harness)

 - [*OpenJDK Wiki - So You Want to Write a Micro-Benchmark*](https://wiki.openjdk.java.net/display/HotSpot/MicroBenchmarks)

 - [*JMH Samples - BenchmarkMode*](https://github.com/openjdk/jmh/blob/master/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_02_BenchmarkModes.java)

 - [*IntelliJ Plugins - JMH Java Microbenchmark Harness*](https://plugins.jetbrains.com/plugin/7529-jmh-java-microbenchmark-harness)
