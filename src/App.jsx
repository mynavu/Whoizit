import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';
import { HomePage } from './HomePage';
import { Game } from './Game';
import { CustomSet } from './CustomSet';
import { MySets } from './MySets';

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
  const [createSet, setCreateSet] = useState(false);
  const [viewSets, setViewSets] = useState(false);
  const [editSet, setEditSet] = useState([]);

  const allCardsRef = useRef([]);
  const userEmail = useRef();

  const [privateSets, setPrivateSets] = useState([]);

    
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      userEmail.current = session?.user?.user_metadata?.email;
    })
    return () => subscription.unsubscribe()
  }, [])

  //console.log(session, session?.user?.user_metadata?.email)

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
    setCardSets(data.map((set) => ({name: set.name, id: set.id})));
  }

  useEffect(() => {
    if (session && userEmail.current) {   // wait until session is ready
      loadSet();
    }
  }, [session]);

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
          <div className='title-font text-5xl tracking-wider margin-top gap-5'>WHOIZIT?</div>
          <p><span className="material-symbols-outlined icon-big">groups_3</span></p>
          <button className='group' onClick={signIn}><span className="group-hover:hidden">⬦</span>
          <span className="hidden group-hover:inline">⬥</span> Sign in with Google <span className="group-hover:hidden">⬦</span>
          <span className="hidden group-hover:inline">⬥</span></button>
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
        
        <div className={`flex flex-col items-center gap-5 ${(oppChosen === null || yourChosen === null) && !createSet && !viewSets ? "block" : "hidden"}`}>
          <div className='title-font text-5xl tracking-wider margin-top'>{yourChosen === null && allCards.length > 0 && bothPlayersIn ? 'CHOOSE WISELY' : 'WHOIZIT?'}</div>
          <p><span className="material-symbols-outlined icon-big">{yourChosen === null && allCards.length > 0 && bothPlayersIn ? 'playing_cards' : 'groups_3'}</span></p>
          <div className={gameId !== null && cardSet !== null && !bothPlayersIn ? 'flex flex-col items-center' : 'hidden' }>
            <div>Your code is:</div>
            <div className='title-font text-xl pink'>{gameId}</div>
          </div>
        </div>

        {!viewSets && !createSet && gameId === null && (
          <HomePage 
            createGame={createGame} 
            setCreateGame={setCreateGame} 
            gameId={gameId} 
            setGameId={setGameId} 
            joinGame={joinGame} 
            setJoinGame={setJoinGame} 
            createSet={createSet} 
            setCreateSet={setCreateSet}
            privateSets={privateSets}
            setPrivateSets={setPrivateSets}
            userEmail={userEmail}
            viewSets={viewSets}
            setViewSets={setViewSets}
          />
        )}

        {createGame && cardSet === null && (
          <div>
            <div className='flex flex-row gap-5 group'>
                    <select className='blue-background light-blue rounded-md' id="setOfSetss" defaultValue="" onChange={(e) => setCurrentCardSet(e.target.value)}>
                      <option value="">Choose set</option>
                      {cardSets.map((set) => (
                        <option key={set.id} value={set.id}>{set.name}</option>
                      ))}
                    </select>
                    <button className='rounded-md p-0.5' onClick={confirmSet}>Confirm selection <span className="group-hover:hidden">⬦</span>
                    <span className="hidden group-hover:inline">⬥</span></button>
            </div> 
          </div>
        )}

        {createSet && (
          <CustomSet 
          createSet={createSet} 
          setCreateSet={setCreateSet}
          session={session}
          />
        )}

        {viewSets && (
          <MySets 
          userEmail={userEmail}
          viewSets={viewSets}
          setViewSets={setViewSets}
          privateSets={privateSets}
          setPrivateSets={setPrivateSets}
          editSet={editSet} 
          setEditSet={setEditSet}
          />
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
            className={`group ${ (editSet.length === 0 && viewSets) || createSet || allCards.length === 0 && ((gameId === null && joinGame && cardSet === null) || (!joinGame && gameId !== null)) ? 'block' : 'hidden'}`}
            onClick={() => {
                window.location.reload();
            }}
            >
            <span className="group-hover:hidden">▹</span>
            <span className="hidden group-hover:inline">▸</span> Back
        </button>
        <p className={`group ${ allCards.length === 0 && (gameId !== null && joinGame && cardSet === null) ? 'block' : 'hidden'}`}>Loading...</p>
        <div></div>
        <div></div>
      </div>
    )
  }
}

export default App
