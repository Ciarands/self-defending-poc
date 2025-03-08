# Self-Defending/Anti-Tampering Proof of Concept

A proof of concept for a novel self-defending strategy, in which we hash the body of the current scope and compare it to a brute-forced prefix of that hash, all within the body of the current scope.

## Requirements

- Node.js
- Rust

## Explanation

The concept exploits a self-referential integrity check: the program computes the hash of itself (or a specific portion) and verifies that the hash begins with a brute-forced prefix. When someone attempts to alter the code, the computed hash will differ from the predicted prefix, and the program will terminate.


This approach is similar to a preimage attack but is used defensively rather than offensively:
https://en.wikipedia.org/wiki/Preimage_attack

## Weaknesses

For any standard secure hash function, it is highly unlikely that you could find a string that contains its own hash value. As a result, we can only compare a portion of the hash, which makes this proof of concept susceptible to what I am calling an "arbitrary injection attack". In this attack, an adversary could modify the scope by filling it with syntactically correct arbitrary data until the prefix matches the known prefix (assuming the attacker also knows the prefix length).


This vulnerability can be mitigated by calculating a longer prefix, which would significantly slow down an attacker, as they would need to perform an extensive amount of computation each time they make any modification.


Of course, there are several other attack vectors, which I won't detail extensively, as they do not attack the concept itself but rather the JavaScript implementation. For example, an attacker could manipulate the retrieval of the function body by modifying the indexing of `caller`, allowing them to reference an unmodified payload instead.

## Practical Application

Ideally, this method would be used in a heavily obfuscated environment that meets the following conditions:
- The program can reference itself to retrieve its own scope.
- The prefix/prefix mechanism can be injected internally into the program as a final step.


While this approach may be challenging to implement under certain conditions, it is relatively easy to apply in web-related contexts. 
It could be effectively utilized in a white-box cryptography setting.

## Considerations

Brute-forcing hash prefixes, particularly with longer prefix lengths, can be quite computationally expensive. This renders the method more suitable for critical pieces of code than for a whole application.