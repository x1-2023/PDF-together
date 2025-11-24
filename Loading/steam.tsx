import React from 'react';
import styled from 'styled-components';

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="steampunk-brutalist-loader">
                <div className="loader-container">
                    <div className="comic-panel">
                        <div className="gear-container one">
                            <div className="gear" />
                            <div className="gear-tooth" />
                            <div className="gear-tooth" />
                            <div className="gear-tooth" />
                        </div>
                        <div className="gear-container two">
                            <div className="gear" />
                            <div className="gear-tooth" />
                            <div className="gear-tooth" />
                            <div className="gear-tooth" />
                        </div>
                        <div className="pressure-gauge">
                            <div className="gauge-needle" />
                        </div>
                        <div className="steam-pipe">
                            <div className="steam-puff" />
                            <div className="steam-puff" />
                        </div>
                        <div className="engine">
                            <div className="engine-body">
                                <div className="engine-rivet tl" />
                                <div className="engine-rivet tr" />
                                <div className="engine-rivet bl" />
                                <div className="engine-rivet br" />
                                <div className="loading-plate">
                                    <span className="loading-text">LOADING...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .steampunk-brutalist-loader {
    --primary-color: #8b4513;
    --secondary-color: #b87333;
    --bg-color: #f5deb3;
    --text-color: #2f1e0e;
    --border-width: 0.25em;

    width: 22em;
    height: 22em;
    position: relative;
    font-family: "Courier New", Courier, monospace;
    margin: 2em auto;
  }

  .loader-container {
    width: 100%;
    height: 100%;
    position: relative;
    transform: rotate(-2deg);
  }

  .comic-panel {
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
    border: var(--border-width) solid black;
    box-shadow: 0.5em 0.5em 0 black;
    position: relative;
    overflow: hidden;
    background-image: radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 10px 10px;
  }

  .engine {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    animation: machine-rumble 0.5s infinite alternate;
  }

  .engine-body {
    width: 10em;
    height: 8em;
    background: var(--primary-color);
    border: var(--border-width) solid black;
    border-radius: 1em;
    position: relative;
  }

  .engine-rivet {
    position: absolute;
    width: 0.5em;
    height: 0.5em;
    background: #5c2e0e;
    border-radius: 50%;
  }
  .engine-rivet.tl {
    top: 0.5em;
    left: 0.5em;
  }
  .engine-rivet.tr {
    top: 0.5em;
    right: 0.5em;
  }
  .engine-rivet.bl {
    bottom: 0.5em;
    left: 0.5em;
  }
  .engine-rivet.br {
    bottom: 0.5em;
    right: 0.5em;
  }

  .loading-plate {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--secondary-color);
    border: var(--border-width) solid black;
    padding: 0.5em 1.5em;
    z-index: 3;
  }

  .loading-text {
    font-size: 1.5em;
    font-weight: bold;
    color: var(--text-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }

  .gear-container {
    position: absolute;
    width: 5em;
    height: 5em;
    z-index: 1;
  }
  .gear {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #7a7a7a;
    border: var(--border-width) solid black;
    border-radius: 50%;
  }
  .gear-tooth {
    position: absolute;
    width: 1.5em;
    height: 6em;
    background: #7a7a7a;
    border-top: var(--border-width) solid black;
    border-bottom: var(--border-width) solid black;
    top: -0.5em;
    left: 1.75em;
  }
  .gear-tooth:nth-child(2) {
    transform: rotate(60deg);
  }
  .gear-tooth:nth-child(3) {
    transform: rotate(120deg);
  }

  .gear-container.one {
    top: 2em;
    left: 2em;
    animation: rotate-clockwise 4s linear infinite;
  }
  .gear-container.two {
    bottom: 2em;
    right: 2em;
    transform: scale(0.8);
    animation: rotate-counter-clockwise 4s linear infinite;
  }

  .pressure-gauge {
    position: absolute;
    top: 1.5em;
    right: 1.5em;
    width: 6em;
    height: 3em;
    border: var(--border-width) solid black;
    border-bottom: none;
    border-radius: 6em 6em 0 0;
    background: #fff;
    z-index: 3;
  }
  .gauge-needle {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0.2em;
    height: 2.5em;
    background: red;
    transform-origin: bottom center;
    animation: gauge-needle-swing 2s infinite ease-in-out;
  }

  .steam-pipe {
    position: absolute;
    bottom: 0;
    left: 2em;
    width: 2em;
    height: 4em;
    background: #5c2e0e;
    border: var(--border-width) solid black;
  }
  .steam-puff {
    position: absolute;
    bottom: 3.5em;
    left: 1.5em;
    width: 3em;
    height: 3em;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    opacity: 0;
    animation: puff-of-steam 3s infinite;
  }
  .steam-puff:nth-child(2) {
    animation-delay: 1.5s;
  }

  .comic-panel::after {
    content: "HOLD ON!";
    position: absolute;
    bottom: 0.5em;
    left: 0.5em;
    background: var(--secondary-color);
    color: var(--text-color);
    font-weight: bold;
    padding: 0.3em 0.6em;
    transform: rotate(-5deg);
    border: var(--border-width) solid black;
    z-index: 4;
    font-size: 0.9em;
  }

  @keyframes machine-rumble {
    0% {
      transform: translate(-50%, -50%) rotate(0.5deg);
    }
    100% {
      transform: translate(-50.5%, -49.5%) rotate(-0.5deg);
    }
  }

  @keyframes rotate-clockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes rotate-counter-clockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes gauge-needle-swing {
    0%,
    100% {
      transform: rotate(-45deg);
    }
    50% {
      transform: rotate(45deg);
    }
  }

  @keyframes puff-of-steam {
    0% {
      transform: scale(0.5) translateY(0);
      opacity: 1;
    }
    100% {
      transform: scale(1.5) translateY(-3em);
      opacity: 0;
    }
  }`;

export default Loader;
