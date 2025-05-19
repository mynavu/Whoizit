import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';
import { HomePage } from './HomePage';
import { Game } from './Game';
import { CustomSet } from './CustomSet';
import { MySets } from './MySets';

function App() {
  // Auth state
  const [session, setSession] = useState(null);
  const userEmail = useRef();

  //Game state
  const [gameState, setGameState] = useState({
    createGame: false,
    gameId: null,
    joinGame: false,
    winner: null,
    yourChosen: null,
    oppChosen: null,
    bothPlayersIn: false
  })

  /*
  const [createGame, setCreateGame] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [joinGame, setJoinGame] = useState(false);
  const [winner, setWinner] = useState(null);
  const [yourChosen, setYourChosen] = useState(null);
  const [oppChosen, setOppChosen] = useState(null);
  const [bothPlayersIn, setBothPlayersIn] = useState(false);
  */

    /*
  const [cardSets, setCardSets] = useState([]);
  const [currentCardSet, setCurrentCardSet] = useState(null);
  const [cardSet, setCardSet] = useState(null);
  const [allCards, setAllCards] = useState([]);
  const [createSet, setCreateSet] = useState(false);
  const [viewSets, setViewSets] = useState(false);
  const [editSet, setEditSet] = useState([]);
  const [changeSet, setChangeSet] = useState(false);
  const [privateSets, setPrivateSets] = useState([]);
  */

  const [cardSetState, setCardSetState] = useState({
    cardSets: [],
    currentCardSet: null,
    cardSet: null,
    allCards: [],
    createSet: false,
    viewSets: false,
    editSet: [],
    changeSet: false,
    privateSets: []
  })

  const allCardsRef = useRef([]);

  const updateGameState = (updates) => {
    setGameState(prev => ({...prev, ...updates}))
  };

  const updateCardSetState = (updates) => {
    setCardSetState(prev => ({...prev, ...updates}))
  };
  
  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session && userEmail.current) {
        loadSet();
      }
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      userEmail.current = session?.user?.user_metadata?.email;
    })
    return () => subscription.unsubscribe()
  }, [])

  // Sign In
  const signIn = async () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  async function loadSet() {
    if (!userEmail.current) {
      console.error('userEmail.current is not set');
      return;
    }
  
    const { data, error } = await supabase
      .from('public_card_sets')
      .select('*')
      .or(`public.eq.true,user_email.eq."${userEmail.current}"`);
  
    if (error) {
      console.error('Error loading sets:', error);
      return;
    }
    //setCardSets(data.map((set) => ({name: set.name, id: set.id})));
    updateCardSetState({cardSets: data.map((set) => ({name: set.name, id: set.id}))})
  }

  async function confirmSet() {
    updateCardSetState({cardSet: cardSetState.currentCardSet})
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
    .eq('card_set_id', cardSetState.currentCardSet); 
    //setAllCards(data);
    updateCardSetState({allCards: data})
    allCardsRef.current = data;
    console.log("allCardsRef.current", allCardsRef.current)
  
    const promises = data.map(({ cards }) => {
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

    if (error) {console.log(error.message)}
    console.log(cardSetState.currentCardSet)
    console.log(data);
  }



  if (!session) {
    return (
      <div>
        <div className="flex flex-col gap-5 items-center">
          <p>◇ ⬗ ◆ ⬖ ◇</p>
          <div className='title-font text-5xl tracking-wider margin-top gap-5'>WHOIZIT?</div>
          <p><span className="material-symbols-outlined icon-big">groups_3</span></p>
          <button className='group' onClick={signIn}><span className="group-hover:hidden">⬦</span>
          <span className="hidden group-hover:inline">⬥</span> Sign in with Google <span className="group-hover:hidden">⬦</span>
          <span className="hidden group-hover:inline">⬥</span></button>
        </div>
      </div>
    )
  } 

    const showTitle = (gameState.oppChosen === null || gameState.yourChosen === null) && !cardSetState.createSet && !cardSetState.viewSets;
    const showChooseWisely = gameState.yourChosen === null && cardSetState.allCards.length > 0 && gameState.bothPlayersIn;
    const showGameId = gameState.gameId !== null && cardSetState.cardSet !== null && !gameState.bothPlayersIn;
    const showBackButton = (cardSetState.editSet.length === 0 && cardSetState.viewSets) || cardSetState.createSet || cardSetState.allCards.length === 0 && ((gameState.gameId === null && gameState.joinGame && cardSetState.cardSet === null) || (!gameState.joinGame && gameState.gameId !== null));
    const showLoading = cardSetState.allCards.length === 0 && (gameState.gameId !== null && gameState.joinGame && cardSetState.cardSet === null);
    const showChangeSetOption = gameState.winner && gameState.createGame && !cardSetState.changeSet;

    return (
      <div className='flex flex-col items-center gap-5'>
        <div className="flex flex-row justify-between items-start w-full px-20 mt-4">
          <button onClick={signOut}>Sign Out</button>
          <p>◇ ⬗ ◆ ⬖ ◇</p>
          <div>{session.user.user_metadata.name}</div>
        </div>
        
        <div className={`flex flex-col items-center gap-5 ${showTitle ? "block" : "hidden"}`}>
          <div className='title-font text-5xl tracking-wider margin-top'>{showChooseWisely ? 'CHOOSE WISELY' : 'WHOIZIT?'}</div>
          <p><span className="material-symbols-outlined icon-big">{showChooseWisely ? 'playing_cards' : 'groups_3'}</span></p>
          <div className={showGameId ? 'flex flex-col items-center' : 'hidden' }>
            <div>Your code is:</div>
            <div className='title-font text-xl pink'>{gameState.gameId}</div>
          </div>
        </div>

        {!cardSetState.viewSets && !cardSetState.createSet && gameState.gameId === null && (
          <HomePage 
            gameState={gameState}
            updateGameState={updateGameState}
            cardSetState={cardSetState}
            updateCardSetState={updateCardSetState}
            userEmail={userEmail}
          />
        )}

        {gameState.createGame && cardSetState.cardSet === null && (
          <div>
            <div className='flex flex-row gap-5 group'>
                    <select className='blue-background light-blue rounded-md' id="setOfSetss" defaultValue="" onChange={(e) => updateCardSetState({currentCardSet: e.target.value})}>
                      <option value="">Choose set</option>
                      {cardSetState.cardSets.map((set) => (
                        <option key={set.id} value={set.id}>{set.name}</option>
                      ))}
                    </select>
                    <button className='rounded-md p-0.5' onClick={confirmSet}>Confirm selection <span className="group-hover:hidden">⬦</span>
                    <span className="hidden group-hover:inline">⬥</span></button>
            </div> 
          </div>
        )}

        {cardSetState.createSet && (
          <CustomSet 
          session={session}
          />
        )}

        {cardSetState.viewSets && (
          <MySets 
          cardSetState={cardSetState}
          updateCardSetState={updateCardSetState}
          userEmail={userEmail}
          />
        )}

        {gameState.gameId !== null && (
          <Game  
            gameState={gameState}
            updateGameState={updateGameState}
            cardSetState={cardSetState}
            updateCardSetState={updateCardSetState}
            allCardsRef={allCardsRef}
            session={session} 
          />
        )}
        
        <button 
            className={`group ${showBackButton ? 'block' : 'hidden'}`}
            onClick={() => {
                window.location.reload();
            }}
            >
            <span className="group-hover:hidden">▹</span>
            <span className="hidden group-hover:inline">▸</span> Back
        </button>
        <p className={`group ${showLoading ? 'block' : 'hidden'}`}>Loading...</p>
        <div></div>
        <div></div>
        {showChangeSetOption &&
        <div className='flex flex-col gap-5 items-center'>
          <div>Play with a new set?</div>
          <div className='flex flex-row gap-5 group'>
            <select className='blue-background light-blue rounded-md' id="setOfSetss" defaultValue={cardSetState.currentCardSet} onChange={(e) => updateCardSetState({currentCardSet: e.target.value})}>
              {cardSetState.cardSets.map((set) => (
                <option key={set.id} value={set.id}>{set.name}</option>
              ))}
            </select>
            <button className='rounded-md p-0.5' onClick={() => {
              confirmSet();
              updateCardSetState({changeSet: true})
            }}>Change set <span className="group-hover:hidden">⬦</span>
            <span className="hidden group-hover:inline">⬥</span></button>
          </div>
        </div>
        }
      </div>
    )
}

export default App
