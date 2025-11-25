I want to create a game of life. This is a fun project for kids, the purpose is education and experimentation with rules and parameters of the game, with  focus on clear visualization and rule transparency.

Here are the basic rules of the game:
- the game has multiple rounds, beginning and runs infinitely until user decides to stop it. One round is one change of state of all objects on the board
- objects: there are two kinds of classes of objects in the game: creatures and plants
- creature: an object that can move, be spawned, be born, reproduce, eat, fight, die. Either an animal or human.
    Rules: 
        - creatures move one square each round. 
        - Creature movement is random, but with bias: humans are driven towards fruits, wolves are driven towards humans, dogs are driven towards wolves.  
        - Creature dies when energy falls below zero. Creature is then removed from the board.
- animal: there are two kinds of animals: a dog (friendly to humans) and a wolf (unfriendly to human).
- *dog*: friendly to human, unfriendly to wolf. If at the end of a round is on a square next to a wolf, deals damage to wolf. 
    Set of parameters: starting health, amount of damage to a wolf, probability of death as a function of number of rounds of age (Gompertz function, parameters Gompertz_A and Gompertz_B), perception range, probability to move closer to wolf
- *wolf*: unfriendly to human. If at the end of a round is on a square next to a human, deals damage to human. Female does not fight back, male deals damage back to the wolf.
    Set of parameters: starting health, amount of damage to a human, probability of death as a function of number of rounds of age (Gompertz function, parameters Gompertz_A and Gompertz_B), perception range, probability to move closer to human
- *human*: either male or female. 
    Rules: 
        - If at the end of a round male and female are on adjacent squares, they reproduce with probability. 
        - If one male / female is on adjacent square with more than one human of another gender, each pair can reproduce independently.
        - If two males are on adjacent squares at the end of the round, they fight, dealing damage to each other.
        - If two females are on adjacent squares at the end of the round, they do not fight. 
    Set of parameters: starting health, reproduction probability, probability of death as a function of number of rounds of age (Gompertz function, parameters Gompertz_A and Gompertz_B), perception range, probability to move closer to fruit
    Set of paremeters for *males*: amount of damage to a wolf, amount of damage male deals to male
    Set of paremeters for *females*: pregancy period in rounds, cooldown period (number of rounds after reproduction when pregnancy is not possible)
- plant: an object that cannot move. This can either be a fruit (healing to human) or mushroom (poisonous to any creature)
- *fruit*: healthy to humans. 
    Rules:
        - When fruit is on adjacent square to human at the end of the round and it is ripe, it is eaten by this human and an amount of energy is added to this human.
        - When multiple human are on adjacent squares to the fruit by the end of the round, only one random human has eaten it.
        - Grows randomly in a given round on an empty square. 
        - The fruit is unripe in the round after it has grown.
        - The fruit becomes ripe a certain number of rounds after it grew.
    Set of parameters: Amount of energy added to human, chance of growing, number of rounds to ripen.
- *mushroom*: unhealthy to humans.
    Rules:
        - When mushroom is on adjacent square to human at the end of the round, it is eaten by this human and an amount of energy is deducted from this human.
        - When multiple human are on adjacent squares to the mushroom by the end of the round, only one random human has eaten it.
        - Grows randomly in a given round on an empty square. 
        - The mushroom is poisonous right after it grows.
    Set of parameters: Amount of energy removed from human, chance of growing.
- object state: a set of values of parameters of one given object in the game. Each class of objects has their own set of parameters.
- board: the board is drawn in browser (Chrome is the primary target), composed of fields. At one time there can only be one object on one field. Board edges are walls - creatures can't cross them.
- beginning of the game - this is when: 
    - on each field there is a random drawing of whether an object will spawn there and what object it will be.
    - configuration is applied to all objects in the game.
    - rounds start to go.
- round has a clear **priority order** for resolution: (1) Movement, (2) Combat/damage dealing, (3)
  Eating (plants), (4) Reproduction, (5) Death/removal, (6) Birth, (7) Plant spawning.
- configuration - set of values of all parameters. The configuration can be changed only before a game of life has started. There are game parameters and object parameters.
    - game parameters are: 
        - dimensions of the game board
            - width (number of fields horizontally)
            - height (number of fields vertically)
            - initially the game supports minimum 10x10 (100 objects), maximum 100x100 board with 1000 total objects, default 30x30.
        - probabilities of a spawning in a given field at the beginning of the game:
            - a human
                - a male if a human
                - a female if a human
            - an animal
                - a wolf if animal
                - a dog if animal
            - a plant
                - a fruit if a plant
                - a mushroom if a plant
        - overcrowding multipliers (times the probability of death increases once population is exceeding a given threshold)
            - for humans: threshold (total number of humans on the board), the multiplier
            - for animals: threshold (total number of animals on the board), the multiplier
    - creature class parameters (explained per each class above)
- adjacent squares: each square has 8 adjacent squares - horizontally, vertically and diagonally.
- user interface: 
    - displays the board, use emojis (🧑‍🦰🦰🐺🐕🍎🍄) for creatures,
    - in top left corner displays number of current round
    - Add a "?" button in the top-right corner that opens a modal overlay with tabbed sections (Game Rules,
  Creature Types, Plant Types, Controls).
    - control buttons: pause, run one round, run five rounds, run free, finish game
    - statistics: current numbers of males, females
    - when the game has not yet started, or a game is finished, the board is overlayed with configuration panel
    - How should the configuration interface works - manual parameter editing.
    - each game is independent, there is no saving in MVP