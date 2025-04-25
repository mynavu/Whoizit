import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';
import { HomePage } from './HomePage';
import { Game } from './Game';


function App() {
  const [session, setSession] = useState(null);

  const [createGame, setCreateGame] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [joinGame, setJoinGame] = useState(false);
  const [winner, setWinner] = useState(null);
  const [cardSets, setCardSets] = useState([]);
  const [currentCardSet, setCurrentCardSet] = useState(null);
  const [cardSet, setCardSet] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [yourChosen, setYourChosen] = useState(null);
  const [oppChosen, setOppChosen] = useState(null);
  const [bothPlayersIn, setBothPlayersIn] = useState(false);

  const allCardsRef = useRef([]);
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

   // console.log(session)

  // SIGN IN
  const signIn = async () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  };

  // SIGN OUT
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  async function loadSet() {
    const { data, error } = await supabase
        .from('public_card_sets')
        .select('*')    
        setCardSets(data.map((set) => ({name: set.name, id: set.id})));
        //console.log(data);
  }

  useEffect(() => {
    loadSet();
  }, []);
  

  async function confirmSet() {
    setCardSet(currentCardSet);
    const { data, error } = await supabase
    .from('cards_in_sets')
    .select(`
      card_id,
      cards (
        id,
        name,
        image_url
      )
    `)
    .eq('card_set_id', currentCardSet); 
    setAllCards(data);
    allCardsRef.current = data;

    setTimeout(() => {
      console.log("After setting cards:", allCards);
    }, 1000); 
    setTimeout(() => {
      console.log("After setting cards:", allCards);
    }, 9000); 
  
    const promises = data.map(({ cards }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const preloadLink = cards.image_url;
        img.src = preloadLink;
        img.onload = () => resolve(preloadLink);
        img.onerror = () => reject(new Error(`Failed to load image: ${preloadLink}`));
      });
    });
    console.log("data",data);
    try {
      await Promise.all(promises);
      console.log('All images preloaded successfully');
    } catch (err) {
      console.error('Image preloading error:', err);
      setError(err.message);
    }

    if (error) {console.log(error.message)}
    console.log(currentCardSet)
    console.log(data);
  }

  if (!session) {
    return (
      <div>
        <div className="flex flex-col gap-5 items-center">
          <p>◇ ⬗ ◆ ⬖ ◇</p>
          <div className='title-font text-5xl tracking-wider yellow'>WHOIZIT?</div>
          <button className='group' onClick={signIn}><span className="group-hover:hidden">◇</span>
          <span className="hidden group-hover:inline">◆</span> Sign in with Google <span className="group-hover:hidden">◇</span>
          <span className="hidden group-hover:inline">◆</span></button>
        </div>
      </div>
    )
  } else {
    return (
      <div className='flex flex-col items-center gap-5'>
        <div className="flex flex-row justify-between items-start w-full px-20 mt-4">
          <button onClick={signOut}>Sign Out</button>
          <p>◇ ⬗ ◆ ⬖ ◇</p>
          <div>{session.user.user_metadata.name}</div>
        </div>
        
        <div className={`flex flex-col items-center ${oppChosen === null || yourChosen === null ? "block" : "hidden"}`}>
          <div className='title-font text-5xl tracking-wider'>WHOIZIT?</div>
          <p><span className="material-symbols-outlined">groups_3</span></p>
          <div className={gameId !== null && cardSet !== null && !bothPlayersIn ? 'flex flex-col items-center' : 'hidden' }>
            <div>Your code is:</div>
            <div className='title-font text-xl'>{gameId}</div>
          </div>
        </div>

        {gameId === null && (
          <HomePage 
            createGame={createGame} 
            setCreateGame={setCreateGame} 
            gameId={gameId} 
            setGameId={setGameId} 
            joinGame={joinGame} 
            setJoinGame={setJoinGame} 
          />
        )}

        {createGame && cardSet === null && (
          <div>
            <div className='flex flex-row gap-5 mt-2'>
                    <select className='blue-background light-blue rounded-md' id="setOfSetss" defaultValue="" onChange={(e) => setCurrentCardSet(e.target.value)}>
                      <option value="">Choose set</option>
                      {cardSets.map((set) => (
                        <option key={set.id} value={set.id}>{set.name}</option>
                      ))}
                    </select>
                    <button className='rounded-md p-0.5 group' onClick={confirmSet}>Confirm selection <span className="group-hover:hidden">◇</span>
                    <span className="hidden group-hover:inline">◆</span></button>
            </div> 
          </div>
        )}

        {gameId !== null && (
          <Game 
            session={session} 
            setSession={setSession} 
            gameId={gameId} 
            setGameId={setGameId} 
            setWinner={setWinner} 
            joinGame={joinGame} 
            allCards={allCards}
            setAllCards={setAllCards}
            allCardsRef={allCardsRef}
            winner={winner}
            yourChosen={yourChosen}
            setYourChosen={setYourChosen}
            oppChosen={oppChosen}
            setOppChosen={setOppChosen}
            bothPlayersIn={bothPlayersIn}
            setBothPlayersIn={setBothPlayersIn}
          />
        )}
        
        
        <button 
            className={`group ${ allCards.length === 0 && ((joinGame && cardSet === null) || (!joinGame && gameId !== null)) ? 'block' : 'hidden'}`}
            onClick={() => {
                window.location.reload();
            }}
            >
            <span className="group-hover:hidden">▹</span>
            <span className="hidden group-hover:inline">▸</span> Back
          </button>
        
        
      </div>
    )

  }
}

export default App
