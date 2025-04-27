import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';

export function HomePage({ createGame, setCreateGame, gameId, setGameId, joinGame, setJoinGame, createSet, setCreateSet, privateSets, setPrivateSets, userEmail, viewSets, setViewSets }) {

    const [currentGameId, setCurrentGameId] = useState(null);
    const [validId, setValidId] = useState(null);

    async function updateCreateGame() {
        setJoinGame(false);
        setCreateGame(true);
        let game_id = Math.random().toString(36).slice(7);
        setGameId(game_id);
        const { error } = await supabase
        .from('game_ids')
        .insert({ id: game_id });
    }

    async function updateJoinGame(inputId) {
        const { data, error } = await supabase
        .from('game_ids')
        .select()
        .eq('id', inputId)
        .single();

        if (data === null) {
            setValidId(false);
            console.log("invalid")
        } else { 
            setValidId(true);
            setGameId(data.id);
            console.log("valid with", data.id);
            const response = await supabase
            .from('game_ids')
            .delete()
            .eq('id', inputId)
            //console.log(response)
            //console.log('deleted:', inputId);
        };
    };

    const loadMySets = async () => {
        setViewSets(true);

        const { data, error } = await supabase
          .from('public_card_sets')
          .select('*')
          .eq('user_email', userEmail.current)
          console.log(data)
          setPrivateSets(data)
        }

    return (
        <div>
            {!joinGame && (
                <div className='flex flex-col items-center gap-5'>
                    <div className='flex flex-row gap-10 mt-2'>
                        <button className='rounded-md p-1 group' onClick={updateCreateGame}>Create Game <span className="group-hover:hidden">⬦</span>
                        <span className="hidden group-hover:inline">⬥</span></button>
                        <button className='rounded-md p-1 group' onClick={() => setJoinGame(true)}>Join Game <span className="group-hover:hidden">⬦</span>
                        <span className="hidden group-hover:inline">⬥</span></button>
                    </div>
                    <div className='flex flex-row gap-10 margin-top-s'>
                        <button className='group pink' onClick={() => setCreateSet(true)}>Create Set <span className="group-hover:hidden">✧</span>
                        <span className="hidden group-hover:inline">✦</span></button>
                        <button className='group pink' onClick={loadMySets}>My Sets <span className="group-hover:hidden">⬨</span>
                        <span className="hidden group-hover:inline">⬧ </span></button>
                    </div>
                </div>
            )}
            {joinGame && (
                <div>
                    <div className='flex flex-row gap-2 mt-2'>
                        <input className={`bg-white rounded-md text-black pl-1.5 w-45 ${joinGame ? 'block' : 'hidden'}`} onChange={(e) => setCurrentGameId(e.target.value)}/>
                        <button className={`group`} onClick={() => updateJoinGame(currentGameId)}>Enter <span className="group-hover:hidden">⬦</span>
                        <span className="hidden group-hover:inline">⬥</span></button>
                        </div>
                        <p className={` mt-2 ${validId === false ? 'block' : 'hidden'}`}>That code is invalid.</p>
                </div>
            )}
            
        </div>
    )

}