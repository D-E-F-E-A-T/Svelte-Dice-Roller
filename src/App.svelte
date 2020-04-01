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
    if (dieType > 20) {
      dieType = 4;
    }
    if (dieType > 12) {
      dieType = 20;
    }
  }
  function downType() {
    dieType -= 2;
    if (dieType == 18) {
      dieType = 12;
    }
    if (dieType < 4) {
      dieType = 20;
    }
  }
</script>

<style>
  main {
    background-color: #efefef;
    width: 50%;
    align-items: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  div {
    border: #ff3e00 2px solid;
  }

  .dice {
    padding-bottom: 4%;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 3em;
    font-weight: 300;
  }

  h3 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 200;
  }

  h5 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 1.5em;
    font-weight: 150;
  }

  button {
    color: white;
    background-color: palevioletred;
    border-radius: 15px;
    min-width: 50px;
    max-height: 40px;
    font-weight: 200;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  <br />
  <center>
    <div>
      <h1>dice roller demo</h1>
    </div>
    <br />
    <div class="dice">
      <h3>roll {diceNum}</h3>
      <button on:click={upNum}>+</button>
      <button on:click={downNum}>-</button>
      <h3>d{dieType}</h3>
      <button on:click={upType}>+</button>
      <button on:click={downType}>-</button>
      <h3>{result}</h3>
      <button on:click={rollDice}>ROLL</button>
    </div>
    <br />
    <div>
      <h5>
        To learn how to build Svelte apps, visit the
        <a href="https://svelte.dev/tutorial">Svelte tutorial</a>
      </h5>
      <h5>
        For the code in this demo, visit
        <a href="https://github.com/sammi-turner">Sammi Turner's GitHub</a>
      </h5>
    </div>
    <br />
  </center>
</main>
