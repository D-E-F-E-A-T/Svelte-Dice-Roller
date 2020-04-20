<script>
  export let diceNum = 1;
  export let dieType = 4;
  export let result = 0;

  function rollDice() {
    var i;
    var roll;
    result = 0;
    for (i = 0; i < diceNum; i++) {
      roll = Math.ceil(Math.random() * dieType);
      result += roll;
    }
  }

  function upNum() {
    diceNum++;
  }

  function downNum() {
    diceNum--;
    if (diceNum < 1) {
      diceNum = 1;
    }
  }

  function upType() {
    dieType += 2;

    if (dieType == 102) {
      dieType = 4;
    }
    if (dieType == 22) {
      dieType = 100;
    }
    if (dieType == 14) {
      dieType = 20;
    }
  }
  function downType() {
    dieType -= 2;

    if (dieType == 98) {
      dieType = 20;
    }
    if (dieType == 18) {
      dieType = 12;
    }
    if (dieType == 2) {
      dieType = 100;
    }
  }
</script>

<style>
  main {
    text-align: center;
  }
  div {
    background: transparent;
  }
</style>

<main>
  <div class="jumbotron jumbotron-fluid">
    <div class="container">
      <h1 class="display-4">Polyhedral Dice Roller</h1>
      <p class="lead">
        Visit the
        <a href="https://svelte.dev/tutorial">Svelte tutorial</a>
        to learn how to build Svelte apps.
      </p>
      <br />
      <br />
      <div class="container">
        <h4>roll {diceNum}</h4>
        <button class="btn btn-outline-dark btn-sm" on:click={upNum}>+</button>
        <button class="btn btn-outline-dark btn-sm" on:click={downNum}>
          -
        </button>
      </div>
      <br />
      <div class="container">
        <h4>d{dieType}</h4>
        <button class="btn btn-outline-dark btn-sm" on:click={upType}>+</button>
        <button class="btn btn-outline-dark btn-sm" on:click={downType}>
          -
        </button>
      </div>
      <br />
      <div class="container">
        <h4>{result}</h4>
        <button class="btn btn-outline-dark btn-sm" on:click={rollDice}>
          ROLL
        </button>
      </div>
      <br />
      <img src="dice.png" alt="dice" />
    </div>
  </div>
</main>
