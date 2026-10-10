Add Round 2 clue images in this folder. For a question with ID `q1`, use:

- `q1-1.jpg`
- `q1-2.jpg`
- `q1-3.jpg`
- `q1-4.jpg`

The team screen reads `/round2/<question-id>-<number>.jpg`. Keep the question ID
in sync with the corresponding entry in `server/src/rounds/round-2/questions.json`.
The UI reserves four image slots per question; unused files are simply omitted.
