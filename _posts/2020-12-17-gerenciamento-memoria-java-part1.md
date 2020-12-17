---
layout: post
title: Gerenciamento de Memória no Java
author: Jose Ferreira
author-info:
  name: Jose Ferreira
  image: jose-ferreira.jpg
  description: Back-end Developer na Axur, e escovador de bits nas horas vagas. Graduado em Ciência da Computação pela
               Universidade Federal do Rio Grande do Sul.
  linkedin: jose-ferreira-3000
date: 2020-12-17 10:40:00 -0300
---

O gerenciamento automático de memória do Java pode esconder do engenheiro alguns detalhes que podem ser relevantes em 
certos casos de uso, como no desenvolvimento de Microsserviços e também de aplicações *Serverless*. Abordaremos neste 
artigo alguns aspectos do gerenciamento de memória do Java que podem ser relevantes para o desenvolvimento de serviços
e aplicações headless. Para o desenvolvimento de aplicações interativas com UI, outras abordagens podem ser
necessárias/relevantes.

Este artigo está divido em duas partes. Nesta primeira parte, veremos alguns aspectos mais gerais do
Gerenciamento de Memória do Java. Na segunda parte, a ser publicada nas próximas semanas, abordaremos aspectos
sobre o Gerenciamento de Memória do Java rodando em *containers Docker*.


# Memória de um Processo

Tomaremos como base a plataforma Linux, que apesar de semelhante em muitos aspectos ao Windows, é uma das plataformas
mais fáceis para deploy de aplicações não-interativas. No Linux, a memória de um processo pode ser dividida em 3
grandes classes:

 - *Data*: dados manipulados pelo processo
 - *Text* ou *code*: memória onde o código de máquina/executável do programa é armazenado
 - *Stack*: memória reservada para uso do *stack* do programa

Olhando do ponto de vista de um programa clássico em C, teremos o seguinte mapeamento:

|               Tipo de dados C                  |        Local no processo           |
|:----------------------------------------------:|:----------------------------------:|
| *Stack*, chamadas entre funções (por *thread*) | *Stack*                            |
| Inicialização de variáveis/estruturas          | *Data*                             |
| Variáveis globais - *Heap*                     | *Data*                             |
| Variáveis locais - *Stack*                     | *Stack*                            |
| Memória dinâmica - *malloc*                    | *Data*                             |
| Constantes                                     | Geralmente *Data*, às vezes *Text* |
| Código executável                              | *Text*                             |

O total de memória consumido por um processo pode ser aproximado de maneira prática para a soma da memória utilizada
pelas 3 grandes classes, ou então pela soma da memória utilizada pelos tipos de dados se o processo for analisado sob
a ótica de um programa clássico C.


# Memória de um Processo Java/JVM

Apesar de todos os níveis de abstração e gerenciamentos automáticos, o gerenciamento de memória de um programa Java
também pode ser avaliado sob a ótica do gerenciamento de memória de um programa C. Inclusive as principais Máquinas
Virtuais Java são escritas em C++, incluindo partes em *assembler* e outras linguagens.

Dessa forma, a memória de um processo Java pode ser separada nos seguintes grandes grupos:

|      Recurso da JVM          | Grupo de memória JVM |     Local no processo     |
|:----------------------------:|:--------------------:|:-------------------------:|
| Variáveis - *Heap*           | *Heap*               | *Data*                    |
| *Byte code* das classes      | *Metaspace*          | *Data*                    |
| Código executável JIT        | *Metaspace*          | Seção especial executável |
| Código executável da JVM     | *Metaspace*          | *Text*                    |
| Dados da JVM                 | *Metaspace*          | *Data*                    |
| Memória nativa/dinâmica      | *Metaspace*          | *Data*                    |
| *Stack* (por *thread*)       | *Stack*              | *Stack*                   |

Dependendo da implementação da JVM, este mapeamento pode ser alterado de forma a obter diferentes níveis de
desempenho/flexibilidade durante a execução. Seguiremos com a análise considerando um mapeamento como o exposto acima,
e eventuais diferenças podem ser ajustadas seguindo a abordagem apresentada.

Por padrão, a JVM clássica ajusta um limite inicial de 1/4 da memória total do sistema para o grupo *Heap* do processo
Java, deixando livre o tamanho dos outros grupos (na verdade, os outros grupos também possuem limites iniciais, mas
estes são ajustados com muita folga, então podem ser considerados sem limites para todos os efeitos práticos).
O valor de limite de 1/4 para o grupo *Heap* também pode variar, dependendo da quantidade de memória do sistema:
para valores de memória do sistema abaixo de 512Mb de RAM, o limite do grupo Heap é ajustado entre 1/4 (512Mb) e
1/2 (128Mb) do total, em vez de fixo em 1/4.

Dessa forma, ao executar um processo Java em um computador com 8Gb de RAM, a JVM vai ajustar um limite no grupo
*Heap* de 2Gb de RAM. Se o programa Java tentar alocar um conjunto de variáveis maior do que 2Gb de RAM, será
disparada uma *Exception* do tipo **java.lang.OutOfMemoryError** no contexto da thread que está tentando ultrapassar o
limite de alocação de memória. Cabe salientar que, antes de disparar a Exception, a JVM ainda tem uma chance de
tentar liberar memória que não está mais em uso, através da execução do
[*Garbage Collector*](https://blog.mandic.com.br/artigos/java-garbage-collection-melhores-praticas-tutoriais-e-muito-mais/).

Para controlar explicitamente o limite de memória do grupo Heap, pode ser usado o parâmetro `-Xmx` da JVM:

|              Parâmetro              |                            Resultado                                |
|:-----------------------------------:|:-------------------------------------------------------------------:|
| `-Xmx1G` `-Xmx1g`                   | Ajusta o limite do grupo *Heap* para 1Gb de RAM                     |
| `-Xmx256M` `-Xmx256m`               | Ajusta o limite do grupo *Heap* para 256Mb de RAM                   |
| `-Xmx256`                           | Ajusta o limite para 256 bytes - provavelmente um erro!             |
| `java -Xmx512M -jar programa.jar`   | Executa o *programa.jar* com o grupo *Heap* limitado a 512Mb de RAM |

Para verificar o limite do grupo Heap (e outros parâmetros de configuração da JVM) pode ser usado o comando a seguir:

    $ java -XX:+PrintFlagsFinal -version | grep MaxHeap
      uintx MaxHeapFreeRatio                          = 100                             
      uintx MaxHeapSize                              := 4169138176                      
     openjdk version "1.8.0_265"
     OpenJDK Runtime Environment (build 1.8.0_265-b01)
     OpenJDK 64-Bit Server VM (build 25.265-b01, mixed mode)


#### Exemplo 1

 - Um processo Java está em execução com limite do grupo *Heap* de 1000Mb de RAM.
 - No *Heap* do processo existem 800Mb alocados em dados de variáveis, sendo que 500Mb dessas variáveis já não
   estão mais em uso (por exemplo, o método já retornou, ou não existem mais referências para elas).
 - Uma *thread* tenta alocar um vetor de 600Mb. Neste momento, o processo precisa aumentar o tamanho do *Heap* para
   1400Mb, sendo 800Mb (tamanho atual) + 600Mb (nova alocação). A alocação falha porque o tamanho ultrapassa o limite
   de 1000Mb.
 - Em resposta a falha de alocação, o gerenciador de memória do Java executa o *Garbage Collector*.
   O *Garbage Collector* analisa as referências das variáveis alocadas, e detecta que 500Mb dessas variáveis já não
   estão mais em uso, e então libera a memória alocada por estas variáveis.
 - O *Heap* do processo, com tamanho alocado de 800Mb, agora possui 500Mb de espaço livre, e neste momento pode
   atender com sucesso a requisição da *thread* para alocar um vetor de 600Mb, através do aumento do tamanho
   do *Heap* para 900Mb.


#### Exemplo 2

 - Um processo Java está em execução com limite do grupo *Heap* de 1000Mb de RAM.
 - No *Heap* do processo existem 800Mb alocados em dados de variáveis, sendo que 100Mb dessas variáveis já não estão
   mais em uso (por exemplo, o método já retornou, ou não existem mais referências para elas).
 - Uma *thread* tenta alocar um vetor de 600Mb. Neste momento, o processo precisa aumentar o tamanho do *Heap*
   para 1400Mb, sendo 800Mb (tamanho atual) + 600Mb (nova alocação).
   A alocação falha porque o tamanho ultrapassa o limite de 1000Mb.
 - Em resposta a falha de alocação, o gerenciador de memória do Java executa o *Garbage Collector*.
   O *Garbage Collector* analisa as referências das variáveis alocadas, e detecta que 100Mb dessas variáveis já não
   estão mais em uso, e então libera a memória alocada por estas variáveis.
 - O *Heap* do processo, com tamanho alocado de 800Mb, agora possui 100Mb de espaço livre, e neste momento ainda
   não é possível atender com sucesso a requisição da *thread* para alocar um vetor de 600Mb.
 - Como ainda não é possível atender a requisição de alocação de memória, a requisição é considerada como uma falha
   de alocação de memória.
 - A JVM dispara a *Exception* do tipo `OutOfMemoryError` no contexto da thread que está tentando alocar a memória
   sem sucesso. Caso seja a única *thread* do processo e a *Exception* não seja tratada, o processo é encerrado com a
   mensagem de erro de falta de memória.

O uso do *Heap* em um processo Java é o principal recurso sob controle do desenvolvedor, mas a memória alocada
pelos outros recursos também pode variar ou ser controlada direta/indiretamente através de algumas das seguintes
atividades:

 - *Byte code* das classes: o espaço alocado é proporcional ao tamanho e quantidade de classes usada pelo projeto,
   e pode expandir durante a geração dinâmica de código, por exemplo, via atividade de
   [*Aspect-oriented Programming*](https://pt.wikipedia.org/wiki/Programa%C3%A7%C3%A3o_orientada_a_aspecto).
 - Código executável JIT: depende muito da abordagem de cada tipo de JVM, mas é uma área que não varia muito em
   tamanho durante a execução do processo.
 - Código executável da JVM: código executável fixo que compõe a parte executável da própria JVM, juntamente com
   o código das bibliotecas do sistema operacional usadas, e em geral não varia durante a execução.
 - Dados da JVM: dados internos/de controle da própria JVM, não variam muito durante a execução.
 - Memória nativa/dinâmica: memória que pode ser alocada por chamadas nativas, e/ou usada por bibliotecas e outros
   componentes nativos, além de *buffers* para IO. Pode variar bastante dependendo da interação entre o processo
   e o sistema operacional, por exemplo, no acesso à rede e ao disco.
 - *Stack*: o espaço alocado é proporcional à quantidade de *threads* criadas/em uso pelo processo, incluindo
   *threads* pré-alocadas em `ThreadPools`. A profundidade de chamadas também afeta negativamente o uso de memória.


# *Metaspace* em um processo Java

O conceito de *Metaspace* foi criado a partir da versão 8 do Java, e substituiu o conceito de `PermGen`,
que era uma área reservada para dados permanentemente alocados da JVM (em contraste ao *Heap*).
Em geral, a documentação das JVMs não deixa claro o exato tamanho e composição do *Metaspace* e quais componentes
de fato são alocados dentro deste espaço de memória. Uma simplificação comumente usada para um processo Java é
de que o espaço alocado pelo *Metaspace* é a diferença entre a memória total ocupada e o valor alocado pelo *Heap*.

Essa simplificação nem sempre é correta, ainda mais se levarmos em conta o espaço ocupado pelo *Stack*, que
supostamente não faz parte do *Metaspace*. Contudo, essa simplificação ajuda a obter uma visão panorâmica geral
do uso de memória de um processo Java, bem próxima do uso real, e ainda ajuda a simplificar a complexidade das
diversas áreas especiais de memória do processo.

Assim como o *Heap*, o *Metaspace* também pode ser limitado através do parâmetro `-XX:MaxMetaspaceSize` da JVM
clássica. Contudo, diferentemente do *Heap*, que está diretamente sob controle do desenvolvedor e do código em
execução, a natureza da memória alocada pelo *Metaspace*, em geral, não pode ser determinada facilmente sem o uso
de *Profiling* de Memória ou outras ferramentas de instrumentação que ajudem a mostrar os valores médios de
memória em uso pelo *Metaspace* durante o processo em teste de carga, e por isso mesmo a configuração padrão
do parâmetro é "sem limite".

Mesmo assim, uma das principais características do *Metaspace* é que seu tamanho cresce até determinado ponto
em que todos os módulos envolvidos foram ativados e usados algumas vezes, e depois seu valor estabiliza em certo
patamar que, normalmente, não é ultrapassado, a menos que haja um *leak* de uso de algum componente presente no
*Metaspace* (por exemplo a criação dinâmica de código/classes).


# Próximos Passos

Na parte 2 deste artigo, veremos alguns detalhes do comportamento do gerenciamento de memória de um processo Java
rodando dentro de *containers Docker*, bem como algumas abordagens para configuração de memória, e também dicas
de como tratar os problemas de memória mais comuns.


# Referências

 - [*Tuning Java heap size, metaspace size and other such items*](https://cf-docs.jp-east-1.paas.cloud.global.fujitsu.com/en/manual/overview/overview/topics/t-fjbp-tuning.html)

 - [*Should I set a MaxMetaspaceSize?*](https://stackoverflow.com/questions/31455644/should-i-set-a-maxmetaspacesize)


