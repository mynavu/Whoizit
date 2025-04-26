import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function Game({
  session,
  setSession,
  gameId,
  setGameId,
  setWinner,
  joinGame,
  allCards,
  setAllCards,
  allCardsRef,
  winner,
  yourChosen,
  setYourChosen,
  oppChosen,
  setOppChosen,
  bothPlayersIn,
  setBothPlayersIn
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const channelRef = useRef(null);
  const [currentChosen, setCurrentChosen] = useState(null);
  const [firstPlayer, setFirstPlayer] = useState(null);
  const [secondPlayer, setSecondPlayer] = useState(null);
  const [yourSet, setYourSet] = useState([]);
  const [oppSet, setOppSet] = useState([]);
  const [enableQuestion, setEnableQuestion] = useState(false);
  const [enableAnswer, setEnableAnswer] = useState(false);
  const [enableGuess, setEnableGuess] = useState(false);
  const [enableChoice, setEnableChoice] = useState(false);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [guess, setGuess] = useState(null);
  const [yourChoice, setYourChoice] = useState(null);
  const hasInitialized = useRef(false);
  const messageEndRef = useRef(null);
  const startingPlayer = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function celebrate() {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio, opts) {
      window.confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio),
        })
      );
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      
      fire(0.2, {
        spread: 60,
      });
      
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
  }

  function endGame() {
    console.log("end game");
    channelRef.current.send({
      type: 'broadcast',
      event: 'endGame',
      payload: {
        user_name: session?.user?.user_metadata?.name,
      },
    });
  };

  function playAgain() {
    setYourChoice(null);
    setOppChosen(null);
    setMessages([]);
    setYourChosen(null);
    setCurrentChosen(null);
    setYourSet(shuffle([...yourSet]));
    setOppSet(shuffle([...oppSet]));
    setEnableQuestion(false);
    setEnableAnswer(false);
    setEnableGuess(false);
    setEnableChoice(false);
    setCurrentGuess(null);
    setGuess(null);
    setWinner(null);
    setBothPlayersIn(false); // Reset to force re-sync
    hasInitialized.current = false;

    // Notify other player to reset
    channelRef.current.send({
      type: 'broadcast',
      event: 'resetGame',
      payload: {
        user_name: session?.user?.user_metadata?.name,
      },
    });

    // Re-track presence to ensure sync
    channelRef.current.track({
      name: session?.user?.user_metadata?.name,
      ready: true, // Add ready flag
    });

    // If this user is the first player, re-enable choice
    if (firstPlayer === session?.user?.user_metadata?.name) {
      setEnableChoice(true);
    }
  }

  useEffect(() => {
    channelRef.current = supabase.channel(gameId, {
      config: {
        broadcast: { self: true },
        presence: { key: session?.user?.id },
      },
    });

    channelRef.current.on('presence', { event: 'sync' }, () => {
      const usersOnline = channelRef.current.presenceState();
      if (Object.keys(usersOnline).length > 2) {
        console.log('Only two players allowed')
        channelRef.current.unsubscribe();
      } else if (Object.keys(usersOnline).length === 2) {
        /*
        console.log(
          'Users in the room:',
          usersOnline[Object.keys(usersOnline)[0]][0].name,
          usersOnline[Object.keys(usersOnline)[1]][0].name
        );
        */
        // Check if both users are ready
        const allReady = Object.values(usersOnline).every((user) => user[0].ready);
        //console.log("allReady", allReady);
        if (allReady) {
          loadSetOrSendSet();
          if (winner === null) {
            setBothPlayersIn(true);
            //console.log("bothPlayersIn", bothPlayersIn)
          }
        }

        if (startingPlayer.current === null) {
            let first = usersOnline[Object.keys(usersOnline)[0]][0].name;
            let second = usersOnline[Object.keys(usersOnline)[1]][0].name;
            startingPlayer.current = usersOnline[Object.keys(usersOnline)[0]][0].name;
            setFirstPlayer(first);
            setSecondPlayer(second);
            console.log("startingPlayer.current", startingPlayer.current);
            console.log("firstPlayer", firstPlayer);
            if (first === session?.user?.user_metadata?.name) {
                setEnableChoice(true);
            }
        }
      }
    });

    channelRef.current.on('broadcast', { event: 'test-my-messages' }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.payload]);
    });

    channelRef.current.on('broadcast', { event: 'updateYourSet' }, (payload) => {
      if (payload.payload.user_name === session?.user?.user_metadata?.name) {
      } else {
        setOppSet(payload.payload.card_set);
      }
    });

    channelRef.current.on('broadcast', { event: 'confirmYourChosen' }, (payload) => {
      if (payload.payload.user_name === session?.user?.user_metadata?.name) {
      } else {
        setOppChosen(payload.payload.chosen);
      }
    });

    channelRef.current.on('broadcast', { event: 'callWinner' }, (payload) => {
      if (payload.payload.user_name === session?.user?.user_metadata?.name) {
      } else {
        setWinner(payload.payload.user_name);
        setBothPlayersIn(false);
        //celebrate();
      }
    });

    channelRef.current.on('broadcast', { event: 'setOppResponse' }, (payload) => {
      if (payload.payload.user_name === session?.user?.user_metadata?.name) {
      } else {
        if (payload.payload.choice === 'ask') {
          setEnableAnswer(true);
        }
      }
    });

    channelRef.current.on('broadcast', { event: 'callNextTurn' }, (payload) => {
      if (
        payload.payload.user_name === session?.user?.user_metadata?.name &&
        payload.payload.next_player === 'you'
      ) {
        setEnableChoice(true);
      } else if (
        payload.payload.user_name !== session?.user?.user_metadata?.name &&
        payload.payload.next_player === 'opp'
      ) {
        setEnableChoice(true);
      }
    });

    channelRef.current.on('broadcast', { event: 'sendSet' }, async (payload) => {
      if (joinGame) {
        setAllCards(payload.payload.set);
        setYourSet(
          shuffle(
            payload.payload.set.map((card) => ({
              name: card.cards.name,
              up: true,
              image_url: card.cards.image_url,
            }))
          )
        );
        setOppSet(
          shuffle(
            payload.payload.set.map((card) => ({
              name: card.cards.name,
              up: true,
              image_url: card.cards.image_url,
            }))
          )
        );
        const promises = payload.payload.set.map(({ cards }) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const preloadLink = cards.image_url;
            img.src = preloadLink;
            img.onload = () => resolve(preloadLink);
            img.onerror = () => reject(new Error(`Failed to load image: ${preloadLink}`));
          });
        });

        try {
          await Promise.all(promises);
          console.log('All images preloaded successfully');
        } catch (err) {
          console.error('Image preloading error:', err);
        }
        console.log("payload.payload.set",payload.payload.set);
        console.log(payload);
      }
    });

    // Handle game reset broadcast
    channelRef.current.on('broadcast', { event: 'resetGame' }, (payload) => {
      if (payload.payload.user_name !== session?.user?.user_metadata?.name) {
        // Reset local state for the other player
        setYourChoice(null);
        setOppChosen(null);
        setMessages([]);
        setYourChosen(null);
        setCurrentChosen(null);
        setYourSet(shuffle([...yourSet]));
        setOppSet(shuffle([...oppSet]));
        setEnableQuestion(false);
        setEnableAnswer(false);
        setEnableGuess(false);
        setEnableChoice(false);
        setCurrentGuess(null);
        setGuess(null);
        setWinner(null);
        setBothPlayersIn(false);
        hasInitialized.current = false;

        // Re-track presence
        channelRef.current.track({
          name: session?.user?.user_metadata?.name,
          ready: true,
        });
      }
    });

    channelRef.current.on('broadcast', { event: 'endGame' }, (payload) => {
      window.location.reload();
    });

    channelRef.current.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current.track({
          name: session?.user?.user_metadata?.name,
          ready: true, // Initial ready state
        });
      }
    });

    return () => {
      channelRef.current.unsubscribe();
    };
  }, [session]);

  const sendMessage = async (e) => {
    e.preventDefault();
    channelRef.current.send({
      type: 'broadcast',
      event: 'test-my-messages',
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.name,
        type: 'normal',
      },
    });
    setNewMessage('');
  };

  const sendQuestion = async (e) => {
    e.preventDefault();
    setEnableQuestion(false);
    channelRef.current.send({
      type: 'broadcast',
      event: 'test-my-messages',
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.name,
        type: 'question',
      },
    });
    setNewMessage('');
    channelRef.current.send({
      type: 'broadcast',
      event: 'setOppResponse',
      payload: {
        user_name: session?.user?.user_metadata?.name,
        choice: yourChoice,
      },
    });
  };

  const sendAnswer = async (e) => {
    e.preventDefault();
    setEnableAnswer(false);
    channelRef.current.send({
      type: 'broadcast',
      event: 'test-my-messages',
      payload: {
        message: newMessage,
        user_name: session?.user?.user_metadata?.name,
        type: 'answer',
      },
    });
    setNewMessage('');
    callNextTurn('you');
  };

  const sendGuess = async (e) => {
    e.preventDefault();
    setEnableGuess(false);
    setGuess(currentGuess);
    let result;
    if (currentGuess === oppChosen) {
      result = String(session.user.user_metadata.name) + ' WINS';
      const response = await supabase.from('game_ids').delete().eq('id', gameId);
      setWinner(session.user.user_metadata.name);
      setBothPlayersIn(false);
      celebrate();
      callWinner();
    } else {
      result = `${allCards.find(card => String(card.card_id) === String(currentGuess))?.cards?.name}`;
    }
    channelRef.current.send({
      type: 'broadcast',
      event: 'test-my-messages',
      payload: {
        message: result,
        user_name: session?.user?.user_metadata?.name,
        type: 'guess',
      },
    });
    callNextTurn('opp');
  };

  function flipCard(index) {
    const newCardSet = [...yourSet];
    newCardSet[index] = { ...newCardSet[index], up: !newCardSet[index].up };
    setYourSet(newCardSet);
    channelRef.current.send({
      type: 'broadcast',
      event: 'updateYourSet',
      payload: {
        user_name: session?.user?.user_metadata?.name,
        card_set: newCardSet,
      },
    });
  }

  function confirmChosen() {
    setYourChosen(currentChosen);
    console.log('You chose:', currentChosen);
    channelRef.current.send({
      type: 'broadcast',
      event: 'confirmYourChosen',
      payload: {
        user_name: session?.user?.user_metadata?.name,
        chosen: currentChosen,
      },
    });
    if (oppChosen !== null && yourChosen !== null) {
      console.log('You chose:', yourChosen);
      console.log('Opp chose:', oppChosen);
      console.log('LETS BEGIN');
    }
  }

  function askOrGuess(choice) {
    setEnableChoice(false);
    setYourChoice(choice);
    if (choice === 'ask') {
      setEnableQuestion(true);
    } else {
      setEnableGuess(true);
    }
  }

  function callNextTurn(nextPlayer) {
    channelRef.current.send({
      type: 'broadcast',
      event: 'callNextTurn',
      payload: {
        user_name: session?.user?.user_metadata?.name,
        next_player: nextPlayer,
      },
    });
  }

  function callWinner() {
    channelRef.current.send({
      type: 'broadcast',
      event: 'callWinner',
      payload: {
        user_name: session?.user?.user_metadata?.name,
      },
    });
  }

  async function loadSetOrSendSet() {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!joinGame) {
      setYourSet(
        shuffle(
          allCardsRef.current.map((card) => ({
            name: card.cards.name,
            up: true,
            image_url: card.cards.image_url,
          }))
        )
      );
      setOppSet(
        shuffle(
          allCardsRef.current.map((card) => ({
            name: card.cards.name,
            up: true,
            image_url: card.cards.image_url,
          }))
        )
      );
      channelRef.current.send({
        type: 'broadcast',
        event: 'sendSet',
        payload: {
          user_name: session?.user?.user_metadata?.name,
          set: allCardsRef.current,
        },
      });
    }
  }

  return (
    <div className="flex flex-col items-center">
    {allCards.length > 0 && !bothPlayersIn && winner === null && <p>Waiting for other player...</p>}
    {allCards.length > 0 && bothPlayersIn && (
      <div>
        <div className={`flex flex-col items-center gap-5 margin-top-s ${yourChosen === null ? 'block' : 'hidden'}`}>
          <div className="flex flex-row gap-5 mt-2">
            <select
              className="blue-background light-blue rounded-md"
              id="setOfCards"
              defaultValue=""
              onChange={(e) => setCurrentChosen(e.target.value)}
            >
              <option value="">Choose card</option>
              {allCards.map((card) => (
                <option key={card.card_id} value={card.card_id}>
                  {card.cards.name}
                </option>
              ))}
            </select>
            <button className="group" onClick={confirmChosen}>
              Confirm selection <span className="group-hover:hidden">◇</span>
              <span className="hidden group-hover:inline">◆</span>
            </button>
          </div>
          {currentChosen !== null && (
            <img
              src={allCards.find(card => String(card.card_id) === String(currentChosen))?.cards?.image_url}
              className="w-[300px] h-[300px] object-cover rounded-xl blue-border"
            />
          )}
        </div>
        
        <div className={oppChosen === null && yourChosen !== null ? 'block' : 'hidden'}>
          Waiting for other player to choose...
        </div>
        
        <div
          className={
            oppChosen !== null && yourChosen !== null && winner === null
              ? 'flex flex-col gap-5'
              : 'hidden'
          }
        >
          <div className={firstPlayer && secondPlayer ? 'flex justify-center' : 'hidden'}>
            <div className="title-font text-3xl yellow">
              {firstPlayer} vs {secondPlayer}
            </div>
          </div>
          
          <div className="grid grid-cols-[1fr_8fr_2fr_1fr] h-100vh gap-4">
            <div></div>
            {/* First row: Card display section */}
            <div className="flex flex-col gap-3 overflow-y-auto">
              <div className="flex flex-row flex-wrap justify-around gap-1.5">
                {yourSet.map((card, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <img
                      onClick={() => flipCard(index)}
                      key={card.name}
                      className={`w-[80px] h-[80px] object-cover rounded-xl blue-border ${
                        card.up
                          ? ''
                          : 'filter brightness-50 grayscale'
                      }`}
                      src={card.image_url}
                    />
                    <p
                      key={index}
                      className={`text-sm ${card.up ? 'blue' : 'text-gray-400'}`}
                    >
                      {card.name}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-row flex-wrap justify-around gap-1.5">
                {oppSet.map((card) => (
                  <img
                    key={card.name}
                    className={`rounded-xl w-[80px] h-[80px] object-cover ${card.up ? '' : 'filter brightness-50 grayscale'}`}
                    src='../card.png'
                  />
                ))}
              </div>
            </div>

            {/* Second row: Game log section */}
            <div className="blue-border light-blue blue-background rounded-2xl flex flex-col gap-2 items-center padding">
              <div></div>
              <p className="title-font">⬗ Game Log ⬖</p>
                <div className="flex flex-col overflow-y-auto blue w-full break-words p-2 light-blue-background rounded-2xl text-sm gap-1 h-[62vh] scrollbar-hide padding">
                  {messages.map((msg) => (
                    <div
                    key={crypto.randomUUID()}
                    className={`flex p-2  whitespace-pre-wrap
                      ${msg?.user_name === session?.user?.user_metadata?.name
                        ? 'justify-end'
                        : 'justify-start'}
                    `}
                  >
                    <div
                      className={`padding rounded-xl light-blue
                        ${
                          msg?.user_name === session?.user?.user_metadata?.name
                            ? 'rounded-br-none bg-blue-400' // Sender message bubble
                            : 'rounded-bl-none bg-blue-500' // Receiver message bubble
                        }
                        ${
                          msg?.type === 'question' || msg?.type === 'answer' || msg?.type === 'guess'
                            ? 'yellow'
                            : ''
                        }
                      `}
                    >
                      {msg?.type === 'question'
                        ? 'Q: '
                        : msg?.type === 'answer'
                        ? 'A: '
                        : msg?.type === 'guess'
                        ? 'Incorrect Guess: '
                        : ''}
                      {msg.message}
                    </div>
                  </div>
                  
                  ))}
                  <div ref={messageEndRef} />
                </div>

              <div className={enableChoice ? 'flex flex-row gap-3' : 'hidden'}>
                <button onClick={() => askOrGuess('ask')} className="group">
                  Ask <span className="group-hover:hidden">◇</span>
                  <span className="hidden group-hover:inline">◆</span>
                </button>
                <button onClick={() => askOrGuess('guess')} className="group">
                  Guess <span className="group-hover:hidden">◇</span>
                  <span className="hidden group-hover:inline">◆</span>
                </button>
              </div>
              
              <div className={enableGuess ? 'flex flex-col' : 'hidden'}>
                <select
                  className="light-blue-background blue rounded-md"
                  id="setOfCards"
                  defaultValue=""
                  onChange={(e) => setCurrentGuess(e.target.value)}
                >
                  <option value="">Guess one</option>
                  {allCards.map((card) => (
                    <option key={card.card_id} value={card.card_id}>
                      {card.cards.name}
                    </option>
                  ))}
                </select>
                <button onClick={sendGuess} className="group">
                  Confirm Guess <span className="group-hover:hidden">◇</span>
                  <span className="hidden group-hover:inline">◆</span>
                </button>
              </div>
              
              <input
                className="bg-white rounded-md text-sm w-full"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              
              <div className="flex flex-row gap-5">
                <button className="group" onClick={sendMessage}>
                  <span className="group-hover:hidden">▹</span>
                  <span className="hidden group-hover:inline">▸</span> send
                </button>
                <button
                  className={`group ${enableQuestion ? 'block' : 'hidden'}`}
                  onClick={sendQuestion}
                >
                  <span className="group-hover:hidden">▹</span>
                  <span className="hidden group-hover:inline">▸</span> question
                </button>
                <button
                  className={`group ${enableAnswer ? 'block' : 'hidden'}`}
                  onClick={sendAnswer}
                >
                  <span className="group-hover:hidden">▹</span>
                  <span className="hidden group-hover:inline">▸</span> answer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    
    <div className={winner !== null ? 'flex flex-col items-center gap-5 margin-top-s' : 'hidden'}>
      <div className="title-font yellow text-5xl">
        {winner === session.user.user_metadata.name ? "You Win!" : "You Lose"}
      </div>
      
      <div className="flex flex-row gap-5">
        <button className="group" onClick={endGame}>
          End Game <span className="group-hover:hidden">◇</span>
          <span className="hidden group-hover:inline">◆</span>
        </button>
        <button className="group" onClick={playAgain}>
          Play Again <span className="group-hover:hidden">◇</span>
          <span className="hidden group-hover:inline">◆</span>
        </button>
      </div>
      
      <div>
        <div className="flex flex-col items-center gap-5">
          <p>Your opponent chose:</p>
          <img
            src={allCards.find(card => String(card.card_id) === String(oppChosen))?.cards?.image_url}
            className="w-[300px] h-[300px] object-cover rounded-xl blue-border"
          />
          <p className="yellow title-font text-2xl">
            {allCards.find(card => String(card.card_id) === String(oppChosen))?.cards?.name}
          </p>
        </div>
      </div>
    </div>
  </div>
  );
}