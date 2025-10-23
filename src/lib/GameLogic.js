import chalk from "chalk";
import { select } from "@inquirer/prompts";
import readline from "readline";

// Create trivia game questions as an array of objects
const questions = [
  { question: "What is the first element in the periodic table?",
    choices: ["Hellium", "Boron", "Hydrogen", "Iron"],
    answer: "Hydrogen",
  },
  { question: "What is the third planet from the sun?",
    choices: ["Earth", "Mars", "Jupiter", "Venus"],
    answer: "Earth",
  },
  { question: "What substance is made from two hydrogen and one oxygen atoms?",
    choices: ["Air", "Wood", "Water", "Rock"],
    answer: "Water",
  },
  { question: "What is the tallest mountain on Earth",
    choices: ["K2", "Everest", "Denali", "Nebo"],
    answer: "Everest",
  },
  { question: "Utah has the greatest snow on Earth",
    choices: ["True", "False"],
    answer: "True",
  },
   { question: "What is the most abundant element on planet Earth by mass?",
    choices: ["Oxygen", "Carbon", "Hydrogen", "Iron"],
    answer: "Iron",
  }
];

// Create async function for the main menu selections
export async function showMainMenu(gameState){
    const action = await select({
        message: "Trivia Game Main Menu",
        choices: [
            {name: "Start", value: "start"},
            {name: "Stats", value: "stats"},
            {name: "Reset", value: "reset"},
            {name: "Quit", value: "quit"},
        ],
    });

    switch(action){
        case "start":
            await startGame(gameState);
            break;
            case "stats":
                showStats(gameState);
                await select({message: "Return to Main Menu?", choices: [{name: "Return", value: "menu"}]});
                await showMainMenu(gameState);
                break;
                case "reset":
                    resetStats(gameState);
                    await showMainMenu(gameState);
                break;
                case "quit":
                    console.log(chalk.cyan("See you next time!"));
                    process.exit(0);
    };
};

// Create async function that prompts the questions with a timer countdown set to 10000 ms (10 seconds)
export async function timedQuestion(question, timeout = 10000) {
  let timeLeft = timeout / 1000;
  let timerInterval;
  let timeoutId;
  let resolved = false; 

  // Define the question prompt and choices as answer promise
  const answerPromise = select({
    message: question.question,
    choices: question.choices.map((choice) => ({
      name: choice,
      value: choice,
    })),
  });

  // Add in a display for countdown timer
  function drawTimer() {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(chalk.yellow(`Time left: ${timeLeft}`));
  };

  drawTimer(); 

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft === 0) return;
    drawTimer();
  }, 1000);

  // Define the timeout promise
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      clearInterval(timerInterval);
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout, 0); 
      
      resolve(null);
    }, timeout);
  }); 

  // Define the result of waiting for an answer or time to end
  const result = await Promise.race([answerPromise, timeoutPromise]);

  // Clear the timer
  if (!resolved) {
    resolved = true;
    clearTimeout(timeoutId);
    clearInterval(timerInterval);
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
  } 
    return result;                                  
};

// Create async function using four selections from the questions array that provides feedback for the user answer
const questionLimit = 4;

export async function startGame(gameState){
    console.log(chalk.cyan("Welcome to the Trivia Game! You have 10  seconds per question."));
    const selectedQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, questionLimit);

    for(const question of selectedQuestions) {
        const answer = await timedQuestion(question, 10000); 

        if(answer === null){
            console.log(chalk.yellow("Sorry, out of time!"));
            console.log(chalk.yellow(`Correct answer: ${question.answer}`));
            gameState.stats.unanswered.push({
                answer,
            });
        } else if (answer === question.answer){
            console.log(chalk.green("Correct!"));
            gameState.stats.correct.push({
                answer,
            });
        } else { 
            console.log(chalk.red("Incorrect :("));
            console.log(chalk.red(`Correct answer: ${question.answer}`));
            gameState.stats.incorrect.push({
                answer,
            });
        }; 
    };

// Notify user of completion and option to return to main menu
    console.log(chalk.cyan("Nice job completing the game!"));
    await select({
        message: "Return to Main Menu?",
        choices: [{name: "Return", value: "menu"}],
    });
    await showMainMenu(gameState);
};


// Create function to display user stats from the game
function showStats(gameState){
    const correctCount = gameState.stats.correct.length;
    const incorrectCount = gameState.stats.incorrect.length;
    const unanswered = gameState.stats.unanswered.length;

    console.log(chalk.green(`Correct: ${correctCount}`), chalk.red(`Incorrect: ${incorrectCount}`), chalk.yellow(`Unanswered: ${unanswered}`));
};

// Create function to reset user stats
function resetStats(gameState){
    gameState.stats.correct = [];
    gameState.stats.incorrect = [];
    gameState.stats.unanswered = [];
    console.log("Reset complete");
};