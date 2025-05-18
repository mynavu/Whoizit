import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';

export function MySets({ userEmail, viewSets, setViewSets, privateSets, setPrivateSets, editSet, setEditSet }) {

    const [editSetId, setEditSetId] = useState(null);
    const [editDeletes, setEditDeletes] = useState([]);
    const [editAdds, setEditAdds] = useState([]);

    const [currentName, setCurrrentName] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const formRef = useRef();
    const [upload, setUpload] = useState(false);
    const fileInputRef = useRef();

    const defaultCards = [
        'https://zhurpemyccmmtrmzzfmc.supabase.co/storage/v1/object/public/default-pics//1.png',
        'https://zhurpemyccmmtrmzzfmc.supabase.co/storage/v1/object/public/default-pics//2.png',
        'https://zhurpemyccmmtrmzzfmc.supabase.co/storage/v1/object/public/default-pics//3.png'
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
        setUpload(false);
    }

    async function uploadFile(file_input) {
        setUpload(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentUrl(reader.result);
        };
        reader.readAsDataURL(file_input);
    }

    function clearUploadInput() {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                            className="bg-white rounded-md text-sm w-full text-black"
                            required
                            id="cardName"
                            onChange={(e) => setCurrrentName(e.target.value)}
                            />
                        </div>
                        <div className='flex flex-col gap-3'>
                            <label htmlFor="cardImage">URL:</label>
                            <input
                            type="url"
                            placeholder="(optional)"
                            className="bg-white rounded-md text-sm w-full text-black"
                            id="cardImage"
                            value={!upload ? currentUrl : ''}
                            onChange={(e) => {
                                setCurrentUrl(e.target.value.trim());
                                setUpload(false);
                                clearUploadInput();
                            }}
                            />
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer padding-s rounded-md light-blue blue-shade text-sm font-semibold">
                                    Choose File
                                    <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => uploadFile(e.target.files[0])}
                                    />
                                </label>
                                <span className="text-sm">
                                    {fileInputRef.current?.files[0]?.name || 'No file chosen'}
                                </span>
                            </div>
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
                            <button className='group yellow' onClick={saveChanges}>
                                Save <span className="group-hover:hidden">✧</span><span className="hidden group-hover:inline">✦</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}