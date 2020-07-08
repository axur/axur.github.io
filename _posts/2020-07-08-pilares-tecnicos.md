---
layout: post
title:  "Pilares técnicos da engenharia de software na Axur"
author: Rafael Munaretti
author-info:
  name: Rafael Munaretti
  image: rafael-munaretti.jpg
  description: Head of Engineering da Axur, com um pé no código. Graduado em Ciência da Computação pela Universidade Federal do Rio Grande do Sul.
  linkedin: rafaelbarnimunaretti
date:   2020-07-08 00:00:00 -0300
---

Na Axur, o time de Engineering tem a missão de construir a tecnologia de monitoramento e reação contra riscos digitais que nos posiciona na liderança do mercado brasileiro e nos permite tornar a internet um lugar mais seguro. O desafio imposto por um ambiente online propício a ameaças e fraudes em constante evolução exige uma grande capacidade de entrega de software.

Além de colaborar na busca de soluções inovadoras, precisamos garantir que elas possam ser transformadas em código e integradas aos nossos produtos com rapidez e segurança. Mas não ficamos satisfeitos com qualquer código, que apenas *funcione*: além de "funcionar", cumprindo requisitos de produto, o nosso código deve também atender às demandas dos próprios times de desenvolvimento e ajudá-los a atingir uma alta produtividade de forma constante.

Sem perder o foco no presente, pensamos também *in the long run* (que, aliás, é um de nossos valores culturais). Queremos estar prontos para os desafios do futuro. Poderemos comportar 10 vezes mais desenvolvedores, sem causar gargalos no trabalho de cada um e sem perder o controle sobre os riscos? Poderemos processar 1000 vezes mais informação do que processamos hoje, sem levar a uma explosão desproporcional de custos com infraestrutura?

Para que pudéssemos responder "sim" a essas e outras questões, construímos as fundações da nossa tecnologia sobre três pilares sólidos: entrega contínua, microsserviços autônomos e infraestrutura como código. Além de conjuntamente sustentarem as qualidades que almejamos (como segurança, escalabilidade, rapidez de entrega e outras), cada um desses pilares dá suporte também aos outros dois, gerando uma correlação virtuosa.


# Entrega contínua

Entrega contínua ([*continuous delivery*](https://continuousdelivery.com/)) é a prática de desenvolver software em pequenos incrementos de funcionalidade, mantendo-o sempre pronto a ser disponibilizado aos usuários finais com as mudanças mais recentes.

Além de times de desenvolvimento disciplinados na prática de *integração* contínua, o nível de *entrega* contínua requer também a automação completa do processo de entrega do software. O [*deployment pipeline*](https://www.informit.com/articles/article.aspx?p=1621865) - que é a manifestação automatizada desse processo - surge para guiar cada mudança aplicada ao código (*commit*) por uma série de etapas que incluem compilação e geração de artefatos executáveis, testes e inspeções, validações em ambientes internos e finalmente a instalação em ambiente de produção.

Como benefício mais tangível, o tempo entre o commit e o deployment em produção é reduzido drasticamente, de semanas (ou em alguns casos mais graves até meses) para poucas horas ou minutos. Deployments deixam de ser eventos críticos, carregados de tensão e riscos e agendados com antecedência, e passam a ser corriqueiros. Na Axur, fazemos dezenas de deployments por dia com todo tipo de melhorias, de funcionalidades de interface a novas fontes de detecção de ameaças.


# Microsserviços autônomos

Arquiteturas de microsserviços recebem bastante atenção há alguns anos. Apesar do *hype* inicial, que em alguns casos levou à sua aplicação irrefletida a problemas que comportariam soluções mais simples e diretas, seus benefícios em cenários adequados puderam emergir e se consolidar. A transição arquitetural da Axur para microsserviços teve início no final de 2016 e progrediu gradualmente, com a aplicação do padrão de [estrangulamento](https://docs.microsoft.com/en-us/azure/architecture/patterns/strangler) do sistema legado. Ao entrarmos no segundo semestre de 2020 estamos concluindo as últimas etapas desse processo.

Temos opiniões formadas sobre o que queremos da nossa rede de microsserviços, baseadas em aprendizados e conhecimentos prévios do domínio dos nossos problemas. Queremos unidades verdadeiramente autônomas, desde deployment e recursos de infraestrutura até a capacidade de atender a requisições sem depender de integrações síncronas com outros microsserviços. Para isso, baseamos nossa arquitetura na [propagação de eventos](https://aws.amazon.com/event-driven-architecture/) assíncronos entre contextos, permitindo a cada um formar sua visão interna, local, do estado relevante do sistema. A visão global, portanto, passa a ser [eventualmente consistente](https://cloud.google.com/datastore/docs/articles/balancing-strong-and-eventual-consistency-with-google-cloud-datastore/#what-is-eventual-consistency).

As vantagens dessa abordagem se estendem por todos os estágios do desenvolvimento, da concepção de novos componentes até seu monitoramento contínuo. Torna-se possível fazer grande progresso com ciclos curtos de feedback, em ambientes de desenvolvimento individuais. Já em execução, a propagação de eventos pode ser facilmente rastreada pelo sistema, e requisições externas são sempre atendidas por um único serviço - permitindo a rápida identificação de causas de falhas.


# Infraestrutura como código

Como microsserviços, infraestrutura na nuvem há tempos já não é uma novidade. No entanto, são comuns os casos de aproveitamento apenas parcial do que a nuvem, e mais especificamente a [infraestrutura como serviço](https://azure.microsoft.com/en-us/overview/what-is-iaas/), tem de bom para oferecer. No nosso caso, uma capacidade fundamental é usar código para eliminar a necessidade de ferramentas interativas de provisionamento. Todos gostamos de código, então por que faríamos de outra forma?

Como seria esperado, o código responsável pelo gerenciamento de infraestrutura é muito diferente do código de aplicação. Trabalhamos com templates declarativos, que especificam cada recurso necessário em todos os seus detalhes. Bases de dados (relacionais ou não), caches, armazenamento elástico de arquivos - tudo pode ser declarado em código, versionado, testado e reproduzido com confiança em diferentes ambientes.


# Unindo as partes

A arquitetura de microsserviços autônomos beneficia e também é beneficiada pela prática de entrega contínua: por um lado, é impraticável controlar o deployment de dezenas ou centenas de componentes se o processo não for 100% automatizado; no caminho inverso, cada deployment pipeline é simplificado pela limitação de suas atribuições a um contexto isolado e bem definido.

Já a infraestrutura como código é uma necessidade imposta pelos dois primeiros pilares técnicos. Sem a automação do provisionamento de recursos de infraestrutura não seria possível adicionar essa importante responsabilidade ao deployment pipeline, efetivamente impedindo sua aplicação a um grande número de componentes independentes. Cada microsserviço ganha em autonomia por incluir, dentro de seu repositório de código, também seus templates de declaração de dependências de infraestrutura; e, da mesma forma que acontece com o deployment pipeline, cada template ganha em simplicidade por conter apenas o que é preciso para um único microsserviço.

Como um todo, a base técnica fornecida por esses três pilares tem mostrado solidez suficiente para suportar nossas demandas crescentes, mantendo a flexibilidade necessária para comportar e até incentivar mudanças significativas. Durante um período em que o time de Engineering foi expandido e descentralizado (de 6 para 28 colaboradores), conseguimos transformar tanto as práticas de entrega (de deployments agendados com intervalos de 6 a 8 semanas passamos a cerca de 20 deployments por dia) como a organização do próprio sistema (de três grandes componentes executáveis para uma constelação de mais de 100 microsserviços). Além das vantagens evidentes para a Axur e nossos clientes pela maior capacidade e rapidez de ação, a satisfação dos times de desenvolvimento também aumenta com a percepção de progresso contínuo.

Em artigos seguintes, abordaremos em maior profundidade cada um dos temas, com aprendizados acumulados pela Axur durante alguns anos e opções de tecnologias que podem facilitar sua implementação.
