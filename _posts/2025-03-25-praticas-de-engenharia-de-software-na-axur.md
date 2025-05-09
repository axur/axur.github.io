---
layout: post
title:  "Práticas de engenharia de software na Axur"
lang: pt
author: Bruno Toresan
author-info:
  name: Bruno Toresan
  image: bruno-toresan.jpg
  description: Tech Lead na Axur. Graduado em Ciência da Computação pela Universidade Federal do Rio Grande do Sul.
  linkedin: bruno-toresan
date:   2025-03-25 08:00:00 -0300
---

Na Axur, tornamos a internet um lugar mais seguro com nossas soluções de cibersegurança. Nosso time de Engineering trabalha para fornecer a tecnologia necessária para monitorar e reagir às ameaças em uma internet cada vez mais dinâmica. Como cada ameaça detectada representa uma situação sensível para os nossos clientes, precisamos ser capazes de entregar software de qualidade o mais rápido o possível. Com base nessa necessidade, construímos uma cultura forte de engenharia de software com diversas práticas que vamos compartilhar com vocês, começando pela maneira que projetamos nosso software. 


# Domain-Driven Design

Existem diversas maneiras de gerenciar a complexidade do software, e aqui na Axur utilizamos uma abordagem chamada de *Domain-Driven Design* (DDD) para encarar esse desafio. O *Domain-Driven Design* foi introduzido em 2003 em uma obra de mesmo nome escrita por Eric Evans. Outro livro que esclarece bem os conceitos dessa abordagem é *Implementando Domain-Driven Design*, de Vaughn Vernon, que apresenta técnicas de DDD na prática. A ideia central desse design é colocar o domínio (os conceitos e as regras de negócio) no centro do desenvolvimento do software, utilizando uma linguagem ubíqua que é compartilhada entre os desenvolvedores de software e os demais especialistas de domínio, como analistas que transformam as necessidades dos clientes em novas funcionalidades e operadores que realizam uma série de ações necessárias para funcionamento do negócio. 

Ao aplicar o DDD nossos componentes de software são projetados em camadas aninhadas, onde as camadas mais internas não devem acessar as camadas mais externas. Utilizamos três camadas:

1. Infraestrutura: Fornece as implementações técnicas necessárias, como comunicação com banco de dados, as declarações de APIs HTTP, entre outros.

2. Aplicação: Coordena tarefas de caso de uso, gerencia transações e define as autorizações de segurança necessárias.

3. Modelo (Domínio): O domínio é o coração da aplicação. Portanto, tanto as regras de negócio quanto os objetos de domínio que modelam conceitos da área de atuação do software constam nessa camada.

![Camadas do DDD](/assets/2025-03-25-praticas-de-engenharia-de-software-na-axur/ddd-layers.png)

No entanto, o DDD, por si só, não contém todas as respostas para a qualidade de código que almejamos. Por isso também valorizamos outras práticas como o código limpo (*clean code*).

# Código Limpo

Podemos considerar que o código limpo refere-se às qualidades apresentadas por um software de fácil leitura, compreensão e manutenção. O termo “código limpo” foi popularizado por uma obra de mesmo nome, escrita pelo renomado engenheiro de software e autor Robert C. Martin (coloquialmente conhecido como "Uncle Bob"). Aqui na Axur, acreditamos plenamente que, ao aplicar os ensinamentos descritos nesse livro, desenvolvemos um código de excelência.

Seguimos normas como a utilização de nomes expressivos, reuso de código, tratamos erros com exceções descritivas e escrevemos classes pequenas que seguem o princípio de responsabilidade única, entre outras práticas. Além disso, buscamos sempre garantir que o próprio código expresse suas intenções com clareza, reduzindo assim a necessidade de comentários explicativos sobre a lógica implementada.

Portanto, há diversas recomendações concretas que seguimos ao desenvolver o nosso software para torná-lo mais limpo. Entretanto, não existe uma solução exata para todos os cenários. O título original em inglês do livro citado do Uncle Bob é *Clean Code: A Handbook of Agile Software Craftsmanship*. Essa palavra final, *craftsmanship*, não tem um paralelo exato na língua portuguesa, mas o dicionário Oxford a define como "o nível de habilidade demonstrado por alguém ao fazer algo bonito com as mãos". Aqui na Axur, valorizamos o fato de sermos os artesãos do nosso software, e sempre colocamos um cuidado adicional na escrita de cada linha de código. Além do código limpo, também queremos técnicas que nos ajudem a garantir o comportamento esperado do nosso software, o que nos leva ao nosso próximo tópico.

# Desenvolvimento Orientado a Testes (TDD)

O Desenvolvimento Orientado a Testes é uma técnica na qual o desenvolvimento do software é guiado pelo processo de escrita dos testes. Popularmente conhecida como TDD (*Test Driven Development*), essa abordagem foi concebida por Kent Beck como um dos pilares da metodologia de desenvolvimento de software ágil conhecida como Extreme Programming. O ciclo de desenvolvimento com TDD consiste em três etapas conhecidas como as etapas Vermelha, Verde e Refatoração.

1. Vermelha: O processo inicia-se com a criação dos testes unitários, antes mesmo do desenvolvimento da funcionalidade em si. Por isso que essa etapa é chamada de vermelha (cor que representa a falha dos testes na maioria das ferramentas). Dessa forma pode-se observar os cenários básicos falharem, tornando possível ver a transformação do estado errôneo para o estado correto após a implementação do código. 

2. Verde: Nessa etapa, o código da funcionalidade é desenvolvido. Não é necessariamente o código da maior qualidade, mas sim o código suficiente para passar nos testes.

3. Refatoração: Por fim, é essencial realizar a refatoração do código, garantindo que os testes unitários continuem passando.

O bom uso do TDD aumenta tanto a qualidade externa quanto a interna do software. O processo de desenvolvimento já inicia com a elaboração formal em código de todos os cenários possíveis, evitando o erro comum de considerar apenas o fluxo de quando tudo ocorre conforme o esperado. Dessa forma, criamos uma aplicação com alta cobertura de testes, minimizando a chance de a funcionalidade apresentar comportamentos inesperados. Também garantimos que eventuais futuras introduções de bugs sejam detectadas na execução desses testes. 

Uma regra de ouro é que um bom design de código é aquele fácil de se testar. Ao iniciar o desenvolvimento pelos testes, decisões de design, como quais dependências devem ser injetadas, são pensadas para facilitar o teste, o que tende a melhorar outras características do projeto como legibilidade, reuso, baixo acoplamento, alta manutenibilidade e coesão.

Discutimos bastante sobre o que fazemos para aumentar a qualidade do nosso software, mas, além de desenvolver software de qualidade, também precisamos adotar as melhores práticas para disponibilizar esse software para os nossos clientes.

# DevOps

O termo DevOps é uma combinação das palavras *Development* (Desenvolvimento) e *Operations* (Operações) representando a união de pessoas, tecnologias e processos para aumentar a capacidade de uma organização de entregar software de maneira rápida e confiável.

O time de Engineering da Axur é responsável não apenas por desenvolver o software, mas também por gerenciar os recursos de infraestrutura e realizar o deployment das soluções no ambiente de produção. A seguir, explicaremos algumas das melhores práticas de DevOps que adotamos aqui na Axur.

# Integração Contínua

Trabalhamos com uma arquitetura de microsserviços, que são componentes de software autônomos com uma única responsabilidade. Ao realizar uma alteração no repositório de um dos nossos microsserviços, um webhook é acionado e o nosso deployment pipeline inicia automaticamente. 

O deployment pipeline executa uma série de etapas, como a compilação, a geração de artefatos executáveis, a execução de testes automatizados, análise estática (que pode identificar bugs, code smells e vulnerabilidades no código fonte) e a instalação do software em um ambiente de testes. Todo o processo ocorre de forma autônoma e sem nenhum downtime. Para prosseguir com a instalação no ambiente de produção, basta uma aprovação manual com um único clique. 

# Entrega Contínua

Algumas organizações realizam o processo de deployment em frequências pré-determinadas, como apenas uma vez por semana, por exemplo. Aqui na Axur, seguimos uma prática de DevOps chamada de entrega contínua, na qual realizamos dezenas de deployments por dia, implementando uma série de modificações pequenas e incrementais. 

A adoção da entrega contínua nos traz diversos benefícios, sendo o maior deles a redução do tempo entre o commit e o deployment em produção. Além disso, o processo de fragmentar as mudanças de software em ciclos menores nos obriga a testar as mudanças com mais frequência e de maneira mais isolada, aumentando nossas chances de detectar eventuais comportamentos indesejados.

A combinação dessas duas práticas é conhecida na indústria pelo acrônimo CI/CD do inglês *Continuous Integration / Continuous Delivery*. 


# Desenvolvimento Baseado em Tronco

O Desenvolvimento Baseado em Tronco, também conhecido pela sigla *Trunk Based Development* (TBD), é uma maneira de gerenciar o versionamento do software, em que todos os desenvolvedores trabalham em uma única versão do projeto.

A palavra "tronco" faz alusão a uma forma de visualizar o versionamento do projeto como uma árvore contendo apenas um único e contínuo tronco, em contraste com a prática de ramificar o código em diversas versões simultâneas, formando uma estrutura análoga a uma árvore com longos galhos, conhecidos como branches.

Na Axur adotamos o TBD e, por isso, não utilizamos *pull requests* para integrar diferentes versões de código. Essa abordagem proporciona diversos benefícios, como uma integração mais fluida à prática de entrega contínua, possibilitando entregas mais rápidas de software. Outro benefício importante é a redução da perda de produtividade decorrente de *merges* complexos, que frequentemente geram conflitos e retrabalho.

# Infraestrutura como código


Por fim, todo o software precisa ser executado em máquinas físicas. Em vez de utilizar interfaces interativas, preferimos gerenciar a nossa infraestrutura com código, prática conhecida como *Infrastructure as Code* (IaC).

Recursos como banco de dados, armazenamentos de arquivos e servidores são declarados como código em templates declarativos. Essa abordagem nos oferece diversas vantagens como a redução da chance de introduzirmos erros humanos, a padronização da infraestrutura (tornando-a facilmente replicável em outros ambientes), controle de versionamento e maior agilidade no processo de configuração, o que torna todo o processo de deployment mais rápido.

# Conclusão

Todas essas práticas ajudam a aumentar a capacidade da Axur de reagir cada vez mais rápido às ameaças da internet, além de tornar o trabalho de desenvolvimento de software muito mais satisfatório.
