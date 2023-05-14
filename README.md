A GPT client that has long term memory.
## How it works
Every time a message is sent, embeddings are created and are relevent documents are retrieved(shown in the context card).
There is also a persistent memory that the AI always has access to

Full privacy: all completely local using localForage(an indexedDB wrapper).

### To - do not in any order:

- [ ] Web browsing
- [ ] Local AI - Once they make LangChain JS/TS support better, this should be possible
