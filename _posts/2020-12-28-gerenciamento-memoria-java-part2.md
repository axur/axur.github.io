---
layout: post
title: Gerenciamento de Memória no Java - Containers Docker
lang: pt
author: Jose Ferreira
author-info:
  name: Jose Ferreira
  image: jose-ferreira.jpg
  description: Back-end Developer na Axur, e escovador de bits nas horas vagas. Graduado em Ciência da Computação pela
               Universidade Federal do Rio Grande do Sul.
  linkedin: jose-ferreira-3000
date: 2020-12-28 13:41:00 -0300
---

Nesta segunda parte do artigo sobre Gerenciamento de Memória no Java, veremos alguns aspectos mais específicos do
Gerenciamento de Memória do Java quando estiver rodando dentro de *containers Docker*, bem como algumas abordagens
para configuração de memória, e também dicas de como tratar os problemas de memória mais comuns.

Para acessar a primeira parte do artigo, utilize o link abaixo:

[Parte 1 - Gerenciamento de Memória no Java]({% post_url 2020-12-17-gerenciamento-memoria-java-part1 %})


# Memória de um Processo Java/JVM dentro de um *container Docker*

Vimos que a JVM usa a memória total do sistema para calcular alguns parâmetros e limites, incluindo o limite de uso
do grupo *Heap*. Na medida em que o uso de *containers Docker* para rodar serviços Java se popularizou, essa
abordagem de usar o valor do total de memória do sistema para calcular alguns parâmetros se mostrou problemática.
Isso aconteceu porque os limites de memória e recursos impostos pelo *Docker* são direcionados para impor limites
nas chamadas do sistema, sem afetar as rotinas que fornecem informações sobre o *hardware* do sistema, como memória
total do computador.

Essa mudança exigiu uma abordagem ativa dos processos para que fossem compatíveis com *Docker*, ou seja, é esperado
que o processo detecte se está rodando dentro de um *container Docker* limitado, e faça o tratamento necessário
dos limites impostos pelo container.

A funcionalidade de detecção e suporte ao *Docker* foi adicionada ao Java na **versão 8 release 181**. Antes desta
versão, a JVM rodando dentro de um *container Docker* não era capaz de entender os limites impostos pelo *Docker*,
considerando a memória total do sistema e outros parâmetros sem levar em conta os limites configurados. Então,
por exemplo, considerando um computador com 4Gb de RAM rodando *Docker*, com uma instância Java rodando em um
*container Docker* com limite de memória de 512Mb e com uma versão sem suporte a *Docker* (anterior a versão Java 8
*release* 181), o limite de Heap seria ajustado para 1Gb de RAM (1/4 da memória total, que é 4Gb), e quando o
consumo de memória do processo Java ultrapassasse 512Mb o processo seria finalizado pelo serviço *Docker*, com o
código de erro padrão de retorno 137 para indicar que o processo ultrapassou os limites definidos pelo *container*.

Cabe salientar que a finalização do *container* através deste processo não envia sinais nem Exceções ao processo
Java, e dessa forma nenhuma *Exception* é executada a nível do código Java, que é simplesmente finalizado sem mais
informações.

Contudo, para as versões de JVM compatíveis com *Docker* (Java versão 8 *release* 181 e posteriores), o limite de
*Heap* é ajustado corretamente conforme esperado, acompanhando a configuração de limite de memória imposta pelo
*container Docker*. Abaixo podemos acompanhar um exemplo da variação do limite de *Heap* conforme o limite de memória
do *container*:

| Memória do Docker (parâmetro `-m`) | *MaxHeapSize* | Diferença |
|:----------------------------------:|:-------------:|:---------:|
|                              128Mb |          64Mb |      64Mb |
|                              192Mb |          96Mb |      96Mb |
|                              256Mb |         126Mb |     130Mb |
|                              384Mb |         126Mb |     258Mb |
|                              512Mb |         128Mb |     384Mb |
|                              768Mb |         192Mb |     576Mb |
|                             1024Mb |         256Mb |     768Mb |

Nota: dados extraídos usando a imagem `openjdk:8u275-jre-slim`

No gráfico acima também podemos acompanhar a diferença entre o total de memória do *container* e o limite de *Heap*,
que na prática será o espaço de memória onde será alocado o *Metaspace* e seus componentes, bem como o *Stack*, e
demais módulos específicos de cada JVM. Podemos derivar as seguintes conclusões a partir do gráfico:

 - O valor do limite do *Heap* pode ser usado para configurar a quantidade de memória alocada para o *Heap* e para
   o *Metaspace* dentro do *container*.
 - A partir de um *container* com 256Mb, a configuração automática do limite do *Heap* vai alocar cada vez mais
   memória para o *Metaspace* e pouco para o *Heap*, e isso pode resultar em um desperdício de memória que poderia
   ser alocada para o *Heap* e estaria disponível dentro do Java para armazenamento de variáveis e objetos.

Em vista de tudo isso, a conclusão mais forte de todas é: quase nunca a configuração automática de *Heap* de um
processo Java dentro de um *container Docker* será a melhor configuração possível de alocação de memória. As
configurações automáticas, em geral, vão variar entre alguma das seguintes situações:

 - Desperdício de memória que não está alocada para o *Heap* e não está em uso pelo *Metaspace*.
 - Memória insuficiente alocada para o *Heap*, causando *Exception* de *OutOfMemoryError* durante a execução.
 - Memória insuficiente alocada para o *Metaspace/Stack*, causando finalização abrupta do *container* por erro
   137 (limite excedido) do *Docker*.


# Como Configurar a Memória do Java em um *Container Docker*?

A maneira mais simples de configurar os parâmetros de memória de um processo Java rodando em *containers Docker*
é através do monitoramento do consumo de memória do processo durante um teste de carga que exercite o processo
com os principais casos de uso do componente, usando, por exemplo, uma ferramenta de *Profiling* como o
[VisualVM](https://visualvm.github.io/) (*open source*) ou o
[JProfiler](https://www.ej-technologies.com/products/jprofiler/overview.html) (comercial). Através da ferramenta,
é possível acompanhar a variação dos valores alocado/máximo para o *Heap* e também para o *Metaspace* do processo,
obtendo um *footprint* do consumo de memória que pode ser usado para ajustar o limite de *Heap* e por consequência
o espaço disponível para o *Metaspace*.

Contudo, nem sempre é possível ou está disponível um teste de carga para que seja feito o *Profiling* do processo
Java, e nestes casos, algumas heurísticas simples podem ser usadas de forma a se obter valores iniciais para a
configuração de memória.

Uma das abordagens heurísticas mais simples para definição da memória de um processo Java rodando dentro de um
*container Docker* envolve a simplificação dos espaços de memória do processo em dois grupos, *Heap* e *Metaspace*
(considerando o *Metaspace* como contendo também o *Stack*), calculando um valor aproximado do consumo de *Metaspace*,
e ajustando o valor do limite do *Heap* de forma a dividir os espaços conforme o cálculo aproximado. A seguir
temos o resumo da abordagem:

 - Calcular um valor aproximado do consumo de *Metaspace*, como sendo entre 3 a 4 vezes o tamanho do conteúdo do
   pacote Jar (deve ser um [*fat jar*](https://pt.stackoverflow.com/questions/400626/o-que-%C3%A9-fat-jar) - um
   pacote Jar contendo a aplicação e também todas as suas dependências). Como o pacote Jar é um arquivo comprimido
   do tipo ZIP, deve ser consultado o tamanho do conteúdo descomprimido, ou então pode ser feita uma simplificação e
   considerado entre 6 a 8 vezes o tamanho do arquivo do pacote Jar. Cabe ressaltar que a melhor abordagem é
   consultar o tamanho do conteúdo, posto que existem processos de criação de pacotes Jar que não aplicam
   compressão ZIP, e nesse caso pode tornar os valores muito imprecisos.
 - Calcular o limite do *Heap* como sendo a diferença entre a memória total do *container* e o tamanho do *Metaspace*
   calculado acima.
 - Ajustar o limite do *Heap* no processo Java dentro do *container* usando o parâmetro `-Xmx`
 - Esta abordagem é boa para processos que não lançam muitas *threads* ou que têm um limite no número total de 
   *threads* em uso, já que o valor do *Stack* não é levado em conta nos cálculos.
 - Processos que usam muitas *threads*, ou que possuem `ThreadPools` muito grandes ou sem limites, ou *listeners* de
   API HTTP sem limite de requisições paralelas, podem sofrer interrupções do *container Docker* por erro 137 na
   presença de muitas *threads* em execução, por exemplo em situações de picos de conexões de requisições HTTP.

Para os casos em que o processo Java usa muitas *threads* ou pode ter picos de consumo de *threads*, a abordagem
heurística recomendada pode ser levemente alterada para levar em conta o consumo do *Stack*, conforme segue:

 - Calcular um valor aproximado do consumo de *Metaspace*, conforme a abordagem anterior.
 - Calcular um consumo aproximado de *Stack*, considerando um valor entre 512Kb e 1Mb para cada *thread* paralela
   que se deseja que possa estar executando ao mesmo tempo. Considerando um *listener* de requisições HTTP em que se
   deseja que até 128 requisições possam ser atendidas em paralelo, o valor de memória considerado para o *Stack*
   seria entre 64Mb e 128Mb. Cabe salientar que, se o `ThreadPool` do *listener* HTTP não tiver limite de *threads*,
   um pico de requisições poderá ultrapassar o número previsto e resultar na interrupção do container por erro 137.
 - Calcular o limite do *Heap* como sendo a diferença entre a memória total do *container* e a soma do tamanho
   do *Metaspace* e do *Stack*.
 - Ajustar o limite do *Heap* no processo Java dentro do *container* usando o parâmetro `-Xmx`
 - Esta abordagem é boa para processos que podem lançar muitas *threads*, de forma a levar em conta a quantidade
   de *threads* no cálculo dos limites de memória.

Seguindo as abordagens heurísticas descritas acima, será possível obter valores iniciais razoavelmente interessantes
para a configuração de memória de um processo Java dentro de *container Docker*. Ainda assim, o processo Java poderá
sofrer `Exceptions` e interrupções por falta de memória, e seguindo as abordagens descritas, podemos enumerar as
ações recomendadas a serem tomadas:

 - Caso uma *thread* receba uma `Exception` do tipo `OutOfMemoryError`: este caso indica que o processo Java tentou
   manipular objetos muito grandes ou uma quantidade grande de objetos, associados a um limite de *Heap* insuficiente,
   e neste caso a ação corretiva deve ser recalcular os valores de forma a fornecer mais memória *Heap* através do
   parâmetro `-Xmx`. Talvez seja necessário alterar também o limite de memória total do *container*, já que alterar
   somente o limite do *Heap* vai interferir com o valor alocado para o *Metaspace vs Heap*.
 - Caso o processo seja interrompido por um erro 137 do *Docker*: este caso indica que a área de *Metaspace/Stack*
   do processo Java cresceu além do tamanho pré-estabelecido, por exemplo durante um pico de uso de *threads* ou
   outra situação de uso excessivo de *Metaspace*. Neste caso, a ação corretiva é refazer os cálculos para aumentar
   a área de memória alocada para o *Metaspace*. Talvez seja necessário alterar também o limite de memória total
   do *container*, já que alterar somente o limite do *Heap* vai interferir com o valor alocado para
   o *Metaspace vs Heap*.


# Pontos de Atenção sobre o Consumo de Memória no Java

 - No Java 8 e anteriores, um `String` ocupa o dobro do espaço em bytes, já que é armazenado no formato UTF-16
   (dois bytes por caractere). No Java 9 e posteriores, o `String` é armazenado como UTF-8 (1 byte por caractere)
   caso não contenha caracteres especiais (acentos, emoji, etc), e o mesmo do Java 8 caso contrário.
 - Os processos de serialização/deserialização podem exigir até várias vezes a quantidade de memória da instância
   em questão, já que várias conversões de dados devem ser feitas, como por exemplo na cadeia de conversão
   entre *buffer* de rede do SO / *buffer* de memória nativa no Java (*Metaspace*) / vetor de bytes (*Heap*)
   / `String` (*Heap*) / Objeto desserializado (*Heap*). Isso significa, por exemplo, que um processo Java com
   limite de *Heap* de 128Mb não é capaz de desserializar com sucesso um payload de rede de 64Mb no exemplo acima.
 - O *stack* de uma *thread* nunca usada em um `ThreadPool` praticamente não utiliza memória, já que as páginas
   virtuais ainda não foram alocadas para o *Stack*. Contudo, uma *thread* já usada e que retorna para o `ThreadPool`
   segue ocupando o *Stack* até que seja finalizada. Esta condição pode ser relevante em casos em que
   um `ThreadPool` com muitas *threads* pode ter todas elas ocupando muito espaço de *Stack*, mesmo que não haja
   um pico de *threads*, mas na condição em que todas tiverem sido utilizadas pelo menos uma vez.


# Referências

 - [*Docker support in Java 8 — finally!*](https://blog.softwaremill.com/docker-support-in-new-java-8-finally-fd595df0ca54)

 - [*Java inside docker: What you must know to not FAIL*](https://developers.redhat.com/blog/2017/03/14/java-inside-docker/)

 - [*VisualVM - All-in-One Java Troubleshooting Tool*](https://visualvm.github.io/)

 - [*JProfiler - "THE AWARD-WINNING ALL-IN-ONE JAVA PROFILER"*](https://www.ej-technologies.com/products/jprofiler/overview.html)

 - [*Tuning Java heap size, metaspace size and other such items*](https://cf-docs.jp-east-1.paas.cloud.global.fujitsu.com/en/manual/overview/overview/topics/t-fjbp-tuning.html)

 - [*Should I set a MaxMetaspaceSize?*](https://stackoverflow.com/questions/31455644/should-i-set-a-maxmetaspacesize)

 - [O que é Fat JAR?](https://pt.stackoverflow.com/questions/400626/o-que-%C3%A9-fat-jar)

 - [*What is an uber jar?*](https://stackoverflow.com/questions/11947037/what-is-an-uber-jar)

