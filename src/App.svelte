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
    display: flex;
    text-align: center;
  }

  div {
    margin: auto;
  }
</style>

<main>
  <div>
    <br />
    <br />
    <br />
    <br />
    <h1>POLYHEDRAL</h1>
    <h1>DICE ROLLER</h1>
    <br />
    <br />
    <div>
      <h4>roll {diceNum}</h4>
      <button class="btn btn-outline-dark btn-sm" on:click={upNum}>+</button>
      <button class="btn btn-outline-dark btn-sm" on:click={downNum}>
        -
      </button>
    </div>
    <br />
    <div>
      <h4>d{dieType}</h4>
      <button class="btn btn-outline-dark btn-sm" on:click={upType}>+</button>
      <button class="btn btn-outline-dark btn-sm" on:click={downType}>
        -
      </button>
    </div>
    <br />
    <div>
      <h4>{result}</h4>
      <button class="btn btn-outline-dark btn-sm" on:click={rollDice}>
        ROLL
      </button>
    </div>
    <br />
    <img src="dice.png" alt="dice" />
  </div>
</main>