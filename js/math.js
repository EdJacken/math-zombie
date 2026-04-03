// math.js — Generera mattetal och svarsalternativ

const MathEngine = {
    // Svårighetsgrad ökar med våg
    generate(wave) {
        const difficulty = Math.min(wave, 10); // Max svårighet vid våg 10
        const ops = this._getOperations(difficulty);
        const op = ops[Math.floor(Math.random() * ops.length)];

        let a, b, correctAnswer, symbol;

        switch (op) {
            case 'add':
                symbol = '+';
                if (difficulty <= 3) {
                    a = this._rand(1, 20);
                    b = this._rand(1, 20);
                } else if (difficulty <= 6) {
                    a = this._rand(10, 50);
                    b = this._rand(5, 30);
                } else {
                    a = this._rand(20, 80);
                    b = this._rand(10, 50);
                }
                correctAnswer = a + b;
                break;

            case 'sub':
                symbol = '−';
                if (difficulty <= 3) {
                    a = this._rand(5, 20);
                    b = this._rand(1, a); // Aldrig negativt svar
                } else if (difficulty <= 6) {
                    a = this._rand(20, 60);
                    b = this._rand(5, a);
                } else {
                    a = this._rand(30, 100);
                    b = this._rand(10, a);
                }
                correctAnswer = a - b;
                break;

            case 'mul':
                symbol = '×';
                if (difficulty <= 3) {
                    a = this._rand(1, 5);
                    b = this._rand(1, 5);
                } else if (difficulty <= 6) {
                    a = this._rand(2, 8);
                    b = this._rand(2, 8);
                } else {
                    a = this._rand(3, 10);
                    b = this._rand(3, 10);
                }
                correctAnswer = a * b;
                break;
        }

        const question = `${a} ${symbol} ${b}`;
        const options = this._generateOptions(correctAnswer);

        return { question, correctAnswer, options };
    },

    // Vilka operationer är tillgängliga beroende på svårighet
    _getOperations(difficulty) {
        if (difficulty <= 2) return ['add', 'sub'];
        return ['add', 'sub', 'mul'];
    },

    // Generera 4 alternativ (1 rätt, 3 distraktorer)
    _generateOptions(correct) {
        const options = new Set([correct]);

        while (options.size < 4) {
            let distractor;
            const strategy = Math.random();

            if (strategy < 0.4) {
                // Nära rätt svar (±1-3)
                distractor = correct + this._rand(-3, 3);
            } else if (strategy < 0.7) {
                // Lite längre bort (±4-8)
                distractor = correct + this._rand(-8, 8);
            } else {
                // Vanligt misstag — ±10
                distractor = correct + (Math.random() < 0.5 ? 10 : -10);
            }

            // Undvik negativa tal och dubbletter
            if (distractor >= 0 && distractor !== correct) {
                options.add(distractor);
            }
        }

        // Blanda ordningen
        return this._shuffle([...options]);
    },

    _rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};
