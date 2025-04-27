import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';

export function MySets({ userEmail, viewSets, setViewSets, privateSets, setPrivateSets, editSet, setEditSet }) {

    const [editSetId, setEditSetId] = useState(null);
    const [editDeletes, setEditDeletes] = useState([]);
    const [editAdds, setEditAdds] = useState([]);

    const [currentName, setCurrrentName] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const formRef = useRef();

    const defaultCards = [
        'https://media-hosting.imagekit.io/e880a3a7b3b346a1/1.png?Expires=1840253275&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Sa12uM5xRfbqabBWSyRVXKS-zYVnoaYDgjAcEMdBbd0oUJcq5pw0kBypc-kP680flMFJ18je6aF8x4dIZ~CEPav9iUEY0qQGyM2un8s4MrSJZLAwV0rAyD9Rw7jvyQRSgA3cXRjmBf~Ay~Pugh87ldy4nApKKHoQDUviImI3lkE4hOJYdrHRoDQ8j8GYkZdP51ONhZmZXpcIPM9nG8snrCcA8j6gnbA2nHO5NSB6IsAzAeh-ZM9MxJcVrWORoyrn1G-eVq6irLmqHXZI~KEq0AhQYFDVOZ6rNBTSCbFKVObXJq4oc-fVZ4klB88Wi1Agixdb7BittAE~KmSjJZfe~g__',
        'https://media-hosting.imagekit.io/c9fb4076878e450e/2.png?Expires=1840253476&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=qowqYySb7IS5ldZPJEviQZAHGO7tQErPW-ivMo6TYTao~~SGBrYjO4-bmmfETU-CMGHJgCfIAIiwIQnq-SDtQSQb3OXtgIoeYtKgLqhDLAOSs2KHoXreXEoaQMhAmBSWkpT3u6HR6KVuyiitm34T36kJ3k49VwRowvr~jdDUIlVcp-vqHvfzPx6fnIqnqlo99hfgWpBYBbGjtrylNI3nRCeo0IJKCpQQ3ZxnjoJv4iUbTCefQ6UrVoQKq5EPocq2H9CgJMsoega2tcnKD1A07Hy9p-j3FgZH7eArctF~c3aZQEnD1PjEtG3oCvGZeKOtss7976ZtenU~oWtMmsSExA__',
        'https://media-hosting.imagekit.io/52a359c5f0254d63/3.png?Expires=1840253502&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=iSlGoU4ig3lpv-1HNswdaF3Pwva6KaBuAYK-gYIStmYKR~Dni6cmn4iLI2IinRIO5SwLlbasFdAanOUBy7l4yLM3TGl9djWwXEoAM74AFhzLBGnuPSV74-h3cqBQyMrCW8RwSekD0Hj-sgdgakxVRNi5oNg4UMRNowgQyZjIoEZrHz0ZIN~DeVeifxkAo72PCUikIut1ZmXhdMJyQQRlg9eVjeywf1bg-1SJiwQvRnaCG9ilkyRaL28U6kDSL5KBU4fK1mNL4HlU1SnVfJHEg3DgjFlsp3xnBv9T2to1W~WTUP7Q3f3oTE7swLgStC6i2yyIqxGAPh437cL549GaAA__'
     ]

    const updateMySets = async () => {
        const { data, error } = await supabase
          .from('public_card_sets')
          .select('*')
          .eq('user_email', userEmail.current)
          console.log('update data');
          setPrivateSets(data)
    }

    const deleteSet = async (set_id) => {
        console.log('attempting to delete');
        const { data: cardsInSet, error: cardsInSetError } = await supabase
        .from('cards_in_sets')
        .select('card_id')
        .eq('card_set_id', set_id);

        if (cardsInSetError) {
            console.error('Error fetching cards_in_sets:', cardsInSetError);
            return;
        }

        const cardIdsToDelete = cardsInSet.map((c) => c.card_id);

        if (cardIdsToDelete.length > 0) {
            // Step 2: Delete all cards that match these card_ids
            const { error: deleteCardsError } = await supabase
            .from('cards')
            .delete()
            .in('id', cardIdsToDelete);

            if (deleteCardsError) {
            console.error('Error deleting cards:', deleteCardsError);
            return;
            }
        }
        // Step 3: Delete the set itself (this will also cascade delete cards_in_sets)
        const { error: deleteSetError } = await supabase
            .from('public_card_sets')
            .delete()
            .eq('id', set_id);

        if (deleteSetError) {
            console.error('Error deleting set:', deleteSetError);
            return;
        }
        await updateMySets();
        console.log('Set and related cards deleted successfully!');
    }

    /*
    i have three table that i need to delete rows from but they are all related to each other. first is the 'public_card_sets' where there is an id that you need to match with the input of 'set_id'. i also have the 'cards_in_sets' table that has the foreign key 'card_set_id' connected to the id of the 'public_card_sets'. if i delete a row from the 'public_card_sets' it will also cascade and delete all rows with the same foreign key which is what i want but the 'cards_in_sets' also have a foregin key with a table called 'cards' where the 'card_id' column from cards_in_sets is connected to the id of the 'cards'. i also want to delete all the rows in 'cards' with the same id as the deleted 'card_id' rows.

    */

    const handleEditSet = async (set_id) => {

        setEditSetId(set_id);

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
        .eq('card_set_id', set_id); 
        setEditSet(data);

        console.log(data);
    }

    function addToSet() {    
        if (currentUrl.trim() !== '') {
            setEditAdds((prevCards) => [...prevCards, {name: currentName, image_url: currentUrl, card_id: crypto.randomUUID()}]);
        } else {
            let randomIndex = (Math.round(Math.random() * 100) % 3)
            setEditAdds((prevCards) => [...prevCards, {name: currentName, image_url: defaultCards[randomIndex], card_id: crypto.randomUUID()}]);
        }
        formRef.current.reset();
        setCurrrentName("");
        setCurrentUrl("");
    }

    function deleteCard(id) {
        setEditAdds((prevCards) => prevCards.filter(card => card.card_id !== id));
    }

    function handleEditDeletes(id) {
        setEditDeletes((prevCards) => [...prevCards, id]);
        setEditSet((prevCards) => prevCards.filter(card => card.card_id !== id));
    }


    function clearCurrentEdit() {
        setEditSet([]);
        setEditAdds([]);
        setEditDeletes([]);
        setEditSetId(null);
    }

    async function saveChanges() {
        if (editDeletes.length > 0) {
            const { error: deleteCardsError } = await supabase
            .from('cards')
            .delete()
            .in('id', editDeletes);

            if (deleteCardsError) {
            console.error('Error deleting cards:', deleteCardsError);
            return;
            }
        }

        const cardInsertData = editAdds.map(({ name, image_url }) => ({ name, image_url }));
          const { data: insertedCards, error: cardsError } = await supabase
            .from('cards')
            .insert(cardInsertData)
            .select('id');
      
          if (cardsError) throw cardsError;
                
          const cardInSetData = insertedCards.map((card, index) => ({
            card_set_id: editSetId,
            card_id: card.id,
          }));

          const { error: linkError } = await supabase
            .from('cards_in_sets')
            .insert(cardInSetData);
      
          if (linkError) throw linkError;
          clearCurrentEdit()
    }

    
    return (
        <div className='margin-top flex flex-col items-center gap-5'>
            {privateSets.length === 0 && (
                <p>You have no custom sets.</p>
            )}
            {editSet.length === 0 && privateSets.length > 0 && (
                <div>
                    {privateSets.map((set, index) => (
                        <div className="flex justify-between items-center gap-10 w-full" key={index}>
                            <div>{set.name}</div>
                            <div className="flex gap-1">
                            <div className="group">
                                <span onClick={() => deleteSet(set.id)} className="material-symbols-outlined cursor-pointer group-hover:text-[#fdff00]">delete</span>
                            </div>
                            <div className="group">
                                <span onClick={() => handleEditSet(set.id)} className="material-symbols-outlined cursor-pointer group-hover:text-[#fdff00]">edit</span>
                            </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {editSet.length > 0 && (
                <div className='flex flex-col items-center gap-5'>
                    <p>Add New Card</p>
                    <form className='flex flex-col justify-center gap-3 blue-border rounded-2xl padding-l'
                    ref={formRef}
                    onSubmit={(e) => {
                        e.preventDefault();
                        addToSet();
                    }}
                    >
                        <div>
                            <label htmlFor="cardName">Name:</label>
                            <input
                            className="bg-white rounded-md text-sm w-full"
                            required
                            id="cardName"
                            onChange={(e) => setCurrrentName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="cardImage">URL:</label>
                            <input
                            type="url"
                            placeholder="(optional)"
                            className="bg-white rounded-md text-sm w-full"
                            id="cardImage"
                            onChange={(e) => setCurrentUrl(e.target.value.trim())}
                            />
                        </div>
                        <button type="submit" className="group ">
                            Add to current set <span className="group-hover:hidden">⬦</span>
                            <span className="hidden group-hover:inline">⬥</span>
                        </button>
                    </form>
                    <div>
                    </div>
                {editAdds.length > 0 && (
                    <div className='flex flex-col items-center margin-top-s'>
                        <p>Added Cards</p>
                        <div className="flex flex-row flex-wrap justify-around gap-5 w-130 margin-top-s">
                            {editAdds.map((card, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <img
                                key={card.name}
                                className={`w-[80px] h-[80px] object-cover rounded-xl blue-border`}
                                src={card.image_url !== '' ? card.image_url : defaultCards[(index % 3) + 1]}
                                />
                                <p
                                key={index}
                                className={`text-sm group`}
                                >
                                {card.name} <span className="hidden group-hover:inline pink cursor-pointer" onClick={() => deleteCard(card.card_id)}>✘</span>
                                </p>
                            </div>
                            ))}
                        </div>
                    </div>
                    
                )}
                <div className='flex flex-col items-center margin-top-s'>
                    <p>Cards in Current Set</p>
                </div>
                <div className="flex flex-row flex-wrap justify-around gap-5 w-130">
                    {editSet.map((card, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img
                            key={card.card_id}
                            className={`w-[80px] h-[80px] object-cover rounded-xl blue-border`}
                            src={card.cards.image_url}
                            />
                            <p
                            key={index}
                            className={`text-sm group`}
                            >
                            {card.cards.name} <span className="hidden group-hover:inline pink cursor-pointer" onClick={() => handleEditDeletes(card.card_id)}>✘</span>
                            </p>
                        </div>
                    ))}
                    </div>
                    <div className='flew flex-col items-center margin-top'>
                        <div className='flex flex-row gap-10 justify-center'>
                            <button className='group' onClick={clearCurrentEdit}>
                                <span className="group-hover:hidden">▹</span>
                                <span className="hidden group-hover:inline">▸</span> Back
                            </button>
                            <button onClick={saveChanges}>
                                Save 
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}