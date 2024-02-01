---
layout: post
title: Microfrontends independentes através de eventos
author: Guilherme Rezende Alles
author-info:
  name: Guilherme Rezende Alles
  image: guilherme-alles.jpg
  description: Engeineering Manager e desenvolvedor na Axur. Mestre em computação pela Universidade Federal do Rio Grande do Sul.
  linkedin: guilherme-rezende-alles-73730110a
date: 2024-02-01 00:50:00 -0300
---

No universo do desenvolvimento de aplicações web, enfrentamos desafios crescentes em relação à complexidade das aplicações. Especificamente no contexto de frontend, não é suficiente que uma aplicação seja visualmente agradável e intuitiva; a aplicação precisa encapsular e interpretar uma grande quantidade de conceitos de negócio, e apresentá-los a usuários de forma competente.

Esses conceitos de negócio, muitas vezes, estão interligados de formas complexas e funcionam de maneira intrincada. Por outro lado, é responsabilidade do time de desenvolvimento de software controlar a complexidade das bases de código, para que elas não se transformem em um obstáculo para o desenvolvimento ágil e eficiente. Nesse cenário, uma das missões do time de Engenharia da Axur é justamente gerenciar a complexidade das nossas bases de código mantendo a qualidade técnica do software desenvolvido.

# *Microfrontends* independentes

Uma das respostas para lidar com a complexidade crescente é fragmentar a aplicação em pedaços menores, independentes e coesos. Chamaremos esses pedaços de *microfrontends*. A ideia principal é criar *microfrontends* como unidades independentes de funcionalidade, que interagem entre si para construir a experiência do usuário final. Dessa forma, times de desenvolvimento podem distribuir a responsabilidade e trabalhar simultaneamente em diferentes áreas de uma mesma aplicação, sem interferir uns nos outros.

Mesmo nesse cenário, é improvável que todos os casos de uso de uma aplicação possam ser atendidos por um único *microfrontend*. Eventualmente, pode ser necessário que dois subsistemas distintos compartilhem informações. Desse ponto, surge um novo desafio: como esses *microfrontends*, que atuam como ilhas de funcionalidade, comunicam-se entre si?

Imagine um componente de carrinho de compras, responsável por armazenar temporariamente todos os produtos de uma sessão do usuário. Imagine também a página de um produto específico. É natural imaginar que esses casos de uso sejam implementados em *microfrontends* distintos e independentes. E se, nesse cenário, o carrinho de compras precisar ser atualizado (ou exibir uma animação) quando o usuário clicar no botão de "comprar" em uma página de produto? Como o carrinho de compras pode ser informado do novo produto recém selecionado?

# Emissão de eventos

Uma solução possível é estabelecer um canal de comunicação que não requer acoplamento direto entre dois *microfrontends*. Podemos fazer isso através de uma solução de mensageria compartilhada. Neste modelo, permitimos que *microfrontends* que compartilham o mesmo ambiente de execução possam trocar mensagens entre si.

Essencialmente, definimos dois tipos de mensagens, baseados no padrão de [arquiteturas orientadas a eventos](https://en.wikipedia.org/wiki/Event-driven_architecture):

0. **Comandos:** São enviados de qualquer remetente para um destinatário específico. Comandos indicam claramente a ação que deve ser realizada pelo destinatário, e são escritos usando a linguagem de domínio do destinatário. A título de exemplo, uma solicitação de mudança de rota pode ser tratada como um comando.
0. **Eventos:** Diferentemente de comandos, eventos são emitidos por um remetente específico e podem ser capturados por quaisquer destinatários interessados. Eventos indicam acontecimentos relevantes, e são escritos em termos do domínio do remetente. Isso garante que o remetente não precise conhecer detalhes de implementação dos destinatários. A título de exemplo, um evento pode ser disparado quando o resultado de uma lista é renderizado na tela ou quando um usuário realiza login com sucesso.

# Consumo de eventos

O consumo de mensagens é feito por handlers, que podem ser registrados em um *microfrontend* para que sejam invocados sempre que determinado evento for disparado na aplicação. Cada *microfrontend* é responsável por declarar e inicializar os seus próprios handlers, preferencialmente em um ponto centralizado da aplicação. Isso permite que os eventos aceitos por cada *microfrontend* sejam facilmente identificados por um leitor externo.

# Mensageria usando a DOM

A estratégia de comunicação por mensagens pode ser implementada de inúmeras formas, seja através de uma implementação própria ou com o auxílio de uma biblioteca específica. A DOM ([Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)) é uma API presente em todos os browsers e que fornece interfaces para o tratamento de eventos personalizados ([Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)). Esse ferramental pode ser utilizado para criar uma solução simples de mensageria, disparando mensagens como Custom Events e registrando event handlers para tratá-los na aplicação.

A título de exemplo, o código TypeScript abaixo utiliza APIs da DOM para enviar um evento de login para a aplicação. O evento enviado contém também o ID e o nome do usuário logado:

{% highlight typescript %}
const notifyLogin = (id: string, name: string) => {
  const loginEvent = new CustomEvent('event.login.success', {
    detail: { user: { id, name } }
  });

  document.dispatchEvent(loginEvent);
}
{% endhighlight %}

Em outro ponto da aplicação, um *microfrontend* interessado no evento de login pode registrar um handler, tratando o evento conforme necessário:

{% highlight typescript %}
const loginHandler = (event: CustomEvent) => {
  const id = event.detail.user.id;
  const name = event.detail.user.name;
  alert(`User ${name} (id ${id}) just logged in!`);
}

document.addEventListener('event.login.success', loginHandler);
{% endhighlight %}

A partir desse ponto, o `loginHandler` será invocado sempre que um evento de tipo `'event.login.success'` chegar ao objeto `document`. O envio de um evento de login pode ser feito chamando a função `notifyLogin` definida anteriormente:

{% highlight typescript %}
notifyLogin('123', 'Jane Doe');
{% endhighlight %}

Na implementação acima, é importante notar que os dois módulos (produtor e consumidor) são completamente independentes. O acoplamento entre produtor e consumidor de eventos se dá apenas pelo contrato entre os dois módulos, que pode ser interpretado como uma API definida pelo emissor. Essa API define o tipo do evento e o formato do *payload*, mas não faz nenhuma suposição quanto à existência de consumidores. Da mesma forma, consumidores de eventos simplesmente respeitam o contrato definido sem fazer nenhuma suposição quanto à existência de um emissor. Essa característica garante o baixo acoplamento entre os dois módulos.

Vale notar também que essa implementação é apenas um exemplo de como atingir o baixo acoplamento, utilizando APIs amplamente disponíveis em navegadores. Como já mencionado, existem diferentes formas de implementar a comunicação através de mensagens, e até mesmo bibliotecas que disponibilizam um ferramental similar para lidar com produtores e consumidores.

# Conclusão

Com a comunicação baseada em eventos, equipes de software podem desenvolver, testar e implementar novas funcionalidades de forma mais ágil. A emissão de eventos permite a criação de componentes independentes, de forma que múltiplas equipes trabalhem simultaneamente em diferentes partes da aplicação sem interferir umas nas outras. Da mesma forma, essa estratégia de comunicação promove o desacoplamento ao implementar uma nova interface entre dois subsistemas independentes. Por fim, ao evitar o acoplamento direto, erros ou falhas em um subsistema (no nosso caso, em um *microfrontend*) deixam de afetar diretamente o comportamento de outros, garantindo uma experiência mais estável a usuários.

Em aplicações complexas, o desacoplamento de conceitos é vital para garantir escalabilidade e flexibilidade. Nesse artigo, exploramos uma estratégia de mensageria como forma de comunicação entre *microfrontends*, permitindo que ilhas de funcionalidades isoladas possam se comunicar sem a necessidade de criar dependências rígidas entre elas. Adotando esse padrão, equipes de desenvolvimento podem se beneficiar de um processo de trabalho mais ágil e independente, além de uma arquitetura mais limpa e uma experiência mais robusta para o usuário final.