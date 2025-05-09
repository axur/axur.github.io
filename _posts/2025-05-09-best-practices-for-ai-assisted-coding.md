---
layout: post
title: "Best Practices for AI-Assisted Coding"
lang: en
author: Guilherme Alles
author-info:
  name: Guilherme Rezende Alles
  image: guilherme-alles.jpg
  description: Engineering Manager and software developer at Axur.
  linkedin: guilherme-rezende-alles-73730110a
date: 2025-05-09 08:00:00 -0300
---

At Axur, we're always looking for new ways to improve the productivity and efficiency of our development team. With AI quickly changing the landscape of software engineering, it can sometimes be hard to separate genuine breakthroughs from mere hype. By experimenting extensively with AI coding tools like Cursor, Junie, and Windsurf, we've identified several practical strategies that consistently deliver good results.

This post covers some best practices we found particularly valuable when using AI to assist with coding tasks:

# Choose the right tasks for AI

While AI is becoming very good at coding tasks, developers should remain firmly in control of designing complex interactions and software architecture. Good architecture demands deep domain knowledge, strategic planning, and long-term thinking—areas where AI currently struggles. The most effective strategy is for developers to define the overall architecture and then delegate specific, well-defined tasks to AI assistants. This approach ensures the system remains robust, scalable, and aligned with your organization's goals.

# Provide clear task definitions

When assigning tasks to an AI assistant, clarity is critical. Large language models lack the broader context and domain knowledge that developers have, so defining clear expectations greatly enhances the quality of the output. Whenever possible, you should include relevant context and examples of input and expected outputs so that the agent has a better chance of grasping the nuances of the task.

For example, instead of broadly stating "Write a sorting function", specify the exact input data types, expected sorting order, corner cases, and provide representative examples. We found that such clarity significantly reduces misunderstandings and iterations.

# Implement guardrails

An effective way to ensure AI-generated code remains focused and on-point is by establishing clear boundaries. Techniques like unit testing, explicit interface definitions, and strong typing help keep the AI from drifting off-task or generating unrelated code.

Consider unit tests as the ultimate guardrail: they specify exactly what the generated code should accomplish and provide objective feedback about correctness. Type definitions and interfaces also help, by ensuring that the AI adheres strictly to the desired standard, making integration smoother and more predictable.

# Apply Test-Driven Development

Among all the practices we've tested, making the AI agent use TDD has shown the most interesting results. Many AI tools now include some setting to allow the agent to autonomously execute commands. By allowing the agent to run build and test commands for the project, we found that it was capable of fixing its own mistakes and iterate on automated feedback until it comes up with a stable result. Here is the approach we found especially effective:

* **Step 1: Ask the AI to write tests first**

Explicitly prompt the AI to generate unit tests before implementing the feature. Ask it to make sure the tests are failing.

* **Step 2: Implement the feature**

Only after validating the tests and ensuring they are appropriately failing the agent should try to implement the requested feature

* **Step 3: Iteratively run tests**

After implementing the feature, run tests again to confirm they are all passing. Repeat these steps if necessary.

# Use smaller prompts and incremental complexity

A common pitfall when using AI assistants is providing overly complex prompts right from the start. We have observed that breaking down tasks into smaller, isolated chunks yield better results. This approach allows the AI to focus, producing cleaner and more maintainable solutions.

If the AI assistant takes too long or struggles with a complex prompt, it's usually better to stop it and reframe the problem. We also noticed that multiple failed attempts to build complex functionality tend to generate lots of unused code that does not get deleted by the agent. Building complexity incrementally, instead of expecting the AI to solve everything at once, provides more predictable results and reduces frustration.

# Define clear abstraction layers

Avoid asking the AI agent to handle multiple abstraction layers simultaneously - for example, implementing a UI integrated with backend in a single prompt. Instead, clearly separate these concerns. Define interfaces and types, then allow the agent to focus on UI elements and backend integration independently.

Explicitly defining these abstraction layers not only helps AI assistants deliver cleaner and more modular code but also aligns with good engineering principles, enhancing overall maintainability and clarity.

# Maintain a short context window

AI coding assistants work with a limited context window, meaning they remember only a certain number of previous interactions. Long conversations or complex sessions tend to lead to decreased accuracy and unintended results. To avoid this:

* Break down tasks into smaller units
* Regularly "close" completed blocks of functionality
* Start fresh sessions for new tasks or substantial changes in direction

This ensures the assistant remains accurate, focused on the immediate task, and effective.

# Use styleguides and custom rules

While consistency in coding style is vital, be cautious about providing excessively detailed custom style rules, as they can consume valuable context window space. A simple, concise set of guidelines provided early can significantly enhance the consistency and readability. Always review generated code to ensure it aligns with your style standards.

# Conduct thorough code review

Remember: as engineers, we remain responsible for all code committed to the repository. AI assistants are powerful tools, but they are far from infallible. Thoroughly review AI-generated code, maintain full accountability, and only commit code that you personally understand and trust. Integrating AI into your workflow means enhancing, not replacing, rigorous quality checks and thoughtful reviews.

# Conclusion

The rapid evolution of AI tools in software development presents many opportunities for productivity gains. However, it requires disciplined practices to realize these benefits fully. Interestingly, many strategies that enhance AI-assisted coding (such as breaking down complexity, using clear abstractions, and employing automated testing) are the same long-lasting principles derived from decades of traditional software engineering.

While AI-assisted development can accelerate the pace at which new software is delivered, it's essential to remember that short-term speed isn't the only measure for successful software development. In this context, developers play a critical role in ensuring that code is secure, reliable, and maintainable in the long run.

As AI continues to mature, exciting new technologies like the Model Context Protocol (MCP) are emerging, promising even richer developer interactions. We are currently exploring MCP and other standards, and we look forward to sharing our insights in future posts.